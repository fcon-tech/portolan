/**
 * Unit tests for the multiscale system drill-down (spec 20).
 *
 * Verifies the ecosystem → capability → component → module/concept scale
 * model: each scale is evidence-backed, cross-scale linked, and honest-empty
 * when evidence is missing.
 *
 * Domain-layer: pure functions, no DOM/IO.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { buildMultiscaleModel, drillInto, SCALE_LEVELS } = require('../../src/domain/multiscale-drilldown');

function baseSystemMap() {
  return {
    target: { id: 'target', display_name: 'Test Landscape' },
    objects: {
      components: [
        { id: 'component:alpha', display_name: 'Alpha', c4_family: 'library' },
        { id: 'component:beta', display_name: 'Beta', c4_family: 'library' },
        { id: 'component:gamma', display_name: 'Gamma', c4_family: 'application' },
      ],
      relationships: [],
      findings: [],
      surfaces: [],
      unknowns: [],
    },
  };
}

test('buildMultiscaleModel produces ecosystem → capability → component → module (spec 20)', () => {
  const model = buildMultiscaleModel(baseSystemMap());
  assert.strictEqual(model.root.level, 'ecosystem');
  assert.ok(model.root.children.length > 0, 'ecosystem should have children');

  // Capability scale exists.
  const caps = model.scales.filter(s => s.level === 'capability');
  assert.ok(caps.length > 0, 'should have capability entries');

  // Component scale exists.
  const comps = model.scales.filter(s => s.level === 'component');
  assert.strictEqual(comps.length, 3);

  // Module scale exists (honest-empty per component).
  const mods = model.scales.filter(s => s.level === 'module');
  assert.strictEqual(mods.length, 3);
});

test('each scale is backed by evidence (spec 20)', () => {
  const model = buildMultiscaleModel(baseSystemMap());
  for (const entry of model.scales) {
    assert.ok(entry.evidence, `${entry.id} should have evidence`);
    assert.ok(entry.evidence.source, `${entry.id} should name its evidence source`);
  }
});

test('each scale connects to its neighbours (spec 20)', () => {
  const model = buildMultiscaleModel(baseSystemMap());
  // Ecosystem → capabilities.
  for (const capId of model.root.children) {
    const cap = model.scales.find(s => s.id === capId);
    assert.ok(cap, `child ${capId} should exist in scales`);
    assert.strictEqual(cap.parent, model.root.id, `${capId} parent should be ecosystem`);
  }
  // Capabilities → components.
  const caps = model.scales.filter(s => s.level === 'capability');
  for (const cap of caps) {
    for (const childId of cap.children) {
      const child = model.scales.find(s => s.id === childId);
      assert.ok(child, `component ${childId} should exist`);
      assert.strictEqual(child.parent, cap.id);
    }
  }
  // Components → modules.
  const comps = model.scales.filter(s => s.level === 'component');
  for (const comp of comps) {
    for (const childId of comp.children) {
      const child = model.scales.find(s => s.id === childId);
      assert.ok(child, `module ${childId} should exist`);
      assert.strictEqual(child.parent, comp.id);
    }
  }
});

test('unevidenced module scale is honest-empty (spec 20)', () => {
  const model = buildMultiscaleModel(baseSystemMap());
  const mods = model.scales.filter(s => s.level === 'module');
  for (const mod of mods) {
    assert.ok(mod.isEmpty, `${mod.id} should be honest-empty without symbol data`);
    assert.ok(mod.emptyReason, `${mod.id} should explain why it is empty`);
    assert.strictEqual(mod.evidence.source, 'not_assessed');
  }
});

test('module scale shows concepts when SI has them (spec 20)', () => {
  const sm = baseSystemMap();
  const si = {
    capabilities: [{ id: 'capability:library', label: 'Library' }],
    components: [{
      id: 'component:alpha',
      ecosystem_regions: ['capability:library'],
      internal_concepts: [
        { id: 'concept:a1', label: 'Concept A1', explanation: 'expl', source_boundary: 'local-corpus' },
        { id: 'concept:a2', label: 'Concept A2', explanation: 'expl', source_boundary: 'local-corpus' },
      ],
    }],
  };
  const model = buildMultiscaleModel(sm, si);
  const alphaMods = model.scales.filter(s => s.level === 'module' && s.parent === 'component:alpha');
  assert.strictEqual(alphaMods.length, 2);
  assert.ok(alphaMods.every(m => !m.isEmpty));
});

test('drillInto returns entry and its children (spec 20)', () => {
  const model = buildMultiscaleModel(baseSystemMap());
  const drilled = drillInto(model, model.root.id);
  assert.ok(drilled);
  assert.strictEqual(drilled.entry.level, 'ecosystem');
  assert.ok(drilled.children.length > 0);
});

test('drillInto returns null for unknown id (spec 20)', () => {
  const model = buildMultiscaleModel(baseSystemMap());
  assert.strictEqual(drillInto(model, 'nonexistent'), null);
});

test('empty system-map yields honest-empty ecosystem (spec 20)', () => {
  const model = buildMultiscaleModel(null);
  assert.strictEqual(model.root.isEmpty, true);
  assert.ok(model.root.emptyReason);
  assert.strictEqual(model.root.evidence.source, 'not_assessed');
});

test('SCALE_LEVELS has 4 levels in order (spec 20)', () => {
  assert.deepStrictEqual(SCALE_LEVELS, ['ecosystem', 'capability', 'component', 'module']);
});
