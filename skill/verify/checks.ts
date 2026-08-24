/**
 * Verifications for the expedition-skill change (archived at
 * openspec/changes/archive/2026-08-23-expedition-skill/tasks.md), plus the
 * harbor-master change's skill task (openspec/changes/harbor-master). Each
 * check is labeled with the task it proves.
 *
 * Run from the repo root:   bun run skill/verify/checks.ts
 * Regenerate the checked-in example brief:   bun run skill/verify/checks.ts --write-example
 *
 * Exit code 0 = every check passed.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { readChart } from "../../core/src/index";
import { createFixture } from "./fixture";
import { runExpedition, type DryRunResult } from "./dry-run";

const REPO = join(import.meta.dir, "..", "..");
const SKILL_PATH = join(REPO, "skill", "SKILL.md");
const TEMPLATE_PATH = join(REPO, "skill", "sailing-directions.template.md");
const EXAMPLE_PATH = join(REPO, "skill", "examples", "sailing-directions-example.md");
const STAMP = "2026-08-23";

let failures = 0;

function check(task: string, name: string, fn: () => string | void): void {
  try {
    const note = fn();
    console.log(`[task ${task}] ${name}: PASS${note ? ` (${note})` : ""}`);
  } catch (err) {
    failures += 1;
    console.log(`[task ${task}] ${name}: FAIL — ${(err as Error).message}`);
  }
}

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

// ---------------------------------------------------------------------------
// Local walkers + snapshots.
// ---------------------------------------------------------------------------

function walk(root: string, rel = "", out: string[] = []): string[] {
  for (const de of readdirSync(join(root, rel), { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0
  )) {
    if (de.name === "node_modules" || de.name === ".git") continue;
    const r = rel ? `${rel}/${de.name}` : de.name;
    if (de.isDirectory()) walk(root, r, out);
    else out.push(r);
  }
  return out;
}

function sourceSnapshot(root: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const rel of walk(root).filter((p) => !p.startsWith(".portolan/"))) {
    map.set(rel, createHash("sha256").update(readFileSync(join(root, rel))).digest("hex"));
  }
  return map;
}

function scenario(name: string): string {
  const dir = mkdtempSync(join(tmpdir(), `portolan-${name}-`));
  createFixture(dir);
  return dir;
}

function runFull(root: string): DryRunResult {
  return runExpedition(root, { stamp: STAMP });
}

// ---------------------------------------------------------------------------
// 1.1 — the method document, reviewed against docs/MANIFEST.md.
// ---------------------------------------------------------------------------

const BANNED_TERMS: Array<{ re: RegExp; why: string }> = [
  { re: /\bcaptain\b/i, why: "locked term is Governor" },
  { re: /\badmiral\b/i, why: "locked term is Governor" },
  { re: /\bcomponent\b/i, why: "locked term is vessel" },
  { re: /\bmodule\b/i, why: "locked term is vessel" },
  { re: /\bmicroservice\b/i, why: "locked term is vessel" },
  { re: /\bsubsystem\b/i, why: "locked term is vessel" },
  { re: /\bservice\b/i, why: "locked term is vessel" },
  { re: /\bendpoint\b/i, why: "locked terms are port of entry / light" },
  { re: /\busers?\b/i, why: "locked term is Governor" },
  { re: /\bcopy\b/i, why: "the Governor is handed no command text" },
  { re: /\bpaste\b/i, why: "the Governor is handed no command text" },
];

function skillMarkdown(): Array<{ rel: string; text: string }> {
  const dir = join(REPO, "skill");
  return walk(dir)
    .filter((rel) => rel.endsWith(".md") && !rel.startsWith("verify/"))
    .map((rel) => ({ rel, text: readFileSync(join(dir, rel), "utf8") }));
}

check("1.1", "no synonym terms in skill markdown (docs/MANIFEST.md review)", () => {
  const offenses: string[] = [];
  for (const { rel, text } of skillMarkdown()) {
    for (const { re, why } of BANNED_TERMS) {
      const match = text.match(re);
      if (match) offenses.push(`${rel}: "${match[0]}" (${why})`);
    }
  }
  assert(offenses.length === 0, offenses.join("; "));
  return `${skillMarkdown().length} files reviewed`;
});

check("1.1", "locked glossary and trust vocabulary present in SKILL.md", () => {
  const text = readFileSync(SKILL_PATH, "utf8");
  for (const term of [
    "Governor", "Cartographer", "Expedition", "Chart", "vessel", "fairway",
    "port of entry", "beacon", "light", "danger", "unsurveyed",
    "pending correction", "Notices to Mariners", "Sailing Directions",
    "measured", "charted", "reported", "doubtful",
  ]) {
    assert(text.includes(term), `SKILL.md never uses the locked term "${term}"`);
  }
  for (const tool of [
    "chart.read", "chart.write", "sweep", "symbols", "manifests",
    "sound.edge", "sound.anchor", "log.append", "log.read",
    "expeditions.propose", "expeditions.decide",
  ]) {
    assert(text.includes(tool), `SKILL.md never teaches the tool ${tool}`);
  }
});

// ---------------------------------------------------------------------------
// harbor-master task 5.1 — the harbor watch: queue surfacing at session
// start (openspec/changes/harbor-master/specs/harbor: "The queue surfaces
// in chat at session start").
// ---------------------------------------------------------------------------

check("harbor 5.1", "SKILL.md teaches the harbor watch at session start", () => {
  const text = readFileSync(SKILL_PATH, "utf8");
  const watchAt = text.indexOf("## 0. The harbor watch");
  const liftOffAt = text.indexOf("## 1. Lift-off");
  assert(watchAt >= 0, "the harbor-watch section is missing");
  assert(liftOffAt > watchAt, "the harbor watch must be taught before lift-off");
  for (const phrase of [
    "expeditions.propose",
    "expeditions.decide",
    "computed, never imagined",
    "one chat message",
    "one-phrase decision",
    "say nothing about proposals",
    "refusal holds while the evidence is unchanged",
  ]) {
    assert(text.includes(phrase), `the harbor teaching omits "${phrase}"`);
  }
  assert(/Eleven tools:/.test(text), "the tool desk does not count eleven tools");
  // The desk's call shapes teach the expedition tools' exact argument names.
  assert(text.includes('"tool": "expeditions.propose", "input": {}'), "no call shape for expeditions.propose");
  assert(text.includes('"fingerprint"'), "no call shape citing a fingerprint");
  assert(text.includes('"decision"'), "no call shape citing a decision");
});

check("1.1", "no command text addressed to the Governor", () => {
  for (const { rel, text } of skillMarkdown()) {
    assert(!/```(sh|bash|shell|console|zsh)/.test(text), `${rel}: shell fence`);
    for (const fence of text.matchAll(/```[a-z]*\n([^`]*)```/g)) {
      assert(!/^\s*\$ /m.test(fence[1]), `${rel}: shell prompt inside a fence`);
    }
    assert(
      !/Governor[^\n]{0,50}\b(run|execute|type)\b/i.test(text) &&
        !/\b(run|execute|type)\b[^\n]{0,50}Governor/i.test(text),
      `${rel}: a sentence hands a command to the Governor`
    );
  }
});

// ---------------------------------------------------------------------------
// 1.2 / 5.2 — template and example shape.
// ---------------------------------------------------------------------------

const FINDING_RE =
  /^- \*\*[^*]+\*\* — trust: (measured|charted|reported|doubtful|unsurveyed) — anchor: .+ — chart: \w+\/[\w-]+$/;

function sectionLines(text: string, heading: string): string[] {
  const at = text.indexOf(heading);
  assert(at >= 0, `missing section "${heading}"`);
  const rest = text.slice(at + heading.length);
  const next = rest.indexOf("\n## ");
  return rest.slice(0, next < 0 ? undefined : next).split("\n").filter((l) => l.startsWith("-"));
}

function briefChecks(label: string, brief: string): number {
  for (const heading of ["# Sailing Directions", "## The waters", "## Top findings", "## The Chart", "## Unsurveyed waters", "## Notices to Mariners"]) {
    assert(brief.includes(heading), `${label}: missing "${heading}"`);
  }
  const findings = sectionLines(brief, "## Top findings");
  assert(findings.length >= 3, `${label}: fewer than 3 findings`);
  for (const line of findings) {
    assert(FINDING_RE.test(line), `${label}: finding lacks anchor/trust/chart location: ${line}`);
  }
  const unsurveyed = sectionLines(brief, "## Unsurveyed waters");
  assert(unsurveyed.some((l) => l.includes("runtime topology")), `${label}: unsurveyed list omits runtime topology`);
  assert(unsurveyed.some((l) => l.includes("deployed versions")), `${label}: unsurveyed list omits deployed versions`);
  return findings.length;
}

check("1.2", "Sailing Directions template carries every required section + rules", () => {
  const text = readFileSync(TEMPLATE_PATH, "utf8").replace(/\\</g, "<").replace(/\\>/g, ">");
  for (const heading of [
    "# Sailing Directions", "## The waters", "## Top findings", "## The Chart",
    "## Unsurveyed waters", "## Notices to Mariners",
  ]) {
    assert(text.includes(heading), `template missing "${heading}"`);
  }
  const form = sectionLines(text, "## Top findings")[0];
  assert(
    !!form && form.includes("trust:") && form.includes("anchor:") && form.includes("chart:"),
    "template finding form lacks anchor/trust/chart location"
  );
  assert(text.includes("never presented as an established fact"), "template omits the unanchored-claim rule");
  const unsurveyed = sectionLines(text, "## Unsurveyed waters");
  assert(
    unsurveyed.some((l) => l.includes("runtime topology")) && unsurveyed.some((l) => l.includes("deployed versions")),
    "template unsurveyed placeholders missing"
  );
});

// ---------------------------------------------------------------------------
// Scenario S1 — full dry run on a fixture target.
// ---------------------------------------------------------------------------

const S1 = scenario("full");
const S1_BEFORE = sourceSnapshot(S1);
const R1 = runFull(S1);
const S1_CHART = readChart(S1);

check("2.1", "dry run: install completes with zero Governor-copied commands", () => {
  assert(R1.receipts.some((r) => r.scope === "harness" && r.outcome === "installed"), "no install receipt");
  for (const message of R1.governorMessages) {
    assert(!/```/.test(message), "fenced text shown to the Governor");
    assert(
      !/(^|\n)\s*(\$ |npm |npx |yarn |pnpm |pip |go |cargo |git |curl |wget )/i.test(message),
      `command text shown to the Governor: ${message.slice(0, 60)}...`
    );
  }
  const approvalAt = R1.journal.findIndex((e) => e.type === "approval");
  const installAt = R1.journal.findIndex((e) => e.type === "receipt");
  assert(approvalAt >= 0 && installAt > approvalAt, "install preceded the approval");
});

check("2.2", "dry run: exactly one approval; builds/tests receipted, unasked", () => {
  assert(R1.approvalsAsked === 1, `approvals asked: ${R1.approvalsAsked}`);
  const approval = R1.governorMessages[1];
  assert(/network/i.test(approval) && /install/i.test(approval), "approval does not cover network + installation");
  const build = R1.receipts.find((r) => r.command.startsWith("bun"));
  assert(build && build.outcome === "pass" && build.scope === "packages/lib", "no receipt for the executed target check");
  assert(R1.approvalsAsked === 1, "a second approval was asked after builds ran");
});

check("2.3", "dry run: source byte-identical; writes only under .portolan/", () => {
  const after = sourceSnapshot(S1);
  const before = S1_BEFORE;
  assert(before.size === after.size, `source file count changed: ${before.size} -> ${after.size}`);
  for (const [rel, hash] of before) {
    assert(after.get(rel) === hash, `source file changed: ${rel}`);
  }
  const added = walk(S1).filter((rel) => !before.has(rel));
  assert(added.length > 0, "no chart was written");
  for (const rel of added) {
    assert(rel.startsWith(".portolan/"), `file written outside the perimeter: ${rel}`);
  }
  return `${added.length} files, all under .portolan/`;
});

check("3.1", "dry run: passes run vessels → fairways → ports/beacons → lights → dangers", () => {
  const passes = R1.journal.filter((e) => e.type === "pass").map((e) => e.name);
  assert(
    JSON.stringify(passes) === JSON.stringify(["vessels", "fairways", "portsAndBeacons", "lights", "dangers"]),
    `pass order: ${passes.join(" -> ")}`
  );
  const writes = R1.journal.filter((e) => e.type === "write").map((e) => e.pass);
  assert(
    JSON.stringify(writes) === JSON.stringify(["vessels", "fairways", "portsAndBeacons", "lights", "dangers"]),
    `chart writes per pass: ${writes.join(", ")}`
  );
  const count = (kind: string) => S1_CHART.filter((e) => e.kind === kind).length;
  assert(count("vessel") === 3 && count("fairway") === 3 && count("portOfEntry") === 2, "vessels/fairways/ports missing");
  assert(count("beacon") === 3 && count("light") === 3 && count("danger") === 2, "beacons/lights/dangers missing");
  for (const entry of S1_CHART) {
    assert(entry.anchors.length >= 1, `entry ${entry.kind}/${entry.id} has no anchor`);
    assert(["measured", "charted", "reported", "doubtful", "unsurveyed"].includes(entry.trust), `bad trust on ${entry.id}`);
  }
});

check("3.3", "dry run: runtime topology and deployed versions stay unsurveyed", () => {
  for (const entry of S1_CHART) {
    const text = JSON.stringify(entry).toLowerCase();
    if (/(runtime topology|deployed version)/.test(text)) {
      assert(entry.trust === "unsurveyed", `${entry.kind}/${entry.id} claims a runtime fact under ${entry.trust}`);
    }
  }
  const beacon = S1_CHART.find((e) => e.kind === "beacon" && e.id === "cli-env-dynamic");
  assert(beacon?.trust === "unsurveyed", "the dynamic beacon is not unsurveyed");
  const lib = S1_CHART.find((e) => e.kind === "vessel" && e.id === "lib");
  assert(lib?.trust === "measured" && /receipt/.test(JSON.stringify(lib.anchors)), "lib behavior is not receipt-anchored");
  const api = S1_CHART.find((e) => e.kind === "vessel" && e.id === "api");
  assert(api?.behavior === undefined, "api behavior was guessed");
});

check("4.1", "dry run: planted drift corrected or downgraded in the same run", () => {
  const soundingAt = R1.journal.findIndex(
    (e) => e.type === "sounding" && e.subject === "cli->api" && e.verdict === "unconfirmed"
  );
  const fairwayWriteAt = R1.journal.findIndex((e) => e.type === "write" && e.pass === "fairways");
  assert(soundingAt >= 0 && soundingAt < fairwayWriteAt, "the claimed fairway was not sounded before its write");
  const claimed = S1_CHART.find((e) => e.kind === "fairway" && e.id === "cli-api");
  assert(claimed?.trust === "doubtful", `claimed fairway stands as ${claimed?.trust}`);
  assert(R1.journal.some((e) => e.type === "sounding" && e.verdict === "refuted"), "the fabricated export anchor was never sounded");
  assert(R1.journal.some((e) => e.type === "refutation"), "no refutation was recorded");
  assert(!S1_CHART.some((e) => e.kind === "light" && /validate/.test(e.id + e.name)), "a light for the refuted export exists");
  const light = S1_CHART.find((e) => e.kind === "light" && e.id === "lib-parse");
  assert(light?.trust === "measured", "the corrected light is missing");
  const drift = S1_CHART.find((e) => e.kind === "danger" && e.id === "docs-drift");
  assert(!!drift, "the doc drift is not charted as a danger");
});

check("5.1", "dry run: Sailing Directions in conversation and archived, findings anchored", () => {
  assert(R1.brief !== null, "no brief was delivered");
  const archived = readFileSync(join(S1, ".portolan", "sailing-directions.md"), "utf8");
  assert(archived === R1.brief, "archived brief differs from the conversation brief");
  assert(R1.governorMessages[R1.governorMessages.length - 1] === R1.brief, "the brief is not the last word to the Governor");
  const n = briefChecks("fixture brief", R1.brief);
  return `${n} findings, all anchored and labeled`;
});

check("5.2", "fixture brief review: zero claims lacking anchor + trust label", () => {
  const findings = sectionLines(R1.brief ?? "", "## Top findings");
  const bad = findings.filter((l) => !FINDING_RE.test(l));
  assert(bad.length === 0, bad.join("; "));
  return `${findings.length} findings checked`;
});

check("1.2", "checked-in example is the fixture brief, byte-for-byte", () => {
  assert(existsSync(EXAMPLE_PATH), "skill/examples/sailing-directions-example.md is missing");
  const example = readFileSync(EXAMPLE_PATH, "utf8");
  briefChecks("example", example);
  assert(example === R1.brief, "the example does not match a fresh dry run of the fixture");
});

// ---------------------------------------------------------------------------
// Scenario S2 — expedition aborted after the fairways pass.
// ---------------------------------------------------------------------------

const S2 = scenario("abort");
const R2 = runExpedition(S2, { stamp: STAMP, abortAfter: "fairways" });
const S2_CHART = readChart(S2);

check("3.2", "dry run aborted after fairways leaves a valid partial Chart", () => {
  const count = (kind: string) => S2_CHART.filter((e) => e.kind === kind).length;
  assert(count("vessel") === 3 && count("fairway") === 3, "completed passes are missing");
  assert(count("portOfEntry") + count("beacon") + count("light") + count("danger") === 0, "unrun passes left claims");
  for (const entry of S2_CHART) {
    assert(entry.anchors.length >= 1 && entry.trust, `entry ${entry.id} lacks anchor or trust`);
    if (entry.kind === "vessel") {
      assert(/unsurveyed/.test(entry.note ?? ""), `vessel ${entry.id} does not mark unrun passes unsurveyed`);
    }
  }
  for (const sheet of readdirSync(join(S2, ".portolan", "chart")).filter((f) => f.endsWith(".md"))) {
    const text = readFileSync(join(S2, ".portolan", "chart", sheet), "utf8");
    assert(/unsurveyed/i.test(text), `sheet ${sheet} hides its unsurveyed waters`);
  }
  const last = R2.governorMessages[R2.governorMessages.length - 1];
  assert(/stopped after the fairways pass/.test(last) && /unsurveyed/.test(last), "the Governor was not told what remains unsurveyed");
});

// ---------------------------------------------------------------------------
// Scenario S3 — a second expedition repairs pending correction.
// ---------------------------------------------------------------------------

const S3 = scenario("repair");
runFull(S3);
const S3_BEFORE = new Map(
  readChart(S3).map((e) => {
    const { stale: _s, signature: _g, ...rest } = e;
    return [`${e.kind}/${e.id}`, JSON.stringify(rest)] as const;
  })
);
appendFileSync(join(S3, "apps", "api", "server.ts"), "\n// a later edit\n");
const R3 = runFull(S3);
const S3_CHART = readChart(S3);

check("4.2", "second dry run repairs only stale entries and emits notices", () => {
  assert(R3.approvalsAsked === 1, "the second session asked more than its one approval");
  const staleness = R3.journal.find((e) => e.type === "staleness");
  assert(JSON.stringify(staleness?.changedVessels) === JSON.stringify(["api"]), `changed vessels: ${JSON.stringify(staleness?.changedVessels)}`);
  assert(S3_CHART.every((e) => !e.stale), "entries remain marked pending correction");
  const corrected = new Set(
    R3.notices.filter((n) => n.action === "corrected").map((n) => `${n.kind}/${n.id}`)
  );
  for (const expected of [
    "vessel/api", "fairway/api-lib", "fairway/cli-api", "portOfEntry/api-http",
    "beacon/api-port-env", "beacon/api-port-8080", "light/api-health", "danger/api-swallow",
  ]) {
    assert(corrected.has(expected), `no corrected notice for ${expected}`);
  }
  for (const untouched of [
    "vessel/cli", "vessel/lib", "fairway/cli-lib", "portOfEntry/cli-bin",
    "beacon/cli-env-dynamic", "light/lib-parse", "light/cli-json",
  ]) {
    assert(!corrected.has(untouched), `untouched entry ${untouched} was redrawn`);
  }
  assert(S3_CHART.length === S3_BEFORE.size, "the chart was redrawn rather than repaired");
  for (const entry of S3_CHART) {
    const key = `${entry.kind}/${entry.id}`;
    if (key.startsWith("vessel/cli") || key.startsWith("vessel/lib") || key.includes("cli-lib") ||
        key.includes("cli-bin") || key.includes("cli-env-dynamic") || key.includes("lib-parse") || key.includes("cli-json")) {
      const { stale: _s, signature: _g, ...rest } = entry;
      assert(S3_BEFORE.get(key) === JSON.stringify(rest), `pass-through entry ${key} changed content`);
    }
  }
  assert(/## Notices to Mariners/.test(R3.brief ?? "") && /corrected:/.test(R3.brief ?? ""), "the repair brief omits the notices");
  return `${corrected.size} corrected notices`;
});

// ---------------------------------------------------------------------------
// Optional: regenerate the checked-in example from scenario S1.
// ---------------------------------------------------------------------------

if (process.argv.includes("--write-example")) {
  mkdirSync(join(REPO, "skill", "examples"), { recursive: true });
  writeFileSync(EXAMPLE_PATH, R1.brief ?? "");
  console.log(`\nwrote ${EXAMPLE_PATH} from the fixture dry run`);
}

console.log(failures === 0 ? "\nAll expedition-skill checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
