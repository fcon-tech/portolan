/**
 * Use-case: open a relationship detail (captain-atlas 16 §Relationship).
 *
 * Thin wrapper over domain.atlas-detail.relationshipDetail. PURE. Use-case
 * layer — depends on domain only. Returns null when the relationship cannot be
 * resolved so the shell renders a disabled/not_assessed state, never a generic
 * component/repository dossier.
 */
'use strict';

const { relationshipDetail } = require('../domain/atlas-detail');

function openRelationship(atlas, navAtlas, relId) {
  return relationshipDetail(atlas, navAtlas, relId);
}

module.exports = { openRelationship };
