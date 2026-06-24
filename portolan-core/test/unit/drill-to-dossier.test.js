/**
 * Unit tests for drill-to-dossier use-case.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { drillToDossier, buildIndex } = require('../../src/use-cases/drill-to-dossier');

function atlas() {
  return {
    objects: {
      components: [
        { id: 'component:hbase', display_name: 'HBase', surface_ids: ['surf:docs'], relationship_ids: ['rel:1'], finding_ids: ['find:1'], unknown_ids: ['unk:1'], repository_ids: ['repo:1'] },
      ],
      repositories: [{ id: 'repo:1', display_name: 'repo' }],
      surfaces: [{ id: 'surf:docs', label: 'docs', owner_id: 'component:hbase' }],
      relationships: [{ id: 'rel:1', from_id: 'component:hbase', to_id: 'component:hadoop' }],
      findings: [{ id: 'find:1', summary: 'risk' }],
      unknowns: [{ id: 'unk:1', summary: 'gap' }],
    },
  };
}

test('drillToDossier: resolves a component by id', () => {
  const d = drillToDossier(atlas(), 'component:hbase');
  assert.ok(d);
  assert.strictEqual(d.kind, 'component');
  assert.strictEqual(d.object.id, 'component:hbase');
});

test('drillToDossier: resolves related surfaces/relationships/findings/unknowns/repositories', () => {
  const d = drillToDossier(atlas(), 'component:hbase');
  assert.strictEqual(d.related.surfaces.length, 1);
  assert.strictEqual(d.related.relationships.length, 1);
  assert.strictEqual(d.related.findings.length, 1);
  assert.strictEqual(d.related.unknowns.length, 1);
  assert.strictEqual(d.related.repositories.length, 1);
});

test('drillToDossier: component: prefix fallback works', () => {
  const d = drillToDossier(atlas(), 'hbase');
  assert.ok(d);
  assert.strictEqual(d.object.id, 'component:hbase');
});

test('drillToDossier: unknown id returns null', () => {
  const d = drillToDossier(atlas(), 'component:ghost');
  assert.strictEqual(d, null);
});

test('drillToDossier: resolves a surface by id', () => {
  const d = drillToDossier(atlas(), 'surf:docs');
  assert.ok(d);
  assert.strictEqual(d.kind, 'surface');
});

test('buildIndex: indexes all object kinds', () => {
  const idx = buildIndex(atlas());
  assert.ok(idx.has('component:hbase'));
  assert.ok(idx.has('repo:1'));
  assert.ok(idx.has('surf:docs'));
  assert.ok(idx.has('rel:1'));
  assert.ok(idx.has('find:1'));
  assert.ok(idx.has('unk:1'));
});

test('drillToDossier: object with no related ids yields empty arrays, not undefined', () => {
  const a = { objects: { components: [{ id: 'component:lone', display_name: 'Lone' }], repositories: [], surfaces: [], relationships: [], findings: [], unknowns: [] } };
  const d = drillToDossier(a, 'component:lone');
  assert.deepStrictEqual(d.related.surfaces, []);
  assert.deepStrictEqual(d.related.relationships, []);
});
