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
import { readReceipts } from "../tools/log";
import { computeProposals, type Proposal } from "./proposals";
import { readSettings } from "./settings";
import { nightPolicy } from "./night-policy";
import { briefFor, launchExpedition, DEFAULT_LAUNCHER_TIMEOUT_MS } from "./launcher";
import { appendDecision, appendLaunchFailure, NIGHT_WATCH } from "./history";
import { charterOverreach, latestCharter, type Overreach } from "./charter";

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
  /**
   * The charter the expedition recorded at start (openspec/changes/
   * expedition-charter); absent when it filed none — a pre-change
   * expedition or province reads as absence, never an error (design D4).
   */
  charter?: { vessels: string[]; entries: number };
  /**
   * Out-of-charter chart writes by vessel and entry count, present with
   * the charter; [] reads as kept, out-of-charter vessels as broken. The
   * same shared arithmetic trust.report calls (design D2).
   */
  overreach?: Overreach[];
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
      // The auto-accept records the row's evidence (design D1, amendment
      // 2026-09-06): flare closure matches the recorded evidence.
      appendDecision(targetRoot, proposal.fingerprint, "accepted", {
        by: NIGHT_WATCH,
        evidence: proposal.evidence,
      });
      const result = await launchExpedition({
        launcher: options.launcher as string,
        brief: briefFor(targetRoot, proposal),
        timeoutMs: options.launcherTimeoutMs ?? DEFAULT_LAUNCHER_TIMEOUT_MS,
      });
      if (!result.ok) {
        appendLaunchFailure(targetRoot, proposal.fingerprint, result.reason as string);
      }
      // What the expedition put on record (openspec/changes/expedition-
      // charter): the charter it filed at start and whether its chart
      // writes stayed inside it, read from the ship's log through the same
      // shared arithmetic trust.report calls (design D2 — one function, so
      // the surfaces cannot diverge). The log read cumulatively through
      // this launch is the record this report speaks from: a retry that
      // files nothing reports against the charter already on record, which
      // keeps two watch runs over an unchanged province byte-identical. A
      // log with no charter receipt (a pre-change expedition, design D4)
      // leaves both fields absent.
      const receipts = readReceipts(targetRoot);
      const charter = latestCharter(receipts);
      ran.push({
        proposal,
        outcome: result.ok ? "completed" : "launch-failed",
        ...(result.ok ? {} : { reason: result.reason }),
        ...(charter === undefined
          ? {}
          : {
              charter: { vessels: charter.vessels, entries: charter.entries },
              overreach: charterOverreach(receipts, charter),
            }),
      });
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
