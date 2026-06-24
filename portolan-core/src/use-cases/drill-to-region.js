/**
 * Use-case: drill into a region (group of units) from the behaviour map.
 *
 * Single responsibility: given a set of unit ids (a cluster/family selected on
 * the map), return the region's statistical profile + the member units. This is
 * the "description of a region" drill-down — the atlas gazetteer entry next to
 * a map region (charter 08).
 *
 * PURE. Depends on domain/region-profile.
 *
 * Use-case layer — depends on domain, never adapters.
 */
'use strict';

const { buildRegionProfile } = require('../domain/region-profile');

/**
 * @param {object} atlas - parsed system-map
 * @param {Array<string>} unitIds - the units forming the region
 * @returns {{profile: object, members: Array}|null} null if no units resolve
 */
function drillToRegion(atlas, unitIds) {
  const comps = (atlas && atlas.objects && atlas.objects.components) || [];
  const rels = (atlas && atlas.objects && atlas.objects.relationships) || [];
  const idSet = new Set(unitIds || []);
  const members = comps.filter(c => idSet.has(c.id));
  if (members.length === 0) return null;
  const profile = buildRegionProfile(members, rels);
  return { profile, members };
}

module.exports = { drillToRegion };
