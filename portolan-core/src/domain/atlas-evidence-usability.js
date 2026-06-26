/**
 * Domain: evidence-usability report across three independent axes
 * (captain-atlas 16 §Evidence Usability Status).
 *
 * Product rule (doc 16): artifact validation must NOT imply evidence depth. So
 * the report separates three orthogonal axes instead of collapsing them into a
 * single enum:
 *
 *   - artifact_validation : verified | failed | blocked | not_assessed
 *       Whether the JSONL/JSON artifacts parse and refs resolve (the receipt
 *       machine_status). Says nothing about source evidence quality.
 *
 *   - evidence_usability  : anchored | partial | weak | none
 *       Whether source anchors are precise and usable. Derived from anchor
 *       status across navigation-index stages. Works with BOTH the enriched
 *       in-memory navAtlas (anchor_status present) and raw bundle data
 *       (line ranges + route_quality_note), via the existing anchorStatus()
 *       classifier — which never fabricates a precise anchor.
 *
 *   - runtime_assessment  : runtime_verified | runtime_partial | runtime_not_assessed
 *       Whether build/test/runtime probes actually ran. Source visibility is
 *       NEVER treated as runtime proof.
 *
 * PURE: no DOM, no I/O. Domain layer — depends on atlas-reading (anchorStatus)
 * only. Zero external dependencies.
 */
'use strict';

const { anchorStatus } = require('./atlas-reading');

// Evidence states that count as "some visible evidence exists" (source or
// metadata or runtime-visible). claim-only / unknown / not_assessed / blocked /
// failed / cannot_verify are NOT visible evidence.
const VISIBLE_EVIDENCE_STATES = new Set(['source-visible', 'metadata-visible', 'runtime-visible']);

// Human-readable copy for each axis value, so the Run Log explains each verdict
// in plain language rather than dumping an opaque enum.
const COPY = {
  artifact_validation: {
    verified: 'All generated artifacts parse and all refs resolve. This proves the bundle is structurally sound — not that the system is evidence-rich.',
    failed: 'One or more artifacts failed to parse, or a ref does not resolve. The bundle itself is not trustworthy.',
    blocked: 'Artifact validation could not complete — a required file or check is blocked.',
    not_assessed: 'Artifact validation was not run or not recorded.',
  },
  evidence_usability: {
    anchored: 'At least one route has precise source anchors for its key stages. The atlas points at real locations in source.',
    partial: 'Some stages have precise source anchors while others are missing, ambiguous, or unresolved. Evidence is usable in part.',
    weak: 'Routes exist but key stages have no precise source anchors. Treat stage paths as pointers, not verified locations.',
    none: 'No source-visible evidence with anchors was found. The atlas has structure but no usable source pointers.',
  },
  runtime_assessment: {
    runtime_verified: 'At least one build/test/runtime probe ran and verified a stage. (Uncommon — most expeditions do not run probes.)',
    runtime_partial: 'Some stages were verified by a probe while others remain not assessed. Source visibility is still not runtime proof for the unverified stages.',
    runtime_not_assessed: 'No build/test/runtime probe ran in this expedition. Every runtime/build/test claim is not assessed — source visibility must not be read as a working system.',
  },
};

const ARTIFACT_ALLOWED = new Set(['verified', 'failed', 'blocked', 'not_assessed']);

/**
 * Normalize the artifact-validation axis value from the receipt machine_status.
 * @param {string} machineStatus
 * @returns {string} one of verified|failed|blocked|not_assessed
 */
function artifactValidationAxis(machineStatus) {
  return ARTIFACT_ALLOWED.has(machineStatus) ? machineStatus : 'not_assessed';
}

function isSourceVisible(state) {
  return VISIBLE_EVIDENCE_STATES.has(state);
}

/**
 * Classify the evidence_usability axis for a set of stage rows.
 *
 * Uses anchorStatus() which already handles BOTH the enriched in-memory case
 * (anchor_status present from export-shell snippet extraction) AND the raw
 * bundle case (line_start/line_end + route_quality_note). A 0/0 line range is
 * never 'precise'.
 *
 * @param {Array<object>} stages
 * @returns {string} anchored|partial|weak|none
 */
