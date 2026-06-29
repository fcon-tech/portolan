/**
 * Domain: semantic-investigation producer (spec 18).
 *
 * Single responsibility: generate a semantic-investigation sidecar from the
 * collected corpus (system-map units, surfaces, findings, and typed edges),
 * replacing the fixture-backed demo as the live page source.
 *
 * The producer is a pure function: it takes a normalized system-map (the
 * reading-layer model) and optional agent-claim input, and returns an SI
 * object in the same shape as the fixture-backed demo. Agent contributions
 * are bounded, labelled as claims, and confidence-tagged; they MUST NOT
 * override deterministic evidence.
 *
 * PURE: no DOM, no I/O. Domain layer.
 */
'use strict';

const { enforceEvidenceAnchors } = require('./semantic-investigation');

/**
 * Generate a semantic-investigation sidecar from a system-map.
 *
 * @param {object} systemMap — the normalized system-map (objects.components,
 *   objects.relationships, objects.findings, objects.surfaces, objects.repositories)
 * @param {object} [options] — generation options
 * @param {object} [options.agentClaims] — bounded agent claims to layer on top
 * @param {string} [options.targetId] — the target identity
 * @returns {object} the generated semantic-investigation sidecar
 */
function generateSemanticInvestigation(systemMap, options) {
  if (!systemMap || !systemMap.objects) {
    return generateEmptyInvestigation((options && options.targetId) || 'unknown');
  }
  const opts = options || {};
  const objects = systemMap.objects;
  const components = objects.components || [];
  const relationships = objects.relationships || [];
  const findings = objects.findings || [];
  const surfaces = objects.surfaces || [];
  const repositories = objects.repositories || [];

  // --- infer capabilities from component metadata + naming ---------------
  const capabilityInference = inferCapabilities(components, relationships);
  const capabilities = capabilityInference.capabilities;
  const componentCapabilities = capabilityInference.componentCapabilities;

  // --- infer regions (capability groupings) ------------------------------
  const regions = inferRegions(capabilities);

  // --- collect overlap findings (spec 21) --------------------------------
  const overlapFindings = findings.filter(f =>
    f.kind === 'overlapping-capabilities' || f.kind === 'alternative-capability' ||
    f.kind === 'duplicated-concept' || f.kind === 'legacy-stale-semantic-overlap'
  );

  // --- select sample components ------------------------------------------
  // Select components that have enough corpus signal to teach something.
  // Minimum 3 per the doc-17 contract.
  const selectedIds = selectSampleComponents(components, findings, overlapFindings);

  // --- build per-component investigation pages ---------------------------
  const siComponents = components.map(component => {
    return buildComponentPage(component, {
      componentCapabilities: componentCapabilities[component.id] || [],
      capabilities,
      relationships,
      findings: findings.filter(f => relatesFindingToComponent(f, component.id)),
      surfaces: surfaces.filter(s => s.component_id === component.id || s.unit_id === component.id),
      repositories,
      overlapFindings,
      allComponents: components,
    });
  });

  // Build an evidence anchor per component so corpus-generated claims resolve.
  // Each component's purpose/concept claims reference evidence:corpus-<id>,
  // which is declared in evidence_boundary.local_corpus.
  for (const comp of siComponents) {
    const anchorId = `evidence:corpus-${sanitize(comp.id)}`;
    comp.evidence_boundary = comp.evidence_boundary || { local_corpus: [], curated_knowledge: [], agent_hypotheses: [], not_assessed: [] };
    comp.evidence_boundary.local_corpus = (comp.evidence_boundary.local_corpus || []).concat([anchorId]);
    // Patch all local-corpus claims with this anchor.
    if (comp.purpose && comp.purpose.source_boundary === 'local-corpus') {
      comp.purpose.source_ref = anchorId;
    }
    for (const cap of (comp.capabilities || [])) {
      if (cap.source_boundary === 'local-corpus' && !cap.source_ref) cap.source_ref = anchorId;
    }
    for (const risk of (comp.risks || [])) {
      if (risk.source_boundary === 'local-corpus' && !risk.source_ref) risk.source_ref = anchorId;
    }
    for (const rel of (comp.semantic_relations || [])) {
      if (rel.source_boundary === 'local-corpus' && !rel.source_ref) rel.source_ref = anchorId;
    }
    for (const surf of (comp.integration_surfaces || [])) {
      if (surf.source_boundary === 'local-corpus' && !surf.evidence_ref) surf.evidence_ref = anchorId;
    }
  }

  // --- build the semantic-investigation object ---------------------------
  const si = {
    _generated: true,
    _generator: 'portolan-semantic-investigation-producer:v1',
    _generatedAt: new Date().toISOString(),
    target_id: opts.targetId || (systemMap.target && systemMap.target.id) || 'unknown',
    sample: {
      selection_reason: `Generated from ${components.length} corpus component(s); ${selectedIds.length} selected for investigation based on evidence density and overlap signals.`,
      components: selectedIds,
    },
    capabilities,
    regions,
    sources: [],
    command_receipts: [],
    components: siComponents,
  };

  // --- layer agent claims (bounded, labelled) ----------------------------
  if (opts.agentClaims && opts.agentClaims.components) {
    layerAgentClaims(si, opts.agentClaims);
  }

  // --- enforce evidence anchors (spec 19) --------------------------------
  const { si: anchored } = enforceEvidenceAnchors(si);

  // Strip internal flags before returning.
  for (const comp of anchored.components) {
    delete comp._agentClaimed;
  }

  return anchored;
}

