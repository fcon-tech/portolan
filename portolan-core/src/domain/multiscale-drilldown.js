/**
 * Domain: multiscale system drill-down (spec 20).
 *
 * Single responsibility: build a multiscale model that lets the reader drill
 * across ecosystem → capability → component → module/package/concept.
 *
 * Each scale is backed by evidence and connected to its neighbours above and
 * below. A scale with no evidence renders honestly empty with an explanation,
 * not fabricated from names or guesses.
 *
 * PURE: no DOM, no I/O. Domain layer.
 */
'use strict';

const SCALE_LEVELS = ['ecosystem', 'capability', 'component', 'module'];

const SCALE_LABELS = {
  ecosystem: 'Ecosystem',
  capability: 'Capability',
  component: 'Component',
  module: 'Module / Package / Concept',
};

/**
 * Build the multiscale drill-down model from a system-map + optional SI.
 *
 * The model is a tree of scale entries, each with:
 *   { level, id, label, evidence: { source, description },
 *     children: ScaleEntry[], parent: parentId|null,
 *     isEmpty: boolean, emptyReason?: string }
 *
 * @param {object} systemMap — the normalized system-map
 * @param {object} [semanticInvestigation] — optional SI sidecar for capability/concept enrichment
 * @returns {object} { root: ScaleEntry, scales: ScaleEntry[] (flat), depth: number }
 */
function buildMultiscaleModel(systemMap, semanticInvestigation) {
  if (!systemMap || !systemMap.objects) {
    return buildEmptyModel();
  }
  const objects = systemMap.objects;
  const components = objects.components || [];
  const relationships = objects.relationships || [];
  const si = semanticInvestigation || {};

  // --- ecosystem scale (always present) ----------------------------------
  const ecosystemId = 'multiscale:ecosystem';
  const ecosystemLabel = (systemMap.target && systemMap.target.display_name) || 'Landscape';
  const ecosystem = {
    level: 'ecosystem',
    id: ecosystemId,
    label: ecosystemLabel,
    evidence: {
      source: 'system-map',
      description: `${components.length} component(s) in the scanned landscape`,
    },
    children: [],
    parent: null,
    isEmpty: false,
  };

  // --- capability scale --------------------------------------------------
  // Infer capabilities from the SI sidecar (if present) or from component families.
  const capabilities = inferScaleCapabilities(components, si);
  const capabilityEntries = capabilities.map(cap => {
    const entry = {
      level: 'capability',
      id: cap.id,
      label: cap.label,
      evidence: {
        source: cap.source,
        description: cap.description || '',
      },
      children: [],
      parent: ecosystemId,
      isEmpty: false,
    };
    return entry;
  });

  // Link ecosystem → capability
  ecosystem.children = capabilityEntries.map(c => c.id);

  // If no capabilities were inferred, render an honest-empty capability scale.
  if (capabilityEntries.length === 0) {
    ecosystem.children = [];
  }

  // --- component scale ---------------------------------------------------
  const capabilityById = new Map(capabilityEntries.map(c => [c.id, c]));
  const componentEntries = components.map(comp => {
    // Determine which capability this component belongs to.
    const capsForComp = capabilitiesForComponent(comp, si, capabilityEntries);
    const parentId = capsForComp.length > 0 ? capsForComp[0].id : ecosystemId;

    const entry = {
      level: 'component',
      id: comp.id,
      label: comp.display_name || comp.label || comp.id,
      evidence: {
        source: comp.evidence ? comp.evidence.source || 'system-map' : 'system-map',
        description: comp.c4_family ? `Family: ${comp.c4_family}` : '',
      },
      children: [],
      parent: parentId,
      isEmpty: false,
    };

    // Link parent capability → component.
    if (capabilityById.has(parentId)) {
      capabilityById.get(parentId).children.push(comp.id);
    } else {
      // No capability parent; link directly to ecosystem.
      entry.parent = ecosystemId;
      ecosystem.children.push(comp.id);
    }

    return entry;
  });

  // --- module/concept scale ----------------------------------------------
  // Module-level evidence comes from the SI sidecar (internal_concepts) or
  // is honestly empty.
  const componentById = new Map(componentEntries.map(c => [c.id, c]));
  for (const comp of componentEntries) {
    const siComponent = (si.components || []).find(c => c.id === comp.id);
    const concepts = (siComponent && siComponent.internal_concepts) || [];
    if (concepts.length > 0) {
      for (const concept of concepts) {
        const entry = {
          level: 'module',
          id: `module:${comp.id}:${concept.id || comp.children.length}`,
          label: concept.label || concept.id || 'concept',
          evidence: {
            source: concept.source_boundary || 'not_assessed',
            description: concept.explanation || concept.summary || '',
          },
          children: [],
          parent: comp.id,
          isEmpty: false,
        };
        comp.children.push(entry.id);
        componentById.set(entry.id, entry);
      }
    } else {
      // Honest-empty module scale.
      const entry = {
        level: 'module',
        id: `module:${comp.id}:empty`,
        label: 'No module-level evidence',
        evidence: {
          source: 'not_assessed',
          description: 'Module/package/concept evidence is not available for this component.',
        },
        children: [],
        parent: comp.id,
        isEmpty: true,
        emptyReason: 'No symbol-level data is available; a symbol-index producer is needed.',
      };
      comp.children.push(entry.id);
      componentById.set(entry.id, entry);
    }
  }

  // --- flatten -----------------------------------------------------------
  const allEntries = [ecosystem, ...capabilityEntries, ...componentEntries];
  for (const entry of componentById.values()) {
    if (!allEntries.includes(entry)) allEntries.push(entry);
  }

  // Compute depth.
  let depth = 0;
  for (const e of allEntries) {
    const d = levelDepth(e.level);
    if (d > depth) depth = d;
  }

  return { root: ecosystem, scales: allEntries, depth };
}

