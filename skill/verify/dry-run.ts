/**
 * A mechanical dry run of the taught method (skill/SKILL.md) against a small
 * fixture province, for the expedition-skill change's verifications.
 *
 * It follows the skill's sections in order — lift-off, the one approval, the
 * perimeter, the five passes in the fixed order with the assert → sound →
 * write-with-verdict loop, honesty, interruption, later-expedition repair,
 * Sailing Directions — and writes the Chart through the real store from
 * core/. The harness is a stub that records everything the Governor would
 * see; the sweep, symbols, manifests, sounding, and log operations are
 * deterministic stand-ins for the MCP tools the mcp-delivery change will
 * serve.
 *
 * Usage: runExpedition(targetRoot, { stamp, abortAfter? }) — see checks.ts.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  readChart,
  refreshStaleness,
  writeChart,
  type Anchor,
  type ChartEntry,
  type IndexedEntry,
  type Notice,
} from "../../core/src/index";

const SKILL_PATH = join(import.meta.dir, "..", "SKILL.md");

/** The five pass headings, in the fixed order the skill teaches. */
const PASS_HEADINGS = [
  "### Pass 1 — Vessels",
  "### Pass 2 — Fairways",
  "### Pass 3 — Ports of entry and beacons",
  "### Pass 4 — Lights",
  "### Pass 5 — Dangers",
];

const PASS_NAMES = ["vessels", "fairways", "portsAndBeacons", "lights", "dangers"] as const;
type PassName = (typeof PASS_NAMES)[number];

export interface JournalEvent {
  type: "approval" | "install" | "receipt" | "pass" | "sounding" | "refutation" | "write" | "brief" | "staleness";
  [key: string]: unknown;
}

export interface Receipt {
  id: string;
  command: string;
  scope: string;
  outcome: string;
}

export interface DryRunResult {
  /** Everything the harness showed the Governor, in order. */
  governorMessages: string[];
  approvalsAsked: number;
  receipts: Receipt[];
  journal: JournalEvent[];
  /** Notices from the expedition's final chart write. */
  notices: Notice[];
  /** The Sailing Directions (null when the expedition was interrupted). */
  brief: string | null;
}

// ---------------------------------------------------------------------------
// The harness stub: what a harness would show the Governor, plus the ship's log.
// ---------------------------------------------------------------------------

class Harness {
  governorMessages: string[] = [];
  approvalsAsked = 0;
  receipts: Receipt[] = [];
  journal: JournalEvent[] = [];

  say(message: string): void {
    this.governorMessages.push(message);
  }

  askApproval(message: string): void {
    this.approvalsAsked += 1;
    this.journal.push({ type: "approval", count: this.approvalsAsked });
    this.say(message);
  }

  appendReceipt(command: string, scope: string, outcome: string): string {
    const id = `r${this.receipts.length + 1}`;
    this.receipts.push({ id, command, scope, outcome });
    this.journal.push({ type: "receipt", id, command, scope, outcome });
    return id;
  }
}

// ---------------------------------------------------------------------------
// The skill text: the dry run refuses to run without it.
// ---------------------------------------------------------------------------

function loadSkill(): { text: string; approval: string } {
  const text = readFileSync(SKILL_PATH, "utf8");
  const positions = PASS_HEADINGS.map((heading) => text.indexOf(heading));
  if (positions.some((p) => p < 0)) {
    throw new Error("SKILL.md is missing one of the five pass headings");
  }
  for (let i = 1; i < positions.length; i++) {
    if (positions[i] <= positions[i - 1]) {
      throw new Error("SKILL.md does not teach the five passes in the fixed order");
    }
  }
  const marker = "Ask it in these words:";
  const markerAt = text.indexOf(marker);
  if (markerAt < 0) throw new Error("SKILL.md does not pin the approval message");
  const quoteLines: string[] = [];
  for (const raw of text.slice(markerAt + marker.length).split("\n")) {
    if (raw.startsWith(">")) quoteLines.push(raw.replace(/^>\s?/, "").trim());
    else if (quoteLines.length > 0) break;
  }
  const approval = quoteLines.join(" ").replace(/\s+/g, " ").trim();
  if (!approval.toLowerCase().includes("network") || !approval.toLowerCase().includes("install")) {
    throw new Error("the pinned approval message does not cover network and installation");
  }
  return { text, approval };
}

