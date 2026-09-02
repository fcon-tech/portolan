/**
 * The resurvey queue's rank (openspec/changes/resurvey-queue/specs/harbor/spec.md,
 * "The repair queue is fan-in ranked"): direct cross-vessel charted
 * fan-in, ties broken by vessel id. The harbor queue orders its repair rows
 * by it and trust.report orders its pending-vessel list by the same rank —
 * one list, one order; this module is the single definition both quote.
 *
 * Deliberately a second definition beside chart.neighborhood's, not a
 * unification of it: the neighborhood counts every charted incoming fairway
 * per entry, while this rank counts per vessel and excludes a vessel's
 * fairways to itself — internal traffic says nothing about how much of the
 * rest of the chart hangs from the vessel. The divergence is pinned by the
 * spec; the helper stays a leaf with exactly those two importers.
 *
 * Arithmetic over charted bytes only: no timestamps and no judgment
 * participate, so two computations over an unchanged chart return the same
 * counts and, sorted by the compare below, the same order.
 */
import type { ChartEntry } from "./types";

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
