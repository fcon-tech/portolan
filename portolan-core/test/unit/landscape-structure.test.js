/**
 * Unit tests for the landscape structure classifier + honesty summary.
 *
 * Authority: openspec/specs/reading-experience
 * ("Landscape view shows connected structure, not a flat inventory").
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const {
  summarizeLandscapeStructure,
  isStructuralEdge,
  isDependencyEdge,
  edgeType,
} = require('../../src/domain/landscape-structure');

test('classify: references is a structural edge', () => {
  assert.strictEqual(isStructuralEdge({ relationship_type: 'references' }), true);
  assert.strictEqual(isDependencyEdge({ relationship_type: 'references' }), false);
});

test('classify: structural types are case/field-insensitive', () => {
  assert.strictEqual(isStructuralEdge({ type: 'References' }), true);
  assert.strictEqual(isStructuralEdge({ relationship_type: 'CALLS' }), true);
  assert.strictEqual(edgeType({ relationship_type: ' Uses ' }), 'uses');
});

test('classify: shared-dependency / depends-on / imports are dependency edges', () => {
  for (const t of ['shared-dependency', 'depends-on', 'imports', 'cross-repo-duplication', 'owns']) {
    assert.strictEqual(isStructuralEdge({ relationship_type: t }), false, `${t} is not structural`);
    assert.strictEqual(isDependencyEdge({ relationship_type: t }), true, `${t} is dependency`);
  }
});

test('classify: an untyped edge is dependency, not structural (no over-claim)', () => {
  assert.strictEqual(isStructuralEdge({}), false);
  assert.strictEqual(isDependencyEdge({}), true);
});

test('summary: dependency-only snapshot produces a limitation notice', () => {
  const rels = [
    { id: 'r1', relationship_type: 'shared-dependency' },
    { id: 'r2', relationship_type: 'depends-on' },
  ];
  const s = summarizeLandscapeStructure(rels);
  assert.strictEqual(s.hasRelationships, true);
  assert.strictEqual(s.hasStructuralEdges, false);
  assert.strictEqual(s.structuralEdgeCount, 0);
  assert.strictEqual(s.dependencyEdgeCount, 2);
  assert.deepStrictEqual(s.dependencyTypes.sort(), ['depends-on', 'shared-dependency']);
  assert.strictEqual(s.structuralTypes.length, 0);
  assert.ok(s.limitationNotice, 'limitation notice present');
  assert.match(s.limitationNotice, /dependency/i);
  assert.match(s.limitationNotice, /not code-level architecture/i);
});

test('summary: snapshot with structural edges has no limitation notice', () => {
  const rels = [
    { id: 'r1', relationship_type: 'references' },
    { id: 'r2', relationship_type: 'shared-dependency' },
  ];
  const s = summarizeLandscapeStructure(rels);
  assert.strictEqual(s.hasStructuralEdges, true);
  assert.strictEqual(s.structuralEdgeCount, 1);
  assert.strictEqual(s.dependencyEdgeCount, 1);
  assert.deepStrictEqual(s.structuralTypes, ['references']);
  assert.strictEqual(s.limitationNotice, null, 'no honesty notice when structure exists');
});

test('summary: zero relationships has no limitation notice (nothing to disguise)', () => {
  const s = summarizeLandscapeStructure([]);
  assert.strictEqual(s.hasRelationships, false);
  assert.strictEqual(s.hasStructuralEdges, false);
  assert.strictEqual(s.dependencyEdgeCount, 0);
  assert.strictEqual(s.limitationNotice, null);
});

test('summary: tolerates non-array input', () => {
  const s = summarizeLandscapeStructure(undefined);
  assert.strictEqual(s.hasRelationships, false);
  assert.strictEqual(s.limitationNotice, null);
});

// ---- use-case wraps the classifier over the atlas envelope ----

test('use-case openLandscapeStructure reads objects.relationships', () => {
  const { openLandscapeStructure } = require('../../src/use-cases/open-landscape-structure');
  const atlas = { objects: { relationships: [{ relationship_type: 'shared-dependency' }] } };
  const s = openLandscapeStructure(atlas);
  assert.strictEqual(s.hasStructuralEdges, false);
  assert.ok(s.limitationNotice);
  // tolerates a missing atlas
  assert.strictEqual(openLandscapeStructure(null).hasRelationships, false);
});