// ---------------------------------------------------------------------------
// Deterministic probe stand-ins (sweep / symbols / manifests).
// ---------------------------------------------------------------------------

function walk(root: string, rel = "", out: string[] = []): string[] {
  const entries = readdirSync(join(root, rel), { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0
  );
  for (const de of entries) {
    if (de.name === ".portolan" || de.name === "node_modules" || de.name === ".git") continue;
    const r = rel ? `${rel}/${de.name}` : de.name;
    if (de.isDirectory()) walk(root, r, out);
    else out.push(r);
  }
  return out;
}

function sweep(root: string, needle: string, dir = ""): Array<{ path: string; line: number; text: string }> {
  const hits: Array<{ path: string; line: number; text: string }> = [];
  for (const rel of walk(root).filter((p) => p.startsWith(dir))) {
    const lines = readFileSync(join(root, rel), "utf8").split("\n");
    lines.forEach((text, i) => {
      if (text.includes(needle)) hits.push({ path: rel, line: i + 1, text: text.trim() });
    });
  }
  return hits;
}

function findLine(root: string, rel: string, needle: string): number {
  const lines = readFileSync(join(root, rel), "utf8").split("\n");
  const at = lines.findIndex((text) => text.includes(needle));
  if (at < 0) throw new Error(`${needle} not found in ${rel}`);
  return at + 1;
}

function readJson(root: string, rel: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(root, rel), "utf8")) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Sounding stand-ins (sound.anchor / sound.edge), per the soundings contract.
// ---------------------------------------------------------------------------

function soundAnchor(
  root: string,
  anchor: Anchor,
  receipts: Receipt[]
): { verdict: "confirmed" | "refuted"; found?: string } {
  if (anchor.type === "file") {
    const path = join(root, anchor.path);
    if (!existsSync(path)) return { verdict: "refuted", found: `no such file: ${anchor.path}` };
    const lines = readFileSync(path, "utf8").split("\n");
    if (anchor.line !== undefined && (anchor.line < 1 || anchor.line > lines.length)) {
      return { verdict: "refuted", found: `${anchor.path} has ${lines.length} lines` };
    }
    return { verdict: "confirmed" };
  }
  if (anchor.type === "manifest") {
    try {
      const json = readJson(root, anchor.path);
      const value = anchor.key.split(".").reduce<unknown>((acc, key) => {
        return acc !== null && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined;
      }, json);
      return value === undefined
        ? { verdict: "refuted", found: `no key ${anchor.key} in ${anchor.path}` }
        : { verdict: "confirmed" };
    } catch {
      return { verdict: "refuted", found: `${anchor.path} is not readable` };
    }
  }
  return receipts.some((r) => r.id === anchor.id)
    ? { verdict: "confirmed" }
    : { verdict: "refuted", found: `no receipt ${anchor.id}` };
}

function soundEdge(
  root: string,
  fromDir: string,
  toPackage: string
): { verdict: "confirmed" | "unconfirmed"; evidence: Anchor[] } {
  const evidence: Anchor[] = [];
  const manifestRel = `${fromDir}/package.json`;
  if (existsSync(join(root, manifestRel))) {
    const json = readJson(root, manifestRel);
    const deps = json.dependencies as Record<string, string> | undefined;
    if (deps && deps[toPackage] !== undefined) {
      evidence.push({ type: "manifest", path: manifestRel, key: `dependencies.${toPackage}` });
    }
  }
  for (const hit of sweep(root, toPackage, fromDir)) {
    evidence.push({ type: "file", path: hit.path, line: hit.line });
  }
  return evidence.length > 0
    ? { verdict: "confirmed", evidence }
    : { verdict: "unconfirmed", evidence: [] };
}

