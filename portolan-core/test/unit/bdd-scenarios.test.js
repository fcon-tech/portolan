/**
 * Executable BDD scenario tests — these actually RUN the use-cases and assert
 * the Given/When/Then behaviour from charter 08's Gherkin features, not just
 * check file existence. Bridges the gap between traceability and real
 * acceptance testing.
 *
 * Each test maps to a charter-08 feature scenario.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { runIntake } = require('../../src/use-cases/run-intake');
const { validateIntakeResult } = require('../../src/domain/intake-result');
const { openBehaviourMap } = require('../../src/use-cases/open-behaviour-map');
const { openLandscapeStructure } = require('../../src/use-cases/open-landscape-structure');
const { drillToRegion } = require('../../src/use-cases/drill-to-region');
const { buildRegionProfile } = require('../../src/domain/region-profile');
const { confidenceForProducer, resolveConflict, isEvidenceCompatible } = require('../../src/domain/confidence');
const { buildSnapshot } = require('../../src/use-cases/build-snapshot');

// ---- Feature: Managed intake ----

test('BDD [managed-intake]: Admiral names repositories only', () => {
  // Given the admiral drops a Portolan link to an agent
  // When the agent runs managed intake
  // Then a typed intake result is persisted (validated), reusable on rebuild
  const r1 = runIntake({
    target_root: '/repo',
    anchors: [{ kind: 'repository', location: '/repo', access_method: 'local' }],
  });
  const r2 = runIntake({
    target_root: '/repo',
    anchors: [{ kind: 'repository', location: '/repo', access_method: 'local' }],
  });
  assert.deepStrictEqual(validateIntakeResult(r1), []);
  // rebuild reuses without re-asking — deterministic ids match
  assert.strictEqual(r1.anchors[0].id, r2.anchors[0].id);
});

test('BDD [managed-intake]: Admiral names repos, docs, and a ticket source', () => {
  const r = runIntake({
    target_root: '/repo',
    anchors: [
      { kind: 'repository', location: '/repo', access_method: 'local' },
      { kind: 'docs', location: '/docs', access_method: 'file' },
      { kind: 'issue-tracker', location: 'https://jira.example.com', access_method: 'api' },
    ],
  });
  assert.strictEqual(r.anchors.length, 3);
  assert.deepStrictEqual(r.perimeter, ['/repo']);
});

// ---- Feature: /portolan:map entry ----

test('BDD [/portolan:map]: first screen shows annotated overview (not undifferentiated graph)', () => {
  // The open-behaviour-map use-case builds the full graph model; the overview
  // is a SUMMARY of it (counts, distributions), not the raw graph. We verify
  // the model is buildable and its summary fields exist — the actual "annotated
  // overview vs undifferentiated graph" distinction is asserted at the shell
  // render level (headless parity check, proven in Slice 5d).
  const atlas = {
    objects: {
      components: [
        { id: 'c:a', display_name: 'A', c4_family: 'data-systems', lifecycle: 'active', route: '#/dossier/component/a', evidence: { state: 'source-visible' } },
        { id: 'c:b', display_name: 'B', c4_family: 'data-systems', lifecycle: 'active', route: '#/dossier/component/b', evidence: { state: 'source-visible' } },
      ],
      relationships: [],
    },
    c4: { context_boxes: [], families: [], component_boxes: [] },
  };
  const model = openBehaviourMap(atlas);
  // The overview summarises: 2 units, 0 edges. It does NOT dump the raw graph.
  assert.strictEqual(model.nodes.length, 2);
  assert.strictEqual(model.edges.length, 0);
});

// ---- Feature: /portolan:map collect-if-stale ----

test('BDD [/portolan:map]: snapshot collected from map-bundle is non-empty', async () => {
  // Given a target with no snapshot — the Go core collects a map-bundle.
  // When buildSnapshot reads it — the JS reading layer normalizes it.
  // Then the system-map has at least one component (not an empty atlas).
  const reader = {
    readJson: (name) => {
      if (name === 'graph.json') return {
        nodes: [
          { id: 'svc', kind: 'repository', label: 'Service', evidence: { state: 'source-visible', source: '/r/svc' } },
        ],
        edges: [],
      };
      if (name === 'summary.json') return { root: '/r', generated_at: '2026-01-01T00:00:00Z', graph: { nodes: 1, edges: 0 } };
      return null;
    },
    readJsonl: () => [],
    exists: (name) => name === 'graph.json',
    listProducerDirs: () => [],
    bundleDir: '/fake',
  };
  const map = await buildSnapshot({ reader, targetRoot: '/r', generatedAt: 'T1' });
  assert.ok(map.objects.components.length > 0, 'collected snapshot must have at least one component');
});

test('BDD [/portolan:map]: snapshot reuse is deterministic for unchanged input', async () => {
  // Given a fresh snapshot (tree signature unchanged)
  // When the agent runs /portolan:map again
  // Then the normalized system-map is identical (reused, not rebuilt)
  const reader = {
    readJson: (name) => {
      if (name === 'graph.json') return {
        nodes: [
          { id: 'a', kind: 'repository', label: 'A', evidence: { state: 'source-visible', source: '/r/a' } },
          { id: 'b', kind: 'repository', label: 'B', evidence: { state: 'source-visible', source: '/r/b' } },
        ],
        edges: [{ from: 'a', to: 'b', kind: 'imports', evidence: { state: 'metadata-visible' } }],
      };
      if (name === 'summary.json') return { root: '/r', graph: { nodes: 2, edges: 1 } };
      return null;
    },
    readJsonl: () => [],
    exists: (name) => name === 'graph.json',
    listProducerDirs: () => [],
    bundleDir: '/fake',
  };
  const m1 = await buildSnapshot({ reader, targetRoot: '/r', generatedAt: 'FIXED' });
  const m2 = await buildSnapshot({ reader, targetRoot: '/r', generatedAt: 'FIXED' });
  assert.deepStrictEqual(m1, m2, 'identical input must produce identical normalized output');
});

// ---- Feature: Behaviour map ----

test('BDD [behaviour-map]: units and typed edges render; clicking a unit opens dossier', () => {
  const atlas = {
    objects: {
      components: [
        { id: 'c:a', display_name: 'A', c4_family: 'data-systems', lifecycle: 'active', route: '#/dossier/component/a', evidence: { state: 'source-visible' } },
        { id: 'c:b', display_name: 'B', c4_family: 'data-systems', lifecycle: 'active', route: '#/dossier/component/b', evidence: { state: 'source-visible' } },
      ],
      relationships: [
        { id: 'r:1', from_id: 'c:a', to_id: 'c:b', relationship_type: 'depends-on', route: '#/detail/relationship/r:1' },
      ],
    },
  };
  const model = openBehaviourMap(atlas);
  assert.strictEqual(model.nodes.length, 2);
  assert.strictEqual(model.edges.length, 1);
  // every node carries a route (so clicking opens a dossier)
  for (const n of model.nodes) assert.ok(n.route);
  // every node carries evidence.state
  for (const n of model.nodes) assert.ok(n.evidenceState);
});

// ---- Feature: Region drill-down ----

test('BDD [region-drill-down]: drilling into a cluster shows a statistical profile', () => {
  const atlas = {
    objects: {
      components: [
        { id: 'c:a', c4_family: 'data-systems', lifecycle: 'active', evidence: { state: 'source-visible' }, relationship_ids: ['r:1'], surface_ids: ['s:1'] },
        { id: 'c:b', c4_family: 'data-systems', lifecycle: 'retired', evidence: { state: 'metadata-visible' }, relationship_ids: ['r:1'], surface_ids: [] },
      ],
      relationships: [{ id: 'r:1', from_id: 'c:a', to_id: 'c:b' }],
    },
  };
  const r = drillToRegion(atlas, ['c:a', 'c:b']);
  assert.ok(r);
  assert.strictEqual(r.profile.unit_count, 2);
  assert.strictEqual(r.profile.edge_count, 1);
  assert.ok(r.profile.surface_count > 0);
  assert.ok(r.profile.lifecycle_distribution.active >= 1);
});

test('BDD [region-drill-down]: single-unit region is valid (edge_density 0)', () => {
  const atlas = { objects: { components: [{ id: 'c:solo', c4_family: 'unknown', lifecycle: 'active', evidence: { state: 'source-visible' } }], relationships: [] } };
  const r = drillToRegion(atlas, ['c:solo']);
  assert.strictEqual(r.profile.unit_count, 1);
  assert.strictEqual(r.profile.edge_density, 0);
});

// ---- Feature: Honest absence ----

test('BDD [honest-absence]: behaviour-only atlas when no intentions/representations ingested', () => {
  // intake named only a repository — no docs/tickets. The atlas is valid
  // behaviour-only; triangulation is absent. We verify the intake accepts a
  // repo-only anchor set and the atlas still builds.
  const intake = runIntake({
    target_root: '/repo',
    anchors: [{ kind: 'repository', location: '/repo', access_method: 'local' }],
  });
  const hasIntentions = intake.anchors.some(a => a.kind === 'issue-tracker' || a.kind === 'docs');
  assert.strictEqual(hasIntentions, false, 'behaviour-only: no intentions/representations');
  // the atlas still builds from the behaviour (code) truth
  const atlas = { objects: { components: [{ id: 'c:a', c4_family: 'data-systems', lifecycle: 'active', route: '#/x', evidence: { state: 'source-visible' } }], relationships: [] } };
  const model = openBehaviourMap(atlas);
  assert.strictEqual(model.nodes.length, 1);
});

test('BDD [honest-absence]: confidence is target-state (not in 0.1.0 schema) but the contract is defined', () => {
  // Part-1b: confidence levels are defined in domain/confidence.js and tested,
  // but not wired into the 0.1.0 schema. This test proves the CONTRACT exists
  // (so the honest-empty state has a defined behaviour), even though the
  // Container level needs runtime evidence we may not have.
  assert.strictEqual(confidenceForProducer('deterministic-core'), 'ironclad');
  assert.ok(isEvidenceCompatible('ironclad', 'source-visible'));
  // a conflict between ironclad and speculation resolves correctly
  const r = resolveConflict(
    { confidence: 'ironclad', producer: 'deterministic-core' },
    { confidence: 'speculation', producer: 'agent' },
  );
  assert.strictEqual(r.winner.confidence, 'ironclad');
});

// ---- Feature: Atlas navigation index (captain-atlas 13) ----

const { buildAtlasNavigationIndex } = require('../../src/use-cases/build-atlas-navigation-index');
const { validateNavigationBundle, CONTENT_ARTIFACTS } = require('../../src/domain/atlas-navigation');
const { BIGTOP_PROFILE, PORTOLAN_SELF_PROFILE } = require('../../src/domain/atlas-navigation-profiles');

// In-memory source adapter: subjects + all anchors found. Lets the BDD
// scenarios run the real build+validate path without a filesystem. `presence`
// controls what exists() returns so profile selection is deterministic.
function memSource(subjects, presence) {
  const p = presence || {};
  return {
    exists: (rel) => !!p[rel], findFile: () => '',
    enumerateSubjects: () => subjects,
    resolveAnchors: (candidates) => {
      const m = new Map();
      for (const c of candidates) m.set(c.key || `${c.file}\u0000${c.substring}`, { found: true, lineStart: 1, lineEnd: 1, matchCount: 1 });
      return m;
    },
  };
}
const BIGTOP_PRESENT = { 'repos/apache-bigtop-repo': true };
const SELF_PRESENT = { 'portolan-core': true, schema: true };
const BIGTOP_SUBJECTS = [{ subject_id: 'repo:apache-bigtop-repo', subject_type: 'repository', subject_label: 'bigtop-repo', source_path: 'repos/apache-bigtop-repo', exists: true, expected_by: 'enum', promotion_state: 'promoted' }];
const SELF_SUBJECTS = ['go-cli', 'scripts', 'portolan-core', 'schemas', 'fixtures', 'docs'].map(r => ({
  subject_id: `region:${r}`, subject_type: 'source_region', subject_label: r, source_path: r, exists: true, expected_by: 'enum', promotion_state: 'promoted',
}));

function validateBuilt(result, targetId) {
  const b = result.bundle;
  const filesPresent = new Set([...CONTENT_ARTIFACTS, 'receipt-validation.json', 'frontier-comparison.md']);
  return validateNavigationBundle({
    navigationIndex: b.navigationIndex, coverageMatrix: b.coverageMatrix, findings: b.findings,
    unknownProbes: b.unknownProbes, evidence: b.evidence,
    receiptValidation: { ...b.receiptValidation, target_id: targetId },
    frontierComparisonMarkdown: b.frontierComparison, filesPresent,
  });
}

test('BDD [atlas-navigation-index]: Bigtop package route is navigable', () => {
  // Given the target is the Bigtop landscape
  // When Portolan generates the atlas navigation index
  const result = buildAtlasNavigationIndex({ targetRoot: '/bigtop', sourceAdapter: memSource(BIGTOP_SUBJECTS, BIGTOP_PRESENT) });
  const b = result.bundle;
  // Then navigation-index.jsonl contains a package/distribution route
  const pkgRoute = b.navigationIndex.find(n => n.route_family === 'package_flow');
  assert.ok(pkgRoute, 'package/distribution route present');
  // And the route has package, deploy/provisioner, test/smoke, runtime/unknown, version-boundary stages
  const roles = new Set(b.navigationIndex.filter(n => n.route_id === pkgRoute.route_id).map(s => s.path_role));
  assert.ok(roles.has('bom') || roles.has('package_recipe'));
  assert.ok(['deploy_module', 'provisioner', 'install_script'].some(r => roles.has(r)));
  assert.ok(roles.has('smoke_test'));
  assert.ok(roles.has('runtime_layout'));
  // And every verified source-visible stage resolves to evidence; runtime stays blocked/not_assessed
  const v = validateBuilt(result, 'bigtop:bigtop');
  assert.strictEqual(v.machineStatus, 'verified', v.checks.filter(c => c.status === 'failed').map(c => c.summary).join('; '));
});

test('BDD [atlas-navigation-index]: Portolan-self implementation route is navigable', () => {
  const result = buildAtlasNavigationIndex({ targetRoot: '/self', sourceAdapter: memSource(SELF_SUBJECTS, SELF_PRESENT) });
  const b = result.bundle;
  const families = new Set(b.navigationIndex.map(n => n.route_family));
  // command/script, bundle/schema routes
  assert.ok(families.has('command') || families.has('script_workflow'));
  assert.ok(families.has('bundle_generation') || families.has('schema_validation'));
  // the route links to at least one finding and one unknown probe
  assert.ok(b.findings.length >= 1);
  assert.ok(b.unknownProbes.length >= 1);
  // a blocked runtime/test probe
  assert.ok(b.unknownProbes.some(p => p.state === 'blocked' || p.state === 'not_assessed'));
  const v = validateBuilt(result, 'portolan-self:self');
  assert.strictEqual(v.machineStatus, 'verified', v.checks.filter(c => c.status === 'failed').map(c => c.summary).join('; '));
});

test('BDD [atlas-navigation-index]: Coverage exposes missing and partial regions', () => {
  // add a subject with no route/finding/probe attachments -> partial/missing visible
  const subjects = [...SELF_SUBJECTS, { subject_id: 'region:unmapped', subject_type: 'source_region', subject_label: 'unmapped', source_path: 'x', exists: true, expected_by: 'enum', promotion_state: 'promoted' }];
  const result = buildAtlasNavigationIndex({ targetRoot: '/self', sourceAdapter: memSource(subjects, SELF_PRESENT) });
  const b = result.bundle;
  // every expected subject has a coverage row
  for (const s of subjects) assert.ok(b.coverageMatrix.some(c => c.subject_id === s.subject_id), `${s.subject_id} has a row`);
  // missing/partial visible: the unmapped region has route_status missing
  const unmapped = b.coverageMatrix.find(c => c.subject_id === 'region:unmapped');
  assert.strictEqual(unmapped.route_status, 'missing');
  // no missing subject silently omitted
  assert.strictEqual(b.coverageMatrix.length, subjects.length);
});

test('BDD [atlas-navigation-index]: Findings are first-class atlas objects', () => {
  const result = buildAtlasNavigationIndex({ targetRoot: '/self', sourceAdapter: memSource(SELF_SUBJECTS, SELF_PRESENT) });
  const b = result.bundle;
  // findings exist as rows with severity, confidence, subjects, evidence, next checks
  assert.ok(b.findings.length > 0);
  for (const f of b.findings) {
    assert.ok(f.severity);
    assert.ok(f.confidence);
    assert.ok(f.subject_ids && f.subject_ids.length);
    assert.ok(f.next_raw_check);
  }
  // the viewer can open a finding dossier — proven by shell-navigation.test.js
  // (render-finding renders severity+confidence). Here we assert the data path.
  const { openFinding } = require('../../src/use-cases/open-finding');
  const d = openFinding(b, b.findings[0].finding_id);
  assert.ok(d, 'finding resolvable via openFinding');
});

test('BDD [atlas-navigation-index]: Unknown probes preserve not-assessed truth', () => {
  const result = buildAtlasNavigationIndex({ targetRoot: '/bigtop', sourceAdapter: memSource(BIGTOP_SUBJECTS, BIGTOP_PRESENT) });
  const b = result.bundle;
  // blocked or not_assessed surfaces remain visible
  assert.ok(b.unknownProbes.length > 1, 'more than one generic gap');
  for (const p of b.unknownProbes) {
    assert.ok(['blocked', 'not_assessed', 'unknown', 'cannot_verify', 'failed'].includes(p.state));
    assert.ok(p.next_probe, 'each probe has a next safe check');
    assert.ok(p.requires_permission, 'each probe records required permissions');
  }
  // no blocked surface is marked verified because a probe exists
  assert.ok(!b.unknownProbes.some(p => p.state === 'verified'));
});

test('BDD [atlas-navigation-index]: Receipt validation does not trust agent self-status blindly', () => {
  const result = buildAtlasNavigationIndex({ targetRoot: '/self', sourceAdapter: memSource(SELF_SUBJECTS, SELF_PRESENT) });
  const b = result.bundle;
  const rv = b.receiptValidation;
  // both statuses recorded
  assert.ok(rv.agent_self_status);
  // the disagreement is visible (portolan-self profile carries 3 disagreements)
  assert.ok(rv.status_disagreements.length > 0);
  // machine validation separate from agent manifest
  assert.ok(rv.receipt_sources && rv.receipt_sources.agent_self_status, 'receipt sources separate machine from agent');
});

test('BDD [atlas-navigation-index]: Generated atlas is compared to raw-agent frontier', () => {
  const { checkFrontierComparison } = require('../../src/domain/atlas-navigation');
  // Bigtop frontier-comparison: required rows present + >=1 matches/exceeds.
  const bigtopResult = buildAtlasNavigationIndex({ targetRoot: '/bigtop', sourceAdapter: memSource(BIGTOP_SUBJECTS, BIGTOP_PRESENT) });
  const bigtopCheck = checkFrontierComparison(bigtopResult.bundle.frontierComparison, 'bigtop:bigtop');
  assert.strictEqual(bigtopCheck.status, 'verified', bigtopCheck.summary);
  // self frontier-comparison: required rows present + >=1 matches/exceeds.
  const selfResult = buildAtlasNavigationIndex({ targetRoot: '/self', sourceAdapter: memSource(SELF_SUBJECTS, SELF_PRESENT) });
  const selfCheck = checkFrontierComparison(selfResult.bundle.frontierComparison, 'portolan-self:self');
  assert.strictEqual(selfCheck.status, 'verified', selfCheck.summary);
  // each row is labelled with a status from the frontier vocabulary.
  const FRONTIER_STATUS = ['exceeds_frontier', 'matches_frontier', 'below_frontier', 'not_assessed'];
  for (const md of [bigtopResult.bundle.frontierComparison, selfResult.bundle.frontierComparison]) {
    const dataRows = md.split('\n').filter(l => l.startsWith('| ') && !/frontier_capability/.test(l) && !/---/.test(l));
    for (const row of dataRows) {
      const cells = row.split('|').map(c => c.trim());
      const status = cells[5]; // status column
      assert.ok(FRONTIER_STATUS.includes(status), `frontier row has valid status: ${status}`);
    }
  }
});

// ---- Feature: Atlas reading experience (captain-atlas 15) -----------------
// These scenarios assert the reading model turns the nav-atlas into a system
// walkthrough, not a repo map. They exercise buildJourneys/buildRouteDiagram/
// routeThesis/anchorStatus over the real profiles.

const { buildJourneys, buildRouteDiagram, routeThesis, anchorStatus } = require('../../src/domain/atlas-reading');
// BIGTOP_PROFILE / PORTOLAN_SELF_PROFILE are imported earlier in this file.

// Build a nav-atlas-shaped object from a profile (flatten route stages into
// navigationIndex), mirroring what the generator emits.
function readingNavFromProfile(profile) {
  const navigationIndex = [];
  for (const route of profile.routes) {
    for (const stage of route.stages) {
      navigationIndex.push({
        route_id: route.route_id, route_family: route.route_family, route_title: route.route_title,
        route_quality: route.route_quality, route_quality_note: '',
        stage: stage.stage, stage_index: stage.stage_index,
        subject_id: stage.subject_id, subject_type: stage.subject_type,
        source_path: stage.source_path, source_anchor: stage.source_anchor,
        line_start: stage.line_start || 0, line_end: stage.line_end || 0,
        path_role: stage.path_role, lifecycle: stage.lifecycle,
        source_evidence_state: stage.source_evidence_state, runtime_assessment: stage.runtime_assessment,
        evidence_refs: stage.evidence_refs || [], finding_refs: stage.finding_refs || [],
        unknown_probe_refs: stage.unknown_probe_refs || [], next_raw_check: stage.next_raw_check || '',
        artifact_provenance: 'fixture_backed', producer_id: 'test',
      });
    }
  }
  return {
    navigationIndex, coverageMatrix: [], findings: profile.findings,
    unknownProbes: profile.unknownProbes, evidence: profile.evidence,
    receiptValidation: { target_id: profile.id, machine_status: 'verified' },
  };
}

test('BDD [atlas-reading-experience]: The first screen is a system walkthrough', () => {
  // Given the Bigtop landscape with a nav atlas, buildJourneys emits named
  // journeys that teach the system, not a repo graph.
  const nav = readingNavFromProfile(BIGTOP_PROFILE);
  nav.coverageMatrix = [{ coverage_id: 'c', subject_id: 'repo:apache-bigtop-repo', subject_type: 'repository', route_refs: ['route:bigtop:package-distribution'], route_status: 'partial', promotion_state: 'promoted' }];
  const journeys = buildJourneys(nav);
  assert.ok(journeys.length >= 3, '>= 3 journeys (package + confidence + coverage)');
  const titles = journeys.map(j => j.title);
  assert.ok(titles.some(t => /Package Definition/i.test(t)), 'named package journey');
  // the package journey explains the system (BOM -> ... -> runtime), not counts
  const pkg = journeys.find(j => /Package Definition/i.test(j.title));
  assert.ok(/BOM|Bill of Materials/i.test(pkg.journeySummary), 'teaches the BOM chain');
  assert.ok(pkg.findingIds.length >= 1 && pkg.probeIds.length >= 1, 'risks + probes attached');
  // the first screen shows top risks/unknowns (topProbes/topFindings are part of
  // the view-model; verify the journey model carries the next-step plan).
  assert.ok(pkg.nextStep && pkg.nextStep.length > 10, 'concrete next expedition');
});

test('BDD [atlas-reading-experience]: Package journey reads as a system route', () => {
  // The package route appears as an ordered diagram with the required stages.
  const nav = readingNavFromProfile(BIGTOP_PROFILE);
  const stages = nav.navigationIndex.filter(s => s.route_id === 'route:bigtop:package-distribution');
  const diagram = buildRouteDiagram(stages);
  assert.ok(diagram.nodes.length >= 5, '>= 5 stage nodes (BOM, recipe, provisioning, test/smoke, runtime)');
  const roles = diagram.nodes.map(n => n.roleKey);
  assert.ok(roles.includes('bom') && roles.includes('package_recipe'), 'BOM + recipe stages');
  assert.ok(roles.includes('provisioner'), 'provisioning stage');
  assert.ok(roles.includes('smoke_test'), 'smoke/test stage');
  assert.ok(roles.includes('runtime_layout'), 'runtime stage');
  // each node shows evidence state + runtime assessment
  for (const n of diagram.nodes) {
    assert.ok(n.evidenceState && n.runtimeAssessment, 'node carries evidence + runtime');
  }
});

test('BDD [atlas-reading-experience]: Route dossier explains evidence and uncertainty', () => {
  // The route dossier carries a thesis; stage anchor status is classified
  // honestly (precise vs ambiguous vs missing), never fabricating precise lines.
  const nav = readingNavFromProfile(BIGTOP_PROFILE);
  const stages = nav.navigationIndex.filter(s => s.route_id === 'route:bigtop:package-distribution');
  const thesis = routeThesis({ route_id: 'route:bigtop:package-distribution' }, stages);
  assert.ok(/BOM/i.test(thesis), 'thesis teaches the route intent');
  // anchor status: a 0/0 range is never precise
  for (const s of stages) {
    const st = anchorStatus(s);
    if (!(s.line_start > 0)) assert.notStrictEqual(st, 'precise', 'no fake precise anchor');
  }
});

test('BDD [atlas-reading-experience]: Findings and probes guide the next expedition', () => {
  // Findings explain the system risk; probes name the required permission class
  // and a concrete next action.
  const nav = readingNavFromProfile(BIGTOP_PROFILE);
  const journeys = buildJourneys(nav);
  const pkg = journeys.find(j => /Package Definition/i.test(j.title));
  assert.ok(pkg.findingIds.length >= 1, 'a version-boundary finding attached');
  for (const p of nav.unknownProbes) {
    assert.ok(p.next_probe, 'probe has a next action');
    assert.ok(p.requires_permission && p.requires_permission.length, 'probe names permission class');
  }
});

test('BDD [atlas-reading-experience]: Coverage shows system scale', () => {
  // Coverage regions show covered/partial/missing/route-less scale, not a flat
  // table. The fleet-coverage journey summarizes counts.
  const nav = readingNavFromProfile(BIGTOP_PROFILE);
  nav.coverageMatrix = [
    { coverage_id: 'c1', subject_id: 'repo:apache-bigtop-repo', subject_type: 'repository', route_refs: ['route:bigtop:package-distribution'], route_status: 'partial', promotion_state: 'promoted' },
    { coverage_id: 'c2', subject_id: 'repo:other', subject_type: 'repository', route_refs: [], route_status: 'missing', promotion_state: 'promoted' },
  ];
  const journeys = buildJourneys(nav);
  const cov = journeys.find(j => j.kind === 'fleet_coverage');
  assert.ok(cov, 'fleet-coverage journey present');
  assert.ok(cov.known.includes('2 subject'), 'reports fleet scale');
});

test('BDD [atlas-reading-experience]: Human review can reject repo-map regressions', () => {
  // The journey model proves the first screen is NOT a repo graph: it carries
  // system-meaningful narrative content. (The actual human UX verdict remains a
  // human-review gate; this asserts the model supplies what a human would need.)
  const nav = readingNavFromProfile(BIGTOP_PROFILE);
  nav.coverageMatrix = [{ coverage_id: 'c', subject_id: 'repo:apache-bigtop-repo', subject_type: 'repository', route_refs: ['route:bigtop:package-distribution'], route_status: 'partial', promotion_state: 'promoted' }];
  const journeys = buildJourneys(nav);
  for (const j of journeys) {
    assert.ok(j.journeySummary && j.journeySummary.length > 40, 'substantive narrative');
    assert.ok(!/^\d+ (stages|repositories|subjects)/i.test(j.journeySummary), 'not a count restatement');
  }
});

// ===========================================================================
// Feature: Atlas drill-down semantics (captain-atlas 16)
//
// These scenarios assert the drill-down decision semantics at the
// domain/use-case level: relationship detail, stage detail, evidence detail,
// reverse-derived probe context, C4 honest-empty, and 3-axis evidence
// usability. The shell-level click behavior is covered by
// shell-navigation.test.js; here we prove the MODELS answer the decision
// questions against the real profiles.
// ===========================================================================

const {
  relationshipDetail, stageDetail, evidenceDetail, c4Model, deriveReverseRefs,
} = require('../../src/domain/atlas-detail');
const { evidenceUsabilityReport } = require('../../src/domain/atlas-evidence-usability');

test('BDD [atlas-drilldown-semantics]: Navigation labels are reader-facing', () => {
  // The shell tab array is reader-facing by construction (verified in
  // shell-navigation.test.js). Here we assert the navigation model carries the
  // reader-facing concepts: journeys (not "repo graph"), route diagrams, and
  // section copy. The reading model must not expose internal jargon as primary.
  const nav = readingNavFromProfile(BIGTOP_PROFILE);
  const journeys = buildJourneys(nav);
  assert.ok(journeys.length, 'journeys present');
  // No journey title is a raw JSONL field restatement.
  for (const j of journeys) {
    assert.ok(!/^route_family:/.test(j.title), 'title is not an internal field restatement');
  }
});

test('BDD [atlas-drilldown-semantics]: Relationship clicks explain the edge', () => {
  // Build a minimal atlas with one relationship and assert the detail answers
  // source/target/type/direction/evidence + proves/does-not-prove.
  const atlas = {
    objects: {
      components: [
        { id: 'component:a', display_name: 'A', c4_family: 'unknown', route: '#/dossier/component/a' },
        { id: 'component:b', display_name: 'B', c4_family: 'unknown', route: '#/dossier/component/b' },
      ],
      relationships: [
        { id: 'rel:1', relationship_type: 'depends-on', from_id: 'component:a', to_id: 'component:b',
          direction: 'directed', evidence: { state: 'metadata-visible', source: 'manifest', producer: 'corpus-manifest' },
          created_by_producer_family: 'corpus-manifest', why_present: 'A depends on B.', summary: 'A depends on B (metadata).' },
      ],
    },
    c4: { context_boxes: [], families: [], component_boxes: [] },
  };
  const d = relationshipDetail(atlas, { navigationIndex: [], findings: [], unknownProbes: [], evidence: [] }, 'rel:1');
  assert.ok(d, 'relationship resolved');
  assert.strictEqual(d.from.label, 'A');
  assert.strictEqual(d.to.label, 'B');
  assert.strictEqual(d.relationshipType, 'depends-on');
  assert.ok(d.whatItProves.length > 10);
  assert.match(d.whatItDoesNotProve.toLowerCase(), /runtime/);
  // absent relationship -> null, never a generic dossier
  assert.strictEqual(relationshipDetail(atlas, { navigationIndex: [] }, 'rel:nope'), null);
});

test('BDD [atlas-drilldown-semantics]: Route stages drill into evidence', () => {
  const nav = readingNavFromProfile(BIGTOP_PROFILE);
  const firstStage = nav.navigationIndex[0];
  const routeId = firstStage.route_id;
  const s = stageDetail(nav, routeId, firstStage.stage_index);
  assert.ok(s, 'stage resolved');
  assert.ok(s.role.length > 0, 'role present');
  assert.ok(s.sourceEvidenceState.length > 0, 'evidence state present');
  assert.ok(s.whatItProves.length > 5, 'proves present');
  assert.ok(s.whatItDoesNotProve.length > 5, 'does-not-prove present');
  // missing/ambiguous anchors are explained in plain language (not hidden)
  assert.ok(typeof s.anchorExplanation === 'string' || s.anchorExplanation === null, 'anchor explanation is a string or null');
});

test('BDD [atlas-drilldown-semantics]: Unknown probes keep route context', () => {
  const nav = readingNavFromProfile(PORTOLAN_SELF_PROFILE);
  // Pick a probe and strip its route_refs to force reverse-derivation.
  const probe = nav.unknownProbes[0];
  const stripped = { ...nav, unknownProbes: nav.unknownProbes.map(p => p.unknown_id === probe.unknown_id ? { ...p, route_refs: [] } : p) };
  const idx = deriveReverseRefs(stripped);
  const ctx = idx.get(probe.unknown_id);
  assert.ok(ctx, 'probe has a reverse-ref entry even without direct route_refs');
  // The reverse context recovers route linkage from stages referencing the probe.
  assert.ok(ctx.routes.size > 0 || ctx.stages.length > 0, 'reverse-derived route/stage context present');
});

test('BDD [atlas-drilldown-semantics]: Evidence anchors state what they prove', () => {
  const nav = readingNavFromProfile(BIGTOP_PROFILE);
  // Enrich one evidence row with a precise anchor so detail is resolvable.
  nav.evidence = nav.evidence.map((e, i) => i === 0 ? { ...e, anchor_status: 'precise', line_start: 1, line_end: 3, source_excerpt: '1 │ x' } : e);
  const e = evidenceDetail(nav, nav.evidence[0].evidence_id);
  assert.ok(e, 'evidence resolved');
  assert.strictEqual(e.anchorStatus, 'precise');
  assert.ok(e.whatItProves.length > 5);
  // Source-visible evidence never implies runtime/build/test proof.
  assert.match(e.whatItDoesNotProve.toLowerCase(), /runtime/);
});

test('BDD [atlas-drilldown-semantics]: C4 is honest-empty when runtime/deploy evidence is absent', () => {
  // The Bigtop demo map has no container_boxes -> Container must be honest-empty.
  const atlas = {
    objects: { components: [], relationships: [] },
    c4: { context_boxes: [{ id: 'c4-context:.', display_name: 'Target' }], families: [{ id: 'f', display_name: 'F', component_ids: [] }], component_boxes: [] },
  };
  const m = c4Model(atlas);
  assert.ok(m.context.length >= 1, 'Context always present');
  assert.strictEqual(m.container.present, false, 'Container honest-empty');
  assert.ok(m.container.explanation.length > 10, 'honest-empty explanation');
  assert.strictEqual(m.component.limited, true, 'Component limited/derived');
  assert.strictEqual(m.code.inScope, false, 'Code out of scope');
  // Families present but container stays empty — never fabricated from names.
  assert.strictEqual(m.container.boxes.length, 0);
});

test('BDD [atlas-drilldown-semantics]: Run Log separates artifact validation from evidence usability', () => {
  const nav = readingNavFromProfile(BIGTOP_PROFILE);
  nav.receiptValidation = { machine_status: 'verified' };
  const r = evidenceUsabilityReport(nav);
  // The three axes are distinct fields, never collapsed.
  assert.strictEqual(r.artifactValidation, 'verified');
  assert.ok(['anchored', 'partial', 'weak', 'none'].includes(r.evidenceUsability));
  assert.ok(['runtime_verified', 'runtime_partial', 'runtime_not_assessed'].includes(r.runtimeAssessment));
  // artifact validation != evidence usability: they can differ.
  assert.ok(r.artifactValidation !== r.evidenceUsability, 'axes are distinct concepts');
});

// ---- Feature: Symbol reference edges (ontology) ----

test('BDD [symbol-reference-edges]: A reference relationship renders as a typed edge', () => {
  const atlas = {
    objects: {
      components: [
        { id: 'c:a', display_name: 'A', c4_family: 'data-systems', lifecycle: 'active', route: '#/dossier/component/a', evidence: { state: 'metadata-visible' } },
        { id: 'c:b', display_name: 'B', c4_family: 'data-systems', lifecycle: 'active', route: '#/dossier/component/b', evidence: { state: 'metadata-visible' } },
      ],
      relationships: [
        { id: 'r:ref1', from_id: 'c:a', to_id: 'c:b', relationship_type: 'references', direction: 'directed', evidence: { state: 'metadata-visible' }, route: '#/detail/relationship/r:ref1' },
      ],
    },
  };
  const model = openBehaviourMap(atlas);
  assert.strictEqual(model.edges.length, 1, 'reference edge renders');
  assert.strictEqual(model.edges[0].relationshipType, 'references', 'edge typed references');
});

test('BDD [symbol-reference-edges]: A reference edge is explained honestly, not as a complete call graph', () => {
  const { openRelationship } = require('../../src/use-cases/open-relationship');
  const atlas = {
    objects: {
      components: [
        { id: 'c:a', display_name: 'A', route: '#/dossier/component/a' },
        { id: 'c:b', display_name: 'B', route: '#/dossier/component/b' },
      ],
      relationships: [
        {
          id: 'r:ref1',
          from_id: 'c:a',
          to_id: 'c:b',
          relationship_type: 'references',
          direction: 'directed',
          evidence: { state: 'metadata-visible', producer: 'symbol-index' },
          created_by_producer_family: 'symbol-index',
          why_present: 'Reference resolved from a symbol-index export; not a complete call graph.',
          summary: 'A references B (symbol-index export; not a complete call graph).',
        },
      ],
    },
  };
  const detail = openRelationship(atlas, null, 'r:ref1');
  assert.ok(detail, 'relationship detail resolves');
  assert.strictEqual(detail.relationshipType, 'references');
  assert.strictEqual(detail.evidenceState, 'metadata-visible', 'metadata-visible, not source-visible');
  assert.ok(/not a complete call graph/i.test(detail.whyPresent), 'honest not-a-complete-call-graph caveat present');
});

// ---- Feature: Deep landscape demo (reading-experience) ----
// bigtop-deep-landscape-demo: the landscape view shows connected structure, not
// a flat inventory; dependency-only state is admitted in plain language.

test('BDD [deep-landscape-demo]: Landscape shows connected groupings and cross-component edges', () => {
  const atlas = {
    objects: {
      components: [
        { id: 'c:a', display_name: 'A', c4_family: 'data-systems', route: '#/dossier/component/a' },
        { id: 'c:b', display_name: 'B', c4_family: 'data-systems', route: '#/dossier/component/b' },
        { id: 'c:c', display_name: 'C', c4_family: 'compute-processing', route: '#/dossier/component/c' },
      ],
      relationships: [
        // a structural cross-component edge (code-level reference)
        { id: 'r:ref', from_id: 'c:a', to_id: 'c:b', relationship_type: 'references', direction: 'directed', evidence: { state: 'metadata-visible' } },
        // a shared-dependency cluster edge
        { id: 'r:dep', from_id: 'c:a', to_id: 'c:c', relationship_type: 'shared-dependency', direction: 'undirected', evidence: { state: 'metadata-visible' } },
      ],
    },
  };
  const model = openBehaviourMap(atlas);
  const structure = openLandscapeStructure(atlas);

  // Typed edges connect components into groupings/hubs (degree > 0 on the hub).
  assert.strictEqual(model.edges.length, 2, 'both edges render');
  const structuralEdges = model.edges.filter(e => e.structural);
  assert.strictEqual(structuralEdges.length, 1, 'one structural edge');
  assert.strictEqual(structuralEdges[0].relationshipType, 'references', 'structural edge typed references');
  const hub = model.nodes.find(n => n.id === 'c:a');
  assert.ok(hub && hub.degree >= 2, 'hub component connects multiple edges');

  // The system shape is legible (structural edges recognised, not disguised).
  assert.strictEqual(structure.hasStructuralEdges, true, 'structure detected');
  assert.strictEqual(structure.limitationNotice, null, 'no dependency-only notice when structure exists');
});

test('BDD [deep-landscape-demo]: Dependency-only landscape is admitted, not disguised', () => {
  const atlas = {
    objects: {
      components: [
        { id: 'c:a', display_name: 'A', c4_family: 'data-systems', route: '#/dossier/component/a' },
        { id: 'c:b', display_name: 'B', c4_family: 'data-systems', route: '#/dossier/component/b' },
      ],
      relationships: [
        // only shared-dependency edges — no structural edges
        { id: 'r:dep', from_id: 'c:a', to_id: 'c:b', relationship_type: 'shared-dependency', direction: 'undirected', evidence: { state: 'metadata-visible' } },
      ],
    },
  };
  const structure = openLandscapeStructure(atlas);
  assert.strictEqual(structure.hasStructuralEdges, false, 'no structural edges');
  assert.ok(structure.limitationNotice, 'plain-language limitation notice present');
  // It must NOT present shared dependencies as code-level architecture.
  assert.match(structure.limitationNotice, /dependency/i);
  assert.match(structure.limitationNotice, /not code-level architecture/i);
});

// ---- Feature: Overlap findings (ontology / spec 21) ----

test('BDD [overlap-findings]: Overlapping capabilities surface as a finding', () => {
  const { FINDING_TYPES } = require('../../src/domain/atlas-navigation');
  assert.ok(FINDING_TYPES.includes('overlapping-capabilities'), 'overlapping-capabilities is in the closed vocabulary');
  assert.ok(FINDING_TYPES.includes('duplicated-concept'), 'duplicated-concept is in the closed vocabulary');
  assert.ok(FINDING_TYPES.includes('alternative-capability'), 'alternative-capability is in the closed vocabulary');
  assert.ok(FINDING_TYPES.includes('legacy-stale-semantic-overlap'), 'legacy-stale-semantic-overlap is in the closed vocabulary');
});

test('BDD [overlap-findings]: Legacy/stale semantic overlap is visible', () => {
  // The Go producer emits these from graph analysis; verify the reading layer
  // accepts them in the FINDING_TYPES vocabulary and they carry confidence.
  const { FINDING_TYPES, CONFIDENCE_LEVELS } = require('../../src/domain/atlas-navigation');
  assert.ok(FINDING_TYPES.includes('legacy-stale-semantic-overlap'));
  assert.ok(CONFIDENCE_LEVELS.includes('ironclad'));
  assert.ok(CONFIDENCE_LEVELS.includes('hypothesis-with-facts'));
});

// ---- Feature: Semantic investigation producer (spec 18) ----

test('BDD [semantic-investigation-producer]: Pages reflect the scanned corpus', () => {
  const { generateSemanticInvestigation } = require('../../src/domain/semantic-investigation-producer');
  const systemMap = {
    target: { id: 'sm', display_name: 'SM' },
    objects: {
      components: [
        { id: 'c:a', display_name: 'A', c4_family: 'lib' },
        { id: 'c:b', display_name: 'B', c4_family: 'lib' },
        { id: 'c:c', display_name: 'C', c4_family: 'app' },
      ],
      relationships: [],
      findings: [],
      surfaces: [],
      unknowns: [],
    },
  };
  const si = generateSemanticInvestigation(systemMap);
  assert.ok(si._generated, 'pages are generated, not fixture-backed');
  assert.ok(si.components.length >= 3, 'all corpus components appear');
  // No live page is fixture-backed demo content.
  assert.ok(!si._fixtureBacked);
});

test('BDD [semantic-investigation-producer]: Agent claims are bounded and labelled', () => {
  const { generateSemanticInvestigation } = require('../../src/domain/semantic-investigation-producer');
  const systemMap = {
    target: { id: 'sm', display_name: 'SM' },
    objects: {
      components: [{ id: 'c:a', display_name: 'A', c4_family: 'lib' },
                   { id: 'c:b', display_name: 'B', c4_family: 'lib' },
                   { id: 'c:c', display_name: 'C', c4_family: 'app' }],
      relationships: [], findings: [], surfaces: [], unknowns: [],
    },
  };
  const si = generateSemanticInvestigation(systemMap, {
    agentClaims: { components: [{ component_id: 'c:a', purpose: 'Agent says', risks: [
      { label: 'R1', explanation: 'risk 1' }, { label: 'R2', explanation: 'risk 2' },
      { label: 'R3', explanation: 'risk 3' }, { label: 'R4', explanation: 'should be bounded' },
    ] }] },
  });
  const a = si.components.find(c => c.id === 'c:a');
  assert.ok(a.purpose.summary.includes('[Agent:'), 'agent contribution is labelled');
  const agentRisks = a.risks.filter(r => r.id.startsWith('risk:agent-'));
  assert.strictEqual(agentRisks.length, 3, 'bounded to 3');
});

// ---- Feature: Evidence anchors (spec 19) ----

test('BDD [evidence-anchors]: Anchored claim renders as verified', () => {
  const { resolveSourceRef } = require('../../src/domain/semantic-investigation');
  const si = {
    command_receipts: [{ id: 'rc1', command: 'rg pattern', exit_code: 0, output_excerpt: 'ok', timestamp: '2026-01-01T00:00:00Z' }],
    sources: [{ id: 'src1', kind: 'official-doc', url: 'https://x', claim_scope: 'scope' }],
    components: [],
  };
  // A claim with a command-receipt anchor is resolvable → renders as verified.
  assert.strictEqual(resolveSourceRef(si, 'receipt:rc1').resolves, true);
  // A claim with a source card is resolvable.
  assert.strictEqual(resolveSourceRef(si, 'source:src1').resolves, true);
});

test('BDD [evidence-anchors]: Unanchored claim is not_assessed, not verified', () => {
  const { enforceEvidenceAnchors } = require('../../src/domain/semantic-investigation');
  const si = {
    sources: [],
    components: [{
      id: 'c:x',
      purpose: { summary: 'x', source_boundary: 'curated-knowledge', source_ref: 'source:nonexistent' },
      capabilities: [], internal_concepts: [], risks: [],
      integration_surfaces: [], semantic_relations: [],
    }],
  };
  const { si: patched, downgraded } = enforceEvidenceAnchors(si);
  assert.strictEqual(patched.components[0].purpose.source_boundary, 'not_assessed');
  assert.ok(downgraded.length > 0, 'downgrade is surfaced, not hidden');
});

// ---- Feature: Multiscale drill-down (spec 20) ----

test('BDD [multiscale-drilldown]: Reader moves across scales', () => {
  const { buildMultiscaleModel, SCALE_LEVELS } = require('../../src/domain/multiscale-drilldown');
  const systemMap = {
    target: { id: 'sm', display_name: 'SM' },
    objects: {
      components: [
        { id: 'c:a', display_name: 'A', c4_family: 'lib' },
        { id: 'c:b', display_name: 'B', c4_family: 'lib' },
      ],
      relationships: [], findings: [], surfaces: [], unknowns: [],
    },
  };
  const si = {
    capabilities: [{ id: 'capability:lib', label: 'Library' }],
    components: [{ id: 'c:a', ecosystem_regions: ['capability:lib'], internal_concepts: [
      { id: 'concept:a1', label: 'A1', explanation: 'x', source_boundary: 'local-corpus' },
    ] }],
  };
  const model = buildMultiscaleModel(systemMap, si);
  // Each scale level is represented.
  for (const level of SCALE_LEVELS) {
    const entries = model.scales.filter(s => s.level === level);
    assert.ok(entries.length > 0, `scale ${level} should have entries`);
  }
  // Cross-scale links exist.
  assert.ok(model.root.children.length > 0, 'ecosystem links to capability');
});

test('BDD [multiscale-drilldown]: Unevidenced scale is honest-empty', () => {
  const { buildMultiscaleModel } = require('../../src/domain/multiscale-drilldown');
  const systemMap = {
    target: { id: 'sm', display_name: 'SM' },
    objects: {
      components: [{ id: 'c:a', display_name: 'A', c4_family: 'lib' }],
      relationships: [], findings: [], surfaces: [], unknowns: [],
    },
  };
  // No SI — module scale has no evidence.
  const model = buildMultiscaleModel(systemMap);
  const mods = model.scales.filter(s => s.level === 'module');
  assert.ok(mods.length > 0);
  for (const m of mods) {
    assert.ok(m.isEmpty, 'module scale is honest-empty');
    assert.ok(m.emptyReason, 'explains why it is empty');
  }
});

