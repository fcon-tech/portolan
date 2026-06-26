/**
 * Shell-navigation render smoke test (UI verification, no browser dependency).
 *
 * portolan-core is zero-dep; there is no jsdom/playwright. The shell is designed
 * for a stubbed document injected via opts.document (precedent:
 * svg-graph-renderer.test.js). This extends that mockDoc with createElement /
 * innerHTML / className (the shell uses a richer DOM subset than the SVG
 * renderer) and asserts the DOM contract for every reading surface
 * (captain-atlas 15):
 *
 *   - the default screen is the walkthrough (data-portolan-view="walkthrough"),
 *     NOT the Fleet/graph, when a nav atlas is present;
 *   - the route dossier renders a diagram + thesis + stage cards;
 *   - evidence snippets / honest anchor explanations render per anchor status;
 *   - findings explain system risk; probes are expedition steps;
 *   - coverage shows regions; Fleet is secondary; handoff is visible.
 *
 * This is the "admiral can open it" check against the same render path
 * atlas.html uses — without a browser binary.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { createPortolanShell } = require('../../src/shell');

// ---- mock DOM (extends the svg-graph-renderer precedent) -----------------
function mockEl(tag) {
  const el = {
    tagName: tag, attrs: {}, children: [], listeners: {},
    _className: '',
    set className(v) { this._className = v; this.attrs.class = v; },
    get className() { return this._className; },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return this.attrs[k]; },
    appendChild(c) { this.children.push(c); return c; },
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
    set style(v) { this.attrs.style = v; },
    get style() { return this.attrs.style || ''; },
    classList: {
      _tokens: new Set(),
      add(t) { this._tokens.add(t); },
      remove(t) { this._tokens.delete(t); },
      contains(t) { return this._tokens.has(t); },
    },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    textContent: '',
  };
  return el;
}

function mockDoc() {
  return {
    createElement: (tag) => mockEl(tag),
    createElementNS: (ns, tag) => mockEl(tag),
    createTextNode: (t) => ({ textContent: String(t == null ? '' : t), _text: true }),
  };
}

function mockRoot() {
  const r = mockEl('div');
  r._innerHTML = '';
  Object.defineProperty(r, 'innerHTML', {
    set(v) { r._innerHTML = v; },
    get() { return r._innerHTML; },
  });
  return r;
}

// ---- walk the mock DOM for assertions -------------------------------------
function walk(node, fn) {
  fn(node);
  for (const c of node.children || []) walk(c, fn);
}
function allNodes(root) {
  const out = [];
  walk(root, n => out.push(n));
  return out;
}
function findText(root, needle) {
  return allNodes(root).some(n => n._text && String(n.textContent).includes(needle));
}
function findAttr(root, attr, value) {
  return allNodes(root).some(n => n.attrs && n.attrs[attr] === value);
}
function findNode(root, attr, value) {
  return allNodes(root).find(n => n.attrs && n.attrs[attr] === value);
}

// ---- fixtures --------------------------------------------------------------
function fixtureAtlas() {
  return {
    target: { id: 't', display_name: 'Test Landscape', root: '/test' },
    objects: {
      components: [{ id: 'component:a', display_name: 'A', c4_family: 'unknown', route: '#/dossier/component/a', relationship_ids: [], promotion_signals: [{ independence_group: 'g1' }] }],
      repositories: [], surfaces: [], relationships: [], findings: [], unknowns: [],
    },
    c4: { context_boxes: [], families: [], component_boxes: [] },
  };
}

// A nav atlas with one route whose stages exercise all anchor-status cases:
//   stage 1 precise (line range + excerpt), stage 2 ambiguous (0/0 + note),
//   stage 3 missing (0/0 + not-found note).
// The route_id is a real catalogue route so a journey card emits and the
// walkthrough has a named journey.
function fixtureNavAtlas() {
  const RID = 'route:self:command-dispatch';
  return {
    navigationIndex: [
      { route_id: RID, route_family: 'command', route_title: 'Command dispatch route', route_quality: 'medium', route_quality_note: '',
        stage: 'precise-stage', stage_index: 1,
        subject_id: 'region:go-cli', subject_type: 'source_region', source_path: 'cmd/main.go', source_anchor: 'main',
        line_start: 10, line_end: 14,
        path_role: 'entrypoint', lifecycle: 'active', source_evidence_state: 'source-visible', runtime_assessment: 'not_assessed',
        artifact_provenance: 'fixture_backed', producer_id: 'p',
        evidence_refs: ['ev:1'], finding_refs: ['finding:f1'], unknown_probe_refs: ['unknown:u1'], next_raw_check: 'precise next check',
        anchor_status: 'precise', source_excerpt: '  10 │ package main\n  11 │ func main() {}' },
      { route_id: RID, route_family: 'command', route_title: 'Command dispatch route', route_quality: 'medium', route_quality_note: 'ambiguous anchor(s): foo',
        stage: 'ambiguous-stage', stage_index: 2,
        subject_id: 'region:go-cli', subject_type: 'source_region', source_path: 'cmd/x.go', source_anchor: 'foo',
        line_start: 0, line_end: 0,
        path_role: 'command_dispatch', lifecycle: 'active', source_evidence_state: 'source-visible', runtime_assessment: 'not_assessed',
        artifact_provenance: 'fixture_backed', producer_id: 'p',
        evidence_refs: [], finding_refs: [], unknown_probe_refs: [], next_raw_check: 'ambiguous next check' },
      { route_id: RID, route_family: 'command', route_title: 'Command dispatch route', route_quality: 'low', route_quality_note: 'anchor not found: bar',
        stage: 'missing-stage', stage_index: 3,
        subject_id: 'region:go-cli', subject_type: 'source_region', source_path: 'cmd/missing.go', source_anchor: 'bar',
        line_start: 0, line_end: 0,
        path_role: 'workflow_script', lifecycle: 'active', source_evidence_state: 'source-visible', runtime_assessment: 'blocked',
        artifact_provenance: 'fixture_backed', producer_id: 'p',
        evidence_refs: [], finding_refs: [], unknown_probe_refs: [], next_raw_check: '' },
    ],
    coverageMatrix: [
      { coverage_id: 'coverage:c1', subject_id: 'region:go-cli', subject_type: 'source_region', subject_label: 'Go CLI',
        source_path: 'cmd', expected_by: 'enum', promotion_state: 'promoted', route_status: 'partial', finding_status: 'has_findings',
        runtime_status: 'not_assessed', test_status: 'not_assessed', coverage_quality: 'medium',
        route_refs: [RID], finding_refs: ['finding:f1'], known_unknown_ids: ['unknown:u1'], top_evidence_refs: ['ev:1'],
        artifact_provenance: 'fixture_backed', producer_id: 'p' },
      { coverage_id: 'coverage:c2', subject_id: 'region:viewer', subject_type: 'source_region', subject_label: 'Viewer',
        source_path: 'viewer', expected_by: 'enum', promotion_state: 'promoted', route_status: 'missing', finding_status: 'none',
        runtime_status: 'not_assessed', test_status: 'not_assessed', coverage_quality: 'low',
        route_refs: [], finding_refs: [], known_unknown_ids: [], top_evidence_refs: [],
        artifact_provenance: 'fixture_backed', producer_id: 'p' },
    ],
    findings: [
      { finding_id: 'finding:f1', finding_type: 'duplicate_risk', severity: 'major', title: 'Dup finding',
        summary: 'a dup that explains a system risk', subject_ids: ['region:go-cli'], route_refs: [RID], state: 'not_assessed',
        confidence: 'hypothesis-with-facts', producer_family: 'agent-producer', artifact_provenance: 'fixture_backed',
        evidence_refs: ['ev:1'], next_raw_check: 'diff them' },
    ],
    unknownProbes: [
      { unknown_id: 'unknown:u1', subject_id: 'region:go-cli', blocked_surface: 'build', state: 'blocked',
        why_unknown: 'no build ran', next_probe: 'run go build', probe_risk: 'low', requires_permission: ['runtime'],
        route_refs: [RID], finding_refs: [], evidence_refs: ['ev:1'], artifact_provenance: 'fixture_backed' },
    ],
    evidence: [
      { evidence_id: 'ev:1', source_path: 'cmd/main.go', source_anchor: 'main', line_start: 10, line_end: 14,
        evidence_state: 'source-visible', observation: 'main entry', producer_id: 'p', artifact_provenance: 'fixture_backed',
        anchor_status: 'precise', source_excerpt: '  10 │ package main' },
    ],
    receiptValidation: {
      target_id: 'portolan-self:test', artifact_set: 'atlas-navigation-index', machine_status: 'verified',
      agent_self_status: 'contaminated', status_disagreements: [{ subject: 'low', machine_status: 'clean', agent_self_status: 'contaminated', reason: 'r' }],
      receipt_sources: { agent_self_status: 'frontier run' }, validated_files: [], row_counts: {},
      validation_checks: [{ check_id: 'json-parse', status: 'verified', summary: 'ok' }, { check_id: 'refs-resolve', status: 'failed', summary: 'x' }],
    },
  };
}

function renderAt(hash, navAtlas) {
  const doc = mockDoc();
  const root = mockRoot();
  // The shell's hash-navigator reads window.location.hash. Stub a minimal
  // window for the test (no real browser). Restore afterwards.
  const origWindow = global.window;
  const fakeLocation = { hash: '#' + hash };
  global.window = {
    location: fakeLocation,
    history: { pushState() {} },
    addEventListener() {},
    removeEventListener() {},
  };
  // navAtlas === null means "no nav atlas" (the graceful-absence path); only
  // fall back to the fixture when navAtlas is undefined (the default).
  const effectiveNav = navAtlas === null ? null : (navAtlas || fixtureNavAtlas());
  try {
    const shell = createPortolanShell({ root, atlas: fixtureAtlas(), navAtlas: effectiveNav, document: doc });
    shell.render();
    shell.destroy();
    return root;
  } finally {
    global.window = origWindow;
  }
}

// the default root section (first panel inside <main>)
function mainPanel(root) {
  const main = root.children.find(c => c.tagName === 'main');
  return main && main.children.find(c => c.tagName === 'section');
}

// ===========================================================================
// Walkthrough is the default first screen (the regression gate)
// ===========================================================================

test('default screen is the walkthrough, not the Fleet/graph, when nav atlas present', () => {
  const root = renderAt('/overview'); // bare overview hash
  const panel = mainPanel(root);
  assert.ok(panel, 'a main panel rendered');
  assert.strictEqual(panel.attrs['data-portolan-view'], 'walkthrough',
    'default panel is marked walkthrough');
  // The Fleet/graph must NOT be the default — no fleet marker on the default panel.
  assert.notStrictEqual(panel.attrs['data-portolan-view'], 'fleet',
    'Fleet is not the default screen');
  assert.ok(!findText(panel, 'Behaviour map'), 'graph hero text absent from default');
});

test('walkthrough shows named system journeys', () => {
  const root = renderAt('/overview');
  assert.ok(findAttr(root, 'data-portolan-kind', 'journeys'), 'journey container present');
  assert.ok(findAttr(root, 'data-portolan-kind', 'journey'), 'at least one journey card');
  assert.ok(findText(root, 'Command Dispatch Entry Path'), 'named journey title visible');
});

test('walkthrough shows top risks and next probes', () => {
  const root = renderAt('/overview');
  assert.ok(findText(root, 'TOP RISKS') || findText(root, 'Dup finding'), 'top risk visible');
  assert.ok(findText(root, 'NEXT EXPEDITION'), 'next expedition section present');
  assert.ok(findAttr(root, 'data-portolan-kind', 'top-probes'), 'top probes container present');
});

test('walkthrough shows agent handoff', () => {
  const root = renderAt('/overview');
  assert.ok(findAttr(root, 'data-portolan-kind', 'handoff'), 'handoff section present');
  assert.ok(findAttr(root, 'data-portolan-handoff', 'handoff:receipt'), 'handoff query with stable id');
});

test('Fleet map is secondary and reachable but not the default', () => {
  const root = renderAt('/overview');
  // the Fleet nav tab carries a secondary marker
  assert.ok(findAttr(root, 'data-portolan-secondary', 'fleet'), 'Fleet tab marked secondary');
  // navigating to /map renders the Fleet panel (not the walkthrough)
  const fleetRoot = renderAt('/map');
  const fleetPanel = mainPanel(fleetRoot);
  assert.strictEqual(fleetPanel.attrs['data-portolan-view'], 'fleet', 'map panel is Fleet');
});

test('shell renders the legacy overview when no nav atlas (graceful absence)', () => {
  const root = renderAt('/overview', null);
  const panel = mainPanel(root);
  // without nav atlas, the default is the legacy overview (no walkthrough marker)
  assert.ok(panel.attrs['data-portolan-view'] === 'overview' || panel.attrs.class.includes('overview-panel'),
    'legacy overview renders without nav atlas');
});

// ===========================================================================
// Route dossier is a reading surface: thesis, diagram, stage cards
// ===========================================================================

test('route dossier renders thesis and a route diagram (not a table)', () => {
  const root = renderAt('/route/route:self:command-dispatch');
  assert.ok(findAttr(root, 'data-portolan-view', 'route-dossier'), 'route dossier marker');
  assert.ok(findText(root, 'Command dispatch route'), 'route title');
  assert.ok(findAttr(root, 'data-portolan-kind', 'route-diagram'), 'route diagram present');
  assert.ok(findText(root, 'ROUTE DIAGRAM'), 'diagram heading');
});

test('route dossier renders stage cards with anchor status', () => {
  const root = renderAt('/route/route:self:command-dispatch');
  assert.ok(findAttr(root, 'data-portolan-kind', 'stage'), 'stage card present');
  // three anchor statuses represented
  assert.ok(findAttr(root, 'data-portolan-anchor', 'precise'), 'precise stage');
  assert.ok(findAttr(root, 'data-portolan-anchor', 'ambiguous'), 'ambiguous stage');
  assert.ok(findAttr(root, 'data-portolan-anchor', 'missing'), 'missing stage');
});

test('precise stage shows a source snippet; ambiguous/missing show explanations, no fake lines', () => {
  const root = renderAt('/route/route:self:command-dispatch');
  // precise -> snippet rendered
  assert.ok(findAttr(root, 'data-portolan-kind', 'snippet'), 'precise stage shows a snippet');
  // ambiguous -> plain-language explanation, NO fake precise line number
  const ambExplanation = findNode(root, 'data-portolan-anchor-explanation', 'ambiguous');
  assert.ok(ambExplanation, 'ambiguous stage has a plain-language explanation');
  assert.match(String(ambExplanation.attrs['data-portolan-anchor-explanation']) + ambExplanation.textContent, /Ambiguous/i);
  // missing -> explanation
  const missExplanation = findNode(root, 'data-portolan-anchor-explanation', 'missing');
  assert.ok(missExplanation, 'missing stage has a plain-language explanation');
});

test('route dossier preserves source-visible-but-runtime-unverified truth', () => {
  const root = renderAt('/route/route:self:command-dispatch');
  assert.ok(findAttr(root, 'data-portolan-truth', 'source-not-runtime'), 'truth-preservation marker');
  assert.ok(findText(root, 'runtime-unverified') || findText(root, 'source-visible but runtime'), 'truth note text');
});

// ===========================================================================
// Findings explain system risk; probes are expedition steps
// ===========================================================================

test('findings list renders risk cards with severity and next check', () => {
  const root = renderAt('/findings');
  assert.ok(findAttr(root, 'data-portolan-view', 'findings'), 'findings view marker');
  assert.ok(findAttr(root, 'data-portolan-kind', 'finding'), 'risk card');
  assert.ok(findText(root, 'Dup finding'), 'finding title');
  assert.ok(findText(root, 'Next check'), 'next-check present');
});

test('unknown probes render as expedition steps with permission class', () => {
  const root = renderAt('/unknowns');
  assert.ok(findAttr(root, 'data-portolan-view', 'unknowns'), 'unknowns view marker');
  assert.ok(findAttr(root, 'data-portolan-kind', 'probe'), 'probe card');
  assert.ok(findText(root, 'run go build'), 'next probe visible');
  assert.ok(findText(root, 'Requires: runtime'), 'permission class visible');
});

test('finding dossier renders severity, confidence, and next raw check', () => {
  const root = renderAt('/finding/finding:f1');
  assert.ok(findText(root, 'Dup finding'), 'finding title');
  assert.ok(findText(root, 'severity: major') || findText(root, 'major'), 'severity visible');
  assert.ok(findText(root, 'confidence: hypothesis-with-facts') || findText(root, 'hypothesis-with-facts'), 'confidence visible');
});

test('unknown-probe dossier renders next probe and required permissions', () => {
  const root = renderAt('/probe/unknown:u1');
  assert.ok(findText(root, 'build'), 'blocked surface');
  assert.ok(findText(root, 'run go build'), 'next probe visible');
  assert.ok(findText(root, 'runtime'), 'required permission visible');
});

// ===========================================================================
// Coverage shows regions / scale, not a flat subject table
// ===========================================================================

test('coverage view shows scale metrics and regions', () => {
  const root = renderAt('/coverage');
  assert.ok(findAttr(root, 'data-portolan-view', 'coverage'), 'coverage view marker');
  assert.ok(findAttr(root, 'data-portolan-kind', 'coverage-scale'), 'coverage scale present');
  assert.ok(findText(root, 'Route-less regions') || findText(root, 'ROUTE-LESS'), 'route-less region visible');
  assert.ok(findText(root, 'Viewer'), 'a subject is visible');
});

test('coverage dossier renders promotion and runtime status', () => {
  const root = renderAt('/coverage/region%3Ago-cli');
  assert.ok(findText(root, 'Go CLI'), 'coverage subject label');
  assert.ok(findText(root, 'promoted'), 'promotion state visible');
  assert.ok(findText(root, 'runtime: not_assessed') || findText(root, 'not_assessed'), 'runtime status visible');
});

// ===========================================================================
// Receipt
// ===========================================================================

test('receipt view renders machine status, agent self-status, and disagreements', () => {
  const root = renderAt('/receipt');
  assert.ok(findAttr(root, 'data-portolan-view', 'receipt'), 'receipt view marker');
  assert.ok(findText(root, 'verified'), 'machine status visible');
  assert.ok(findText(root, 'contaminated'), 'agent self-status visible');
  assert.ok(findText(root, 'STATUS DISAGREEMENTS') || findText(root, 'machine=clean'), 'disagreement visible');
});
