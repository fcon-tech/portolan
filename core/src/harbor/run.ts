/**
 * The manual single-proposal run (openspec/changes/harbor-run): the
 * Governor names one fingerprint from the computed queue and launches
 * exactly that expedition through the external launcher — any kind
 * (repair, gap, new-land), because the Governor's explicit choice
 * overrides the night policy bounds while the policy itself stands.
 *
 * History semantics mirror the watch (accept-then-append-failure): the
 * launch is accepted `by: governor` before spawning; a launcher failure
 * appends `launch-failed` — the latest word — leaving the proposal
 * effectively not-accepted and queued. A launcher is required (a
 * report-only run is a contradiction); an unknown fingerprint is a loud
 * input error that writes nothing.
 */
import { computeProposals, type Proposal } from "./proposals";
import { briefFor, launchExpedition, DEFAULT_LAUNCHER_TIMEOUT_MS } from "./launcher";
import { appendDecision, appendLaunchFailure, GOVERNOR } from "./history";
import { HarborError } from "./errors";

export interface RunOptions {
  /** The fingerprint to launch, exactly as expeditions.propose returned it. */
  fingerprint: string;
  /** The external launcher command (argv template); required — no report-only run. */
  launcher: string;
  /** Per-launch timeout in milliseconds; default 30m. */
  launcherTimeoutMs?: number;
}

/** The run report: the one proposal, and how its launch ended. */
export interface RunReport {
  proposal: Proposal;
  outcome: "completed" | "launch-failed";
  /** Deterministic failure reason; present iff launch-failed. */
  reason?: string;
  /** The launcher command the run used. */
  launcherCommand: string;
}

/**
 * Launch one named proposal. Throws HarborError for input faults (unknown
 * fingerprint, missing launcher) BEFORE writing any history; a launcher
 * failure is an outcome (recorded, named in the report), never a throw.
 */
export async function runProposal(targetRoot: string, options: RunOptions): Promise<RunReport> {
  if (typeof options.launcher !== "string" || options.launcher.length === 0) {
    throw new HarborError("run: --launcher is required — a manual run launches; use propose to list");
  }
  const { proposals } = computeProposals(targetRoot);
  const proposal = proposals.find((p) => p.fingerprint === options.fingerprint);
  if (proposal === undefined) {
    throw new HarborError(
      `run: fingerprint ${options.fingerprint} names no proposal in the current queue — run propose and copy the fingerprint exactly`,
    );
  }

  appendDecision(targetRoot, proposal.fingerprint, "accepted", { by: GOVERNOR });
  const result = await launchExpedition({
    launcher: options.launcher,
    brief: briefFor(targetRoot, proposal),
    timeoutMs: options.launcherTimeoutMs ?? DEFAULT_LAUNCHER_TIMEOUT_MS,
  });
  if (result.ok) {
    return { proposal, outcome: "completed", launcherCommand: options.launcher };
  }
  appendLaunchFailure(targetRoot, proposal.fingerprint, result.reason as string, { by: GOVERNOR });
  return {
    proposal,
    outcome: "launch-failed",
    reason: result.reason,
    launcherCommand: options.launcher,
  };
}
