/**
 * Domain: view-model builder for the navigation atlas shell views.
 *
 * Single responsibility: turn the raw parsed nav-atlas artifact set into the
 * grouped/indexed structures the shell renders — routes grouped by family,
 * coverage/finding/probe indexes, a receipt summary, AND the reading model
 * (journeys, route diagrams, coverage regions, top probes/findings, handoff).
 * PURE: no DOM, no I/O. The shell maps this output to elements; all logic lives
 * here (and in atlas-reading.js, which this calls).
 *
 * This keeps shell.js thin (logic out of the presentation orchestrator), mirroring
 * how openBehaviourMap / drillToDossier keep graph/dossier logic out of the shell.
 *
 * Domain layer — zero dependencies.
 */
'use strict';

const {
  buildJourneys, buildRouteDiagram, coverageRegions, topProbes, topFindings, handoffQueries,
} = require('./atlas-reading');
const { evidenceUsabilityReport } = require('./atlas-evidence-usability');

/**
 * Build the shell view-model from a parsed nav-atlas.
 *
 * @param {object} navAtlas parsed artifact set:
 *   { navigationIndex:[stageRows], coverageMatrix:[...], findings:[...],
 *     unknownProbes:[...], evidence:[...], receiptValidation:{...} }
 * @returns {object} {
 *   routesByFamily: Map<family, [{route_id, route_title, route_quality, stages:[...],
 *                     findingCount, probeCount, subjects:Set, sourceStates, runtimeAssessments}]>,
 *   coverageIndex: Map<subject_id, coverageRow>,
 *   findingIndex:  Map<finding_id, findingRow>,
 *   probeIndex:    Map<unknown_id, probeRow>,
 *   evidenceIndex: Map<evidence_id, evidenceRow>,
 *   receipt: { machineStatus, agentSelfStatus, disagreements, rowCounts, failedChecks, blockedChecks },
 *   counts: { routes, coverage, findings, probes }
 * }
 */
function buildNavViewModel(navAtlas) {
  const ni = (navAtlas && navAtlas.navigationIndex) || [];
  const cm = (navAtlas && navAtlas.coverageMatrix) || [];
  const fi = (navAtlas && navAtlas.findings) || [];
  const up = (navAtlas && navAtlas.unknownProbes) || [];
  const ev = (navAtlas && navAtlas.evidence) || [];
  const rv = (navAtlas && navAtlas.receiptValidation) || {};

  // group route stages into routes
  const routesMap = new Map(); // route_id -> aggregated
  for (const s of ni) {
    if (!routesMap.has(s.route_id)) {
      routesMap.set(s.route_id, {
        route_id: s.route_id, route_family: s.route_family, route_title: s.route_title,
        route_quality: s.route_quality, route_quality_note: s.route_quality_note || '',
        stages: [], findingIds: new Set(), probeIds: new Set(),
        subjects: new Set(), sourceStates: new Set(), runtimeAssessments: new Set(),
      });
    }
    const r = routesMap.get(s.route_id);
    r.stages.push(s);
    for (const f of s.finding_refs || []) r.findingIds.add(f);
    for (const p of s.unknown_probe_refs || []) r.probeIds.add(p);
    if (s.subject_id) r.subjects.add(s.subject_id);
    if (s.source_evidence_state) r.sourceStates.add(s.source_evidence_state);
    if (s.runtime_assessment) r.runtimeAssessments.add(s.runtime_assessment);
  }
  const routesByFamily = new Map();
  for (const r of routesMap.values()) {
    r.findingCount = r.findingIds.size;
    r.probeCount = r.probeIds.size;
    r.stages.sort((a, b) => a.stage_index - b.stage_index);
    // route_quality is cumulatively degraded across stages; the LAST stage
    // carries the final (most-degraded) value — use it for the list view.
    r.route_quality = r.stages[r.stages.length - 1].route_quality;
    if (!routesByFamily.has(r.route_family)) routesByFamily.set(r.route_family, []);
    routesByFamily.get(r.route_family).push(r);
  }

  const coverageIndex = new Map(cm.map(c => [c.subject_id, c]));
  const findingIndex = new Map(fi.map(f => [f.finding_id, f]));
  const probeIndex = new Map(up.map(u => [u.unknown_id, u]));
  const evidenceIndex = new Map(ev.map(e => [e.evidence_id, e]));

  const validationChecks = rv.validation_checks || [];
  const receipt = {
    targetId: rv.target_id || '',
    machineStatus: rv.machine_status || 'not_assessed',
    agentSelfStatus: rv.agent_self_status || 'not_assessed',
    disagreements: rv.status_disagreements || [],
    hasDisagreement: (rv.status_disagreements || []).length > 0,
    receiptSources: rv.receipt_sources || {},
    rowCounts: rv.row_counts || {},
    validationChecks,
    failedChecks: validationChecks.filter(c => c.status === 'failed'),
    blockedChecks: validationChecks.filter(c => c.status === 'blocked'),
  };

  // ---- reading model (captain-atlas 15) ----------------------------------
  // All reading fields are derived here from the parsed artifact set; nothing
  // is mutated on disk. routeDiagrams is keyed by route_id so the shell can look
  // up a diagram when opening a dossier without recomputing.
  const journeys = buildJourneys(navAtlas);
  const routeDiagrams = new Map();
  for (const r of routesMap.values()) routeDiagrams.set(r.route_id, buildRouteDiagram(r.stages));
  const regions = coverageRegions(cm);
  const topProbeRows = topProbes(up, 3);
  const topFindingRows = topFindings(fi, 3);
  const handoff = handoffQueries(navAtlas);
  // Three-axis evidence usability (captain-atlas 16): artifact validation is
  // NOT evidence depth. Computed once here so the Run Log and route dossiers
  // share one verdict.
  const evidenceUsability = evidenceUsabilityReport(navAtlas);

  return {
    routesByFamily,
    coverageIndex,
    findingIndex,
    probeIndex,
    evidenceIndex,
    receipt,
    counts: { routes: routesMap.size, coverage: cm.length, findings: fi.length, probes: up.length },
    // reading model
    journeys,
    routeDiagrams,
    coverageRegions: regions,
    topProbes: topProbeRows,
    topFindings: topFindingRows,
    handoff,
    // drill-down semantics (captain-atlas 16)
    evidenceUsability,
  };
}

module.exports = { buildNavViewModel };
