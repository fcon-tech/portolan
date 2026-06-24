/**
 * Unit tests for component-promotion, lifecycle, type, and surface-type
 * classification. These cover Feature 2 (Entity Stratification) and the
 * deterministic promotion rule at the data level.
 *
 * RED phase: these import from the not-yet-extracted modules under
 * scripts/system-map/. They fail until Phase 2a extracts those modules.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const {
  isPromotableComponent,
  mapLifecycle,
  mapComponentType,
  PROMOTABLE_KINDS,
  SURFACE_ONLY_KINDS,
} = require('../scripts/system-map/classify');
const { mapSurfaceType } = require('../scripts/system-map/surfaces');

test('promotion rule: repository is promoted', () => {
  assert.strictEqual(isPromotableComponent({ kind: 'repository' }), true);
});

test('promotion rule: retired-project is promoted', () => {
  assert.strictEqual(isPromotableComponent({ kind: 'retired-project' }), true);
});

test('promotion rule: package is promoted', () => {
  assert.strictEqual(isPromotableComponent({ kind: 'package' }), true);
});

test('promotion rule: surface-only kinds are never promoted', () => {
  const surfaceKinds = ['documentation', 'mailing-list', 'issue-tracker', 'wiki', 'binary-repository', 'docker-image', 'runtime', 'release'];
  for (const kind of surfaceKinds) {
    assert.strictEqual(isPromotableComponent({ kind }), false, `kind "${kind}" must not be promoted`);
  }
});

test('promotion rule: ambiguous unknown kind is not promoted', () => {
  assert.strictEqual(isPromotableComponent({ kind: 'mystery' }), false);
});

test('promotion rule: missing kind is not promoted', () => {
  assert.strictEqual(isPromotableComponent({}), false);
});

test('lifecycle mapping: known values pass through', () => {
  for (const lc of ['active', 'external', 'retired', 'internal-support', 'unknown']) {
    assert.strictEqual(mapLifecycle({ lifecycle: lc }), lc);
  }
});

test('lifecycle mapping: "legacy" maps to "retired"', () => {
  assert.strictEqual(mapLifecycle({ lifecycle: 'legacy' }), 'retired');
});

test('lifecycle mapping: unknown value defaults to "unknown"', () => {
  assert.strictEqual(mapLifecycle({ lifecycle: 'something-else' }), 'unknown');
  assert.strictEqual(mapLifecycle({}), 'unknown');
});

test('component type: retired-project -> retired', () => {
  assert.strictEqual(mapComponentType({ kind: 'retired-project' }), 'retired');
});

test('component type: package -> package', () => {
  assert.strictEqual(mapComponentType({ kind: 'package' }), 'package');
});

test('component type: repository with integrator role -> platform', () => {
  assert.strictEqual(mapComponentType({ kind: 'repository', role: 'ecosystem-integrator' }), 'platform');
});

test('surface type mapping: documentation -> docs', () => {
  assert.strictEqual(mapSurfaceType('documentation', ''), 'docs');
});

test('surface type mapping: mailing-list -> mailing-list', () => {
  assert.strictEqual(mapSurfaceType('mailing-list', ''), 'mailing-list');
});

test('surface type mapping: runtime with verification role -> ci', () => {
  assert.strictEqual(mapSurfaceType('runtime', 'upstream-verification-surface'), 'ci');
});

test('surface type mapping: runtime without verification role -> runtime-endpoint', () => {
  assert.strictEqual(mapSurfaceType('runtime', ''), 'runtime-endpoint');
});

test('surface type mapping: binary-repository -> binary-repo', () => {
  assert.strictEqual(mapSurfaceType('binary-repository', ''), 'binary-repo');
});

test('surface type mapping: unknown kind falls back via role (support-matrix)', () => {
  assert.strictEqual(mapSurfaceType('other', 'release support-matrix'), 'release-matrix');
});

test('promotion-rule determinism: same input always yields same decision', () => {
  const t = { kind: 'repository', role: 'database', lifecycle: 'active' };
  const a = isPromotableComponent(t);
  for (let i = 0; i < 5; i++) {
    assert.strictEqual(isPromotableComponent(t), a);
  }
});

test('no classification rule depends on the literal string "Bigtop" (Feature 7)', () => {
  // The classify module must not special-case "bigtop". A target named with
  // "bigtop" but an unpromotable kind must still be unpromoted.
  assert.strictEqual(isPromotableComponent({ kind: 'documentation', id: 'bigtop-support-matrix' }), false);
  assert.strictEqual(isPromotableComponent({ kind: 'mailing-list', id: 'apache-bigtop-mailing-lists' }), false);
  // And a promotable kind is promoted regardless of name.
  assert.strictEqual(isPromotableComponent({ kind: 'repository', id: 'bigtop-repo' }), true);
});