// ---------------------------------------------------------------------------
// Anchor rendering for the brief.
// ---------------------------------------------------------------------------

function anchorText(anchor: Anchor): string {
  switch (anchor.type) {
    case "file":
      return anchor.line === undefined ? anchor.path : `${anchor.path}:${anchor.line}`;
    case "manifest":
      return `${anchor.path}#${anchor.key}`;
    case "receipt":
      return `receipt ${anchor.id}`;
  }
}

// ---------------------------------------------------------------------------
// The expedition.
// ---------------------------------------------------------------------------

interface VesselDesc {
  id: string;
  dir: string;
  pkg: string;
  manifestRel: string;
}

function descriptors(root: string): VesselDesc[] {
  return walk(root)
    .filter((rel) => rel.endsWith("/package.json"))
    .map((manifestRel) => {
      const dir = manifestRel.slice(0, manifestRel.length - "/package.json".length);
      const json = readJson(root, manifestRel);
      return {
        id: dir.split("/").pop() ?? dir,
        dir,
        pkg: String(json.name),
        manifestRel,
      };
    })
    .sort((a, b) => (a.id < b.id ? -1 : 1));
}

export function runExpedition(
  targetRoot: string,
  opts: { stamp: string; abortAfter?: "fairways" }
): DryRunResult {
  const skill = loadSkill();
  const harness = new Harness();
  const provinceName = String(readJson(targetRoot, "package.json").name);

  // -- skill §1, lift-off: acknowledge, then ask the one approval (§2). -----
  harness.say(
    `Expedition started on ${provinceName}. One approval follows; then I survey and return Sailing Directions.`
  );
  harness.askApproval(skill.approval);

  // -- skill §1 step 3-4: install the toolset yourself; §2: receipt it. -----
  harness.appendReceipt(
    "install: portolan mcp server + expedition skill (harness adapter)",
    "harness",
    "installed"
  );
  harness.journal.push({ type: "install", tools: 11 });

  const descs = descriptors(targetRoot);
  const byId = new Map(descs.map((d) => [d.id, d]));

  // -- skill §8: a later expedition begins from the existing Chart. ---------
  const repairing = existsSync(join(targetRoot, ".portolan", "chart", "index.jsonl"));
  let scope = descs;
  let passthrough: ChartEntry[] = [];
  if (repairing) {
    const staleness = refreshStaleness(targetRoot);
    harness.journal.push({ type: "staleness", changedVessels: staleness.changedVessels });
    const changed = new Set(staleness.changedVessels);
    scope = descs.filter((d) => changed.has(d.id));
    passthrough = readChart(targetRoot)
      .filter((entry) => {
        if (entry.kind === "fairway") return !changed.has(entry.from) && !changed.has(entry.to);
        if (entry.kind === "vessel") return !changed.has(entry.id);
        return !changed.has(entry.vessel);
      })
      // Strip store metadata: the store validates and re-stamps it on write.
      .map((entry) => {
        const { stale: _stale, signature: _signature, ...rest } = entry;
        return rest as ChartEntry;
      });
  }

  // Fresh expeditions chart as they go (skill §4); a repair gathers and
  // writes once so only the stale entries are touched (skill §8).
  let entries: ChartEntry[] = [];
  const writeAsYouGo = !repairing;

  const commit = (pass: PassName | "close-out" | "repair") => {
    if (!writeAsYouGo) return;
    writeChart(targetRoot, entries);
    harness.journal.push({ type: "write", pass, entries: entries.length });
  };

  // -- skill §4, pass 1: vessels from manifests and entry points. -----------
  const vesselEntries: ChartEntry[] = scope.map((d) => {
    const anchors: Anchor[] = [{ type: "manifest", path: d.manifestRel, key: "name" }];
    const json = readJson(targetRoot, d.manifestRel);
    if (json.bin !== undefined) anchors.push({ type: "manifest", path: d.manifestRel, key: "bin" });
    if (json.main !== undefined) anchors.push({ type: "manifest", path: d.manifestRel, key: "main" });
    return {
      kind: "vessel" as const,
      id: d.id,
      name: d.dir,
      paths: [d.dir],
      anchors,
      trust: "charted" as const,
    };
  });
  harness.journal.push({ type: "pass", name: "vessels" });

  // Builds and tests need no second approval (skill §2); receipt them.
  const libDesc = scope.find((d) => d.id === "lib");
  if (libDesc) {
    const proc = Bun.spawnSync(["bun", "check.ts"], {
      cwd: join(targetRoot, libDesc.dir),
      stdout: "pipe",
      stderr: "pipe",
    });
    const outcome = proc.exitCode === 0 ? "pass" : "fail";
    const receiptId = harness.appendReceipt("bun check.ts", libDesc.dir, outcome);
    const libVessel = vesselEntries.find((e) => e.kind === "vessel" && e.id === "lib");
    if (libVessel && libVessel.kind === "vessel") {
      libVessel.behavior = `exports parse(); the target's own check script executes it (receipt ${receiptId}: ${outcome})`;
      libVessel.anchors.push({ type: "receipt", id: receiptId });
      libVessel.trust = "measured";
    }
  }
  entries = [...vesselEntries];
  commit("vessels");

  // -- skill §4, pass 2 + §5: fairways, asserted then sounded. --------------
  harness.journal.push({ type: "pass", name: "fairways" });
  const fairwayEntries: ChartEntry[] = [];
  for (const from of scope) {
    const deps = (readJson(targetRoot, from.manifestRel).dependencies ?? {}) as Record<string, string>;
    for (const toPkg of Object.keys(deps)) {
      const to = descs.find((d) => d.pkg === toPkg && d.id !== from.id);
      if (!to) continue;
      const sounding = soundEdge(targetRoot, from.dir, to.pkg);
      harness.journal.push({
        type: "sounding",
        tool: "sound.edge",
        subject: `${from.id}->${to.id}`,
        verdict: sounding.verdict,
      });
      fairwayEntries.push({
        kind: "fairway",
        id: `${from.id}-${to.id}`,
        from: from.id,
        to: to.id,
        anchors: sounding.evidence,
        trust: sounding.verdict === "confirmed" ? "measured" : "doubtful",
      });
    }
  }
  // The README claims a cli→api fairway: sound it, then downgrade (§5).
  const claimLine = findLine(targetRoot, "README.md", "calls the API");
  const cliToApi = soundEdge(targetRoot, byId.get("cli")!.dir, byId.get("api")!.pkg);
  harness.journal.push({
    type: "sounding",
    tool: "sound.edge",
    subject: "cli->api",
    verdict: cliToApi.verdict,
  });
  if (scope.some((d) => d.id === "cli") || scope.some((d) => d.id === "api")) {
    fairwayEntries.push({
      kind: "fairway",
      id: "cli-api",
      from: "cli",
      to: "api",
      anchors: [{ type: "file", path: "README.md", line: claimLine }],
      trust: "doubtful",
      note: "claimed in docs; neither manifest nor source references confirm",
    });
  }
  entries = [...entries, ...fairwayEntries];
  commit("fairways");

  // -- skill §7: an interrupted expedition leaves a valid partial Chart. ----
  if (opts.abortAfter === "fairways") {
    const closed = entries.map((entry) =>
      entry.kind === "vessel"
        ? {
            ...entry,
            note:
              "ports of entry, beacons, lights, dangers: unsurveyed (Expedition stopped after the fairways pass)",
          }
        : entry
    );
    writeChart(targetRoot, closed);
    harness.journal.push({ type: "write", pass: "close-out", entries: closed.length });
    harness.say(
      "Expedition stopped after the fairways pass. Vessels and fairways stand on the Chart; ports of entry, beacons, lights, and dangers remain unsurveyed."
    );
    return finish(targetRoot, harness, { notices: [], brief: null });
  }

  // -- skill §4, pass 3: ports of entry and beacons. ------------------------
  harness.journal.push({ type: "pass", name: "portsAndBeacons" });
  const surfaceEntries: ChartEntry[] = [];
  for (const d of scope) {
    if (d.id === "cli") {
      const binLine = findLine(targetRoot, `${d.dir}/bin/cli.ts`, "#!/usr/bin/env bun");
      surfaceEntries.push({
        kind: "portOfEntry",
        id: "cli-bin",
        vessel: "cli",
        protocol: "cli",
        anchors: [{ type: "file", path: `${d.dir}/bin/cli.ts`, line: binLine }],
        trust: "measured",
      });
      const envLine = findLine(targetRoot, `${d.dir}/bin/cli.ts`, "process.env[");
      surfaceEntries.push({
        kind: "beacon",
        id: "cli-env-dynamic",
        vessel: "cli",
        surface: "env",
        key: "unknown — built at run time",
        anchors: [{ type: "file", path: `${d.dir}/bin/cli.ts`, line: envLine }],
        trust: "unsurveyed",
        note: "key constructed dynamically; not determinable statically",
      });
    }
    if (d.id === "api") {
      const serveLine = findLine(targetRoot, `${d.dir}/server.ts`, "Bun.serve({");
      const portLine = findLine(targetRoot, `${d.dir}/server.ts`, "process.env.PORT");
      surfaceEntries.push(
        {
          kind: "portOfEntry",
          id: "api-http",
          vessel: "api",
          protocol: "http",
          anchors: [{ type: "file", path: `${d.dir}/server.ts`, line: serveLine }],
          trust: "measured",
        },
        {
          kind: "beacon",
          id: "api-port-env",
          vessel: "api",
          surface: "env",
          key: "PORT",
          anchors: [{ type: "file", path: `${d.dir}/server.ts`, line: portLine }],
          trust: "measured",
        },
        {
          kind: "beacon",
          id: "api-port-8080",
          vessel: "api",
          surface: "port",
          key: "8080",
          anchors: [{ type: "file", path: `${d.dir}/server.ts`, line: portLine }],
          trust: "measured",
        }
      );
    }
  }
  entries = [...entries, ...surfaceEntries];
  commit("portsAndBeacons");

  // -- skill §4, pass 4 + §5: lights; a refuted doc claim is corrected. -----
  harness.journal.push({ type: "pass", name: "lights" });
  const lightEntries: ChartEntry[] = [];
  for (const d of scope) {
    if (d.id === "lib") {
      // The README claims an export the source does not have: sound the
      // claimed anchor, record the refutation, correct to the truth.
      const claimed: Anchor = { type: "file", path: "packages/lib/src/validate.ts", line: 1 };
      const sounded = soundAnchor(targetRoot, claimed, harness.receipts);
      harness.journal.push({
        type: "sounding",
        tool: "sound.anchor",
        subject: "packages/lib/src/validate.ts:1 (claimed export validate())",
        verdict: sounded.verdict,
      });
      if (sounded.verdict === "refuted") {
        const exportLine = findLine(targetRoot, `${d.dir}/src/parse.ts`, "export function parse");
        harness.journal.push({
          type: "refutation",
          assertion: "light: lib exports validate() from src/validate.ts (README claim)",
          action: `corrected to export function parse() at packages/lib/src/parse.ts:${exportLine}`,
        });
        lightEntries.push({
          kind: "light",
          id: "lib-parse",
          vessel: "lib",
          name: "export function parse()",
          anchors: [{ type: "file", path: `${d.dir}/src/parse.ts`, line: exportLine }],
          trust: "measured",
        });
      }
    }
    if (d.id === "api") {
      const healthLine = findLine(targetRoot, `${d.dir}/server.ts`, '"/health"');
      lightEntries.push({
        kind: "light",
        id: "api-health",
        vessel: "api",
        name: "GET /health",
        anchors: [{ type: "file", path: `${d.dir}/server.ts`, line: healthLine }],
        trust: "measured",
      });
    }
    if (d.id === "cli") {
      const flagLine = findLine(targetRoot, `${d.dir}/bin/cli.ts`, "--json");
      lightEntries.push({
        kind: "light",
        id: "cli-json",
        vessel: "cli",
        name: "flag --json",
        anchors: [{ type: "file", path: `${d.dir}/bin/cli.ts`, line: flagLine }],
        trust: "measured",
      });
    }
  }
  entries = [...entries, ...lightEntries];
  commit("lights");

  // -- skill §4, pass 5: dangers, anchored to the exact lines. -------------
  harness.journal.push({ type: "pass", name: "dangers" });
  const dangerEntries: ChartEntry[] = [];
  for (const d of scope) {
    if (d.id === "lib") {
      const readmeClaim = findLine(targetRoot, "README.md", "exports validate()");
      const exportLine = findLine(targetRoot, `${d.dir}/src/parse.ts`, "export function parse");
      dangerEntries.push({
        kind: "danger",
        id: "docs-drift",
        vessel: "lib",
        category: "shallow",
        note: "README claims lib exports validate() from src/validate.ts; source exports parse() from src/parse.ts",
        anchors: [
          { type: "file", path: "README.md", line: readmeClaim },
          { type: "file", path: `${d.dir}/src/parse.ts`, line: exportLine },
        ],
        trust: "measured",
      });
    }
    if (d.id === "api") {
      const catchLine = findLine(targetRoot, `${d.dir}/server.ts`, "} catch {");
      dangerEntries.push({
        kind: "danger",
        id: "api-swallow",
        vessel: "api",
        category: "rock",
        note: "request handler catches errors and answers ok without an error signal",
        anchors: [{ type: "file", path: `${d.dir}/server.ts`, line: catchLine }],
        trust: "measured",
      });
    }
  }
  entries = [...entries, ...dangerEntries];
  commit("dangers");

  // -- skill §8: the repair merges into the standing Chart, one write. ------
  let notices: Notice[] = [];
  if (repairing) {
    const merged = [...passthrough, ...entries];
    const result = writeChart(targetRoot, merged);
    harness.journal.push({ type: "write", pass: "repair", entries: merged.length });
    notices = result.notices;
    entries = merged;
  }

  // -- skill §9: deliver Sailing Directions, in conversation and archived. --
  const finalEntries = readChart(targetRoot);
  const brief = composeBrief(provinceName, finalEntries, notices, opts.stamp, !repairing);
  writeFileSync(join(targetRoot, ".portolan", "sailing-directions.md"), brief);
  harness.say(brief);
  harness.journal.push({ type: "brief", archived: ".portolan/sailing-directions.md" });

  return finish(targetRoot, harness, { notices, brief });
}

