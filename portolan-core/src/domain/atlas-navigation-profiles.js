/**
 * Domain: fixture profiles for the Atlas Navigation Index (captain-atlas 13).
 *
 * Two fixture profiles — BIGTOP and PORTOLAN_SELF — carry the route skeletons,
 * findings, unknown probes, evidence, and frontier-comparison rows that turn a
 * component/repository map into a navigable system atlas. Each profile is a
 * pure data object; the generator combines it with source-derived truth from
 * the adapter (subject existence, source paths, anchor line matches) to emit the
 * additive artifacts.
 *
 * Per the source-boundary rules (spec §Source Boundaries):
 *  - These profiles are FIXTURE RULES, not target-derived facts. Every emitted
 *    row carries artifact_provenance: fixture_backed.
 *  - For portolan-self, the profiles do NOT read living spec docs as
 *    source truth. The route/finding interpretations below are hand-authored
 *    fixture rules grounded in allowed source paths.
 *  - Prior agent evidence (synthesis/run paths) appears ONLY in frontierRows
 *    raw_agent_evidence and receiptSources — the one permitted place.
 *
 * selectProfile() implements the tightened auto-detection rules. stableTargetId()
 * produces a stable per-target id (profile + sanitized basename).
 *
 * Pure data + pure functions, zero external/runtime dependencies (uses only
 * node builtins). Domain layer.
 */
'use strict';

const path = require('path');

// ---------------------------------------------------------------------------
// Profile selection
// ---------------------------------------------------------------------------

/**
 * Select a profile for a target.
 *
 * Tightened auto-detection rules (evaluated in order; none -> unsupported_target):
 *  - Bigtop STRONG:    <target>/repos/apache-bigtop-repo exists.
 *  - Bigtop ACCEPTABLE: a target-relative bigtop.bom exists under repos/.
 *  - (Never use bare pom.xml as a Bigtop signal — too generic.)
 *  - portolan-self:    portolan-core/ AND schema/ both exist.
 *
 * An explicit `explicit` profile ('bigtop' | 'portolan-self') always overrides
 * auto-detection, but still runs a capability pre-check against `sourceAdapter`
 * (the adapter confirms expected roots exist). Missing roots -> returns
 * { id: 'unsupported_target', reason, missingRoots } so the generator emits a
 * blocked receipt (no content artifacts).
 *
 * `sourceAdapter` is optional { exists(relPath), findFile(name, underRelPath) }.
 * When absent, auto-detection falls back to false (defensive).
 *
 * @param {string} targetRoot absolute target root
 * @param {object} [sourceAdapter] { exists(rel), findFile(name, under) } | null
 * @param {string} [explicit] 'bigtop' | 'portolan-self' | undefined
 * @returns {{id:string, profile:object|null, reason:string, missingRoots?:string[]}}
 */
function selectProfile(targetRoot, sourceAdapter, explicit) {
  const exists = (rel) => !!(sourceAdapter && typeof sourceAdapter.exists === 'function' && sourceAdapter.exists(rel));
  const findFile = (name, under) => !!(sourceAdapter && typeof sourceAdapter.findFile === 'function' && sourceAdapter.findFile(name, under));

  if (explicit === 'bigtop') {
    const missing = [];
    if (!exists('repos/apache-bigtop-repo')) missing.push('repos/apache-bigtop-repo');
    if (missing.length) return { id: 'unsupported_target', profile: null, reason: 'explicit bigtop profile selected but expected Bigtop root(s) missing', missingRoots: missing };
    return { id: 'bigtop', profile: BIGTOP_PROFILE, reason: 'explicit --profile bigtop' };
  }
  if (explicit === 'portolan-self') {
    const missing = [];
    if (!exists('portolan-core')) missing.push('portolan-core');
    if (!exists('schema')) missing.push('schema');
    if (missing.length) return { id: 'unsupported_target', profile: null, reason: 'explicit portolan-self profile selected but expected roots missing', missingRoots: missing };
    return { id: 'portolan-self', profile: PORTOLAN_SELF_PROFILE, reason: 'explicit --profile portolan-self' };
  }

  // auto
  if (exists('repos/apache-bigtop-repo')) {
    return { id: 'bigtop', profile: BIGTOP_PROFILE, reason: 'auto: strong signal repos/apache-bigtop-repo' };
  }
  if (findFile('bigtop.bom', 'repos')) {
    return { id: 'bigtop', profile: BIGTOP_PROFILE, reason: 'auto: acceptable signal bigtop.bom under repos/' };
  }
  if (exists('portolan-core') && exists('schema')) {
    return { id: 'portolan-self', profile: PORTOLAN_SELF_PROFILE, reason: 'auto: portolan-core + schema' };
  }
  return { id: 'unsupported_target', profile: null, reason: 'no profile signal matched (no apache-bigtop-repo, no bigtop.bom under repos/, no portolan-core+schema)' };
}

