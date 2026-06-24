/**
 * Use-case: triangulate — detect conflicts between the three truths (behaviour,
 * intentions, representations) and return triangulation findings for the overlay.
 *
 * Charter 08: triangulation is a highlight layer on any map. A conflict exists
 * when an agent-producer hypothesis with finding_type 'triangulation-conflict'
 * affects a unit — meaning the agent found that intentions (tickets) or
 * representations (docs) disagree with the behaviour (code).
 *
 * PURE. Reads the atlas's hypotheses + components.
 *
 * Use-case layer — depends on domain.
 */
'use strict';

/**
 * Whether the atlas has the data needed for triangulation (hypotheses present).
 * @param {object} atlas
 * @returns {boolean}
 */
function canTriangulate(atlas) {
  const hs = (atlas && atlas.objects && atlas.objects.hypotheses) || [];
  return hs.some(h => h.finding_type === 'triangulation-conflict');
}

/**
 * Detect triangulation conflicts and group by affected unit.
 * @param {object} atlas
 * @returns {{ conflicts: Array, byUnit: Object }}
 *   conflicts: [{ unitId, hypothesisId, claim, confidence, producer_family }]
 *   byUnit: { [unitId]: conflicts[] }
 */
function triangulate(atlas) {
  const hs = (atlas && atlas.objects && atlas.objects.hypotheses) || [];
  const conflicts = [];
  for (const h of hs) {
    if (h.finding_type !== 'triangulation-conflict') continue;
    const affected = h.affected_ids || [];
    for (const unitId of affected) {
      conflicts.push({
        unitId,
        hypothesisId: h.id,
        claim: h.claim,
        confidence: h.confidence,
        producer_family: h.producer_family,
      });
    }
  }
  const byUnit = {};
  for (const c of conflicts) {
    if (!byUnit[c.unitId]) byUnit[c.unitId] = [];
    byUnit[c.unitId].push(c);
  }
  return { conflicts, byUnit };
}

module.exports = { triangulate, canTriangulate };
