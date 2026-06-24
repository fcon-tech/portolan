/**
 * Unit tests for add-hypothesis use-case — the agent-producer data path.
 * Writes agent hypotheses (with confidence tags) into the snapshot.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { addHypothesis, addHypotheses, getHypotheses } = require('../../src/use-cases/add-hypothesis');

function emptyAtlas() {
  return {
    schema_version: '0.2.0',
    objects: { components: [], repositories: [], surfaces: [], relationships: [], findings: [], unknowns: [], hypotheses: [] },
  };
}

test('addHypothesis: adds a hypothesis to the atlas', () => {
  const a = emptyAtlas();
  addHypothesis(a, {
    id: 'hypothesis:h1',
    claim: 'Module X is dead code',
    producer_family: 'agent',
    confidence: 'hypothesis-with-facts',
    evidence: { state: 'source-visible', source: 'commit:abc', producer: 'agent' },
    affected_ids: ['component:x'],
    finding_type: 'dead-code',
    route: '#/detail/finding/h1',
  });
  assert.strictEqual(a.objects.hypotheses.length, 1);
  assert.strictEqual(a.objects.hypotheses[0].id, 'hypothesis:h1');
});

test('addHypothesis: creates the hypotheses array if absent', () => {
  const a = { objects: { components: [], repositories: [], surfaces: [], relationships: [], findings: [], unknowns: [] } };
  addHypothesis(a, {
    id: 'hypothesis:h1', claim: 'x', producer_family: 'agent', confidence: 'speculation',
    evidence: { state: 'unknown', source: 'none', producer: 'agent' },
  });
  assert.ok(Array.isArray(a.objects.hypotheses));
  assert.strictEqual(a.objects.hypotheses.length, 1);
});

test('addHypothesis: rejects ironclad from an agent producer (charter rule)', () => {
  const a = emptyAtlas();
  assert.throws(() => addHypothesis(a, {
    id: 'h:h', claim: 'x', producer_family: 'agent', confidence: 'ironclad',
    evidence: { state: 'source-visible', source: 's', producer: 'agent' },
  }), /ironclad/i);
});

test('addHypothesis: accepts ironclad from a deterministic producer', () => {
  const a = emptyAtlas();
  assert.doesNotThrow(() => addHypothesis(a, {
    id: 'h:d', claim: 'x', producer_family: 'deterministic-core', confidence: 'ironclad',
    evidence: { state: 'source-visible', source: 's', producer: 'det' },
  }));
});

test('addHypothesis: downgrades hypothesis-with-facts to hypothesis when evidence source is empty', () => {
  const a = emptyAtlas();
  addHypothesis(a, {
    id: 'h:e', claim: 'x', producer_family: 'agent', confidence: 'hypothesis-with-facts',
    evidence: { state: 'claim-only', source: '', producer: 'agent' },
  });
  assert.strictEqual(a.objects.hypotheses[0].confidence, 'hypothesis');
});

test('addHypothesis: rejects duplicate hypothesis ids', () => {
  const a = emptyAtlas();
  addHypothesis(a, { id: 'h:dup', claim: 'x', producer_family: 'agent', confidence: 'speculation', evidence: { state: 'unknown', source: 'n', producer: 'agent' } });
  assert.throws(() => addHypothesis(a, { id: 'h:dup', claim: 'y', producer_family: 'agent', confidence: 'speculation', evidence: { state: 'unknown', source: 'n', producer: 'agent' } }), /duplicate/i);
});

test('addHypotheses: adds multiple at once', () => {
  const a = emptyAtlas();
  addHypotheses(a, [
    { id: 'h:1', claim: 'a', producer_family: 'agent', confidence: 'hypothesis', evidence: { state: 'unknown', source: 'n', producer: 'agent' } },
    { id: 'h:2', claim: 'b', producer_family: 'agent', confidence: 'speculation', evidence: { state: 'unknown', source: 'n', producer: 'agent' } },
  ]);
  assert.strictEqual(a.objects.hypotheses.length, 2);
});

test('getHypotheses: returns all hypotheses from the atlas', () => {
  const a = emptyAtlas();
  addHypotheses(a, [
    { id: 'h:1', claim: 'a', producer_family: 'agent', confidence: 'hypothesis', evidence: { state: 'unknown', source: 'n', producer: 'agent' } },
  ]);
  const hs = getHypotheses(a);
  assert.strictEqual(hs.length, 1);
  assert.strictEqual(hs[0].id, 'h:1');
});

test('getHypotheses: returns [] when no hypotheses present', () => {
  const a = { objects: { components: [] } };
  assert.deepStrictEqual(getHypotheses(a), []);
});