/**
 * Stable per-target id: profile + sanitized target basename.
 * Lowercases, collapses non-[a-z0-9] to '-', trims. If a corpus manifest with
 * an `id` sits under the target (adapter supplies manifestId), prefer it.
 *
 * @param {string} profileId 'bigtop' | 'portolan-self' | 'unsupported_target'
 * @param {string} targetRoot
 * @param {string} [manifestId]
 * @returns {string}
 */
function stableTargetId(profileId, targetRoot, manifestId) {
  if (manifestId) return `${profileId}:${sanitize(manifestId)}`;
  const base = path.basename(String(targetRoot || '').replace(/\/+$/, '')) || 'target';
  return `${profileId}:${sanitize(base)}`;
}

function sanitize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 64)
    .replace(/^-+|-+$/g, '') || 'target';
}

// ===========================================================================
// BIGTOP PROFILE
// ===========================================================================
// Bigtop is a distribution + interoperability-test landscape. The canonical
// route is BOM -> package recipe -> deploy/provisioner -> smoke test ->
// runtime layout, with a version-boundary / false-join risk between same-name
// upstream repos and Bigtop package versions. Runtime/build/test remain blocked
// or not_assessed (no probes run).
//
// The package/distribution route is anchored on apache-bigtop-repo (the
// integration hub). Coverage subjects are enumerated from repos/* by the
// adapter; the profile attaches route/finding/probe refs to the bigtop-repo
// subject.

