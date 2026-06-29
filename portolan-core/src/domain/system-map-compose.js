/**
 * Domain: system-map composition — the pure normalization of bundle artifacts
 * into a system-map object conforming to schema/system-map.schema.json (0.1.0).
 *
 * Single responsibility: take already-parsed bundle artifacts and return a
 * normalized system map. Zero filesystem access, zero network, deterministic.
 * This is the Clean-Architecture extraction of the frozen viewer's
 * build-system-map.js imperative pipeline.
 *
 * Classification rules (component promotion, surface detection, C4 grouping +
 * family priority) live in the sibling domain modules (unit-classify, surface,
 * family-lens, route). This module orchestrates them.
 *
 * Pure functions. Domain layer — may depend only on domain.
 *
 * Contract:
 *
 *   composeSystemMap(artifacts, opts) -> systemMap
 *
 *   artifacts = {
 *     atlasSurfaces?: object | null,   // atlas-surfaces.json
 *     atlasFacts?:    object | null,   // atlas-facts.json
 *     repoProfiles?:  object | null,   // repo-profiles.json
 *     manifest?:      object | null,   // manifest.json (currently unused but accepted)
 *     relationships?: object[],         // relationships.jsonl
 *     hotspots?:      object[],         // hotspots-full.jsonl (fallback handled by caller)
 *     gaps?:          object[],         // gaps.jsonl
 *     repos?:         object[],         // repos.json
 *   }
 *   opts = { targetRoot?: string, generatedAt?: string }
 */
'use strict';

const path = require('path');
const { route, detailRoute } = require('./route');
const { isPromotableComponent, mapLifecycle, mapComponentType } = require('./unit-classify');
const { mapSurfaceType, surfaceState, surfaceWhyItMatters } = require('./surface');
const { C4_FAMILY_RULES, FAMILY_META, normalizeRole, assignC4Family } = require('./family-lens');

const SCHEMA_VERSION = '0.1.0';
const PRODUCER_FAMILY = 'portolan-system-map';

function evidence(state, source, producer, reason) {
  return {
    state: state || 'unknown',
    source: source || 'portolan-system-map',
    producer: producer || PRODUCER_FAMILY,
    ...(reason ? { reason } : {}),
  };
}

