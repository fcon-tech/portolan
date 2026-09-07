/**
 * The proposal engine: the deterministic Harbor Master. The queue is
 * computed from exactly four inputs — never imagined (the trust spine
 * forbids model-invented proposals):
 *
 * 1. repair   — one proposal per vessel marked `pending correction`; the
 *               row names that vessel alone (staleness refresh runs first,
 *               exactly like `chart.read`);
 * 2. gap      — per charted vessel with no recorded behavior and/or no
 *               charted light (both signals read from the index, never from
 *               parsed sheets — design.md, decision 1);
 * 3. new-land — landscape entries absent from the last-survey snapshot,
 *               compared only while the chart index hash is unchanged;
 * 4. flares   — repair needs filed as ship's-log receipts by expeditions
 *               (openspec/changes/expedition-charter, design D1): every
 *               open flare contributes to the repair row of the vessel it
 *               names, its stated reason riding the evidence; a vessel
 *               with open flares and no drift gets a flare-only row, its
 *               evidence the count-less vessel key plus the stated reasons
 *               (vessel-scoped, code-review fix 2026-09-06). Flare rows
 *               are repair rows for every purpose — same rank, same
 *               decisions, same night bound; no join layer, just a fold of
 *               the flare reasons onto the per-vessel row (filter plus
 *               concat). Closure is arithmetic over the harbor history
 *               (./charter, flareClosed): a decision — accepted or
 *               declined — on a repair proposal for the vessel recorded
 *               after the flare's receipt closes it; undecided flares keep
 *               proposing.
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
import { pointerStatus, type PointerStatus } from "../pointer";
import { refreshStaleness } from "../staleness";
import { chargeStaleEntries, compareVesselRank, vesselFanIn } from "../fan-in";
import { readReceipts } from "../tools/log";
import { HarborError } from "./errors";
import { PROPOSAL_KINDS, driftEntryCount, proposalFingerprint, type ProposalKind } from "./fingerprint";
import { flareClosed, openFlares, repairRowRefused, type Flare } from "./charter";
import {
  DECISIONS,
  appendDecision,
  lastRecordPerFingerprint,
  readDecisions,
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
  /** The Pointer's status — one of current/stale/missing/unparseable/unreadable (../pointer), a reported fact, never a queue input. */
  pointer: PointerStatus;
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
 *
 * The fourth input folds in here with no join layer: the open flares of a
 * vessel are filtered and their reasons concatenated onto that vessel's
 * single row — the row already carries the drift, so it carries the flares
 * too; a vessel with open flares and no drift gets a flare-only row, its
 * evidence the stated reasons alone.
 */
function repairProposals(
  targetRoot: string,
  entries: IndexedEntry[],
  charged: Map<string, number>,
  openFlaresByVessel: Map<string, Flare[]>,
): Proposal[] {
  const rows = new Map<string, Proposal>();
  for (const vessel of sortById(
    entries.filter((e): e is IndexedVessel => e.kind === "vessel" && e.stale === true),
  )) {
    const staleEntries = charged.get(vessel.id) ?? 0;
    const evidence = [`vessel/${vessel.id}#${staleEntries}`];
    rows.set(vessel.id, {
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
    });
  }
  for (const [vesselId, flares] of [...openFlaresByVessel].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    const reasons = [...new Set(flares.map((flare) => flare.reason))];
    const driftRow = rows.get(vesselId);
    if (driftRow !== undefined) {
      const evidence = [...driftRow.evidence, ...reasons];
      rows.set(vesselId, {
        ...driftRow,
        fingerprint: proposalFingerprint("repair", evidence),
        summary: `${driftRow.summary}; open flare: ${reasons.join("; ")}`,
        evidence,
      });
      continue;
    }
    // A flare-only row: the vessel's charted paths still anchor it when they
    // sound (omitted, never faked, when they do not); the scope counts what
    // a re-survey would touch — the drift charge, zero on a still vessel.
    // The evidence is vessel-scoped: the count-less vessel key plus the
    // stated reasons, so two vessels' flare-only rows never share a
    // fingerprint whatever their reason texts — declining one vessel's row
    // must never close another vessel's flare (code-review fix 2026-09-06).
    const vessel = entries.find((e): e is IndexedVessel => e.kind === "vessel" && e.id === vesselId);
    const staleEntries = charged.get(vesselId) ?? 0;
    const evidence = [`vessel/${vesselId}`, ...reasons];
    rows.set(vesselId, {
      kind: "repair" as const,
      fingerprint: proposalFingerprint("repair", evidence),
      summary: `open flare on vessel ${vesselId}: ${reasons.join("; ")}`,
      evidence,
      anchors:
        vessel === undefined
          ? []
          : uniqueAnchors(
              vessel.paths
                .map((path) => soundableAnchorUnder(targetRoot, path))
                .filter((anchor): anchor is Anchor => anchor !== undefined),
            ),
      scope: { vessels: [vesselId], entries: staleEntries, soundings: staleEntries },
    });
  }
  return [...rows.values()];
}

