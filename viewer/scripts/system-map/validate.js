/**
 * Semantic system-map validator. Pure function: validateSystemMap(map) -> { errors }.
 * Single responsibility: enforce the invariants that JSON Schema cannot express
 * (spec "Bundle Input Contract" + Feature 9 route contract).
 *
 * Two layers:
 *  1. JSON Schema (optional, requires ajv) — run by the CLI wrapper against the
 *     committed schema. This module focuses on layer 2 (semantic invariants)
 *     so it is unit-testable with in-memory maps and zero deps.
 *  2. Semantic invariants: id uniqueness across kinds, relationship endpoint
 *     resolution, surface owner resolution, route/object-kind family consistency,
 *     promotion-signal sufficiency, referential integrity of attached ids,
 *     default-map surface eligibility, c4_family enum + secondary-family dedup.
 */
'use strict';

function validateSystemMap(systemMap) {
  const errors = [];
  const fail = (msg) => errors.push(msg);

  if (!systemMap || !systemMap.objects || !systemMap.c4) {
    return { errors: ['system map is missing objects or c4 section'] };
  }
  const o = systemMap.objects;
  const allObjects = [
    ...(o.components || []).map((x) => ({ ...x, _kind: 'component' })),
    ...(o.repositories || []).map((x) => ({ ...x, _kind: 'repository' })),
    ...(o.surfaces || []).map((x) => ({ ...x, _kind: 'surface' })),
    ...(o.relationships || []).map((x) => ({ ...x, _kind: 'relationship' })),
    ...(o.findings || []).map((x) => ({ ...x, _kind: 'finding' })),
    ...(o.unknowns || []).map((x) => ({ ...x, _kind: 'unknown' })),
    ...((systemMap.c4.context_boxes || [])).map((x) => ({ ...x, _kind: 'c4-box' })),
    ...((systemMap.c4.families || [])).map((x) => ({ ...x, _kind: 'c4-family' })),
    ...((systemMap.c4.component_boxes || [])).map((x) => ({ ...x, _kind: 'c4-box' })),
  ];

  // id -> kinds index; ids must be unique across kinds.
  const idToKinds = new Map();
  for (const obj of allObjects) {
    if (!obj.id) continue;
    if (!idToKinds.has(obj.id)) idToKinds.set(obj.id, new Set());
    idToKinds.get(obj.id).add(obj._kind);
  }
  if (systemMap.target && systemMap.target.id) {
    idToKinds.set(systemMap.target.id, new Set(['target']));
  }
  for (const [id, kinds] of idToKinds) {
    if (kinds.size > 1) {
      fail(`duplicate id across kinds: "${id}" appears as: ${[...kinds].join(', ')}`);
    }
  }
  const knownIds = new Set(idToKinds.keys());

  // relationship endpoints resolve.
  for (const rel of o.relationships || []) {
    if (!knownIds.has(rel.from_id)) fail(`relationship "${rel.id}" from_id does not resolve: "${rel.from_id}"`);
    if (!knownIds.has(rel.to_id)) fail(`relationship "${rel.id}" to_id does not resolve: "${rel.to_id}"`);
  }

  // surface owner resolves.
  for (const s of o.surfaces || []) {
    if (!knownIds.has(s.owner_id)) fail(`surface "${s.id}" owner_id does not resolve: "${s.owner_id}"`);
  }

  // route family (dossier/detail) matches object kind.
  const routeFamily = (r) => { const m = /^#\/(dossier|detail)\//.exec(r || ''); return m ? m[1] : null; };
  const familyForObjectKind = {
    component: 'dossier', repository: 'dossier', surface: 'dossier',
    'c4-box': 'dossier', 'c4-family': 'dossier',
    relationship: 'detail', finding: 'detail', unknown: 'detail',
  };
  for (const obj of allObjects) {
    const fam = routeFamily(obj.route);
    const expected = familyForObjectKind[obj._kind];
    if (fam && expected && fam !== expected) {
      fail(`route/object-kind mismatch: object "${obj.id}" (${obj._kind}) route uses "${fam}", expected "${expected}"`);
    }
  }

  // promotion-signal sufficiency (ambiguous components need >=2 independent groups).
  for (const c of o.components || []) {
    const signals = c.promotion_signals || [];
    if (signals.length === 0) {
      fail(`component "${c.id}" is promoted but has no promotion signal`);
      continue;
    }
    if (c.type === 'unknown') {
      const groups = new Set(signals.map((s) => s.independence_group).filter(Boolean));
      if (groups.size < 2) {
        fail(`component "${c.id}" is promoted from an ambiguous artifact but has only ${groups.size} independent promotion signal group(s); the spec requires at least two`);
      }
    }
  }

  // referential integrity of component attached ids.
  const surfaceIds = new Set((o.surfaces || []).map((s) => s.id));
  const findingIds = new Set((o.findings || []).map((f) => f.id));
  const unknownIdsSet = new Set((o.unknowns || []).map((u) => u.id));
  const relIds = new Set((o.relationships || []).map((r) => r.id));
  for (const c of o.components || []) {
    for (const sid of c.surface_ids || []) if (!surfaceIds.has(sid)) fail(`component "${c.id}" references surface_id "${sid}" that does not exist in objects.surfaces`);
    for (const fid of c.finding_ids || []) if (!findingIds.has(fid)) fail(`component "${c.id}" references finding_id "${fid}" that does not exist in objects.findings`);
    for (const uid of c.unknown_ids || []) if (!unknownIdsSet.has(uid)) fail(`component "${c.id}" references unknown_id "${uid}" that does not exist in objects.unknowns`);
    for (const rid of c.relationship_ids || []) if (!relIds.has(rid)) fail(`component "${c.id}" references relationship_id "${rid}" that does not exist in objects.relationships`);
  }

  // default-map surface eligibility: no surface-flavored id as a component.
  for (const c of o.components || []) {
    const idLower = String(c.id).toLowerCase();
    if (/support-matrix|mailing-list|issue-tracker|wiki|binary-repo|binary-repository|docker-image|release-matrix|runtime-endpoint/.test(idLower)) {
      fail(`default-map component "${c.id}" looks like a documentation/mailing-list/CI/binary/docker surface, not a meaningful component`);
    }
  }

  // c4_family enum + secondary dedup.
  const VALID_FAMILIES = new Set(['data-systems', 'compute-processing', 'platform-governance', 'packaging-runtime', 'coordination-community', 'integration-services', 'unknown']);
  for (const c of o.components || []) {
    if (!VALID_FAMILIES.has(c.c4_family)) fail(`component "${c.id}" has invalid c4_family: "${c.c4_family}"`);
    for (const sf of c.secondary_c4_families || []) {
      if (sf === c.c4_family) fail(`component "${c.id}" secondary_c4_families duplicates primary "${sf}"`);
    }
  }

  return { errors };
}

module.exports = { validateSystemMap };
