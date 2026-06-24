/**
 * Use-case: drill into a dossier for a single object.
 *
 * Single responsibility: resolve an object id (+ kind hint) to its dossier data
 * — the object itself plus its related objects (surfaces, relationships,
 * findings, unknowns) resolved from the atlas index. This is the data behind
 * every dossier view; the renderer turns it into HTML.
 *
 * PURE. Builds an index, resolves refs.
 *
 * Use-case layer — depends on domain, never adapters.
 */
'use strict';

/**
 * Build a byId index across all atlas object kinds.
 * @param {object} atlas
 * @returns {Map<string, {obj, kind}>}
 */
function buildIndex(atlas) {
  const o = (atlas && atlas.objects) || {};
  const idx = new Map();
  for (const c of o.components || []) idx.set(c.id, { obj: c, kind: 'component' });
  for (const r of o.repositories || []) idx.set(r.id, { obj: r, kind: 'repository' });
  for (const s of o.surfaces || []) idx.set(s.id, { obj: s, kind: 'surface' });
  for (const r of o.relationships || []) idx.set(r.id, { obj: r, kind: 'relationship' });
  for (const f of o.findings || []) idx.set(f.id, { obj: f, kind: 'finding' });
  for (const u of o.unknowns || []) idx.set(u.id, { obj: u, kind: 'unknown' });
  return idx;
}

/**
 * Resolve an object id to its dossier data.
 *
 * @param {object} atlas
 * @param {string} id
 * @param {string} [kindHint]
 * @returns {object|null} { kind, object, related: {surfaces, relationships, findings, unknowns, repositories} }
 *   or null if not found.
 */
function drillToDossier(atlas, id, kindHint) {
  const idx = buildIndex(atlas);
  let entry = idx.get(id);
  // Fallback: try component: prefix variants.
  if (!entry) {
    for (const candidate of [`component:${id}`, String(id).replace(/^component:/, '')]) {
      if (idx.has(candidate)) { entry = idx.get(candidate); break; }
    }
  }
  if (!entry) return null;
  const { obj, kind } = entry;
  const resolve = (ids) => (ids || [])
    .map(rid => idx.get(rid))
    .filter(Boolean)
    .map(e => ({ kind: e.kind, object: e.obj }));
  return {
    kind,
    object: obj,
    related: {
      surfaces: resolve(obj.surface_ids),
      relationships: resolve(obj.relationship_ids),
      findings: resolve(obj.finding_ids),
      unknowns: resolve(obj.unknown_ids),
      repositories: resolve(obj.repository_ids),
    },
  };
}

module.exports = { drillToDossier, buildIndex };
