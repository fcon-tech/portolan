/**
 * `trust.report`: the province's verification summary in one call
 * (openspec/changes/verification-spine). Aggregates the chart — trust-label
 * distribution, per-kind counts, staleness — and re-sounds every anchor
 * live through the existing `sound.anchor` machinery, so the report states
 * what holds now, not what the index last claimed. Refuted anchors are
 * named, never smoothed over: the verdict informs, the Cartographer writes.
 *
 * Refreshes staleness first, exactly as `chart.read` does; that refresh is
 * the only write the report may cause (inside `.portolan/`, per the
 * refresh's own contract). No receipt is appended.
 */
import type { Anchor, EntryKind, IndexedEntry, TrustLabel } from "../types";
import { ENTRY_KINDS, TRUST_LABELS } from "../types";
import { readChart } from "../chart-store";
import { refreshStaleness } from "../staleness";
import { readReceipts, type Receipt } from "./log";
import { soundAnchor } from "./sound";

/** One refuted anchor: the entry that cites it, the citation, what was found. */
export interface RefutedAnchor {
  /** The citing entry's chart id. */
  entryId: string;
  /** The anchor exactly as cited by the entry. */
  anchor: Anchor;
  /** What the sounding actually found at the citation. */
  found: string;
}

/** One vessel dragging entries into `pending correction`. */
export interface PendingVessel {
  id: string;
  /** Chart entries marked pending correction that hang from this vessel. */
  entries: number;
}

/** What `trust.report` returns: the one-call verification summary. */
export interface TrustReport {
  /** Chart entries per trust label; all five labels stated, zero-filled. */
  trust: Record<TrustLabel, number>;
  /** Chart entries per kind; all six kinds stated, zero-filled. */
  kinds: Record<EntryKind, number>;
  /** Pending-correction vessels, computed after the staleness refresh. */
  staleness: { pendingVessels: PendingVessel[] };
  /** Live re-sounding of every chart anchor. */
  anchors: {
    /** Anchors cited on the chart. */
    total: number;
    /** Anchors sounded — equal to `total` by construction: no sampling. */
    sounded: number;
    /** Soundings that resolved `confirmed`. */
    confirmed: number;
    /** Soundings that resolved `refuted`. */
    refuted: number;
    /** Every refuted anchor, sorted by entry id then anchor index. */
    refutedList: RefutedAnchor[];
  };
  /**
   * The ship's log: total receipts and the most recent one (null on an
   * empty log). Typed to admit the log module's own lookup result, so the
   * field compares directly against `readReceipt`.
   */
  log: { receipts: number; lastReceipt: Receipt | null | undefined };
}

/**
 * Charge one stale entry to the pending-correction vessel(s) it hangs from.
 * A fairway between two drifted vessels drags on both; entries never hang
 * from an unchanged vessel, because the refresh marks only changed vessels'
 * entries stale.
 */
function chargeStaleEntry(
  entry: IndexedEntry,
  changed: Set<string>,
  pending: Map<string, number>,
): void {
  if (!entry.stale) return;
  const bump = (vesselId: string): void => {
    if (changed.has(vesselId)) pending.set(vesselId, (pending.get(vesselId) ?? 0) + 1);
  };
  if (entry.kind === "vessel") bump(entry.id);
  else if (entry.kind === "fairway") {
    bump(entry.from);
    bump(entry.to);
  } else bump(entry.vessel);
}

/**
 * `trust.report`: the one-call verification summary. Deterministic — no
 * timestamps participate, so two runs over an unchanged province return the
 * same report, refuted list in the same order.
 */
export function trustReport(targetRoot: string): TrustReport {
  // Staleness first, chart.read semantics: the staleness section is never
  // served from a stale signature. This is the report's only possible write.
  const refresh = refreshStaleness(targetRoot);
  const entries = readChart(targetRoot);

  const trust = Object.fromEntries(TRUST_LABELS.map((l) => [l, 0])) as Record<TrustLabel, number>;
  const kinds = Object.fromEntries(ENTRY_KINDS.map((k) => [k, 0])) as Record<EntryKind, number>;
  for (const entry of entries) {
    trust[entry.trust] += 1;
    kinds[entry.kind] += 1;
  }

  const changed = new Set(refresh.changedVessels);
  const pending = new Map<string, number>();
  for (const stale of refresh.staleEntries) chargeStaleEntry(stale, changed, pending);
  const pendingVessels = [...pending.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([id, count]) => ({ id, entries: count }));

  const refuted: (RefutedAnchor & { index: number })[] = [];
  let confirmed = 0;
  let total = 0;
  for (const entry of entries) {
    for (const [index, anchor] of entry.anchors.entries()) {
      total += 1;
      const verdict = soundAnchor(targetRoot, { anchor });
      if (verdict.verdict === "confirmed") confirmed += 1;
      else {
        // sound.anchor yields confirmed or refuted only; the evidence names
        // what was actually found.
        refuted.push({ entryId: entry.id, anchor, index, found: verdict.evidence[0]!.found });
      }
    }
  }
  refuted.sort((a, b) =>
    a.entryId < b.entryId ? -1 : a.entryId > b.entryId ? 1 : a.index - b.index,
  );
  const refutedList: RefutedAnchor[] = refuted.map(({ index: _index, ...r }) => r);

  const receipts = readReceipts(targetRoot);
  return {
    trust,
    kinds,
    staleness: { pendingVessels },
    anchors: {
      total,
      sounded: total,
      confirmed,
      refuted: refutedList.length,
      refutedList,
    },
    log: {
      receipts: receipts.length,
      lastReceipt: receipts.length > 0 ? receipts[receipts.length - 1]! : null,
    },
  };
}
