/**
 * Unit tests for the build-atlas-navigation-index use-case.
 *
 * Uses a fake source adapter (in-memory) — no filesystem — to verify profile
 * selection, the unsupported-target receipt path, and that supported profiles
 * produce a full bundle.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { buildAtlasNavigationIndex } = require('../../src/use-cases/build-atlas-navigation-index');

// A fake source adapter that satisfies the AtlasNavSource port.
function fakeSource(opts) {
  return {
    exists: (rel) => (opts.exists || []).includes(rel),
    findFile: (name, under) => (opts.findFile || false) && opts.findFile.name === name ? opts.findFile.path : '',
    enumerateSubjects: (profileId) => opts.subjects[profileId] || [],
    resolveAnchors: (candidates) => {
      const m = new Map();
      for (const c of candidates) m.set(c.key || `${c.file}\u0000${c.substring}`, { found: true, lineStart: 1, lineEnd: 1, matchCount: 1 });
      return m;
    },
  };
}

const BIGTOP_SUBJECTS = [
  { subject_id: 'repo:apache-bigtop-repo', subject_type: 'repository', subject_label: 'bigtop-repo', source_path: 'repos/apache-bigtop-repo', exists: true, expected_by: 'enum', promotion_state: 'promoted' },
];
const SELF_SUBJECTS = [
  { subject_id: 'region:go-cli', subject_type: 'source_region', subject_label: 'Go CLI', source_path: 'cmd', exists: true, expected_by: 'enum', promotion_state: 'promoted' },
  { subject_id: 'region:scripts', subject_type: 'source_region', subject_label: 'Scripts', source_path: 'scripts', exists: true, expected_by: 'enum', promotion_state: 'promoted' },
  { subject_id: 'region:viewer', subject_type: 'source_region', subject_label: 'Viewer', source_path: 'viewer', exists: true, expected_by: 'enum', promotion_state: 'promoted' },
  { subject_id: 'region:portolan-core', subject_type: 'source_region', subject_label: 'Core', source_path: 'portolan-core', exists: true, expected_by: 'enum', promotion_state: 'promoted' },
  { subject_id: 'region:schemas', subject_type: 'source_region', subject_label: 'Schemas', source_path: 'schema', exists: true, expected_by: 'enum', promotion_state: 'promoted' },
  { subject_id: 'region:fixtures', subject_type: 'source_region', subject_label: 'Fixtures', source_path: 'internal/testfixtures', exists: true, expected_by: 'enum', promotion_state: 'promoted' },
  { subject_id: 'region:docs', subject_type: 'source_region', subject_label: 'Docs', source_path: 'README.md', exists: true, expected_by: 'enum', promotion_state: 'promoted' },
];

test('build: bigtop profile produces a full bundle with content artifacts', () => {
  const src = fakeSource({ exists: ['repos/apache-bigtop-repo'], subjects: { bigtop: BIGTOP_SUBJECTS } });
  const r = buildAtlasNavigationIndex({ targetRoot: '/bigtop', sourceAdapter: src });
  assert.strictEqual(r.profileId, 'bigtop');
  assert.strictEqual(r.unsupported, false);
  assert.ok(r.bundle.navigationIndex.length > 0);
  assert.ok(r.bundle.coverageMatrix.length > 0);
  assert.ok(r.bundle.findings.length > 0);
  assert.ok(r.bundle.frontierComparison.length > 0);
});

test('build: explicit --profile bigtop with missing root -> unsupported + blocked receipt', () => {
  const src = fakeSource({ exists: [], subjects: {} }); // apache-bigtop-repo missing
  const r = buildAtlasNavigationIndex({ targetRoot: '/x', sourceAdapter: src, explicitProfile: 'bigtop' });
  assert.strictEqual(r.profileId, 'unsupported_target');
  assert.strictEqual(r.unsupported, true);
  assert.deepStrictEqual(r.bundle.navigationIndex, []);
  assert.strictEqual(r.bundle.receiptValidation.machine_status, 'blocked');
  assert.ok(r.missingRoots.includes('repos/apache-bigtop-repo'));
});

test('build: portolan-self profile produces coverage for six regions', () => {
  const src = fakeSource({ exists: ['portolan-core', 'viewer', 'schema'], subjects: { 'portolan-self': SELF_SUBJECTS } });
  const r = buildAtlasNavigationIndex({ targetRoot: '/self', sourceAdapter: src });
  assert.strictEqual(r.profileId, 'portolan-self');
  const regionIds = r.bundle.coverageMatrix.map(c => c.subject_id);
  for (const req of ['region:go-cli', 'region:scripts', 'region:viewer', 'region:portolan-core', 'region:schemas', 'region:fixtures', 'region:docs']) {
    assert.ok(regionIds.includes(req), `${req} in coverage`);
  }
});

test('build: unsupported target emits receipt-only bundle (no content)', () => {
  const src = fakeSource({ exists: [], subjects: {} });
  const r = buildAtlasNavigationIndex({ targetRoot: '/empty', sourceAdapter: src });
  assert.strictEqual(r.profileId, 'unsupported_target');
  assert.strictEqual(r.unsupported, true);
  assert.strictEqual(r.bundle.navigationIndex.length, 0);
  assert.strictEqual(r.bundle.coverageMatrix.length, 0);
  assert.strictEqual(r.bundle.findings.length, 0);
  // receipt records the reason
  assert.ok(r.bundle.receiptValidation.validation_checks.some(c => /profile/i.test(c.check_id)));
});
