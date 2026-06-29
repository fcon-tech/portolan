/**
 * Domain: semantic component investigation contract (captain-atlas 17).
 *
 * Single responsibility: turn a parsed `semanticInvestigation` object (the
 * portable investigation contract) into the view-models the shell renders when
 * the admiral opens a selected component, and the ecosystem placement map. Also
 * contains the pure validator the build step and unit tests use to enforce the
 * doc-17 contract.
 *
 * This is NOT the existing component dossier (captain-atlas 16). The dossier
 * answers "what is this landscape unit". The investigation answers the
 * semantic questions: ecosystem placement, purpose, internal model,
 * integration, risks, overlaps, and the source boundary of every claim.
 *
 * PURE: no DOM, no I/O. Domain layer — depends only on other domain modules.
 * Zero external dependencies.
 *
 * Source boundary enum (orthogonal to evidence.state):
 *   local-corpus      — derived from inspected target files/artifacts
 *   curated-knowledge — stable curated knowledge with a resolvable source card
 *   agent-hypothesis  — agent inference, with or without cited evidence
 *   not_assessed      — the atlas cannot say yet
 *
 * Relation types required by this slice:
 *   provides_capability | depends_on | integrates_with | overlaps_with |
 *   contrasts_with | packaged_by_target | not_assessed
 *
 * `overlaps_with` / `contrasts_with` are SEMANTIC relations (problem-space
 * overlap), NOT dependency edges. They must be bidirectional for an overlap
 * pair: opening either side must show the other with the same dimensions.
 */
'use strict';

// ---------------------------------------------------------------------------
// Enums (closed vocabularies for the contract)
// ---------------------------------------------------------------------------

const SOURCE_BOUNDARIES = new Set([
  'local-corpus',
  'curated-knowledge',
  'agent-hypothesis',
  'not_assessed',
]);

const RELATION_TYPES = new Set([
  'provides_capability',
  'depends_on',
  'integrates_with',
  'overlaps_with',
  'contrasts_with',
  'packaged_by_target',
  'not_assessed',
]);

// Relations that encode SEMANTIC overlap/contrast (the doc-17 overlap pair
// requirement). These are never dependency edges.
const OVERLAP_RELATION_TYPES = new Set(['overlaps_with', 'contrasts_with']);

// An investigation MUST show at least this many internal concepts per selected
// component, unless the component is explicitly marked not_assessed for its
// internal model with a concrete next producer (doc 17 §3).
const MIN_INTERNAL_CONCEPTS = 5;
// At least this many component-specific risks per selected component (doc 17 §5).
const MIN_RISKS = 2;
// An overlap/alternative pair must explain at least this many dimensions (doc 17 §6).
const MIN_OVERLAP_DIMENSIONS = 3;
// A sample must contain at least this many components to prove the contract.
const MIN_SAMPLE_COMPONENTS = 3;

