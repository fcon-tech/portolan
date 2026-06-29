/**
 * Landscape structure classifier.
 *
 * Distinguishes code-level *structural* edges (who references/calls/implements
 * whom) from *dependency/declared* edges (shared libraries, manifest
 * dependencies). This is the honesty contract for the landscape view: when only
 * dependency edges exist, the atlas must say so in plain language and must not
 * dress dependency sharing up as code-level architecture.
 *
 * Pure domain — no I/O, no atlas envelope knowledge beyond the relationship
 * shape. The `references` type is the canonical structural edge produced by
 * symbol-reference-edges; the set is extensible as new structural producers
 * (calls, implements, ...) land.
 *
 * Authority: openspec/specs/reading-experience
 * ("Landscape view shows connected structure, not a flat inventory").
 */
'use strict';

// Edge types that represent code-level structure (resolved references/calls/
// implementations) rather than declared manifest/SBOM dependencies.
const STRUCTURAL_EDGE_TYPES = new Set([
  'references',
  'reference',
  'calls',
  'call',
  'uses',
  'use',
  'implements',
  'implementation',
  'inherits',
  'inheritance',
  'overrides',
  'override',
]);

// Plain-language caveat shown when a landscape has edges but none of them are
// code-level/structural. Phrased around dependencies because that is the real
// producer case (shared-dependency / depends-on); the wording avoids claiming
// the edges ARE all dependencies — only that no code-level structure exists.
const DEPENDENCY_ONLY_NOTICE =
  'Only dependency-level structure is available for this landscape — shared and declared dependencies from manifests and SBOMs. No code-level edges (calls, references, implementations) have been produced yet, so this view shows which components share libraries, not how the code actually connects. Treat it as a dependency map, not code-level architecture.';

function edgeType(rel) {
  return String(rel && (rel.relationship_type || rel.type) || '').trim().toLowerCase();
}

function isStructuralEdge(rel) {
  return STRUCTURAL_EDGE_TYPES.has(edgeType(rel));
}

function isDependencyEdge(rel) {
  const t = edgeType(rel);
  // An edge with no type is not classifiable as structural; treat it as
  // dependency/declared-level rather than over-claiming structure.
  if (!t) return true;
  return !STRUCTURAL_EDGE_TYPES.has(t);
}

/**
 * Classify landscape relationships into structural vs dependency edges and
 * produce a plain-language honesty summary.
 *
 * @param {Array} relationships - objects.relationships from the system-map
 * @returns {{
 *   hasRelationships: boolean,
 *   hasStructuralEdges: boolean,
 *   structuralEdgeCount: number,
 *   dependencyEdgeCount: number,
 *   structuralTypes: string[],
 *   dependencyTypes: string[],
 *   limitationNotice: string|null
 * }}
 *   `limitationNotice` is non-null ONLY when dependency edges exist but no
 *   structural edges do (the "dependency sharing disguised as architecture"
 *   risk). With zero relationships there is nothing to disguise, so the notice
 *   is null and the caller renders its own empty-state copy.
 */
function summarizeLandscapeStructure(relationships) {
  const rels = Array.isArray(relationships) ? relationships : [];
  const structuralTypes = new Set();
  const dependencyTypes = new Set();
  let structuralEdgeCount = 0;
  let dependencyEdgeCount = 0;

  for (const r of rels) {
    const t = edgeType(r);
    if (isStructuralEdge(r)) {
      structuralEdgeCount++;
      if (t) structuralTypes.add(t);
    } else {
      dependencyEdgeCount++;
      if (t) dependencyTypes.add(t);
    }
  }

  const hasStructuralEdges = structuralEdgeCount > 0;
  // The honesty notice fires when there ARE edges to read, but none of them
  // are structural — i.e. the view would otherwise read as "components that
  // share libraries," which is a dependency graph, not code-level architecture.
  const limitationNotice = (!hasStructuralEdges && dependencyEdgeCount > 0)
    ? DEPENDENCY_ONLY_NOTICE
    : null;

  return {
    hasRelationships: rels.length > 0,
    hasStructuralEdges,
    structuralEdgeCount,
    dependencyEdgeCount,
    structuralTypes: [...structuralTypes],
    dependencyTypes: [...dependencyTypes],
    limitationNotice,
  };
}

module.exports = {
  STRUCTURAL_EDGE_TYPES,
  DEPENDENCY_ONLY_NOTICE,
  edgeType,
  isStructuralEdge,
  isDependencyEdge,
  summarizeLandscapeStructure,
};