const BIGTOP_PROFILE = {
  id: 'bigtop',
  label: 'Apache Bigtop distribution landscape',

  // agent_self_status + disagreements + receipt_sources come from the frontier
  // evidence receipt (spec §Evidence Receipt). These are RECEIPT INPUT, not
  // target-derived facts.
  agentSelfStatus: 'not_assessed',
  statusDisagreements: [],
  receiptSources: {
    agent_self_status: 'portolan-lab/research/agent-frontier-2026-06/runs/codex-{low,medium,high}/apache-bigtop-full-corpus/no_portolan/manifest.json (no agent self-status disagreeing with machine validation recorded for the Bigtop clean frontier)',
    status_disagreements: 'none recorded — no machine-vs-agent disagreement in the Bigtop clean frontier lanes',
    clean_lanes: 'portolan-lab/research/agent-frontier-2026-06/runs/codex-{low,medium,high}/apache-bigtop-full-corpus/no_portolan/',
    synthesis: 'portolan-lab/research/agent-frontier-2026-06/synthesis/bigtop-clean-baseline-analysis.md; bigtop-artifact-delta-analysis.md',
  },

  // --- routes ---------------------------------------------------------------
  routes: [
    {
      route_id: 'route:bigtop:package-distribution',
      route_family: 'package_flow',
      route_title: 'Bigtop BOM → package recipe → provisioner → smoke test → runtime layout',
      route_quality: 'high',
      next_raw_check: 'Run a Bigtop package build for one component in a disposable container to confirm the recipe resolves.',
      stages: [
        {
          stage: 'bom-declaration', stage_index: 1,
          subject_id: 'repo:apache-bigtop-repo', subject_type: 'repository',
          source_path: 'repos/apache-bigtop-repo/bigtop.bom',
          source_anchor: 'Bigtop Bill of Materials declaring component versions',
          path_role: 'bom', lifecycle: 'active',
          source_evidence_state: 'source-visible', runtime_assessment: 'not_assessed',
          evidence_refs: ['ev:bigtop-bom'], finding_refs: ['finding:bigtop-version-boundary'],
          unknown_probe_refs: ['unknown:bigtop-package-build'],
          anchor_candidate: { key: 'bigtop-bom', file: 'repos/apache-bigtop-repo/bigtop.bom', substring: 'bigtop' },
          next_raw_check: 'Confirm the BOM declares the component versions used downstream.',
        },
        {
          stage: 'package-recipe', stage_index: 2,
          subject_id: 'repo:apache-bigtop-repo', subject_type: 'repository',
          source_path: 'repos/apache-bigtop-repo/bigtop-packages',
          source_anchor: 'package recipes per component/distribution',
          path_role: 'package_recipe', lifecycle: 'active',
          source_evidence_state: 'source-visible', runtime_assessment: 'not_assessed',
          evidence_refs: ['ev:bigtop-packages'], finding_refs: [],
          unknown_probe_refs: ['unknown:bigtop-package-build'],
          anchor_candidate: { key: 'bigtop-packages', file: 'repos/apache-bigtop-repo/bigtop-packages', substring: '' },
          next_raw_check: 'Inspect one component recipe to confirm it builds against the declared version.',
        },
        {
          stage: 'deploy-provisioner', stage_index: 3,
          subject_id: 'repo:apache-bigtop-repo', subject_type: 'repository',
          source_path: 'repos/apache-bigtop-repo/bigtop-deploy',
          source_anchor: 'deployment + provisioner (Puppet/Docker) modules',
          path_role: 'provisioner', lifecycle: 'active',
          source_evidence_state: 'source-visible', runtime_assessment: 'not_assessed',
          evidence_refs: ['ev:bigtop-deploy'], finding_refs: [],
          unknown_probe_refs: ['unknown:bigtop-docker-provisioner', 'unknown:bigtop-puppet-catalog'],
          anchor_candidate: { key: 'bigtop-deploy', file: 'repos/apache-bigtop-repo/bigtop-deploy', substring: '' },
          next_raw_check: 'Compile the Puppet catalog for one role in a disposable VM.',
        },
        {
          stage: 'smoke-test', stage_index: 4,
          subject_id: 'repo:apache-bigtop-repo', subject_type: 'repository',
          source_path: 'repos/apache-bigtop-repo/bigtop-tests',
          source_anchor: 'smoke / interoperability test surface',
          path_role: 'smoke_test', lifecycle: 'active',
          source_evidence_state: 'source-visible', runtime_assessment: 'not_assessed',
          evidence_refs: ['ev:bigtop-tests'], finding_refs: [],
          unknown_probe_refs: ['unknown:bigtop-smoke-tests'],
          anchor_candidate: { key: 'bigtop-tests', file: 'repos/apache-bigtop-repo/bigtop-tests', substring: '' },
          next_raw_check: 'Run the smoke-test harness for one component against a provisioned cluster.',
        },
        {
          stage: 'runtime-layout', stage_index: 5,
          subject_id: 'repo:apache-bigtop-repo', subject_type: 'repository',
          source_path: 'repos/apache-bigtop-repo/bigtop-packages',
          source_anchor: 'runtime filesystem layout produced by packages',
          path_role: 'runtime_layout', lifecycle: 'active',
          source_evidence_state: 'claim-only', runtime_assessment: 'not_assessed',
          evidence_refs: [], finding_refs: [],
          unknown_probe_refs: ['unknown:bigtop-runtime-layout'],
          next_raw_check: 'Install one built package and record the runtime filesystem layout.',
        },
        {
          stage: 'version-boundary', stage_index: 6,
          subject_id: 'repo:apache-bigtop-repo', subject_type: 'repository',
          source_path: 'repos/apache-bigtop-repo/bigtop.bom',
          source_anchor: 'version boundary between BOM-declared versions and upstream repo heads',
          path_role: 'bom', lifecycle: 'active',
          source_evidence_state: 'metadata-visible', runtime_assessment: 'not_assessed',
          evidence_refs: ['ev:bigtop-bom'], finding_refs: ['finding:bigtop-version-boundary', 'finding:bigtop-false-join'],
          unknown_probe_refs: ['unknown:bigtop-version-resolution'],
          anchor_candidate: { key: 'bigtop-bom', file: 'repos/apache-bigtop-repo/bigtop.bom', substring: 'bigtop' },
          next_raw_check: 'Cross-check each BOM component version against the matching upstream repo tag.',
        },
      ],
    },
  ],

  // --- findings -------------------------------------------------------------
  findings: [
    {
      finding_id: 'finding:bigtop-version-boundary',
      finding_type: 'version_skew', severity: 'major',
      title: 'Bigtop BOM declares component versions that may diverge from upstream repo heads',
      summary: 'The BOM pins component versions; the same-name upstream repos under repos/ are checked-out heads. Joining them without version evidence is a false-join risk.',
      subject_ids: ['repo:apache-bigtop-repo'],
      route_refs: ['route:bigtop:package-distribution'],
      state: 'not_assessed', confidence: 'hypothesis-with-facts',
      producer_family: 'agent-producer', artifact_provenance: 'fixture_backed',
      evidence_refs: ['ev:bigtop-bom'],
      next_raw_check: 'Compare each BOM version to the upstream repo checked-out ref.',
    },
    {
      finding_id: 'finding:bigtop-false-join',
      finding_type: 'false_join_risk', severity: 'major',
      title: 'Same-name upstream repos must not be joined to Bigtop package versions without evidence',
      summary: 'repos/apache-spark (upstream head) is not necessarily the source of the Bigtop spark package version. The atlas must not treat them as identical.',
      subject_ids: ['repo:apache-bigtop-repo'],
      route_refs: ['route:bigtop:package-distribution'],
      state: 'not_assessed', confidence: 'hypothesis-with-facts',
      producer_family: 'agent-producer', artifact_provenance: 'fixture_backed',
      evidence_refs: ['ev:bigtop-bom'],
      next_raw_check: 'Resolve the exact package version and compare to the upstream tag.',
    },
  ],

  // --- unknown probes (blocked/not-assessed surfaces + next safe probe) -----
  unknownProbes: [
    probe('unknown:bigtop-package-build', 'repo:apache-bigtop-repo', 'package build',
      'blocked', 'No package build was executed in this slice.',
      'Build one Bigtop component package in a disposable container.', 'medium',
      ['docker', 'package install']),
    probe('unknown:bigtop-docker-provisioner', 'repo:apache-bigtop-repo', 'Docker provisioner',
      'blocked', 'The Docker provisioner was not run.',
      'Run the bigtop-deploy Docker provisioner against a disposable image.', 'medium',
      ['docker']),
    probe('unknown:bigtop-puppet-catalog', 'repo:apache-bigtop-repo', 'Puppet catalog compilation',
      'blocked', 'No Puppet catalog was compiled.',
      'Compile the Puppet catalog for one role.', 'medium', ['runtime']),
    probe('unknown:bigtop-smoke-tests', 'repo:apache-bigtop-repo', 'smoke tests',
      'blocked', 'Smoke tests were not executed.',
      'Run the bigtop-tests smoke harness for one component.', 'medium',
      ['runtime', 'docker']),
    probe('unknown:bigtop-runtime-layout', 'repo:apache-bigtop-repo', 'runtime filesystem layout',
      'not_assessed', 'No package was installed, so the runtime layout is unverified.',
      'Install one built package and record the layout.', 'low', ['package install']),
    probe('unknown:bigtop-version-resolution', 'repo:apache-bigtop-repo', 'upstream version resolution',
      'not_assessed', 'Network/tag resolution did not run.',
      'Resolve upstream tags for each BOM component (network required).', 'medium',
      ['network']),
  ],

  // --- evidence (source-derived paths confirmed by adapter) -----------------
  evidence: [
    ev('ev:bigtop-bom', 'repos/apache-bigtop-repo/bigtop.bom', 'Bigtop Bill of Materials',
      'metadata-visible', 'The BOM declares the component versions the package recipes build against.', 'repo:apache-bigtop-repo'),
    ev('ev:bigtop-packages', 'repos/apache-bigtop-repo/bigtop-packages', 'package recipes directory',
      'source-visible', 'Per-component package recipes exist under bigtop-packages.', 'repo:apache-bigtop-repo'),
    ev('ev:bigtop-deploy', 'repos/apache-bigtop-repo/bigtop-deploy', 'deployment + provisioner modules',
      'source-visible', 'bigtop-deploy holds the Puppet/Docker provisioner modules.', 'repo:apache-bigtop-repo'),
    ev('ev:bigtop-tests', 'repos/apache-bigtop-repo/bigtop-tests', 'smoke/interop test surface',
      'source-visible', 'bigtop-tests holds the smoke and interoperability tests.', 'repo:apache-bigtop-repo'),
  ],

  // --- frontier comparison rows --------------------------------------------
  frontierRows: [
    {
      frontier_capability: 'Bigtop package/distribution route',
      raw_agent_evidence: 'clean low/med/high lanes: portolan-lab/research/agent-frontier-2026-06/runs/codex-{low,medium,high}/apache-bigtop-full-corpus/no_portolan/; synthesis bigtop-clean-baseline-analysis.md',
      generated_artifact: 'navigation-index.jsonl route:bigtop:package-distribution (6 stages: BOM→recipe→deploy→smoke→runtime→version-boundary)',
      viewer_surface: 'Routes → route:bigtop:package-distribution dossier',
      status: 'matches_frontier',
      gap_or_next_step: 'Add exact source anchors (line ranges) once a per-component recipe enumerator lands.',
    },
    {
      frontier_capability: 'Bigtop version-boundary or runtime unknown',
      raw_agent_evidence: 'synthesis bigtop-artifact-delta-analysis.md (false-join risk on same-name upstream repos)',
      generated_artifact: 'atlas-findings.jsonl finding:bigtop-version-boundary + finding:bigtop-false-join; unknown-probes.jsonl unknown:bigtop-version-resolution',
      viewer_surface: 'Findings dossier + Unknown-probe dossier',
      status: 'matches_frontier',
      gap_or_next_step: 'Network tag resolution probe is the next safe step.',
    },
    {
      frontier_capability: 'Bigtop coverage gap',
      raw_agent_evidence: 'clean baseline: repos enumerated manually by agents',
      generated_artifact: 'coverage-matrix.jsonl (one row per repos/* subject; missing rows visible)',
      viewer_surface: 'Coverage dossier per subject',
      status: 'matches_frontier',
      gap_or_next_step: 'Promote package-level subjects below repo scale (Candidate F).',
    },
    // The portolan-self rows are required by the spec but belong to a separate
    // corpus. A single-corpus Bigtop bundle carries them as not_assessed; the
    // multi-corpus acceptance bundle (build-combine) merges the real self rows
    // so the AND pass-condition is satisfiable.
    {
      frontier_capability: 'portolan-self implementation/toolchain route',
      raw_agent_evidence: 'portolan-self-boundary-v2 lanes (separate corpus)',
      generated_artifact: 'not generated for a single-corpus Bigtop target',
      viewer_surface: 'n/a for single-corpus Bigtop target',
      status: 'not_assessed',
      gap_or_next_step: 'Use the multi-corpus acceptance bundle (build-atlas-navigation-index.mjs --combine) to assess.',
    },
    {
      frontier_capability: 'portolan-self legacy/current version-skew finding',
      raw_agent_evidence: 'portolan-self-boundary-v2-frontier-analysis.md (separate corpus)',
      generated_artifact: 'not generated for a single-corpus Bigtop target',
      viewer_surface: 'n/a for single-corpus Bigtop target',
      status: 'not_assessed',
      gap_or_next_step: 'Use the multi-corpus acceptance bundle (build-atlas-navigation-index.mjs --combine) to assess.',
    },
    {
      frontier_capability: 'portolan-self blocked runtime/build/test probe',
      raw_agent_evidence: 'portolan-self-boundary-v2 lanes (separate corpus)',
      generated_artifact: 'not generated for a single-corpus Bigtop target',
      viewer_surface: 'n/a for single-corpus Bigtop target',
      status: 'not_assessed',
      gap_or_next_step: 'Use the multi-corpus acceptance bundle (build-atlas-navigation-index.mjs --combine) to assess.',
    },
    {
      frontier_capability: 'receipt-validation disagreement between agent self-status and machine status',
      raw_agent_evidence: 'portolan-self-boundary-v2-frontier-analysis.md (self corpus); no disagreement recorded in the Bigtop clean frontier',
      generated_artifact: 'receipt-validation.json status_disagreements (empty for Bigtop; populated for portolan-self)',
      viewer_surface: 'Receipt validation surface',
      status: 'not_assessed',
      gap_or_next_step: 'Disagreement evidence originates from the portolan-self run; assess in the multi-corpus bundle.',
    },
  ],
};