/**
 * The open flares per vessel: every flare receipt on a vessel that no
 * postdating decision on a repair proposal for that vessel has closed
 * (./charter, flareClosed — the closure arithmetic). Deterministic: flares
 * grouped by vessel in, vessel-keyed map of the survivors out.
 */
function stillOpenFlares(
  byVessel: Map<string, Flare[]>,
  decisions: DecisionRecord[],
  charged: Map<string, number>,
): Map<string, Flare[]> {
  const open = new Map<string, Flare[]>();
  for (const [vesselId, vesselFlares] of byVessel) {
    const stillOpen = vesselFlares.filter(
      (flare) =>
        !flareClosed(flare, decisions, {
          vesselFlares,
          staleEntries: charged.get(vesselId) ?? 0,
        }),
    );
    if (stillOpen.length > 0) open.set(vesselId, stillOpen);
  }
  return open;
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
  const charged = chargeStaleEntries(entries);
  const flares = openFlares(readReceipts(targetRoot));
  const flaresByVessel = new Map<string, Flare[]>();
  for (const flare of flares) {
    const vesselFlares = flaresByVessel.get(flare.vessel) ?? [];
    vesselFlares.push(flare);
    flaresByVessel.set(flare.vessel, vesselFlares);
  }
  const decisions = readDecisions(targetRoot);
  const openByVessel = stillOpenFlares(flaresByVessel, decisions, charged);
  const proposals: Proposal[] = [
    ...repairProposals(targetRoot, entries, charged, openByVessel),
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

  // The Pointer status (pointer-bridge): reported beside the queue, never a
  // queue input — the four deterministic inputs above remain the queue's
  // only sources, so a stale or missing Pointer proposes nothing. Reads
  // AGENTS.md and nothing else in the target; writes nothing.
  const pointer = pointerStatus(targetRoot);
  if (options.includeDeclined === true) return { proposals, pointer };
  // Refusal filtering keys on `declined` only (the standing rule): an
  // acceptance — Governor's or night-watch's — never filters, and neither
  // does a night-watch `launch-failed` outcome, so a failed launch leaves
  // the proposal queued for retry or the Governor's decision. The LAST
  // record of any kind is the latest word on the fingerprint. Repair rows
  // additionally respect the flare refusal arithmetic (./charter,
  // repairRowRefused): a decline filters the other shapes of that vessel's
  // row at the same stale count — it is a no-op where no flare was ever
  // filed, where it reduces to this exact-fingerprint set.
  const declinedRecords = [...lastRecordPerFingerprint(readHistory(targetRoot)).values()].filter(
    (record): record is DecisionRecord =>
      "decision" in record && record.decision === "declined",
  );
  const declined = new Set(declinedRecords.map((record) => record.fingerprint));
  return {
    pointer,
    proposals: proposals.filter((p) => {
      if (declined.has(p.fingerprint)) return false;
      if (p.kind !== "repair") return true;
      const vessel = p.scope.vessels[0]!;
      // The drift key is matched only at the engine-minted position —
      // evidence[0] of a drift-keyed row — by its exact
      // `vessel/<id>#<digits>` shape (./fingerprint, driftEntryCount).
      // Reason strings are DATA, never keys: scanning the whole evidence
      // let a free-text flare reason shaped like `vessel/<id>#<count>` pose
      // as the row's drift charge (and slip out of the flare reasons), so a
      // previously-declined shape could suppress the flare row (security
      // fix 2026-09-06).
      const [mintedKey] = p.evidence;
      const driftKey =
        mintedKey !== undefined && driftEntryCount(mintedKey) !== undefined ? mintedKey : undefined;
      return !repairRowRefused(
        {
          vessel,
          ...(driftKey === undefined ? {} : { staleEntries: driftEntryCount(driftKey) }),
          flareReasons: p.evidence.filter((key) => key !== driftKey),
          fingerprint: p.fingerprint,
        },
        declinedRecords,
        flaresByVessel.get(vessel) ?? [],
      );
    }),
  };
}

/**
 * `expeditions.decide`: record the Governor's decision on a proposal the
 * queue currently computes (declined proposals stay computable — the
 * Governor may overturn a refusal while the evidence is unchanged). An
 * unknown fingerprint is rejected: deciding on a proposal that does not
 * exist would write an unverifiable row into the history. The decision
 * records the row's evidence keys (design D1, amendment 2026-09-06): flare
 * closure matches the recorded evidence instead of re-mining what the
 * engine could have produced — monotonic, whatever the drift charge does
 * after the repair.
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
  const proposal = computable.proposals.find((p) => p.fingerprint === fingerprint);
  if (proposal === undefined) {
    throw new HarborError(
      `unknown proposal fingerprint ${fingerprint}; decide on a proposal the queue currently computes ` +
        "(call expeditions.propose first)",
    );
  }
  return appendDecision(targetRoot, fingerprint, decision, { evidence: proposal.evidence });
}

export { PROPOSAL_KINDS };
