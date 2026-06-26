/**
 * Use-case: open a route-stage detail (captain-atlas 16 §Route Stage).
 *
 * Thin wrapper over domain.atlas-detail.stageDetail. PURE. Use-case layer —
 * depends on domain only. Returns null when the stage cannot be resolved.
 */
'use strict';

const { stageDetail } = require('../domain/atlas-detail');

function openStage(navAtlas, routeId, stageIndex) {
  return stageDetail(navAtlas, routeId, stageIndex);
}

module.exports = { openStage };
