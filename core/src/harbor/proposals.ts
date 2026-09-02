/**
 * The proposal engine: the deterministic Harbor Master. The queue is
 * computed from exactly three inputs — never imagined (the trust spine
 * forbids model-invented proposals):
 *
 * 1. repair   — one proposal per vessel marked `pending correction`; the
 *               row names that vessel alone (staleness refresh runs first,
 *               exactly like `chart.read`);
 * 2. gap      — per charted vessel with no recorded behavior and/or no
 *               charted light (both signals read from the index, never from
 *               parsed sheets — design.md, decision 1);
 * 3. new-land — landscape entries absent from the last-survey snapshot,
 *               compared only while the chart index hash is unchanged.
 *
 * Ranking: repair rows order among themselves by the shared rank — direct
 * cross-vessel charted fan-in, ties by vessel id (../fan-in.ts) — before
 * the kind rank resolves against new-land and gap: repair > new-land > gap,
 * then evidence size, then evidence key (design.md, decision 6). Every
 * proposal carries its kind, evidence keys, anchors, a scope estimate, and
 * a stable fingerprint; fingerprints whose LAST recorded decision is
 * declined are filtered — a refusal holds while that vessel's drift is
 * unchanged and reopens when its stale-entry count changes.
 *
 * Anchor honesty on repair: the per-vessel tree signature hashes the file
 * list, sizes, and mtimes, so individual changed files are not recoverable
 * without storing per-file state. Repair anchors therefore cite a soundable
 * regular file under each drifted vessel's charted paths — `sound.anchor`
 * refutes any non-regular file, so citing the directory itself would refute
 * true drift at the very first sounding of the brief the Cartographer was
 * handed (the new-land precedent: landscapeAnchor cites the manifest or
 * `.git` marker for the same reason).
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Anchor, IndexedEntry, VesselEntry } from "../types";
import { resolveInsideTarget } from "../perimeter";
import { readChart } from "../chart-store";
import { refreshStaleness } from "../staleness";
import { chargeStaleEntries, compareVesselRank, vesselFanIn } from "../fan-in";
import { HarborError } from "./errors";
import { PROPOSAL_KINDS, proposalFingerprint, type ProposalKind } from "./fingerprint";
import {
  DECISIONS,
  appendDecision,
  lastRecordPerFingerprint,
  readHistory,
  type DecisionRecord,
  type GovernorDecision,
} from "./history";
import {
  chartIndexHash,
  landscapeAnchor,
  readSnapshot,
  scanLandscape,
  writeSnapshot,
  type LandscapeEntry,
} from "./snapshot";

/** The scope estimate every proposal carries: who and what an expedition touches. */
export interface ProposalScope {
  /** Charted vessel ids affected; empty for new land (nothing charted there yet). */
  vessels: string[];
  /** Estimated chart entries the expedition would touch. */
  entries: number;
  /** Estimated soundings (one per entry the verify loop re-sounds). */
  soundings: number;
}

/** One expedition proposal, evidence-complete and fingerprinted. */
export interface Proposal {
  kind: ProposalKind;
  fingerprint: string;
  /** One deterministic sentence: what justifies the proposal. */
  summary: string;
  /** The fingerprint's evidence keys (`vessel/api`, `repo:vendor/lib`, ...). */
  evidence: string[];
  /** The display path the proposal is about, when it has one (new-land). */
  subject?: string;
  /** Anchors justifying the proposal, citable and soundable. */
  anchors: Anchor[];
  scope: ProposalScope;
}

/** What `expeditions.propose` returns: the ranked, refusal-filtered queue. */
export interface ProposeResult {
  proposals: Proposal[];
}

const KIND_RANK: Record<ProposalKind, number> = { repair: 0, "new-land": 1, gap: 2 };

/** A vessel as read from the index: store metadata included. */
type IndexedVessel = VesselEntry & { stale: boolean };

function sortById<T extends { id: string }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function uniqueAnchors(anchors: Anchor[]): Anchor[] {
  const seen = new Set<string>();
  const out: Anchor[] = [];
  for (const anchor of anchors) {
    const key = JSON.stringify(anchor);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(anchor);
    }
  }
  return out;
}

/**
 * A soundable regular file under the given charted path, for repair anchors:
 * the first file in sorted, hidden/node_modules-skipping walk order, so the
 * anchor is deterministic. Undefined when the path escapes the province or
 * holds no regular file — an unsoundable citation is dropped, never faked.
 */
