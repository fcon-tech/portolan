#!/usr/bin/env node
/**
 * Build a normalized Portolan system map from existing bundle artifacts.
 *
 * This adapter is a read-only normalizer over already-present bundle producers:
 * atlas-surfaces.json, atlas-facts.json, repo-profiles.json, manifest.json,
 * relationships.jsonl, hotspots-full.jsonl, gaps.jsonl, and the optional corpus
 * manifest referenced by atlas-surfaces.json. It does not run scanners, fetch
 * networks, mutate targets, or call any LLM.
 *
 * Output contract: schema/system-map.schema.json (schema_version 0.1.0).
 *
 * Classification is deterministic and reproducible from local facts only. See
 * docs/captain-atlas/07-portolan-core-product-spec.md:
 *   - Component Promotion Rule (Entity Model section)
 *   - Surface Detection Rules (Entity Model section)
 *   - C4 grouping + family priority order (C4 Rules section)
 */
const fs = require('fs');
const path = require('path');
const { shortId, route, detailRoute } = require('./system-map/ids');
const { isPromotableComponent, mapLifecycle, mapComponentType, PROMOTABLE_KINDS, SURFACE_ONLY_KINDS } = require('./system-map/classify');
const { mapSurfaceType, surfaceState, surfaceWhyItMatters, SURFACE_KIND_TO_TYPE } = require('./system-map/surfaces');
const { C4_FAMILY_RULES, FAMILY_META, normalizeRole, assignC4Family } = require('./system-map/c4');

const SCHEMA_VERSION = '0.1.0';
const PRODUCER_FAMILY = 'portolan-system-map';

const mode = process.argv[2];
if (mode !== 'build') {
  console.error('usage: build-system-map.js build <bundle-dir> [target-root]');
  process.exit(2);
}
const bundleDir = process.argv[3];
const targetRoot = process.argv[4] || '';
if (!bundleDir) {
  console.error('usage: build-system-map.js build <bundle-dir> [target-root]');
  process.exit(2);
}

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function readJsonl(file) {
  const rows = [];
  let text = '';
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return rows;
  }
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      rows.push(JSON.parse(trimmed));
    } catch {
      /* skip malformed line */
    }
  }
  return rows;
}

function optFile(file) {
  return fs.existsSync(file) ? file : null;
}

const exists = (p) => {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
};

// shortId/route/detailRoute imported from ./system-map/ids.js (SSOT).

// ---- load bundle inputs -------------------------------------------------

const atlasSurfaces = readJSON(path.join(bundleDir, 'atlas-surfaces.json')) || {
  schema_version: '0.1.0',
  generated_at: new Date().toISOString(),
  target_root: targetRoot,
  corpus: null,
  coverage: {},
  layers: [],
  targets: [],
  surfaces: [],
  gaps: [],
};
const atlasFacts = readJSON(path.join(bundleDir, 'atlas-facts.json')) || {
  schema_version: '0.1.0',
  generated_at: atlasSurfaces.generated_at,
  target_root: atlasSurfaces.target_root || targetRoot,
  corpus: atlasSurfaces.corpus || null,
  coverage: {},
  components: [],
  surface_directory: [],
  edges: [],
  gaps: [],
};
const repoProfiles = readJSON(path.join(bundleDir, 'repo-profiles.json')) || {
  schema_version: '0.1.0',
  repos: [],
};
const manifest = readJSON(path.join(bundleDir, 'manifest.json')) || {};
const relationships = readJsonl(path.join(bundleDir, 'relationships.jsonl'));
const hotspots = readJsonl(
  optFile(path.join(bundleDir, 'hotspots-full.jsonl')) ||
    path.join(bundleDir, 'hotspots.jsonl'),
);
const gaps = readJsonl(path.join(bundleDir, 'gaps.jsonl'));

const resolvedTargetRoot = atlasFacts.target_root || atlasSurfaces.target_root || targetRoot;
const corpus = atlasSurfaces.corpus || atlasFacts.corpus || null;
const corpusTargets = atlasSurfaces.targets || [];
const corpusSurfaces = atlasSurfaces.surfaces || [];
const factsComponents = atlasFacts.components || [];
const factsEdges = atlasFacts.edges || [];

