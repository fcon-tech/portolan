/**
 * Unit tests for the atlas reading model (captain-atlas 15).
 *
 * Verifies that buildJourneys() emits system-meaningful journeys (not JSONL
 * restatements), that the route diagram is an ordered path, that anchor status
 * is classified honestly in all four cases (and never fabricates a precise
 * anchor), that coverage regions show scale, and that handoff queries are real.
 *
 * Domain-layer: pure functions, no DOM/IO.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const {
  buildJourneys, buildRouteDiagram, routeThesis, anchorStatus, anchorExplanation,
  coverageRegions, topProbes, topFindings, handoffQueries, stageRole,
} = require('../../src/domain/atlas-reading');
const { BIGTOP_PROFILE, PORTOLAN_SELF_PROFILE } = require('../../src/domain/atlas-navigation-profiles');

// ---------------------------------------------------------------------------
// Build a nav-atlas-shaped object from a profile by simulating what the
// generator would emit (flattening route stages into navigationIndex). This
// exercises the REAL profile data the product ships with, so journey narratives
// are validated against the fixture that actually drives the demo.
// ---------------------------------------------------------------------------
function navAtlasFromProfile(profile) {
  const navigationIndex = [];
  for (const route of profile.routes) {
    for (const stage of route.stages) {
      // simulate cumulative route_quality degradation + note (the generator
      // does this; here we just carry the declared quality + a clean note).
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
    navigationIndex,
    coverageMatrix: [],
    findings: profile.findings,
    unknownProbes: profile.unknownProbes,
    evidence: profile.evidence,
    receiptValidation: { target_id: profile.id, machine_status: 'verified' },
  };
}

// ===========================================================================
// Journeys — Bigtop is the acceptance target
// ===========================================================================

test('Bigtop builds at least 3 journeys including package, confidence, coverage', () => {
  const nav = navAtlasFromProfile(BIGTOP_PROFILE);
  nav.coverageMatrix = [
    { coverage_id: 'c1', subject_id: 'repo:apache-bigtop-repo', subject_label: 'bigtop-repo', subject_type: 'repository', promotion_state: 'promoted', route_status: 'partial', route_refs: ['route:bigtop:package-distribution'], runtime_status: 'not_assessed', test_status: 'not_assessed' },
    { coverage_id: 'c2', subject_id: 'repo:apache-spark', subject_label: 'spark', subject_type: 'repository', promotion_state: 'promoted', route_status: 'missing', route_refs: [], runtime_status: 'not_assessed', test_status: 'not_assessed' },
  ];
  const journeys = buildJourneys(nav);
  assert.ok(journeys.length >= 3, `expected >= 3 journeys, got ${journeys.length}`);
  const titles = journeys.map(j => j.title);
  assert.ok(titles.includes('Package Definition To Runtime Candidate'), `package journey present; got ${titles.join(', ')}`);
  assert.ok(titles.includes('Build And Smoke Confidence Boundary'), 'confidence boundary journey present');
  assert.ok(titles.includes('Repository Fleet Coverage'), 'fleet coverage journey present');
});

test('Bigtop package journey teaches system meaning, not JSONL field restatement', () => {
  const nav = navAtlasFromProfile(BIGTOP_PROFILE);
  const journeys = buildJourneys(nav);
  const pkg = journeys.find(j => j.title === 'Package Definition To Runtime Candidate');
  assert.ok(pkg, 'package journey exists');
  // The journey summary must teach the BOM->recipe->provisioner->smoke->runtime
  // chain — NOT be a bare restatement like "package_flow, 6 stages".
  assert.match(pkg.journeySummary, /BOM|Bill of Materials/i);
  assert.match(pkg.journeySummary, /recipe/i);
  assert.ok(!/^\d+ stages across/i.test(pkg.journeySummary), 'summary is not a stage-count restatement');
  assert.ok(!pkg.journeySummary.includes('package_flow'), 'summary does not restate route_family');
  // Six questions answerable from the card.
  assert.ok(pkg.whyItMatters && pkg.whyItMatters.length > 20, 'why-it-matters is substantive');
  assert.ok(pkg.whereConfidenceStops && pkg.whereConfidenceStops.length > 20, 'where-confidence-stops is substantive');
  assert.ok(pkg.known, 'known is present');
  assert.ok(pkg.notAssessed, 'not-assessed is present');
  assert.ok(pkg.nextStep && pkg.nextStep.length > 10, 'next step is concrete');
  // Derived real facts attached.
  assert.ok(pkg.findingIds.length >= 1, 'attached findings');
  assert.ok(pkg.probeIds.length >= 1, 'attached probes');
  assert.ok(pkg.provenance === 'fixture_backed', 'honestly labelled fixture_backed');
});

test('journey is never emitted for a route_id absent from the bundle', () => {
  // Empty navigation index -> only synthesized journeys, no ROUTE_JOURNEYS.
  const journeys = buildJourneys({ navigationIndex: [], coverageMatrix: [], findings: [], unknownProbes: [], evidence: [] });
  for (const j of journeys) {
    assert.ok(j.kind !== 'route', `no route journey when no routes: ${j.title}`);
  }
});

test('journeys are sorted by readingPriority', () => {
  const nav = navAtlasFromProfile(BIGTOP_PROFILE);
  nav.coverageMatrix = [{ coverage_id: 'c', subject_id: 's', subject_type: 'repository', route_refs: ['route:bigtop:package-distribution'], route_status: 'partial', promotion_state: 'promoted' }];
  const journeys = buildJourneys(nav);
  for (let i = 1; i < journeys.length; i++) {
    assert.ok(journeys[i - 1].readingPriority <= journeys[i].readingPriority + 0.5, 'sorted by priority');
  }
});

// ===========================================================================
// Route diagram
// ===========================================================================

test('route diagram is an ordered path with directional edges', () => {
  const nav = navAtlasFromProfile(BIGTOP_PROFILE);
  const route = nav.navigationIndex;
  const diagram = buildRouteDiagram(route);
  assert.ok(diagram.nodes.length === 6, `6 stage nodes; got ${diagram.nodes.length}`);
  assert.ok(diagram.edges.length === 5, `5 edges (n-1); got ${diagram.edges.length}`);
  // edges connect consecutive stage indices
  for (let i = 0; i < diagram.edges.length; i++) {
    assert.ok(diagram.edges[i].from < diagram.edges[i].to, 'edge direction is forward');
  }
  // nodes carry the legibility signals
  const n0 = diagram.nodes[0];
  assert.ok(n0.label && n0.role && n0.evidenceState && n0.runtimeAssessment, 'node carries role/evidence/runtime');
});

test('stageRole renders human labels, not snake_case path_role', () => {
  assert.strictEqual(stageRole({ path_role: 'bom' }), 'Bill of Materials declaration');
  assert.strictEqual(stageRole({ path_role: 'provisioner' }), 'Provisioner (Puppet / Docker)');
  assert.strictEqual(stageRole({ path_role: 'smoke_test' }), 'Smoke / interoperability test');
  assert.strictEqual(stageRole({ path_role: 'unknown_role' }), 'unknown_role'); // honest fallback
});

test('routeThesis uses authored copy for known routes, honest fallback otherwise', () => {
  assert.match(routeThesis({ route_id: 'route:bigtop:package-distribution' }, []), /BOM/i);
  const fallback = routeThesis({ route_id: 'route:unknown:x' }, [{ path_role: 'bom' }, { path_role: 'smoke_test' }]);
  assert.ok(fallback.includes('->'), 'fallback traces roles as a path');
});

// ===========================================================================
// Anchor status — all four cases, no fabrication
// ===========================================================================

test('anchorStatus: precise when line range is nonzero', () => {
  assert.strictEqual(anchorStatus({ line_start: 10, line_end: 14 }), 'precise');
});

test('anchorStatus: a 0/42 range (no start line) is NOT precise', () => {
  // line_start 0 with a nonzero line_end is nonsensical; must not be 'precise'.
  assert.notStrictEqual(anchorStatus({ line_start: 0, line_end: 42 }), 'precise');
  assert.notStrictEqual(anchorStatus({ line_start: 10, line_end: 0 }), 'precise');
});

test('anchorStatus: precise anchor explanation is null (snippet shown instead)', () => {
  assert.strictEqual(anchorExplanation({ line_start: 10, line_end: 14 }), null);
});

test('anchorStatus: ambiguous from quality note, with no fake line numbers', () => {
  const s = { line_start: 0, line_end: 0, route_quality_note: 'ambiguous anchor(s): foo' };
  assert.strictEqual(anchorStatus(s), 'ambiguous');
  assert.match(anchorExplanation(s), /Ambiguous anchor/i);
  assert.ok(!/line \d+/.test(anchorExplanation(s)), 'no fake precise line in ambiguous explanation');
});

test('anchorStatus: missing from quality note', () => {
  const s = { line_start: 0, line_end: 0, route_quality_note: 'anchor not found: foo' };
  assert.strictEqual(anchorStatus(s), 'missing');
  assert.match(anchorExplanation(s), /not found|resolved/i);
});

test('anchorStatus: unresolved when no signal at all', () => {
  const s = { line_start: 0, line_end: 0 };
  assert.strictEqual(anchorStatus(s), 'unresolved');
  assert.match(anchorExplanation(s), /Unresolved/i);
});

test('anchorStatus: explicit enriched anchor_status is trusted', () => {
  // export-time enrichment sets anchor_status directly; it wins.
  assert.strictEqual(anchorStatus({ line_start: 0, line_end: 0, anchor_status: 'precise' }), 'precise');
  assert.strictEqual(anchorStatus({ line_start: 5, line_end: 5, anchor_status: 'missing-file' }), 'missing-file');
});

test('anchorStatus NEVER fabricates precise from a 0/0 range', () => {
  // Even with a source_excerpt somehow present, a 0/0 range is not precise
  // unless the adapter explicitly set anchor_status.
  const s = { line_start: 0, line_end: 0, source_excerpt: 'some lines' };
  assert.notStrictEqual(anchorStatus(s), 'precise');
});

// ===========================================================================
// Coverage regions — scale, not a flat table
// ===========================================================================

test('coverageRegions buckets subjects and reports counts', () => {
  const cm = [
    { subject_id: 'a', route_status: 'complete', route_refs: ['r1'], promotion_state: 'promoted' },
    { subject_id: 'b', route_status: 'partial', route_refs: ['r1'], promotion_state: 'promoted' },
    { subject_id: 'c', route_status: 'missing', route_refs: [], promotion_state: 'promoted' },
    { subject_id: 'd', route_status: 'not_assessed', route_refs: [], promotion_state: 'missing' },
  ];
  const r = coverageRegions(cm);
  assert.strictEqual(r.counts.total, 4);
  assert.strictEqual(r.counts.covered, 1);
  assert.strictEqual(r.counts.partial, 1);
  assert.strictEqual(r.counts.routeless, 2); // c (missing) + d (not_assessed)
  assert.strictEqual(r.counts.missing, 1); // d promotion missing (cross-cutting lens)
  assert.strictEqual(r.counts.central, 2); // a + b have routes
  assert.strictEqual(r.counts.peripheral, 2); // c + d no routes
  // primary route buckets are mutually exclusive + exhaustive -> sum to total.
  assert.strictEqual(r.counts.covered + r.counts.partial + r.counts.routeless, r.counts.total,
    'covered + partial + routeless == total');
  // a not_assessed subject WITH route_refs is still counted (central) and its
  // route_status puts it in routeless, but it is never lost from the total.
  const cm2 = [
    { subject_id: 'x', route_status: 'not_assessed', route_refs: ['r1'], promotion_state: 'promoted' },
  ];
  const r2 = coverageRegions(cm2);
  assert.strictEqual(r2.counts.central, 1, 'not_assessed-with-refs is central');
  assert.strictEqual(r2.counts.covered + r2.counts.partial + r2.counts.routeless, 1, 'sums to total');
});

// ===========================================================================
// Top probes + findings + handoff
// ===========================================================================

test('topProbes prioritizes blocked and higher-risk probes', () => {
  const probes = [
    { unknown_id: 'u1', state: 'not_assessed', probe_risk: 'low' },
    { unknown_id: 'u2', state: 'blocked', probe_risk: 'medium' },
    { unknown_id: 'u3', state: 'blocked', probe_risk: 'high' },
  ];
  const top = topProbes(probes, 2);
  assert.strictEqual(top[0].unknown_id, 'u3'); // blocked + high first
  assert.strictEqual(top[1].unknown_id, 'u2'); // blocked + medium next
});

test('topFindings prioritizes by severity', () => {
  const findings = [
    { finding_id: 'f1', severity: 'minor' },
    { finding_id: 'f2', severity: 'major' },
    { finding_id: 'f3', severity: 'critical' },
  ];
  const top = topFindings(findings, 2);
  assert.strictEqual(top[0].severity, 'critical');
  assert.strictEqual(top[1].severity, 'major');
});

test('handoffQueries include the real package route id for Bigtop', () => {
  const nav = navAtlasFromProfile(BIGTOP_PROFILE);
  const q = handoffQueries(nav);
  const ids = q.map(x => x.id);
  assert.ok(ids.includes('handoff:open-package-route'));
  assert.ok(ids.includes('handoff:receipt'));
  const openRoute = q.find(x => x.id === 'handoff:open-package-route');
  assert.ok(openRoute.command.includes('route:bigtop:package-distribution'), 'real route id inlined');
  assert.ok(openRoute.command.includes('route --id'), 'runnable command shape');
});

// ===========================================================================
// Portolan-self parity (must not break; secondary)
// ===========================================================================

test('portolan-self builds journeys for its implementation routes', () => {
  const nav = navAtlasFromProfile(PORTOLAN_SELF_PROFILE);
  nav.coverageMatrix = PORTOLAN_SELF_PROFILE ? [{ coverage_id: 'c', subject_id: 'region:go-cli', subject_type: 'source_region', route_refs: ['route:self:command-dispatch'], route_status: 'partial', promotion_state: 'promoted' }] : [];
  const journeys = buildJourneys(nav);
  const titles = journeys.map(j => j.title);
  assert.ok(titles.some(t => t.includes('Command Dispatch')), 'command-dispatch journey present');
  assert.ok(titles.includes('Build And Smoke Confidence Boundary'), 'confidence journey present');
});
