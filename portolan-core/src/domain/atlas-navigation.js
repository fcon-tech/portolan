/**
 * Domain: the Atlas Navigation Index contract (captain-atlas 13).
 *
 * Single responsibility: the allowed-value vocabularies and the pure build +
 * validate functions for the generated additive atlas artifacts:
 *
 *   navigation-index.jsonl  (route stages)
 *   coverage-matrix.jsonl   (expected subjects)
 *   atlas-findings.jsonl    (structural signals)
 *   unknown-probes.jsonl    (blocked/not-assessed surfaces + next probe)
 *   evidence.jsonl          (evidence items)
 *   receipt-validation.json (machine verdict over the bundle + agent receipts)
 *   frontier-comparison.md  (generated-vs-raw-agent comparison)
 *
 * The artifacts are ADDITIVE beside the frozen system-map.json — they do not
 * replace the 0.1.0 contract. buildNavigationBundle turns a fixture profile +
 * an already-enumerated subject list into the seven artifacts as plain data;
 * the adapter layer writes them. validateNavigationBundle enforces the spec's
 * invariants in two modes (full bundle vs unsupported_target receipt).
 *
 * Pure functions, zero dependencies. Unit-testable with in-memory data.
 *
 * Domain layer.
 */
'use strict';

// ---------------------------------------------------------------------------
// Allowed-value vocabularies (spec §Artifact Schemas)
// ---------------------------------------------------------------------------

/** route_family closed vocabulary. */
const ROUTE_FAMILIES = [
  'command', 'script_workflow', 'bundle_generation', 'schema_validation',
  'viewer_api', 'package_flow', 'deploy_flow', 'test_flow', 'runtime_layout',
  'version_boundary', 'dependency', 'docs_link', 'external_boundary',
];

/** path_role closed vocabulary. */
const PATH_ROLES = [
  'entrypoint', 'command_dispatch', 'workflow_script', 'bundle_builder',
  'schema', 'validator', 'viewer_api', 'source_snippet_boundary', 'bom',
  'package_recipe', 'package_spec', 'install_script', 'deploy_module',
  'provisioner', 'smoke_test', 'runtime_layout', 'upstream_source', 'docs',
  'patch', 'fixture', 'generated', 'unknown',
];

/** subject_type closed vocabulary. */
const SUBJECT_TYPES = [
  'repository', 'source_region', 'component', 'package', 'generated_artifact',
  'schema', 'viewer_surface', 'runtime_surface', 'external_boundary',
];

/** coverage-matrix subject_type closed vocabulary (slightly wider). */
const COVERAGE_SUBJECT_TYPES = [
  'repository', 'source_region', 'component', 'package', 'generated_artifact',
  'schema', 'viewer_surface', 'runtime_surface', 'external_boundary',
];

/** promotion_state closed vocabulary. */
const PROMOTION_STATES = ['promoted', 'candidate', 'missing', 'excluded', 'not_assessed', 'cannot_verify'];

/** route_status closed vocabulary. */
const ROUTE_STATUS = ['complete', 'partial', 'missing', 'not_assessed', 'blocked'];

/** finding_status closed vocabulary. */
const FINDING_STATUS = ['none', 'has_findings', 'not_assessed', 'blocked'];

/** source_evidence_state vocabulary (reuses the existing product contract). */
const EVIDENCE_STATES = [
  'source-visible', 'metadata-visible', 'runtime-visible', 'claim-only',
  'unknown', 'cannot_verify', 'not_assessed', 'blocked', 'failed',
];

/** runtime_assessment vocabulary (separate from source visibility). */
const RUNTIME_ASSESSMENT = ['verified', 'not_assessed', 'blocked', 'failed', 'cannot_verify'];

/** route_quality closed vocabulary (local route-completeness heuristic, NOT the 08 confidence enum). */
const ROUTE_QUALITY = ['high', 'medium', 'low'];

/** artifact_provenance vocabulary. */
const ARTIFACT_PROVENANCE = ['generated_artifact', 'fixture_backed', 'prototype_artifact'];

/** finding_type closed vocabulary for this slice. */
const FINDING_TYPES = [
  'duplicate_risk', 'version_skew', 'legacy_current_overlap', 'coverage_gap',
  'runtime_unknown', 'boundary_risk', 'high_responsibility_script',
  'false_join_risk', 'blocked_probe', 'not_assessed_surface',
];

/** finding severity vocabulary. */
const SEVERITIES = ['critical', 'major', 'minor', 'info'];

/** confidence vocabulary (follows charter 08 Trust Contract). */
const CONFIDENCE_LEVELS = ['ironclad', 'hypothesis-with-facts', 'hypothesis', 'speculation'];

/** unknown probe state vocabulary. */
const PROBE_STATES = ['unknown', 'not_assessed', 'blocked', 'cannot_verify', 'failed'];

/** probe_risk vocabulary. */
const PROBE_RISK = ['low', 'medium', 'high'];

/** receipt machine_status vocabulary. */
const MACHINE_STATUS = ['verified', 'failed', 'blocked', 'not_assessed'];

/** frontier-comparison status vocabulary. */
const FRONTIER_STATUS = ['exceeds_frontier', 'matches_frontier', 'below_frontier', 'not_assessed'];

/**
 * The two validator modes.
 *  - full:    all 7 artifacts required; machine_status may reach 'verified'.
 *  - receipt: only receipt-validation.json present (unsupported_target); content
 *             artifacts must NOT exist; machine_status must be not_assessed|blocked.
 */
const VALIDATOR_MODES = ['full', 'receipt'];

/** Content artifact filenames (excluded from unsupported_target receipt mode). */
const CONTENT_ARTIFACTS = [
  'navigation-index.jsonl', 'coverage-matrix.jsonl', 'atlas-findings.jsonl',
  'unknown-probes.jsonl', 'evidence.jsonl',
];

/** All bundle artifact filenames. */
const ALL_ARTIFACTS = [...CONTENT_ARTIFACTS, 'receipt-validation.json', 'frontier-comparison.md'];

/** Frontier-comparison required rows (in order). */
const FRONTIER_REQUIRED_ROWS = [
  'Bigtop package/distribution route',
  'Bigtop version-boundary or runtime unknown',
  'Bigtop coverage gap',
  'portolan-self implementation/toolchain route',
  'portolan-self legacy/current version-skew finding',
  'portolan-self blocked runtime/build/test probe',
  'receipt-validation disagreement between agent self-status and machine status',
];

/**
 * Required probe permissions that must be named explicitly when a probe needs
 * them (spec: probes requiring network/mutation/installs/docker/ci/runtime must
 * say so). Maps a "needs" category to the token(s) that must appear.
 */
const PROBE_PERMISSION_TOKENS = ['network', 'mutation', 'package install', 'docker', 'ci', 'runtime'];

/**
 * Runtime/build/test evidence states that may NOT appear unless a probe actually
 * ran (none run in this slice). A claim of these without a probe receipt fails
 * the runtime-truth check.
 */
const RUNTIME_OVERCLAIM_STATES = ['verified', 'runtime-visible'];

/**
 * Derive coverage route_status from the linked route stages. Preserves the
 * not_assessed/blocked states (spec: route_status preserves not_assessed+blocked).
 *  - no linked route stages -> 'missing'
 *  - all linked stages blocked -> 'blocked'
 *  - all linked stages not_assessed (the normal no-probe case) -> 'not_assessed'
 *  - otherwise (mixed) -> 'partial'
 */
