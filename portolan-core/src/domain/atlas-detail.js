/**
 * Domain: bounded reading models for atlas drill-down detail panels
 * (captain-atlas 16 §Drill-Down Contract).
 *
 * Single responsibility: turn the parsed atlas + nav-atlas into the bounded
 * detail objects the shell renders when the admiral clicks a relationship edge,
 * a route stage, an evidence chip, or a component node. Each detail answers a
 * DECISION QUESTION: what this thing is, why it matters, what evidence supports
 * it, what is unknown, and the next useful action.
 *
 * This module deliberately returns `null` when a detail cannot be resolved, so
 * the shell can render a disabled-with-reason / not_assessed state instead of
 * falling through to a generic repository/component dossier (doc 16 hard fail).
 *
 * PURE: no DOM, no I/O. Domain layer — depends only on atlas-reading. Zero
 * external dependencies.
 */
'use strict';

const {
  stageLabel, stageRole, anchorStatus, anchorExplanation,
} = require('./atlas-reading');

// ---------------------------------------------------------------------------
// Reverse references — doc 16: "derive reverse refs from navigation-index rows
// where probe/finding/evidence rows lack direct refs". A probe row may carry no
// route_refs; this still tells the admiral which journey made it matter.
// ---------------------------------------------------------------------------

/**
 * Build a reverse-reference index: for any nav-atlas id (route_id, finding_id,
 * unknown_id, evidence_id), which routes/stages/findings/probes mention it.
 *
 * Scans navigation-index stage rows (evidence_refs / finding_refs /
 * unknown_probe_refs / route_id + subject_id), findings (subject_ids /
 * route_refs / evidence_refs), and unknown probes (route_refs / finding_refs /
 * evidence_refs).
 *
 * @param {object} navAtlas
 * @returns {Map<string, {routes:Set<string>, stages:Array, findings:Set<string>, probes:Set<string>}>}
 */
function deriveReverseRefs(navAtlas) {
  const ni = (navAtlas && navAtlas.navigationIndex) || [];
  const fi = (navAtlas && navAtlas.findings) || [];
  const up = (navAtlas && navAtlas.unknownProbes) || [];
  const ev = (navAtlas && navAtlas.evidence) || [];

  const idx = new Map();
  const ensure = (id) => {
    if (!idx.has(id)) idx.set(id, { routes: new Set(), stages: [], findings: new Set(), probes: new Set() });
    return idx.get(id);
  };
  const link = (id, k, v) => { ensure(id)[k].add(v); };

  // Stages carry the forward refs; reverse them into each referenced id, and
  // record the stage (route + stage_index) under the route_id and subject_id.
  for (const s of ni) {
    const routeKey = s.route_id;
    ensure(routeKey).routes.add(routeKey);
    ensure(routeKey).stages.push(s);
    if (s.subject_id) link(s.subject_id, 'routes', routeKey);
    for (const f of s.finding_refs || []) { link(f, 'routes', routeKey); ensure(f).stages.push(s); }
    for (const p of s.unknown_probe_refs || []) { link(p, 'routes', routeKey); ensure(p).stages.push(s); }
    for (const e of s.evidence_refs || []) { link(e, 'routes', routeKey); ensure(e).stages.push(s); }
  }
  // Findings reference routes + subjects + evidence.
  for (const f of fi) {
    for (const r of f.route_refs || []) link(f.finding_id, 'routes', r);
    for (const e of f.evidence_refs || []) link(e, 'findings', f.finding_id);
    for (const sub of f.subject_ids || []) link(sub, 'findings', f.finding_id);
  }
  // Unknown probes reference routes + findings + evidence.
  for (const p of up) {
    for (const r of p.route_refs || []) link(p.unknown_id, 'routes', r);
    for (const f of p.finding_refs || []) link(f, 'probes', p.unknown_id);
    for (const e of p.evidence_refs || []) link(e, 'probes', p.unknown_id);
    if (p.subject_id) link(p.subject_id, 'probes', p.unknown_id);
  }
  // Evidence rows are self-referencing only via their evidence_id (already
  // indexed above); but ensure every evidence id has an entry so callers can
  // ask without a separate membership test.
  for (const e of ev) ensure(e.evidence_id);

  return idx;
}

