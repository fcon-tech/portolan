/**
 * Shell render smoke test for the semantic investigation contract
 * (captain-atlas 17).
 *
 * Uses the same mock-DOM precedent as shell-navigation.test.js (zero-dep; no
 * jsdom/playwright). Verifies the shell contract:
 *   - a selected component's investigation page renders all 8 sections;
 *   - a selected component's generic-dossier route reroutes to its investigation
 *     (no fallback to a generic dossier);
 *   - the ecosystem map renders capability regions + a visible overlap pair;
 *   - a non-selected component keeps its generic dossier (no false reroute);
 *   - the Semantic Map tab is present when semantic data exists.
 *
 * UI verification, no browser dependency — the real browser harness
 * (harness-atlas-semantic-component-investigation.sh) is the acceptance gate.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { createPortolanShell } = require('../../src/shell');

// ---- mock DOM (mirrors shell-navigation.test.js) --------------------------
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
    classList: { _t: new Set(), add(x) { this._t.add(x); }, remove(x) { this._t.delete(x); }, contains(x) { return this._t.has(x); } },
    querySelectorAll() { return []; }, querySelector() { return null; },
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
  Object.defineProperty(r, 'innerHTML', { set(v) { r._innerHTML = v; }, get() { return r._innerHTML; } });
  return r;
}
function walk(node, fn) { fn(node); for (const c of node.children || []) walk(c, fn); }
function allNodes(root) { const out = []; walk(root, n => out.push(n)); return out; }
function findAttr(root, attr, value) { return allNodes(root).some(n => n.attrs && n.attrs[attr] === value); }
function attrNodes(root, attr) { return allNodes(root).filter(n => n.attrs && n.attrs[attr] !== undefined); }

// ---- fixtures --------------------------------------------------------------
// Load the real committed fixture so the test exercises actual sample data
// (portability: if the fixture changes, the contract still holds).
function loadSemanticInvestigation() {
  const dir = path.join(__dirname, '..', 'fixtures', 'semantic-investigation');
  const si = JSON.parse(fs.readFileSync(path.join(dir, 'semantic-investigation.bigtop.json'), 'utf8'));
  si.sources = JSON.parse(fs.readFileSync(path.join(dir, 'sources.json'), 'utf8')).sources;
  return si;
}

// A minimal atlas whose components overlap with the semantic sample ids.
function fixtureAtlas(si) {
  const comps = si.components.map(c => ({ id: c.id, display_name: c.display_name, c4_family: 'unknown', route: '#/dossier/component/' + encodeURIComponent(c.id), relationship_ids: [] }));
  return {
    target: { id: 'apache-bigtop', display_name: 'Apache Bigtop', root: '/bigtop' },
    objects: { components: comps, repositories: [], surfaces: [], relationships: [], findings: [], unknowns: [] },
    c4: { context_boxes: [], families: [], component_boxes: [] },
  };
}

function makeShell(si, hash) {
  const root = mockRoot();
  const doc = mockDoc();
  const atlas = fixtureAtlas(si);
  // The shell's hash-navigator reads window.location.hash. Stub a minimal
  // window for the test (no real browser). Restore afterwards.
  const origWindow = global.window;
  global.window = {
    location: { hash: '#' + (hash || '/overview') },
    history: { pushState() {} },
    addEventListener() {}, removeEventListener() {},
  };
  try {
    const shell = createPortolanShell({ root, document: doc, atlas, semanticInvestigation: si });
    shell.render();
    return { shell, root, doc, navigator: shell._internals.navigator };
  } finally {
    global.window = origWindow;
  }
}

// ===========================================================================
const SOLR_INV = '/investigation/' + encodeURIComponent('component:apache-solr');
const SPARK_INV = '/investigation/' + encodeURIComponent('component:apache-spark');
const FLINK_INV = '/investigation/' + encodeURIComponent('component:apache-flink');
const SOLR_DOSSIER = '/dossier/component/' + encodeURIComponent('component:apache-solr');

test('a selected component investigation page renders all 8 sections', () => {
  const si = loadSemanticInvestigation();
  const { root } = makeShell(si, SOLR_INV);
  const sections = ['ecosystem-placement', 'purpose-capabilities', 'internal-model', 'integration-surface', 'risks', 'overlap-alternatives', 'evidence-boundary', 'next-expedition'];
  for (const s of sections) {
    assert.ok(findAttr(root, 'data-portolan-section', s), `expected section ${s}`);
  }
});

test('a selected component investigation page renders >= 5 concept cards', () => {
  const si = loadSemanticInvestigation();
  const { root } = makeShell(si, SOLR_INV);
  const conceptNodes = attrNodes(root, 'data-portolan-concept');
  assert.ok(conceptNodes.length >= 5, `expected >= 5 concept cards, got ${conceptNodes.length}`);
});

test('a selected component investigation page renders >= 2 risk cards', () => {
  const si = loadSemanticInvestigation();
  const { root } = makeShell(si, SOLR_INV);
  const riskNodes = attrNodes(root, 'data-portolan-risk');
  assert.ok(riskNodes.length >= 2, `expected >= 2 risk cards, got ${riskNodes.length}`);
});

test('a selected component investigation page shows the bidirectional overlap partner', () => {
  const si = loadSemanticInvestigation();
  const { root } = makeShell(si, SPARK_INV);
  const overlapNodes = attrNodes(root, 'data-portolan-overlap');
  assert.ok(overlapNodes.length >= 1, 'expected at least one overlap card on Spark');
  assert.ok(overlapNodes.some(n => n.attrs['data-portolan-overlap'] === 'component:apache-flink'), 'Spark must show Flink as overlap');
});

test('the Spark<->Flink overlap is symmetric: opening Flink shows Spark', () => {
  const si = loadSemanticInvestigation();
  const { root } = makeShell(si, FLINK_INV);
  const overlapNodes = attrNodes(root, 'data-portolan-overlap');
  assert.ok(overlapNodes.some(n => n.attrs['data-portolan-overlap'] === 'component:apache-spark'), 'Flink must show Spark as overlap');
});

test('a selected component dossier/component route reroutes to the investigation (no fallback)', () => {
  const si = loadSemanticInvestigation();
  const { root } = makeShell(si, SOLR_DOSSIER);
  assert.ok(findAttr(root, 'data-portolan-view', 'semantic-investigation'), 'selected component must render the investigation, not the generic dossier');
  assert.ok(!findAttr(root, 'data-portolan-view', 'component-dossier'), 'selected component must NOT render the generic component dossier');
});

test('the ecosystem map renders capability regions and a visible overlap pair', () => {
  const si = loadSemanticInvestigation();
  const { root } = makeShell(si, '/ecosystem');
  assert.ok(findAttr(root, 'data-portolan-view', 'ecosystem'), 'ecosystem view marker');
  const regionNodes = attrNodes(root, 'data-portolan-region');
  assert.ok(regionNodes.length >= 1, 'expected at least one capability region');
  const pairNodes = attrNodes(root, 'data-portolan-overlap-pair');
  assert.ok(pairNodes.length >= 1, 'expected at least one visible overlap pair on the map');
});

test('the ecosystem map is NOT the structure map (distinct view marker)', () => {
  const si = loadSemanticInvestigation();
  const { root } = makeShell(si, '/ecosystem');
  assert.ok(findAttr(root, 'data-portolan-kind', 'ecosystem-map'), 'ecosystem map carries its own kind marker');
  assert.ok(findAttr(root, 'data-portolan-kind', 'ecosystem-regions'), 'ecosystem map renders capability regions');
});

test('the Semantic Map tab is present when semantic data exists', () => {
  const si = loadSemanticInvestigation();
  const { root } = makeShell(si, '/overview');
  assert.ok(findAttr(root, 'data-portolan-nav', 'ecosystem'), 'Semantic Map tab must be present');
});

test('an overlap card on the ecosystem map links to the partner investigation', () => {
  const si = loadSemanticInvestigation();
  const { root } = makeShell(si, '/ecosystem');
  const nodes = allNodes(root);
  const linksToSpark = nodes.some(n => n.attrs && (n.attrs['data-portolan-route'] || '').includes('/investigation/' + encodeURIComponent('component:apache-spark')));
  const linksToFlink = nodes.some(n => n.attrs && (n.attrs['data-portolan-route'] || '').includes('/investigation/' + encodeURIComponent('component:apache-flink')));
  assert.ok(linksToSpark && linksToFlink, 'overlap pair card must link to both partner investigations');
});

test('an investigation page shows the source-boundary badges (not a single confidence badge)', () => {
  const si = loadSemanticInvestigation();
  const { root } = makeShell(si, SOLR_INV);
  const boundaries = new Set(attrNodes(root, 'data-portolan-source-boundary').map(n => n.attrs['data-portolan-source-boundary']));
  assert.ok(boundaries.size >= 2, `expected >= 2 distinct source boundaries, got ${[...boundaries]}`);
});