// Resolve repo list and profiles.
const repos = (readJSON(path.join(bundleDir, 'repos.json')) || []).filter(
  (r) => r && typeof r === 'object',
);
const profileByRepoId = new Map();
for (const r of (repoProfiles.repos || [])) {
  if (r && r.id) profileByRepoId.set(r.id, r);
}

// C4 family rules imported from ./system-map/c4.js (SSOT).
// normalizeRole + assignC4Family imported from ./system-map/c4.js (SSOT).

// ---- surface type mapping ----------------------------------------------
// Spec "Surface Detection Rules" + the surface_type enum in the schema.
// SURFACE_KIND_TO_TYPE + mapSurfaceType imported from ./system-map/surfaces.js (SSOT).

// ---- component promotion (imported from ./system-map/classify.js) ---------

// Build promotion signals for a component from local facts.
function buildPromotionSignals(target, factsComponent, repo) {
  const signals = [];
  const corpusSource = corpus && corpus.manifest_path ? 'corpus-manifest' : 'atlas-surfaces';
  // Signal 1: corpus/repository-metadata (always present for corpus targets).
  signals.push({
    signal_type: 'repository-metadata',
    source: `${corpusSource}#target:${target.id}`,
    producer: corpus ? 'corpus-manifest' : 'atlas-surfaces',
    independence_group: 'corpus-manifest',
    reason: `Corpus target kind "${target.kind}" with role "${target.role || 'none'}".`,
  });
  // Signal 2: dependency edge (depends_on or relationship).
  const deps = target.depends_on || [];
  if (deps.length > 0) {
    signals.push({
      signal_type: 'dependency-edge',
      source: `${corpusSource}#target:${target.id}.depends_on`,
      producer: corpus ? 'corpus-manifest' : 'atlas-surfaces',
      independence_group: 'corpus-manifest-dependencies',
      reason: `Declared ${deps.length} manifest dependency edge(s).`,
    });
  }
  // Signal 3: source-visible repository (independent family: repo discovery).
  if (repo) {
    signals.push({
      signal_type: 'source-file',
      source: `repos.json#${repo.id}`,
      producer: 'repo-discovery',
      independence_group: 'repo-discovery',
      reason: 'Local source repository discovered under target root.',
    });
  }
  // Signal 4: repo profile metadata (manifests/compose/dockerfile).
  if (factsComponent && factsComponent.profile) {
    const p = factsComponent.profile;
    if (
      (p.manifest_count || 0) > 0 ||
      (p.compose_file_count || 0) > 0 ||
      (p.dockerfile_count || 0) > 0
    ) {
      signals.push({
        signal_type: 'manifest',
        source: `repo-profiles.json#${factsComponent.repo_id || target.id}`,
        producer: 'repo-profiles',
        independence_group: 'repo-profiles',
        reason: 'Build/deployment manifest metadata observed locally.',
      });
    }
  }
  // Ensure at least one signal (promotion requires >= 1).
  if (signals.length === 0) {
    signals.push({
      signal_type: 'docs-metadata',
      source: `${corpusSource}#target:${target.id}`,
      producer: corpus ? 'corpus-manifest' : 'atlas-surfaces',
      independence_group: 'corpus-manifest',
      reason: 'Named target recorded in corpus metadata.',
    });
  }
  return signals;
}

// ---- entity construction ------------------------------------------------

const evidence = (state, source, producer, reason) => ({
  state: state || 'unknown',
  source: source || 'portolan-system-map',
  producer: producer || PRODUCER_FAMILY,
  ...(reason ? { reason } : {}),
});

// mapLifecycle + mapComponentType imported from ./system-map/classify.js (SSOT).

// Index hotspots by repo for component attachments.
const hotspotsByRepo = new Map();
for (const h of hotspots) {
  if (!h) continue;
  const key = h.repo_id || '';
  if (key) {
    if (!hotspotsByRepo.has(key)) hotspotsByRepo.set(key, []);
    hotspotsByRepo.get(key).push(h);
  }
}

// Index gaps by surface for repository/component attachments.
const allGaps = [...(gaps || []), ...(atlasFacts.gaps || []), ...(atlasSurfaces.gaps || [])];

