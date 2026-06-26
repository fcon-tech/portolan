/**
 * Use-case: open an unknown-probe dossier.
 *
 * Resolves an unknown_id to its probe + linked route/finding/evidence. PURE.
 * Captain-atlas 16: also merges REVERSE-DERIVED route/stage/finding context so
 * a probe row that carries no direct route_refs still explains which journey
 * made the unknown matter. Use-case layer.
 */
'use strict';

const { deriveReverseRefs } = require('../domain/atlas-detail');

function openUnknownProbe(navAtlas, unknownId) {
  const up = (navAtlas && navAtlas.unknownProbes) || [];
  const probe = up.find(u => u.unknown_id === unknownId);
  if (!probe) return null;
  const resolve = (ids, key, arr) => (ids || []).map(id => arr.find(x => x[key] === id)).filter(Boolean);

  // Direct forward refs (from the probe row itself).
  const directRouteIds = probe.route_refs || [];
  const directFindingIds = (probe.finding_refs || []);

  // Reverse-derived context (captain-atlas 16): scan navigation-index stages
  // for any stage referencing this probe, even when the probe row has no
  // route_refs. This is how a probe keeps route/stage context.
  const reverse = deriveReverseRefs(navAtlas);
  const ctx = reverse.get(unknownId) || { routes: new Set(), stages: [], findings: new Set(), probes: new Set() };
  const reverseRouteIds = [...ctx.routes];
  const reverseStageRefs = ctx.stages.map(s => ({ routeId: s.route_id, stageIndex: s.stage_index }));

  // Merge: direct refs first (they are the probe's own declaration), then any
  // reverse-derived ids not already present. Dedup preserves order.
  const seenRoutes = new Set();
  const routeIds = [];
  for (const id of [...directRouteIds, ...reverseRouteIds]) {
    if (!seenRoutes.has(id)) { seenRoutes.add(id); routeIds.push(id); }
  }
  const seenFindings = new Set(directFindingIds);
  const findingIds = [...directFindingIds];
  for (const id of ctx.findings) {
    if (!seenFindings.has(id)) { seenFindings.add(id); findingIds.push(id); }
  }

  return {
    probe,
    findings: resolve(findingIds, 'finding_id', (navAtlas && navAtlas.findings) || []),
    evidence: resolve(probe.evidence_refs, 'evidence_id', (navAtlas && navAtlas.evidence) || []),
    routeIds,
    stageRefs: reverseStageRefs,
    // true when the probe's own row carried route_refs; false means the route
    // context was reverse-derived (a useful signal for the detail UI).
    contextDerived: directRouteIds.length === 0 && reverseRouteIds.length > 0,
  };
}

module.exports = { openUnknownProbe };
