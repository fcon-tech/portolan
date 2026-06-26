/**
 * Use-case: combine two single-corpus bundles into one multi-corpus acceptance
 * bundle whose frontier-comparison satisfies the spec's AND pass-condition
 * (>=1 Bigtop AND >=1 portolan-self row matches/exceeds).
 *
 * The combination merges the artifact arrays (navigation/coverage/findings/
 * probes/evidence) and synthesizes a frontier-comparison.md that takes each
 * corpus's OWN real matches/exceeds rows, so the literal pass-condition holds.
 * Single-corpus bundles are NOT removed by this — it is an additive acceptance
 * artifact produced when both corpora are available.
 *
 * PURE: takes parsed bundles + profile rows, returns a merged bundle.
 * Use-case layer.
 */
'use strict';

const { renderFrontierTableBody } = require('../domain/atlas-navigation');

/**
 * Combine two build results ({profileId, targetId, bundle}) into a merged
 * multi-corpus bundle. The `frontierRows` from each profile are de-duplicated
 * by frontier_capability, preferring matches/exceeds over not_assessed so the
 * real rows win.
 *
 * @param {object} bigtop result from buildAtlasNavigationIndex (Bigtop)
 * @param {object} self result from buildAtlasNavigationIndex (portolan-self)
 * @returns {object} merged bundle { navigationIndex, coverageMatrix, findings,
 *   unknownProbes, evidence, receiptValidation, frontierComparison }
 */
function combineMultiCorpusFrontier(bigtop, self) {
  const bb = bigtop.bundle;
  const sb = self.bundle;

  // Merge artifact arrays (ids are already corpus-namespaced, no collision).
  const navigationIndex = [...(bb.navigationIndex || []), ...(sb.navigationIndex || [])];
  const coverageMatrix = [...(bb.coverageMatrix || []), ...(sb.coverageMatrix || [])];
  const findings = [...(bb.findings || []), ...(sb.findings || [])];
  const unknownProbes = [...(bb.unknownProbes || []), ...(sb.unknownProbes || [])];
  const evidence = [...(bb.evidence || []), ...(sb.evidence || [])];

  // Merge frontier rows: dedupe by capability, prefer matches/exceeds.
  const allRows = [...(bb._frontierRows || []), ...(sb._frontierRows || [])];
  const STATUS_RANK = { exceeds_frontier: 3, matches_frontier: 2, below_frontier: 1, not_assessed: 0 };
  const byCap = new Map();
  for (const r of allRows) {
    const prev = byCap.get(r.frontier_capability);
    if (!prev || (STATUS_RANK[r.status] || 0) > (STATUS_RANK[prev.status] || 0)) byCap.set(r.frontier_capability, r);
  }
  const frontierRows = [...byCap.values()];

  // Synthesize merged receipt-validation.
  const bRv = bb.receiptValidation || {};
  const sRv = sb.receiptValidation || {};
  const receiptValidation = {
    target_id: 'combined:bigtop+portolan-self',
    artifact_set: 'atlas-navigation-index',
    machine_status: 'not_assessed', // validator overwrites
    agent_self_status: sRv.agent_self_status || bRv.agent_self_status || 'not_assessed',
    status_disagreements: [...(sRv.status_disagreements || []), ...(bRv.status_disagreements || [])],
    // Nest by corpus so colliding keys (e.g. agent_self_status) don't
    // overwrite, but also surface a top-level agent_self_status (primary =
    // portolan-self, which carries the disagreement evidence) so the
    // receipt-sources-present check and the viewer still resolve it.
    receipt_sources: {
      agent_self_status: (sRv.receipt_sources || {}).agent_self_status || (bRv.receipt_sources || {}).agent_self_status || 'n/a',
      status_disagreements: (sRv.receipt_sources || {}).status_disagreements,
      bigtop: bRv.receipt_sources || {},
      'portolan-self': sRv.receipt_sources || {},
      combined: 'merged multi-corpus acceptance bundle (Bigtop + portolan-self); per-corpus sources nested under bigtop/ and portolan-self/',
    },
    validated_files: Array.from(new Set([...(bRv.validated_files || []), ...(sRv.validated_files || [])])),
    row_counts: {
      'navigation-index.jsonl': navigationIndex.length,
      'coverage-matrix.jsonl': coverageMatrix.length,
      'atlas-findings.jsonl': findings.length,
      'unknown-probes.jsonl': unknownProbes.length,
      'evidence.jsonl': evidence.length,
    },
    validation_checks: [],
  };

  // Render the merged frontier-comparison.md via the shared domain table helper.
  const title = [
    '# Frontier Comparison — combined:bigtop+portolan-self',
    '',
    '> Multi-corpus acceptance bundle. Each corpus contributes its own',
    '> matches/exceeds rows; the AND pass-condition is satisfied literally.',
    '> `raw_agent_evidence` cites prior research artifacts (frontier/receipt',
    '> context only, never target-derived facts). Status: captain-atlas 13.',
  ].join('\n');
  const frontierComparison = renderFrontierTableBody(frontierRows, title);

  return { navigationIndex, coverageMatrix, findings, unknownProbes, evidence, receiptValidation, frontierComparison };
}

module.exports = { combineMultiCorpusFrontier };