function classifyEvidenceUsability(stages) {
  const rows = stages || [];
  const visible = rows.filter(s => isSourceVisible(s && s.source_evidence_state));
  if (!rows.length || !visible.length) return 'none';
  const statuses = visible.map(s => anchorStatus(s));
  const precise = statuses.filter(a => a === 'precise').length;
  const nonPrecise = statuses.length - precise;
  if (precise === 0) return 'weak';
  if (nonPrecise > 0) return 'partial';
  return 'anchored';
}

/**
 * Classify the runtime_assessment axis for a set of stage rows.
 *
 * @param {Array<object>} stages
 * @returns {string} runtime_verified|runtime_partial|runtime_not_assessed
 */
function classifyRuntimeAxis(stages) {
  const runtimes = (stages || [])
    .map(s => s && s.runtime_assessment)
    .filter(Boolean);
  if (!runtimes.length) return 'runtime_not_assessed';
  const verified = runtimes.filter(r => r === 'verified').length;
  if (verified === 0) return 'runtime_not_assessed';
  if (verified < runtimes.length) return 'runtime_partial';
  return 'runtime_verified';
}

/**
 * Group navigation-index stage rows by route_id.
 * @param {Array<object>} navigationIndex
 * @returns {Map<string, Array<object>>}
 */
function stagesByRoute(navigationIndex) {
  const map = new Map();
  for (const s of navigationIndex || []) {
    if (!map.has(s.route_id)) map.set(s.route_id, []);
    map.get(s.route_id).push(s);
  }
  return map;
}

/**
 * Build the full three-axis evidence-usability report for a parsed nav-atlas.
 *
 * Returns both a GLOBAL verdict (over all stages) and a per-route breakdown so
 * the Run Log can show the summary and each route dossier can show its own
 * verdict without recomputing.
 *
 * @param {object} navAtlas
 * @returns {{
 *   artifactValidation: string,
 *   evidenceUsability: string,
 *   runtimeAssessment: string,
 *   copy: {artifactValidation:string, evidenceUsability:string, runtimeAssessment:string},
 *   perRoute: Array<{routeId:string, evidenceUsability:string, runtimeAssessment:string, stageCount:number}>,
 *   stageCounts: {total:number, visibleEvidence:number, preciseAnchors:number}
 * }}
 */
function evidenceUsabilityReport(navAtlas) {
  const ni = (navAtlas && navAtlas.navigationIndex) || [];
  const rv = (navAtlas && navAtlas.receiptValidation) || {};

  const artifactValidation = artifactValidationAxis(rv.machine_status);
  const evidenceUsability = classifyEvidenceUsability(ni);
  const runtimeAssessment = classifyRuntimeAxis(ni);

  // Per-route breakdown.
  const perRoute = [];
  for (const [routeId, stages] of stagesByRoute(ni)) {
    perRoute.push({
      routeId,
      evidenceUsability: classifyEvidenceUsability(stages),
      runtimeAssessment: classifyRuntimeAxis(stages),
      stageCount: stages.length,
    });
  }

  const visibleCount = ni.filter(s => isSourceVisible(s.source_evidence_state)).length;
  const preciseCount = ni
    .filter(s => isSourceVisible(s.source_evidence_state))
    .filter(s => anchorStatus(s) === 'precise')
    .length;

  return {
    artifactValidation,
    evidenceUsability,
    runtimeAssessment,
    copy: {
      artifactValidation: COPY.artifact_validation[artifactValidation],
      evidenceUsability: COPY.evidence_usability[evidenceUsability],
      runtimeAssessment: COPY.runtime_assessment[runtimeAssessment],
    },
    perRoute,
    stageCounts: {
      total: ni.length,
      visibleEvidence: visibleCount,
      preciseAnchors: preciseCount,
    },
  };
}

module.exports = {
  evidenceUsabilityReport,
  classifyEvidenceUsability,
  classifyRuntimeAxis,
  artifactValidationAxis,
  EVIDENCE_USABILITY_COPY: COPY,
};