// Build the set of all known object ids (for reference resolution + routes).
const knownIds = new Set();
const repoByName = new Map();
for (const r of repos) repoByName.set(r.id, r);
for (const r of repos) repoByName.set(r.name, r);

// ---- components ---------------------------------------------------------

const components = [];
const componentByTargetId = new Map();

for (const target of corpusTargets) {
  if (!isPromotableComponent(target)) continue;
  const repo = repoByName.get(target.id) || null;
  const factsComp = factsComponents.find((c) => c && c.target_id === target.id) || null;
  const promotionSignals = buildPromotionSignals(target, factsComp, repo);
  const c4Family = assignC4Family(target);
  const compId = `component:${target.id}`;
  knownIds.add(compId);

  const repoHotspots = repo ? hotspotsByRepo.get(repo.id) || [] : [];
  const repoFindingIds = repoHotspots.slice(0, 8).map((h) => h.id);

  // Surfaces attached to this target.
  const attachedSurfaceIds = corpusSurfaces
    .filter((s) => s && s.target_id === target.id)
    .map((s) => s.id);

  // Relationships touching this target's repo.
  const targetRepoId = repo ? repo.id : '';
  const relIds = relationships
    .filter(
      (r) =>
        r &&
        (r.from_repo === targetRepoId ||
          r.to_repo === targetRepoId ||
          (r.repos || []).includes(targetRepoId)),
    )
    .map((r) => `rel:${r.id}`)
    .slice(0, 20);

  const lifecycle = mapLifecycle(target);
  const type = mapComponentType(target);

  const whyPresent =
    target.notes && target.notes.length > 0
      ? target.notes
      : lifecycle === 'retired'
        ? `Retired or legacy project retained because the corpus/BOM includes it; useful for replacement and migration analysis.`
        : `Named ${target.kind} component present in the inspected target corpus.`;

  componentByTargetId.set(target.id, compId);
  components.push({
    id: compId,
    display_name: target.label || target.id,
    type,
    role: target.role || type,
    lifecycle,
    ...(target.parent_id ? { parent_id: target.parent_id } : {}),
    repository_ids: repo ? [repo.id] : [],
    surface_ids: attachedSurfaceIds,
    relationship_ids: relIds,
    finding_ids: repoFindingIds,
    unknown_ids: [],
    c4_family: c4Family,
    ...(c4Family === 'unknown' ? {} : {
      secondary_c4_families: [],
    }),
    promotion_signals: promotionSignals,
    created_by_producer_family: PRODUCER_FAMILY,
    why_present: whyPresent,
    next_actions: [
      {
        label: 'Open dossier',
        target: route('component', compId),
      },
    ],
    evidence: evidence(
      target.evidence_state || (repo ? 'source-visible' : 'metadata-visible'),
      corpus ? `corpus-manifest#target:${target.id}` : `atlas-surfaces.json#target:${target.id}`,
      corpus ? 'corpus-manifest' : 'atlas-surfaces',
    ),
    route: route('component', compId),
  });
}

// If there were no corpus targets (no manifest), fall back to facts components
// derived from repos so single-repo / non-corpus targets still produce a map.
if (components.length === 0) {
  for (const fc of factsComponents) {
    if (!fc) continue;
    const target = corpusTargets.find((t) => t && t.id === fc.target_id) || {
      id: fc.target_id,
      label: fc.label,
      kind: fc.kind || 'repository',
      lifecycle: fc.lifecycle || 'unknown',
      role: fc.role || fc.kind || 'repository',
      evidence_state: fc.evidence_state || 'source-visible',
    };
    const repo = repoByName.get(fc.repo_id) || null;
    const promotionSignals = buildPromotionSignals(target, fc, repo);
    const c4Family = assignC4Family(target);
    const compId = `component:${target.id}`;
    knownIds.add(compId);
    const repoFindingIds = (fc.top_findings || []).map((f) => f.id);
    componentByTargetId.set(target.id, compId);
    components.push({
      id: compId,
      display_name: target.label || target.id,
      type: mapComponentType(target),
      role: target.role || fc.kind || 'repository',
      lifecycle: mapLifecycle(target),
      repository_ids: repo ? [repo.id] : [],
      surface_ids: (fc.surface_routes || [])
        .filter((s) => s && s.state !== 'missing')
        .map((s) => `surf:${fc.target_id}:${s.slot}`),
      relationship_ids: (fc.relationship_ids || []).map((id) => `rel:${id}`),
      finding_ids: repoFindingIds,
      unknown_ids: [],
      c4_family: c4Family,
      promotion_signals: promotionSignals,
      created_by_producer_family: PRODUCER_FAMILY,
      why_present: `Local repository component discovered under the target root.`,
      next_actions: [
        { label: 'Open dossier', target: route('component', compId) },
      ],
      evidence: evidence(
        fc.evidence_state || 'source-visible',
        `atlas-facts.json#component:${fc.id}`,
        'atlas-facts',
      ),
      route: route('component', compId),
    });
  }
}