function soundableAnchorUnder(targetRoot: string, rel: string): Anchor | undefined {
  const stack = [rel.replace(/\/+$/, "")];
  while (stack.length > 0) {
    const current = stack.shift()!;
    if (current.length === 0) continue;
    if (resolveInsideTarget(targetRoot, current) === undefined) continue;
    let stats;
    try {
      stats = statSync(join(targetRoot, current));
    } catch {
      continue; // a path that no longer exists contributes nothing
    }
    if (stats.isFile()) return { type: "file", path: current };
    if (!stats.isDirectory()) continue;
    let names: string[];
    try {
      names = readdirSync(join(targetRoot, current), { withFileTypes: true })
        .filter((de) => de.isFile() || (de.isDirectory() && !de.name.startsWith(".") && de.name !== "node_modules"))
        .map((de) => de.name)
        .sort();
    } catch {
      continue;
    }
    for (const name of names) stack.push(current === "." ? name : `${current}/${name}`);
  }
  return undefined;
}

/**
 * Repair proposals: one per pending-correction vessel, in vessel-id order
 * (the queue sort below applies the shared fan-in rank). The evidence key
 * carries the stale-entry count charged to that vessel (../fan-in.ts, the
 * report's own attribution rule), so a refusal holds while the drift is
 * unchanged and reopens when the count changes.
 */
function repairProposals(targetRoot: string, entries: IndexedEntry[]): Proposal[] {
  const charged = chargeStaleEntries(entries);
  return sortById(
    entries.filter((e): e is IndexedVessel => e.kind === "vessel" && e.stale === true),
  ).map((vessel) => {
    const staleEntries = charged.get(vessel.id) ?? 0;
    const evidence = [`vessel/${vessel.id}#${staleEntries}`];
    return {
      kind: "repair" as const,
      fingerprint: proposalFingerprint("repair", evidence),
      summary:
        `vessel ${vessel.id} marked pending correction ` +
        `(sources changed under ${vessel.paths.join(", ")})`,
      evidence,
      // A vessel whose charted paths hold no soundable regular file is
      // proposed with its anchor omitted, never faked (the new-land precedent).
      anchors: uniqueAnchors(
        vessel.paths
          .map((path) => soundableAnchorUnder(targetRoot, path))
          .filter((anchor): anchor is Anchor => anchor !== undefined),
      ),
      scope: { vessels: [vessel.id], entries: staleEntries, soundings: staleEntries },
    };
  });
}

/** Gap proposals: one per charted vessel missing its behavior and/or its lights. */
function gapProposals(entries: IndexedEntry[]): Proposal[] {
  const lightsPerVessel = new Map<string, number>();
  for (const entry of entries) {
    if (entry.kind === "light") {
      lightsPerVessel.set(entry.vessel, (lightsPerVessel.get(entry.vessel) ?? 0) + 1);
    }
  }
  const proposals: Proposal[] = [];
  for (const vessel of sortById(entries.filter((e): e is IndexedVessel => e.kind === "vessel"))) {
    const missing: string[] = [];
    if (vessel.behavior === undefined || vessel.behavior.trim().length === 0) missing.push("behavior");
    if ((lightsPerVessel.get(vessel.id) ?? 0) === 0) missing.push("lights");
    if (missing.length === 0) continue;
    const phrases = missing.map((pass) =>
      pass === "behavior" ? "no recorded behavior" : "no charted light",
    );
    proposals.push({
      kind: "gap",
      fingerprint: proposalFingerprint("gap", missing.map((pass) => `vessel/${vessel.id}#${pass}`)),
      summary: `vessel ${vessel.id} (${vessel.paths.join(", ")}) has ${phrases.join(" and ")}`,
      evidence: missing.map((pass) => `vessel/${vessel.id}#${pass}`),
      anchors: vessel.anchors,
      scope: { vessels: [vessel.id], entries: missing.length, soundings: missing.length },
    });
  }
  return proposals;
}

/** New-land proposals: landscape present now but absent from the last-survey snapshot. */
function newLandProposals(targetRoot: string, absent: LandscapeEntry[]): Proposal[] {
  return absent.map((entry) => {
    const evidence = [`${entry.kind}:${entry.path}`];
    return {
      kind: "new-land" as const,
      fingerprint: proposalFingerprint("new-land", evidence),
      summary:
        `${entry.kind === "repo" ? "repository" : "manifest"} ${entry.path} is present in the province ` +
        "but absent from the last-survey snapshot",
      evidence,
      subject: entry.path,
      anchors: [landscapeAnchor(targetRoot, entry)],
      scope: { vessels: [], entries: 0, soundings: 0 },
    };
  });
}

