/**
 * Direct unit tests for query-atlas use-case + its pure helpers.
 *
 * Fills the coverage gap: the old viewer tested parseLimit/wrapResult only
 * transitively through the bundle-query dispatch. These test the pure
 * use-case directly with an in-memory map (no fs).
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { queryAtlas, parseLimit, wrapResult, DEFAULT_LIMIT, MAX_LIMIT } = require('../../src/use-cases/query-atlas');

function sampleMap() {
  return {
    schema_version: '0.1.0',
    target: { id: 'target:root', display_name: 'root' },
    objects: {
      components: [
        { id: 'component:a', display_name: 'Alpha', role: 'database', surface_type: '', type: 'application', relationship_type: '', kind: '', family: '', level: '' },
        { id: 'component:b', display_name: 'Beta', role: 'batch', surface_type: '', type: 'application', relationship_type: '', kind: '', family: '', level: '' },
      ],
      repositories: [],
      surfaces: [
        { id: 'surf:docs', display_name: 'Docs', label: 'd', surface_type: 'docs', kind: '', type: '', relationship_type: '', family: '', level: '' },
      ],
      relationships: [],
      findings: [],
      unknowns: [],
    },
    c4: { context_boxes: [], families: [], component_boxes: [] },
  };
}

test('parseLimit: valid number within range passes through', () => {
  assert.strictEqual(parseLimit(5), 5);
  assert.strictEqual(parseLimit('10'), 10);
});

test('parseLimit: clamps to MAX_LIMIT', () => {
  assert.strictEqual(parseLimit(99999), MAX_LIMIT);
});

test('parseLimit: non-finite / <1 falls back to default', () => {
  assert.strictEqual(parseLimit(0), DEFAULT_LIMIT);
  assert.strictEqual(parseLimit(-5), DEFAULT_LIMIT);
  assert.strictEqual(parseLimit('abc'), DEFAULT_LIMIT);
  assert.strictEqual(parseLimit(NaN), DEFAULT_LIMIT);
  assert.strictEqual(parseLimit(undefined), DEFAULT_LIMIT);
});

test('parseLimit: explicit fallback overrides DEFAULT_LIMIT', () => {
  assert.strictEqual(parseLimit('abc', 42), 42);
});

test('wrapResult: truncates records to limit and reports truncation', () => {
  const recs = [1, 2, 3, 4, 5];
  const r = wrapResult({ section: 'x' }, recs, 5, 2);
  assert.deepStrictEqual(r.records, [1, 2]);
  assert.strictEqual(r.truncated, true);
  assert.strictEqual(r.truncated_records, 3);
  assert.strictEqual(r.total_records, 5);
});

test('wrapResult: no truncation when records fit', () => {
  const recs = [1, 2];
  const r = wrapResult({ section: 'x' }, recs, 2, 10);
  assert.strictEqual(r.truncated, false);
  assert.strictEqual(r.truncated_records, 0);
});

test('wrapResult: explicit truncated option overrides computed value', () => {
  const recs = [1, 2, 3];
  const r = wrapResult({ section: 'x' }, recs, 3, 3, [], { truncated: true });
  assert.strictEqual(r.truncated, true);
  assert.strictEqual(r.truncated_records, 0);
});

test('wrapResult: carries schema_version + warnings', () => {
  const r = wrapResult({ section: 'x' }, [], 0, 10, ['warn']);
  assert.strictEqual(r.schema_version, '0.1.0');
  assert.deepStrictEqual(r.warnings, ['warn']);
});

test('queryAtlas: overview section returns counts + c4 families', () => {
  const r = queryAtlas(sampleMap(), { section: 'overview' });
  assert.strictEqual(r.records.length, 1);
  assert.strictEqual(r.records[0].counts.components, 2);
  assert.strictEqual(r.records[0].counts.surfaces, 1);
  assert.strictEqual(r.total_records, 1);
});

test('queryAtlas: components section returns all components', () => {
  const r = queryAtlas(sampleMap(), { section: 'components' });
  assert.strictEqual(r.records.length, 2);
  assert.strictEqual(r.records[0].id, 'component:a');
});

test('queryAtlas: text filter searches display_name', () => {
  const r = queryAtlas(sampleMap(), { section: 'components', q: 'alph' });
  assert.strictEqual(r.records.length, 1);
  assert.strictEqual(r.records[0].id, 'component:a');
});

test('queryAtlas: text filter is case-insensitive', () => {
  const r = queryAtlas(sampleMap(), { section: 'components', q: 'BETA' });
  assert.strictEqual(r.records.length, 1);
  assert.strictEqual(r.records[0].id, 'component:b');
});

test('queryAtlas: id filter is exact match', () => {
  const r = queryAtlas(sampleMap(), { section: 'components', id: 'component:b' });
  assert.strictEqual(r.records.length, 1);
  assert.strictEqual(r.records[0].id, 'component:b');
});

test('queryAtlas: kind filter matches surface_type', () => {
  const r = queryAtlas(sampleMap(), { section: 'surfaces', kind: 'docs' });
  assert.strictEqual(r.records.length, 1);
  assert.strictEqual(r.records[0].id, 'surf:docs');
});

test('queryAtlas: c4 section flattens all c4 arrays', () => {
  const m = sampleMap();
  m.c4.families.push({ id: 'c4-family:data-systems', display_name: 'Data', component_ids: [] });
  const r = queryAtlas(m, { section: 'c4' });
  assert.strictEqual(r.records.length, 1);
  assert.strictEqual(r.records[0].id, 'c4-family:data-systems');
});

test('queryAtlas: limit truncates result envelope', () => {
  const r = queryAtlas(sampleMap(), { section: 'components', limit: 1 });
  assert.strictEqual(r.records.length, 1);
  assert.strictEqual(r.truncated, true);
  assert.strictEqual(r.truncated_records, 1);
});

test('queryAtlas: empty/missing map returns empty records without throwing', () => {
  const r = queryAtlas({}, { section: 'components' });
  assert.deepStrictEqual(r.records, []);
  assert.strictEqual(r.total_records, 0);
});

test('queryAtlas: default section is components', () => {
  const r = queryAtlas(sampleMap(), {});
  assert.strictEqual(r.records.length, 2);
});
