/**
 * The night policy (night-watch design.md, decision 1): which of the
 * standing queue's proposals the night watch may auto-execute. The entire
 * policy is one bound — `harbor.auto_repair_max_vessels` — and one rule
 * with no exceptions:
 *
 *   a proposal launches iff it is a `repair` whose affected vessel count is
 *   within the bound (and the bound is present and positive);
 *
 * `new-land` and `gap` proposals are NEVER auto-executed, regardless of the
 * bound — the night watch repairs known coast, it does not explore. Absent
 * or zero bound means report-only: everything is pending.
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
  for (const proposal of proposals) {
    const withinBound =
      proposal.kind === "repair" &&
      bound > 0 &&
      proposal.scope.vessels.length <= bound;
    if (withinBound) launch.push(proposal);
    else pending.push(proposal);
  }
  return { launch, pending };
}
