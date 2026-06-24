/**
 * Unit tests for triangulate use-case — detect conflicts between the three
 * truths (behaviour, intentions, representations) and return triangulation
 * findings for the overlay.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { triangulate, canTriangulate } = require('../../src/use-cases/triangulate');

test('canTriangulate: false when no hypotheses (behaviour-only atlas)', () => {
  const atlas = { objects: { components: [], hypotheses: [] } };
  assert.strictEqual(canTriangulate(atlas), false);
});

test('canTriangulate: true when hypotheses with triangulation-conflict exist', () => {
  const atlas = {
    objects: {
      components: [{ id: 'c:a', display_name: 'A', evidence: { state: 'source-visible' } }],
      hypotheses: [{ id: 'h:1', claim: 'doc stale', confidence: 'hypothesis-with-facts', producer_family: 'agent', finding_type: 'triangulation-conflict', evidence: { state: 'source-visible', source: 's', producer: 'agent' }, affected_ids: ['c:a'] }],
    },
  };
  assert.strictEqual(canTriangulate(atlas), true);
});

test('triangulate: returns conflicts grouped by affected unit', () => {
  const atlas = {
    objects: {
      components: [
        { id: 'c:a', display_name: 'A', evidence: { state: 'source-visible' } },
        { id: 'c:b', display_name: 'B', evidence: { state: 'source-visible' } },
      ],
      hypotheses: [
        { id: 'h:1', claim: 'doc describes removed service', confidence: 'hypothesis-with-facts', producer_family: 'agent', finding_type: 'triangulation-conflict', evidence: { state: 'source-visible', source: 'commit:x', producer: 'agent' }, affected_ids: ['c:a'] },
        { id: 'h:2', claim: 'ticket references dead code', confidence: 'hypothesis', producer_family: 'agent', finding_type: 'triangulation-conflict', evidence: { state: 'claim-only', source: 'ticket:42', producer: 'agent' }, affected_ids: ['c:a', 'c:b'] },
        { id: 'h:3', claim: 'duplication found', confidence: 'hypothesis', producer_family: 'agent', finding_type: 'duplication', evidence: { state: 'source-visible', source: 's', producer: 'agent' }, affected_ids: ['c:b'] },
      ],
    },
  };
  const result = triangulate(atlas);
  // only triangulation-conflict findings are conflicts (not duplication)
  assert.ok(result.conflicts.length >= 2);
  // grouped by unit
  assert.ok(result.byUnit['c:a']);
  assert.ok(result.byUnit['c:b']);
});

test('triangulate: returns empty conflicts when no triangulation-conflict hypotheses', () => {
  const atlas = {
    objects: {
      components: [{ id: 'c:a', display_name: 'A', evidence: { state: 'source-visible' } }],
      hypotheses: [{ id: 'h:1', claim: 'dup', confidence: 'hypothesis', producer_family: 'agent', finding_type: 'duplication', evidence: { state: 'source-visible', source: 's', producer: 'agent' }, affected_ids: ['c:a'] }],
    },
  };
  const result = triangulate(atlas);
  assert.strictEqual(result.conflicts.length, 0);
});

test('triangulate: behaviour-only atlas returns empty (no hypotheses)', () => {
  const atlas = { objects: { components: [{ id: 'c:a', display_name: 'A', evidence: { state: 'source-visible' } }] } };
  const result = triangulate(atlas);
  assert.strictEqual(result.conflicts.length, 0);
  assert.strictEqual(canTriangulate(atlas), false);
});

test('triangulate: conflict carries the affected unit id + claim + confidence', () => {
  const atlas = {
    objects: {
      components: [{ id: 'c:a', display_name: 'A', evidence: { state: 'source-visible' } }],
      hypotheses: [{ id: 'h:1', claim: 'stale doc', confidence: 'hypothesis-with-facts', producer_family: 'agent', finding_type: 'triangulation-conflict', evidence: { state: 'source-visible', source: 'c', producer: 'agent' }, affected_ids: ['c:a'] }],
    },
  };
  const result = triangulate(atlas);
  const c = result.conflicts[0];
  assert.strictEqual(c.unitId, 'c:a');
  assert.ok(c.claim);
  assert.ok(c.confidence);
});
