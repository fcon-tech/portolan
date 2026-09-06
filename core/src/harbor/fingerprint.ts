/**
 * The proposal fingerprint: a stable identity for one expedition proposal,
 * computed from exactly its kind and its evidence keys (design.md,
 * decision 3). Timestamps are excluded on purpose — unchanged evidence
 * keeps the fingerprint stable, which is what makes refusal-respect
 * possible; drift growth or new land changes the evidence set and therefore
 * the fingerprint, which is what reopens a declined proposal.
 *
 * Evidence keys are plain strings owned by the proposal engine
 * (`vessel/<id>#<stale-entry-count>` for drift — the drift-sensitive count
 * reopens a declined vessel when its drift changes, the count-less
 * `vessel/<id>` for flare-only rows — vessel-scoped so two vessels' rows
 * never share a fingerprint, `vessel/<id>#<pass>` for gaps, `<kind>:<path>`
 * for landscape entries).
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

// ---------------------------------------------------------------------------
// The evidence-key grammar, parsed in one place. Evidence keys are plain
// strings minted by the proposal engine; readers (refusal-respect, flare
// closure) must match their shapes exactly — a free-text flare reason can
// begin with `vessel/<id>#`, so a prefix match would misparse it as drift
// (code-review fix 2026-09-06).
// ---------------------------------------------------------------------------

/** The exact shape of a drift evidence key: `vessel/<id>#<digits>`. */
const DRIFT_KEY = /^vessel\/(.+)#(\d+)$/;

/** The exact shape of a count-less vessel key: `vessel/<id>` — no `#`. */
const PLAIN_VESSEL_KEY = /^vessel\/([^#]+)$/;

/**
 * The stale-entry count a drift evidence key carries, or undefined for any
 * other key (gap keys' suffix names a pass, flare reasons are free text).
 */
export function driftEntryCount(key: string): number | undefined {
  const match = DRIFT_KEY.exec(key);
  return match === null ? undefined : Number(match[2]);
}

/**
 * The vessel an evidence key names — a drift key (`vessel/<id>#<count>`) or
 * the count-less flare-row key (`vessel/<id>`) — or undefined for any other
 * key. A gap key (`vessel/<id>#<pass>`) names a pass, not a vessel here.
 */
export function evidenceVessel(key: string): string | undefined {
  const drift = DRIFT_KEY.exec(key);
  if (drift !== null) return drift[1];
  const plain = PLAIN_VESSEL_KEY.exec(key);
  return plain === null ? undefined : plain[1];
}