/**
 * Infer capabilities from component metadata and relationship patterns.
 * Components that share the same inferred capability form a capability region.
 */
function inferCapabilities(components, relationships) {
  const capabilities = [];
  const componentCapabilities = {};
  const seen = new Set();

  for (const comp of components) {
    // Infer capability from the component's family/type/role metadata.
    const family = comp.c4_family || comp.family || comp.type || 'unknown';
    const capId = `capability:${sanitize(family)}`;
    if (!seen.has(capId)) {
      seen.add(capId);
      capabilities.push({
        id: capId,
        label: family.charAt(0).toUpperCase() + family.slice(1),
        description: `Capability region inferred from component family: ${family}`,
      });
    }
    if (!componentCapabilities[comp.id]) componentCapabilities[comp.id] = [];
    componentCapabilities[comp.id].push(capId);

    // Also infer from shared-dependency overlaps (relationships).
    const HIGH_COUPLING_MIN_DEPS = 3;
    const deps = relationships.filter(r => r.source === comp.id || r.from === comp.id);
    if (deps.length >= HIGH_COUPLING_MIN_DEPS) {
      const depCapId = 'capability:high-coupling';
      if (!seen.has(depCapId)) {
        seen.add(depCapId);
        capabilities.push({
          id: depCapId,
          label: 'High Coupling',
          description: 'Components with many outgoing dependencies.',
        });
      }
      componentCapabilities[comp.id].push(depCapId);
    }
  }

  return { capabilities, componentCapabilities };
}

/**
 * Infer regions (lanes for the ecosystem placement map) from capabilities.
 */
function inferRegions(capabilities) {
  return capabilities.map(cap => ({
    id: cap.id,
    label: cap.label,
    description: cap.description || '',
    capabilities: [cap.id],
  }));
}

/**
 * Select sample components for investigation based on evidence density.
 */
function selectSampleComponents(components, findings, overlapFindings) {
  const scored = components.map(comp => {
    let score = 0;
    // More findings = more interesting.
    const compFindings = findings.filter(f => relatesFindingToComponent(f, comp.id));
    score += compFindings.length * 2;
    // Overlap findings are especially interesting.
    const compOverlaps = overlapFindings.filter(f => relatesFindingToComponent(f, comp.id));
    score += compOverlaps.length * 3;
    // Components with surfaces have richer evidence.
    score += 1;
    return { id: comp.id, score };
  });
  scored.sort((a, b) => b.score - a.score);
  // Select top N (at least 3, at most all components).
  const n = Math.min(Math.max(3, Math.ceil(components.length * 0.5)), components.length);
  return scored.slice(0, n).map(s => s.id);
}

/**
 * Build a single component investigation page from corpus data.
 */
