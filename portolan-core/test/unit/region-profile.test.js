/**
 * Unit tests for region-profile domain — the statistical portrait of a group
 * of landscape units (charter 08 "region drill-down").
 *
 * RED phase: region-profile.js does not exist yet; these drive its creation.
 * A region profile is a pure aggregation over a set of units + their edges +
 * surfaces: counts, distributions, density, top hubs.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { buildRegionProfile } = require('../../src/domain/region-profile');

function unit(id, family, lifecycle, evidenceState, relationshipCount = 0, surfaceCount = 0) {
  return {
    id, c4_family: family, lifecycle,
    evidence: { state: evidenceState },
    relationship_ids: new Array(relationshipCount).fill(0).map((_, i) => `rel:${id}-${i}`),
    surface_ids: new Array(surfaceCount).fill(0).map((_, i) => `surf:${id}-${i}`),
  };
}

test('buildRegionProfile: empty group yields a valid zero-profile', () => {
  const p = buildRegionProfile([], []);
  assert.strictEqual(p.unit_count, 0);
  assert.strictEqual(p.edge_count, 0);
  assert.strictEqual(p.edge_density, 0);
  assert.deepStrictEqual(p.lifecycle_distribution, {});
  assert.deepStrictEqual(p.evidence_distribution, {});
  assert.deepStrictEqual(p.family_distribution, {});
  assert.deepStrictEqual(p.top_hubs, []);
  assert.strictEqual(p.surface_count, 0);
});

test('buildRegionProfile: unit_count counts the provided units', () => {
  const units = [unit('a', 'data-systems', 'active', 'source-visible'), unit('b', 'compute-processing', 'retired', 'metadata-visible')];
  const p = buildRegionProfile(units, []);
  assert.strictEqual(p.unit_count, 2);
});

test('buildRegionProfile: lifecycle_distribution tallies each lifecycle', () => {
  const units = [
    unit('a', 'data-systems', 'active', 'source-visible'),
    unit('b', 'compute-processing', 'active', 'metadata-visible'),
    unit('c', 'unknown', 'retired', 'claim-only'),
  ];
  const p = buildRegionProfile(units, []);
  assert.strictEqual(p.lifecycle_distribution.active, 2);
  assert.strictEqual(p.lifecycle_distribution.retired, 1);
});

test('buildRegionProfile: evidence_distribution tallies each evidence state', () => {
  const units = [
    unit('a', 'data-systems', 'active', 'source-visible'),
    unit('b', 'compute-processing', 'active', 'source-visible'),
    unit('c', 'unknown', 'retired', 'metadata-visible'),
  ];
  const p = buildRegionProfile(units, []);
  assert.strictEqual(p.evidence_distribution['source-visible'], 2);
  assert.strictEqual(p.evidence_distribution['metadata-visible'], 1);
});

test('buildRegionProfile: family_distribution tallies each family', () => {
  const units = [
    unit('a', 'data-systems', 'active', 'source-visible'),
    unit('b', 'data-systems', 'active', 'source-visible'),
    unit('c', 'compute-processing', 'retired', 'claim-only'),
  ];
  const p = buildRegionProfile(units, []);
  assert.strictEqual(p.family_distribution['data-systems'], 2);
  assert.strictEqual(p.family_distribution['compute-processing'], 1);
});

test('buildRegionProfile: edge_count counts edges among the units', () => {
  const units = [unit('a', 'data-systems', 'active', 'source-visible'), unit('b', 'data-systems', 'active', 'source-visible')];
  const edges = [
    { from_id: 'a', to_id: 'b' },
    { from_id: 'a', to_id: 'b' },
    { from_id: 'a', to_id: 'OUTSIDE' }, // external — not counted
  ];
  const p = buildRegionProfile(units, edges);
  assert.strictEqual(p.edge_count, 2);
});

test('buildRegionProfile: edge_density = edges / possible_pairs (undirected)', () => {
  // 3 units -> 3 possible undirected pairs; 1 edge -> density 1/3.
  const units = [
    unit('a', 'data-systems', 'active', 'source-visible'),
    unit('b', 'data-systems', 'active', 'source-visible'),
    unit('c', 'data-systems', 'active', 'source-visible'),
  ];
  const edges = [{ from_id: 'a', to_id: 'b' }];
  const p = buildRegionProfile(units, edges);
  assert.ok(Math.abs(p.edge_density - 1 / 3) < 1e-6, `density ${p.edge_density} ~= 1/3`);
});

test('buildRegionProfile: edge_density is 0 for a single unit (no pairs)', () => {
  const units = [unit('a', 'data-systems', 'active', 'source-visible')];
  const p = buildRegionProfile(units, []);
  assert.strictEqual(p.edge_density, 0);
});

test('buildRegionProfile: top_hubs are units sorted by relationship count, descending', () => {
  const units = [
    unit('hub', 'data-systems', 'active', 'source-visible', 11),
    unit('leaf1', 'data-systems', 'active', 'source-visible', 2),
    unit('leaf2', 'data-systems', 'active', 'source-visible', 5),
  ];
  const p = buildRegionProfile(units, []);
  assert.strictEqual(p.top_hubs[0].id, 'hub');
  assert.strictEqual(p.top_hubs[0].relationship_count, 11);
  assert.strictEqual(p.top_hubs[1].id, 'leaf2');
  assert.strictEqual(p.top_hubs[2].id, 'leaf1');
});

test('buildRegionProfile: top_hubs limited to a reasonable number (default 5)', () => {
  const units = [];
  for (let i = 0; i < 10; i++) units.push(unit(`u${i}`, 'data-systems', 'active', 'source-visible', i));
  const p = buildRegionProfile(units, []);
  assert.ok(p.top_hubs.length <= 5, `top_hubs length ${p.top_hubs.length} should be <= 5`);
});

test('buildRegionProfile: surface_count sums surface_ids across units', () => {
  const units = [
    unit('a', 'data-systems', 'active', 'source-visible', 0, 3),
    unit('b', 'data-systems', 'active', 'source-visible', 0, 4),
  ];
  const p = buildRegionProfile(units, []);
  assert.strictEqual(p.surface_count, 7);
});

test('buildRegionProfile: isolated units (0 relationships) are counted but not in top_hubs unless all are isolated', () => {
  const units = [
    unit('iso1', 'unknown', 'active', 'source-visible', 0),
    unit('iso2', 'unknown', 'active', 'source-visible', 0),
  ];
  const p = buildRegionProfile(units, []);
  assert.strictEqual(p.unit_count, 2);
  // All isolated -> top_hubs still returns them (sorted by 0, stable).
  assert.strictEqual(p.top_hubs.length, 2);
});

test('buildRegionProfile: determinism — same inputs yield same profile', () => {
  const units = [
    unit('a', 'data-systems', 'active', 'source-visible', 3, 1),
    unit('b', 'compute-processing', 'retired', 'claim-only', 1, 0),
  ];
  const edges = [{ from_id: 'a', to_id: 'b' }];
  const p1 = buildRegionProfile(units, edges);
  const p2 = buildRegionProfile(units, edges);
  assert.deepStrictEqual(p1, p2);
});