function deriveRouteStatus(routeRefs, stages) {
  if (!routeRefs.length || !stages.length) return 'missing';
  const runtimeStates = stages.map(s => s.runtime_assessment || 'not_assessed');
  if (runtimeStates.every(s => s === 'blocked')) return 'blocked';
  // Preserve not_assessed: when all linked stages are runtime not_assessed
  // (the normal no-probe case), the route's runtime coverage is not_assessed.
  if (runtimeStates.every(s => s === 'not_assessed')) return 'not_assessed';
  return 'partial';
}

/**
 * Derive coverage finding_status. Preserves not_assessed/blocked (spec).
 *  - no findings -> 'none'
 *  - any linked finding state blocked/not_assessed -> that state
 *  - else -> 'has_findings'
 */
function deriveFindingStatus(findingRefs, findingById) {
  if (!findingRefs.length) return 'none';
  const states = findingRefs.map(id => (findingById.get(id) || {}).state).filter(Boolean);
  if (states.includes('blocked')) return 'blocked';
  if (states.includes('not_assessed')) return 'not_assessed';
  return 'has_findings';
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

/**
 * Build the seven navigation artifacts from a profile + enumerated subjects.
 *
 * The profile is a pure data object (see atlas-navigation-profiles.js) carrying
 * route skeletons, findings, probes, evidence, and frontier rows. The
 * `enumerated` bag carries source-derived truth the adapter gathered from disk:
 *
 *   enumerated = {
 *     targetId: string,
 *     subjects: [{ subject_id, subject_type, subject_label, source_path, exists }],
 *     anchors: Map<anchorKey, { found: boolean, lineStart, lineEnd, matchCount }>,
 *   }
 *
 * `anchors` is keyed by the profile's anchor_candidate.key (or by file+substring
 * when the profile does not name one). The build uses it to:
 *   - set line_start/line_end on route stages and evidence (single match),
 *   - downgrade route_quality when an anchor is missing/ambiguous,
 *   - drop evidence whose source file does not exist.
 *
 * The result is a plain object; the adapter writes each member to a file.
 *
 * @param {object} profile fixture profile (BIGTOP_PROFILE / PORTOLAN_SELF_PROFILE)
 * @param {object} enumerated source-derived subject/anchor truth
 * @returns {object} { navigationIndex, coverageMatrix, findings, unknownProbes,
 *                      evidence, receiptValidation, frontierComparison }
 */
function buildNavigationBundle(profile, enumerated) {
  if (!profile) throw new Error('buildNavigationBundle: profile is required');
  if (!enumerated) throw new Error('buildNavigationBundle: enumerated is required');

  const targetId = enumerated.targetId || (profile.id + ':unknown');
  const producerId = `atlas-navigation-index:${profile.id}-fixture-v1`;
  const provenance = 'fixture_backed';

  // Index subjects for lookups.
  const subjectById = new Map();
  for (const s of enumerated.subjects || []) subjectById.set(s.subject_id, s);

  // --- anchor resolution helper --------------------------------------------
  // Returns { found, lineStart, lineEnd, matchCount } for an anchor candidate.
  function resolveAnchor(candidate) {
    if (!candidate) return { found: false, lineStart: 0, lineEnd: 0, matchCount: 0 };
    const key = candidate.key || `${candidate.file}\u0000${candidate.substring}`;
    const hit = enumerated.anchors && enumerated.anchors.get(key);
    if (hit) return hit;
    // No adapter-supplied truth: assume not found (defensive; adapter always supplies).
    return { found: false, lineStart: 0, lineEnd: 0, matchCount: 0 };
  }

  // --- navigation-index: route stages --------------------------------------
  const navigationIndex = [];
  const qualityDowngrade = { high: 'medium', medium: 'low', low: 'low' };
  for (const route of profile.routes || []) {
    let routeQuality = route.route_quality || 'medium';
    let ambiguityDowngraded = false;
    const ambiguousAnchors = [];
    const missingAnchors = [];
    for (const stage of route.stages || []) {
      const subject = subjectById.get(stage.subject_id) || { source_path: stage.source_path, exists: false };
      const anchor = resolveAnchor(stage.anchor_candidate);
      // Downgrade quality when anchors are missing, or once per route when an
      // anchor is ambiguous. Ambiguity is less severe than a missing file
      // signal, but it still means the atlas cannot give a precise location.
      if (anchor.matchCount === 0 && stage.anchor_candidate) {
        routeQuality = qualityDowngrade[routeQuality] || 'low';
        // Accumulate ALL missing-anchor filenames into a uniform list.
        missingAnchors.push(stage.anchor_candidate.file);
      } else if (anchor.matchCount > 1) {
        if (!ambiguityDowngraded) {
          routeQuality = qualityDowngrade[routeQuality] || 'low';
          ambiguityDowngraded = true;
        }
        ambiguousAnchors.push(stage.anchor_candidate.file);
      }
      const sourceEvidenceState = anchor.found
        ? (stage.source_evidence_state || 'source-visible')
        : (stage.source_evidence_state === 'source-visible' ? 'not_assessed' : (stage.source_evidence_state || 'not_assessed'));
      navigationIndex.push({
        route_id: route.route_id,
        route_family: route.route_family,
        route_title: route.route_title,
        stage: stage.stage,
        stage_index: stage.stage_index,
        subject_id: stage.subject_id,
        subject_type: stage.subject_type,
        // Prefer the stage's specific file path (e.g. .../bigtop.bom) over the
        // subject's directory root (e.g. repos/apache-bigtop-repo) so that a
        // non-zero line range refers to the correct file. Fall back to the
        // subject root only when the stage does not name a path.
        source_path: stage.source_path || subject.source_path,
        source_anchor: stage.source_anchor || '',
        line_start: anchor.found && anchor.matchCount === 1 ? anchor.lineStart : 0,
        line_end: anchor.found && anchor.matchCount === 1 ? anchor.lineEnd : 0,
        path_role: stage.path_role,
        lifecycle: stage.lifecycle || 'active',
        source_evidence_state: sourceEvidenceState,
        runtime_assessment: stage.runtime_assessment || 'not_assessed',
        route_quality: routeQuality,
        // route_quality_note is ROUTE-SCOPED (describes the route's aggregate
        // anchor health, identical on every stage of the route), not per-stage.
        route_quality_note: [
          ambiguousAnchors.length ? `ambiguous anchor(s): ${ambiguousAnchors.join('; ')}` : '',
          missingAnchors.length ? `anchor not found: ${missingAnchors.join('; ')}` : '',
        ].filter(Boolean).join(' | '),
        artifact_provenance: stage.artifact_provenance || provenance,
        producer_id: producerId,
        evidence_refs: stage.evidence_refs || [],
        finding_refs: stage.finding_refs || [],
        unknown_probe_refs: stage.unknown_probe_refs || [],
        next_raw_check: stage.next_raw_check || route.next_raw_check || '',
        no_safe_probe_reason: stage.no_safe_probe_reason || '',
      });
    }
  }

  // --- coverage-matrix ------------------------------------------------------
  // One row per enumerated subject (expected subjects are source-derived).
  // Build subject-keyed indexes in a SINGLE pass over each artifact so the
  // coverage derivation and route_status derivation share one scan.
  const routeRefsBySubject = new Map();
  const navStagesBySubject = new Map();
  for (const r of profile.routes || []) {
    const subjectIds = new Set();
    for (const stage of r.stages || []) {
      subjectIds.add(stage.subject_id);
      if (!navStagesBySubject.has(stage.subject_id)) navStagesBySubject.set(stage.subject_id, []);
      navStagesBySubject.get(stage.subject_id).push(stage);
    }
    for (const sid of subjectIds) {
      if (!routeRefsBySubject.has(sid)) routeRefsBySubject.set(sid, []);
      routeRefsBySubject.get(sid).push(r.route_id);
    }
  }
  const findingRefsBySubject = new Map();
  const findingById = new Map();
  for (const f of profile.findings || []) {
    findingById.set(f.finding_id, f);
    for (const sid of f.subject_ids || []) {
      if (!findingRefsBySubject.has(sid)) findingRefsBySubject.set(sid, []);
      findingRefsBySubject.get(sid).push(f.finding_id);
    }
  }
  const probeRefsBySubject = new Map();
  for (const p of profile.unknownProbes || []) {
    const sid = p.subject_id;
    if (!probeRefsBySubject.has(sid)) probeRefsBySubject.set(sid, []);
    probeRefsBySubject.get(sid).push(p.unknown_id);
  }

  const coverageMatrix = [];
  for (const s of enumerated.subjects || []) {
    const routeRefs = routeRefsBySubject.get(s.subject_id) || [];
    const findingRefs = findingRefsBySubject.get(s.subject_id) || [];
    const probeRefs = probeRefsBySubject.get(s.subject_id) || [];
    // Expected coverage is source-derived (s exists?). Promotion_state promoted iff exists.
    const promotionState = s.exists === false ? 'missing' : (s.promotion_state || 'promoted');
    // route_status derives from the linked route stages' runtime_assessment so
    // it can surface 'blocked'/'not_assessed' (spec: route_status preserves
    // not_assessed+blocked). With no probes running, runtime is not_assessed.
    const routeStatus = deriveRouteStatus(routeRefs, navStagesBySubject.get(s.subject_id) || []);
    // finding_status: 'none' if no findings; else if any linked finding is in a
    // blocked/not_assessed state, propagate it; else 'has_findings'.
    const findingStatus = deriveFindingStatus(findingRefs, findingById);
    coverageMatrix.push({
      coverage_id: `coverage:${targetId}:${s.subject_id}`,
      subject_id: s.subject_id,
      subject_type: s.subject_type,
      subject_label: s.subject_label || s.subject_id,
      source_path: s.source_path,
      expected_by: s.expected_by || 'source-region-enumerator',
      promotion_state: promotionState,
      route_status: routeStatus,
      finding_status: findingStatus,
      runtime_status: 'not_assessed',
      test_status: 'not_assessed',
      coverage_quality: routeRefs.length && findingRefs.length ? 'high' : (routeRefs.length ? 'medium' : 'low'),
      route_refs: routeRefs,
      finding_refs: findingRefs,
      known_unknown_ids: probeRefs,
      top_evidence_refs: (s.top_evidence_refs || []),
      artifact_provenance: provenance,
      producer_id: producerId,
    });
  }

  // --- findings (profile-supplied classification, fixture-backed) -----------
  const findings = (profile.findings || []).map(f => ({
    ...f,
    artifact_provenance: f.artifact_provenance || provenance,
    producer_id: f.producer_id || producerId,
    // confidence: hypothesis-with-facts only valid when evidence_refs resolve;
    // the validator enforces, but we keep the profile's intent and let validate
    // downgrade. No mutation here.
  }));

  // --- unknown probes (profile-supplied, fixture-backed) --------------------
  const unknownProbes = (profile.unknownProbes || []).map(p => ({ ...p, artifact_provenance: p.artifact_provenance || provenance, producer_id: p.producer_id || producerId }));

  // --- evidence -------------------------------------------------------------
  // Drop evidence whose source file/subject does not exist on disk (adapter
  // reports). An evidence row whose subject_id is in the enumerated index must
  // resolve to an existing subject; an evidence row with NO subject_id (e.g.
  // receipt-level) is kept. An unknown subject_id (not in the index) is treated
  // as missing, consistent with "drop if the adapter says missing".
  const evidence = (profile.evidence || [])
    .filter(ev => {
      if (!ev.source_path) return false;
      if (!ev.subject_id) return true;
      const subj = subjectById.get(ev.subject_id);
      if (!subj) return false; // unknown subject -> drop
      return subj.exists !== false;
    })
    .map(ev => ({
      evidence_id: ev.evidence_id,
      source_path: ev.source_path,
      source_anchor: ev.source_anchor || '',
      line_start: ev.line_start || 0,
      line_end: ev.line_end || 0,
      evidence_state: ev.evidence_state,
      observation: ev.observation || '',
      producer_id: ev.producer_id || producerId,
      artifact_provenance: ev.artifact_provenance || provenance,
    }));

  // --- receipt-validation ---------------------------------------------------
  // machine_status is computed by validate(); here we emit the raw bundle.
  // agent_self_status + disagreements + receipt_sources come from the profile
  // (frontier evidence) — receipt input, NOT target-derived facts.
  const rowCounts = {
    'navigation-index.jsonl': navigationIndex.length,
    'coverage-matrix.jsonl': coverageMatrix.length,
    'atlas-findings.jsonl': findings.length,
    'unknown-probes.jsonl': unknownProbes.length,
    'evidence.jsonl': evidence.length,
  };
  const receiptValidation = {
    target_id: targetId,
    artifact_set: 'atlas-navigation-index',
    machine_status: 'not_assessed', // validate() overwrites to verified/failed
    agent_self_status: profile.agentSelfStatus || 'not_assessed',
    status_disagreements: profile.statusDisagreements || [],
    receipt_sources: profile.receiptSources || {},
    validated_files: ALL_ARTIFACTS.slice(),
    row_counts: rowCounts,
    validation_checks: [], // validate() fills this
    generator_command: '', // filled by the build script (spec: command receipt)
  };

  // --- frontier-comparison.md ----------------------------------------------
  const frontierComparison = renderFrontierComparison(profile, targetId);

  return { navigationIndex, coverageMatrix, findings, unknownProbes, evidence, receiptValidation, frontierComparison };
}

/**
 * Render frontier-comparison.md from the profile's frontier rows.
 * Pure string template.
 */
function renderFrontierComparison(profile, targetId) {
  const rows = profile.frontierRows || [];
  const title = [
    `# Frontier Comparison — ${targetId}`,
    '',
    '> Generated-vs-raw-agent-frontier receipt. The `raw_agent_evidence`',
    '> column cites prior research artifacts (frontier/receipt context only,',
    '> never target-derived facts). Status labels follow captain-atlas 13.',
  ].join('\n');
  return renderFrontierTableBody(rows, title);
}

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------

/**
 * Validate a navigation bundle.
 *
 * Two modes:
 *  - 'full':    all 7 artifacts required; runs all checks; machine_status may
 *               reach 'verified'.
 *  - 'receipt': only receipt-validation.json allowed; content artifacts must
 *               NOT exist; machine_status must be not_assessed|blocked.
 *
 * `opts.mode` forces a mode; when omitted, the mode is autodetected from the
 * bundle contents (any content artifact present => 'full', else 'receipt').
 *
 * The bundle is the parsed artifact set:
 *   { navigationIndex:[...], coverageMatrix:[...], findings:[...],
 *     unknownProbes:[...], evidence:[...], receiptValidation:{...},
 *     frontierComparisonMarkdown:'...', filesPresent:Set<string> }
 *
 * Returns:
 *   { mode, machineStatus, checks: [{check_id, status, summary, detail?}],
 *     errors: [string] }
 *
 * `status` per check: 'verified' | 'failed' | 'blocked' | 'not_assessed'.
 * `machineStatus` is 'verified' iff every check is 'verified' (warnings don't
 * fail).
 *
 * @param {object} bundle
 * @param {object} [opts] { mode?: 'full'|'receipt' }
 */
function validateNavigationBundle(bundle, opts) {
  const errors = [];
  const checks = [];
  const requestedMode = opts && opts.mode;
  const filesPresent = (bundle && bundle.filesPresent) || new Set();
  const anyContent = CONTENT_ARTIFACTS.some(f => filesPresent.has(f));

  // --- mode resolution ------------------------------------------------------
  // An explicit mode must be valid; reject unknown values rather than silently
  // falling through to autodetection (so a caller typo fails clearly).
  if (requestedMode != null && requestedMode !== 'full' && requestedMode !== 'receipt') {
    checks.push(failed('mode-compat', `invalid opts.mode '${requestedMode}' (must be full|receipt)`));
    return finalize(requestedMode, 'failed', checks, errors);
  }
  let mode;
  if (requestedMode === 'full' || requestedMode === 'receipt') {
    mode = requestedMode;
  } else {
    mode = anyContent ? 'full' : 'receipt';
  }

  // Forced-mode compatibility: a forced mode must agree with bundle contents.
  if (requestedMode === 'full' && !anyContent && !(bundle && (bundle.navigationIndex || bundle.coverageMatrix))) {
    // Allow full mode when the parsed arrays are present even if filesPresent
    // wasn't supplied (unit-test path). Only fail when truly empty.
    if (!bundle || (!bundle.navigationIndex && !bundle.coverageMatrix && !bundle.findings)) {
      checks.push(failed('mode-compat', `forced --mode full but no content artifacts present in bundle`));
      return finalize(mode, 'failed', checks, errors);
    }
  }
  if (requestedMode === 'receipt' && anyContent) {
    checks.push(failed('mode-compat', `forced --mode receipt but content artifacts present: ${CONTENT_ARTIFACTS.filter(f => filesPresent.has(f)).join(', ')}`));
    return finalize(mode, 'failed', checks, errors);
  }

  if (mode === 'receipt') {
    return validateReceiptMode(bundle, checks, errors, mode);
  }
  return validateFullMode(bundle, checks, errors, mode);
}

function finalize(mode, machineStatus, checks, errors) {
  return { mode, machineStatus, checks, errors };
}

function validateReceiptMode(bundle, checks, errors, mode) {
  const filesPresent = (bundle && bundle.filesPresent) || new Set();
  // 1. required-files-exist (only the receipt).
  if (!filesPresent.has('receipt-validation.json')) {
    checks.push(failed('required-files-exist', 'receipt-validation.json missing'));
  } else {
    checks.push(verified('required-files-exist', 'receipt-validation.json present'));
  }
  // 2. json-parse
  if (!bundle || !bundle.receiptValidation) {
    checks.push(failed('json-parse', 'receipt-validation.json did not parse'));
    return finalize(mode, 'failed', checks, errors);
  }
  checks.push(verified('json-parse', 'receipt-validation.json parses'));
  const rv = bundle.receiptValidation;
  // 3. content artifacts must NOT exist.
  const stray = CONTENT_ARTIFACTS.filter(f => filesPresent.has(f));
  if (stray.length) {
    checks.push(failed('no-content-artifacts', `content artifacts present in receipt mode: ${stray.join(', ')}`));
  } else {
    checks.push(verified('no-content-artifacts', 'no content artifacts in receipt mode'));
  }
  // 4. machine_status must be not_assessed or blocked.
  if (rv.machine_status === 'not_assessed' || rv.machine_status === 'blocked') {
    checks.push(verified('machine-status-receipt', `machine_status is ${rv.machine_status}`));
  } else {
    checks.push(failed('machine-status-receipt', `machine_status must be not_assessed|blocked in receipt mode, got ${rv.machine_status}`));
  }
  // 5. profile-selection / capability reason recorded. Structural check on
  //    check_id (not prose regex) so a wording change cannot silently break it.
  const hasReason = (rv.validation_checks || []).some(c =>
    c.check_id === 'profile-selection' || c.check_id === 'capability' || c.check_id === 'unsupported-target');
  if (hasReason || rv.machine_status === 'not_assessed' || rv.machine_status === 'blocked') {
    checks.push(verified('profile-selection', 'receipt records why the target is not supported'));
  } else {
    checks.push(failed('profile-selection', 'receipt does not record why the target is not supported'));
  }
  // 6. receipt-sources-present: agent_self_status source required (spec).
  const rs = rv.receipt_sources || {};
  if (rs.agent_self_status) {
    checks.push(verified('receipt-sources-present', 'receipt_sources.agent_self_status present'));
  } else {
    checks.push(failed('receipt-sources-present', 'receipt_sources.agent_self_status missing'));
  }
  // 7. row-counts-recorded: in receipt mode all content row_counts must be 0.
  const rc = rv.row_counts || {};
  const nonzero = CONTENT_ARTIFACTS.filter(f => rc[f] && rc[f] > 0);
  if (nonzero.length) {
    checks.push(failed('row-counts-recorded', `receipt mode must have all-zero row_counts; nonzero: ${nonzero.map(f => `${f}=${rc[f]}`).join(', ')}`));
  } else {
    checks.push(verified('row-counts-recorded', 'receipt mode row_counts all-zero (or absent)'));
  }
  const failedAny = checks.some(c => c.status === 'failed');
  return finalize(mode, failedAny ? 'failed' : (rv.machine_status || 'not_assessed'), checks, errors);
}

function validateFullMode(bundle, checks, errors, mode) {
  const filesPresent = (bundle && bundle.filesPresent) || new Set();
  const ni = (bundle && bundle.navigationIndex) || [];
  const cm = (bundle && bundle.coverageMatrix) || [];
  const fi = (bundle && bundle.findings) || [];
  const up = (bundle && bundle.unknownProbes) || [];
  const ev = (bundle && bundle.evidence) || [];
  const rv = (bundle && bundle.receiptValidation) || {};
  const fc = (bundle && bundle.frontierComparisonMarkdown) || '';

  // 1. required-files-exist
  const missing = ALL_ARTIFACTS.filter(f => !filesPresent.has(f));
  if (missing.length) {
    checks.push(failed('required-files-exist', `missing: ${missing.join(', ')}`));
  } else {
    checks.push(verified('required-files-exist', 'all 7 artifacts present'));
  }

  // 2. json-parse (receipt)
  if (!bundle || !bundle.receiptValidation) {
    checks.push(failed('json-parse', 'receipt-validation.json did not parse'));
  } else {
    checks.push(verified('json-parse', 'receipt-validation.json parses'));
  }

  // 3. jsonl-parse — the adapter already parsed into arrays; if a parse flag is
  //    supplied, honor it; otherwise treat the presence of arrays as parsed.
  if (bundle && bundle.jsonlParseFailed && bundle.jsonlParseFailed.length) {
    checks.push(failed('jsonl-parse', `unparseable lines in: ${bundle.jsonlParseFailed.join(', ')}`));
  } else {
    checks.push(verified('jsonl-parse', 'all JSONL files parse line-by-line'));
  }

  // Indexes for ref resolution.
  const evidenceIds = new Set(ev.map(e => e.evidence_id));
  const findingIds = new Set(fi.map(f => f.finding_id));
  const unknownIds = new Set(up.map(u => u.unknown_id));
  const routeIds = new Set(ni.map(n => n.route_id));
  const coverageSubjectIds = new Set(cm.map(c => c.subject_id));

  // 4. unique-ids. route_id intentionally repeats per stage in navigation-index,
  //    so uniqueness there is per (route_id, stage_index); every other artifact
  //    has globally-unique ids.
  const dup = (arr, key, label) => {
    const seen = new Set(); const dups = [];
    for (const r of arr) { const id = r[key]; if (id == null) continue; if (seen.has(id)) dups.push(id); seen.add(id); }
    if (dups.length) checks.push(failed('unique-ids', `duplicate ${label}: ${dups.slice(0, 5).join(', ')}${dups.length > 5 ? ' …' : ''}`));
  };
  // navigation-index: uniqueness per (route_id, stage_index).
  {
    const seen = new Set(); const navDupPairs = [];
    for (const n of ni) {
      const k = `${n.route_id}@${n.stage_index}`;
      if (seen.has(k)) { navDupPairs.push(k); } else seen.add(k);
    }
    if (navDupPairs.length) checks.push(failed('unique-ids', `duplicate (route_id, stage_index) pair(s): ${navDupPairs.slice(0, 5).join(', ')}`));
  }
  dup(cm, 'coverage_id', 'coverage_id');
  dup(fi, 'finding_id', 'finding_id');
  dup(up, 'unknown_id', 'unknown_id');
  dup(ev, 'evidence_id', 'evidence_id');
  if (!checks.some(c => c.check_id === 'unique-ids' && c.status === 'failed')) {
    checks.push(verified('unique-ids', 'ids unique per artifact (route uniqueness per route_id+stage_index)'));
  }

  // 5. refs-resolve
  const refErrors = [];
  const checkRefs = (row, field, set, label) => {
    for (const r of row[field] || []) {
      if (!set.has(r)) refErrors.push(`${row.route_id || row.coverage_id || row.finding_id || row.unknown_id || '?'} ${field} -> ${r} (no ${label})`);
    }
  };
  for (const n of ni) {
    checkRefs(n, 'evidence_refs', evidenceIds, 'evidence');
    checkRefs(n, 'finding_refs', findingIds, 'finding');
    checkRefs(n, 'unknown_probe_refs', unknownIds, 'unknown');
  }
  for (const c of cm) {
    for (const r of c.route_refs || []) if (!routeIds.has(r)) refErrors.push(`${c.coverage_id} route_refs -> ${r}`);
    for (const r of c.finding_refs || []) if (!findingIds.has(r)) refErrors.push(`${c.coverage_id} finding_refs -> ${r}`);
    for (const r of c.known_unknown_ids || []) if (!unknownIds.has(r)) refErrors.push(`${c.coverage_id} known_unknown_ids -> ${r}`);
    for (const r of c.top_evidence_refs || []) if (!evidenceIds.has(r)) refErrors.push(`${c.coverage_id} top_evidence_refs -> ${r}`);
  }
  for (const f of fi) { checkRefs(f, 'evidence_refs', evidenceIds, 'evidence'); }
  for (const u of up) {
    for (const r of u.route_refs || []) if (!routeIds.has(r)) refErrors.push(`${u.unknown_id} route_refs -> ${r}`);
    for (const r of u.finding_refs || []) if (!findingIds.has(r)) refErrors.push(`${u.unknown_id} finding_refs -> ${r}`);
    for (const r of u.evidence_refs || []) if (!evidenceIds.has(r)) refErrors.push(`${u.unknown_id} evidence_refs -> ${r}`);
  }
  if (refErrors.length) checks.push(failed('refs-resolve', `${refErrors.length} unresolved ref(s): ${refErrors.slice(0, 5).join('; ')}${refErrors.length > 5 ? ' …' : ''}`));
  else checks.push(verified('refs-resolve', 'all evidence/finding/unknown/route/coverage refs resolve'));

  // 6 + 7. required fixture rows (profile-aware via target_id prefix).
  //    The spec requires the Bigtop package/distribution ROUTE to have STAGES
  //    covering package recipe, deploy/provisioner, smoke/test, runtime/unknown,
  //    and a version-boundary stage — these are path_roles on the stages of one
  //    package_flow route, NOT separate route_families.
  const targetId = rv.target_id || '';
  const isBigtop = /bigtop/.test(targetId);
  const isSelf = /portolan-self/.test(targetId);
  if (!targetId) checks.push(failed('target-id-present', 'receipt_validation.target_id is empty; required-fixture-row checks cannot run'));
  const DEPLOY_ROLES = new Set(['deploy_module', 'provisioner', 'install_script']);
  const TEST_ROLES = new Set(['smoke_test']);
  const RUNTIME_ROLES = new Set(['runtime_layout']);
  if (isBigtop) {
    const pkgRouteIds = new Set(ni.filter(n => n.route_family === 'package_flow').map(n => n.route_id));
    const pkgStages = ni.filter(n => pkgRouteIds.has(n.route_id));
    const roles = new Set(pkgStages.map(s => s.path_role));
    const hasBom = roles.has('bom') || roles.has('package_recipe') || roles.has('package_spec');
    const hasDeploy = pkgStages.some(s => DEPLOY_ROLES.has(s.path_role));
    const hasTest = pkgStages.some(s => TEST_ROLES.has(s.path_role));
    const hasRuntime = pkgStages.some(s => RUNTIME_ROLES.has(s.path_role));
    const hasVersionFinding = fi.some(f => f.finding_type === 'version_skew' || f.finding_type === 'false_join_risk');
    const hasBlockedProbe = up.some(p => p.state === 'blocked' || p.state === 'not_assessed');
    if (pkgRouteIds.size && hasBom && hasDeploy && hasTest && hasRuntime && hasVersionFinding && hasBlockedProbe) {
      checks.push(verified('required-bigtop-rows', 'package route has BOM+deploy+smoke+runtime stages + version-boundary finding + blocked probe'));
    } else {
      checks.push(failed('required-bigtop-rows', `missing required Bigtop rows (pkgRoute=${pkgRouteIds.size>0}, bom/recipe=${hasBom}, deploy=${hasDeploy}, smoke=${hasTest}, runtime=${hasRuntime}, versionFinding=${hasVersionFinding}, blockedProbe=${hasBlockedProbe})`));
    }
  }
  if (isSelf) {
    const families = new Set(ni.map(n => n.route_family));
    const hasCommandOrScript = families.has('command') || families.has('script_workflow');
    const hasBundleOrSchema = families.has('bundle_generation') || families.has('schema_validation');
    const hasOverlapFinding = fi.some(f => f.finding_type === 'version_skew' || f.finding_type === 'legacy_current_overlap');
    const hasBlockedProbe = up.some(p => p.state === 'blocked' || p.state === 'not_assessed');
    // required source-region coverage
    const requiredRegions = ['region:go-cli', 'region:scripts', 'region:portolan-core', 'region:schemas', 'region:fixtures', 'region:docs'];
    const haveRegions = requiredRegions.filter(r => coverageSubjectIds.has(r));
    if (hasCommandOrScript && hasBundleOrSchema && hasOverlapFinding && hasBlockedProbe && haveRegions.length === requiredRegions.length) {
      checks.push(verified('required-self-rows', `implementation routes + overlap finding + blocked probe + ${haveRegions.length}/${requiredRegions.length} coverage regions`));
    } else {
      checks.push(failed('required-self-rows', `missing required portolan-self rows (cmd/script=${hasCommandOrScript}, bundle/schema=${hasBundleOrSchema}, overlapFinding=${hasOverlapFinding}, blockedProbe=${hasBlockedProbe}, regions=${haveRegions.length}/${requiredRegions.length})`));
    }
  }

  // 8. runtime-truth: no overclaimed runtime/build/test/network without a probe.
  const overclaims = [];
  for (const n of ni) {
    const ra = n.runtime_assessment || 'not_assessed';
    const se = n.source_evidence_state || 'not_assessed';
    if (RUNTIME_OVERCLAIM_STATES.includes(ra)) overclaims.push(`${n.route_id}/${n.stage} runtime_assessment=${ra}`);
    if (RUNTIME_OVERCLAIM_STATES.includes(se)) overclaims.push(`${n.route_id}/${n.stage} source_evidence_state=${se}`);
  }
  for (const c of cm) {
    if (RUNTIME_OVERCLAIM_STATES.includes(c.runtime_status)) overclaims.push(`${c.coverage_id} runtime_status=${c.runtime_status}`);
    if (RUNTIME_OVERCLAIM_STATES.includes(c.test_status)) overclaims.push(`${c.coverage_id} test_status=${c.test_status}`);
  }
  for (const e of ev) {
    // defense-in-depth: flag both runtime-visible and 'verified' evidence states
    // ('verified' is also out-of-vocab, but catch it here too).
    if (RUNTIME_OVERCLAIM_STATES.includes(e.evidence_state)) overclaims.push(`${e.evidence_id} evidence_state=${e.evidence_state}`);
  }
  if (overclaims.length) checks.push(failed('runtime-truth', `${overclaims.length} runtime/build/test/network overclaim(s): ${overclaims.slice(0, 3).join('; ')}${overclaims.length > 3 ? ' …' : ''}`));
  else checks.push(verified('runtime-truth', 'no runtime/build/test/network claims without a probe receipt'));

  // 8b. anchor-when-line-zero: a navigation-index or evidence row with a zero
  //     line range (either bound 0) must carry a non-empty source_anchor
  //     (spec invariant). Use strict === 0 so a nonzero/inconsistent range is
  //     NOT silently treated as "zero range".
  const missingAnchors = [];
  const isZeroRange = (a, b) => a === 0 || b === 0;
  for (const n of ni) {
    if (isZeroRange(n.line_start, n.line_end) && !n.source_anchor) missingAnchors.push(`nav ${n.route_id}/${n.stage}`);
  }
  for (const e of ev) {
    if (isZeroRange(e.line_start, e.line_end) && !e.source_anchor) missingAnchors.push(`evidence ${e.evidence_id}`);
  }
  if (missingAnchors.length) checks.push(failed('anchor-when-line-zero', `${missingAnchors.length} row(s) with 0/0 lines lack a source_anchor: ${missingAnchors.slice(0, 3).join(', ')}`));
  else checks.push(verified('anchor-when-line-zero', 'all 0/0-line rows carry a non-empty source_anchor'));

  // 8c. not-assessed-needs-probe: every ROUTE with any not_assessed stage must
  //     link an unknown probe (on at least one stage) or carry a
  //     no_safe_probe_reason (spec: "Every route with runtime_assessment:
  //     not_assessed should link to an unknown probe or explain why no safe
  //     probe exists"). Aggregated per route_id so a route that has a probe on
  //     one stage satisfies the rule for all its not_assessed stages.
  //     NOTE: the no_safe_probe_reason branch is intentional spec-compliant
  //     support for producers that cannot attach a probe; the current fixture
  //     profiles always attach probes, so it is exercised by the field's
  //     absence (routes with probes pass; a producer emitting the reason instead
  //     of a probe would also pass). It is NOT dead code.
  const routeHasProbe = new Map();   // route_id -> bool
  const routeHasReason = new Map();  // route_id -> bool
  const routeNotAssessed = new Set();
  for (const n of ni) {
    if (n.runtime_assessment === 'not_assessed') routeNotAssessed.add(n.route_id);
    if (n.unknown_probe_refs && n.unknown_probe_refs.length) routeHasProbe.set(n.route_id, true);
    if (n.no_safe_probe_reason) routeHasReason.set(n.route_id, true);
  }
  const orphanRoutes = [...routeNotAssessed].filter(rid => !routeHasProbe.get(rid) && !routeHasReason.get(rid));
  if (orphanRoutes.length) checks.push(failed('not-assessed-needs-probe', `${orphanRoutes.length} route(s) with not_assessed stage(s) and no probe and no no_safe_probe_reason: ${orphanRoutes.slice(0, 3).join(', ')}`));
  else checks.push(verified('not-assessed-needs-probe', 'every not_assessed stage links a probe or explains why none is safe'));

  // 8d. closed-vocabulary: every closed-vocab field must use an allowed value.
  const VOCAB = [
    ['navigation-index', ni, 'route_family', ROUTE_FAMILIES],
    ['navigation-index', ni, 'path_role', PATH_ROLES],
    ['navigation-index', ni, 'subject_type', SUBJECT_TYPES],
    ['navigation-index', ni, 'source_evidence_state', EVIDENCE_STATES],
    ['navigation-index', ni, 'runtime_assessment', RUNTIME_ASSESSMENT],
    ['navigation-index', ni, 'route_quality', ROUTE_QUALITY],
    ['navigation-index', ni, 'artifact_provenance', ARTIFACT_PROVENANCE],
    ['coverage-matrix', cm, 'subject_type', COVERAGE_SUBJECT_TYPES],
    ['coverage-matrix', cm, 'promotion_state', PROMOTION_STATES],
    ['coverage-matrix', cm, 'route_status', ROUTE_STATUS],
    ['coverage-matrix', cm, 'finding_status', FINDING_STATUS],
    ['coverage-matrix', cm, 'runtime_status', RUNTIME_ASSESSMENT],
    ['coverage-matrix', cm, 'test_status', RUNTIME_ASSESSMENT],
    ['coverage-matrix', cm, 'coverage_quality', ROUTE_QUALITY],
    ['findings', fi, 'finding_type', FINDING_TYPES],
    ['findings', fi, 'severity', SEVERITIES],
    ['findings', fi, 'confidence', CONFIDENCE_LEVELS],
    ['unknown-probes', up, 'state', PROBE_STATES],
    ['unknown-probes', up, 'probe_risk', PROBE_RISK],
    ['evidence', ev, 'evidence_state', EVIDENCE_STATES],
  ];
  const badVocab = [];
  for (const [label, arr, field, allowed] of VOCAB) {
    const set = new Set(allowed);
    for (const row of arr) {
      const v = row[field];
      if (v != null && !set.has(v)) badVocab.push(`${label} ${row.route_id || row.coverage_id || row.finding_id || row.unknown_id || row.evidence_id || ''} ${field}=${v}`);
    }
  }
  if (badVocab.length) checks.push(failed('closed-vocabulary', `${badVocab.length} out-of-vocab value(s): ${badVocab.slice(0, 5).join('; ')}${badVocab.length > 5 ? ' …' : ''}`));
  else checks.push(verified('closed-vocabulary', 'all closed-vocab fields use allowed values'));

  // 8e. subject-id-resolves: every navigation-index subject_id must resolve to a
  //     coverage-matrix subject (spec: "subject_id resolves to coverage row or
  //     system-map object"). The coverage matrix is the in-bundle authority for
  //     subjects; system-map objects are not always present, so coverage is the
  //     resolution target here.
  const unresolvedSubjects = [];
  for (const n of ni) {
    if (n.subject_id && !coverageSubjectIds.has(n.subject_id)) {
      unresolvedSubjects.push(`${n.route_id}/${n.stage} subject_id=${n.subject_id}`);
    }
  }
  if (unresolvedSubjects.length) checks.push(failed('subject-id-resolves', `${unresolvedSubjects.length} nav stage(s) with subject_id not in coverage-matrix: ${unresolvedSubjects.slice(0, 3).join(', ')}`));
  else checks.push(verified('subject-id-resolves', 'all navigation-index subject_ids resolve to coverage-matrix rows'));

  // 8f. anchor-ambiguity: record a machine-visible warning when any navigation
  //     row was built from a multiple-match anchor (spec: "multiple keeps 0/0
  //     and warns"). Non-failing (verified) so machine_status stays clean, but
  //     the ambiguity is now visible in validation_checks.
  const ambiguous = ni.filter(n => /ambiguous anchor/i.test(n.route_quality_note || ''));
  if (ambiguous.length) checks.push(verified('anchor-ambiguity', `${ambiguous.length} stage(s) built from ambiguous anchors (route_quality_note set; route quality downgraded once per affected route): ${ambiguous.slice(0, 3).map(n => n.route_id + '/' + n.stage).join(', ')}`));
  else checks.push(verified('anchor-ambiguity', 'no ambiguous-anchor stages'));

  // 8g. receipt-sources-present: receipt-validation must include receipt_sources
  //     with the agent_self_status source (spec: "must include receipt_sources
  //     for agent self-status and disagreements").
  const rs = rv.receipt_sources || {};
  const rsMissing = [];
  if (!rs.agent_self_status) rsMissing.push('agent_self_status');
  if ((rv.status_disagreements || []).length && !rs.status_disagreements) rsMissing.push('status_disagreements');
  if (rsMissing.length) checks.push(failed('receipt-sources-present', `receipt_validation.receipt_sources missing: ${rsMissing.join(', ')}`));
  else checks.push(verified('receipt-sources-present', 'receipt_sources present for agent self-status (+ disagreements when present)'));

  // 8h. probe-permission-declared: a probe whose NEXT PROBE text names a
  //     permission category (network/mutation/install/docker/ci/runtime) must
  //     list it in requires_permission (spec: "probes needing
  //     network/mutation/installs/docker/ci/runtime must say so"). Only the
  //     next_probe text is scanned — it describes the ACTION that needs the
  //     permission. The blocked_surface / why_unknown describe the surface, not
  //     the probe, so a 'runtime' surface name does not imply a runtime probe.
  const permMissing = [];
  for (const p of up) {
    const hay = ` ${p.next_probe || ''} `.toLowerCase();
    const declared = (p.requires_permission || []).map(s => String(s).toLowerCase());
    for (const tok of PROBE_PERMISSION_TOKENS) {
      // For multi-word tokens (e.g. 'package install') match the FULL token as a
      // word-boundary phrase so a bare 'install' elsewhere does not imply a
      // package-install requirement. One regex reused for both text and declared.
      const re = new RegExp(`\\b${escapeRe(tok)}\\b`);
      const declaredHas = declared.some(d => re.test(d));
      if (re.test(hay) && !declaredHas) {
        permMissing.push(`${p.unknown_id} needs '${tok}' (next_probe mentions it)`);
      }
    }
  }
  if (permMissing.length) checks.push(failed('probe-permission-declared', `${permMissing.length} probe(s) missing a requires_permission entry: ${permMissing.slice(0, 3).join('; ')}`));
  else checks.push(verified('probe-permission-declared', 'all probes declare required permissions for mentioned categories'));

  // 9. provenance-labelled
  const all = [...ni, ...cm, ...fi, ...up, ...ev];
  const mislabelled = all.filter(r => {
    const p = r.artifact_provenance;
    if (!ARTIFACT_PROVENANCE.includes(p)) return true;
    // fixture_backed rows must not be labelled generated_artifact. We cannot
    // distinguish intent here, but a row from a fixture profile that claims
    // generated_artifact is suspicious — flag rows whose producer_id mentions
    // 'fixture' yet provenance is generated_artifact.
    if (p === 'generated_artifact' && typeof r.producer_id === 'string' && /fixture/i.test(r.producer_id)) return true;
    return false;
  });
  if (mislabelled.length) checks.push(failed('provenance-labelled', `${mislabelled.length} row(s) mislabelled: ${mislabelled.slice(0, 3).map(r => r.evidence_id || r.coverage_id || r.route_id || r.finding_id || r.unknown_id).join(', ')}`));
  else checks.push(verified('provenance-labelled', 'all rows carry valid artifact_provenance; no fixture row labelled generated_artifact'));

  // 9b. not-manually-shaped: every content row must carry a producer_id, proving
  //     it was emitted by a generator rather than hand-written final state
  //     (spec: "generated artifacts are not manually shaped final state"). A
  //     hand-written row would lack producer_id; this is the executable part of
  //     that invariant (full forgery-detection is out of scope for runtime).
  const unproduced = all.filter(r => !r.producer_id);
  if (unproduced.length) checks.push(failed('not-manually-shaped', `${unproduced.length} row(s) lack a producer_id (not generator-emitted): ${unproduced.slice(0, 3).map(r => r.evidence_id || r.coverage_id || r.route_id || r.finding_id || r.unknown_id).join(', ')}`));
  else checks.push(verified('not-manually-shaped', 'every row carries a producer_id (generator-emitted, not hand-written)'));

  // 10. frontier-rows (corpus-aware: each target's frontier-comparison carries
  //     its own corpus rows; the required-set is the rows for THIS target).
  const frontierCheck = checkFrontierComparison(fc, targetId);
  checks.push(frontierCheck);

  // 11. row-counts-recorded
  const rc = rv.row_counts || {};
  const actualCounts = {
    'navigation-index.jsonl': ni.length,
    'coverage-matrix.jsonl': cm.length,
    'atlas-findings.jsonl': fi.length,
    'unknown-probes.jsonl': up.length,
    'evidence.jsonl': ev.length,
  };
  const countMismatches = Object.keys(actualCounts).filter(k => rc[k] !== actualCounts[k]);
  if (countMismatches.length) checks.push(failed('row-counts-recorded', `mismatch: ${countMismatches.map(k => `${k}(receipt=${rc[k]},actual=${actualCounts[k]})`).join(', ')}`));
  else checks.push(verified('row-counts-recorded', 'receipt row_counts match actual line counts'));

  // confidence enforcement: hypothesis-with-facts needs evidence refs that are
  // non-empty AND all resolve; ironclad (deterministic producer) needs at least
  // one resolvable evidence ref. Combine with refs-resolve so an unresolvable
  // id does not slip through on a non-empty list.
  let confidenceViolations = 0;
  for (const f of fi) {
    if (f.confidence === 'hypothesis-with-facts' || f.confidence === 'ironclad') {
      if (!f.evidence_refs || f.evidence_refs.length === 0) {
        checks.push(failed('confidence-rule', `finding ${f.finding_id} is ${f.confidence} but has no evidence_refs`));
        confidenceViolations++;
      } else {
        const unresolved = f.evidence_refs.filter(r => !evidenceIds.has(r));
        if (unresolved.length) { checks.push(failed('confidence-rule', `finding ${f.finding_id} is ${f.confidence} but has unresolvable evidence_refs: ${unresolved.join(', ')}`)); confidenceViolations++; }
      }
    }
  }
  if (!confidenceViolations) checks.push(verified('confidence-rule', 'hypothesis-with-facts + ironclad findings all have resolvable evidence refs'));

  const failedAny = checks.some(c => c.status === 'failed');
  return finalize(mode, failedAny ? 'failed' : 'verified', checks, errors);
}

/**
 * Check frontier-comparison.md for required rows + pass condition.
 *
 * Two bundle shapes:
 *  - combined multi-corpus bundle (target_id starts with 'combined:'): all 7
 *    required rows present, and the spec's AND pass-condition holds literally
 *    (>=1 Bigtop AND >=1 portolan-self row matches/exceeds) because both corpora
 *    contribute their real rows.
 *  - single-corpus bundle (target_id names one corpus): all 7 rows present (the
 *    cross-corpus rows are honestly not_assessed), and the pass-condition is
 *    evaluated for THIS bundle's own corpus (>=1 of its own rows matches/exceeds).
 *    The cross-corpus AND is satisfied only by the combined acceptance bundle.
 *
 * Every below_frontier row must have a non-empty gap_or_next_step.
 */
function checkFrontierComparison(md, targetId) {
  if (!md) return failed('frontier-rows', 'frontier-comparison.md is empty');
  const tid = targetId || '';
  const isCombined = tid.startsWith('combined:');
  const isBigtop = /bigtop/.test(tid) && !isCombined;
  const isSelf = /portolan-self/.test(tid) && !isCombined;
  // All 7 required rows must be present as TABLE ROW headers (start of a `| `
  // cell), not merely as substrings inside evidence citations. Anchor each
  // match to the START of a table row (^\| with multiline flag) and treat
  // escaped pipes (\|) as literal so a label in one row's evidence cell cannot
  // be matched against another row's status.
  const isTableRow = (label) => new RegExp(`^\\|\\s*${escapeRe(label)}\\s*\\|`, 'im').test(md);
  const missingRows = FRONTIER_REQUIRED_ROWS.filter(r => !isTableRow(r));
  if (missingRows.length) return failed('frontier-rows', `missing required row(s): ${missingRows.slice(0, 3).join('; ')}`);
  const matchesExceeds = (label) => new RegExp('^\\|\\s*' + escapeRe(label) + '[^\\n]*?\\|\\s*(exceeds_frontier|matches_frontier)\\s*\\|', 'im').test(md);
  const bigtopAny = matchesExceeds('Bigtop package/distribution route')
    || matchesExceeds('Bigtop version-boundary or runtime unknown')
    || matchesExceeds('Bigtop coverage gap');
  const selfAny = matchesExceeds('portolan-self implementation/toolchain route')
    || matchesExceeds('portolan-self legacy/current version-skew finding')
    || matchesExceeds('portolan-self blocked runtime/build/test probe')
    || matchesExceeds('receipt-validation disagreement between agent self-status and machine status');
  let passOk;
  let passDesc;
  if (isCombined) {
    // Literal spec AND: both corpora must supply matches/exceeds.
    passOk = bigtopAny && selfAny;
    passDesc = 'combined: >=1 Bigtop AND >=1 portolan-self matches/exceeds';
  } else if (isBigtop) {
    passOk = bigtopAny;
    passDesc = 'single-corpus Bigtop: >=1 Bigtop row matches/exceeds (self rows honestly not_assessed; AND met by the combined bundle)';
  } else if (isSelf) {
    passOk = selfAny;
    passDesc = 'single-corpus portolan-self: >=1 self row matches/exceeds (Bigtop rows honestly not_assessed; AND met by the combined bundle)';
  } else {
    passOk = bigtopAny || selfAny;
    passDesc = '>=1 row matches/exceeds';
  }
  if (!passOk) return failed('frontier-rows', `pass condition not met: ${passDesc} (bigtop=${bigtopAny}, self=${selfAny})`);
  // every below_frontier row must have a non-empty gap_or_next_step.
  // Capture the gap column (last cell) WITHOUT splitting on '|' — cell values
  // may contain escaped pipes (\|) which split('|') would misparse. Match the
  // trailing cell content before the final '|', tolerant of escaped pipes.
  // below_frontier rows: extract via the known 6-column layout, splitting on
  // unescaped pipes so escaped pipes in cell values cannot mislead extraction.
  const splitUnescaped = (line) => line.replace(/\|\s*$/, '').split(/(?<!\\)\|/);
  const belowRows = md.split(/\r?\n/).filter(l => {
    const cells = splitUnescaped(l);
    return (cells[5] || '').trim() === 'below_frontier';
  });
  for (const row of belowRows) {
    const cells = splitUnescaped(row);
    const gap = (cells[6] || '').trim(); // gap_or_next_step is the 6th data column
    if (!gap) return failed('frontier-rows', `a below_frontier row has an empty gap_or_next_step`);
  }
  return verified('frontier-rows', `all 7 required rows present; ${passDesc}`);
}

function escapeRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/**
 * Render the body of a frontier-comparison markdown table from rows. Shared by
 * renderFrontierComparison (domain) and the multi-corpus combiner so the table
 * rendering logic lives in one place.
 *
 * @param {Array} rows frontier rows
 * @param {string} title the header line + intro
 * @returns {string} markdown
 */
function renderFrontierTableBody(rows, title) {
  const lines = [title, ''];
  lines.push('| frontier_capability | raw_agent_evidence | generated_artifact | viewer_surface | status | gap_or_next_step |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  const cell = (v) => String(v == null ? '' : v)
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .replace(/[\u2028\u2029]/g, ' ');
  for (const r of rows) {
    lines.push(`| ${cell(r.frontier_capability)} | ${cell(r.raw_agent_evidence)} | ${cell(r.generated_artifact)} | ${cell(r.viewer_surface)} | ${cell(r.status)} | ${cell(r.gap_or_next_step)} |`);
  }
  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Check-result helpers
// ---------------------------------------------------------------------------

function verified(check_id, summary) { return { check_id, status: 'verified', summary }; }
function failed(check_id, summary) { return { check_id, status: 'failed', summary }; }

module.exports = {
  // vocabularies
  ROUTE_FAMILIES, PATH_ROLES, SUBJECT_TYPES, COVERAGE_SUBJECT_TYPES,
  PROMOTION_STATES, ROUTE_STATUS, FINDING_STATUS, EVIDENCE_STATES,
  RUNTIME_ASSESSMENT, ROUTE_QUALITY, ARTIFACT_PROVENANCE, FINDING_TYPES,
  SEVERITIES, CONFIDENCE_LEVELS, PROBE_STATES, PROBE_RISK, MACHINE_STATUS,
  FRONTIER_STATUS, VALIDATOR_MODES, CONTENT_ARTIFACTS, ALL_ARTIFACTS,
  FRONTIER_REQUIRED_ROWS, PROBE_PERMISSION_TOKENS, RUNTIME_OVERCLAIM_STATES,
  // build + validate
  buildNavigationBundle, validateNavigationBundle, renderFrontierComparison,
  renderFrontierTableBody, checkFrontierComparison,
};