/**
 * `expeditions.propose`: compute the ranked queue. Refreshes staleness
 * first (chart.read semantics), lazily establishes or refreshes the
 * landscape snapshot, and filters fingerprints whose last decision is
 * declined. Purely deterministic: no timestamps participate, so two runs
 * over an unchanged province return the same queue.
 */
export function computeProposals(
  targetRoot: string,
  options: { includeDeclined?: boolean } = {},
): ProposeResult {
  refreshStaleness(targetRoot);
  const entries = readChart(targetRoot);

  // Landscape vs snapshot. Snapshot first established on a chart with none:
  // the baseline, and no new-land — there is no earlier survey to differ
  // from. Index hash changed since the snapshot: a survey stood, refresh to
  // the current landscape. Hash unchanged: compare, and propose the absent.
  const stored = readSnapshot(targetRoot);
  const currentHash = chartIndexHash(targetRoot);
  let newLand: LandscapeEntry[] = [];
  if (stored === null) {
    writeSnapshot(targetRoot, { indexHash: currentHash, landscape: scanLandscape(targetRoot) });
  } else if (stored.indexHash === currentHash) {
    const known = new Set(stored.landscape.map((e) => `${e.kind}:${e.path}`));
    newLand = scanLandscape(targetRoot).filter((e) => !known.has(`${e.kind}:${e.path}`));
  } else {
    writeSnapshot(targetRoot, { indexHash: currentHash, landscape: scanLandscape(targetRoot) });
  }

  const fanIn = vesselFanIn(entries);
  const proposals: Proposal[] = [
    ...repairProposals(targetRoot, entries),
    ...newLandProposals(targetRoot, newLand),
    ...gapProposals(entries),
  ];
  proposals.sort((a, b) => {
    // Repair rows order among themselves by the shared rank — fan-in
    // descending, vessel id ascending, the row's single vessel compared —
    // before the kind rank resolves against new-land and gap.
    if (a.kind === "repair" && b.kind === "repair") {
      return compareVesselRank(a.scope.vessels[0], b.scope.vessels[0], fanIn);
    }
    return (
      KIND_RANK[a.kind] - KIND_RANK[b.kind] ||
      b.evidence.length - a.evidence.length ||
      (a.evidence[0] < b.evidence[0] ? -1 : a.evidence[0] > b.evidence[0] ? 1 : 0)
    );
  });

  if (options.includeDeclined === true) return { proposals };
  // Refusal filtering keys on `declined` only (the standing rule): an
  // acceptance — Governor's or night-watch's — never filters, and neither
  // does a night-watch `launch-failed` outcome, so a failed launch leaves
  // the proposal queued for retry or the Governor's decision. The LAST
  // record of any kind is the latest word on the fingerprint.
  const declined = new Set(
    [...lastRecordPerFingerprint(readHistory(targetRoot)).values()]
      .filter(
        (record): record is DecisionRecord =>
          "decision" in record && record.decision === "declined",
      )
      .map((record) => record.fingerprint),
  );
  return { proposals: proposals.filter((p) => !declined.has(p.fingerprint)) };
}

/**
 * `expeditions.decide`: record the Governor's decision on a proposal the
 * queue currently computes (declined proposals stay computable — the
 * Governor may overturn a refusal while the evidence is unchanged). An
 * unknown fingerprint is rejected: deciding on a proposal that does not
 * exist would write an unverifiable row into the history.
 */
export function decide(
  targetRoot: string,
  fingerprint: string,
  decision: GovernorDecision,
): DecisionRecord {
  if ((DECISIONS as readonly string[]).includes(decision) === false) {
    throw new HarborError(
      `unknown decision ${JSON.stringify(decision)}; the vocabulary is ${DECISIONS.join(", ")}`,
    );
  }
  if (fingerprint.length === 0) {
    throw new HarborError(
      "a decision needs the proposal's fingerprint, exactly as expeditions.propose returned it",
    );
  }
  const computable = computeProposals(targetRoot, { includeDeclined: true });
  if (!computable.proposals.some((p) => p.fingerprint === fingerprint)) {
    throw new HarborError(
      `unknown proposal fingerprint ${fingerprint}; decide on a proposal the queue currently computes ` +
        "(call expeditions.propose first)",
    );
  }
  return appendDecision(targetRoot, fingerprint, decision);
}

export { PROPOSAL_KINDS };
