/**
 * Use-case: open a finding dossier.
 *
 * Resolves a finding_id to its finding + subjects + routes + evidence. PURE.
 * Captain-atlas 16: also merges REVERSE-DERIVED route/stage context so a
 * finding row that carries no route_refs still shows which journey made the
 * risk matter. Use-case layer.
 */
'use strict';

const { deriveReverseRefs } = require('../domain/atlas-detail');

function openFinding(navAtlas, findingId) {
  const fi = (navAtlas && navAtlas.findings) || [];
  const finding = fi.find(f => f.finding_id === findingId);
  if (!finding) return null;
  const resolve = (ids, key, arr) => (ids || []).map(id => arr.find(x => x[key] === id)).filter(Boolean);

  // Direct forward refs.
  const directRouteIds = finding.route_refs || [];

  // Reverse-derived context (captain-atlas 16): stages referencing this finding.
  const reverse = deriveReverseRefs(navAtlas);
  const ctx = reverse.get(findingId) || { routes: new Set(), stages: [], findings: new Set(), probes: new Set() };
  const reverseRouteIds = [...ctx.routes];
  const reverseStageRefs = ctx.stages.map(s => ({ routeId: s.route_id, stageIndex: s.stage_index }));

  // Merge direct + reverse, deduped, order-preserved.
  const seen = new Set();
  const routeIds = [];
  for (const id of [...directRouteIds, ...reverseRouteIds]) {
    if (!seen.has(id)) { seen.add(id); routeIds.push(id); }
  }

  return {
    finding,
    evidence: resolve(finding.evidence_refs, 'evidence_id', (navAtlas && navAtlas.evidence) || []),
    routeIds,
    stageRefs: reverseStageRefs,
    subjectIds: finding.subject_ids || [],
    contextDerived: directRouteIds.length === 0 && reverseRouteIds.length > 0,
  };
}

module.exports = { openFinding };
