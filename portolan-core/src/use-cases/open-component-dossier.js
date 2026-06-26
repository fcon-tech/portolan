/**
 * Use-case: open the nav-enriched component dossier (captain-atlas 16
 * §Repository Or Component).
 *
 * Thin wrapper over domain.atlas-detail.componentDossierFromNav. PURE. Use-case
 * layer — depends on domain only. Keeps the shell presentation-only.
 */
'use strict';

const { componentDossierFromNav } = require('../domain/atlas-detail');

function openComponentDossier(atlas, navAtlas, componentId) {
  return componentDossierFromNav(atlas, navAtlas, componentId);
}

module.exports = { openComponentDossier };