// ---------------------------------------------------------------------------
// Relationship detail (doc 16 §Relationship)
// ---------------------------------------------------------------------------

/**
 * Resolve a system-map relationship into a bounded detail that answers:
 * source / target / type / direction / evidence state / what it proves / what
 * it does NOT prove / route + hazard + probe context.
 *
 * @param {object} atlas the system-map
 * @param {object} navAtlas the nav-atlas (for reverse route/hazard/probe context)
 * @param {string} relId
 * @returns {object|null} detail, or null when the relationship is not found
 */
function relationshipDetail(atlas, navAtlas, relId) {
  const rels = (atlas && atlas.objects && atlas.objects.relationships) || [];
  const rel = rels.find(r => r.id === relId);
  if (!rel) return null;

  const comps = (atlas && atlas.objects && atlas.objects.components) || [];
  const from = comps.find(c => c.id === rel.from_id);
  const to = comps.find(c => c.id === rel.to_id);
  const evidence = rel.evidence || {};
  const evidenceState = evidence.state || 'not_assessed';

  // Derive route context: any nav-index stage whose subject matches from/to, or
  // any route touching the involved components. Use reverse refs when present.
  const reverse = deriveReverseRefs(navAtlas);
  const involvedSubjects = new Set([rel.from_id, rel.to_id].filter(Boolean));
  const routeIds = new Set();
  const stageRows = [];
  for (const sub of involvedSubjects) {
    const r = reverse.get(sub);
    if (r) {
      for (const rid of r.routes) routeIds.add(rid);
      for (const st of r.stages) stageRows.push(st);
    }
  }
  // Hazards + probes attached to those route stages.
  const hazardIds = new Set();
  const probeIds = new Set();
  for (const s of stageRows) {
    for (const f of s.finding_refs || []) hazardIds.add(f);
    for (const p of s.unknown_probe_refs || []) probeIds.add(p);
  }

  return {
    relationshipId: rel.id,
    relationshipType: rel.relationship_type,
    direction: rel.direction || 'directed',
    from: from ? { id: from.id, label: from.display_name || from.id, route: from.route } : { id: rel.from_id, label: rel.from_id },
    to: to ? { id: to.id, label: to.display_name || to.id, route: to.route } : { id: rel.to_id, label: rel.to_id },
    evidenceState,
    producerFamily: rel.created_by_producer_family || (evidence && evidence.producer) || '',
    whyPresent: rel.why_present || '',
    summary: rel.summary || '',
    routeIds: [...routeIds],
    hazardIds: [...hazardIds],
    probeIds: [...probeIds],
    whatItProves: relationshipProves(rel, evidenceState),
    whatItDoesNotProve: relationshipDoesNotProve(rel, evidenceState),
  };
}

function relationshipProves(rel, evidenceState) {
  const type = rel.relationship_type || 'relationship';
  if (evidenceState === 'runtime-visible') {
    return `A ${type} relationship observed at runtime (the strongest evidence class).`;
  }
  if (evidenceState === 'source-visible') {
    return `A ${type} relationship visible in source: the dependency is declared in code.`;
  }
  if (evidenceState === 'metadata-visible') {
    return `A ${type} relationship visible in manifest/metadata: the dependency is declared, not exercised.`;
  }
  if (evidenceState === 'claim-only') {
    return `A ${type} relationship asserted as a claim only — no source or metadata was seen.`;
  }
  return `A ${type} relationship is recorded, but its evidence state (${evidenceState}) is not verified.`;
}

