/**
 * Use-case: open a navigation route dossier (reading surface, captain-atlas 15).
 *
 * Resolves a route_id to its ordered stages + attached findings, unknown
 * probes, and evidence, AND composes the reading model: the route thesis, the
 * linear route diagram, and per-stage reading fields (role, anchor status,
 * plain-language anchor explanation, source excerpt when enriched). PURE. The
 * shell maps this to DOM.
 *
 * The reading fields (diagram/thesis/role/anchor_status/source_excerpt) live
 * only in this in-memory result; the persisted `13` JSONL artifacts are never
 * mutated. `source_excerpt` and `anchor_status` are attached to stage rows
 * export-time by the adapter (when --target-root is supplied); otherwise
 * anchorStatus() classifies honestly from the existing line/quality-note fields.
 *
 * Use-case layer — depends on domain, never adapters.
 */
'use strict';

const {
  buildRouteDiagram, routeThesis, stageRole, anchorStatus, anchorExplanation,
} = require('../domain/atlas-reading');

function openNavigationRoute(navAtlas, routeId) {
  const ni = (navAtlas && navAtlas.navigationIndex) || [];
  const stages = ni.filter(s => s.route_id === routeId).sort((a, b) => a.stage_index - b.stage_index);
  if (stages.length === 0) return null;
  const findingIds = new Set();
  const probeIds = new Set();
  const evidenceIds = new Set();
  for (const s of stages) {
    for (const f of s.finding_refs || []) findingIds.add(f);
    for (const p of s.unknown_probe_refs || []) probeIds.add(p);
    for (const e of s.evidence_refs || []) evidenceIds.add(e);
  }
  // `key` is the field name to match on (e.g. 'finding_id'), not a Set.
  const resolve = (ids, key, arr) => [...ids].map(id => arr.find(x => x[key] === id)).filter(Boolean);
  // route_quality is cumulatively degraded across stages when anchors are
  // missing, so the LAST stage carries the most-degraded (final) value. Show
  // that so the dossier badge matches the route_quality_note.
  const lastStage = stages[stages.length - 1];

  // Compose the reading model. The route object passed to routeThesis carries
  // just the fields thesis() needs (route_id + stages); build it minimally.
  const route = { route_id: routeId, route_family: stages[0].route_family, route_title: stages[0].route_title };
  const diagram = buildRouteDiagram(stages);
  const thesis = routeThesis(route, stages);

  // Per-stage reading enrichment. `anchorStatus`/`anchorExplanation` classify
  // honestly; `source_excerpt` is present only when the export adapter enriched
  // the in-memory row. A 0/0 line range is NEVER rendered as a precise anchor.
  const readingStages = stages.map(s => ({
    ...s,
    role: stageRole(s),
    anchorStatus: anchorStatus(s),
    anchorExplanation: anchorExplanation(s),
    source_excerpt: s.source_excerpt || null,
  }));

  return {
    routeId,
    routeFamily: stages[0].route_family,
    routeTitle: stages[0].route_title,
    routeQuality: lastStage.route_quality,
    routeQualityNote: lastStage.route_quality_note || '',
    thesis,
    diagram,
    stages: readingStages,
    findings: resolve(findingIds, 'finding_id', (navAtlas && navAtlas.findings) || []),
    probes: resolve(probeIds, 'unknown_id', (navAtlas && navAtlas.unknownProbes) || []),
    evidence: resolve(evidenceIds, 'evidence_id', (navAtlas && navAtlas.evidence) || []),
    nextRawCheck: stages[stages.length - 1].next_raw_check || '',
  };
}

module.exports = { openNavigationRoute };
