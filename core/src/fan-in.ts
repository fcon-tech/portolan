/**
 * The two per-vessel facts the harbor queue and trust.report both quote, in
 * one leaf so one definition serves both.
 *
 * The rank (openspec/changes/resurvey-queue/specs/harbor/spec.md, "The
 * repair queue is fan-in ranked"): direct cross-vessel charted fan-in, ties
 * broken by vessel id. The harbor queue orders its repair rows by it and
 * trust.report orders its pending-vessel list by the same rank — one list,
 * one order.
 *
 * The charge (same delta, "charged by the same attribution the staleness
 * report uses"): per-vessel stale-entry counts, so the queue's evidence and
 * scope name the same number the report's staleness section does.
 *
 * The rank is deliberately a second definition beside chart.neighborhood's,
 * not a unification of it: the neighborhood counts every charted incoming
 * fairway per entry, while this rank counts per vessel and excludes a
 * vessel's fairways to itself — internal traffic says nothing about how much
 * of the rest of the chart hangs from the vessel. The divergence is pinned
 * by the spec; the leaf keeps exactly those two importers.
 *
 * Arithmetic over charted bytes only: no timestamps and no judgment
 * participate, so two computations over an unchanged chart return the same
 * counts and, sorted by the compare below, the same order.
 */
import type { ChartEntry, IndexedEntry } from "./types";

/**
 * Per-vessel direct cross-vessel charted fan-in: the count of charted
 * fairways whose target vessel is that vessel and whose source vessel is a
 * different one. Fairway endpoints are vessel ids — a fairway from an id
 * with no charted vessel entry still counts, the chart is the truth, not
 * the vessel list. A vessel with no incoming cross-vessel fairway is absent
 * from the map and ranks zero wherever it is read.
 */
export function vesselFanIn(entries: ReadonlyArray<ChartEntry>): Map<string, number> {
  const fanIn = new Map<string, number>();
  for (const entry of entries) {
    if (entry.kind !== "fairway") continue;
    if (entry.from === entry.to) continue; // intra-vessel: no cross-vessel fan-in
    fanIn.set(entry.to, (fanIn.get(entry.to) ?? 0) + 1);
  }
  return fanIn;
}

/**
 * The rank order over vessel ids, as the compare the two importers sort
 * with: fan-in descending, ties broken by vessel id ascending — the queue's
 * voice. A count missing from the map ranks zero, so a detached vessel is
 * ordered by the tie-break alone instead of dropping out.
 */
export function compareVesselRank(a: string, b: string, fanIn: Map<string, number>): number {
  const fa = fanIn.get(a) ?? 0;
  const fb = fanIn.get(b) ?? 0;
  if (fa !== fb) return fb - fa;
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Charge every stale entry to the pending-correction vessel(s) it hangs
 * from, read from the index's own stale flags: a vessel entry charges its
 * vessel, a stale fairway charges BOTH the vessels it runs between, and
 * every other entry charges its vessel. The refresh recomputes those flags
 * — a drifted vessel stays pending, a reverted one clears — so attribution
 * must come from the chart as it stands now, never from a refresh delta.
 * A pending fairway drags on both its endpoints: once drift is reverted
 * there is no telling which endpoint moved, and over-attribution is the
 * honest direction, so an endpoint that is itself fresh is charged too.
 */
export function chargeStaleEntries(entries: ReadonlyArray<IndexedEntry>): Map<string, number> {
  const charged = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.stale) continue;
    const bump = (vesselId: string): void => {
      charged.set(vesselId, (charged.get(vesselId) ?? 0) + 1);
    };
    if (entry.kind === "vessel") bump(entry.id);
    else if (entry.kind === "fairway") {
      bump(entry.from);
      bump(entry.to);
    } else bump(entry.vessel);
  }
  return charged;
}