function buildPromotionSignals(target, factsComponent, repo, corpus) {
  const signals = [];
  const corpusSource = corpus && corpus.manifest_path ? 'corpus-manifest' : 'atlas-surfaces';
  signals.push({
    signal_type: 'repository-metadata',
    source: `${corpusSource}#target:${target.id}`,
    producer: corpus ? 'corpus-manifest' : 'atlas-surfaces',
    independence_group: 'corpus-manifest',
    reason: `Corpus target kind "${target.kind}" with role "${target.role || 'none'}".`,
  });
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
  if (repo) {
    signals.push({
      signal_type: 'source-file',
      source: `repos.json#${repo.id}`,
      producer: 'repo-discovery',
      independence_group: 'repo-discovery',
      reason: 'Local source repository discovered under target root.',
    });
  }
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

function findIntegratorComponent(components, corpusTargets) {
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

function composeSystemMap(artifacts, opts = {}) {
  const targetRoot = opts.targetRoot || '';
  const generatedAt = opts.generatedAt || new Date().toISOString();

  const atlasSurfaces = artifacts.atlasSurfaces || {
    schema_version: SCHEMA_VERSION,
    generated_at: generatedAt,
    target_root: targetRoot,
    corpus: null,
    coverage: {},
    layers: [],
    targets: [],
    surfaces: [],
    gaps: [],
  };
  const atlasFacts = artifacts.atlasFacts || {
    schema_version: SCHEMA_VERSION,
    generated_at: atlasSurfaces.generated_at,
    target_root: atlasSurfaces.target_root || targetRoot,
    corpus: atlasSurfaces.corpus || null,
    coverage: {},
    components: [],
    surface_directory: [],
    edges: [],
    gaps: [],
  };
  const repoProfiles = artifacts.repoProfiles || { schema_version: SCHEMA_VERSION, repos: [] };
  const relationships = artifacts.relationships || [];
  const hotspots = artifacts.hotspots || [];
  const gaps = artifacts.gaps || [];
  const repos = (artifacts.repos || []).filter((r) => r && typeof r === 'object');

  const resolvedTargetRoot = atlasFacts.target_root || atlasSurfaces.target_root || targetRoot;
  const corpus = atlasSurfaces.corpus || atlasFacts.corpus || null;
  const corpusTargets = atlasSurfaces.targets || [];
  const corpusSurfaces = atlasSurfaces.surfaces || [];
  const factsComponents = atlasFacts.components || [];
  const factsEdges = atlasFacts.edges || [];

  const profileByRepoId = new Map();
  for (const r of (repoProfiles.repos || [])) {
    if (r && r.id) profileByRepoId.set(r.id, r);
  }

  const knownIds = new Set();
  const repoByName = new Map();
  for (const r of repos) repoByName.set(r.id, r);
  for (const r of repos) repoByName.set(r.name, r);

  // ---- hotspots index + gaps ----
  const hotspotsByRepo = new Map();
  for (const h of hotspots) {
    if (!h) continue;
    const key = h.repo_id || '';
    if (key) {
      if (!hotspotsByRepo.has(key)) hotspotsByRepo.set(key, []);
      hotspotsByRepo.get(key).push(h);
    }
  }
  const allGaps = [...(gaps || []), ...(atlasFacts.gaps || []), ...(atlasSurfaces.gaps || [])];

  // ---- components ----
  const components = [];
  const componentByTargetId = new Map();

  for (const target of corpusTargets) {
    if (!isPromotableComponent(target)) continue;
    const repo = repoByName.get(target.id) || null;
    const factsComp = factsComponents.find((c) => c && c.target_id === target.id) || null;
    const promotionSignals = buildPromotionSignals(target, factsComp, repo, corpus);
    const c4Family = assignC4Family(target);
    const compId = `component:${target.id}`;
    knownIds.add(compId);

    const repoHotspots = repo ? hotspotsByRepo.get(repo.id) || [] : [];
    const repoFindingIds = repoHotspots.slice(0, 8).map((h) => h.id);

    const attachedSurfaceIds = corpusSurfaces
      .filter((s) => s && s.target_id === target.id)
      .map((s) => s.id);

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

  // Fallback: facts components for non-corpus / single-repo targets.
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
      const promotionSignals = buildPromotionSignals(target, fc, repo, corpus);
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

  // ---- repositories ----
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

  // ---- surfaces ----
  const integratorId = findIntegratorComponent(components, corpusTargets);
  const targetRootId = `target:${resolvedTargetRoot}`;

  const surfaceOnlyTargetIds = new Set(
    corpusTargets
      .filter((t) => t && !isPromotableComponent(t))
      .map((t) => t.id),
  );

  function resolveSurfaceOwner(surface) {
    const tid = surface.target_id || '';
    if (tid && surfaceOnlyTargetIds.has(tid)) {
      return integratorId || targetRootId;
    }
    if (tid && componentByTargetId.has(tid)) {
      return componentByTargetId.get(tid);
    }
    return integratorId || targetRootId;
  }

  const surfaces = [];
  const seenSurfaceKeys = new Set();

  // Stand-alone surface-only targets.
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

  for (const s of surfaces) {
    seenSurfaceKeys.add(`${s.owner_id}|${s.surface_type}|${s.url || ''}`);
  }
  for (const s of corpusSurfaces) {
    if (!s) continue;
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
    knownIds.add(t.id);
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

  // ---- relationships ----
  const relationshipsOut = [];
  function addRelationship(rel) {
    if (!rel) return;
    knownIds.add(rel.id);
    relationshipsOut.push(rel);
  }

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

  // ---- findings ----
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

  // ---- unknowns ----
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

  // ---- C4 ----
  const contextBoxes = [];
  const targetBoxId = `c4-context:${resolvedTargetRoot}`;
  contextBoxes.push({
    id: targetBoxId,
    level: 'context',
    display_name: path.basename(resolvedTargetRoot) || 'Target root',
    object_id: targetBoxId,
    route: route('c4-box', targetBoxId),
  });
  knownIds.add(targetBoxId);

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

  const familiesBySlug = new Map();
  for (const c of components) {
    const slug = c.c4_family;
    if (!familiesBySlug.has(slug)) familiesBySlug.set(slug, []);
    familiesBySlug.get(slug).push(c);
  }

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

  // ---- back-population ----
  const relsByEndpoint = new Map();
  for (const rel of relationshipsOut) {
    for (const ep of [rel.from_id, rel.to_id]) {
      if (!relsByEndpoint.has(ep)) relsByEndpoint.set(ep, []);
      relsByEndpoint.get(ep).push(rel.id);
    }
  }
  for (const c of components) {
    const existing = new Set(c.relationship_ids || []);
    const tid = c.id.replace(/^component:/, '');
    for (const ep of [c.id, tid]) {
      for (const rid of relsByEndpoint.get(ep) || []) {
        if (!existing.has(rid)) {
          existing.add(rid);
          c.relationship_ids.push(rid);
        }
      }
    }
    c.relationship_ids = c.relationship_ids.slice(0, 30);
  }

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

  const surfaceIdSet = new Set(surfaces.map((s) => s.id));
  for (const c of components) {
    c.surface_ids = (c.surface_ids || []).filter((id) => surfaceIdSet.has(id));
  }

  for (const c of components) {
    const tid = c.id.replace(/^component:/, '');
    const target = corpusTargets.find((t) => t && t.id === tid);
    if (target) {
      const matched = allMatchingFamilies(target).filter((f) => f !== c.c4_family);
      if (matched.length > 0) c.secondary_c4_families = matched;
    }
  }

  const familyUnknownCounts = new Map();
  for (const f of families) {
    const compIds = new Set(f.component_ids);
    let count = 0;
    for (const u of unknowns) {
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
    generated_at: generatedAt,
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

  return systemMap;
}

module.exports = { composeSystemMap, SCHEMA_VERSION, PRODUCER_FAMILY };
