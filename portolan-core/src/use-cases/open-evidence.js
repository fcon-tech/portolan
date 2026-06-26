/**
 * Use-case: open an evidence detail (captain-atlas 16 §Evidence Anchor).
 *
 * Thin wrapper over domain.atlas-detail.evidenceDetail. PURE. Use-case layer —
 * depends on domain only. Returns null when the evidence row cannot be resolved
 * so the shell renders a disabled/not_assessed state, never a generic dossier.
 */
'use strict';

const { evidenceDetail } = require('../domain/atlas-detail');

function openEvidence(navAtlas, evidenceId) {
  return evidenceDetail(navAtlas, evidenceId);
}

module.exports = { openEvidence };
