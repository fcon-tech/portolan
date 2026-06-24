/**
 * Domain: region profile — the statistical portrait of a group of landscape
 * units (charter 08 "region drill-down").
 *
 * Single responsibility: aggregate a set of units (+ their edges + surfaces)
 * into a pure statistical profile: counts, lifecycle/evidence/family
 * distributions, edge density, top hubs (most-connected units), surface total.
 * This is the data behind the "description of a region" — the atlas's analogue
 * of a gazetteer entry next to a map region.
 *
 * Pure function over plain data. Domain layer — zero dependencies.
 */
'use strict';

const TOP_HUBS_LIMIT = 5;

/**
 * Tally values into a {value: count} map.
 * @param {Array} items
 * @param {Function} keyFn
 * @returns {Object<string, number>}
 */
function tally(items, keyFn) {
  const out = {};
  for (const it of items) {
    const k = keyFn(it);
    if (k == null || k === '') continue;
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

/**
 * Build a statistical region profile for a group of units.
 *
 * @param {Array} units - landscape units; each may have c4_family, lifecycle,
 *   evidence.state, relationship_ids, surface_ids.
 * @param {Array} edges - relationship edges {from_id, to_id}; only edges whose
 *   BOTH endpoints are in `units` count toward edge_count/edge_density.
 * @param {object} [opts] - { topHubsLimit }
 * @returns {object} region profile
 */
function buildRegionProfile(units, edges, opts = {}) {
  const hubLimit = opts.topHubsLimit || TOP_HUBS_LIMIT;
  const unitIds = new Set((units || []).map(u => u.id));
  const u = units || [];
  const e = edges || [];

  const internalEdges = e.filter(ed => unitIds.has(ed.from_id) && unitIds.has(ed.to_id));
  const edgeCount = internalEdges.length;
  // Edge density: observed internal edges / possible undirected pairs.
  const n = u.length;
  const possiblePairs = n > 1 ? (n * (n - 1)) / 2 : 0;
  const edgeDensity = possiblePairs > 0 ? edgeCount / possiblePairs : 0;

  const surfaceCount = u.reduce((sum, unit) => sum + ((unit.surface_ids || []).length), 0);

  // Top hubs: units sorted by relationship count, descending, limited.
  const topHubs = u
    .map(unit => ({ id: unit.id, relationship_count: (unit.relationship_ids || []).length }))
    .sort((a, b) => b.relationship_count - a.relationship_count)
    .slice(0, hubLimit);

  return {
    unit_count: n,
    edge_count: edgeCount,
    edge_density: edgeDensity,
    surface_count: surfaceCount,
    lifecycle_distribution: tally(u, unit => unit.lifecycle),
    evidence_distribution: tally(u, unit => unit.evidence && unit.evidence.state),
    family_distribution: tally(u, unit => unit.c4_family),
    top_hubs: topHubs,
  };
}

module.exports = { buildRegionProfile, TOP_HUBS_LIMIT };
