/**
 * The proposal fingerprint: a stable identity for one expedition proposal,
 * computed from exactly its kind and its evidence keys (design.md,
 * decision 3). Timestamps are excluded on purpose — unchanged evidence
 * keeps the fingerprint stable, which is what makes refusal-respect
 * possible; drift growth or new land changes the evidence set and therefore
 * the fingerprint, which is what reopens a declined proposal.
 *
 * Evidence keys are plain strings owned by the proposal engine
 * (`vessel/<id>` for drift, `vessel/<id>#<pass>` for gaps,
 * `<kind>:<path>` for landscape entries).
 */
import { createHash } from "node:crypto";

/** The three proposal kinds, in the order the harbor capability names them. */
export const PROPOSAL_KINDS = ["repair", "gap", "new-land"] as const;

export type ProposalKind = (typeof PROPOSAL_KINDS)[number];

/**
 * sha256 over `kind` + the sorted, deduplicated evidence keys. Order of the
 * input keys is irrelevant — the same evidence always yields the same
 * fingerprint; any change to the evidence set yields a different one.
 */
export function proposalFingerprint(kind: ProposalKind, evidenceKeys: string[]): string {
  const keys = [...new Set(evidenceKeys)].sort();
  return createHash("sha256").update(`${kind}\n${keys.join("\n")}`).digest("hex");
}