/**
 * Infer capabilities for the capability scale.
 */
function inferScaleCapabilities(components, si) {
  const seen = new Set();
  const capabilities = [];

  // Prefer SI capabilities when available.
  if (si.capabilities && si.capabilities.length) {
    for (const cap of si.capabilities) {
      if (!seen.has(cap.id)) {
        seen.add(cap.id);
        capabilities.push({
          id: cap.id,
          label: cap.label || cap.id,
          source: 'semantic-investigation',
          description: cap.description || '',
        });
      }
    }
  }

  // Fall back to inferring from component families.
  for (const comp of components) {
    const family = comp.c4_family || comp.family || comp.type || 'unknown';
    const capId = `capability:${family}`;
    if (!seen.has(capId)) {
      seen.add(capId);
      capabilities.push({
        id: capId,
        label: family.charAt(0).toUpperCase() + family.slice(1),
        source: 'system-map',
        description: `Inferred from component family: ${family}`,
      });
    }
  }

  return capabilities;
}

/**
 * Determine which capabilities a component belongs to.
 */
function capabilitiesForComponent(comp, si, capabilityEntries) {
  // Prefer SI component → capability mapping.
  const siComp = (si.components || []).find(c => c.id === comp.id);
  if (siComp && siComp.ecosystem_regions) {
    const matched = capabilityEntries.filter(cap => siComp.ecosystem_regions.includes(cap.id));
    if (matched.length > 0) return matched;
  }
  // Fall back to family-based inference.
  const family = comp.c4_family || comp.family || comp.type || 'unknown';
  const capId = `capability:${family}`;
  const cap = capabilityEntries.find(c => c.id === capId);
  return cap ? [cap] : [];
}

/**
 * Build an empty multiscale model for degenerate input.
 */
function buildEmptyModel() {
  const root = {
    level: 'ecosystem',
    id: 'multiscale:ecosystem',
    label: 'No landscape data',
    evidence: {
      source: 'not_assessed',
      description: 'No system-map is available.',
    },
    children: [],
    parent: null,
    isEmpty: true,
    emptyReason: 'No corpus was collected.',
  };
  return { root, scales: [root], depth: 0 };
}

/**
 * Map a scale level to its depth in the tree.
 */
function levelDepth(level) {
  const idx = SCALE_LEVELS.indexOf(level);
  return idx >= 0 ? idx + 1 : 0;
}

/**
 * Drill into a specific scale entry by id.
 * Returns the entry and its immediate children.
 */
function drillInto(model, entryId) {
  if (!model || !model.scales) return null;
  const entry = model.scales.find(e => e.id === entryId);
  if (!entry) return null;
  const children = model.scales.filter(e => e.parent === entryId);
  return { entry, children };
}

module.exports = {
  SCALE_LEVELS,
  SCALE_LABELS,
  buildMultiscaleModel,
  drillInto,
};
