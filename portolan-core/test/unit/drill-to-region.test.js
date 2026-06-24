/**
 * Unit tests for drill-to-region use-case.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { drillToRegion } = require('../../src/use-cases/drill-to-region');

function atlas() {
  return {
    objects: {
      components: [
        { id: 'component:a', c4_family: 'data-systems', lifecycle: 'active', evidence: { state: 'source-visible' }, relationship_ids: ['rel:ab'], surface_ids: ['surf:a1'] },
        { id: 'component:b', c4_family: 'data-systems', lifecycle: 'retired', evidence: { state: 'metadata-visible' }, relationship_ids: ['rel:ab'], surface_ids: [] },
        { id: 'component:c', c4_family: 'compute-processing', lifecycle: 'active', evidence: { state: 'claim-only' }, relationship_ids: [], surface_ids: ['surf:c1', 'surf:c2'] },
      ],
      relationships: [
        { id: 'rel:ab', from_id: 'component:a', to_id: 'component:b' },
        { id: 'rel:ax', from_id: 'component:a', to_id: 'component:OUTSIDE' },
      ],
    },
  };
}

test('drillToRegion: returns profile + members for a valid region', () => {
  const r = drillToRegion(atlas(), ['component:a', 'component:b']);
  assert.ok(r);
  assert.strictEqual(r.members.length, 2);
  assert.strictEqual(r.profile.unit_count, 2);
});

test('drillToRegion: profile counts internal edges only', () => {
  const r = drillToRegion(atlas(), ['component:a', 'component:b']);
  // rel:ab is internal; rel:ax goes outside -> not counted.
  assert.strictEqual(r.profile.edge_count, 1);
});

test('drillToRegion: profile includes lifecycle distribution', () => {
  const r = drillToRegion(atlas(), ['component:a', 'component:b']);
  assert.strictEqual(r.profile.lifecycle_distribution.active, 1);
  assert.strictEqual(r.profile.lifecycle_distribution.retired, 1);
});

test('drillToRegion: profile includes surface count', () => {
  const r = drillToRegion(atlas(), ['component:a', 'component:b', 'component:c']);
  assert.strictEqual(r.profile.surface_count, 3); // a1 + c1 + c2
});

test('drillToRegion: returns null when no units resolve', () => {
  const r = drillToRegion(atlas(), ['component:nonexistent']);
  assert.strictEqual(r, null);
});

test('drillToRegion: empty unit list returns null', () => {
  const r = drillToRegion(atlas(), []);
  assert.strictEqual(r, null);
});

test('drillToRegion: single-unit region is valid (edge_density 0)', () => {
  const r = drillToRegion(atlas(), ['component:c']);
  assert.strictEqual(r.profile.unit_count, 1);
  assert.strictEqual(r.profile.edge_density, 0);
});
