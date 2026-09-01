/**
 * The night watch (openspec/changes/night-watch): queue → night policy →
 * external launcher → harbor history → chat report. Designed for external
 * schedulers (cron/CI); Portolan still ships no daemon — nothing here runs
 * on a timer, only when invoked.
 *
 * Semantics pinned by design.md:
 * - decision 1: the whole policy is `harbor.auto_repair_max_vessels`
 *   (absent/0 = report-only); repairs within the bound launch, new-land and
 *   gap never do.
 * - decision 2: the launcher is external and swappable (argv from
 *   `--launcher`, the `{ target, proposal }` brief as JSON on stdin, capped
 *   by a timeout); with no launcher configured the watch is report-only
 *   even with a bound set — the core names no harness.
 * - decision 3: accept-then-append-failure. The auto-accept (`by:
 *   night-watch`) is written before launch; a failed launch appends a
 *   `launch-failed` outcome, which is the latest word on the fingerprint,
 *   so a failed proposal is effectively not-accepted and stays queued (the
 *   queue filters on `declined` only).
 *
 * Determinism: the report carries no timestamps — two watch runs over an
 * unchanged province (same launcher behavior) emit byte-identical reports.
 */
import { computeProposals, type Proposal } from "./proposals";
import { readSettings } from "./settings";
import { nightPolicy } from "./night-policy";
import { briefFor, launchExpedition, DEFAULT_LAUNCHER_TIMEOUT_MS } from "./launcher";
import { appendDecision, appendLaunchFailure, NIGHT_WATCH } from "./history";

/** What the watch was told at invocation. */
export interface WatchOptions {
  /** The external launcher command (argv template); absent = report-only. */
  launcher?: string;
  /** Per-launch timeout in milliseconds; default 30m (DEFAULT_LAUNCHER_TIMEOUT_MS). */
  launcherTimeoutMs?: number;
}

/** One launch the watch attempted, with its outcome. */
export interface WatchAction {
  proposal: Proposal;
  outcome: "completed" | "launch-failed";
  /** Deterministic failure reason; present iff the outcome is launch-failed. */
  reason?: string;
}

/** The watch report's data: what ran, what stayed pending, and the policy that decided. */
export interface WatchReport {
  /** The effective `harbor.auto_repair_max_vessels` (absent = 0). */
  bound: number;
  /** True when nothing could launch at all (no launcher configured, or bound 0). */
  reportOnly: boolean;
  /** The launcher command the run used, when one was configured. */
  launcherCommand?: string;
  /** Every launch attempted this run, in queue order, with outcomes. */
  ran: WatchAction[];
  /** Proposals left for the Governor, in queue order, with their evidence. */
  pending: Proposal[];
}

/**
 * Run the night watch against a province: compute the queue, apply the
 * night policy, launch what qualifies through the external launcher
 * (recording each auto-accept `by night-watch` first, appending
 * `launch-failed` on failure), and return the report data. Never launches
 * anything and writes no history when report-only.
 */
export async function runWatch(targetRoot: string, options: WatchOptions = {}): Promise<WatchReport> {
  const { harbor } = readSettings(targetRoot);
  const bound = harbor.autoRepairMaxVessels ?? 0;

  const { proposals } = computeProposals(targetRoot);
  const { launch, pending } = nightPolicy(proposals, bound);

  // Report-only (no launcher, or bound 0): nothing can launch, so what the
  // policy would have launched folds back into pending — the report always
  // shows the Governor every outstanding proposal.
  const reportOnly = options.launcher === undefined || bound <= 0;
  const ran: WatchAction[] = [];
  if (!reportOnly) {
    for (const proposal of launch) {
      appendDecision(targetRoot, proposal.fingerprint, "accepted", { by: NIGHT_WATCH });
      const result = await launchExpedition({
        launcher: options.launcher as string,
        brief: briefFor(targetRoot, proposal),
        timeoutMs: options.launcherTimeoutMs ?? DEFAULT_LAUNCHER_TIMEOUT_MS,
      });
      if (result.ok) {
        ran.push({ proposal, outcome: "completed" });
      } else {
        appendLaunchFailure(targetRoot, proposal.fingerprint, result.reason as string);
        ran.push({ proposal, outcome: "launch-failed", reason: result.reason });
      }
    }
  }

  return {
    bound,
    reportOnly,
    ...(options.launcher !== undefined ? { launcherCommand: options.launcher } : {}),
    ran,
    pending: reportOnly ? proposals : pending,
  };
}
