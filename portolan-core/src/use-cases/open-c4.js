/**
 * Use-case: open the C4 decomposition view-model (captain-atlas 16 §C4).
 *
 * Thin wrapper over domain.atlas-detail.c4Model. PURE. Use-case layer — depends
 * on domain only. Keeps the shell presentation-only (no direct domain imports).
 */
'use strict';

const { c4Model } = require('../domain/atlas-detail');

function openC4(atlas) {
  return c4Model(atlas);
}

module.exports = { openC4 };
