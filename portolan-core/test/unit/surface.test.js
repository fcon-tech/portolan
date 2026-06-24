/**
 * Direct unit tests for surface domain: state resolution + why-it-matters copy.
 *
 * These fill a coverage gap — the old viewer tested mapSurfaceType only
 * transitively via the classify test; surfaceState and surfaceWhyItMatters had
 * no direct coverage at all.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { SURFACE_KIND_TO_TYPE, mapSurfaceType, surfaceState, surfaceWhyItMatters } = require('../../src/domain/surface');

test('SURFACE_KIND_TO_TYPE maps every documented surface kind', () => {
  // The frozen 0.1.0 surface_type enum values that must be reachable.
  const reachable = new Set(Object.values(SURFACE_KIND_TO_TYPE));
  for (const t of ['docs', 'release-matrix', 'mailing-list', 'issue-tracker', 'wiki', 'binary-repo', 'docker-image', 'runtime-endpoint', 'vendor-config', 'other']) {
    assert.ok(reachable.has(t), `surface_type "${t}" not reachable from any kind`);
  }
});

test('mapSurfaceType: documentation variants -> docs', () => {
  assert.strictEqual(mapSurfaceType('documentation', ''), 'docs');
  assert.strictEqual(mapSurfaceType('official-doc', ''), 'docs');
});

test('mapSurfaceType: mailing-list -> mailing-list', () => {
  assert.strictEqual(mapSurfaceType('mailing-list', ''), 'mailing-list');
});

test('mapSurfaceType: runtime with verification role -> ci', () => {
  assert.strictEqual(mapSurfaceType('runtime', 'upstream-verification-surface'), 'ci');
  assert.strictEqual(mapSurfaceType('runtime', 'ci-smoke-tests'), 'ci');
});

test('mapSurfaceType: runtime without verification role -> runtime-endpoint', () => {
  assert.strictEqual(mapSurfaceType('runtime', ''), 'runtime-endpoint');
});

test('mapSurfaceType: binary-repository -> binary-repo', () => {
  assert.strictEqual(mapSurfaceType('binary-repository', ''), 'binary-repo');
  assert.strictEqual(mapSurfaceType('binary-repo', ''), 'binary-repo');
});

test('mapSurfaceType: docker-image -> docker-image', () => {
  assert.strictEqual(mapSurfaceType('docker-image', ''), 'docker-image');
});

test('mapSurfaceType: vendor-config -> vendor-config', () => {
  assert.strictEqual(mapSurfaceType('vendor-config', ''), 'vendor-config');
});

test('mapSurfaceType: release variants -> release-matrix', () => {
  assert.strictEqual(mapSurfaceType('release', ''), 'release-matrix');
  assert.strictEqual(mapSurfaceType('official-release', ''), 'release-matrix');
  assert.strictEqual(mapSurfaceType('release-matrix', ''), 'release-matrix');
});

test('mapSurfaceType: unknown kind falls back via role (support-matrix)', () => {
  assert.strictEqual(mapSurfaceType('other', 'release support-matrix'), 'release-matrix');
});

test('mapSurfaceType: unknown kind falls back via role (mailing)', () => {
  assert.strictEqual(mapSurfaceType('other', 'community mailing'), 'mailing-list');
});

test('mapSurfaceType: unknown kind, unknown role -> other', () => {
  assert.strictEqual(mapSurfaceType('mystery', 'opaque'), 'other');
  assert.strictEqual(mapSurfaceType('', ''), 'other');
});

test('surfaceState: missing -> missing', () => {
  assert.strictEqual(surfaceState({ evidence_state: 'missing' }), 'missing');
});

test('surfaceState: cannot_verify/unknown -> unknown', () => {
  assert.strictEqual(surfaceState({ evidence_state: 'cannot_verify' }), 'unknown');
  assert.strictEqual(surfaceState({ evidence_state: 'unknown' }), 'unknown');
});

test('surfaceState: source-visible/metadata-visible/runtime-visible -> available', () => {
  assert.strictEqual(surfaceState({ evidence_state: 'source-visible' }), 'available');
  assert.strictEqual(surfaceState({ evidence_state: 'metadata-visible' }), 'available');
  assert.strictEqual(surfaceState({ evidence_state: 'runtime-visible' }), 'available');
});

test('surfaceState: null surface -> unknown', () => {
  assert.strictEqual(surfaceState(null), 'unknown');
});

test('surfaceState: missing evidence_state defaults to metadata-visible -> available', () => {
  assert.strictEqual(surfaceState({}), 'available');
});

test('surfaceWhyItMatters: every documented surface type has a reason', () => {
  for (const t of ['docs', 'release-matrix', 'mailing-list', 'issue-tracker', 'wiki', 'ci', 'binary-repo', 'docker-image', 'runtime-endpoint', 'vendor-config']) {
    const reason = surfaceWhyItMatters(t, null);
    assert.ok(typeof reason === 'string' && reason.length > 0, `no why-it-matters reason for "${t}"`);
  }
});

test('surfaceWhyItMatters: unknown type falls back to note/label', () => {
  assert.strictEqual(surfaceWhyItMatters('other', { note: 'custom note' }), 'custom note');
  assert.strictEqual(surfaceWhyItMatters('other', { label: 'lbl' }), 'lbl');
  assert.strictEqual(surfaceWhyItMatters('exotic', null), 'Related inspection surface.');
});