// ---- repositories -------------------------------------------------------

const repositories = [];
for (const r of repos) {
  const profile = profileByRepoId.get(r.id);
  const compIds = components
    .filter((c) => c.repository_ids.includes(r.id))
    .map((c) => c.id);
  const repoHotspots = hotspotsByRepo.get(r.id) || [];
  const topFindingIds = repoHotspots.slice(0, 8).map((h) => h.id);
  knownIds.add(r.id);
  const langs = (profile && profile.languages ? profile.languages : []).map((l) =>
    typeof l === 'string' ? l : l.ext || String(l),
  );
  const gapIds = allGaps
    .filter((g) => g && (g.surface || '').includes('repo'))
    .slice(0, 8)
    .map((g) => `unknown:${g.id}`);
  repositories.push({
    id: r.id,
    display_name: r.name || r.id,
    ...(r.path ? { path: r.path } : {}),
    source_visibility_state: 'source-visible',
    languages: langs,
    file_count: profile && profile.scale ? profile.scale.file_count || 0 : 0,
    component_ids: compIds,
    producer_coverage: {
      'repo-profiles': profile ? 'verified' : 'not_assessed',
      'hotspots': repoHotspots.length > 0 ? 'verified' : 'not_assessed',
    },
    top_finding_ids: topFindingIds,
    gap_ids: gapIds,
    created_by_producer_family: PRODUCER_FAMILY,
    why_present: `Source repository discovered under the target root.`,
    evidence: evidence(
      'source-visible',
      `repos.json#${r.id}`,
      'repo-discovery',
    ),
    route: route('repository', r.id),
  });
}

// ---- surfaces -----------------------------------------------------------
// Attach corpus surface targets to their owning component (or target root).
// These must NOT become default-map components.

// surfaceState imported from ./system-map/surfaces.js (SSOT).

// Determine the integrator/target-root component that owns stand-alone
// surface-only targets (support matrix, mailing lists, CI, binary repos, docker
// images). Per the spec these attach to the owning component or target, not to
// themselves and not as peer components.
function findIntegratorComponent() {
  // Project-independent integrator detection. An integrator owns multiple other
  // components or surfaces, so rank promoted components by how many distinct
  // other components depend on them (inbound edges) and pick the highest.
  const inboundCount = new Map();
  for (const t of corpusTargets) {
    for (const depId of t.depends_on || []) {
      inboundCount.set(depId, (inboundCount.get(depId) || 0) + 1);
    }
  }
  let best = null;
  let bestScore = -1;
  for (const c of components) {
    const tid = c.id.replace(/^component:/, '');
    let score = inboundCount.get(tid) || 0;
    // A platform/integrator role is a secondary signal.
    const role = normalizeRole(c.role);
    if (role.includes('integrator') || role.includes('ecosystem') || c.type === 'platform') {
      score += 0.5;
    }
    if (score > bestScore) {
      bestScore = score;
      best = c.id;
    }
  }
  return best;
}

const integratorId = findIntegratorComponent();
const targetRootId = `target:${resolvedTargetRoot}`;

// A corpus target that is surface-only (not promoted) is itself a surface that
// must be owned by the integrator, not float as a peer.
const surfaceOnlyTargetIds = new Set(
  corpusTargets
    .filter((t) => t && !isPromotableComponent(t))
    .map((t) => t.id),
);

