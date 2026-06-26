/**
 * Unit tests for atlas drill-down detail models (captain-atlas 16).
 *
 * Verifies the bounded detail reading models:
 *   - deriveReverseRefs builds reverse context from nav-index stages;
 *   - relationshipDetail answers source/target/type/evidence/what-it-proves/
 *     does-not-prove and returns null (not a generic dossier) when absent;
 *   - stageDetail answers all doc-16 stage fields + proves/does-not-prove;
 *   - evidenceDetail answers anchor quality + reverse context + the explicit
 *     "source-visible never implies runtime proof" string;
 *   - componentDossierFromNav augments with route/coverage/hazards/probes/C4;
 *   - c4Model shows Context always, Container honest-empty when absent,
 *     Component limited/derived — never fabricates from repo names.
 *
 * Domain-layer: pure functions, no DOM/IO.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const {
  deriveReverseRefs, relationshipDetail, stageDetail, evidenceDetail,
  componentDossierFromNav, c4Model,
} = require('../../src/domain/atlas-detail');

// ---- fixtures --------------------------------------------------------------
function atlasWith(over) {
  return Object.assign({
    target: { id: 't', display_name: 'T' },
    objects: {
      components: [
        { id: 'component:a', display_name: 'A', c4_family: 'unknown', route: '#/dossier/component/a', why_present: 'why a', role: 'role a', relationship_ids: ['rel:1'] },
        { id: 'component:b', display_name: 'B', c4_family: 'unknown', route: '#/dossier/component/b', relationship_ids: ['rel:1'] },
      ],
      repositories: [], surfaces: [],
      relationships: [
        {
          id: 'rel:1', relationship_type: 'depends-on', from_id: 'component:a', to_id: 'component:b',
          direction: 'directed', evidence: { state: 'metadata-visible', source: 'manifest', producer: 'corpus-manifest' },
          created_by_producer_family: 'corpus-manifest', why_present: 'A depends on B.', summary: 'A depends on B (metadata).',
          route: '#/detail/relationship/rel:1',
        },
      ],
      findings: [], unknowns: [],
    },
    c4: { context_boxes: [{ id: 'c4-context:.', display_name: 'Target' }], families: [], component_boxes: [] },
  }, over || {});
}

function navAtlasWith(over) {
  return Object.assign({
    navigationIndex: [
      { route_id: 'route:x', route_family: 'command', route_title: 'X', stage: 's1', stage_index: 1,
        subject_id: 'component:a', source_path: 'a.go', source_anchor: 'main', line_start: 5, line_end: 8,
        path_role: 'entrypoint', source_evidence_state: 'source-visible', runtime_assessment: 'not_assessed',
        evidence_refs: ['ev:1'], finding_refs: ['finding:f1'], unknown_probe_refs: ['unknown:u1'], next_raw_check: 'check it' },
      { route_id: 'route:x', route_family: 'command', route_title: 'X', stage: 's2', stage_index: 2,
        subject_id: 'component:b', source_path: 'b.go', source_anchor: 'bar', line_start: 0, line_end: 0,
        path_role: 'command_dispatch', source_evidence_state: 'source-visible', runtime_assessment: 'blocked',
        evidence_refs: [], finding_refs: [], unknown_probe_refs: [], next_raw_check: '' },
    ],
    coverageMatrix: [
      { coverage_id: 'c:a', subject_id: 'component:a', subject_label: 'A', route_status: 'partial', finding_status: 'has_findings', runtime_status: 'not_assessed', test_status: 'not_assessed', promotion_state: 'promoted', route_refs: ['route:x'], finding_refs: ['finding:f1'], known_unknown_ids: ['unknown:u1'] },
    ],
    findings: [{ finding_id: 'finding:f1', finding_type: 'duplicate_risk', severity: 'major', title: 'Dup', summary: 'dup', subject_ids: ['component:a'], route_refs: ['route:x'], evidence_refs: ['ev:1'] }],
    unknownProbes: [{ unknown_id: 'unknown:u1', subject_id: 'component:a', blocked_surface: 'build', state: 'blocked', why_unknown: 'no build', next_probe: 'run build', probe_risk: 'low', requires_permission: ['runtime'], route_refs: ['route:x'] }],
    evidence: [{ evidence_id: 'ev:1', source_path: 'a.go', source_anchor: 'main', line_start: 5, line_end: 8, evidence_state: 'source-visible', observation: 'main entry', producer_id: 'p', artifact_provenance: 'fixture_backed', anchor_status: 'precise', source_excerpt: '5 │ package main' }],
    receiptValidation: { machine_status: 'verified' },
  }, over || {});
}

// ===========================================================================
// deriveReverseRefs
// ===========================================================================
test('deriveReverseRefs builds reverse context for a probe lacking direct route refs', () => {
  // A probe with NO route_refs, but referenced by a stage.
  const nav = navAtlasWith({
    unknownProbes: [{ unknown_id: 'unknown:u1', subject_id: 'component:a', blocked_surface: 'build', state: 'blocked', why_unknown: 'x', next_probe: 'y', probe_risk: 'low', requires_permission: [], route_refs: [] }],
  });
  const idx = deriveReverseRefs(nav);
  const ctx = idx.get('unknown:u1');
  assert.ok(ctx, 'probe has a reverse-ref entry');
  assert.ok(ctx.routes.has('route:x'), 'reverse-derived route context present');
  assert.strictEqual(ctx.stages.length, 1);
});

test('deriveReverseRefs indexes evidence ids even when only stages reference them', () => {
  const idx = deriveReverseRefs(navAtlasWith());
  assert.ok(idx.has('ev:1'), 'evidence id indexed');
  assert.ok(idx.get('ev:1').routes.has('route:x'));
});

// ===========================================================================
// relationshipDetail
// ===========================================================================
test('relationshipDetail answers source/target/type/evidence and proves/does-not-prove', () => {
  const d = relationshipDetail(atlasWith(), navAtlasWith(), 'rel:1');
  assert.strictEqual(d.relationshipType, 'depends-on');
  assert.strictEqual(d.direction, 'directed');
  assert.strictEqual(d.from.label, 'A');
  assert.strictEqual(d.to.label, 'B');
  assert.strictEqual(d.evidenceState, 'metadata-visible');
  assert.ok(d.whatItProves.length > 10, 'what-it-proves is non-trivial');
  assert.ok(/does not prove/.test(d.whatItDoesNotProve.toLowerCase()) || /not/.test(d.whatItDoesNotProve.toLowerCase()), 'does-not-prove present');
});

test('relationshipDetail derives route context from the involved components', () => {
  const d = relationshipDetail(atlasWith(), navAtlasWith(), 'rel:1');
  assert.ok(d.routeIds.includes('route:x'), 'route context reverse-derived');
});

test('relationshipDetail returns null when the relationship is absent (never a generic dossier)', () => {
  assert.strictEqual(relationshipDetail(atlasWith(), navAtlasWith(), 'rel:nope'), null);
});

test('relationshipDetail never claims runtime proof for a metadata-visible edge', () => {
  const d = relationshipDetail(atlasWith(), navAtlasWith(), 'rel:1');
  assert.match(d.whatItDoesNotProve.toLowerCase(), /runtime/);
});

// ===========================================================================
// stageDetail
// ===========================================================================
test('stageDetail answers role, anchor, evidence, runtime, and proves/does-not-prove', () => {
  const s = stageDetail(navAtlasWith(), 'route:x', 1);
  assert.ok(s, 'stage resolved');
  assert.strictEqual(s.role, 'Entry point');
  assert.strictEqual(s.anchorStatus, 'precise');
  assert.strictEqual(s.sourceEvidenceState, 'source-visible');
  assert.strictEqual(s.runtimeAssessment, 'not_assessed');
  assert.ok(s.hazardRefs.includes('finding:f1'));
  assert.ok(s.probeRefs.includes('unknown:u1'));
  assert.ok(s.whatItProves.length > 5);
  assert.ok(s.whatItDoesNotProve.length > 5);
});

test('stageDetail returns null for an absent stage', () => {
  assert.strictEqual(stageDetail(navAtlasWith(), 'route:x', 99), null);
});

// ===========================================================================
// evidenceDetail
// ===========================================================================
test('evidenceDetail answers anchor quality, what-it-proves, and explicit source-not-runtime truth', () => {
  const e = evidenceDetail(navAtlasWith(), 'ev:1');
  assert.ok(e);
  assert.strictEqual(e.anchorStatus, 'precise');
  assert.ok(e.routeIds.includes('route:x'), 'reverse route context');
  assert.match(e.whatItDoesNotProve.toLowerCase(), /runtime/);
  assert.match(e.whatItDoesNotProve.toLowerCase(), /does not/);
});

test('evidenceDetail returns null for an absent evidence id', () => {
  assert.strictEqual(evidenceDetail(navAtlasWith(), 'ev:nope'), null);
});

// ===========================================================================
// componentDossierFromNav
// ===========================================================================
test('componentDossierFromNav augments with route/coverage/hazards/probes', () => {
  const d = componentDossierFromNav(atlasWith(), navAtlasWith(), 'component:a');
  assert.ok(d);
  assert.ok(d.routeIds.includes('route:x'));
  assert.ok(d.coverage, 'coverage row attached');
  assert.ok(d.hazards.includes('finding:f1'));
  assert.ok(d.probes.includes('unknown:u1'));
  assert.ok(d.nextAction.length > 5, 'next action present');
});

test('componentDossierFromNav returns null for an absent component', () => {
  assert.strictEqual(componentDossierFromNav(atlasWith(), navAtlasWith(), 'component:nope'), null);
});

// ===========================================================================
// c4Model
// ===========================================================================
test('c4Model: Context always present, Container honest-empty when container_boxes absent', () => {
  const m = c4Model(atlasWith());
  assert.ok(m.context.length >= 1, 'context always present');
  assert.strictEqual(m.container.present, false, 'container honest-empty');
  assert.ok(m.container.explanation.length > 10, 'honest-empty explanation present');
  assert.strictEqual(m.code.inScope, false);
});

test('c4Model: Container present only when runtime/deploy boxes exist', () => {
  const m = c4Model(atlasWith({ c4: { context_boxes: [], container_boxes: [{ id: 'ctr:1', display_name: 'API' }], families: [], component_boxes: [] } }));
  assert.strictEqual(m.container.present, true);
  assert.strictEqual(m.container.boxes.length, 1);
});

test('c4Model: Component is limited/derived when runtime/deploy evidence absent', () => {
  const m = c4Model(atlasWith());
  assert.strictEqual(m.component.limited, true);
  assert.ok(/promoted units|derived|not runtime/.test(m.component.note.toLowerCase()));
});

test('c4Model never fabricates containers from families or repo names', () => {
  // Families present, no container_boxes -> container stays honest-empty.
  const m = c4Model(atlasWith({ c4: { context_boxes: [], container_boxes: [], families: [{ id: 'f', display_name: 'F', component_ids: ['component:a'] }], component_boxes: [] } }));
  assert.strictEqual(m.container.present, false);
  assert.strictEqual(m.container.boxes.length, 0);
});
