/**
 * Domain: graph layout for the behaviour map.
 *
 * Single responsibility: compute spatial positions for landscape units arranged
 * by family cluster, plus overlap relaxation and bounds. Pure functions over a
 * node model ({id, family, degree, x, y, r}) — no DOM, no SVG, no renderer.
 *
 * This is the render-agnostic layout core: SVG renderer (today) and WebGL
 * renderer (Part 2) both consume the same laid-out node model. Extracted from
 * viewer/src/app.js (layoutRadialClusters/relax/computeBounds).
 *
 * Domain layer — zero dependencies.
 */
'use strict';

const FAMILY_ORDER = [
  'data-systems', 'compute-processing', 'platform-governance',
  'packaging-runtime', 'coordination-community', 'integration-services', 'unknown',
];

/**
 * Radial layout: place families around a circle, fan members out within each
 * family sector. Hubs (high-degree nodes) are pulled toward the center so the
 * dense core is visible. Isolated nodes (degree 0) are placed on the outer
 * orbit of their family to avoid the dense core. Mutates node.x/node.y.
 *
 * @param {Array} nodes - each must have {family, degree}; gets {x, y} set.
 */
function layoutRadialClusters(nodes) {
  if (nodes.length === 0) return;
  const byFam = new Map();
  for (const f of FAMILY_ORDER) byFam.set(f, []);
  for (const n of nodes) { (byFam.get(n.family) || byFam.get('unknown')).push(n); }
  const usedFamilies = FAMILY_ORDER.filter(f => (byFam.get(f) || []).length > 0);
  const k = usedFamilies.length;
  const sectorAngle = (Math.PI * 2) / Math.max(1, k);
  const RING_BASE = 230;
  const globalMaxDeg = Math.max(1, ...nodes.map(n => n.degree));
  usedFamilies.forEach((fam, fi) => {
    const members = byFam.get(fam);
    const centerAngle = fi * sectorAngle - Math.PI / 2; // start at top
    const connected = members.filter(n => n.degree > 0).sort((a, b) => b.degree - a.degree);
    const isolated = members.filter(n => n.degree === 0);
    const hub = connected[0] || members[0];
    const hubPull = hub.degree / globalMaxDeg;
    const cx = Math.cos(centerAngle) * RING_BASE * (1 - 0.5 * hubPull);
    const cy = Math.sin(centerAngle) * RING_BASE * (1 - 0.5 * hubPull);
    connected.forEach((n, i) => {
      if (i === 0) { n.x = cx; n.y = cy; return; }
      const ringR = 78 + 26 * Math.floor((i - 1) / 6);
      const ang = centerAngle + Math.PI + ((i - 1) * 2.399963); // golden angle
      n.x = cx + Math.cos(ang) * ringR;
      n.y = cy + Math.sin(ang) * ringR;
    });
    const isoBaseR = RING_BASE + 115;
    isolated.forEach((n, i) => {
      const spread = 0.7;
      const ang = centerAngle + (i - (isolated.length - 1) / 2) * spread;
      n.x = Math.cos(ang) * isoBaseR;
      n.y = Math.sin(ang) * isoBaseR;
    });
  });
  relax(nodes, 55, 24);
}

/**
 * Simple overlap resolution: push apart any two nodes closer than minDist, a
 * few iterations. Mutates node.x/node.y.
 *
 * @param {Array} nodes - each must have {x, y, r}
 * @param {number} minDist - minimum gap between node borders
 * @param {number} iterations
 */
function relax(nodes, minDist, iterations) {
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const want = a.r + b.r + minDist;
        if (d < want && d > 0.001) {
          const push = (want - d) / 2;
          const ux = dx / d, uy = dy / d;
          a.x -= ux * push; a.y -= uy * push;
          b.x += ux * push; b.y += uy * push;
        }
      }
    }
  }
}

/**
 * Compute the bounding box of laid-out nodes including label height so labels
 * never clip. Returns {minX,minY,maxX,maxY,width,height}.
 *
 * @param {Array} nodes - each must have {x, y, r}
 * @param {number} pad - padding around the bounds
 */
function computeBounds(nodes, pad) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    const r = n.r + 28;
    minX = Math.min(minX, n.x - r); minY = Math.min(minY, n.y - r);
    maxX = Math.max(maxX, n.x + r); maxY = Math.max(maxY, n.y + r);
  }
  if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 600; maxY = 400; }
  return {
    minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad,
    width: (maxX - minX) + pad * 2, height: (maxY - minY) + pad * 2,
  };
}

module.exports = { FAMILY_ORDER, layoutRadialClusters, relax, computeBounds };
