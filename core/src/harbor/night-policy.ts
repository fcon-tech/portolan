/**
 * The night policy (night-watch design.md, decision 1; the bound is
 * cumulative since openspec/changes/resurvey-queue, design decision "The
 * night bound becomes cumulative"): which of the standing queue's proposals
 * the night watch may auto-execute. The entire policy is one bound —
 * `harbor.auto_repair_max_vessels` — and one rule with no exceptions:
 *
 *   walking the queue in order, a `repair` row launches iff the bound is
 *   present and positive and its scope's vessels still fit in what remains
 *   of the bound; each launch spends its scope's vessel count, and
 *   everything past the bound stays pending.
 *
 * The bound is spent cumulatively, not per row: after the per-vessel split
 * every repair row holds exactly one vessel, so any positive bound would
 * pass every row and "bounded" would bound nothing. Whether a launch
 * attempt refunds its share on failure is the watch's question
 * (watch.ts, accept-then-append-failure) — not answered here: this policy
 * is pure and knows nothing of outcomes.
 *
 * `new-land` and `gap` proposals are NEVER auto-executed, regardless of the
 * bound — the night watch repairs known coast, it does not explore. Absent,
 * zero, or negative bound means report-only: everything is pending.
 *
 * Pure by construction: proposals and a number in, two lists out, queue
 * order preserved in both. No filesystem, no clock, no harness.
 * openspec/changes/night-watch (harbor capability: auto-repair is bounded
 * and never curious)
 */
import type { Proposal } from "./proposals";

/** What the night policy decided: what may launch, what stays with the Governor. */
export interface NightPolicyResult {
  /** Repair proposals within the bound, in queue order — the watch may launch these. */
  launch: Proposal[];
  /** Everything else, in queue order — left pending for the Governor's decision. */
  pending: Proposal[];
}

/**
 * Apply the night policy to a computed queue. `bound` is the effective
 * `harbor.auto_repair_max_vessels` (absent = 0): 0 or negative means
 * report-only.
 */
export function nightPolicy(proposals: Proposal[], bound: number): NightPolicyResult {
  const launch: Proposal[] = [];
  const pending: Proposal[] = [];
  // Shape-agnostic: a row's cost is its scope's vessel count — one per
  // standing per-vessel repair row, the sum for any grouped shape. A misfit
  // row does not stop the walk: a later smaller row may still fit, and the
  // misfit stays pending for the Governor either way.
  let spent = 0;
  for (const proposal of proposals) {
    const cost = proposal.scope.vessels.length;
    const launches = proposal.kind === "repair" && bound > 0 && spent + cost <= bound;
    if (launches) {
      launch.push(proposal);
      spent += cost;
    } else {
      pending.push(proposal);
    }
  }
  return { launch, pending };
}