// ===========================================================================
// PORTOLAN-SELF PROFILE
// ===========================================================================
// portolan-self is a single-repo implementation/toolchain corpus. Routes are
// command dispatch, harness/script workflow, bundle generation, and schema
// validation. A legacy/current-overlap finding (Go CLI + portolan-core both
// handle system-map concerns) and blocked runtime/build/test probes are
// first-class. Agent self-status disagreed with machine validation in the
// boundary-v2 run — that disagreement is recorded.
//
// Source regions (allowed inventory): Go CLI/internal, harness/scripts,
// JavaScript core (portolan-core), schemas/contracts, fixtures/tests.

const PORTOLAN_SELF_PROFILE = {
  id: 'portolan-self',
  label: 'Portolan self (implementation + toolchain corpus)',

  // From the portolan-self boundary-v2 frontier run (spec §Portolan-Self Evidence):
  // all agents self-marked contaminated; machine validation found low/high clean
  // outside the copied ledger. This is the canonical disagreement the receipt
  // must surface. RECEIPT INPUT, not target-derived.
  agentSelfStatus: 'contaminated',
  statusDisagreements: [
    {
      subject: 'clean-frontier-low',
      machine_status: 'clean',
      agent_self_status: 'contaminated',
      reason: 'No forbidden target-relative refs outside copied ledger (machine validation).',
    },
    {
      subject: 'clean-frontier-high',
      machine_status: 'clean',
      agent_self_status: 'contaminated',
      reason: 'No forbidden target-relative refs outside copied ledger (machine validation).',
    },
    // Note: the clean-frontier-medium lane was machine=contaminated AND
    // agent=contaminated (an AGREEMENT, not a disagreement) — it is recorded in
    // receipt_sources but not in status_disagreements, which lists only
    // machine-vs-agent disagreements.
  ],
  receiptSources: {
    agent_self_status: 'portolan-self-boundary-v2 frontier run (all lanes self-marked contaminated)',
    status_disagreements: 'portolan-self-boundary-v2-frontier-analysis.md (machine-vs-agent)',
    clean_lanes: 'portolan-lab/research/agent-frontier-2026-06/runs/codex-{low,medium,high}/portolan-self-boundary-v2/ (prototype_artifact)',
  },

  // --- routes ---------------------------------------------------------------
  routes: [
    {
      route_id: 'route:self:command-dispatch',
      route_family: 'command',
      route_title: 'Go CLI entrypoint dispatches subcommands',
      route_quality: 'high',
      next_raw_check: 'Run `portolan --help` and one subcommand in a disposable checkout.',
      stages: [
        {
          stage: 'entrypoint', stage_index: 1,
          subject_id: 'region:go-cli', subject_type: 'source_region',
          source_path: 'cmd/portolan/main.go',
          source_anchor: 'Go CLI main entrypoint',
          path_role: 'entrypoint', lifecycle: 'active',
          source_evidence_state: 'source-visible', runtime_assessment: 'not_assessed',
          evidence_refs: ['ev:self-main'], finding_refs: [],
          unknown_probe_refs: ['unknown:self-build'],
          anchor_candidate: { key: 'self-main', file: 'cmd/portolan/main.go', substring: 'app.Run' },
          next_raw_check: 'Confirm main delegates to app.Run.',
        },
        {
          stage: 'command-dispatch', stage_index: 2,
          subject_id: 'region:go-cli', subject_type: 'source_region',
          source_path: 'internal/app/app.go',
          source_anchor: 'subcommand dispatch table',
          path_role: 'command_dispatch', lifecycle: 'active',
          source_evidence_state: 'source-visible', runtime_assessment: 'not_assessed',
          evidence_refs: ['ev:self-app-dispatch'], finding_refs: ['finding:self-legacy-current-overlap'],
          unknown_probe_refs: ['unknown:self-build'],
          anchor_candidate: { key: 'self-app-dispatch', file: 'internal/app/app.go', substring: 'app.Run' },
          next_raw_check: 'Map each subcommand to its internal package handler.',
        },
      ],
    },
    {
      route_id: 'route:self:harness-script-workflow',
      route_family: 'script_workflow',
      route_title: 'Harness/script workflow builds bundles and runs acceptance',
      route_quality: 'high',
      next_raw_check: 'Run one harness script end-to-end in a tmp checkout.',
      stages: [
        {
          stage: 'workflow-script', stage_index: 1,
          subject_id: 'region:scripts', subject_type: 'source_region',
          source_path: 'scripts/build-system-map.sh',
          source_anchor: 'system-map build wrapper',
          path_role: 'workflow_script', lifecycle: 'active',
          source_evidence_state: 'source-visible', runtime_assessment: 'not_assessed',
          evidence_refs: ['ev:self-build-system-map-sh'], finding_refs: [],
          unknown_probe_refs: ['unknown:self-tests'],
          anchor_candidate: { key: 'self-build-system-map-sh', file: 'scripts/build-system-map.sh', substring: 'build-system-map' },
          next_raw_check: 'Trace the wrapper to the JS builder it invokes.',
        },
        {
          stage: 'bundle-builder', stage_index: 2,
          subject_id: 'region:portolan-core', subject_type: 'source_region',
          source_path: 'portolan-core/scripts/portolan-map.mjs',
          source_anchor: '/portolan:map entry point',
          path_role: 'bundle_builder', lifecycle: 'active',
          source_evidence_state: 'source-visible', runtime_assessment: 'not_assessed',
          evidence_refs: ['ev:self-portolan-map'], finding_refs: [],
          unknown_probe_refs: ['unknown:self-browser-render'],
          anchor_candidate: { key: 'self-portolan-map', file: 'portolan-core/scripts/portolan-map.mjs', substring: 'portolan-map' },
          next_raw_check: 'Run /portolan:map against a fixture target.',
        },
      ],
    },
    {
      route_id: 'route:self:schema-validation',
      route_family: 'schema_validation',
      route_title: 'System-map schema and semantic validator route',
      route_quality: 'high',
      next_raw_check: 'Validate a fixture system-map against both the JSON schema and the semantic validator.',
      stages: [
        {
          stage: 'schema', stage_index: 1,
          subject_id: 'region:schemas', subject_type: 'source_region',
          source_path: 'schema/system-map.schema.json',
          source_anchor: 'frozen system-map JSON schema',
          path_role: 'schema', lifecycle: 'active',
          source_evidence_state: 'source-visible', runtime_assessment: 'not_assessed',
          evidence_refs: ['ev:self-schema'], finding_refs: [],
          unknown_probe_refs: ['unknown:self-tests'],
          anchor_candidate: { key: 'self-schema', file: 'schema/system-map.schema.json', substring: 'schema_version' },
          next_raw_check: 'Confirm the schema declares schema_version 0.1.0/0.2.0.',
        },
        {
          stage: 'validator-core', stage_index: 2,
          subject_id: 'region:portolan-core', subject_type: 'source_region',
          source_path: 'portolan-core/src/domain/atlas-validate.js',
          source_anchor: 'clean-stack semantic validator',
          path_role: 'validator', lifecycle: 'active',
          source_evidence_state: 'source-visible', runtime_assessment: 'not_assessed',
          evidence_refs: ['ev:self-core-validator'], finding_refs: [],
          unknown_probe_refs: ['unknown:self-tests'],
          anchor_candidate: { key: 'self-core-validator', file: 'portolan-core/src/domain/atlas-validate.js', substring: 'validateSystemMap' },
          next_raw_check: 'Validate a fixture system-map with the semantic validator.',
        },
      ],
    },
  ],

  // --- findings -------------------------------------------------------------
  findings: [
    {
      finding_id: 'finding:self-legacy-current-overlap',
      finding_type: 'legacy_current_overlap', severity: 'minor',
      title: 'Legacy Go CLI and clean-stack JS core overlap on system-map concerns',
      summary: 'The legacy Go CLI (internal/) and the portolan-core JS stack both handle system-map building/querying. The legacy CLI is intentionally thin, but overlap creates version-skew risk.',
      subject_ids: ['region:go-cli', 'region:portolan-core'],
      route_refs: ['route:self:command-dispatch', 'route:self:schema-validation'],
      state: 'not_assessed', confidence: 'hypothesis-with-facts',
      producer_family: 'agent-producer', artifact_provenance: 'fixture_backed',
      evidence_refs: ['ev:self-app-dispatch'],
      next_raw_check: 'Inventory which system-map behaviors live in each stack.',
    },
  ],

  // --- unknown probes -------------------------------------------------------
  unknownProbes: [
    probe('unknown:self-build', 'region:go-cli', 'Go build',
      'blocked', 'No `go build` was executed in this slice.',
      'Run `go build ./...` in a disposable checkout.', 'low', ['runtime']),
    probe('unknown:self-tests', 'region:scripts', 'test suites (go + node --test)',
      'blocked', 'No test suites were executed in this slice.',
      'Run `go test ./...`, `npm test` in portolan-core.', 'low', ['runtime']),
    probe('unknown:self-browser-render', 'region:portolan-core', 'browser rendering of atlas.html',
      'not_assessed', 'No browser smoke was run.',
      'Open a generated atlas.html headlessly and assert the overview renders.', 'low', ['runtime']),
    probe('unknown:self-ci', 'region:scripts', 'CI health',
      'not_assessed', 'CI was not inspected.',
      'Inspect the CI workflow for the self target.', 'low', ['ci']),
    probe('unknown:self-network-install', 'region:scripts', 'network install path',
      'not_assessed', 'Network install was not exercised.',
      'Exercise the agent autonomous install path with network access.', 'medium', ['network', 'package install']),
  ],

  // --- evidence -------------------------------------------------------------
  evidence: [
    ev('ev:self-main', 'cmd/portolan/main.go', 'Go CLI main entrypoint',
      'source-visible', 'main.go is the thin Go CLI entrypoint delegating to app.Run.', 'region:go-cli'),
    ev('ev:self-app-dispatch', 'internal/app/app.go', 'Go CLI subcommand dispatch',
      'source-visible', 'app.go dispatches subcommands to internal packages (thin dispatcher).', 'region:go-cli'),
    ev('ev:self-build-system-map-sh', 'scripts/build-system-map.sh', 'system-map build wrapper script',
      'source-visible', 'Wraps the JS system-map builder.', 'region:scripts'),
    ev('ev:self-portolan-map', 'portolan-core/scripts/portolan-map.mjs', '/portolan:map entry point',
      'source-visible', 'The /portolan:map entry script: loads intake, builds snapshot, exports atlas.', 'region:portolan-core'),
    ev('ev:self-schema', 'schema/system-map.schema.json', 'frozen system-map JSON schema',
      'source-visible', 'Declares the frozen 0.1.0/0.2.0 system-map schema.', 'region:schemas'),
    ev('ev:self-core-validator', 'portolan-core/src/domain/atlas-validate.js', 'clean-stack semantic validator',
      'source-visible', 'Pure validateSystemMap() enforcing semantic invariants.', 'region:portolan-core'),
  ],

  // --- frontier comparison rows --------------------------------------------
  frontierRows: [
    // The Bigtop rows are required by the spec but belong to a different corpus.
    // A portolan-self bundle cannot assess them; recorded as not_assessed so the
    // 7-row contract is satisfied on every bundle.
    {
      frontier_capability: 'Bigtop package/distribution route',
      raw_agent_evidence: 'apache-bigtop-full-corpus clean lanes (separate corpus)',
      generated_artifact: 'not generated for a portolan-self target (Bigtop corpus)',
      viewer_surface: 'n/a for portolan-self target',
      status: 'not_assessed',
      gap_or_next_step: 'Run the generator against a Bigtop target to assess this row.',
    },
    {
      frontier_capability: 'Bigtop version-boundary or runtime unknown',
      raw_agent_evidence: 'bigtop-artifact-delta-analysis.md (separate corpus)',
      generated_artifact: 'not generated for a portolan-self target (Bigtop corpus)',
      viewer_surface: 'n/a for portolan-self target',
      status: 'not_assessed',
      gap_or_next_step: 'Run the generator against a Bigtop target to assess this row.',
    },
    {
      frontier_capability: 'Bigtop coverage gap',
      raw_agent_evidence: 'apache-bigtop-full-corpus clean baseline (separate corpus)',
      generated_artifact: 'not generated for a portolan-self target (Bigtop corpus)',
      viewer_surface: 'n/a for portolan-self target',
      status: 'not_assessed',
      gap_or_next_step: 'Run the generator against a Bigtop target to assess this row.',
    },
    {
      frontier_capability: 'portolan-self implementation/toolchain route',
      raw_agent_evidence: 'portolan-self-boundary-v2 clean low/medium/high lanes (prototype_artifact); portolan-self-boundary-v2-frontier-analysis.md',
      generated_artifact: 'navigation-index.jsonl: command-dispatch, harness-script-workflow, schema-validation, viewer-source-snippet routes',
      viewer_surface: 'Routes list grouped by family + per-route dossier',
      status: 'matches_frontier',
      gap_or_next_step: 'Add below-region module zoom (Candidate F) for the viewer and core internals.',
    },
    {
      frontier_capability: 'portolan-self legacy/current version-skew finding',
      raw_agent_evidence: 'portolan-self-boundary-v2-frontier-analysis.md (legacy/current overlap)',
      generated_artifact: 'atlas-findings.jsonl finding:self-legacy-current-overlap',
      viewer_surface: 'Findings dossier',
      status: 'matches_frontier',
      gap_or_next_step: 'Run the diff probe (unknown:self-tests) to confirm divergence.',
    },
    {
      frontier_capability: 'portolan-self blocked runtime/build/test probe',
      raw_agent_evidence: 'portolan-self-boundary-v2 (all lanes self-marked contaminated; runtime probes not run)',
      generated_artifact: 'unknown-probes.jsonl unknown:self-build/self-tests/self-browser-render (all blocked/not_assessed)',
      viewer_surface: 'Unknown-probe dossier',
      status: 'matches_frontier',
      gap_or_next_step: 'Run the blocked build/test probes in a disposable checkout.',
    },
    {
      frontier_capability: 'receipt-validation disagreement between agent self-status and machine status',
      raw_agent_evidence: 'portolan-self-boundary-v2-frontier-analysis.md (agent self-status contaminated; machine found clean low/high)',
      generated_artifact: 'receipt-validation.json status_disagreements (3 rows) + receipt_sources',
      viewer_surface: 'Receipt validation surface',
      status: 'exceeds_frontier',
      gap_or_next_step: 'None — agent self-status is recorded as evidence, not authority.',
    },
  ],
};

// ---------------------------------------------------------------------------
// profile row helpers
// ---------------------------------------------------------------------------

function probe(unknown_id, subject_id, blocked_surface, state, why_unknown, next_probe, probe_risk, requires_permission) {
  return { unknown_id, subject_id, blocked_surface, state, why_unknown, next_probe, probe_risk, requires_permission,
    route_refs: [], finding_refs: [], evidence_refs: [] };
}

function ev(evidence_id, source_path, source_anchor, evidence_state, observation, subject_id) {
  return { evidence_id, source_path, source_anchor, line_start: 0, line_end: 0, evidence_state, observation, subject_id };
}

module.exports = {
  selectProfile, stableTargetId,
  BIGTOP_PROFILE, PORTOLAN_SELF_PROFILE,
};
