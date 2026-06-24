/**
 * Unit tests for graph-layout domain: radial layout, relaxation, bounds.
 *
 * These cover the render-agnostic layout core extracted from app.js. The layout
 * must be deterministic (same nodes → same positions) and resolve overlaps.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { FAMILY_ORDER, layoutRadialClusters, relax, computeBounds } = require('../../src/domain/graph-layout');

function makeNode(id, family, degree, r = 12) {
  return { id, family, degree, r, x: 0, y: 0 };
}

test('layoutRadialClusters: empty input is a no-op', () => {
  const nodes = [];
  layoutRadialClusters(nodes);
  assert.strictEqual(nodes.length, 0);
});

test('layoutRadialClusters: every node gets x and y assigned', () => {
  const nodes = [
    makeNode('a', 'data-systems', 3),
    makeNode('b', 'compute-processing', 1),
    makeNode('c', 'unknown', 0),
  ];
  layoutRadialClusters(nodes);
  for (const n of nodes) {
    assert.ok(typeof n.x === 'number' && Number.isFinite(n.x), `${n.id} x not finite`);
    assert.ok(typeof n.y === 'number' && Number.isFinite(n.y), `${n.id} y not finite`);
  }
});

test('layoutRadialClusters: hub sits at the family cluster center, leaves ring around it', () => {
  const nodes = [
    makeNode('hub', 'data-systems', 11),
    makeNode('leaf1', 'data-systems', 1),
    makeNode('leaf2', 'data-systems', 1),
  ];
  layoutRadialClusters(nodes);
  const hub = nodes.find(n => n.id === 'hub');
  const leaves = nodes.filter(n => n.id !== 'hub');
  // The hub is the cluster center; every leaf is on a ring around it (distance >= ring gap).
  for (const leaf of leaves) {
    const dFromHub = Math.hypot(leaf.x - hub.x, leaf.y - hub.y);
    assert.ok(dFromHub >= 50, `leaf ${leaf.id} distance from hub (${dFromHub.toFixed(0)}) should be >= 50`);
  }
});

test('layoutRadialClusters: determinism — same input yields same positions', () => {
  const a = [makeNode('x', 'data-systems', 2), makeNode('y', 'compute-processing', 3), makeNode('z', 'unknown', 0)];
  const b = [makeNode('x', 'data-systems', 2), makeNode('y', 'compute-processing', 3), makeNode('z', 'unknown', 0)];
  layoutRadialClusters(a);
  layoutRadialClusters(b);
  for (let i = 0; i < a.length; i++) {
    assert.strictEqual(a[i].x.toFixed(6), b[i].x.toFixed(6));
    assert.strictEqual(a[i].y.toFixed(6), b[i].y.toFixed(6));
  }
});

test('relax: two overlapping nodes are pushed apart beyond their radii sum', () => {
  const nodes = [
    { id: 'p', x: 0, y: 0, r: 10 },
    { id: 'q', x: 5, y: 0, r: 10 },
  ];
  relax(nodes, 10, 30);
  const d = Math.hypot(nodes[0].x - nodes[1].x, nodes[0].y - nodes[1].y);
  assert.ok(d >= 30, `after relax distance ${d.toFixed(1)} should be >= 30`);
});

test('relax: already-separated nodes are not moved', () => {
  const nodes = [
    { id: 'p', x: 0, y: 0, r: 5 },
    { id: 'q', x: 100, y: 0, r: 5 },
  ];
  const before = nodes.map(n => ({ x: n.x, y: n.y }));
  relax(nodes, 10, 5);
  assert.deepStrictEqual(nodes.map(n => ({ x: n.x, y: n.y })), before);
});

test('relax: coincident nodes (d≈0) are not divided-by-zero', () => {
  const nodes = [
    { id: 'p', x: 5, y: 5, r: 8 },
    { id: 'q', x: 5, y: 5, r: 8 },
  ];
  // Should not throw / not produce NaN.
  relax(nodes, 10, 5);
  for (const n of nodes) {
    assert.ok(Number.isFinite(n.x) && Number.isFinite(n.y));
  }
});

test('computeBounds: returns finite width/height enclosing all nodes + label pad', () => {
  const nodes = [
    { x: -100, y: -50, r: 12 },
    { x: 100, y: 80, r: 12 },
  ];
  const b = computeBounds(nodes, 40);
  assert.ok(b.minX < -100 && b.maxX > 100);
  assert.ok(b.minY < -50 && b.maxY > 80);
  assert.ok(b.width > 0 && b.height > 0);
});

test('computeBounds: empty nodes yields a default box', () => {
  const b = computeBounds([], 40);
  assert.ok(b.width > 0 && b.height > 0);
  assert.ok(Number.isFinite(b.minX));
});

test('FAMILY_ORDER lists all seven families with unknown last', () => {
  assert.strictEqual(FAMILY_ORDER.length, 7);
  assert.strictEqual(FAMILY_ORDER[FAMILY_ORDER.length - 1], 'unknown');
});
