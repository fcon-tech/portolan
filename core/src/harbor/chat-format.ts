/**
 * The chat rendering of the proposal queue and of the night-watch report —
 * the one format the headless CLI posts and the skill's session-start
 * message mirrors (design.md risk: the wording lives here, with a golden
 * test; the skill references it, not copies). Deterministic by
 * construction: the queue in, the same text out, no timestamps. An empty
 * queue renders to the empty string — silence on a still province. The
 * watch report always renders: an invoked watch says what it did, even
 * when what it did was nothing.
 * openspec/changes/harbor-master + openspec/changes/night-watch (harbor
 * capability: the watch report is chat-formatted and deterministic)
 */
import { formatAnchor } from "../types";
import type { Proposal, ProposeResult } from "./proposals";
import type { WatchAction, WatchReport } from "./watch";
import type { RunReport } from "./run";

function scopeLine(proposal: Proposal): string {
  if (proposal.kind === "new-land") {
    // evidence[0] is `<kind>:<path>`; the path may itself contain colons.
    const path = proposal.evidence[0].slice(proposal.evidence[0].indexOf(":") + 1);
    return `full survey of ${path}; no charted vessels there yet`;
  }
  return (
    `vessels ${proposal.scope.vessels.join(", ")} · ` +
    `${proposal.scope.entries} entries · ${proposal.scope.soundings} soundings`
  );
}

/** Render the queue as one postable chat message; "" when the queue is empty. */
export function renderQueueChat(result: ProposeResult): string {
  const { proposals } = result;
  if (proposals.length === 0) return "";
  const lines: string[] = [];
  lines.push(
    `Portolan harbor — ${proposals.length} expedition ${proposals.length === 1 ? "proposal" : "proposals"} for this province.`,
    "",
  );
  for (const [index, proposal] of proposals.entries()) {
    lines.push(`${index + 1}. ${proposal.kind} — ${proposal.summary}`);
    lines.push(`   evidence: ${proposal.anchors.map(formatAnchor).join("; ")}`);
    lines.push(`   scope: ${scopeLine(proposal)}`);
  }
  lines.push(
    "",
    "Accept or decline by number — one phrase is enough; the decision is recorded with expeditions.decide.",
  );
  return `${lines.join("\n")}\n`;
}

/** One proposal as the report's pending entries render it: summary, evidence, scope. */
function proposalLines(proposal: Proposal): string[] {
  return [
    `${proposal.kind} — ${proposal.summary}`,
    `   evidence: ${proposal.anchors.map(formatAnchor).join("; ")}`,
    `   scope: ${scopeLine(proposal)}`,
  ];
}

/** The policy line: the bound, and whether anything could launch at all. */
function watchPolicyLine(report: WatchReport): string {
  const vessels = report.bound === 1 ? "vessel" : "vessels";
  if (report.bound <= 0) {
    return `policy: auto-repair bound 0 ${vessels} — report-only (harbor.auto_repair_max_vessels unset or zero)`;
  }
  if (report.reportOnly) {
    return `policy: auto-repair bound ${report.bound} ${vessels} — report-only (no --launcher configured)`;
  }
  const command = (report.launcherCommand ?? "").trim().split(/\s+/)[0];
  return `policy: auto-repair bound ${report.bound} ${vessels}; launcher ${command}`;
}

function ranLine(action: WatchAction): string {
  return action.outcome === "completed"
    ? "   outcome: completed"
    : `   outcome: launch-failed (${action.reason})`;
}

/**
 * Render the manual run report as one postable chat message: the proposal
 * (kind, summary, evidence, scope), the launcher, and the outcome. Always
 * renders; deterministic — no timestamps, no ambient state. A failure says
 * it stays queued, like the watch report does.
 * openspec/changes/harbor-run (harbor capability: the run report is
 * chat-formatted and deterministic)
 */
export function renderRunChat(report: RunReport): string {
  const lines: string[] = [];
  lines.push(
    "Portolan harbor run — one expedition by the Governor's hand.",
    "",
    ...proposalLines(report.proposal),
    `launcher: ${(report.launcherCommand ?? "").trim().split(/\s+/)[0]}`,
  );
  if (report.outcome === "completed") {
    lines.push("outcome: completed");
  } else {
    lines.push(
      `outcome: launch-failed (${report.reason})`,
      "note: recorded in history; the proposal stays queued for the Governor",
    );
  }
  return `${lines.join("\n")}\n`;
}

/** The night-watch report in chat form: what ran (with outcomes), what was
 * left pending (with evidence summaries), and any launcher failures. Always
 * renders — even a watch that did nothing says so. Deterministic: no
 * timestamps, no ambient state.
 */
export function renderWatchChat(report: WatchReport): string {
  const completed = report.ran.filter((a) => a.outcome === "completed");
  const failed = report.ran.filter((a) => a.outcome === "launch-failed");

  const lines: string[] = [];
  lines.push(
    `Portolan night watch — ${completed.length} launched, ${report.pending.length} pending, ${failed.length} failed.`,
    "",
    watchPolicyLine(report),
  );

  lines.push("ran:");
  if (completed.length === 0) {
    lines.push(
      failed.length > 0
        ? "none — every attempted launch failed (see launch failures)"
        : "none"
    );
  }
  for (const [index, action] of completed.entries()) {
    lines.push(`${index + 1}. ${action.proposal.kind} — ${action.proposal.summary}`);
    lines.push(ranLine(action));
  }

  lines.push("pending:");
  if (report.pending.length === 0) lines.push("none");
  for (const [index, proposal] of report.pending.entries()) {
    for (const [lineNo, line] of proposalLines(proposal).entries()) {
      lines.push(lineNo === 0 ? `${index + 1}. ${line}` : line);
    }
  }

  lines.push("launch failures:");
  if (failed.length === 0) lines.push("none");
  for (const [index, action] of failed.entries()) {
    lines.push(`${index + 1}. ${action.proposal.kind} — ${action.proposal.summary}`);
    lines.push(`   failure: ${action.reason}`);
    lines.push("   note: recorded in history; the proposal stays queued for the Governor");
  }

  return `${lines.join("\n")}\n`;
}
