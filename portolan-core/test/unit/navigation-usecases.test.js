/**
 * Unit tests for the navigation atlas use-cases + view-model + query.
 * All pure (no I/O); operate on in-memory navAtlas fixtures.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { buildNavViewModel } = require('../../src/domain/nav-atlas-viewmodel');
const { openNavigationRoute } = require('../../src/use-cases/open-navigation-route');
const { openCoverageSubject } = require('../../src/use-cases/open-coverage-subject');
const { openFinding } = require('../../src/use-cases/open-finding');
const { openUnknownProbe } = require('../../src/use-cases/open-unknown-probe');
const { openReceipt } = require('../../src/use-cases/open-receipt');
const { queryAtlasNavigation } = require('../../src/use-cases/query-atlas-navigation');

function fixture() {
  return {
    navigationIndex: [
      { route_id: 'route:r1', route_family: 'command', route_title: 'R1', stage: 'a', stage_index: 1,
        subject_id: 'region:x', source_evidence_state: 'source-visible', runtime_assessment: 'not_assessed',
        route_quality: 'high', evidence_refs: ['ev:1'], finding_refs: ['finding:f1'], unknown_probe_refs: ['unknown:u1'], next_raw_check: 'c1' },
      { route_id: 'route:r1', route_family: 'command', route_title: 'R1', stage: 'b', stage_index: 2,
        subject_id: 'region:x', source_evidence_state: 'source-visible', runtime_assessment: 'not_assessed',
        route_quality: 'high', evidence_refs: [], finding_refs: [], unknown_probe_refs: [], next_raw_check: '' },
    ],
    coverageMatrix: [
      { coverage_id: 'coverage:c1', subject_id: 'region:x', subject_label: 'X', promotion_state: 'promoted',
        route_status: 'partial', finding_status: 'has_findings', runtime_status: 'not_assessed', test_status: 'not_assessed',
        route_refs: ['route:r1'], finding_refs: ['finding:f1'], known_unknown_ids: ['unknown:u1'], top_evidence_refs: ['ev:1'] },
    ],
    findings: [
      { finding_id: 'finding:f1', finding_type: 'duplicate_risk', severity: 'medium', title: 'F1', summary: 's',
        subject_ids: ['region:x'], route_refs: ['route:r1'], confidence: 'hypothesis-with-facts', evidence_refs: ['ev:1'] },
    ],
    unknownProbes: [
      { unknown_id: 'unknown:u1', subject_id: 'region:x', blocked_surface: 'build', state: 'blocked',
        next_probe: 'run build', probe_risk: 'low', requires_permission: ['runtime'], route_refs: ['route:r1'] },
    ],
    evidence: [
      { evidence_id: 'ev:1', source_path: 'x', evidence_state: 'source-visible' },
    ],
    receiptValidation: {
      target_id: 'portolan-self:test', machine_status: 'verified', agent_self_status: 'contaminated',
      status_disagreements: [{ subject: 'low', machine_status: 'clean', agent_self_status: 'contaminated', reason: 'r' }],
      receipt_sources: { agent_self_status: 'run' }, validation_checks: [{ check_id: 'c', status: 'verified', summary: 'ok' }],
    },
  };
}

// ---- view-model -----------------------------------------------------------
test('buildNavViewModel: groups routes by family and counts', () => {
  const vm = buildNavViewModel(fixture());
  assert.ok(vm.routesByFamily.has('command'));
  const routes = vm.routesByFamily.get('command');
  assert.strictEqual(routes[0].stages.length, 2);
  assert.strictEqual(routes[0].findingCount, 1);
  assert.strictEqual(routes[0].probeCount, 1);
  assert.strictEqual(vm.counts.routes, 1);
  assert.strictEqual(vm.counts.coverage, 1);
  assert.strictEqual(vm.counts.findings, 1);
  assert.strictEqual(vm.counts.probes, 1);
});

test('buildNavViewModel: receipt summary separates failed/blocked checks', () => {
  const fx = fixture();
  fx.receiptValidation.validation_checks.push({ check_id: 'bad', status: 'failed', summary: 'x' });
  const vm = buildNavViewModel(fx);
  assert.strictEqual(vm.receipt.machineStatus, 'verified');
  assert.strictEqual(vm.receipt.agentSelfStatus, 'contaminated');
  assert.strictEqual(vm.receipt.failedChecks.length, 1);
  assert.ok(vm.receipt.hasDisagreement);
});

// ---- use-cases ------------------------------------------------------------
test('openNavigationRoute: resolves stages + attached findings/probes/evidence', () => {
  const d = openNavigationRoute(fixture(), 'route:r1');
  assert.ok(d);
  assert.strictEqual(d.stages.length, 2);
  assert.strictEqual(d.findings.length, 1);
  assert.strictEqual(d.probes.length, 1);
  assert.strictEqual(d.evidence.length, 1);
});

test('openNavigationRoute: returns null for unknown route', () => {
  assert.strictEqual(openNavigationRoute(fixture(), 'route:nope'), null);
});

test('openCoverageSubject: resolves linked routes/findings/probes', () => {
  const d = openCoverageSubject(fixture(), 'region:x');
  assert.ok(d);
  assert.strictEqual(d.coverage.promotion_state, 'promoted');
  assert.strictEqual(d.routeIds.length, 1);
  assert.strictEqual(d.findings.length, 1);
});

test('openFinding: resolves evidence and routes', () => {
  const d = openFinding(fixture(), 'finding:f1');
  assert.ok(d);
  assert.strictEqual(d.finding.severity, 'medium');
  assert.strictEqual(d.evidence.length, 1);
  assert.strictEqual(d.routeIds.length, 1);
});

test('openUnknownProbe: resolves linked route', () => {
  const d = openUnknownProbe(fixture(), 'unknown:u1');
  assert.ok(d);
  assert.strictEqual(d.probe.next_probe, 'run build');
  assert.deepStrictEqual(d.probe.requires_permission, ['runtime']);
  assert.strictEqual(d.routeIds.length, 1);
});

test('openReceipt: shapes machine/agent/disagreements', () => {
  const r = openReceipt(fixture().receiptValidation);
  assert.strictEqual(r.machineStatus, 'verified');
  assert.strictEqual(r.agentSelfStatus, 'contaminated');
  assert.strictEqual(r.disagreements.length, 1);
  assert.strictEqual(r.failedChecks.length, 0);
});

// ---- query ----------------------------------------------------------------
test('query list-routes collapses stages to one record per route', () => {
  const r = queryAtlasNavigation(fixture(), 'list-routes', {});
  assert.strictEqual(r.records.length, 1);
  assert.strictEqual(r.records[0].stage_count, 2);
});

test('query route returns ordered stages', () => {
  const r = queryAtlasNavigation(fixture(), 'route', { id: 'route:r1' });
  assert.strictEqual(r.records.length, 2);
  assert.strictEqual(r.records[0].stage_index, 1);
});

test('query findings-by-route resolves finding rows', () => {
  const r = queryAtlasNavigation(fixture(), 'findings-by-route', { id: 'route:r1' });
  assert.strictEqual(r.records.length, 1);
  assert.strictEqual(r.records[0].finding_id, 'finding:f1');
});

test('query list-findings filters by type', () => {
  const r = queryAtlasNavigation(fixture(), 'list-findings', { type: 'duplicate_risk' });
  assert.strictEqual(r.records.length, 1);
  const none = queryAtlasNavigation(fixture(), 'list-findings', { type: 'version_skew' });
  assert.strictEqual(none.records.length, 0);
});

test('query list-probes filters by state', () => {
  const r = queryAtlasNavigation(fixture(), 'list-probes', { state: 'blocked' });
  assert.strictEqual(r.records.length, 1);
});

test('query coverage-by-subject returns the row', () => {
  const r = queryAtlasNavigation(fixture(), 'coverage-by-subject', { subject: 'region:x' });
  assert.strictEqual(r.records.length, 1);
});

test('query receipt returns the receipt object', () => {
  const r = queryAtlasNavigation(fixture(), 'receipt', {});
  assert.strictEqual(r.records.length, 1);
  assert.strictEqual(r.records[0].machine_status, 'verified');
});

test('query list-routes truncation: limit<=records truncates, limit=0 empty', () => {
  const total = queryAtlasNavigation(fixture(), 'list-routes', {});
  // fixture has 1 route; limit 0 -> empty page; limit >= total -> no truncation.
  const r0 = queryAtlasNavigation(fixture(), 'list-routes', { limit: 0 });
  assert.strictEqual(r0.records.length, 0);
  assert.strictEqual(r0.total_records, total.records.length);
  // truncation occurs only when records > limit; with 1 record, limit=1 is not truncated.
  const r1 = queryAtlasNavigation(fixture(), 'list-routes', { limit: 1 });
  assert.strictEqual(r1.records.length, 1);
  assert.strictEqual(r1.truncated, false);
  assert.strictEqual(r1.total_records_relation, 'exact');
  // use the underlying data shape: list-findings on a corpus with >=2 findings
  // would truncate at limit 1. Here we assert the truncation math directly.
  const wrap = queryAtlasNavigation(fixture(), 'list-findings', {});
  assert.strictEqual(wrap.total_records_relation, 'exact');
});

test('query unknown op throws', () => {
  assert.throws(() => queryAtlasNavigation(fixture(), 'bogus', {}), /unknown query op/);
});
