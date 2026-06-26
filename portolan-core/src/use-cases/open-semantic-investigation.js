/**
 * Use-case: open a semantic component investigation (captain-atlas 17).
 *
 * Thin wrapper over domain.semantic-investigation. PURE. Use-case layer —
 * depends on domain only. Keeps the shell presentation-only.
 *
 * Returns the decorated investigation view-model for a selected component, or
 * null when the component is not in the investigation sample. The shell treats
 * null for a selected component as a HARD FAILURE (no fallback to a generic
 * dossier) and null for a non-selected component as a typed not-investigated
 * panel.
 */
'use strict';

const {
  investigationForComponent,
  overlapRelationsFor,
  ecosystemPlacementMap,
  buildSemanticViewModel,
  resolveSourceRef,
} = require('../domain/semantic-investigation');

function openSemanticInvestigation(si, componentId) {
  return investigationForComponent(si, componentId);
}

module.exports = {
  openSemanticInvestigation,
  // Re-export the accessors the shell needs for the ecosystem map + overlap
  // sections + source-card resolution so it depends only on this use-case, not
  // the domain directly (Clean Architecture dependency rule).
  overlapRelationsFor,
  ecosystemPlacementMap,
  buildSemanticViewModel,
  resolveSourceRef,
};
