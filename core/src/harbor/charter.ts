/**
 * The charter ledger: arithmetic over the ship's-log receipts that record an
 * expedition's charter and its flares (openspec/changes/expedition-charter,
 * design D1/D2/D4). A charter is a receipt pair — a start receipt promising
 * vessels and entries, an outcome receipt naming the start — and overreach
 * is computed, never prevented: the chart-write receipts recorded after a
 * start whose touched vessels fall outside the promise, aggregated per
 * vessel. A flare is a repair need filed as a receipt; it stays open until
 * the harbor history records a decision — accepted or declined — on a
 * repair proposal for its vessel after the flare's receipt (any repair of
 * the vessel after the flare answered the need on record; a re-found need
 * fires a new flare). Every marker rides the receipt's free-form `meta`, so
 * the formats-pass receipt schema never rejects a line (D1).
 *
 * Absence reads as absence (D4): a log written before this change holds no
 * charter or flare markers, and every reader returns an empty answer —
 * never an error. This module only reads; nothing here writes.
 * specs/harbor/spec.md, specs/expedition/spec.md
 */
import type { Receipt } from "../tools/log";
import { proposalFingerprint } from "./fingerprint";
import type { DecisionRecord } from "./history";

/** One filed flare, read back from its receipt. */
export interface Flare {
  /** The receipt id, citable and monotonic. */
  id: string;
  /** The vessel the repair need names. */
  vessel: string;
  /** The stated reason, verbatim from the receipt. */
  reason: string;
  /** The evidence the filing expedition stated. */
  evidence: string;
  /** When the flare was filed (the receipt's recordedAt). */
  recordedAt: string;
}

/** A charter start receipt, read back: the vessels and entries promised. */
export interface Charter {
  /** The start receipt's id — the outcome receipt cites it. */
  id: string;
  /** The vessels the expedition promised to touch. */
  vessels: string[];
  /** The chart entries the expedition promised to touch. */
  entries: number;
}

/** Out-of-charter chart writes by one vessel: the overreach row. */
export interface Overreach {
  vessel: string;
  /** Chart entries the charter's writes recorded for this vessel. */
  entries: number;
}

/**
 * Every flare receipt in log order, whatever its closure state — the queue
 * applies the closure arithmetic (flareClosed); this reader stays a pure
 * read of the markers. A marker without a vessel or a reason cannot propose
 * and is skipped.
 */
export function openFlares(log: Receipt[]): Flare[] {
  const flares: Flare[] = [];
  for (const receipt of log) {
    const meta = receipt.meta;
    if (meta?.kind !== "flare") continue;
    if (typeof meta.vessel !== "string" || typeof meta.reason !== "string") continue;
    flares.push({
      id: receipt.id,
      vessel: meta.vessel,
      reason: meta.reason,
      evidence: typeof meta.evidence === "string" ? meta.evidence : "",
      recordedAt: receipt.recordedAt,
    });
  }
  return flares;
}

/**
 * The most recent charter START receipt (`meta.kind: "charter"`), in log
 * order; an outcome receipt (`meta.kind: "charter-outcome"`) is a different
 * marker and never shadows the start it closes. Undefined when the log
 * holds no charter start.
 */
export function latestCharter(log: Receipt[]): Charter | undefined {
  for (let i = log.length - 1; i >= 0; i--) {
    const meta = log[i]?.meta;
    if (meta?.kind !== "charter") continue;
    if (!Array.isArray(meta.vessels) || typeof meta.entries !== "number") continue;
    return {
      id: log[i]!.id,
      vessels: meta.vessels.filter((vessel): vessel is string => typeof vessel === "string"),
      entries: meta.entries,
    };
  }
  return undefined;
}

/** The receipt id's monotonic sequence number; undefined for a foreign id. */
function receiptSequence(id: string): number | undefined {
  const match = /^r(\d+)$/.exec(id);
  return match === null ? undefined : Number(match[1]);
}

/**
 * Overreach (design D2): for every `chart.write` receipt recorded AFTER the
 * charter's start receipt (ids are monotonic, so id order is time order),
 * the entries its `meta.vessels` recorded for vessels OUTSIDE the charter —
 * aggregated per vessel, sorted by vessel id. Receipts that are not chart
 * writes contribute nothing even when their meta names vessels; in-charter
 * vessels are never listed; a charter is never listed against itself.
 */
export function charterOverreach(log: Receipt[], charter: Charter): Overreach[] {
  const start = receiptSequence(charter.id);
  if (start === undefined) return [];
  const entriesByVessel = new Map<string, number>();
  for (const receipt of log) {
    if (receipt.command !== "chart.write") continue;
    const sequence = receiptSequence(receipt.id);
    if (sequence === undefined || sequence <= start) continue;
    const vessels = receipt.meta?.vessels;
    if (typeof vessels !== "object" || vessels === null) continue;
    for (const [vessel, count] of Object.entries(vessels)) {
      if (charter.vessels.includes(vessel)) continue;
      if (typeof count !== "number") continue;
      entriesByVessel.set(vessel, (entriesByVessel.get(vessel) ?? 0) + count);
    }
  }
  return [...entriesByVessel.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([vessel, entries]) => ({ vessel, entries }));
}

/** What the closure arithmetic needs besides the history itself. */
export interface FlareClosureContext {
  /**
   * Every flare receipt ever filed on THIS vessel (open or closed), log
   * order — the candidate rows a decision could have been made on carried
   * some subset of these reasons. Must include the flare being tested.
   */
  vesselFlares: Flare[];
  /**
   * The stale entries currently charged to the vessel (the repair queue's
   * own attribution, ../fan-in.ts): the drift counts a repair row for this
   * vessel could have carried at or before now.
   */
  staleEntries: number;
}