function composeBrief(
  provinceName: string,
  entries: IndexedEntry[],
  notices: Notice[],
  stamp: string,
  first: boolean
): string {
  const vessels = entries.filter((e) => e.kind === "vessel");
  const fairways = entries.filter((e) => e.kind === "fairway");
  const measuredFairways = fairways.filter((e) => e.trust === "measured");
  const doubtfulFairways = fairways.filter((e) => e.trust === "doubtful");
  const dangers = entries.filter((e) => e.kind === "danger").sort((a, b) => (a.id < b.id ? -1 : 1));

  const lines: string[] = [];
  lines.push(`# Sailing Directions — ${provinceName}`, "");
  lines.push(
    `Expedition ${stamp} · Cartographer: portolan dry-run · Chart: <target>/.portolan/chart/`,
    ""
  );

  lines.push("## The waters", "");
  lines.push(
    `${provinceName} is a ${vessels.length}-vessel province (${vessels
      .map((v) => (v as { name: string }).name)
      .join(", ")}). ` +
      `${measuredFairways.length} measured fairways connect them; ` +
      `${doubtfulFairways.length} claimed fairway is doubtful.`,
    ""
  );

  lines.push("## Top findings", "");
  const findings: Array<{ text: string; entry: IndexedEntry }> = [];
  for (const danger of dangers) {
    findings.push({
      text:
        danger.category === "shallow"
          ? "Docs name an export the source does not have"
          : "Request handler swallows errors",
      entry: danger,
    });
  }
  for (const fairway of doubtfulFairways) {
    findings.push({ text: "A claimed fairway has no deterministic support", entry: fairway });
  }
  if (measuredFairways.length > 0) {
    findings.push({ text: "Declared fairways converge on packages/lib", entry: measuredFairways[0] });
  }
  for (const finding of findings) {
    const anchors = finding.entry.anchors.map(anchorText).join("; ");
    lines.push(
      `- **${finding.text}** — trust: ${finding.entry.trust} — anchor: ${anchors} — chart: ${finding.entry.kind}/${finding.entry.id}`
    );
  }
  lines.push("");

  lines.push("## The Chart", "");
  lines.push(
    `The Chart lives at \`<target>/.portolan/chart/\` — ${vessels.length} sheets (one per vessel) ` +
      "plus the machine index `index.jsonl`. Read the trust labels before trusting anything: " +
      "`measured` taken from source, `charted` from manifests, `reported` a claim from docs, " +
      "`doubtful` unvalidated, `unsurveyed` not determined.",
    ""
  );

  lines.push("## Unsurveyed waters", "");
  const unobserved = vessels.filter((v) => v.behavior === undefined).map((v) => (v as { name: string }).name);
  lines.push("- runtime topology — where each vessel actually runs is not determinable statically");
  lines.push("- deployed versions — what is actually deployed is not determinable statically");
  lines.push(
    `- run-time behavior of ${unobserved.join(" and ")} — no observation; receipts cover the rest`
  );
  lines.push(
    "- the apps/cli configuration key — built at run time — chart: beacon/cli-env-dynamic",
    ""
  );

  lines.push("## Notices to Mariners", "");
  if (first) {
    lines.push("- First Expedition: the Chart is new; every entry is an addition (chart/notices.txt).");
  } else {
    const corrected = notices.filter((n) => n.action === "corrected").sort((a, b) => (a.id < b.id ? -1 : 1));
    for (const notice of corrected) {
      lines.push(`- corrected: ${notice.kind}/${notice.id} — repaired (was pending correction)`);
    }
    if (corrected.length === 0) lines.push("- Nothing changed since the last expedition.");
  }
  lines.push("");
  return lines.join("\n");
}

function finish(
  targetRoot: string,
  harness: Harness,
  extra: { notices: Notice[]; brief: string | null }
): DryRunResult {
  const dir = join(targetRoot, ".portolan");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "ship-log.jsonl"),
    harness.receipts.map((r) => JSON.stringify(r)).join("\n") + "\n"
  );
  writeFileSync(
    join(dir, "expedition-journal.jsonl"),
    harness.journal.map((e) => JSON.stringify(e)).join("\n") + "\n"
  );
  writeFileSync(
    join(dir, "dry-run-transcript.md"),
    harness.governorMessages.join("\n\n---\n\n") + "\n"
  );
  return {
    governorMessages: harness.governorMessages,
    approvalsAsked: harness.approvalsAsked,
    receipts: harness.receipts,
    journal: harness.journal,
    notices: extra.notices,
    brief: extra.brief,
  };
}
