/**
 * Use-case: open the behaviour map — build a laid-out graph model from the
 * atlas's components + relationships.
 *
 * Single responsibility: turn raw atlas objects into a render-ready graph model
 * (nodes with coordinates + radius, edges trimmed to borders, bounds). PURE —
 * no DOM, no SVG, no renderer. The renderer port consumes this model.
 *
 * This is the extraction of the graph-model logic that was fused inside
 * viewer/src/app.js renderGraphCanvas (lines 427-440, 459-465). Layout itself
 * delegates to domain/graph-layout.
 *
 * Use-case layer — depends on domain, never adapters.
 */
'use strict';

const { layoutRadialClusters, computeBounds } = require('../domain/graph-layout');
const { isStructuralEdge } = require('../domain/landscape-structure');

/**
 * Build a render-ready behaviour-map model.
 *
 * @param {object} atlas - the parsed system-map; uses objects.components + objects.relationships
 * @returns {{nodes: Array, edges: Array, bounds: object}}
 *   nodes: [{id, family, lifecycle, label, route, evidenceState, degree, x, y, r}]
 *   edges: [{id, fromId, toId, route, relationshipType, structural, from:{x,y,r},
 *            to:{x,y,r}, x1,y1,x2,y2}] — endpoints trimmed to node borders
 *   bounds: {minX,minY,maxX,maxY,width,height}
 */
function openBehaviourMap(atlas) {
  const comps = (atlas && atlas.objects && atlas.objects.components) || [];
  const rels = (atlas && atlas.objects && atlas.objects.relationships) || [];

  // 1. Build node model + degree.
  const nodeMap = new Map();
  for (const c of comps) {
    nodeMap.set(c.id, {
      id: c.id,
      family: c.c4_family || 'unknown',
      lifecycle: c.lifecycle || 'unknown',
      label: c.display_name || c.id,
      route: c.route,
      evidenceState: c.evidence && c.evidence.state,
      degree: 0,
    });
  }
  // 2. Build edges + count degree.
  const edges = [];
  for (const r of rels) {
    const from = nodeMap.get(r.from_id);
    const to = nodeMap.get(r.to_id);
    if (from && to) {
      from.degree++;
      to.degree++;
      edges.push({
        id: r.id,
        fromId: r.from_id,
        toId: r.to_id,
        route: r.route,
        relationshipType: r.relationship_type,
        structural: isStructuralEdge(r),
      });
    }
  }
  const nodes = [...nodeMap.values()];

  // 3. Node radius from degree (importance). Base 9, scale to 26 for the hub.
  const maxDeg = Math.max(1, ...nodes.map(n => n.degree));
  for (const n of nodes) {
    n.r = 9 + 14 * (n.degree / maxDeg);
  }

  // 4. Layout (mutates x,y on nodes).
  layoutRadialClusters(nodes);

  // 5. Compute bounds (accounts for label height).
  const bounds = computeBounds(nodes, 40);

  // 6. Trim edge endpoints to node borders (pure vector math).
  for (const e of edges) {
    const a = nodeMap.get(e.fromId);
    const b = nodeMap.get(e.toId);
    const dx = b.x - a.x, dy = b.y - a.y;
    const dist = Math.max(0.001, Math.hypot(dx, dy));
    const ux = dx / dist, uy = dy / dist;
    e.from = { x: a.x, y: a.y, r: a.r };
    e.to = { x: b.x, y: b.y, r: b.r };
    e.x1 = a.x + ux * a.r;
    e.y1 = a.y + uy * a.r;
    e.x2 = b.x - ux * b.r;
    e.y2 = b.y - uy * b.r;
  }

  return { nodes, edges, bounds };
}

module.exports = { openBehaviourMap };