/**
 * How many distinct reasons per vessel the candidate enumeration will
 * combine. Beyond the cap the oldest reasons drop out of the enumeration:
 * a flare those reasons alone could close stays open and proposes again —
 * the loud failure mode, never a silent one. One vessel collecting 16
 * distinct flare reasons is not a province this arithmetic should optimize
 * for; unbounded subsets would be.
 */
const MAX_CANDIDATE_REASONS = 16;

/**
 * The flare-closure decision (design D1): a decision — accepted or
 * declined — on a repair proposal for the flare's vessel, recorded in the
 * harbor history AFTER the flare's receipt, closes the flare outright.
 *
 * The history records fingerprints, not vessels, so "for this vessel" is
 * decided by re-minting the fingerprints the proposal engine can actually
 * produce for the vessel: a repair row there carries the vessel's drift key
 * (`vessel/<id>#<stale-count>`, any count up to the current charge), the
 * count-less vessel key plus reasons (the vessel-scoped flare-only row),
 * or — for rows minted before the 2026-09-06 vessel-scoping amendment —
 * the reasons alone; plus the reasons of whatever flares on the vessel
 * were open when it was decided — here, some subset of every reason ever
 * filed on the vessel. Any postdating decision whose fingerprint equals
 * one of those candidates closes the flare. A decision recorded before the
 * flare's receipt closes nothing, whatever it was about.
 */
export function flareClosed(
  flare: Flare,
  decisions: DecisionRecord[],
  context: FlareClosureContext,
): boolean {
  const postdating = decisions.filter((record) => record.decidedAt > flare.recordedAt);
  if (postdating.length === 0) return false;
  const reasons = [...new Set(context.vesselFlares.map((f) => f.reason))].slice(
    -MAX_CANDIDATE_REASONS,
  );
  const candidates = new Set<string>();
  for (let mask = 0; mask < (1 << reasons.length); mask++) {
    const keys = reasons.filter((_, i) => (mask & (1 << i)) !== 0);
    if (keys.length > 0) {
      candidates.add(proposalFingerprint("repair", keys));
      candidates.add(proposalFingerprint("repair", [`vessel/${flare.vessel}`, ...keys]));
    }
    for (let stale = 0; stale <= context.staleEntries; stale++) {
      candidates.add(proposalFingerprint("repair", [...keys, `vessel/${flare.vessel}#${stale}`]));
    }
  }
  return postdating.some((record) => candidates.has(record.fingerprint));
}

/**
 * Refusal-respect for a repair row when flares exist on its vessel. A
 * declined decision filters not only the exact row it was recorded on but
 * any other shape of that vessel's row at the SAME stale count — the
 * Governor who declined the drift-plus-flare row refused that drift too,
 * and the row must not recompute without its flare reasons merely because
 * the decline closed them. The refusal reaches across shapes only forward
 * in time: a decline predating a flare never filters a row carrying that
 * flare's reason — the flare is evidence the Governor had not seen. With
 * no flares ever filed on the vessel this reduces to the exact-fingerprint
 * rule the resurvey queue pinned.
 *
 * `row.staleEntries` is the count in the row's own `vessel/<id>#<count>`
 * key, undefined for a flare-only row (no drift key). `vesselFlares` is
 * every flare receipt ever filed on the vessel, log order — same input as
 * flareClosed.
 */
export function repairRowRefused(
  row: {
    vessel: string;
    /** The row's own stale count, when its evidence carries the drift key. */
    staleEntries?: number;
    /** The flare reasons the row carries (the open flares folded in). */
    flareReasons: string[];
    fingerprint: string;
  },
  decisions: DecisionRecord[],
  vesselFlares: Flare[],
): boolean {
  const declined = decisions.filter((record) => record.decision === "declined");
  if (declined.length === 0) return false;
  const reasons = [...new Set(vesselFlares.map((f) => f.reason))].slice(-MAX_CANDIDATE_REASONS);
  const rowReasons = new Set(row.flareReasons);
  const newestFlareByReason = new Map<string, string>();
  for (const flare of vesselFlares) {
    const newest = newestFlareByReason.get(flare.reason);
    if (newest === undefined || flare.recordedAt > newest) {
      newestFlareByReason.set(flare.reason, flare.recordedAt);
    }
  }
  // The row shapes a decline could have been recorded on: this row's own
  // shape — its drift key at its own count, or the count-less vessel key
  // plus its flare reasons (the flare-only row is vessel-scoped, so its
  // fingerprint can never collide with another vessel's) — combined with
  // every subset of the vessel's flare reasons. A keyed row never matches a
  // keyless shape: a changed stale count is new evidence (the resurvey
  // rule), and so is drift appearing at all.
  const shapeOf = new Map<string, string[]>();
  for (let mask = 0; mask < (1 << reasons.length); mask++) {
    const subset = reasons.filter((_, i) => (mask & (1 << i)) !== 0);
    const keys =
      row.staleEntries === undefined
        ? [`vessel/${row.vessel}`, ...subset]
        : [...subset, `vessel/${row.vessel}#${row.staleEntries}`];
    shapeOf.set(proposalFingerprint("repair", keys), subset);
  }
  for (const record of declined) {
    const subset = shapeOf.get(record.fingerprint);
    if (subset === undefined) continue;
    // The decline refuses this shape only if it postdates every flare whose
    // reason it saw that this row lacks, or this row carries that it did not
    // see — otherwise the difference is evidence newer than the refusal.
    const sawOrCarries = (reason: string): boolean =>
      subset.includes(reason) !== rowReasons.has(reason);
    const newer = [...newestFlareByReason].some(
      ([reason, at]) => sawOrCarries(reason) && record.decidedAt <= at,
    );
    if (!newer) return true;
  }
  return false;
}
