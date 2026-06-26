/**
 * Use-case: open a coverage subject dossier.
 *
 * Resolves a subject_id to its coverage row + linked routes, findings, probes.
 * PURE. Use-case layer.
 */
'use strict';

function openCoverageSubject(navAtlas, subjectId) {
  const cm = (navAtlas && navAtlas.coverageMatrix) || [];
  const row = cm.find(c => c.subject_id === subjectId);
  if (!row) return null;
  const resolve = (ids, key, arr) => (ids || []).map(id => arr.find(x => x[key] === id)).filter(Boolean);
  return {
    coverage: row,
    // These are the navigation-index STAGE rows for the linked route_ids
    // (deduped to one stage per route_id), NOT aggregated route summaries.
    routeStages: resolve(row.route_refs, 'route_id', (navAtlas && navAtlas.navigationIndex) || [])
      .filter((v, i, a) => v && a.findIndex(x => x.route_id === v.route_id) === i),
    routeIds: row.route_refs || [],
    findings: resolve(row.finding_refs, 'finding_id', (navAtlas && navAtlas.findings) || []),
    probes: resolve(row.known_unknown_ids, 'unknown_id', (navAtlas && navAtlas.unknownProbes) || []),
    evidence: resolve(row.top_evidence_refs, 'evidence_id', (navAtlas && navAtlas.evidence) || []),
  };
}

module.exports = { openCoverageSubject };