function resolveSurfaceOwner(surface) {
  const tid = surface.target_id || '';
  // If the surface's target is itself a surface-only target, its owner is the
  // integrator (or target root), never the surface-only target itself.
  if (tid && surfaceOnlyTargetIds.has(tid)) {
    return integratorId || targetRootId;
  }
  // Prefer the promoted component backing the target.
  if (tid && componentByTargetId.has(tid)) {
    return componentByTargetId.get(tid);
  }
  return integratorId || targetRootId;
}

const surfaces = [];
const seenSurfaceKeys = new Set();

// First: stand-alone surface-only targets (support matrix, mailing lists, CI,
// binary repos, docker images). These are the primary Feature 2 regression
// cases and must attach to the integrator, not float.
for (const t of corpusTargets) {
  if (!t || isPromotableComponent(t)) continue;
  const surfaceType = mapSurfaceType(t.kind, t.role);
  const url =
    t.reference_url || t.docs_url || t.url || t.repository_url || '';
  const surfaceId = `surf:${t.id}`;
  const dedupKey = `${integratorId || targetRootId}|${surfaceType}|${url}`;
  if (seenSurfaceKeys.has(dedupKey)) continue;
  seenSurfaceKeys.add(dedupKey);
  knownIds.add(surfaceId);
  surfaces.push({
    id: surfaceId,
    surface_type: surfaceType,
    label: t.label || t.id,
    owner_id: integratorId || targetRootId,
    ...(url ? { url } : {}),
    state: surfaceState(t),
    evidence: evidence(
      t.evidence_state || 'metadata-visible',
      `atlas-surfaces.json#target:${t.id}`,
      'atlas-surfaces',
    ),
    created_by_producer_family: 'atlas-surfaces',
    why_present: `Surface-only target of kind "${t.kind}" attached to ${integratorId || targetRootId}.`,
    why_it_matters: surfaceWhyItMatters(surfaceType, t),
    route: route('surface', surfaceId),
  });
}

// Surfaces already emitted by atlas-surfaces.json (derived from corpus). These
// are the URL-slot surfaces attached to each corpus target. Use resolveSurfaceOwner
// so surface-only targets reattach to the integrator, and de-dup by owner+type+url.
for (const s of surfaces) {
  seenSurfaceKeys.add(`${s.owner_id}|${s.surface_type}|${s.url || ''}`);
}
for (const s of corpusSurfaces) {
  if (!s) continue;
  // Repository surfaces back a component; skip them as standalone surfaces to
  // avoid duplicating the repo as both component and surface.
  if (String(s.kind || '').toLowerCase() === 'repository') continue;
  const ownerId = resolveSurfaceOwner(s);
  const surfaceType = mapSurfaceType(s.kind, s.label);
  const surfaceId = s.id || `surf:${s.target_id}:${s.kind}`;
  const dedupKey = `${ownerId}|${surfaceType}|${s.url || ''}`;
  if (seenSurfaceKeys.has(dedupKey)) continue;
  seenSurfaceKeys.add(dedupKey);
  knownIds.add(surfaceId);
  surfaces.push({
    id: surfaceId,
    surface_type: surfaceType,
    label: s.label || s.id,
    owner_id: ownerId,
    ...(s.url ? { url: s.url } : {}),
    state: surfaceState(s),
    evidence: evidence(
      s.evidence_state || 'metadata-visible',
      `atlas-surfaces.json#surface:${s.id}`,
      'atlas-surfaces',
    ),
    created_by_producer_family: 'atlas-surfaces',
    why_present: `Surface of type "${surfaceType}" attached to ${ownerId}.`,
    why_it_matters: surfaceWhyItMatters(surfaceType, s),
    route: route('surface', surfaceId),
  });
}

