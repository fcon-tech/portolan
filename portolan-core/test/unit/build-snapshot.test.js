/**
 * Unit tests for domain system-map composition + the build-snapshot use-case.
 *
 * composeSystemMap is exercised with a minimal in-memory bundle (one corpus
 * target + repo + manifest dependency + hotspot + gap) and asserted on
 * structural invariants — this is the Clean-Architecture extraction of the
 * frozen viewer build-system-map pipeline, so the assertions mirror the
 * behaviour the harness-system-map-smoke checks end-to-end.
 *
 * buildSnapshot is exercised with an in-memory fake reader + store (no fs).
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { composeSystemMap } = require('../../src/domain/system-map-compose');
const { buildSnapshot } = require('../../src/use-cases/build-snapshot');

// A minimal corpus bundle: one promoted component + one surface-only target +
// one repo + one manifest-dependency edge + one hotspot + one gap.
function minimalArtifacts() {
  return {
    atlasSurfaces: {
      schema_version: '0.1.0',
      target_root: '/landscape',
      corpus: { manifest_path: '/landscape/bom.json' },
      targets: [
        { id: 'app-a', label: 'App A', kind: 'application', role: 'service', lifecycle: 'active', depends_on: ['lib-b'] },
        { id: 'lib-b', label: 'Lib B', kind: 'library', role: 'storage', lifecycle: 'active' },
        { id: 'ml', label: 'Mailing list', kind: 'mailing-list', role: 'community' },
      ],
      surfaces: [],
      gaps: [],
    },
    atlasFacts: {
      schema_version: '0.1.0',
      target_root: '/landscape',
      components: [],
      edges: [],
      gaps: [],
    },
    repoProfiles: { schema_version: '0.1.0', repos: [{ id: 'lib-b', scale: { file_count: 42 }, languages: ['js'] }] },
    manifest: {},
    relationships: [],
    hotspots: [{ id: 'hot-1', kind: 'duplication', repo_id: 'lib-b', severity: 'high', summary: 'dup', evidence_state: 'source-visible' }],
    gaps: [{ id: 'gap-1', surface: 'runtime', status: 'unknown', summary: 'runtime not assessed' }],
    repos: [{ id: 'lib-b', name: 'lib-b', path: '/landscape/lib-b' }],
  };
}

test('composeSystemMap: promotes corpus targets into components', () => {
  const map = composeSystemMap(minimalArtifacts(), { targetRoot: '/landscape', generatedAt: '2026-01-01T00:00:00.000Z' });
  assert.strictEqual(map.schema_version, '0.1.0');
  assert.strictEqual(map.objects.components.length, 2);
  const ids = map.objects.components.map((c) => c.id).sort();
  assert.deepStrictEqual(ids, ['component:app-a', 'component:lib-b']);
});

test('composeSystemMap: does not promote surface-only kinds (mailing list stays a surface)', () => {
  const map = composeSystemMap(minimalArtifacts(), { targetRoot: '/landscape' });
  const compIds = map.objects.components.map((c) => c.id);
  assert.ok(!compIds.includes('component:ml'));
  const mlSurface = map.objects.surfaces.find((s) => /mailing-list/.test(s.surface_type) || s.label === 'Mailing list');
  assert.ok(mlSurface, 'mailing list emitted as a surface');
});

test('composeSystemMap: assigns deterministic C4 families + groups them', () => {
  const map = composeSystemMap(minimalArtifacts(), { targetRoot: '/landscape' });
  const libB = map.objects.components.find((c) => c.id === 'component:lib-b');
  assert.strictEqual(libB.c4_family, 'data-systems');
  const familySlugs = map.c4.families.map((f) => f.family).sort();
  assert.ok(familySlugs.includes('data-systems'));
  const dataFamily = map.c4.families.find((f) => f.family === 'data-systems');
  assert.deepStrictEqual(dataFamily.component_ids, ['component:lib-b']);
});

test('composeSystemMap: emits manifest-dependency relationships with detail routes', () => {
  const map = composeSystemMap(minimalArtifacts(), { targetRoot: '/landscape' });
  const rel = map.objects.relationships.find((r) => r.relationship_type === 'depends-on');
  assert.ok(rel, 'manifest-dep relationship present');
  assert.strictEqual(rel.from_id, 'component:app-a');
  assert.strictEqual(rel.to_id, 'component:lib-b');
  assert.match(rel.route, /^#\/detail\/relationship\//);
});

test('composeSystemMap: maps hotspots to findings and gaps to unknowns', () => {
  const map = composeSystemMap(minimalArtifacts(), { targetRoot: '/landscape' });
  assert.strictEqual(map.objects.findings.length, 1);
  assert.strictEqual(map.objects.findings[0].id, 'hot-1');
  assert.strictEqual(map.objects.unknowns.length, 1);
  assert.strictEqual(map.objects.unknowns[0].id, 'unknown:gap-1');
});

test('composeSystemMap: produced map passes the domain semantic validator', () => {
  const { validateSystemMap } = require('../../src/domain/atlas-validate');
  const map = composeSystemMap(minimalArtifacts(), { targetRoot: '/landscape' });
  const { errors } = validateSystemMap(map);
  assert.deepStrictEqual(errors, []);
});

test('composeSystemMap: is pure — no fs, deterministic for fixed generatedAt', () => {
  const a = composeSystemMap(minimalArtifacts(), { targetRoot: '/landscape', generatedAt: 'T1' });
  const b = composeSystemMap(minimalArtifacts(), { targetRoot: '/landscape', generatedAt: 'T1' });
  assert.deepStrictEqual(a, b);
});

test('composeSystemMap: tolerates empty/absent artifacts (non-corpus fallback)', () => {
  const map = composeSystemMap({}, { targetRoot: '/solo' });
  assert.strictEqual(map.objects.components.length, 0);
  assert.strictEqual(map.target.root, '/solo');
  assert.ok(Array.isArray(map.objects.repositories));
});

// ---- build-snapshot use-case ----

function fakeReader(artifacts) {
  return {
    readJson: (name) => {
      const key = name.replace(/\.json$/, '');
      const map = { 'atlas-surfaces': 'atlasSurfaces', 'atlas-facts': 'atlasFacts', 'repo-profiles': 'repoProfiles', manifest: 'manifest', repos: 'repos' };
      return map[key] ? (artifacts[map[key]] ?? null) : null;
    },
    readJsonl: (name) => {
      const key = name.replace(/\.jsonl$/, '').replace(/-full$/, '');
      const map = { relationships: 'relationships', hotspots: 'hotspots', gaps: 'gaps' };
      return map[key] ? (artifacts[map[key]] || []) : [];
    },
    exists: (name) => name === 'hotspots.jsonl',
    listProducerDirs: () => [],
    bundleDir: '/fake',
  };
}

test('buildSnapshot: reads via port, composes, persists via store, returns map', async () => {
  const artifacts = minimalArtifacts();
  const reader = fakeReader(artifacts);
  let saved = null;
  const store = { saveAtlas: async (m) => { saved = m; }, loadAtlas: async () => null, hasAtlas: async () => false };
  const map = await buildSnapshot({ reader, store, targetRoot: '/landscape', generatedAt: 'T1' });
  assert.strictEqual(map.objects.components.length, 2);
  assert.strictEqual(saved, map, 'store.saveAtlas received the composed map');
});

test('buildSnapshot: skips persist when no store provided', async () => {
  const reader = fakeReader(minimalArtifacts());
  const map = await buildSnapshot({ reader, targetRoot: '/landscape', generatedAt: 'T1' });
  assert.ok(map.objects);
});

test('buildSnapshot: prefers hotspots-full.jsonl when present', async () => {
  const artifacts = minimalArtifacts();
  artifacts.hotspots = [{ id: 'full-only', kind: 'config', repo_id: 'lib-b' }];
  const reader = fakeReader(artifacts);
  reader.exists = (name) => name === 'hotspots-full.jsonl';
  reader.readJsonl = (name) => name === 'hotspots-full.jsonl' ? artifacts.hotspots : [];
  const map = await buildSnapshot({ reader, targetRoot: '/landscape', generatedAt: 'T1' });
  assert.strictEqual(map.objects.findings.length, 1);
  assert.strictEqual(map.objects.findings[0].id, 'full-only');
});
