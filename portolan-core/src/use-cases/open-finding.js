/**
 * Use-case: open a finding dossier.
 *
 * Resolves a finding_id to its finding + subjects + routes + evidence. PURE.
 * Use-case layer.
 */
'use strict';

function openFinding(navAtlas, findingId) {
  const fi = (navAtlas && navAtlas.findings) || [];
  const finding = fi.find(f => f.finding_id === findingId);
  if (!finding) return null;
  const resolve = (ids, key, arr) => (ids || []).map(id => arr.find(x => x[key] === id)).filter(Boolean);
  return {
    finding,
    evidence: resolve(finding.evidence_refs, 'evidence_id', (navAtlas && navAtlas.evidence) || []),
    routeIds: finding.route_refs || [],
    subjectIds: finding.subject_ids || [],
  };
}

module.exports = { openFinding };