// Surface-route derived surfaces from atlas-facts components (for non-corpus /
// single-repo targets). These cover docs/tracker/wiki/release surfaces observed
// per repository when no corpus manifest supplied them.
for (const fc of factsComponents) {
  if (!fc || !fc.target_id) continue;
  const ownerId = componentByTargetId.get(fc.target_id) || fc.target_id;
  for (const sr of fc.surface_routes || []) {
    if (!sr || sr.state === 'missing') continue;
    if (String(sr.kind || '').toLowerCase() === 'repository') continue;
    const surfaceType = mapSurfaceType(sr.kind, sr.label);
    const surfaceId = `surf:${fc.target_id}:${sr.slot}`;
    const dedupKey = `${ownerId}|${surfaceType}|${sr.url || ''}`;
    if (seenSurfaceKeys.has(dedupKey)) continue;
    seenSurfaceKeys.add(dedupKey);
    knownIds.add(surfaceId);
    surfaces.push({
      id: surfaceId,
      surface_type: surfaceType,
      label: sr.label || surfaceType,
      owner_id: ownerId,
      ...(sr.url ? { url: sr.url } : {}),
      state: surfaceState(sr),
      evidence: evidence(
        sr.evidence_state || 'metadata-visible',
        `atlas-facts.json#surface_route:${fc.target_id}:${sr.slot}`,
        'atlas-facts',
      ),
      created_by_producer_family: 'atlas-facts',
      why_present: `Surface route attached to ${ownerId}.`,
      why_it_matters: surfaceWhyItMatters(surfaceType, sr),
      route: route('surface', surfaceId),
    });
  }
}

// surfaceWhyItMatters imported from ./system-map/surfaces.js (SSOT).

// ---- relationships ------------------------------------------------------

const relationshipsOut = [];
function addRelationship(rel) {
  if (!rel) return;
  knownIds.add(rel.id);
  relationshipsOut.push(rel);
}

// Manifest dependency edges from corpus targets.
for (const target of corpusTargets) {
  if (!isPromotableComponent(target)) continue;
  for (const depId of target.depends_on || []) {
    const fromId = componentByTargetId.get(target.id) || target.id;
    const toId = componentByTargetId.get(depId) || depId;
    const relId = `rel:manifest-dep:${target.id}--to--${depId}`;
    addRelationship({
      id: relId,
      relationship_type: 'depends-on',
      from_id: fromId,
      to_id: toId,
      direction: 'directed',
      evidence: evidence(
        'metadata-visible',
        corpus ? `corpus-manifest#target:${target.id}.depends_on` : `atlas-surfaces.json`,
        corpus ? 'corpus-manifest' : 'atlas-surfaces',
      ),
      created_by_producer_family: corpus ? 'corpus-manifest' : 'atlas-surfaces',
      why_present: `${target.label || target.id} declares a dependency on ${depId}.`,
      summary: `${target.label || target.id} depends on ${depId} (manifest metadata).`,
      route: detailRoute('relationship', relId),
    });
  }
}

// Relationship records from scan-cross-repo.
for (const r of relationships) {
  if (!r || !r.id) continue;
  const relId = `rel:${r.id}`;
  const fromId = r.from_repo || (r.repos && r.repos[0]) || '';
  const toId = r.to_repo || (r.repos && r.repos[1]) || '';
  if (!fromId || !toId) continue;
  addRelationship({
    id: relId,
    relationship_type: r.type || 'relationship',
    from_id: fromId,
    to_id: toId,
    direction: r.from_repo && r.to_repo ? 'directed' : 'undirected',
    evidence: evidence(
      r.evidence_state || 'metadata-visible',
      `relationships.jsonl#${r.id}`,
      r.producer || 'scan-cross-repo',
    ),
    created_by_producer_family: r.producer || 'scan-cross-repo',
    why_present: r.summary || `${fromId} ↔ ${toId} (${r.type || 'relationship'})`,
    summary: r.summary || `${fromId} ↔ ${toId}`,
    route: detailRoute('relationship', relId),
  });
}

// ---- findings -----------------------------------------------------------

const findings = [];
for (const h of hotspots) {
  if (!h || !h.id) continue;
  const affectedIds = [];
  if (h.repo_id) affectedIds.push(h.repo_id);
  const comp = components.find((c) => c.repository_ids.includes(h.repo_id));
  if (comp && !affectedIds.includes(comp.id)) affectedIds.push(comp.id);
  knownIds.add(h.id);
  findings.push({
    id: h.id,
    finding_type: h.kind || 'finding',
    ...(h.severity ? { severity: h.severity } : {}),
    affected_ids: affectedIds,
    summary: h.summary || `${h.kind || 'finding'}: ${h.id}`,
    measure: h.count || h.weight || (h.paths && h.paths.length) ? {
      ...(h.count ? { count: h.count } : {}),
      ...(h.weight ? { weight: h.weight } : {}),
      ...(h.paths && h.paths.length ? { sample: h.paths[0] } : {}),
    } : undefined,
    created_by_producer_family: h.producer || 'hotspots',
    why_present: `Producer "${h.producer || 'unknown'}" flagged this ${h.kind || 'finding'}.`,
    evidence: evidence(
      h.evidence_state || 'source-visible',
      `hotspots-full.jsonl#${h.id}`,
      h.producer || 'hotspots',
    ),
    next_action: {
      label: 'Inspect finding detail',
      target: detailRoute('finding', h.id),
    },
    route: detailRoute('finding', h.id),
  });
}

