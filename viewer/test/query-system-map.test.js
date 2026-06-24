/**
 * Unit tests for the system-map bundle-query family.
 * Covers Feature 6 (Agent Q&A) bounded-query behavior.
 *
 * RED phase: querySystemMap currently lives inline in bundle-query.js; these
 * tests drive extracting it (or requiring it) as a testable unit. Uses a temp
 * bundle on disk since the query reads a file.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { dispatch } = require('../scripts/bundle-query');

function makeBundle() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'smq-'));
  const map = {
    schema_version: '0.1.0', generated_by: 'test', target: { id: 'target:r', display_name: 'r', root: '/r', approved_output_area: '.portolan', approved_instruction_files: ['AGENTS.md'] },
    objects: {
      components: [
        { id: 'component:hadoop', display_name: 'Hadoop', type: 'application', role: 'storage', lifecycle: 'active', repository_ids: [], surface_ids: ['surf:wiki-hadoop'], relationship_ids: [], finding_ids: [], unknown_ids: [], c4_family: 'data-systems', promotion_signals: [{ signal_type: 'repository-metadata', source: 's', producer: 'p', independence_group: 'g' }], created_by_producer_family: 'p', why_present: 'w', next_actions: [], evidence: { state: 'source-visible', source: 's', producer: 'p' }, route: '#/dossier/component/hadoop' },
      ],
      repositories: [],
      surfaces: [
        { id: 'surf:wiki-hadoop', surface_type: 'wiki', label: 'Hadoop wiki', owner_id: 'component:hadoop', state: 'available', evidence: { state: 'metadata-visible', source: 's', producer: 'p' }, created_by_producer_family: 'p', why_present: 'w', why_it_matters: 'm', route: '#/dossier/surface/surf:wiki-hadoop' },
        { id: 'surf:list-bigtop', surface_type: 'mailing-list', label: 'Bigtop lists', owner_id: 'component:hadoop', state: 'available', evidence: { state: 'metadata-visible', source: 's', producer: 'p' }, created_by_producer_family: 'p', why_present: 'w', why_it_matters: 'm', route: '#/dossier/surface/surf:list-bigtop' },
      ],
      relationships: [], findings: [], unknowns: [{ id: 'unknown:g1', summary: 'runtime not assessed', created_by_producer_family: 'p', evidence: { state: 'unknown', source: 's', producer: 'p' }, route: '#/detail/unknown/unknown:g1' }],
    },
    c4: { context_boxes: [], families: [], component_boxes: [] },
  };
  fs.writeFileSync(path.join(dir, 'system-map.json'), JSON.stringify(map));
  return dir;
}

test('overview section returns counts', () => {
  const dir = makeBundle();
  try {
    const r = dispatch(dir, 'system-map', { section: 'overview' });
    assert.strictEqual(r.query.family, 'system-map');
    assert.strictEqual(r.records[0].counts.components, 1);
    assert.strictEqual(r.records[0].counts.surfaces, 2);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('components section returns all components', () => {
  const dir = makeBundle();
  try {
    const r = dispatch(dir, 'system-map', { section: 'components' });
    assert.strictEqual(r.total_records, 1);
    assert.strictEqual(r.records[0].id, 'component:hadoop');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('surfaces section filtered by kind=mailing-list', () => {
  const dir = makeBundle();
  try {
    const r = dispatch(dir, 'system-map', { section: 'surfaces', kind: 'mailing-list' });
    assert.strictEqual(r.total_records, 1);
    assert.strictEqual(r.records[0].surface_type, 'mailing-list');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('id filter returns the matching object', () => {
  const dir = makeBundle();
  try {
    const r = dispatch(dir, 'system-map', { section: 'components', id: 'component:hadoop' });
    assert.strictEqual(r.total_records, 1);
    assert.strictEqual(r.records[0].display_name, 'Hadoop');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('plural and singular section names both work', () => {
  const dir = makeBundle();
  try {
    assert.strictEqual(dispatch(dir, 'system-map', { section: 'surfaces' }).total_records, 2);
    assert.strictEqual(dispatch(dir, 'system-map', { section: 'surface' }).total_records, 2);
    assert.strictEqual(dispatch(dir, 'system-map', { section: 'components' }).total_records, 1);
    assert.strictEqual(dispatch(dir, 'system-map', { section: 'component' }).total_records, 1);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('missing system-map.json returns a graceful warning, not a throw', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'smq-empty-'));
  try {
    const r = dispatch(dir, 'system-map', { section: 'overview' });
    assert.strictEqual(r.total_records, 0);
    assert.ok(r.warnings.some((w) => /system-map.json missing/i.test(w)));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('bounded query never returns raw full-system-map dump as the primary interaction', () => {
  // Feature 6: the query returns a records array + envelope, never the whole
  // map object unbounded. The overview is a derived counts object, not the map.
  const dir = makeBundle();
  try {
    const r = dispatch(dir, 'system-map', { section: 'overview' });
    assert.ok(!('objects' in r.records[0]), 'overview record must not leak the full objects graph');
    assert.ok(r.schema_version && r.query && Array.isArray(r.records));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
