/**
 * Unit tests for the atlas-navigation domain: build + validate (both modes),
 * using in-memory profiles + enumerated subjects (no filesystem).
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const {
  buildNavigationBundle, validateNavigationBundle, renderFrontierComparison,
  CONTENT_ARTIFACTS, ALL_ARTIFACTS, RUNTIME_OVERCLAIM_STATES,
} = require('../../src/domain/atlas-navigation');
const { BIGTOP_PROFILE, PORTOLAN_SELF_PROFILE, selectProfile, stableTargetId } = require('../../src/domain/atlas-navigation-profiles');

// ---- helpers: build an enumerated bag with all anchors "found" -----------
function enumeratedFound(profile, targetId) {
  const subjects = minimalSubjects(profile);
  const anchors = new Map();
  for (const r of profile.routes || []) {
    for (const s of r.stages || []) {
      if (s.anchor_candidate) {
        const c = s.anchor_candidate;
        anchors.set(c.key || `${c.file}\u0000${c.substring}`, { found: true, lineStart: 5, lineEnd: 5, matchCount: 1 });
      }
    }
  }
  return { targetId, subjects, anchors };
}

function minimalSubjects(profile) {
  if (profile.id === 'bigtop') {
    return [
      { subject_id: 'repo:apache-bigtop-repo', subject_type: 'repository', subject_label: 'apache-bigtop-repo', source_path: 'repos/apache-bigtop-repo', exists: true, expected_by: 'test', promotion_state: 'promoted' },
      { subject_id: 'repo:apache-spark', subject_type: 'repository', subject_label: 'apache-spark', source_path: 'repos/apache-spark', exists: true, expected_by: 'test', promotion_state: 'promoted' },
    ];
  }
  // portolan-self: the six required regions
  return [
    { subject_id: 'region:go-cli', subject_type: 'source_region', subject_label: 'Go CLI', source_path: 'cmd', exists: true, expected_by: 'test', promotion_state: 'promoted' },
    { subject_id: 'region:scripts', subject_type: 'source_region', subject_label: 'Scripts', source_path: 'scripts', exists: true, expected_by: 'test', promotion_state: 'promoted' },
    { subject_id: 'region:viewer', subject_type: 'source_region', subject_label: 'Viewer', source_path: 'viewer', exists: true, expected_by: 'test', promotion_state: 'promoted' },
    { subject_id: 'region:portolan-core', subject_type: 'source_region', subject_label: 'Core', source_path: 'portolan-core', exists: true, expected_by: 'test', promotion_state: 'promoted' },
    { subject_id: 'region:schemas', subject_type: 'source_region', subject_label: 'Schemas', source_path: 'schema', exists: true, expected_by: 'test', promotion_state: 'promoted' },
    { subject_id: 'region:fixtures', subject_type: 'source_region', subject_label: 'Fixtures', source_path: 'internal/testfixtures', exists: true, expected_by: 'test', promotion_state: 'promoted' },
    { subject_id: 'region:docs', subject_type: 'source_region', subject_label: 'Docs', source_path: 'README.md', exists: true, expected_by: 'test', promotion_state: 'promoted' },
  ];
}

function validateBundle(bundle, targetId) {
  const filesPresent = new Set([...CONTENT_ARTIFACTS, 'receipt-validation.json', 'frontier-comparison.md']);
  return validateNavigationBundle({
    ...bundle, filesPresent,
    frontierComparisonMarkdown: bundle.frontierComparison,
    receiptValidation: { ...bundle.receiptValidation, target_id: targetId },
  });
}

// ===========================================================================
// Build
// ===========================================================================

test('buildNavigationBundle: bigtop produces all 7 artifact members', () => {
  const b = buildNavigationBundle(BIGTOP_PROFILE, enumeratedFound(BIGTOP_PROFILE, 'bigtop:test'));
  assert.ok(b.navigationIndex.length > 0, 'navigation-index has stages');
  assert.ok(b.coverageMatrix.length > 0, 'coverage-matrix has rows');
  assert.ok(b.findings.length > 0, 'findings present');
  assert.ok(b.unknownProbes.length > 0, 'unknown probes present');
  assert.ok(b.evidence.length > 0, 'evidence present');
  assert.ok(typeof b.frontierComparison === 'string' && b.frontierComparison.length > 0);
  assert.ok(b.receiptValidation && b.receiptValidation.target_id === 'bigtop:test');
});

test('buildNavigationBundle: every row carries artifact_provenance', () => {
  const b = buildNavigationBundle(PORTOLAN_SELF_PROFILE, enumeratedFound(PORTOLAN_SELF_PROFILE, 'portolan-self:test'));
  for (const n of b.navigationIndex) assert.ok(n.artifact_provenance, `nav stage ${n.stage} has provenance`);
  for (const c of b.coverageMatrix) assert.ok(c.artifact_provenance, `coverage ${c.coverage_id} has provenance`);
  for (const f of b.findings) assert.ok(f.artifact_provenance, `finding ${f.finding_id} has provenance`);
  for (const u of b.unknownProbes) assert.ok(u.artifact_provenance, `probe ${u.unknown_id} has provenance`);
  for (const e of b.evidence) assert.ok(e.artifact_provenance, `evidence ${e.evidence_id} has provenance`);
});

test('buildNavigationBundle: missing anchor downgrades route_quality', () => {
  const enum1 = enumeratedFound(BIGTOP_PROFILE, 'bigtop:test');
  // break one anchor: set the BOM anchor to not-found
  enum1.anchors.set('bigtop-bom', { found: false, lineStart: 0, lineEnd: 0, matchCount: 0 });
  const b = buildNavigationBundle(BIGTOP_PROFILE, enum1);
  const bomStage = b.navigationIndex.find(n => n.stage === 'bom-declaration');
  assert.strictEqual(bomStage.line_start, 0, 'missing anchor -> line 0');
  assert.strictEqual(bomStage.route_quality, 'medium', 'high downgrades to medium');
  assert.ok(bomStage.route_quality_note, 'quality note explains the downgrade');
});

test('buildNavigationBundle: ambiguous anchor downgrades route_quality and records note', () => {
  const enum1 = enumeratedFound(PORTOLAN_SELF_PROFILE, 'portolan-self:test');
  enum1.anchors.set('self-serve', { found: true, lineStart: 0, lineEnd: 0, matchCount: 3 });
  const b = buildNavigationBundle(PORTOLAN_SELF_PROFILE, enum1);
  const serveRoute = b.navigationIndex.filter(n => n.route_id === 'route:self:viewer-source-snippet');
  assert.ok(serveRoute.some(s => /ambiguous/i.test(s.route_quality_note || '')), 'ambiguous anchor noted');
  assert.ok(serveRoute.every(s => s.route_quality !== 'high'), 'ambiguous anchor downgrades route quality');
});

test('buildNavigationBundle: runtime_assessment never verified', () => {
  const b = buildNavigationBundle(BIGTOP_PROFILE, enumeratedFound(BIGTOP_PROFILE, 'bigtop:test'));
  for (const n of b.navigationIndex) assert.ok(!RUNTIME_OVERCLAIM_STATES.includes(n.runtime_assessment));
  for (const c of b.coverageMatrix) { assert.ok(!RUNTIME_OVERCLAIM_STATES.includes(c.runtime_status)); assert.ok(!RUNTIME_OVERCLAIM_STATES.includes(c.test_status)); }
});

test('buildNavigationBundle: evidence for missing subject is dropped', () => {
  const enum1 = enumeratedFound(BIGTOP_PROFILE, 'bigtop:test');
  // mark the bigtop-repo subject as missing
  enum1.subjects = enum1.subjects.map(s => s.subject_id === 'repo:apache-bigtop-repo' ? { ...s, exists: false } : s);
  const b = buildNavigationBundle(BIGTOP_PROFILE, enum1);
  // evidence tied to the missing subject should be dropped
  for (const e of b.evidence) assert.ok(!(e.subject_id === 'repo:apache-bigtop-repo'), 'no evidence for missing subject');
});

// ===========================================================================
// Validate — full mode
// ===========================================================================

test('validateNavigationBundle: bigtop full bundle passes (verified)', () => {
  const b = buildNavigationBundle(BIGTOP_PROFILE, enumeratedFound(BIGTOP_PROFILE, 'bigtop:bigtop-landscape'));
  const r = validateBundle(b, 'bigtop:bigtop-landscape');
  assert.strictEqual(r.mode, 'full');
  assert.strictEqual(r.machineStatus, 'verified', r.checks.filter(c => c.status === 'failed').map(c => c.summary).join('; '));
});

test('validateNavigationBundle: portolan-self full bundle passes (verified)', () => {
  const b = buildNavigationBundle(PORTOLAN_SELF_PROFILE, enumeratedFound(PORTOLAN_SELF_PROFILE, 'portolan-self:portolan'));
  const r = validateBundle(b, 'portolan-self:portolan');
  assert.strictEqual(r.mode, 'full');
  assert.strictEqual(r.machineStatus, 'verified', r.checks.filter(c => c.status === 'failed').map(c => c.summary).join('; '));
});

test('validateNavigationBundle: unresolved ref fails refs-resolve', () => {
  const b = buildNavigationBundle(PORTOLAN_SELF_PROFILE, enumeratedFound(PORTOLAN_SELF_PROFILE, 'portolan-self:portolan'));
  b.navigationIndex[0].evidence_refs.push('ev:does-not-exist');
  const r = validateBundle(b, 'portolan-self:portolan');
  const ref = r.checks.find(c => c.check_id === 'refs-resolve');
  assert.strictEqual(ref.status, 'failed');
});

test('validateNavigationBundle: runtime overclaim fails runtime-truth', () => {
  const b = buildNavigationBundle(PORTOLAN_SELF_PROFILE, enumeratedFound(PORTOLAN_SELF_PROFILE, 'portolan-self:portolan'));
  b.navigationIndex[0].runtime_assessment = 'verified';
  const r = validateBundle(b, 'portolan-self:portolan');
  const rt = r.checks.find(c => c.check_id === 'runtime-truth');
  assert.strictEqual(rt.status, 'failed');
});

test('validateNavigationBundle: fixture row labelled generated_artifact fails provenance-labelled', () => {
  const b = buildNavigationBundle(PORTOLAN_SELF_PROFILE, enumeratedFound(PORTOLAN_SELF_PROFILE, 'portolan-self:portolan'));
  b.findings[0].artifact_provenance = 'generated_artifact';
  b.findings[0].producer_id = 'atlas-navigation-index:portolan-self-fixture-v1';
  const r = validateBundle(b, 'portolan-self:portolan');
  const prov = r.checks.find(c => c.check_id === 'provenance-labelled');
  assert.strictEqual(prov.status, 'failed');
});

test('validateNavigationBundle: hypothesis-with-facts without evidence fails confidence-rule', () => {
  const b = buildNavigationBundle(PORTOLAN_SELF_PROFILE, enumeratedFound(PORTOLAN_SELF_PROFILE, 'portolan-self:portolan'));
  b.findings[0].confidence = 'hypothesis-with-facts';
  b.findings[0].evidence_refs = [];
  const r = validateBundle(b, 'portolan-self:portolan');
  const cr = r.checks.find(c => c.check_id === 'confidence-rule');
  assert.strictEqual(cr.status, 'failed');
});

// ===========================================================================
// Validate — receipt mode + forced mode
// ===========================================================================

test('validateNavigationBundle: receipt mode with only receipt-validation passes', () => {
  const receipt = {
    target_id: 'unsupported_target:foo', machine_status: 'not_assessed',
    agent_self_status: 'not_assessed', status_disagreements: [],
    receipt_sources: { agent_self_status: 'n/a — unsupported target', profile_selection: 'no signal' },
    validated_files: ['receipt-validation.json'],
    row_counts: {
      'navigation-index.jsonl': 0, 'coverage-matrix.jsonl': 0, 'atlas-findings.jsonl': 0,
      'unknown-probes.jsonl': 0, 'evidence.jsonl': 0,
    },
    validation_checks: [{ check_id: 'profile-selection', status: 'not_assessed', summary: 'no signal' }],
  };
  const r = validateNavigationBundle({
    receiptValidation: receipt, filesPresent: new Set(['receipt-validation.json']),
  }, { mode: 'receipt' });
  assert.strictEqual(r.mode, 'receipt');
  assert.strictEqual(r.machineStatus, 'not_assessed');
});

test('validateNavigationBundle: forced --mode receipt on content artifacts fails clearly', () => {
  const b = buildNavigationBundle(PORTOLAN_SELF_PROFILE, enumeratedFound(PORTOLAN_SELF_PROFILE, 'portolan-self:portolan'));
  const filesPresent = new Set([...CONTENT_ARTIFACTS, 'receipt-validation.json', 'frontier-comparison.md']);
  const r = validateNavigationBundle({ ...b, filesPresent }, { mode: 'receipt' });
  const mc = r.checks.find(c => c.check_id === 'mode-compat');
  assert.strictEqual(r.machineStatus, 'failed');
  assert.strictEqual(mc.status, 'failed');
  assert.match(mc.summary, /content artifacts present/);
});

test('validateNavigationBundle: forced --mode receipt with content artifact fails mode-compat', () => {
  const receipt = {
    target_id: 'unsupported_target:foo', machine_status: 'not_assessed',
    agent_self_status: 'not_assessed', status_disagreements: [], receipt_sources: {},
    validated_files: ['receipt-validation.json'], row_counts: {}, validation_checks: [],
  };
  const r = validateNavigationBundle({
    receiptValidation: receipt,
    filesPresent: new Set(['receipt-validation.json', 'navigation-index.jsonl']),
  }, { mode: 'receipt' });
  // forced receipt + content present => mode-compat failure (not no-content-artifacts)
  const mc = r.checks.find(c => c.check_id === 'mode-compat');
  assert.strictEqual(mc.status, 'failed');
  assert.strictEqual(r.machineStatus, 'failed');
});

// ===========================================================================
// Profile selection + stableTargetId
// ===========================================================================

test('selectProfile: bigtop strong signal (apache-bigtop-repo)', () => {
  const adapter = { exists: (r) => r === 'repos/apache-bigtop-repo', findFile: () => false };
  const sel = selectProfile('/x', adapter, undefined);
  assert.strictEqual(sel.id, 'bigtop');
});

test('selectProfile: bigtop acceptable signal (bigtop.bom under repos/)', () => {
  const adapter = { exists: () => false, findFile: (n, u) => n === 'bigtop.bom' && u === 'repos' };
  const sel = selectProfile('/x', adapter, undefined);
  assert.strictEqual(sel.id, 'bigtop');
});

test('selectProfile: portolan-self signal (portolan-core + viewer + schema)', () => {
  const adapter = { exists: (r) => ['portolan-core', 'viewer', 'schema'].includes(r), findFile: () => false };
  const sel = selectProfile('/x', adapter, undefined);
  assert.strictEqual(sel.id, 'portolan-self');
});

test('selectProfile: no signal -> unsupported_target', () => {
  const adapter = { exists: () => false, findFile: () => false };
  const sel = selectProfile('/x', adapter, undefined);
  assert.strictEqual(sel.id, 'unsupported_target');
});

test('selectProfile: explicit profile with missing roots -> unsupported + missingRoots', () => {
  const adapter = { exists: (r) => r !== 'viewer', findFile: () => false };
  const sel = selectProfile('/x', adapter, 'portolan-self');
  assert.strictEqual(sel.id, 'unsupported_target');
  assert.deepEqual(sel.missingRoots, ['viewer']);
});

test('stableTargetId: stable per target basename', () => {
  assert.strictEqual(stableTargetId('bigtop', '/foo/Bigtop_Landscape'), 'bigtop:bigtop-landscape');
  assert.strictEqual(stableTargetId('portolan-self', '/foo/portolan'), 'portolan-self:portolan');
  assert.strictEqual(stableTargetId('bigtop', '/a/b/c', 'My_Corpus'), 'bigtop:my-corpus');
});

// ===========================================================================
// Frontier comparison rendering
// ===========================================================================

test('validateNavigationBundle: not-assessed stage with no_safe_probe_reason is exempted', () => {
  // A route whose only not_assessed stage carries no probe but a no_safe_probe_reason
  // must NOT fail not-assessed-needs-probe.
  const b = buildNavigationBundle(PORTOLAN_SELF_PROFILE, enumeratedFound(PORTOLAN_SELF_PROFILE, 'portolan-self:portolan'));
  // inject a stage with no probe and a no_safe_probe_reason on an otherwise-clean route
  b.navigationIndex.push({ route_id: 'route:test:solo', route_family: 'command', route_title: 'solo',
    stage: 'only', stage_index: 1, subject_id: 'region:go-cli', subject_type: 'source_region',
    source_path: 'x', source_anchor: 'a', line_start: 0, line_end: 0, path_role: 'entrypoint',
    runtime_assessment: 'not_assessed', route_quality: 'low', artifact_provenance: 'fixture_backed',
    producer_id: 'p', evidence_refs: [], finding_refs: [], unknown_probe_refs: [],
    next_raw_check: '', no_safe_probe_reason: 'no disposable env available' });
  const r = validateBundle(b, 'portolan-self:portolan');
  const probe = r.checks.find(c => c.check_id === 'not-assessed-needs-probe');
  assert.strictEqual(probe.status, 'verified', probe.summary);
});

test('renderFrontierComparison: emits a markdown table with all profile rows', () => {
  const md = renderFrontierComparison(BIGTOP_PROFILE, 'bigtop:test');
  assert.match(md, /Bigtop package\/distribution route/);
  assert.match(md, /\| frontier_capability/);
});