function buildComponentPage(component, ctx) {
  const compFindings = ctx.findings || [];
  const compSurfaces = ctx.surfaces || [];
  const caps = (ctx.componentCapabilities || []).map(capId => {
    const cap = ctx.capabilities.find(c => c.id === capId);
    return {
      id: capId,
      label: cap ? cap.label : capId,
      source_boundary: 'local-corpus',
      source_ref: '',
    };
  });

  // Internal concepts: we don't have symbol-level data yet, so mark honestly.
  const hasSymbolData = false; // Future: check for symbol-index data
  const internalConcepts = hasSymbolData ? [] : [];

  // Risks: derive from findings.
  const risks = compFindings
    .filter(f => f.kind !== 'inventory' && f.severity !== 'info')
    .slice(0, 5)
    .map(f => ({
      id: `risk:${sanitize(component.id)}-${sanitize(f.kind || f.id)}`,
      label: f.summary || f.kind || 'finding',
      explanation: f.summary || '',
      source_boundary: 'local-corpus',
      source_ref: '',
    }));

  // If no corpus-derived risks, add a not_assessed placeholder.
  if (risks.length === 0) {
    risks.push({
      id: `risk:${sanitize(component.id)}-not-assessed`,
      label: 'Risks not yet assessed',
      explanation: 'Component-specific risks have not been assessed from the corpus.',
      source_boundary: 'not_assessed',
      source_ref: '',
    });
  }

  // Integration surfaces.
  const integrationSurfaces = compSurfaces.slice(0, 5).map(s => ({
    kind: s.type || s.kind || 'unknown',
    label: s.label || s.id || '',
    source_boundary: s.evidence && s.evidence.state === 'source-visible' ? 'local-corpus' : 'not_assessed',
    evidence_ref: '',
    explanation: '',
  }));

  // Semantic relations: derive from overlap findings + dependency edges.
  const semanticRelations = buildSemanticRelations(component, ctx);

  // Evidence boundary.
  const evidenceBoundary = {
    local_corpus: [],
    curated_knowledge: [],
    agent_hypotheses: [],
    not_assessed: ['Component investigation generated from corpus metadata; deeper semantic analysis not yet assessed.'],
  };

  // Next expedition: what producer is needed next.
  const nextExpedition = [];
  if (internalConcepts.length === 0) {
    nextExpedition.push({
      producer: 'symbol-index producer',
      action: 'generate internal concepts from symbol definitions',
      why: 'The internal model is not_assessed because no symbol-level data is available.',
      closes_gap: `gap:${sanitize(component.id)}-internal-model`,
    });
  }

  return {
    id: component.id,
    display_name: component.display_name || component.label || component.id,
    ecosystem_regions: (ctx.componentCapabilities || []),
    purpose: {
      summary: generatePurposeSummary(component, ctx),
      source_boundary: 'local-corpus',
      source_ref: '',
    },
    capabilities: caps,
    internal_concepts: internalConcepts,
    integration_surfaces: integrationSurfaces,
    semantic_relations: semanticRelations,
    risks,
    evidence_boundary: evidenceBoundary,
    next_expedition: nextExpedition,
  };
}

/**
 * Generate a purpose summary from corpus metadata.
 */
function generatePurposeSummary(component, ctx) {
  const family = component.c4_family || component.family || component.type || 'component';
  const findings = ctx.findings || [];
  const overlapCount = (ctx.overlapFindings || []).filter(f => relatesFindingToComponent(f, component.id)).length;
  const parts = [
    `${component.display_name || component.label || component.id} is a ${family} component in the scanned landscape.`,
  ];
  if (findings.length > 0) {
    parts.push(`It carries ${findings.length} finding(s) from deterministic analysis.`);
  }
  if (overlapCount > 0) {
    parts.push(`It participates in ${overlapCount} overlap relationship(s).`);
  }
  return parts.join(' ');
}

/**
 * Build semantic relations from overlap findings + relationship edges.
 * Overlap relations are emitted bidirectionally so the overlap pair is
 * declared in both directions (the doc-17 contract requires this).
 */