function relationshipDoesNotProve(rel, evidenceState) {
  const parts = [];
  parts.push('It does not prove the dependency is exercised at build, test, or runtime.');
  if (evidenceState !== 'runtime-visible') {
    parts.push('Source/metadata visibility is not runtime proof — the relationship may be declared but unused or broken downstream.');
  }
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Stage detail (doc 16 §Route Stage)
// ---------------------------------------------------------------------------

/**
 * Resolve a single navigation-index stage into a focused detail that answers:
 * role / subject / source path + anchor + line range / excerpt OR explanation /
 * evidence state / runtime status / attached hazards + probes / proves / does
 * not prove.
 *
 * @param {object} navAtlas
 * @param {string} routeId
 * @param {number} stageIndex
 * @returns {object|null}
 */
function stageDetail(navAtlas, routeId, stageIndex) {
  const ni = (navAtlas && navAtlas.navigationIndex) || [];
  const idx = Number(stageIndex);
  const stage = ni.find(s => s.route_id === routeId && Number(s.stage_index) === idx);
  if (!stage) return null;

  const anchor = anchorStatus(stage);
  const explanation = anchorExplanation(stage);
  const runtime = stage.runtime_assessment || 'not_assessed';

  return {
    routeId,
    stageIndex: idx,
    label: stageLabel(stage),
    role: stageRole(stage),
    subjectId: stage.subject_id || '',
    sourcePath: stage.source_path || '',
    sourceAnchor: stage.source_anchor || '',
    lineStart: Number(stage.line_start) || 0,
    lineEnd: Number(stage.line_end) || 0,
    anchorStatus: anchor,
    anchorExplanation: explanation,
    sourceExcerpt: stage.source_excerpt || null,
    sourceEvidenceState: stage.source_evidence_state || 'not_assessed',
    runtimeAssessment: runtime,
    hazardRefs: stage.finding_refs || [],
    probeRefs: stage.unknown_probe_refs || [],
    evidenceRefs: stage.evidence_refs || [],
    nextRawCheck: stage.next_raw_check || '',
    whatItProves: stageProves(stage, anchor),
    whatItDoesNotProve: stageDoesNotProve(stage, runtime),
  };
}

function stageProves(stage, anchor) {
  const state = stage.source_evidence_state || 'not_assessed';
  if (anchor === 'precise') {
    return `The stage is source-visible at a precise location: Portolan read the code at this point.`;
  }
  if (state === 'metadata-visible') {
    return `The stage is metadata-visible: the path exists in manifest/config, but no precise source line was pinned.`;
  }
  return `The stage is recorded with evidence state "${state}".`;
}

function stageDoesNotProve(stage, runtime) {
  const parts = [];
  parts.push('Source visibility does not prove the code builds, provisions, or runs.');
  if (runtime !== 'verified') {
    parts.push(`Runtime/build/test is ${runtime} — do not read this stage as a verified runtime behavior.`);
  }
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Evidence detail (doc 16 §Evidence Anchor)
// ---------------------------------------------------------------------------

/**
 * Resolve an evidence row into a bounded detail that answers: local path /
 * anchor type / line range / excerpt OR missing explanation / evidence state /
 * anchor quality / what it proves / what it does not prove / linked
 * route/stage/finding/probe (reverse-derived).
 *
 * Source-visible evidence NEVER implies runtime/build/test verification.
 *
 * @param {object} navAtlas
 * @param {string} evidenceId
 * @returns {object|null}
 */
function evidenceDetail(navAtlas, evidenceId) {
  const ev = (navAtlas && navAtlas.evidence) || [];
  const row = ev.find(e => e.evidence_id === evidenceId);
  if (!row) return null;

  const reverse = deriveReverseRefs(navAtlas);
  const ctx = reverse.get(evidenceId) || { routes: new Set(), stages: [], findings: new Set(), probes: new Set() };
  const anchor = anchorStatus(row);
  const state = row.evidence_state || 'not_assessed';

  return {
    evidenceId,
    sourcePath: row.source_path || '',
    sourceAnchor: row.source_anchor || '',
    lineStart: Number(row.line_start) || 0,
    lineEnd: Number(row.line_end) || 0,
    sourceExcerpt: row.source_excerpt || null,
    anchorStatus: anchor,
    anchorExplanation: anchorExplanation(row),
    evidenceState: state,
    observation: row.observation || '',
    producerId: row.producer_id || '',
    artifactProvenance: row.artifact_provenance || '',
    routeIds: [...ctx.routes],
    stageRefs: ctx.stages.map(s => ({ routeId: s.route_id, stageIndex: s.stage_index, label: stageLabel(s) })),
    findingIds: [...ctx.findings],
    probeIds: [...ctx.probes],
    whatItProves: evidenceProves(state, anchor),
    whatItDoesNotProve: evidenceDoesNotProve(state),
  };
}

function evidenceProves(state, anchor) {
  if (anchor === 'precise') {
    return `Points at a precise location in source (evidence state: ${state}). The referenced code exists at this point.`;
  }
  if (state === 'source-visible') {
    return `Source-visible but the anchor is ${anchor}: the file/area is referenced, not pinned to a single verified line.`;
  }
  if (state === 'metadata-visible') {
    return `Metadata-visible: the evidence is declared in manifest/config, not read from source.`;
  }
  return `Evidence state "${state}".`;
}

function evidenceDoesNotProve(state) {
  return 'Source-visible or metadata-visible evidence does NOT imply runtime/build/test verification. ' +
    'It proves the artifact exists in source or manifest, not that it behaves as claimed when executed.';
}

// ---------------------------------------------------------------------------
// Component dossier (nav-enriched) — doc 16 §Repository Or Component
// ---------------------------------------------------------------------------

/**
 * Augment a system-map component with nav-atlas context so its dossier answers
 * the doc-16 contract: what it is / why present / route participation / coverage
 * / hazards / probes / evidence / C4 placement or honest absence / next action.
 *
 * @param {object} atlas
 * @param {object} navAtlas
 * @param {string} componentId
 * @returns {object|null}
 */
function componentDossierFromNav(atlas, navAtlas, componentId) {
  const comps = (atlas && atlas.objects && atlas.objects.components) || [];
  const comp = comps.find(c => c.id === componentId);
  if (!comp) return null;

  const cm = (navAtlas && navAtlas.coverageMatrix) || [];
  const reverse = deriveReverseRefs(navAtlas);
  const ctx = reverse.get(componentId) || { routes: new Set(), stages: [], findings: new Set(), probes: new Set() };

  // Coverage row: match by subject_id (component ids appear as subjects).
  const coverage = cm.find(c => c.subject_id === componentId) || null;
  // Evidence anchors attached to the component's stages.
  const evidenceIds = new Set();
  for (const s of ctx.stages) for (const e of s.evidence_refs || []) evidenceIds.add(e);
  const ev = (navAtlas && navAtlas.evidence) || [];
  const evidence = [...evidenceIds].map(id => ev.find(e => e.evidence_id === id)).filter(Boolean);

  const c4Placement = c4PlacementForComponent(atlas, componentId);

  return {
    componentId,
    component: comp,
    routeIds: [...ctx.routes],
    coverage,
    hazards: [...ctx.findings],
    probes: [...ctx.probes],
    evidence,
    c4Placement,
    nextAction: componentNextAction(comp, coverage, [...ctx.probes]),
  };
}

function c4PlacementForComponent(atlas, componentId) {
  const c4 = (atlas && atlas.c4) || {};
  const boxes = c4.component_boxes || [];
  // c4_box references its subject via `object_id` (schema/system-map.schema.json),
  // not `component_id`. Match on object_id, then on the conventional id forms.
  const box = boxes.find(b => b && (
    b.object_id === componentId ||
    b.id === 'c4-component:' + componentId ||
    b.id === componentId
  ));
  if (box) return { level: 'component', present: true };
  return { level: 'component', present: false, note: 'No explicit C4 Component box — placement is inferred from family, not runtime/deploy evidence.' };
}

function componentNextAction(comp, coverage, probeIds) {
  if (probeIds && probeIds.length) {
    return 'Open the attached next-check probe to reduce uncertainty about this component.';
  }
  if (coverage && (coverage.route_status === 'missing' || coverage.route_status === 'not_assessed')) {
    return 'This component has no mapped route. Map its build/test/runtime path to turn it from a node into an understood subject.';
  }
  return comp && comp.next_actions && comp.next_actions[0] ? comp.next_actions[0] : 'Inspect this component in source to confirm its role.';
}

// ---------------------------------------------------------------------------
// C4 model (doc 16 §C4 Contract)
// ---------------------------------------------------------------------------

/**
 * Build the C4 view model. C4 is an optional map, NOT a renamed repo graph.
 *
 *   - Context: ALWAYS present (target system + true external systems if known).
 *   - Container: present ONLY when observed runtime/deploy evidence exists
 *     (atlas.c4.container_boxes non-empty). Otherwise honest-empty with a plain
 *     explanation. NEVER inferred from repo names, families, colors, or layout.
 *   - Component: promoted units only. When runtime/deploy evidence is absent,
 *     Component is labeled "limited/derived" (it is family-promoted, not
 *     deploy-observed).
 *   - Code: out of scope; the next action is into source evidence.
 *
 * @param {object} atlas
 * @returns {{
 *   context: Array, container: {present:boolean, boxes:Array, explanation:string},
 *   component: {boxes:Array, limited:boolean}, code: {inScope:boolean, nextAction:string}
 * }}
 */
function c4Model(atlas) {
  const c4 = (atlas && atlas.c4) || {};
  const declaredContext = c4.context_boxes || [];
  const allBoxes = c4.component_boxes || [];
  // Context boxes live in `context_boxes`, but the schema also allows them in
  // `component_boxes` with level === 'context'. Merge both so no context is
  // silently dropped (k2p6 minor #8).
  const context = [...declaredContext, ...allBoxes.filter(b => b && b.level === 'context')];

  // C4 boxes are all modelled as `component_boxes` entries distinguished by
  // their `level` field (schema/system-map.schema.json: c4_box.level enum
  // context|container|component). There is NO separate `container_boxes`
  // array — reading one would always be undefined, leaving Container
  // permanently honest-empty even when container evidence exists. Filter by
  // level instead (captain-atlas 16 §C4 Contract).
  const containerBoxes = allBoxes.filter(b => b && b.level === 'container');
  const componentBoxes = allBoxes.filter(b => b && b.level === 'component');

  // Container is honest-empty unless real runtime/deploy boxes exist. Never
  // fabricated from repo names, families, colors, or layout.
  const hasRuntimeDeployEvidence = containerBoxes.length > 0;
  const container = hasRuntimeDeployEvidence
    ? { present: true, boxes: containerBoxes, explanation: '' }
    : {
        present: false,
        boxes: [],
        explanation: 'No runtime/deploy evidence was gathered for this expedition. The C4 Container level is honest-empty: containers are not inferred from repository names, families, or visual grouping. Run a deploy/runtime probe to populate this level.',
      };

  // Component uses promoted units only. Limited/derived when runtime/deploy
  // evidence is absent (family-promoted, not deploy-observed). Families are NOT
  // surfaced here as component boxes — they are a separate structural axis
  // (captain-atlas 16: "C4 must not infer containers from repository names,
  // family colors, or visual grouping").
  const component = {
    boxes: componentBoxes,
    limited: !hasRuntimeDeployEvidence,
    note: hasRuntimeDeployEvidence
      ? 'Component boxes are observed from the model.'
      : 'Component level is derived from promoted units (families), not runtime/deploy topology. Treat it as a structural view, not a deployment map.',
  };

  const code = {
    inScope: false,
    nextAction: 'C4 Code level is out of scope for this atlas. Drill into a stage or evidence anchor to reach source code as ground truth.',
  };

  return { context, container, component, code };
}

module.exports = {
  deriveReverseRefs,
  relationshipDetail,
  stageDetail,
  evidenceDetail,
  componentDossierFromNav,
  c4Model,
};
