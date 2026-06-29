/**
 * Use-case: open the landscape structure summary.
 *
 * Reads the atlas's relationships and returns the structural-vs-dependency
 * honesty summary (delegates to domain/landscape-structure). The shell renders
 * a plain-language limitation notice when only dependency edges exist.
 *
 * Use-case layer — depends on domain, never adapters.
 */
'use strict';

const { summarizeLandscapeStructure } = require('../domain/landscape-structure');

function openLandscapeStructure(atlas) {
  const relationships = (atlas && atlas.objects && atlas.objects.relationships) || [];
  return summarizeLandscapeStructure(relationships);
}

module.exports = { openLandscapeStructure };