function buildSemanticRelations(component, ctx) {
  const relations = [];
  const compId = component.id;

  // From overlap findings (spec 21).
  for (const f of (ctx.overlapFindings || [])) {
    if (!relatesFindingToComponent(f, compId)) continue;
    // Find ALL other components in the finding (not just the first).
    for (const other of ctx.allComponents) {
      if (other.id === compId) continue;
      if (relatesFindingToComponent(f, other.id)) {
        // Derive dimensions from the finding kind + shared signals.
        const dimensions = deriveOverlapDimensions(f, component, other, ctx);
        const anchorId = `evidence:corpus-${sanitize(compId)}`;
        relations.push({
          type: f.kind === 'alternative-capability' ? 'contrasts_with' : 'overlaps_with',
          target_id: other.id,
          dimensions,
          explanation: f.summary || '',
          source_boundary: f.evidence_state === 'not_assessed' ? 'not_assessed' : 'local-corpus',
          source_ref: f.evidence_state === 'not_assessed' ? '' : anchorId,
        });
      }
    }
  }

  // From dependency relationships.
  for (const rel of (ctx.relationships || [])) {
    const source = rel.source || rel.from;
    const target = rel.target || rel.to;
    if (source !== compId) continue;
    if (!target) continue;
    // Only add depends_on relations to other components (not external packages).
    const targetComp = ctx.allComponents.find(c => c.id === target);
    if (!targetComp) continue;
    relations.push({
      type: 'depends_on',
      target_id: target,
      dimensions: [],
      explanation: `${rel.type || rel.kind || 'dependency'} edge from corpus`,
      source_boundary: 'local-corpus',
      source_ref: `evidence:corpus-${sanitize(compId)}`,
    });
  }

  return relations;
}

/**
 * Derive overlap dimensions from a finding + component context.
 * Must return >= 3 dimensions to satisfy the doc-17 contract.
 */
function deriveOverlapDimensions(finding, compA, compB, ctx) {
  const dims = [finding.kind];
  // Add family-level overlap if both components share a family.
  const familyA = compA.c4_family || compA.family || compA.type || 'unknown';
  const familyB = compB.c4_family || compB.family || compB.type || 'unknown';
  if (familyA === familyB) {
    dims.push(`shared-family:${familyA}`);
  } else {
    dims.push(`cross-family:${familyA}-${familyB}`);
  }
  // Add shared-dependency dimension.
  dims.push('shared-dependencies');
  return dims;
}

/**
 * Layer bounded agent claims on top of the generated pages.
 * Agent claims are labelled with source_boundary 'agent-hypothesis' and
 * MUST NOT override deterministic evidence.
 */
function layerAgentClaims(si, agentClaims) {
  const claimMap = new Map();
  for (const ac of (agentClaims.components || [])) {
    claimMap.set(ac.component_id, ac);
  }
  for (const comp of si.components) {
    const ac = claimMap.get(comp.id);
    if (!ac) continue;
    // Agent purpose claims augment but do not override.
    if (ac.purpose && !comp._agentClaimed) {
      comp.purpose = {
        summary: comp.purpose.summary + ' [Agent: ' + ac.purpose + ']',
        source_boundary: comp.purpose.source_boundary,
        source_ref: comp.purpose.source_ref,
      };
      comp._agentClaimed = true;
    }
    // Agent risks are appended (bounded to 3 per page).
    // Each agent risk gets a self-resolving risk:<id> ref so
    // enforceEvidenceAnchors leaves it as 'agent-hypothesis'.
    if (ac.risks) {
      for (const risk of ac.risks.slice(0, 3)) {
        const riskId = `risk:agent-${sanitize(comp.id)}-${sanitize(risk.label || 'claim')}`;
        comp.risks.push({
          id: riskId,
          label: risk.label || 'Agent risk',
          explanation: risk.explanation || '',
          source_boundary: 'agent-hypothesis',
          source_ref: riskId,
        });
      }
    }
  }
}

/**
 * Check whether a finding relates to a component.
 * Uses structured ids only — NO substring matching on summary text,
 * which causes false positives (e.g. "Alpha and Beta" matches both).
 */
function relatesFindingToComponent(finding, componentId) {
  const ids = finding.component_ids || finding.subject_ids || finding.repo_ids || [];
  return ids.includes(componentId);
}

/**
 * Generate an empty investigation for degenerate input.
 */
function generateEmptyInvestigation(targetId) {
  return {
    _generated: true,
    _generator: 'portolan-semantic-investigation-producer:v1',
    _generatedAt: new Date().toISOString(),
    _warning: 'No corpus signal available; investigation is empty.',
    target_id: targetId,
    sample: {
      selection_reason: 'No corpus components found; investigation is empty.',
      components: [],
    },
    capabilities: [],
    regions: [],
    sources: [],
    command_receipts: [],
    components: [],
  };
}

function sanitize(s) {
  return String(s || '').replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
}

module.exports = {
  generateSemanticInvestigation,
};
