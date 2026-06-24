/**
 * Domain: the confidence/trust contract (charter 08 "Trust Contract").
 *
 * Single responsibility: the 4-level confidence spectrum, the rule binding a
 * confidence level to the producing family (deterministic -> ironclad only;
 * agent -> the rest), the merge/dispute rule for conflicting assertions, and
 * the evidence-state compatibility matrix. Pure functions, zero dependencies.
 *
 * This is the product's spine — every assertion in the atlas carries a
 * confidence level. It is ORTHOGONAL to evidence.state (which describes the
 * source of an observation); confidence describes the trustworthiness of an
 * assertion.
 *
 * Target-state: the frozen 0.1.0 schema has no `confidence` field. This module
 * is the 0.2.0 contract; it is usable now for in-memory reasoning and will be
 * wired into the schema at the 0.2.0 migration.
 *
 * Domain layer — zero dependencies.
 */
'use strict';

/**
 * The four confidence levels, ordered low -> high so rank() compares numerically.
 * @readonly
 */
const CONFIDENCE_LEVELS = ['speculation', 'hypothesis', 'hypothesis-with-facts', 'ironclad'];

const RANK = new Map(CONFIDENCE_LEVELS.map((lvl, i) => [lvl, i]));

/**
 * Producer families recognised by the confidence contract.
 * - deterministic producers (the static-analysis core) may emit ironclad only.
 * - agent producers may emit any non-ironclad level.
 * - unknown producers default to speculation (most conservative).
 */
const DETERMINISTIC_PRODUCERS = new Set([
  'deterministic-core',
  'portolan-system-map',
  'atlas-surfaces',
  'atlas-facts',
  'repo-discovery',
  'repo-profiles',
  'corpus-manifest',
]);

const AGENT_PRODUCERS = new Set([
  'agent',
  'agent-producer',
]);

/**
 * Numeric rank of a confidence level (0 = speculation, 3 = ironclad).
 * Unknown levels map to -1 (lower than anything, so they lose conflicts).
 * @param {string} level
 * @returns {number}
 */
function rank(level) {
  return RANK.has(level) ? RANK.get(level) : -1;
}

/**
 * The confidence level a producer family is allowed to emit by default.
 * Deterministic producers -> ironclad. Agent producers -> hypothesis (the
 * caller may raise it to hypothesis-with-facts when evidence is cited, but never
 * to ironclad). Unknown producers -> speculation.
 *
 * @param {string} producerFamily
 * @returns {string} a confidence level
 */
function confidenceForProducer(producerFamily) {
  if (DETERMINISTIC_PRODUCERS.has(producerFamily)) return 'ironclad';
  if (AGENT_PRODUCERS.has(producerFamily)) return 'hypothesis';
  return 'speculation';
}

/**
 * Whether a producer family may emit a given confidence level.
 * Deterministic producers may only emit ironclad; everyone else may emit
 * anything except ironclad.
 */
function canEmit(producerFamily, level) {
  if (level === 'ironclad') return DETERMINISTIC_PRODUCERS.has(producerFamily);
  return !DETERMINISTIC_PRODUCERS.has(producerFamily) || level !== 'ironclad';
}

/**
 * Resolve a conflict between two assertions about the same fact.
 *
 * Rules (charter 08 merge/dispute rule):
 *  - deterministic-core always wins on its domain; the loser is recorded as a
 *    finding (hypothesis) so the disagreement is visible.
 *  - two agents: higher confidence wins; disagreement recorded.
 *  - equal confidence: the first assertion wins (stable); disagreement recorded.
 *  - identical assertions (same confidence + claim): no disagreement.
 *
 * @param {object} a - first assertion {confidence, producer, claim?, id?}
 * @param {object} b - second assertion {confidence, producer, claim?, id?}
 * @returns {{winner: object, loser: object, disagreement: boolean}}
 */
function resolveConflict(a, b) {
  // Two assertions are "identical" (no disagreement) only when they make the
  // same claim at the same confidence. An empty claim cannot establish identity
  // — two distinct assertions (different ids) that happen to omit a claim are
  // still potentially disagreeing.
  const claimA = a.claim || '';
  const claimB = b.claim || '';
  const identical = a.confidence === b.confidence && claimA !== '' && claimA === claimB;
  if (identical) return { winner: a, loser: b, disagreement: false };

  const aDet = DETERMINISTIC_PRODUCERS.has(a.producer);
  const bDet = DETERMINISTIC_PRODUCERS.has(b.producer);
  // Deterministic core is authoritative on its domain regardless of the
  // nominal level ordering.
  if (aDet && !bDet) return { winner: a, loser: b, disagreement: true };
  if (bDet && !aDet) return { winner: b, loser: a, disagreement: true };

  // Both same family (or both non-deterministic): higher confidence wins;
  // ties go to the first assertion.
  const ra = rank(a.confidence);
  const rb = rank(b.confidence);
  const aWins = ra >= rb;
  return { winner: aWins ? a : b, loser: aWins ? b : a, disagreement: true };
}

/**
 * Evidence-state compatibility matrix (charter 08). Determines whether a
 * confidence level may coexist with a given evidence.state.
 *
 *   ironclad             -> source-visible | metadata-visible | runtime-visible
 *   hypothesis-with-facts-> source/metadata/runtime/claim-only
 *   hypothesis           -> any (typically claim-only/unknown)
 *   speculation          -> any
 *
 * @param {string} confidence
 * @param {string} evidenceState
 * @returns {boolean}
 */
function isEvidenceCompatible(confidence, evidenceState) {
  const src = String(evidenceState || '');
  switch (confidence) {
    case 'ironclad':
      return src === 'source-visible' || src === 'metadata-visible' || src === 'runtime-visible';
    case 'hypothesis-with-facts':
      return src === 'source-visible' || src === 'metadata-visible' ||
        src === 'runtime-visible' || src === 'claim-only';
    case 'hypothesis':
    case 'speculation':
      return true;
    default:
      return false;
  }
}

/**
 * Downgrade a `hypothesis-with-facts` assertion whose evidence source is empty
 * or unresolvable to `hypothesis` (charter: validation failure -> downgrade).
 * Other levels pass through unchanged.
 *
 * @param {string} confidence
 * @param {string} evidenceSource - the resolvable evidence pointer (may be empty)
 * @returns {string} the (possibly downgraded) confidence level
 */
function downgradeUnresolvable(confidence, evidenceSource) {
  if (confidence === 'hypothesis-with-facts' && !evidenceSource) {
    return 'hypothesis';
  }
  return confidence;
}

module.exports = {
  CONFIDENCE_LEVELS,
  DETERMINISTIC_PRODUCERS,
  AGENT_PRODUCERS,
  PRODUCER_FAMILIES: { DETERMINISTIC_PRODUCERS, AGENT_PRODUCERS },
  rank,
  confidenceForProducer,
  canEmit,
  resolveConflict,
  isEvidenceCompatible,
  downgradeUnresolvable,
};
