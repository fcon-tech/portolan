/**
 * Use-case: open an unknown-probe dossier.
 *
 * Resolves an unknown_id to its probe + linked route/finding/evidence. PURE.
 * Use-case layer.
 */
'use strict';

function openUnknownProbe(navAtlas, unknownId) {
  const up = (navAtlas && navAtlas.unknownProbes) || [];
  const probe = up.find(u => u.unknown_id === unknownId);
  if (!probe) return null;
  const resolve = (ids, key, arr) => (ids || []).map(id => arr.find(x => x[key] === id)).filter(Boolean);
  return {
    probe,
    findings: resolve(probe.finding_refs, 'finding_id', (navAtlas && navAtlas.findings) || []),
    evidence: resolve(probe.evidence_refs, 'evidence_id', (navAtlas && navAtlas.evidence) || []),
    routeIds: probe.route_refs || [],
  };
}

module.exports = { openUnknownProbe };