// ---------------------------------------------------------------------------
// Source-ref resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a source_ref against the source-card registry.
 *
 * A source ref is one of:
 *   - "source:<id>"   — a curated/official source card in the registry
 *   - "evidence:<id>" — a local-corpus evidence anchor (validated structurally;
 *                       runtime resolution against navAtlas evidence is the
 *                       generator's job)
 *   - "receipt:<id>"  — a command receipt (spec 19): a machine-checkable anchor
 *                       proving a command was executed. Resolves when the id
 *                       matches an entry in si.command_receipts.
 *   - "risk:<id>" / "gap:<id>" / "concept:<id>" / "capability:<id>"
 *                       — intra-investigation refs (self-resolvable)
 *
 * A source card is "resolvable" when the registry contains an entry for `<id>`
 * AND, if the card is a curated-note kind, it declares a locally-meaningful
 * claim_scope/summary (doc-17 §Data Contract). A URL-only registry entry with
 * no local meaning is NOT resolvable — it is a missing source.
 *
 * @param {object} si the parsed semantic investigation
 * @param {string} sourceRef the source_ref string
 * @returns {{ resolves: boolean, sourceCard?: object, reason?: string }}
 */
function resolveSourceRef(si, sourceRef) {
  if (!sourceRef || typeof sourceRef !== 'string') {
    return { resolves: false, reason: 'source_ref is empty or not a string' };
  }
  const colon = sourceRef.indexOf(':');
  if (colon < 0) {
    return { resolves: false, reason: `source_ref "${sourceRef}" has no kind prefix` };
  }
  const kind = sourceRef.slice(0, colon);
  const id = sourceRef.slice(colon + 1);

  if (kind === 'evidence') {
    // Local-corpus evidence: resolvable when the id is declared as a local_corpus
    // entry on ANY component's evidence_boundary. The data contract stores the
    // boundary ledger per component (component.evidence_boundary.local_corpus),
    // not as a single top-level field. Aggregate across components so an
    // evidence:<id> ref resolves regardless of which component declares it.
    const localIds = new Set();
    for (const c of (si.components || [])) {
      for (const e of (((c.evidence_boundary || {}).local_corpus) || [])) localIds.add(e);
    }
    // Also honour a top-level si.evidenceBoundary.local_corpus if a producer
    // ever emits one (forward-compatible).
    for (const e of (((si.evidenceBoundary || {}).local_corpus) || [])) localIds.add(e);
    if (localIds.has(sourceRef)) return { resolves: true, sourceCard: { id: sourceRef, kind: 'local-corpus' } };
    return { resolves: false, reason: `evidence ref "${sourceRef}" not in any component's local_corpus boundary` };
  }

  // Spec 19: command-receipt anchor. A receipt:<id> ref resolves when the id
  // matches an entry in si.command_receipts. A command receipt is a
  // machine-checkable anchor: { id, command, exit_code, output_excerpt,
  // timestamp }. It proves a command was executed — the output excerpt is the
  // evidence, not an agent's claim.
  if (kind === 'receipt') {
    const receipts = (si.command_receipts || []);
    const receipt = receipts.find(r => r.id === id);
    if (receipt) return { resolves: true, sourceCard: { id: sourceRef, kind: 'command-receipt', receipt } };
    return { resolves: false, reason: `command receipt "${id}" not in si.command_receipts` };
  }

  // Intra-investigation refs (risk/concept/capability/gap) self-resolve when the
  // referenced object exists in the component's data.
  if (kind === 'risk' || kind === 'concept' || kind === 'capability' || kind === 'gap') {
    return { resolves: true, sourceCard: { id: sourceRef, kind } };
  }
  if (kind !== 'source') {
    return { resolves: false, reason: `unknown source_ref kind "${kind}" in "${sourceRef}"` };
  }
  // source:<id> — must be in the registry AND locally meaningful.
  const card = ((si.sources || []).find(s => s.id === id)) || null;
  if (!card) return { resolves: false, reason: `source card "${id}" not in registry` };
  // A curated/official source card must carry local meaning, not just a URL.
  if (!hasLocalMeaning(card)) {
    return { resolves: false, reason: `source card "${id}" is URL-only with no claim_scope/summary` };
  }
  return { resolves: true, sourceCard: card };
}

/**
 * A source card is locally meaningful when it explains what it supports, not
 * just where it lives. Doc 17: a curated claim must link to a resolvable source
 * card with minimal substantive scope. URL-only entries are rejected.
 */
function hasLocalMeaning(card) {
  if (!card || typeof card !== 'object') return false;
  // A checked-in curated note always counts (it is a local artifact).
  if (card.kind === 'curated-note' && card.note_path) return true;
  // Any card must declare a claim_scope (what claims it backs) — a URL alone is
  // not a source card, it is a link.
  const hasClaimScope = typeof card.claim_scope === 'string' && card.claim_scope.trim().length > 0;
  const hasSummary = typeof card.summary === 'string' && card.summary.trim().length > 0;
  return hasClaimScope || hasSummary;
}

// ---------------------------------------------------------------------------
// View-model construction
// ---------------------------------------------------------------------------

/**
 * Build the semantic-investigation view-model: indexes for components,
 * capabilities, regions, sources, and the bidirectional overlap graph.
 *
 * @param {object} si parsed semantic investigation
 * @returns {object} { componentsById, capabilitiesById, regionsById,
 *   sourcesById, sample, overlapGraph, overlapPairs }
 */
function buildSemanticViewModel(si) {
  const components = (si && si.components) || [];
  const capabilities = (si && si.capabilities) || [];
  const regions = (si && si.regions) || [];
  const sources = (si && si.sources) || [];

  const componentsById = new Map(components.map(c => [c.id, c]));
  const capabilitiesById = new Map(capabilities.map(c => [c.id, c]));
  const regionsById = new Map(regions.map(r => [r.id, r]));
  const sourcesById = new Map(sources.map(s => [s.id, s]));

  // Build a bidirectional overlap graph from each component's
  // semantic_relations. overlapGraph: Map<componentId, Map<otherId, edges[]>>
  // where edges[] collects EVERY overlaps_with/contrasts_with relation to that
  // neighbor (a pair can have both). We do NOT auto-mirror — the contract
  // requires the data to declare both sides so a producer cannot accidentally
  // invent one direction.
  const overlapGraph = new Map();
  const ensure = (id) => {
    if (!overlapGraph.has(id)) overlapGraph.set(id, new Map());
    return overlapGraph.get(id);
  };
  for (const c of components) {
    for (const rel of (c.semantic_relations || [])) {
      if (!OVERLAP_RELATION_TYPES.has(rel.type)) continue;
      const nbrs = ensure(c.id);
      if (!nbrs.has(rel.target_id)) nbrs.set(rel.target_id, []);
      nbrs.get(rel.target_id).push({
        type: rel.type,
        dimensions: rel.dimensions || [],
        explanation: rel.explanation || '',
        sourceBoundary: rel.source_boundary || 'not_assessed',
        sourceRef: rel.source_ref || '',
      });
    }
  }
  // Pairs that are declared in BOTH directions. Dimensions are the UNION across
  // all overlap-type relations between A and B (so a pair with an overlaps_with
  // + a contrasts_with counts all distinct dimensions).
  const overlapPairs = [];
  const seen = new Set();
  for (const [aId, neighbors] of overlapGraph) {
    for (const [bId, edges] of neighbors) {
      const key = [aId, bId].sort().join('||');
      if (seen.has(key)) continue;
      const reverse = overlapGraph.get(bId);
      if (reverse && reverse.has(aId)) {
        seen.add(key);
        const dims = new Set();
        for (const e of edges) for (const d of e.dimensions) dims.add(d);
        for (const e of reverse.get(aId)) for (const d of e.dimensions) dims.add(d);
        overlapPairs.push({ a: aId, b: bId, edges, dimensions: [...dims] });
      }
    }
  }

  return {
    componentsById,
    capabilitiesById,
    regionsById,
    sourcesById,
    sample: (si && si.sample) || null,
    overlapGraph,
    overlapPairs,
  };
}

/**
 * Resolve the full investigation view-model for a selected component.
 *
 * Returns null when the component is NOT in the selected sample. The caller
 * (shell) must treat a null result for a selected component as a HARD FAILURE;
 * a null result for a non-selected component renders a typed not-investigated
 * panel (captain-atlas 17 hard rule: no selected component may fall back to a
 * generic dossier).
 *
 * @param {object} si parsed semantic investigation
 * @param {string} componentId
 * @returns {object|null}
 */
function investigationForComponent(si, componentId) {
  const vm = buildSemanticViewModel(si);
  const component = vm.componentsById.get(componentId);
  if (!component) return null;
  // Only SELECTED sample components get an investigation. A component present
  // in the sidecar but not in sample.components is not "selected" — return null
  // so the shell renders a typed not-investigated panel (doc 17 + admiral
  // correction: null is a hard failure for selected ids, a typed gap for
  // non-selected ones). This closes the contract gap where a non-selected
  // component rendered a full 8-section investigation.
  const selected = new Set(((si && si.sample && si.sample.components) || []));
  if (!selected.has(componentId)) return null;
  return decorateComponent(si, vm, component);
}

function decorateComponent(si, vm, component) {
  const regions = (component.ecosystem_regions || []).map(rid => vm.regionsById.get(rid)).filter(Boolean);
  const capabilities = (component.capabilities || []).map(cap => {
    const resolved = vm.capabilitiesById.get(cap.id);
    return { id: cap.id, label: (resolved && resolved.label) || cap.label || cap.id, sourceBoundary: cap.source_boundary || 'not_assessed', sourceRef: cap.source_ref || '' };
  });
  const concepts = component.internal_concepts || [];
  const risks = component.risks || [];
  const integrationSurfaces = component.integration_surfaces || [];
  const semanticRelations = (component.semantic_relations || []).map(rel => decorateRelation(si, vm, rel));

  return {
    componentId: component.id,
    displayName: component.display_name || component.id,
    ecosystemRegions: regions,
    purpose: decorateClaim(component.purpose),
    capabilities,
    internalConcepts: concepts.map(decorateClaim),
    integrationSurfaces: integrationSurfaces.map(decorateIntegrationSurface),
    semanticRelations,
    risks: risks.map(decorateClaim),
    evidenceBoundary: component.evidence_boundary || { local_corpus: [], curated_knowledge: [], agent_hypotheses: [], not_assessed: [] },
    nextExpedition: component.next_expedition || [],
    internalModelAssessed: concepts.length > 0,
  };
}

function decorateClaim(claim) {
  if (!claim || typeof claim !== 'object') return { explanation: '', sourceBoundary: 'not_assessed', sourceRef: '' };
  return {
    id: claim.id || '',
    label: claim.label || '',
    explanation: claim.explanation || claim.summary || '',
    summary: claim.summary || '',
    sourceBoundary: claim.source_boundary || 'not_assessed',
    sourceRef: claim.source_ref || '',
  };
}

function decorateIntegrationSurface(surf) {
  return {
    kind: surf.kind || 'not_assessed',
    label: surf.label || '',
    sourceBoundary: surf.source_boundary || 'not_assessed',
    evidenceRef: surf.evidence_ref || '',
    explanation: surf.explanation || '',
  };
}

function decorateRelation(si, vm, rel) {
  const target = vm.componentsById.get(rel.target_id);
  return {
    type: rel.type || 'not_assessed',
    targetId: rel.target_id,
    targetLabel: (target && target.display_name) || rel.target_id,
    dimensions: rel.dimensions || [],
    explanation: rel.explanation || '',
    sourceBoundary: rel.source_boundary || 'not_assessed',
    sourceRef: rel.source_ref || '',
  };
}

/**
 * The overlap/alternative relations for a single component (for the Overlap &
 * Alternatives section). Each carries its reverse-edge status so the shell can
 * prove bidirectionality to the reader. `edges` collects every overlaps_with/
 * contrasts_with relation to that neighbor; `dimensions` is their union.
 */
function overlapRelationsFor(si, componentId) {
  const vm = buildSemanticViewModel(si);
  const neighbors = vm.overlapGraph.get(componentId) || new Map();
  const out = [];
  for (const [otherId, edges] of neighbors) {
    const reverse = vm.overlapGraph.get(otherId);
    const bidirectional = !!(reverse && reverse.has(componentId));
    // Dimension union must match buildSemanticViewModel/ecosystemPlacementMap:
    // BOTH directions. Otherwise the component page could show fewer dimensions
    // than the ecosystem map for the same pair (consistency bug).
    const dims = new Set();
    for (const e of edges) for (const d of e.dimensions) dims.add(d);
    if (reverse) for (const e of reverse.get(componentId)) for (const d of e.dimensions) dims.add(d);
    out.push({ otherId, edges, dimensions: [...dims], bidirectional });
  }
  return out;
}

/**
 * Build the ecosystem placement map: capability regions, with selected
 * components placed in each, and the bidirectional overlap/alternative
 * relations drawn as connectors. This is NOT the repository graph — it is a
 * capability-region view (doc 17 §Ecosystem Placement Map).
 */
function ecosystemPlacementMap(si, selectedIds) {
  const vm = buildSemanticViewModel(si);
  // Only SELECTED components are placed on the map. The map is the sample's
  // capability placement, not a dump of every component in the sidecar. When no
  // selectedIds is given, fall back to the sample set.
  const selected = selectedIds instanceof Set ? selectedIds : new Set(((si && si.sample && si.sample.components) || []));
  const regions = ((si && si.regions) || []).map(r => {
    const placed = [];
    for (const c of (si.components || [])) {
      if (!selected.has(c.id)) continue;
      if ((c.ecosystem_regions || []).includes(r.id)) {
        placed.push({ id: c.id, label: c.display_name || c.id });
      }
    }
    return { id: r.id, label: r.label || r.id, description: r.description || '', components: placed };
  });
  return { regions, overlapPairs: vm.overlapPairs };
}

// ---------------------------------------------------------------------------
// Validation (pure; used by the build validator and unit tests)
// ---------------------------------------------------------------------------

/**
 * Validate a parsed semantic investigation against the doc-17 contract.
 * Returns an array of violation objects. Empty array = valid.
 *
 * Each violation: { code: string, message: string, componentId?: string }
 */
function validateShape(si) {
  const violations = [];
  if (!si || typeof si !== 'object') {
    return [{ code: 'not-object', message: 'semantic investigation is not an object' }];
  }
  const vm = buildSemanticViewModel(si);

  // Sample declaration.
  const sample = si.sample;
  if (!sample || !sample.selection_reason || typeof sample.selection_reason !== 'string') {
    violations.push({ code: 'sample-reason', message: 'sample.selection_reason is required' });
  }
  const sampleComponentIds = (sample && Array.isArray(sample.components) && sample.components) || [];
  if (sampleComponentIds.length < MIN_SAMPLE_COMPONENTS) {
    violations.push({ code: 'sample-size', message: `sample must contain at least ${MIN_SAMPLE_COMPONENTS} components (found ${sampleComponentIds.length})` });
  }

  // Per-component validation.
  let allNotAssessedCount = 0;
  for (const id of sampleComponentIds) {
    const component = vm.componentsById.get(id);
    if (!component) {
      violations.push({ code: 'sample-missing-component', message: `sample references ${id} but no component data exists`, componentId: id });
      continue;
    }
    const v = validateComponent(si, vm, component);
    for (const x of v) x.componentId = x.componentId || id;
    violations.push(...v);
    if (isAllNotAssessed(component)) allNotAssessedCount++;
  }
  // The sample cannot pass if every component escapes via not_assessed.
  if (sampleComponentIds.length > 0 && allNotAssessedCount === sampleComponentIds.length) {
    violations.push({ code: 'all-not-assessed', message: 'every selected component escapes via not_assessed — the sample teaches nothing' });
  }

  // Bidirectional overlap pair with >= MIN_OVERLAP_DIMENSIONS.
  const validPairs = vm.overlapPairs.filter(p => (p.dimensions || []).length >= MIN_OVERLAP_DIMENSIONS);
  if (validPairs.length === 0) {
    violations.push({ code: 'overlap-pair', message: `no bidirectional overlap pair with >= ${MIN_OVERLAP_DIMENSIONS} dimensions; found ${vm.overlapPairs.length} bidirectional pair(s)` });
  } else {
    // Overlap pairs must both be selected components.
    for (const p of validPairs) {
      if (!sampleComponentIds.includes(p.a) || !sampleComponentIds.includes(p.b)) {
        violations.push({ code: 'overlap-not-selected', message: `overlap pair ${p.a} ↔ ${p.b} must both be selected sample components`, componentId: p.a });
      }
    }
  }

  // Ecosystem map must have at least one region.
  if (((si.regions) || []).length === 0) {
    violations.push({ code: 'no-regions', message: 'ecosystem placement map needs at least one capability region' });
  }

  return violations;
}

function validateComponent(si, vm, component) {
  const violations = [];

  // Purpose with source boundary.
  if (!component.purpose || !component.purpose.summary) {
    violations.push({ code: 'purpose', message: `${component.id}: purpose.summary is required`, componentId: component.id });
  } else if (!claimSourceRefResolves(si, component.purpose)) {
    violations.push({ code: 'source-ref', message: `${component.id}: purpose source_ref missing or unresolved: "${component.purpose.source_ref || ''}"`, componentId: component.id });
  }

  // Internal concepts: >= 5 OR explicit not_assessed model with a next producer.
  const concepts = component.internal_concepts || [];
  if (concepts.length < MIN_INTERNAL_CONCEPTS) {
    const hasNotAssessedModel = concepts.length === 0 && hasExplicitNotAssessedModel(component);
    if (!hasNotAssessedModel) {
      violations.push({ code: 'concepts-count', message: `${component.id}: needs >= ${MIN_INTERNAL_CONCEPTS} internal concepts (found ${concepts.length}) or an explicit not_assessed model with a concrete next producer`, componentId: component.id });
    }
  }
  for (const c of concepts) {
    if (!claimSourceRefResolves(si, c)) {
      violations.push({ code: 'source-ref', message: `${component.id}: concept "${c.id}" source_ref missing or unresolved: "${c.source_ref || ''}"`, componentId: component.id });
    }
  }

  // Risks: >= 2, component-specific (non-generic).
  const risks = component.risks || [];
  if (risks.length < MIN_RISKS) {
    violations.push({ code: 'risks-count', message: `${component.id}: needs >= ${MIN_RISKS} component-specific risks (found ${risks.length})`, componentId: component.id });
  }
  for (const r of risks) {
    if (isGenericRisk(r)) {
      violations.push({ code: 'generic-risk', message: `${component.id}: risk "${r.id}" is generic ("${r.explanation}") — does not count`, componentId: component.id });
    }
    if (!claimSourceRefResolves(si, r)) {
      violations.push({ code: 'source-ref', message: `${component.id}: risk "${r.id}" source_ref missing or unresolved: "${r.source_ref || ''}"`, componentId: component.id });
    }
  }

  // Every ASSESSED claim must resolve to a source card or boundary entry — not
  // only curated-knowledge. local-corpus evidence refs must resolve against the
  // per-component boundary ledger; agent-hypothesis claims must at least carry a
  // ref. not_assessed claims need no ref. This catches the class of bug where a
  // local-corpus evidence:<id> points at an id not in any boundary ledger.
  for (const claim of iterClaims(component)) {
    if (!SOURCE_BOUNDARIES.has(claim.sourceBoundary)) {
      violations.push({ code: 'bad-boundary', message: `${component.id}: claim "${claim.label || claim.id}" has unknown source_boundary "${claim.sourceBoundary}"`, componentId: component.id });
      continue;
    }
    if (claim.sourceBoundary === 'not_assessed') continue;
    if (!resolveSourceRef(si, claim.sourceRef).resolves) {
      const code = claim.sourceBoundary === 'curated-knowledge' ? 'curated-unresolved' : 'source-unresolved';
      violations.push({ code, message: `${component.id}: ${claim.sourceBoundary} claim "${claim.label || claim.id}" has no resolvable source (source_ref="${claim.sourceRef || ''}")`, componentId: component.id });
    }
  }

  // Relation type must be a known semantic relation.
  for (const rel of (component.semantic_relations || [])) {
    if (!RELATION_TYPES.has(rel.type)) {
      violations.push({ code: 'bad-relation-type', message: `${component.id}: semantic_relation to "${rel.target_id}" has unknown type "${rel.type}"`, componentId: component.id });
    }
  }

  return violations;
}

/**
 * Check whether a single claim's source_ref resolves. A claim is "resolvable"
 * when it is local-corpus/agent-hypothesis/not_assessed with a syntactically
 * valid ref (or empty for not_assessed), or curated-knowledge with a resolvable
 * source card.
 */
function claimSourceRefResolves(si, claim) {
  if (!claim) return false;
  const boundary = claim.source_boundary || 'not_assessed';
  if (boundary === 'not_assessed') return true; // no claim to source
  const ref = claim.source_ref || '';
  if (!ref) return false; // any assessed claim needs a ref
  const r = resolveSourceRef(si, ref);
  return r.resolves;
}

// A claim whose explanation is a generic escape ("inspect source", "not assessed",
// "runtime not assessed") does not count as a risk.
const GENERIC_RISK_PHRASES = [
  'inspect source', 'runtime not assessed', 'not assessed', 'tbd', 'todo',
];

function isGenericRisk(risk) {
  const text = ((risk && risk.explanation) || '').toLowerCase().trim();
  if (!text) return true;
  return GENERIC_RISK_PHRASES.some(p => text === p || text.startsWith(p + '.'));
}

// True when the component's internal model is empty AND it declares an explicit
// not_assessed gap with a concrete next producer in next_expedition.
function hasExplicitNotAssessedModel(component) {
  const next = component.next_expedition || [];
  return next.some(n => typeof n === 'object' && (n.producer || n.action) && /internal model|concepts/i.test((n.producer || '') + (n.action || '') + (n.why || '')));
}

// True when EVERY claim-bearing section of the component is not_assessed.
function isAllNotAssessed(component) {
  const claims = iterClaims(component);
  const arr = [...claims];
  if (arr.length === 0) return true;
  return arr.every(c => c.sourceBoundary === 'not_assessed');
}

// Yield every claim-bearing object on a component for boundary/source checks.
function* iterClaims(component) {
  if (component.purpose) yield { id: 'purpose', label: 'purpose', sourceBoundary: component.purpose.source_boundary || 'not_assessed', sourceRef: component.purpose.source_ref || '' };
  for (const c of (component.capabilities || [])) yield { id: c.id, label: c.label || c.id, sourceBoundary: c.source_boundary || 'not_assessed', sourceRef: c.source_ref || '' };
  for (const c of (component.internal_concepts || [])) yield { id: c.id, label: c.label || c.id, sourceBoundary: c.source_boundary || 'not_assessed', sourceRef: c.source_ref || '' };
  for (const r of (component.risks || [])) yield { id: r.id, label: r.label || r.id, sourceBoundary: r.source_boundary || 'not_assessed', sourceRef: r.source_ref || '' };
  for (const s of (component.integration_surfaces || [])) yield { id: s.label || s.kind, label: s.label || s.kind, sourceBoundary: s.source_boundary || 'not_assessed', sourceRef: s.evidence_ref || s.source_ref || '' };
  for (const rel of (component.semantic_relations || [])) yield { id: rel.target_id, label: rel.type + ' ' + rel.target_id, sourceBoundary: rel.source_boundary || 'not_assessed', sourceRef: rel.source_ref || '' };
}

// ---------------------------------------------------------------------------
// Evidence anchor enforcement (spec 19)
// ---------------------------------------------------------------------------

/**
 * Enforce evidence anchors on a semantic investigation (spec 19).
 *
 * Every assessed claim (source_boundary != not_assessed) MUST carry a
 * resolvable evidence anchor — a source card, local source anchor, or command
 * receipt. An assessed claim WITHOUT a resolvable anchor is DOWNGRADED to
 * not_assessed: it MUST NOT be presented as verified without backing.
 *
 * This function returns a NEW semantic-investigation object (shallow-cloned)
 * with downgraded claims. The original is not mutated.
 *
 * @param {object} si the parsed semantic investigation
 * @returns {{ si: object, downgraded: Array<{componentId:string,claimId:string,reason:string}> }}
 */
function enforceEvidenceAnchors(si) {
  if (!si || typeof si !== 'object') return { si, downgraded: [] };
  const downgraded = [];

  // Deep clone is expensive; instead, shallow-clone the top level and the
  // components array, and clone only the component objects we modify.
  const out = { ...si };
  out.components = (si.components || []).map(component => {
    let modified = false;
    const patched = { ...component };

    // purpose
    if (component.purpose && component.purpose.source_boundary && component.purpose.source_boundary !== 'not_assessed') {
      const r = resolveSourceRef(si, component.purpose.source_ref || '');
      if (!r.resolves) {
        patched.purpose = { ...component.purpose, source_boundary: 'not_assessed', _downgraded: `unresolved source_ref: ${r.reason || 'missing'}` };
        downgraded.push({ componentId: component.id, claimId: 'purpose', reason: r.reason || 'missing source_ref' });
        modified = true;
      }
    }

    // capabilities
    if (component.capabilities && component.capabilities.length) {
      patched.capabilities = component.capabilities.map(cap => {
        if (!cap.source_boundary || cap.source_boundary === 'not_assessed') return cap;
        const r = resolveSourceRef(si, cap.source_ref || '');
        if (r.resolves) return cap;
        downgraded.push({ componentId: component.id, claimId: cap.id, reason: r.reason || 'missing source_ref' });
        return { ...cap, source_boundary: 'not_assessed', _downgraded: `unresolved source_ref: ${r.reason || 'missing'}` };
      });
      modified = true;
    }

    // internal_concepts
    if (component.internal_concepts && component.internal_concepts.length) {
      patched.internal_concepts = component.internal_concepts.map(con => {
        if (!con.source_boundary || con.source_boundary === 'not_assessed') return con;
        const r = resolveSourceRef(si, con.source_ref || '');
        if (r.resolves) return con;
        downgraded.push({ componentId: component.id, claimId: con.id, reason: r.reason || 'missing source_ref' });
        return { ...con, source_boundary: 'not_assessed', _downgraded: `unresolved source_ref: ${r.reason || 'missing'}` };
      });
      modified = true;
    }

    // risks
    if (component.risks && component.risks.length) {
      patched.risks = component.risks.map(risk => {
        if (!risk.source_boundary || risk.source_boundary === 'not_assessed') return risk;
        const r = resolveSourceRef(si, risk.source_ref || '');
        if (r.resolves) return risk;
        downgraded.push({ componentId: component.id, claimId: risk.id, reason: r.reason || 'missing source_ref' });
        return { ...risk, source_boundary: 'not_assessed', _downgraded: `unresolved source_ref: ${r.reason || 'missing'}` };
      });
      modified = true;
    }

    // integration_surfaces
    if (component.integration_surfaces && component.integration_surfaces.length) {
      patched.integration_surfaces = component.integration_surfaces.map(surf => {
        if (!surf.source_boundary || surf.source_boundary === 'not_assessed') return surf;
        const ref = surf.evidence_ref || surf.source_ref || '';
        const r = resolveSourceRef(si, ref);
        if (r.resolves) return surf;
        downgraded.push({ componentId: component.id, claimId: surf.label || surf.kind, reason: r.reason || 'missing source_ref' });
        return { ...surf, source_boundary: 'not_assessed', _downgraded: `unresolved source_ref: ${r.reason || 'missing'}` };
      });
      modified = true;
    }

    // semantic_relations
    if (component.semantic_relations && component.semantic_relations.length) {
      patched.semantic_relations = component.semantic_relations.map(rel => {
        if (!rel.source_boundary || rel.source_boundary === 'not_assessed') return rel;
        const r = resolveSourceRef(si, rel.source_ref || '');
        if (r.resolves) return rel;
        downgraded.push({ componentId: component.id, claimId: rel.type + ' ' + rel.target_id, reason: r.reason || 'missing source_ref' });
        return { ...rel, source_boundary: 'not_assessed', _downgraded: `unresolved source_ref: ${r.reason || 'missing'}` };
      });
      modified = true;
    }

    return modified ? patched : component;
  });

  return { si: out, downgraded };
}

module.exports = {
  SOURCE_BOUNDARIES,
  RELATION_TYPES,
  OVERLAP_RELATION_TYPES,
  MIN_INTERNAL_CONCEPTS,
  MIN_RISKS,
  MIN_OVERLAP_DIMENSIONS,
  MIN_SAMPLE_COMPONENTS,
  resolveSourceRef,
  hasLocalMeaning,
  buildSemanticViewModel,
  investigationForComponent,
  overlapRelationsFor,
  ecosystemPlacementMap,
  validateShape,
  enforceEvidenceAnchors,
};
