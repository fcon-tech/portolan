/**
 * Unit tests for the confidence/trust contract (charter 08 Trust Contract).
 *
 * RED phase: confidence.js does not exist yet; these tests drive its creation.
 * Covers: the 4-level spectrum, producer-family assignment rule, the
 * merge/dispute rule (higher-confidence wins), and the evidence-state
 * compatibility matrix.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

// RED: module not yet created.
const {
  CONFIDENCE_LEVELS,
  PRODUCER_FAMILIES,
  confidenceForProducer,
  resolveConflict,
  isEvidenceCompatible,
  downgradeUnresolvable,
  rank,
} = require('../../src/domain/confidence');

test('CONFIDENCE_LEVELS exposes the four levels from low to high', () => {
  assert.ok(Array.isArray(CONFIDENCE_LEVELS));
  // ordered low -> high so rank() can compare.
  assert.deepStrictEqual(CONFIDENCE_LEVELS, ['speculation', 'hypothesis', 'hypothesis-with-facts', 'ironclad']);
});

test('rank: speculation < hypothesis < hypothesis-with-facts < ironclad', () => {
  assert.ok(rank('speculation') < rank('hypothesis'));
  assert.ok(rank('hypothesis') < rank('hypothesis-with-facts'));
  assert.ok(rank('hypothesis-with-facts') < rank('ironclad'));
});

test('PRODUCER_FAMILIES: deterministic-core producers may only emit ironclad', () => {
  assert.strictEqual(confidenceForProducer('deterministic-core'), 'ironclad');
  assert.strictEqual(confidenceForProducer('portolan-system-map'), 'ironclad');
});

test('confidenceForProducer: agent producers may emit non-ironclad levels', () => {
  // Agent producers default to hypothesis; specific level is set per-assertion
  // by the caller, but they can NEVER emit ironclad.
  assert.notStrictEqual(confidenceForProducer('agent'), 'ironclad');
  assert.notStrictEqual(confidenceForProducer('agent-producer'), 'ironclad');
});

test('confidenceForProducer: unknown producer family defaults to speculation', () => {
  assert.strictEqual(confidenceForProducer('mystery-producer'), 'speculation');
});

test('resolveConflict: deterministic-core beats agent (ironclad authoritative)', () => {
  // Charter: deterministic producer wins on its domain; agent recorded as finding.
  const r = resolveConflict(
    { confidence: 'ironclad', producer: 'deterministic-core' },
    { confidence: 'hypothesis', producer: 'agent' },
  );
  assert.strictEqual(r.winner.confidence, 'ironclad');
  assert.ok(r.disagreement, 'a disagreement finding should be emitted');
});

test('resolveConflict: two agents — higher confidence wins', () => {
  const r = resolveConflict(
    { confidence: 'hypothesis-with-facts', producer: 'agent' },
    { confidence: 'speculation', producer: 'agent' },
  );
  assert.strictEqual(r.winner.confidence, 'hypothesis-with-facts');
  assert.ok(r.disagreement, 'disagreement between agents is recorded');
});

test('resolveConflict: equal confidence — first assertion wins, disagreement recorded', () => {
  const r = resolveConflict(
    { confidence: 'hypothesis', producer: 'agent', id: 'a' },
    { confidence: 'hypothesis', producer: 'agent', id: 'b' },
  );
  assert.strictEqual(r.winner.id, 'a');
  assert.ok(r.disagreement);
});

test('resolveConflict: identical assertions (same confidence + claim) — no disagreement', () => {
  const r = resolveConflict(
    { confidence: 'ironclad', producer: 'det', claim: 'X depends-on Y' },
    { confidence: 'ironclad', producer: 'det', claim: 'X depends-on Y' },
  );
  assert.strictEqual(r.disagreement, false);
});

test('isEvidenceCompatible: ironclad requires source/metadata/runtime-visible', () => {
  assert.ok(isEvidenceCompatible('ironclad', 'source-visible'));
  assert.ok(isEvidenceCompatible('ironclad', 'metadata-visible'));
  assert.ok(isEvidenceCompatible('ironclad', 'runtime-visible'));
  assert.strictEqual(isEvidenceCompatible('ironclad', 'claim-only'), false);
  assert.strictEqual(isEvidenceCompatible('ironclad', 'unknown'), false);
});

test('isEvidenceCompatible: hypothesis-with-facts allowed for source/metadata/claim states', () => {
  assert.ok(isEvidenceCompatible('hypothesis-with-facts', 'source-visible'));
  assert.ok(isEvidenceCompatible('hypothesis-with-facts', 'metadata-visible'));
  assert.ok(isEvidenceCompatible('hypothesis-with-facts', 'claim-only'));
});

test('isEvidenceCompatible: hypothesis/speculation broadly permissive', () => {
  assert.ok(isEvidenceCompatible('hypothesis', 'claim-only'));
  assert.ok(isEvidenceCompatible('hypothesis', 'unknown'));
  assert.ok(isEvidenceCompatible('speculation', 'claim-only'));
  assert.ok(isEvidenceCompatible('speculation', 'unknown'));
});

test('downgradeUnresolvable: hypothesis-with-facts with empty evidence source -> hypothesis', () => {
  // Charter: an agent asserting hypothesis-with-facts must carry a resolvable
  // evidence pointer; empty/unresolvable source is downgraded to hypothesis.
  assert.strictEqual(downgradeUnresolvable('hypothesis-with-facts', ''), 'hypothesis');
  assert.strictEqual(downgradeUnresolvable('hypothesis-with-facts', null), 'hypothesis');
  assert.strictEqual(downgradeUnresolvable('hypothesis-with-facts', undefined), 'hypothesis');
});

test('downgradeUnresolvable: hypothesis-with-facts WITH a source stays', () => {
  assert.strictEqual(downgradeUnresolvable('hypothesis-with-facts', 'commit:abc123'), 'hypothesis-with-facts');
});

test('downgradeUnresolvable: other levels are unaffected by evidence presence', () => {
  assert.strictEqual(downgradeUnresolvable('ironclad', ''), 'ironclad');
  assert.strictEqual(downgradeUnresolvable('speculation', ''), 'speculation');
  assert.strictEqual(downgradeUnresolvable('hypothesis', null), 'hypothesis');
});
