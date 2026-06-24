/**
 * Unit tests for open-behaviour-map use-case.
 * Builds a render-ready graph model from atlas objects — pure, no DOM.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { openBehaviourMap } = require('../../src/use-cases/open-behaviour-map');

function atlas() {
  return {
    objects: {
      components: [
        { id: 'component:hadoop', display_name: 'Hadoop', c4_family: 'data-systems', lifecycle: 'active', route: '#/dossier/component/hadoop', evidence: { state: 'source-visible' } },
        { id: 'component:hbase', display_name: 'HBase', c4_family: 'data-systems', lifecycle: 'active', route: '#/dossier/component/hbase', evidence: { state: 'source-visible' } },
        { id: 'component:isolated', display_name: 'Iso', c4_family: 'unknown', lifecycle: 'active', route: '#/dossier/component/isolated', evidence: { state: 'metadata-visible' } },
      ],
      relationships: [
        { id: 'rel:1', from_id: 'component:hbase', to_id: 'component:hadoop', relationship_type: 'depends-on', route: '#/detail/relationship/rel:1' },
      ],
    },
  };
}

test('openBehaviourMap: returns nodes for every component', () => {
  const m = openBehaviourMap(atlas());
  assert.strictEqual(m.nodes.length, 3);
  assert.ok(m.nodes.some(n => n.id === 'component:hadoop'));
});

test('openBehaviourMap: degree counts relationship endpoints', () => {
  const m = openBehaviourMap(atlas());
  const hadoop = m.nodes.find(n => n.id === 'component:hadoop');
  const hbase = m.nodes.find(n => n.id === 'component:hbase');
  const iso = m.nodes.find(n => n.id === 'component:isolated');
  assert.strictEqual(hadoop.degree, 1);
  assert.strictEqual(hbase.degree, 1);
  assert.strictEqual(iso.degree, 0);
});

test('openBehaviourMap: node radius scales with degree (hub bigger than isolated)', () => {
  const m = openBehaviourMap(atlas());
  const connected = m.nodes.find(n => n.id === 'component:hadoop');
  const isolated = m.nodes.find(n => n.id === 'component:isolated');
  assert.ok(connected.r >= isolated.r, `connected r ${connected.r} should be >= isolated r ${isolated.r}`);
});

test('openBehaviourMap: every node gets finite x,y after layout', () => {
  const m = openBehaviourMap(atlas());
  for (const n of m.nodes) {
    assert.ok(Number.isFinite(n.x), `${n.id} x finite`);
    assert.ok(Number.isFinite(n.y), `${n.id} y finite`);
  }
});

test('openBehaviourMap: edges carry route + relationshipType + trimmed endpoints', () => {
  const m = openBehaviourMap(atlas());
  assert.strictEqual(m.edges.length, 1);
  const e = m.edges[0];
  assert.strictEqual(e.id, 'rel:1');
  assert.strictEqual(e.relationshipType, 'depends-on');
  assert.strictEqual(e.route, '#/detail/relationship/rel:1');
  assert.ok(Number.isFinite(e.x1) && Number.isFinite(e.y1) && Number.isFinite(e.x2) && Number.isFinite(e.y2));
});

test('openBehaviourMap: edge endpoints are trimmed to node borders (not at node centers)', () => {
  const m = openBehaviourMap(atlas());
  const e = m.edges[0];
  const a = m.nodes.find(n => n.id === e.fromId);
  const b = m.nodes.find(n => n.id === e.toId);
  const startDist = Math.hypot(e.x1 - a.x, e.y1 - a.y);
  const endDist = Math.hypot(e.x2 - b.x, e.y2 - b.y);
  // Trimmed endpoints sit at the node radius, not the center.
  assert.ok(Math.abs(startDist - a.r) < 1, `start should be ~radius ${a.r}, got ${startDist.toFixed(1)}`);
  assert.ok(Math.abs(endDist - b.r) < 1, `end should be ~radius ${b.r}, got ${endDist.toFixed(1)}`);
});

test('openBehaviourMap: bounds enclose all nodes with finite width/height', () => {
  const m = openBehaviourMap(atlas());
  assert.ok(m.bounds.width > 0 && m.bounds.height > 0);
  assert.ok(Number.isFinite(m.bounds.minX));
});

test('openBehaviourMap: empty atlas yields empty model without throwing', () => {
  const m = openBehaviourMap({});
  assert.deepStrictEqual(m.nodes, []);
  assert.deepStrictEqual(m.edges, []);
  assert.ok(m.bounds.width > 0);
});

test('openBehaviourMap: determinism — same atlas yields same model', () => {
  const a = atlas();
  const m1 = openBehaviourMap(a);
  const m2 = openBehaviourMap(a);
  assert.strictEqual(m1.nodes.length, m2.nodes.length);
  for (let i = 0; i < m1.nodes.length; i++) {
    assert.strictEqual(m1.nodes[i].x.toFixed(4), m2.nodes[i].x.toFixed(4));
    assert.strictEqual(m1.nodes[i].y.toFixed(4), m2.nodes[i].y.toFixed(4));
  }
});

test('openBehaviourMap: relationship to a non-existent component is dropped, not crash', () => {
  const a = atlas();
  a.objects.relationships.push({ id: 'rel:ghost', from_id: 'component:hadoop', to_id: 'component:ghost', relationship_type: 'depends-on', route: '#/detail/relationship/rel:ghost' });
  const m = openBehaviourMap(a);
  assert.strictEqual(m.edges.length, 1); // only the valid edge
});