// ---- unknowns -----------------------------------------------------------

const unknowns = [];
for (const g of allGaps) {
  if (!g || !g.id) continue;
  const unknownId = `unknown:${g.id}`;
  knownIds.add(unknownId);
  const ownerComp = components.find((c) =>
    String(g.surface || '').toLowerCase().includes(String(c.role || '').toLowerCase()),
  );
  unknowns.push({
    id: unknownId,
    ...(ownerComp ? { owner_id: ownerComp.id } : {}),
    summary: g.summary || `Gap on surface "${g.surface || 'unknown'}".`,
    created_by_producer_family: g.source || 'gaps',
    evidence: evidence(
      g.status === 'cannot_verify' ? 'cannot_verify' : 'unknown',
      `gaps.jsonl#${g.id}`,
      g.source || 'gaps',
      `Gap status: ${g.status || 'unknown'}.`,
    ),
    route: detailRoute('unknown', unknownId),
  });
}

// ---- C4 -----------------------------------------------------------------

// Context boxes: target root/integrator + external projects + external surfaces.
const contextBoxes = [];
const targetBoxId = `c4-context:${resolvedTargetRoot}`;
contextBoxes.push({
  id: targetBoxId,
  level: 'context',
  display_name: require('path').basename(resolvedTargetRoot) || 'Target root',
  object_id: targetBoxId,
  route: route('c4-box', targetBoxId),
});
knownIds.add(targetBoxId);

// External projects (retired/external components) as context boxes.
for (const c of components) {
  if (c.lifecycle === 'retired' || c.type === 'external') {
    const boxId = `c4-context:${c.id}`;
    contextBoxes.push({
      id: boxId,
      level: 'context',
      display_name: c.display_name,
      object_id: c.id,
      route: route('c4-box', boxId),
    });
    knownIds.add(boxId);
  }
}

// Families: deterministic grouping of components by c4_family.
const familiesBySlug = new Map();
for (const c of components) {
  const slug = c.c4_family;
  if (!familiesBySlug.has(slug)) familiesBySlug.set(slug, []);
  familiesBySlug.get(slug).push(c);
}

// FAMILY_META imported from ./system-map/c4.js (SSOT).

const families = [];
for (const [slug, comps] of familiesBySlug) {
  const meta = FAMILY_META[slug] || FAMILY_META.unknown;
  const familyId = `c4-family:${slug}`;
  knownIds.add(familyId);
  const componentIds = comps.map((c) => c.id);
  const surfaceCount = surfaces.filter((s) =>
    componentIds.includes(s.owner_id),
  ).length;
  const findingCount = findings.filter((f) =>
    (f.affected_ids || []).some((id) => componentIds.includes(id)),
  ).length;
  families.push({
    id: familyId,
    family: slug,
    display_name: meta.display_name,
    purpose: meta.purpose,
    grouping_reason: meta.grouping_reason,
    component_ids: componentIds,
    surface_count: surfaceCount,
    finding_count: findingCount,
    unknown_count: 0,
    next_actions: [
      { label: 'Open family dossier', target: route('c4-family', familyId) },
    ],
    route: route('c4-family', familyId),
  });
}

// Component boxes: one per promoted component, for the C4 component level.
const componentBoxes = components.map((c) => {
  const boxId = `c4-component:${c.id}`;
  knownIds.add(boxId);
  return {
    id: boxId,
    level: 'component',
    display_name: c.display_name,
    object_id: c.id,
    route: route('c4-box', boxId),
  };
});

// ---- target + assembly --------------------------------------------------

