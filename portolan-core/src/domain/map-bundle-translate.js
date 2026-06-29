/**
 * Domain: translate a Go map-bundle (graph.json, summary.json, findings.jsonl,
 * coverage.json — the output of `portolan map --root`) into the scan-bundle
 * artifact shape that composeSystemMap consumes.
 *
 * Pure functions. Domain layer — may depend only on domain.
 *
 * Contract:
 *
 *   translateMapBundle({ graph, summary, findings, coverage }) -> artifacts
 *
 * The returned `artifacts` object has the same keys that buildSnapshot passes
 * to composeSystemMap: { atlasSurfaces, atlasFacts, repoProfiles, manifest,
 *   relationships, hotspots, gaps, repos }.
 *
 * Mapping:
 *   graph.nodes kind=repository -> atlasSurfaces.targets[] + repos[]
 *   graph.edges                -> relationships[]
 *   coverage weak records      -> gaps[]
 *   summary                    -> atlasSurfaces metadata (coverage counts)
 */
'use strict';

const crypto = require('crypto');

function stableId(prefix, ...parts) {
  const hash = crypto.createHash('sha256').update(parts.join('\0')).digest('hex').slice(0, 12);
  return `${prefix}-${hash}`;
}

function mapEvidenceState(state) {
  const goStates = {
    'source-visible': 'source-visible',
    'metadata-visible': 'metadata-visible',
    'runtime-visible': 'runtime-visible',
    'claim-only': 'claim-only',
    unknown: 'unknown',
    'cannot-verify': 'cannot_verify',
  };
  return goStates[state] || 'unknown';
}

/**
 * @param {object} graph  - parsed graph.json ({ nodes: [], edges: [] })
 * @param {object} [summary] - parsed summary.json (optional metadata)
 * @param {object[]} [findings] - parsed findings.jsonl records
 * @param {object} [coverage] - parsed coverage.json
 * @returns {object} scan-bundle artifact shape for composeSystemMap
 */
function translateMapBundle({ graph, summary, findings, coverage }) {
  const g = graph || { nodes: [], edges: [] };
  const nodes = g.nodes || [];
  const edges = g.edges || [];

  const repoNodes = nodes.filter((n) => n && n.kind === 'repository');
  const repoIds = new Set(repoNodes.map((n) => n.id));

  // ---- atlasSurfaces.targets ----
  const targets = repoNodes.map((n) => ({
    id: n.id,
    label: n.label || n.id,
    kind: 'repository',
    lifecycle: 'unknown',
    role: 'local-repo',
    evidence_state: mapEvidenceState(n.evidence && n.evidence.state),
    path: (n.evidence && n.evidence.source) || '',
    depends_on: edges
      .filter((e) => e && e.from === n.id && repoIds.has(e.to) && e.to !== n.id)
      .map((e) => e.to),
  }));

  // ---- repos ----
  const repos = repoNodes.map((n) => ({
    id: n.id,
    path: (n.evidence && n.evidence.source) || '',
    name: n.label || n.id,
  }));

  // ---- relationships (repo→repo edges) ----
  // Use a running index so parallel edges (same from/to/kind) are not collapsed.
  const relationships = edges
    .filter((e) => e && repoIds.has(e.from) && repoIds.has(e.to))
    .map((e, i) => ({
      id: stableId('edge', String(i), e.from, e.to, e.kind || 'observes'),
      from_repo: e.from,
      to_repo: e.to,
      type: e.kind || 'relationship',
      evidence_state: mapEvidenceState(e.evidence && e.evidence.state),
      producer: 'portolan-map',
      summary: `${e.from} ↔ ${e.to} (${e.kind || 'relationship'})`,
    }));

  // ---- gaps (weak coverage records) ----
  const gaps = [];
  if (coverage && Array.isArray(coverage.records)) {
    for (const rec of coverage.records) {
      if (!rec) continue;
      const isWeak = ['unknown', 'cannot_verify', 'not_assessed'].includes(rec.evidence_state)
        || ['unknown', 'cannot_verify', 'not_assessed', 'missing', 'blocked'].includes(rec.status);
      if (!isWeak) continue;
      gaps.push({
        id: rec.id || stableId('gap', rec.kind || 'unknown', rec.source || ''),
        repo_id: '',
        kind: rec.kind || 'unknown',
        reason: rec.reason || `Weak coverage record (${rec.evidence_state || rec.status})`,
        evidence_state: mapEvidenceState(rec.evidence_state),
      });
    }
  }

  // ---- atlasSurfaces shell ----
  const summaryGraph = (summary && summary.graph) || {};
  const atlasSurfaces = {
    schema_version: '0.1.0',
    generated_at: (summary && summary.generated_at) || new Date().toISOString(),
    target_root: (summary && summary.root) || '',
    corpus: null,
    coverage: {
      nodes: summaryGraph.nodes || nodes.length,
      edges: summaryGraph.edges || edges.length,
    },
    layers: [],
    targets,
    surfaces: [],
    gaps,
  };

  const atlasFacts = {
    schema_version: '0.1.0',
    generated_at: atlasSurfaces.generated_at,
    target_root: atlasSurfaces.target_root,
    corpus: null,
    coverage: atlasSurfaces.coverage,
    components: [],
    surface_directory: [],
    edges: edges
      .filter((e) => e && repoIds.has(e.from) && repoIds.has(e.to))
      .map((e) => ({ from: e.from, to: e.to, kind: e.kind || 'observes' })),
    gaps,
  };

  return {
    atlasSurfaces,
    atlasFacts,
    repoProfiles: { schema_version: '0.1.0', repos: [] },
    manifest: null,
    relationships,
    hotspots: [],
    gaps,
    repos,
  };
}

module.exports = { translateMapBundle };
