/**
 * The chat rendering of the proposal queue — the one format the headless
 * CLI posts and the skill's session-start message mirrors (design.md risk:
 * the wording lives here, with a golden test; the skill references it, not
 * copies). Deterministic by construction: the queue in, the same text out,
 * no timestamps. An empty queue renders to the empty string — silence on a
 * still province.
 */
import { formatAnchor } from "../types";
import type { Proposal, ProposeResult } from "./proposals";

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
