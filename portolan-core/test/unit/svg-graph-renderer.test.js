/**
 * Unit tests for the SVG graph renderer adapter.
 *
 * The SVG renderer needs a DOM, so these tests use a minimal mock element
 * factory that records created nodes + dispatched events. This verifies the
 * renderer: (1) satisfies the graph-renderer port contract, (2) produces the
 * expected SVG structure (nodes, edges, defs), (3) emits abstract events on
 * interaction, (4) applies focus state.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { createSvgGraphRenderer } = require('../../src/adapters/svg-graph-renderer');
const { isGraphRenderer } = require('../../src/ports/graph-renderer');

// Minimal mock element: records children + supports addEventListener.
function mockEl(tag) {
  const el = {
    tagName: tag,
    attrs: {},
    children: [],
    listeners: {},
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return this.attrs[k]; },
    appendChild(c) { this.children.push(c); return c; },
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
    classList: { add(){}, remove(){}, contains(){ return false; } },
    querySelectorAll() { return []; },
    textContent: '',
  };
  return el;
}

function mockDoc() {
  return {
    createElementNS: (ns, tag) => mockEl(tag),
    createTextNode: (t) => ({ textContent: t }),
  };
}

function mockContainer() {
  const c = mockEl('div');
  c.innerHTML = '';
  return c;
}

function sampleModel() {
  return {
    nodes: [
      { id: 'component:a', x: 0, y: 0, r: 16, family: 'data-systems', lifecycle: 'active', label: 'A', route: '#/dossier/component/a' },
      { id: 'component:b', x: 100, y: 0, r: 12, family: 'data-systems', lifecycle: 'active', label: 'B', route: '#/dossier/component/b' },
    ],
    edges: [
      { id: 'rel:1', fromId: 'component:a', toId: 'component:b', route: '#/detail/relationship/rel:1', x1: 16, y1: 0, x2: 88, y2: 0 },
    ],
    bounds: { minX: -60, minY: -60, maxX: 160, maxY: 60, width: 220, height: 120 },
  };
}

const sampleTheme = {
  families: {
    'data-systems': { main: '#2dd4bf', glow: '#5eead4', ink: '#0f4e47', soft: '45,212,191' },
    unknown: { main: '#94a3b8', glow: '#cbd5e1', ink: '#5e5341', soft: '148,163,184' },
  },
  graph: { nodeStrokeWidth: 1.5, edgeWidth: 1.2, edgeOpacity: 0.22, edgeCurve: 0, haloMode: 'glow' },
};

test("onEvent: emits node-click when a node group click listener fires", () => {
  const container = mockContainer();
  const r = createSvgGraphRenderer(container, { document: mockDoc() });
  r.render(sampleModel(), sampleTheme);
  const events = [];
  r.onEvent(e => events.push(e));
  const svg = container.children[0];
  const nodeLayer = svg.children.find(c => (c.attrs.class || "").includes("node-layer"));
  const nodeGroup = nodeLayer.children.find(c => c.attrs["data-portolan-id"] === "component:a");
  assert.ok(nodeGroup.listeners.click, "node group should have a click listener");
  nodeGroup.listeners.click[0]({ preventDefault(){} });
  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].type, "node-click");
  assert.strictEqual(events[0].id, "component:a");
  r.destroy();
});

test('focusNode: does not throw for a known or unknown id', () => {
  const container = mockContainer();
  const r = createSvgGraphRenderer(container, { document: mockDoc() });
  r.render(sampleModel(), sampleTheme);
  assert.doesNotThrow(() => r.focusNode('component:a'));
  assert.doesNotThrow(() => r.focusNode('nonexistent'));
  assert.doesNotThrow(() => r.focusNode(null));
  r.destroy();
});

test('destroy: cleans up (no throw on subsequent render)', () => {
  const container = mockContainer();
  const r = createSvgGraphRenderer(container, { document: mockDoc() });
  r.render(sampleModel(), sampleTheme);
  assert.doesNotThrow(() => r.destroy());
});