// Back-populate component.relationship_ids: every relationship endpoint is now a
// stable component id, so attach relationship ids to both endpoints. This also
// ensures retired/legacy components (e.g. Sqoop) expose their manifest-dep
// relationships even when they have no backing repo in relationships.jsonl.
const relsByEndpoint = new Map();
for (const rel of relationshipsOut) {
  for (const ep of [rel.from_id, rel.to_id]) {
    if (!relsByEndpoint.has(ep)) relsByEndpoint.set(ep, []);
    relsByEndpoint.get(ep).push(rel.id);
  }
}
for (const c of components) {
  const existing = new Set(c.relationship_ids || []);
  for (const rid of relsByEndpoint.get(c.id) || []) {
    if (!existing.has(rid)) {
      existing.add(rid);
      c.relationship_ids.push(rid);
    }
  }
  c.relationship_ids = c.relationship_ids.slice(0, 30);
}

// Attach unknowns to components. Unknowns without an explicit owner are
// landscape-wide (e.g. "runtime topology not_assessed") and attach to every
// promoted component so each dossier surfaces the honest gap.
const globalUnknownIds = unknowns
  .filter((u) => !u.owner_id)
  .map((u) => u.id);
for (const c of components) {
  const unkIds = new Set(c.unknown_ids || []);
  for (const uid of globalUnknownIds) unkIds.add(uid);
  for (const u of unknowns) {
    if (u.owner_id === c.id) unkIds.add(u.id);
  }
  c.unknown_ids = [...unkIds];
}

// Filter each component's surface_ids to only ids that exist in the final
// surfaces array (drop repository-kind and deduplicated-away references).
const surfaceIdSet = new Set(surfaces.map((s) => s.id));
for (const c of components) {
  c.surface_ids = (c.surface_ids || []).filter((id) => surfaceIdSet.has(id));
}

// Populate secondary C4 families: a component that matches more than one
// family rule records the runner-ups (excluding the primary).
function allMatchingFamilies(target) {
  const role = normalizeRole(target.role);
  const kind = String(target.kind || '').toLowerCase();
  const matched = [];
  for (const rule of C4_FAMILY_RULES) {
    if (rule.roles.includes(role) || rule.kinds.includes(kind)) {
      matched.push(rule.family);
    }
  }
  return matched;
}
for (const c of components) {
  const tid = c.id.replace(/^component:/, '');
  const target = corpusTargets.find((t) => t && t.id === tid);
  if (target) {
    const matched = allMatchingFamilies(target).filter((f) => f !== c.c4_family);
    if (matched.length > 0) c.secondary_c4_families = matched;
  }
}

// Populate per-family unknown_count from the global unknowns that apply to the
// family's components.
const familyUnknownCounts = new Map();
for (const f of families) {
  const compIds = new Set(f.component_ids);
  let count = 0;
  for (const u of unknowns) {
    // A global unknown applies to every component; a family's unknown_count is
    // 1 per distinct global unknown plus any owned by its components.
    if (!u.owner_id) { count += 1; continue; }
    if (compIds.has(u.owner_id)) count += 1;
  }
  familyUnknownCounts.set(f.id, count);
}
for (const f of families) {
  f.unknown_count = familyUnknownCounts.get(f.id) || 0;
}

const targetId = `target:${resolvedTargetRoot}`;
knownIds.add(targetId);

const systemMap = {
  schema_version: SCHEMA_VERSION,
  generated_by: `${PRODUCER_FAMILY} 0.1.0`,
  generated_at: new Date().toISOString(),
  target: {
    id: targetId,
    display_name: path.basename(resolvedTargetRoot) || 'Portolan target',
    root: resolvedTargetRoot,
    approved_output_area: '.portolan',
    approved_instruction_files: [
      '.cursor/rules/portolan-atlas.mdc',
      'AGENTS.md',
      'CLAUDE.md',
    ],
  },
  objects: {
    components,
    repositories,
    surfaces,
    relationships: relationshipsOut,
    findings,
    unknowns,
  },
  c4: {
    context_boxes: contextBoxes,
    families,
    component_boxes: componentBoxes,
  },
};

const outPath = path.join(bundleDir, 'system-map.json');
fs.writeFileSync(outPath, JSON.stringify(systemMap, null, 2) + '\n');
console.error(`system-map: ${outPath} (${components.length} components, ${surfaces.length} surfaces, ${relationshipsOut.length} relationships)`);
