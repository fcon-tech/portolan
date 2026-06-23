const app = document.getElementById('app');

const state = {
  model: null,
  selectedId: '',
  selectedFindingId: '',
  selectedEdgeId: '',
  view: 'atlas',
  query: '',
  mapQuery: '',
  mapMode: 'overview',
  mapFocusOnly: false,
  mapLayer: '',
  activeCluster: '',
  activeTour: 'cto',
  toast: '',
  searchLoading: false,
  searchRemoteQuery: '',
  searchRemoteResults: [],
  searchRequestId: 0,
  heavyLoad: {
    status: 'loading',
    warnings: [],
  },
  selectedCode: {
    repo: '',
    path: '',
    line: 1,
    symbol: '',
    radius: 20,
    limit: 20,
    status: 'idle',
    result: null,
    warnings: [],
    error: '',
    lastQueryKey: '',
  },
};

const MAP_NODE_SOFT_LIMIT = 48;
const MAP_EDGE_SOFT_LIMIT = 72;
const DEGRADED_HEALTH_STATUSES = new Set([
  'cannot_verify',
  'not_integrated',
  'not_assessed',
  'partial',
  'non_exhaustive',
  'polluted_by_non_source',
  'dominated_by_fixture_data',
  'oversized',
  'stale',
  'inventory_mismatch',
]);

const LAYERS = [
  {
    id: 'entry',
    title: 'Entry points',
    subtitle: 'APIs, apps, commands',
    roles: ['api', 'frontend', 'gateway', 'app', 'entrypoint', 'workflow-orchestration'],
  },
  {
    id: 'service',
    title: 'Services',
    subtitle: 'Business and workers',
    roles: ['service', 'worker', 'backend', 'batch', 'stream-batch-processing', 'distributed-compute'],
  },
  {
    id: 'data',
    title: 'Data and state',
    subtitle: 'Storage, SQL, cache, search',
    roles: ['database', 'storage', 'cache', 'search-index', 'sql-warehouse', 'distributed-nosql-store'],
  },
  {
    id: 'platform',
    title: 'Platform',
    subtitle: 'Build, deploy, infra',
    roles: ['platform', 'infrastructure', 'deployment', 'ecosystem-integrator', 'security-governance'],
  },
  {
    id: 'support',
    title: 'Support',
    subtitle: 'Libraries and other repos',
    roles: ['library', 'module', 'local-repo', 'component'],
  },
];

const IMPORTANT_QUESTIONS = [
  {
    label: 'How is the enterprise landscape shaped?',
    answer: 'Use the layered map first: context -> domains -> components -> dependencies.',
    target: 'map',
  },
  {
    label: 'Where should I inspect first?',
    answer: 'Open risk clusters, then drill into components with high findings and missing docs/runtime evidence.',
    target: 'risks',
  },
  {
    label: 'What does Portolan really know?',
    answer: 'Source, tracker, wiki, docs and imported cards are separated from unknown runtime topology.',
    target: 'sources',
  },
  {
    label: 'Can I trust the architecture picture?',
    answer: 'The map is static corpus evidence. Runtime calls and production ownership remain not_assessed.',
    target: 'gaps',
  },
];

const ATLAS_LOOP = [
  ['Scan', 'local producers'],
  ['Map', 'repos + relations'],
  ['Ask', 'bounded query'],
  ['Enrich', 'agent claims'],
  ['Re-render', 'human atlas'],
];

const HEAVY_BUNDLE_LOADERS = {
  hotspots: () => fetchQueryRecords('/api/hotspots?limit=120'),
  relationships: () => fetchQueryRecords('/api/relationships?limit=120'),
  gaps: () => fetchQueryRecords('/api/gaps?limit=120'),
  claims: () => fetchQueryRecords('/api/claims?limit=120'),
  promotionHealth: () => fetchQueryRecords('/api/promotion-health?limit=120'),
};

init();

async function init() {
  try {
    const [
      atlasFacts,
      surfaceContent,
      repoProfiles,
      claimsImportReport,
      landscapeReport,
      captainHandoff,
      searchIndex,
      manifest,
    ] =
      await Promise.all([
        fetchJson('/bundle/atlas-facts.json', {}),
        fetchJson('/bundle/atlas-surface-content.json', {}),
        fetchJson('/bundle/repo-profiles.json', {}),
        fetchJson('/bundle/claims-import-report.json', {}),
        fetchJson('/bundle/landscape-report.json', {}),
        fetchJson('/bundle/captain-handoff.json', {}),
        Promise.resolve([]),
        fetchJson('/bundle/manifest.json', {}),
      ]);
    const baseBundle = {
      atlasFacts,
      surfaceContent,
      repoProfiles,
      hotspots: [],
      relationships: [],
      gaps: [],
      claims: [],
      claimsImportReport,
      landscapeReport,
      captainHandoff,
      searchIndex,
      manifest,
      promotionHealth: [],
      promotedFacts: [],
      rawArtifacts: [],
      classifiedSources: [],
    };
    state.model = buildModel(baseBundle);
    state.selectedId = chooseDefaultComponent(state.model);
    routeFromHash();
    ensureSelectedFinding();
    render();
    scheduleHeavyBundleLoad(baseBundle);
  } catch (err) {
    app.innerHTML = `
      <main class="loading-screen loading-screen--error">
        <div class="loading-mark">Portolan</div>
        <p>Could not load bundle.</p>
        <pre>${escapeHtml(err && err.message ? err.message : String(err))}</pre>
      </main>
    `;
  }
}

function scheduleHeavyBundleLoad(baseBundle) {
  const load = async () => {
    const entries = await Promise.all(
      Object.entries(HEAVY_BUNDLE_LOADERS).map(async ([key, loader]) => [key, await loader()])
    );
    state.heavyLoad = {
      status: 'loaded',
      warnings: entries.flatMap(([, result]) => result.warnings || []),
    };
    state.model = buildModel({
      ...baseBundle,
      ...Object.fromEntries(entries.map(([key, result]) => [key, result.records || []])),
    });
    if (!state.model.componentByTarget.has(state.selectedId)) {
      state.selectedId = chooseDefaultComponent(state.model);
    }
    ensureSelectedFinding();
    render();
  };

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => load().catch(showDeferredLoadWarning), { timeout: 250 });
    return;
  }
  window.setTimeout(() => load().catch(showDeferredLoadWarning), 0);
}

function showDeferredLoadWarning(err) {
  state.heavyLoad = {
    status: 'failed',
    warnings: [err && err.message ? err.message : String(err)],
  };
  state.toast = `Some atlas details could not load: ${err && err.message ? err.message : String(err)}`;
  render();
}

async function fetchJson(url, fallback) {
  const res = await fetch(url);
  if (!res.ok) return fallback;
  return res.json();
}

async function fetchJsonl(url) {
  const res = await fetch(url);
  if (!res.ok) return [];
  const text = await res.text();
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

async function fetchQueryRecords(url) {
  const res = await fetch(url);
  if (!res.ok) return { records: [], warnings: [`${url} returned HTTP ${res.status}`] };
  const body = await res.json();
  return {
    records: Array.isArray(body.records) ? body.records : [],
    totalRecords: numberFrom(body.total_records ?? body.total, 0),
    warnings: Array.isArray(body.warnings) ? body.warnings : [],
  };
}

function buildModel({
  atlasFacts,
  surfaceContent,
  repoProfiles,
  hotspots,
  relationships,
  gaps,
  claims,
  claimsImportReport,
  landscapeReport,
  captainHandoff,
  searchIndex,
  manifest,
  promotionHealth,
  promotedFacts,
  rawArtifacts,
  classifiedSources,
}) {
  const components = normalizeComponents(atlasFacts, repoProfiles);
  const componentByTarget = new Map(components.map((component) => [component.targetId, component]));
  const componentByRepo = new Map(components.map((component) => [component.repoId, component]));

  attachSurfaceContent(components, surfaceContent);
  attachFindings(components, hotspots);
  attachRelationships(components, relationships);
  const landscapeClaims = attachClaims(components, claims);

  const findingById = new Map((hotspots || []).filter((finding) => finding.id).map((finding) => [finding.id, finding]));
  const atlasEdges = normalizeAtlasEdges(atlasFacts.edges || []);
  const edges = atlasEdges.filter((edge) => edge.kind === 'manifest-dependency');
  const relationshipEdges = buildRelationshipDisplayEdges(atlasEdges, relationships, components);
  const edgeById = new Map([...edges, ...relationshipEdges].filter((edge) => edge.id).map((edge) => [edge.id, edge]));
  const graphPositions = positionComponents(components);
  const clusters = buildFindingClusters(hotspots, components);
  const sharedDependencies = relationships
    .filter((item) => item.type === 'shared-dependency')
    .sort((a, b) => (b.repos || []).length - (a.repos || []).length)
    .slice(0, 12);

  const coverage = atlasFacts.coverage || {};
  const runtimeGap = (atlasFacts.gaps || gaps || []).find((gap) =>
    String(gap.subject || gap.layer || '').toLowerCase().includes('runtime')
  );

  const mergedGaps = mergeGaps(
    [...(atlasFacts.gaps || []), ...promotionHealthGaps(promotionHealth || [])],
    gaps || []
  );
  if (
    numberFrom(coverage.cannot_verify_surface_routes, 0) > 0 &&
    !mergedGaps.some((gap) => String(gap.surface || gap.subject || '').includes('public wiki'))
  ) {
    mergedGaps.push({
      id: 'atlas-facts-public-wiki-readability',
      surface: 'public wiki readability',
      status: 'cannot_verify',
      summary: `${coverage.cannot_verify_surface_routes} public wiki route(s) exist but unauthenticated readability is not proven by this local bundle.`,
      source: 'atlas-facts',
    });
  }
  const reportSections = Array.isArray(landscapeReport.sections) ? landscapeReport.sections : [];
  const nextSteps = (reportSections.find((section) => section.id === 'next_steps')?.items || []).slice(0, 8);
  const reportAnchors = buildReportAnchors({
    reportSections,
    nextSteps,
    components,
    findingById,
    edgeById,
  });
  const insights = buildExecutiveInsights({
    components,
    coverage,
    edges,
    sharedDependencies,
    gaps: mergedGaps,
    nextSteps,
    findingById,
  });

  return {
    corpus: atlasFacts.corpus || surfaceContent.corpus || {},
    coverage,
    components,
    componentByTarget,
    componentByRepo,
    edges,
    relationshipEdges,
    edgeById,
    graphPositions,
    clusters,
    sharedDependencies,
    surfaceContent,
    relationships,
    claims: claims || [],
    landscapeClaims,
    rejectedClaims: Array.isArray(claimsImportReport.rejected) ? claimsImportReport.rejected : [],
    captainHandoff: captainHandoff || {},
    searchIndex: Array.isArray(searchIndex) ? searchIndex.slice(0, 5000) : [],
    manifest: manifest || {},
    promotionHealth: Array.isArray(promotionHealth) ? promotionHealth : [],
    promotedFacts: Array.isArray(promotedFacts) ? promotedFacts : [],
    rawArtifacts: Array.isArray(rawArtifacts) ? rawArtifacts : [],
    classifiedSources: Array.isArray(classifiedSources) ? classifiedSources : [],
    findingById,
    reportSections,
    reportAnchors,
    insights,
    gaps: mergedGaps,
    hotspots,
    runtimeGap,
    generatedAt: atlasFacts.generated_at || surfaceContent.generated_at || '',
  };
}

function buildExecutiveInsights({ components, coverage, edges, sharedDependencies, gaps, nextSteps, findingById }) {
  const layerGroups = groupBy(components, (component) => component.layer);
  const layerShape = LAYERS.map((layer) => {
    const list = layerGroups.get(layer.id) || [];
    return {
      id: layer.id,
      title: layer.title,
      count: list.length,
      findings: list.reduce((sum, component) => sum + component.findings, 0),
    };
  });
  const anchors = [...components]
    .sort((a, b) =>
      (b.depsIn + b.relationshipRecords + b.depsOut) -
      (a.depsIn + a.relationshipRecords + a.depsOut)
    )
    .slice(0, 5);
  const pressure = [...components]
    .sort((a, b) => b.medium - a.medium || b.findings - a.findings)
    .slice(0, 5);
  const routes = numberFrom(coverage.surface_route_count, 0);
  const cannotVerifyRoutes = numberFrom(coverage.cannot_verify_surface_routes, 0);
  return {
    layerShape,
    anchors,
    pressure,
    nextSteps,
    nextStepGroups: buildNextStepGroups(nextSteps, findingById, components),
    sharedDependencies: sharedDependencies.slice(0, 5),
    gaps: gaps.slice(0, 4),
    evidenceSummary: [
      `${formatNumber(components.length)} repos`,
      `${formatNumber(edges.length)} manifest edges`,
      `${formatNumber(routes)} mapped surfaces`,
      `${formatNumber(cannotVerifyRoutes)} cannot_verify surface routes`,
    ],
  };
}

function countBy(items, keyFn) {
  const counts = {};
  for (const item of items || []) {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function buildNextStepGroups(nextSteps, findingById, components) {
  const byTarget = new Map(components.map((component) => [component.targetId, component]));
  const groups = new Map();
  for (const item of nextSteps || []) {
    const findingId = findingIdFromEvidenceRef(item.evidence_ref);
    const finding = findingId ? findingById.get(findingId) : null;
    const summary = cleanFindingSummary(item.summary || finding?.summary || item.kind || 'next step');
    const kind = item.kind || finding?.kind || 'finding';
    const severity = finding?.severity || item.severity || '';
    const key = `${kind}|${summary}`;
    if (!groups.has(key)) {
      groups.set(key, {
        summary,
        kind,
        severity,
        count: 0,
        repos: new Set(),
        samples: [],
      });
    }
    const group = groups.get(key);
    group.count += 1;
    const component = finding?.targetId ? byTarget.get(finding.targetId) : null;
    if (component) group.repos.add(component.label);
    if (finding && group.samples.length < 4) {
      group.samples.push({
        findingId: finding.id,
        repo: component?.label || finding.repoId || '',
        path: (finding.paths || [])[0] || '',
      });
    }
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      repos: [...group.repos],
      findingId: group.samples[0]?.findingId || '',
    }))
    .sort((a, b) => b.count - a.count || b.repos.length - a.repos.length);
}

function buildReportAnchors({ reportSections, nextSteps, components, findingById, edgeById }) {
  const byTarget = new Map(components.map((component) => [component.targetId, component]));
  const byRepo = new Map(components.map((component) => [component.repoId, component]));
  const anchors = [];
  const addAnchor = (anchor) => {
    if (!anchor || !anchor.action) return;
    const key = [anchor.action, anchor.targetId, anchor.findingId, anchor.edgeId, anchor.gapId, anchor.title].join('|');
    if (anchors.some((item) => item.key === key)) return;
    anchors.push({ ...anchor, key });
  };

  for (const item of nextSteps || []) {
    addAnchor(resolveReportItemAnchor(item, { byTarget, byRepo, findingById, edgeById }, 'Report next step'));
  }

  for (const { item, sectionLabel } of reportSectionItems(reportSections)) {
    addAnchor(resolveReportItemAnchor(item, { byTarget, byRepo, findingById, edgeById }, sectionLabel));
  }

  return anchors.slice(0, 8);
}

function reportSectionItems(reportSections) {
  const out = [];
  for (const section of reportSections || []) {
    const sectionLabel = section.title || section.id || 'Report item';
    for (const item of section.items || []) out.push({ item, sectionLabel });
    for (const group of section.groups || []) {
      const groupLabel = group.title || group.kind || group.id || sectionLabel;
      for (const item of group.items || []) out.push({ item, sectionLabel: groupLabel });
    }
  }
  return out;
}

function resolveReportItemAnchor(item, indexes, sectionLabel) {
  if (!item) return null;
  const evidenceRef = item.evidence_ref || item.evidenceRef || item.ref || '';
  const findingId = item.finding_id || item.findingId || findingIdFromEvidenceRef(evidenceRef);
  const edgeId = item.edge_id || item.edgeId || edgeIdFromEvidenceRef(evidenceRef);
  const component = componentFromReportItem(item, indexes);
  const title = cleanFindingSummary(item.summary || item.title || item.name || item.id || item.kind || sectionLabel || 'Report item');
  const meta = item.severity || item.status || item.evidence_state || item.kind || sectionLabel || 'report';
  const detail = item.detail || item.reason || item.description || evidenceRef || 'from landscape-report.json';
  if (findingId && indexes.findingById.has(findingId)) {
    const finding = indexes.findingById.get(findingId);
    return {
      action: 'select-finding',
      targetId: finding.targetId || component?.targetId || '',
      findingId,
      title,
      meta,
      detail,
      source: evidenceRef || finding.producer_ref || 'hotspot',
    };
  }
  if (edgeId && indexes.edgeById.has(edgeId)) {
    const edge = indexes.edgeById.get(edgeId);
    return {
      action: 'select-edge',
      targetId: edge.from_target || edge.to_target || component?.targetId || '',
      edgeId,
      title,
      meta,
      detail,
      source: evidenceRef || edge.source || 'edge',
    };
  }
  if (component) {
    return {
      action: 'select-component',
      targetId: component.targetId,
      title,
      meta,
      detail,
      source: evidenceRef || 'report item',
    };
  }
  return null;
}

function componentFromReportItem(item, { byTarget, byRepo }) {
  const evidenceRef = item.evidence_ref || item.evidenceRef || item.ref || '';
  const targetId = item.target_id || item.targetId || item.component_id || item.componentId || item.target || '';
  const repoId = item.repo_id || item.repoId || item.repo || '';
  if (targetId && byTarget.has(targetId)) return byTarget.get(targetId);
  if (repoId && byRepo.has(repoId)) return byRepo.get(repoId);
  const refTargetId = targetIdFromEvidenceRef(evidenceRef);
  const refRepoId = repoIdFromEvidenceRef(evidenceRef);
  if (refTargetId && byTarget.has(refTargetId)) return byTarget.get(refTargetId);
  if (refRepoId && byRepo.has(refRepoId)) return byRepo.get(refRepoId);
  if (item.id && byTarget.has(item.id)) return byTarget.get(item.id);
  if (item.id && byRepo.has(item.id)) return byRepo.get(item.id);
  return null;
}

function componentForGapInModel(gap, { byTarget, byRepo, components }) {
  if (!gap) return null;
  const targetId = gap.target_id || gap.targetId || gap.component_id || gap.target || '';
  const repoId = gap.repo_id || gap.repo || '';
  if (targetId && byTarget.has(targetId)) return byTarget.get(targetId);
  if (repoId && byRepo.has(repoId)) return byRepo.get(repoId);
  const text = [gap.id, gap.subject, gap.surface, gap.layer, gap.summary, gap.detail, gap.reason]
    .join(' ')
    .toLowerCase();
  return components.find((component) => [component.targetId, component.repoId]
    .filter((key) => String(key || '').length >= 3)
    .some((key) => text.includes(String(key).toLowerCase()))) || null;
}

function normalizeComponents(atlasFacts, repoProfiles) {
  const profiles = new Map((repoProfiles.repos || []).map((repo) => [repo.id, repo]));
  const rawComponents = Array.isArray(atlasFacts.components) && atlasFacts.components.length
    ? atlasFacts.components
    : (repoProfiles.repos || []).map((repo) => ({
        id: repo.id,
        target_id: repo.id,
        repo_id: repo.id,
        label: repo.name || repo.id,
        role: repo.role || 'repo',
        summary: repo.purpose?.readme_title || repo.summary || '',
        evidence_state: repo.scale?.evidence_state || 'metadata-visible',
        profile: {
          file_count: repo.scale?.file_count,
          primary_languages: repo.languages || [],
        },
        counts: {},
        surfaces: {},
        surface_routes: [],
        facts: [],
        signals: { good: [], needs_attention: [], unknown: [] },
      }));
  const components = rawComponents.map((component) => {
    const profile = profiles.get(component.repo_id) || {};
    const counts = component.counts || {};
    const surfaces = component.surfaces || {};
    const surfaceRoutes = component.surface_routes || [];
    const layer = inferLayer(component, profile);
    return {
      id: component.id || component.target_id,
      targetId: component.target_id || component.id,
      repoId: component.repo_id || profile.id || component.target_id,
      name: profile.name || component.target_id || component.label,
      label: component.label || profile.name || component.target_id,
      role: component.role || 'component',
      layer,
      lifecycle: component.lifecycle || 'active',
      summary: component.summary || profile.purpose?.readme_title || '',
      evidenceState: component.evidence_state || profile.scale?.evidence_state || 'unknown',
      profile,
      counts,
      surfaces,
      surfaceRoutes,
      facts: component.facts || [],
      signals: component.signals || { good: [], needs_attention: [], unknown: [] },
      files: numberFrom(component.profile?.file_count, profile.scale?.file_count),
      findings: numberFrom(counts.findings, 0),
      medium: numberFrom(counts.severities?.medium, 0),
      low: numberFrom(counts.severities?.low, 0),
      info: numberFrom(counts.severities?.info, 0),
      depsIn: numberFrom(counts.inbound_manifest_deps, 0),
      depsOut: numberFrom(counts.outbound_manifest_deps, 0),
      relationshipRecords: numberFrom(counts.relationship_records, 0),
      languages: component.profile?.primary_languages || profile.languages || [],
      contentRoutes: [],
      contentCards: [],
      findingsList: [],
      relationships: [],
      claims: [],
    };
  });

  return components.sort((a, b) => {
    const layerDelta = layerIndex(a.layer) - layerIndex(b.layer);
    if (layerDelta !== 0) return layerDelta;
    return b.findings - a.findings;
  });
}

function attachSurfaceContent(components, surfaceContent) {
  const routesByTarget = new Map();
  for (const route of surfaceContent.routes || []) {
    if (!routesByTarget.has(route.target_id)) routesByTarget.set(route.target_id, []);
    routesByTarget.get(route.target_id).push(route);
  }
  for (const component of components) {
    const routes = routesByTarget.get(component.targetId) || [];
    component.contentRoutes = routes;
    component.contentCards = routes.flatMap((route) => route.cards || []);
  }
}

function attachFindings(components, hotspots) {
  const byRepo = new Map(components.map((component) => [component.repoId, component]));
  const loadedComponents = components.filter((component) => component.profile?.path);
  for (const finding of hotspots || []) {
    const matched = new Map();
    const repoComponent = finding.repo_id ? byRepo.get(finding.repo_id) : null;
    if (repoComponent) matched.set(repoComponent.targetId, repoComponent);
    for (const itemPath of finding.paths || []) {
      const component = detectComponentForPath(itemPath, components);
      if (component) matched.set(component.targetId, component);
    }
    if (!matched.size && loadedComponents.length === 1 && (finding.paths || []).some((itemPath) => isRepoRelativePath(itemPath))) {
      matched.set(loadedComponents[0].targetId, loadedComponents[0]);
    }
    const first = [...matched.values()][0];
    if (!first) continue;
    finding.repoId = first.repoId;
    finding.targetId = first.targetId;
    for (const component of matched.values()) {
      component.findingsList.push(finding);
    }
  }
}

function isRepoRelativePath(value) {
  const text = String(value || '');
  return Boolean(text) && !pathLooksAbsoluteOrUrl(text);
}

function pathLooksAbsoluteOrUrl(value) {
  return /^([a-z]+:)?\/\//i.test(value) || value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value);
}

function attachRelationships(components, relationships) {
  const byRepo = new Map(components.map((component) => [component.repoId, component]));
  for (const relationship of relationships || []) {
    const repoIds = [
      relationship.from_repo,
      relationship.to_repo,
      ...(relationship.repos || []),
    ].filter(Boolean);
    for (const repoId of repoIds) {
      const component = byRepo.get(repoId);
      if (component) component.relationships.push(relationship);
    }
  }
}

function attachClaims(components, claims) {
  const byRepo = new Map(components.map((component) => [component.repoId, component]));
  const byTarget = new Map(components.map((component) => [component.targetId, component]));
  const landscapeClaims = [];
  for (const claim of claims || []) {
    const subject = String(claim.subject || '');
    const repoMatch = subject.match(/^repo:(.+)$/);
    const pathMatch = subject.match(/^path:(.+)$/);
    const component =
      (repoMatch && byRepo.get(repoMatch[1])) ||
      (repoMatch && byTarget.get(repoMatch[1])) ||
      (pathMatch && detectComponentForPath(pathMatch[1], components)) ||
      null;
    if (component) component.claims.push(claim);
    else landscapeClaims.push(claim);
  }
  return landscapeClaims;
}

function mergeGaps(primary, secondary) {
  const seen = new Set();
  return [...primary, ...secondary].filter((gap) => {
    const key = [gap.layer, gap.subject, gap.summary, gap.evidence_state].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function promotionHealthGaps(health) {
  return (health || [])
    .filter((row) => DEGRADED_HEALTH_STATUSES.has(row.status || ''))
    .map((row) => ({
      id: row.id ? `gap-${row.id}` : `gap-promotion-health-${row.family || 'unknown'}`,
      surface: `promotion-health:${row.family || 'unknown'}`,
      status: row.status || 'unknown',
      evidence_state: row.evidence_state || row.status || 'unknown',
      subject: row.family || 'promotion-health',
      summary: row.reason || row.calculation_rule || `${row.family || 'family'} coverage is ${row.status || 'unknown'}`,
      source: 'promotion-health.jsonl',
      recipe: row.next_action || 'portolan-bundle-query promotion-health',
    }));
}

function normalizeAtlasEdges(edges) {
  return (edges || [])
    .filter((edge) => edge && (edge.from_target || edge.to_target || edge.from_repo || edge.to_repo))
    .map((edge, index) => ({
      ...edge,
      id: edge.id || edge.edge_id || `${edge.kind || 'edge'}:${edge.from_target || edge.from_repo || 'from'}->${edge.to_target || edge.to_repo || 'to'}:${index}`,
      kind: edge.kind || edge.type || 'relationship',
      label: edge.label || edge.summary || edge.id || `${edge.from_target || edge.from_repo || 'source'} -> ${edge.to_target || edge.to_repo || 'target'}`,
      from_target: edge.from_target || edge.from || edge.source_target || '',
      to_target: edge.to_target || edge.to || edge.target_target || '',
      from_repo: edge.from_repo || '',
      to_repo: edge.to_repo || '',
      evidence_state: edge.evidence_state || edge.state || 'metadata-visible',
      source: edge.source || edge.producer || edge.producer_ref || '',
    }));
}

function buildRelationshipDisplayEdges(atlasEdges, relationships, components) {
  const byRepo = new Map(components.map((component) => [component.repoId, component]));
  const out = [];
  const add = (edge) => {
    if (!edge.from_target || !edge.to_target || edge.from_target === edge.to_target) return;
    out.push(edge);
  };

  for (const edge of atlasEdges || []) {
    if (edge.kind === 'manifest-dependency') continue;
    add(edge);
  }

  for (const rel of relationships || []) {
    const kind = rel.kind || rel.type || 'relationship';
    const label = rel.label || rel.summary || rel.id || kind;
    const evidenceState = rel.evidence_state || rel.state || 'metadata-visible';
    const source = rel.source || rel.producer || rel.producer_ref || '';
    const from = byRepo.get(rel.from_repo);
    const to = byRepo.get(rel.to_repo);
    if (from && to) {
      add({
        id: rel.id || `${kind}:${from.targetId}->${to.targetId}`,
        kind,
        label,
        from_target: from.targetId,
        to_target: to.targetId,
        from_repo: from.repoId,
        to_repo: to.repoId,
        evidence_state: evidenceState,
        source,
        relationship: rel,
      });
      continue;
    }

    // Cohort records such as shared-dependency name repos that share a fact.
    // They are not runtime topology, but they are still relationship evidence.
    // Render bounded pairwise display edges so the captain can drill into the
    // shared fact from either participating repo without upgrading it to a call.
    const repoIds = rel.repo_ids || rel.repos || [];
    if (Array.isArray(repoIds) && repoIds.length >= 2) {
      const boundedRepoIds = repoIds.slice(0, 6);
      const cohortSampleNote = repoIds.length > boundedRepoIds.length
        ? `bounded cohort sample: ${boundedRepoIds.length} of ${repoIds.length} repos`
        : `cohort relationship: ${repoIds.length} repos`;
      for (let i = 0; i < boundedRepoIds.length; i += 1) {
        for (let j = i + 1; j < boundedRepoIds.length; j += 1) {
          const fromComponent = byRepo.get(boundedRepoIds[i]);
          const toComponent = byRepo.get(boundedRepoIds[j]);
          if (!fromComponent || !toComponent) continue;
          add({
            id: `${rel.id || kind}:${fromComponent.repoId}->${toComponent.repoId}`,
            kind,
            label: `${label} (${cohortSampleNote})`,
            from_target: fromComponent.targetId,
            to_target: toComponent.targetId,
            from_repo: fromComponent.repoId,
            to_repo: toComponent.repoId,
            evidence_state: evidenceState,
            source,
            relationship: rel,
            relationship_semantics: 'cohort-sample',
            cohort_total: repoIds.length,
            cohort_sampled: boundedRepoIds.length,
          });
        }
      }
    }
  }

  const seen = new Set();
  return out.filter((edge) => {
    const key = [edge.from_target, edge.to_target, edge.kind, edge.label].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function layerIndex(layerId) {
  const index = LAYERS.findIndex((layer) => layer.id === layerId);
  return index === -1 ? LAYERS.length : index;
}

function inferLayer(component, profile = {}) {
  const role = String(component?.role || profile?.role || '').toLowerCase();
  for (const layer of LAYERS) {
    if (layer.roles.some((item) => role.includes(item))) return layer.id;
  }
  const purpose = profile.purpose || {};
  const manifests = purpose.manifests || component?.profile?.manifests || [];
  const manifestTypes = manifests.map((item) => item.type || '').join(' ');
  const entrypoints = (purpose.entrypoints || []).join(' ');
  const languages = (component?.profile?.primary_languages || profile.languages || [])
    .map((item) => item.ext || item.name || '')
    .join(' ');
  if (purpose.compose?.length || /docker|compose|terraform|helm|k8s|gradle|make/i.test(manifestTypes + entrypoints)) {
    return 'platform';
  }
  if (/npm|python|go|cargo|composer|gomod/i.test(manifestTypes) || /go:cmd|npm:scripts|main\./i.test(entrypoints)) {
    return 'service';
  }
  if (/sql|db|cache|search|storage|postgres|mysql|redis|solr|elastic/i.test(role + ' ' + component?.label)) {
    return 'data';
  }
  if (/\\.tsx|\\.jsx|\\.vue|\\.svelte|frontend|web/i.test(languages + ' ' + role + ' ' + component?.label)) {
    return 'entry';
  }
  return 'support';
}

function positionComponents(components) {
  const grouped = groupBy(components, (component) => component.layer);
  const positions = new Map();
  const xBands = {
    entry: [7, 21],
    service: [24, 41],
    data: [45, 63],
    platform: [67, 80],
    support: [84, 93],
  };
  for (const layer of LAYERS) {
    const list = grouped.get(layer.id) || [];
    const [startX, endX] = xBands[layer.id] || [10, 90];
    const columnCount = Math.max(1, Math.min(4, Math.ceil(list.length / 10)));
    const rowsPerColumn = Math.max(1, Math.ceil(list.length / columnCount));
    list.forEach((component, index) => {
      const column = Math.floor(index / rowsPerColumn);
      const row = index % rowsPerColumn;
      const columnCenter = columnCount === 1
        ? (startX + endX) / 2
        : startX + ((column + 0.5) * (endX - startX)) / columnCount;
      const rowCount = Math.max(1, Math.min(rowsPerColumn, list.length - column * rowsPerColumn));
      const y = rowCount === 1 ? 52 : 24 + row * (62 / (rowCount - 1));
      positions.set(component.targetId, { x: columnCenter, y });
    });
  }
  return positions;
}

function buildFindingClusters(hotspots, components) {
  const componentByTarget = new Map(components.map((component) => [component.targetId, component]));
  const map = new Map();
  for (const finding of hotspots || []) {
    const key = `${finding.kind || 'finding'}|${finding.summary || 'Unknown finding'}`;
    if (!map.has(key)) {
      map.set(key, {
        id: `cluster-${map.size + 1}`,
        kind: finding.kind || 'finding',
        summary: finding.summary || 'Unknown finding',
        severity: finding.severity || 'unknown',
        producer: finding.producer || 'tool',
        count: 0,
        repos: new Set(),
        samples: [],
      });
    }
    const cluster = map.get(key);
    cluster.count += 1;
    if (finding.targetId) cluster.repos.add(finding.targetId);
    if (cluster.samples.length < 6) cluster.samples.push(finding);
  }
  return [...map.values()]
    .map((cluster) => ({
      ...cluster,
      repos: [...cluster.repos].map((id) => componentByTarget.get(id)).filter(Boolean),
    }))
    .sort((a, b) => b.count - a.count);
}

function chooseDefaultComponent(model) {
  const loaded = model.components.filter((component) => component.profile?.path);
  const candidates = loaded.length ? loaded : model.components;
  return [...candidates].sort((a, b) =>
    (b.findings + b.depsIn + b.depsOut + b.relationshipRecords) -
    (a.findings + a.depsIn + a.depsOut + a.relationshipRecords)
  )[0]?.targetId || '';
}

function detectComponentForPath(path, components) {
  if (!path) return null;
  const normalized = String(path).replace(/\\/g, '/');
  return components.find((component) => {
    const root = String(component.profile?.path || '').replace(/\\/g, '/');
    return root && (normalized === root || normalized.startsWith(`${root}/`));
  }) ||
    components.find((component) => normalized.includes(`/repos/${component.name}/`)) ||
    components.find((component) => normalized.includes(`/repos/${component.targetId}/`)) ||
    components.find((component) => normalized.includes(component.name));
}

function routeFromHash() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const view = params.get('view');
  const component = params.get('component');
  const finding = params.get('finding');
  const edge = params.get('edge');
  const tour = params.get('tour');
  const selectedRepo = params.get('repo') || params.get('selectedRepo');
  const selectedPath = params.get('path') || params.get('selectedPath');
  const selectedLine = params.get('line') || params.get('selectedLine');
  const selectedSymbol = params.get('symbol') || params.get('selectedSymbol');
  const selectedRadius = params.get('radius');
  const selectedLimit = params.get('limit');
  if (view && ['atlas', 'risks', 'sources', 'agent', 'graph'].includes(view)) state.view = view;
  if (component && state.model.componentByTarget.has(component)) state.selectedId = component;
  if (finding && state.model.findingById.has(finding)) selectFinding(finding);
  if (edge && state.model.edgeById.has(edge)) selectEdge(edge);
  if (tour && atlasTours(state.model).some((item) => item.id === tour)) state.activeTour = tour;
  if (selectedRepo || selectedPath || selectedSymbol) {
    state.view = 'agent';
    const before = selectedCodeQueryKey();
    state.selectedCode.repo = selectedRepo || state.selectedCode.repo || '';
    state.selectedCode.path = selectedPath || state.selectedCode.path || '';
    state.selectedCode.line = numberFrom(selectedLine, state.selectedCode.line || 1) || 1;
    state.selectedCode.symbol = selectedSymbol || state.selectedCode.symbol || '';
    state.selectedCode.radius = clamp(numberFrom(selectedRadius, state.selectedCode.radius || 20) || 20, 1, 500);
    state.selectedCode.limit = clamp(numberFrom(selectedLimit, state.selectedCode.limit || 20) || 20, 1, 100);
    const after = selectedCodeQueryKey();
    if (before !== after && state.selectedCode.lastQueryKey !== after) {
      state.selectedCode.status = 'idle';
      state.selectedCode.result = null;
      state.selectedCode.error = '';
      state.selectedCode.warnings = [];
    }
  }
}

function updateHash() {
  const params = new URLSearchParams();
  params.set('view', state.view);
  if (state.selectedId) params.set('component', state.selectedId);
  if (state.selectedFindingId && !state.selectedEdgeId) params.set('finding', state.selectedFindingId);
  if (state.selectedEdgeId) params.set('edge', state.selectedEdgeId);
  if (state.activeTour) params.set('tour', state.activeTour);
  if (state.view === 'agent' && (state.selectedCode.path || state.selectedCode.symbol)) {
    if (state.selectedCode.repo) params.set('repo', state.selectedCode.repo);
    if (state.selectedCode.path) params.set('path', state.selectedCode.path);
    if (state.selectedCode.line) params.set('line', String(state.selectedCode.line || 1));
    if (state.selectedCode.symbol) params.set('symbol', state.selectedCode.symbol);
    if (state.selectedCode.radius && state.selectedCode.radius !== 20) params.set('radius', String(state.selectedCode.radius));
    if (state.selectedCode.limit && state.selectedCode.limit !== 20) params.set('limit', String(state.selectedCode.limit));
  }
  history.replaceState(null, '', `#${params.toString()}`);
}

function render() {
  if (!state.model) return;
  ensureSelectedFinding();
  const selected = selectedComponent();
  app.innerHTML = `
    <header class="topbar">
      ${renderBrand()}
      ${renderSearch()}
      ${renderNav()}
    </header>
    <main class="workspace">
      ${renderHero(selected)}
      ${renderView(selected)}
    </main>
    <footer class="footer">
      <span>${escapeHtml(shortPath(state.model.corpus.manifest_path || state.model.corpus.id || 'local bundle'))}</span>
      <span>${state.model.generatedAt ? `Generated ${escapeHtml(formatDate(state.model.generatedAt))}` : 'Local-first bundle'}</span>
    </footer>
    ${state.toast ? `<div class="toast" role="status">${escapeHtml(state.toast)}</div>` : ''}
  `;
  bindEvents();
  updateHash();
  maybeLoadSelectedCodeFromRoute(selected);
}

function renderBrand() {
  return `
    <div class="brand-lockup">
      <div class="brand-mark" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <div>
        <div class="brand-title">Portolan</div>
        <div class="brand-subtitle">Enterprise landscape atlas</div>
      </div>
    </div>
  `;
}

function renderSearch() {
  const results = state.query ? searchResults(state.query).slice(0, 8) : [];
  return `
    <div class="command-center">
      <label class="sr-only" for="global-search">Search landscape</label>
      <input id="global-search" type="search" value="${escapeAttr(state.query)}"
        placeholder="Search component, issue, wiki, finding..."
        autocomplete="off">
      ${state.query ? `
        <div class="search-popover" role="listbox" aria-label="Landscape search results">
          ${results.length ? results.map(renderSearchResult).join('') : `<div class="empty-row">${state.searchLoading ? 'Searching source index...' : 'No landscape result'}</div>`}
        </div>
      ` : ''}
    </div>
  `;
}

function renderSearchResult(result) {
  return `
    <button type="button" class="search-result" data-action="${result.action}"
      ${result.target ? `data-target="${escapeAttr(result.target)}"` : ''}
      ${result.repo ? `data-repo="${escapeAttr(result.repo)}"` : ''}
      ${result.edge ? `data-edge="${escapeAttr(result.edge)}"` : ''}
      ${result.cluster ? `data-cluster="${escapeAttr(result.cluster)}"` : ''}
      ${result.finding ? `data-finding="${escapeAttr(result.finding)}"` : ''}
      ${result.path ? `data-path="${escapeAttr(result.path)}"` : ''}
      ${result.line ? `data-line="${escapeAttr(result.line)}"` : ''}
      ${result.view ? `data-view="${escapeAttr(result.view)}"` : ''}>
      <span class="search-kind">${escapeHtml(result.kind)}</span>
      <strong>${highlight(result.title, state.query)}</strong>
      <span>${highlight(result.meta || '', state.query)}</span>
    </button>
  `;
}

function renderNav() {
  const views = [
    ['atlas', 'Atlas'],
    ['risks', 'Risks'],
    ['sources', 'Sources'],
    ['agent', 'Agent loop'],
    ['graph', 'Edges'],
  ];
  return `
    <nav class="view-nav" aria-label="Viewer sections">
      ${views.map(([id, label]) => `
        <button type="button" class="view-tab ${state.view === id ? 'is-active' : ''}" data-action="view" data-view="${id}">
          ${label}
        </button>
      `).join('')}
    </nav>
  `;
}

function renderHero(selected) {
  const model = state.model;
  const metrics = captainMetrics(model);
  const targetTitle = landscapeTitle(model);
  const targetDetail = landscapeDetail(model, targetTitle);
  return `
    <section class="hero-panel captain-hero">
      <div class="hero-copy">
        <p class="product-line">Captain atlas / local bundle</p>
        <h1>${escapeHtml(targetTitle)}</h1>
        <p>
          ${targetDetail ? `${escapeHtml(targetDetail)}. ` : ''}Desktop-first map of the loaded target: repositories, components, relationships,
          risks, files and known gaps stay local and queryable from the same bundle.
        </p>
      </div>
      <div class="hero-metrics" aria-label="Bundle coverage">
        ${metric('Repos', metrics.repos, 'visible')}
        ${metric('Components', metrics.components, 'mapped')}
        ${metric('Relations', metrics.relationships, 'records')}
        ${metric('Risks', metrics.risks, 'hotspots')}
        ${metric('Gaps', metrics.gaps, 'explicit')}
      </div>
      <div class="hero-selected">
        <span>Selected component</span>
        <strong>${escapeHtml(selected.label || 'Landscape')}</strong>
        <em>${escapeHtml(selected.role || 'target')}</em>
      </div>
    </section>
  `;
}

function captainMetrics(model) {
  const repoCount = model.coverage.repo_count || new Set(model.components.map((component) => component.repoId).filter(Boolean)).size;
  const relationshipCount = (model.relationships || []).length || model.edges.length + model.relationshipEdges.length;
  const gapCount =
    (model.gaps || []).length +
    (numberFrom(model.coverage.cannot_verify_surface_routes, 0) > 0 ? 1 : 0) +
    (model.coverage.runtime_topology === 'not_assessed' ? 1 : 0);
  return {
    repos: repoCount || model.components.length,
    components: model.components.length,
    relationships: relationshipCount || model.relationships.length,
    risks: numberFrom(model.manifest.hotspots_total, 0) || (model.hotspots || []).length || model.clusters.length,
    gaps: gapCount,
  };
}

function metric(label, value, sublabel) {
  return `
    <div class="metric-card">
      <span>${escapeHtml(label)}</span>
      <strong>${formatNumber(value)}</strong>
      <em>${escapeHtml(sublabel)}</em>
    </div>
  `;
}

function renderView(selected) {
  if (state.view === 'risks') return renderRisksView(selected);
  if (state.view === 'sources') return renderSourcesView(selected);
  if (state.view === 'agent') return renderAgentView(selected);
  if (state.view === 'graph') return renderGraphView(selected);
  return renderAtlasView(selected);
}

function renderAtlasView(selected) {
  return `
    ${renderCaptainAtlasShell(selected)}
    ${renderAtlasCockpit(selected)}
    ${renderExecutiveBriefing(selected)}
    <section class="atlas-grid atlas-grid--support">
      <aside class="left-rail">
        ${renderGuidedTour()}
        ${renderAtlasLoop()}
        ${renderQuestionStack()}
      </aside>
      <section class="canvas-stage detail-stage" aria-label="Selected map intelligence">
        <div class="stage-head">
          <div>
            <p class="section-kicker">Drill-down context</p>
            <h2>Why this object matters</h2>
          </div>
          <div class="stage-legend">
            <span><i class="dot dot-source"></i> source</span>
            <span><i class="dot dot-meta"></i> metadata</span>
            <span><i class="dot dot-gap"></i> gap</span>
          </div>
        </div>
        ${renderMapIntelligence(selected)}
      </section>
      <aside class="inspector">
        ${renderInspector(selected)}
      </aside>
    </section>
    ${renderPromotionHealthPanel()}
  `;
}

function renderCaptainAtlasShell(selected) {
  return `
    <section class="captain-atlas-shell" aria-label="Captain atlas explorer">
      <aside class="captain-brief-panel">
        ${renderCaptainBrief(selected)}
      </aside>
      <section id="atlas-map-stage" class="canvas-stage captain-map-stage" aria-label="Landscape map">
        <div class="stage-head">
          <div>
            <p class="section-kicker">Map / explore</p>
            <h2>Repos, components, relationships</h2>
          </div>
          <div class="stage-legend">
            <span><i class="dot dot-source"></i> source</span>
            <span><i class="dot dot-meta"></i> metadata</span>
            <span><i class="dot dot-risk"></i> risk</span>
            <span><i class="dot dot-gap"></i> gap</span>
          </div>
        </div>
        ${renderLandscapeMap()}
      </section>
      <aside class="captain-detail-panel">
        ${renderSelectionDetail(selected, selectedEdge())}
      </aside>
    </section>
  `;
}

function renderCaptainBrief(selected) {
  const model = state.model;
  const topRisks = [...(model.clusters || [])].slice(0, 3);
  const topGaps = visibleGapsForCaptain(selected).slice(0, 3);
  const firstInspection = firstInspectionRows(selected).slice(0, 3);
  const heavyLoading = state.heavyLoad.status === 'loading';
  const knownHotspots = numberFrom(model.manifest.hotspots_total, numberFrom(model.manifest.hotspot_count, 0));
  const knownGaps = numberFrom(model.manifest.gaps_total, numberFrom(model.manifest.gap_count, topGaps.length));
  const riskDetail = heavyLoading
    ? `${formatNumber(knownHotspots)} hotspot rows loading`
    : `${formatNumber((model.hotspots || []).length)} hotspot rows`;
  const gapDetail = heavyLoading
    ? `${formatNumber(knownGaps)} explicit gaps loading`
    : `${formatNumber(topGaps.length)} selected gaps`;
  const routeRows = [
    ['Map', 'Click nodes or edges', '#atlas-map-stage'],
    ['Risk', riskDetail, 'risks'],
    ['Source', `${formatNumber(selected.contentRoutes.length)} selected routes`, 'sources'],
    ['Agent', 'Copy bounded queries', 'agent'],
  ];
  return `
    <section class="captain-card">
      <span class="section-kicker">Start here</span>
      <h2>Landscape orientation</h2>
      <p>The captain view starts with the target map. Select a node or edge to see facts, risks, files, gaps and agent drill-down routes.</p>
      <div class="captain-route-list">
        ${routeRows.map(([label, detail, target]) => `
          <button type="button" data-action="${String(target).startsWith('#') ? 'scroll' : 'view'}"
            ${String(target).startsWith('#') ? `data-scroll-target="${escapeAttr(target)}" data-view="atlas"` : `data-view="${escapeAttr(target)}"`}>
            <strong>${escapeHtml(label)}</strong>
            <span>${escapeHtml(detail)}</span>
          </button>
        `).join('')}
      </div>
    </section>
    <section class="captain-card" data-testid="captain-first-inspection">
      <div class="section-row">
        <h3>First inspection</h3>
        <span>${formatNumber(firstInspection.length)}</span>
      </div>
      <div class="captain-mini-list">
        ${firstInspection.length ? firstInspection.map(renderInspectionMini).join('') : '<p class="empty-copy">No prioritized inspection route recorded yet.</p>'}
      </div>
    </section>
    <section class="captain-card">
      <div class="section-row">
        <h3>Top risks</h3>
        <span>${formatNumber(topRisks.length)}</span>
      </div>
      <div class="captain-mini-list" data-testid="captain-top-risks">
        ${topRisks.length ? topRisks.map(renderRiskMini).join('') : `<p class="empty-copy">${heavyLoading ? `Loading bounded hotspot sample from ${formatNumber(knownHotspots)} manifest row(s).` : 'No risk proven in bounded hotspot sample.'}</p>`}
      </div>
    </section>
    <section class="captain-card">
      <div class="section-row">
        <h3>Landscape gaps</h3>
        <span>${heavyLoading ? gapDetail : formatNumber(topGaps.length)}</span>
      </div>
      <div class="captain-mini-list" data-testid="captain-global-gaps">
        ${topGaps.length ? topGaps.map(renderGapMini).join('') : `<p class="empty-copy">${heavyLoading ? `Loading bounded gap sample from ${formatNumber(knownGaps)} manifest gap(s).` : 'No landscape gap recorded.'}</p>`}
      </div>
    </section>
  `;
}

function firstInspectionRows(selected) {
  const risks = [...(state.model.clusters || [])].slice(0, 2).map((risk) => ({
    kind: 'Risk',
    title: cleanFindingSummary(risk.summary),
    detail: riskWhyItMatters(risk),
    action: 'cluster',
    view: 'risks',
    cluster: risk.id,
    finding: risk.samples?.[0]?.id || '',
  }));
  const gaps = visibleGapsForCaptain(selected).slice(0, 2).map((gap) => {
    const target = componentForGap(gap);
    return {
      kind: gap.evidence_state || gap.status || gap.state || 'Gap',
      title: gap.subject || gap.surface || gap.layer || gap.id || 'visibility gap',
      detail: gap.summary || gap.detail || gap.reason || 'Missing or weak landscape evidence.',
      action: 'select-gap',
      view: 'graph',
      target: target?.targetId || '',
    };
  });
  return [...risks, ...gaps].slice(0, 3);
}

function renderInspectionMini(row) {
  const attrs = [
    `data-action="${escapeAttr(row.action || 'view')}"`,
    row.view ? `data-view="${escapeAttr(row.view)}"` : '',
    row.cluster ? `data-cluster="${escapeAttr(row.cluster)}"` : '',
    row.finding ? `data-finding="${escapeAttr(row.finding)}"` : '',
    row.target ? `data-target="${escapeAttr(row.target)}"` : '',
  ].filter(Boolean).join(' ');
  return `
    <button type="button" class="inspection-mini" ${attrs}>
      <span>${escapeHtml(row.kind || 'Inspect')}</span>
      <strong>${escapeHtml(row.title || 'Open atlas detail')}</strong>
      <em>${escapeHtml(row.detail || 'Open the bounded drill-down route.')}</em>
    </button>
  `;
}

function renderRiskMini(risk) {
  const affected = risk.repos?.length || uniqueStrings((risk.samples || []).map((sample) => sample.targetId || sample.repo_id || sample.repo)).length;
  const sample = risk.samples?.[0] || {};
  const file = (sample.paths || [sample.path, sample.file, sample.source_path]).filter(Boolean)[0] || '';
  return `
    <button type="button" class="risk-mini" data-action="cluster" data-cluster="${escapeAttr(risk.id)}" data-view="risks"
      ${sample.id ? `data-finding="${escapeAttr(sample.id)}"` : ''}>
      <span>${escapeHtml(risk.severity || risk.kind || 'risk')} / ${formatNumber(affected)} affected</span>
      <strong>${escapeHtml(cleanFindingSummary(risk.summary))}</strong>
      <em>${escapeHtml(`${riskWhyItMatters(risk)}${file ? ` First file: ${shortPath(file)}.` : ''}`)}</em>
    </button>
  `;
}

function riskWhyItMatters(risk) {
  const kind = String(risk.kind || '').toLowerCase();
  if (kind.includes('config')) return 'Why it matters: configuration changes can alter runtime behavior outside application code.';
  if (kind.includes('duplicate') || kind.includes('clone')) return 'Why it matters: repeated logic raises maintenance and drift risk.';
  if (kind.includes('dependency')) return 'Why it matters: shared or unmanaged dependencies create coupling across repos.';
  if (kind.includes('security') || kind.includes('semgrep')) return 'Why it matters: static findings may expose exploitable behavior or unsafe defaults.';
  return 'Why it matters: this cluster is a high-signal place to inspect first.';
}

function renderSelectionDetail(component, edge) {
  if (edge) return renderEdgeSelectionDetail(edge);
  return renderComponentSelectionDetail(component);
}

function renderComponentSelectionDetail(component) {
  const topFindings = (component.findingsList || []).slice(0, 4);
  const files = fileTrailForComponent(component).slice(0, 5);
  const gaps = visibleGapsForComponent(component).slice(0, 4);
  const edges = connectedEdgesForComponent(component).slice(0, 5);
  const reportLinks = reportAnchorsForSelection({ component }).slice(0, 3);
  const heavyLoading = state.heavyLoad.status === 'loading';
  return `
    <section class="selection-card">
      <div class="selection-head">
        <span class="section-kicker">Selected node</span>
        <h2>${escapeHtml(component.label || 'Landscape')}</h2>
        <p>${escapeHtml(component.summary || component.role || 'Repository or component from the local atlas bundle.')}</p>
      </div>
      <div class="fact-grid selection-facts">
        ${smallFact('Repo', component.repoId || 'unknown')}
        ${smallFact('Files', formatNumber(component.files))}
        ${smallFact('Risks', formatNumber(component.findings))}
        ${smallFact('Edges', `${formatNumber(component.depsIn + component.depsOut + component.relationshipRecords)}`)}
      </div>
      <p class="selection-context-note">Facts, risks, gaps and files below are bounded atlas records for this selected node.</p>
      <div class="selection-section">
        <div class="section-row">
          <h3>Drill-down routes</h3>
          <span>node</span>
        </div>
        <div class="route-button-grid">
          <button type="button" data-action="view" data-view="sources">
            <strong>Open source surfaces</strong>
            <span>${formatNumber(component.contentRoutes.length)} routes</span>
          </button>
          <button type="button" data-action="view" data-view="risks">
            <strong>Inspect risk rows</strong>
            <span>${formatNumber(topFindings.length)} linked samples</span>
          </button>
          <button type="button" data-action="view" data-view="graph">
            <strong>Trace relationships</strong>
            <span>${formatNumber(edges.length)} nearby edges</span>
          </button>
          <button type="button" data-action="view" data-view="agent">
            <strong>Ask from bundle</strong>
            <span>bounded commands</span>
          </button>
        </div>
      </div>
      ${renderSelectionReportPanel(reportLinks)}
      <div class="selection-section">
        <div class="section-row">
          <h3>Relationship corridor</h3>
          <span>${formatNumber(edges.length)}</span>
        </div>
        <div class="edge-button-list">
          ${edges.length ? edges.map(renderEdgeButton).join('') : '<p class="empty-copy">No selected edge in this bundle.</p>'}
        </div>
      </div>
      <div class="selection-section">
        <div class="section-row">
          <h3>Risks</h3>
          <span>${formatNumber(topFindings.length)}</span>
        </div>
        <div class="mini-card-list">
          ${topFindings.length ? topFindings.map(renderFindingMini).join('') : `<p class="empty-copy">${heavyLoading ? 'Loading bounded hotspot sample; absence of node risk is not proven yet.' : 'No hotspot row linked to this node.'}</p>`}
        </div>
      </div>
      <div class="selection-section">
        <div class="section-row">
          <h3>Files</h3>
          <span>${formatNumber(files.length)}</span>
        </div>
        <div class="file-trail-list">
          ${files.length ? files.map((path) => renderFileTrail(path, component.repoId)).join('') : '<p class="empty-copy">No local file path recorded for this node.</p>'}
        </div>
      </div>
      <div class="selection-section">
        <div class="section-row">
          <h3>Gaps</h3>
          <span>${formatNumber(gaps.length)}</span>
        </div>
        <div class="captain-mini-list">
          ${gaps.length ? gaps.map(renderGapMini).join('') : `<p class="empty-copy">${heavyLoading ? 'Loading bounded gap sample; missing data near this node is still unknown.' : 'No selected gap recorded.'}</p>`}
        </div>
      </div>
    </section>
  `;
}

function renderEdgeSelectionDetail(edge) {
  const endpoints = edgeEndpointComponents(edge);
  const files = fileTrailForEdge(edge).slice(0, 5);
  const relationshipBacked = Boolean(edge.relationship || edge.relationship_semantics);
  const edgeApiRoute = relationshipBacked
    ? `/api/relationships${edge.kind ? `?type=${encodeURIComponent(edge.kind)}&limit=20` : '?limit=20'}`
    : `/api/atlas?section=edges${edge.from_target ? `&target=${encodeURIComponent(edge.from_target)}` : ''}&limit=20`;
  const edgeApiLabel = relationshipBacked ? 'Open relationship evidence API' : 'Open atlas edge evidence API';
  const reportLinks = reportAnchorsForSelection({ edge }).slice(0, 3);
  const risks = endpoints.flatMap((component) => component.findingsList || [])
    .sort(compareFindings)
    .slice(0, 4);
  const gaps = endpoints.flatMap((component) => visibleGapsForComponent(component))
    .filter(uniqueByGap)
    .slice(0, 4);
  const heavyLoading = state.heavyLoad.status === 'loading';
  const cohortSample = edge.relationship_semantics === 'cohort-sample';
  const endpointATerm = cohortSample ? 'Endpoint A' : 'From';
  const endpointBTerm = cohortSample ? 'Endpoint B' : 'To';
  const relationshipNote = cohortSample
    ? `This is a bounded display pair from a shared-evidence cohort, not a directed runtime call. The original record names ${formatNumber(edge.cohort_total || endpoints.length)} repo members; the map sampled ${formatNumber(edge.cohort_sampled || endpoints.length)}.`
    : 'Facts, risks, gaps and files below are bounded atlas records for this selected relationship.';
  return `
    <section class="selection-card selection-card--edge">
      <div class="selection-head">
        <span class="section-kicker">Selected relationship</span>
        <h2>${escapeHtml(edge.label || edge.id || 'relationship')}</h2>
        <p>${escapeHtml(edge.kind || 'relationship')} / ${escapeHtml(edge.evidence_state || 'unknown')}</p>
      </div>
      <div class="section-row">
        <h3>Endpoints</h3>
        <span>${formatNumber(endpoints.length)}</span>
      </div>
      <div class="endpoint-strip">
        ${endpoints.map((endpoint) => `
          <button type="button" data-action="select-component" data-target="${escapeAttr(endpoint.targetId)}">
            <span>${escapeHtml(endpoint.layer || 'component')}</span>
            <strong>${escapeHtml(endpoint.label)}</strong>
            <em>${escapeHtml(endpoint.repoId)}</em>
          </button>
        `).join('') || '<p class="empty-copy">Endpoint components were not resolved.</p>'}
      </div>
      <div class="fact-grid selection-facts">
        ${smallFact('Type', edge.kind || 'edge')}
        ${smallFact('State', edge.evidence_state || 'unknown')}
        ${smallFact('Risks', formatNumber(risks.length))}
        ${smallFact('Files', formatNumber(files.length))}
      </div>
      <p class="selection-context-note">${escapeHtml(relationshipNote)}</p>
      ${renderSelectionReportPanel(reportLinks)}
      <div class="selection-section">
        <div class="section-row">
          <h3>Drill-down routes</h3>
          <span>edge</span>
        </div>
        <div class="route-button-grid">
          <button type="button" data-action="view" data-view="graph">
            <strong>Open edge list</strong>
            <span>${escapeHtml(edge.kind || 'relationship')}</span>
          </button>
          <button type="button" data-action="view" data-view="risks">
            <strong>Inspect endpoint risks</strong>
            <span>${formatNumber(risks.length)} samples</span>
          </button>
          <button type="button" data-action="view" data-view="sources">
            <strong>Open endpoint sources</strong>
            <span>${formatNumber(endpoints.length)} repos</span>
          </button>
          <button type="button" data-action="view" data-view="agent">
            <strong>Ask from bundle</strong>
            <span>relationship query</span>
          </button>
          <a href="${escapeAttr(edgeApiRoute)}" target="_blank" rel="noreferrer">
            <strong>${escapeHtml(edgeApiLabel)}</strong>
            <span>${escapeHtml(edge.evidence_ref || edge.producer_ref || edge.source || 'atlas edge')}</span>
          </a>
        </div>
      </div>
      <div class="selection-section">
        <div class="section-row">
          <h3>Facts</h3>
          <span>${escapeHtml(edge.source || 'local bundle')}</span>
        </div>
        <dl class="edge-fact-list">
          <div><dt>${escapeHtml(endpointATerm)}</dt><dd>${escapeHtml(endpointLabel(edge.from_target, edge.from_repo))}</dd></div>
          <div><dt>${escapeHtml(endpointBTerm)}</dt><dd>${escapeHtml(endpointLabel(edge.to_target, edge.to_repo))}</dd></div>
          ${cohortSample ? `<div><dt>Cohort members</dt><dd>${formatNumber(edge.cohort_total || endpoints.length)}</dd></div>` : ''}
          ${cohortSample ? `<div><dt>Map sample</dt><dd>${formatNumber(edge.cohort_sampled || endpoints.length)} repos</dd></div>` : ''}
          <div><dt>Evidence</dt><dd>${escapeHtml(edge.evidence_state || 'unknown')}</dd></div>
          <div><dt>Source</dt><dd>${escapeHtml(shortPath(edge.evidence_ref || edge.source || edge.producer_ref || 'not recorded'))}</dd></div>
        </dl>
      </div>
      <div class="selection-section">
        <div class="section-row">
          <h3>Risks</h3>
          <span>${formatNumber(risks.length)}</span>
        </div>
        <div class="mini-card-list">
          ${risks.length ? risks.map(renderFindingMini).join('') : `<p class="empty-copy">${heavyLoading ? 'Loading bounded hotspot sample; endpoint risk is not proven absent yet.' : 'No endpoint hotspot row attached to this relationship.'}</p>`}
        </div>
      </div>
      <div class="selection-section">
        <div class="section-row">
          <h3>Files</h3>
          <span>${formatNumber(files.length)}</span>
        </div>
        <div class="file-trail-list">
          ${files.length ? files.map((path) => renderFileTrail(path, edge.from_repo || endpoints[0]?.repoId || '')).join('') : '<p class="empty-copy">No relationship file path recorded.</p>'}
        </div>
      </div>
      <div class="selection-section">
        <div class="section-row">
          <h3>Gaps</h3>
          <span>${formatNumber(gaps.length)}</span>
        </div>
        <div class="captain-mini-list">
          ${gaps.length ? gaps.map(renderGapMini).join('') : `<p class="empty-copy">${heavyLoading ? 'Loading bounded gap sample; endpoint gaps are still unknown.' : 'No endpoint gap recorded for this relationship.'}</p>`}
        </div>
      </div>
    </section>
  `;
}

function renderSelectionReportPanel(reportLinks) {
  return `
    <div class="selection-section selection-report-panel" data-testid="selection-report-panel">
      <div class="section-row">
        <h3>Report context</h3>
        <button type="button" class="link-button" data-action="scroll" data-view="atlas" data-scroll-target="[data-testid='report-anchor-list']">Back to report</button>
      </div>
      <div class="captain-mini-list">
        ${reportLinks.length ? reportLinks.map((anchor) => `
          <button type="button" data-action="${escapeAttr(anchor.action || 'select-component')}" data-view="atlas"
            ${anchor.targetId ? `data-target="${escapeAttr(anchor.targetId)}"` : ''}
            ${anchor.findingId ? `data-finding="${escapeAttr(anchor.findingId)}"` : ''}
            ${anchor.edgeId ? `data-edge="${escapeAttr(anchor.edgeId)}"` : ''}>
            <strong>${escapeHtml(anchor.title || 'Report item')}</strong>
            <span>${escapeHtml(anchor.meta || anchor.source || 'landscape report')}</span>
            <em>${escapeHtml(anchor.detail || anchor.source || 'linked report evidence')}</em>
          </button>
        `).join('') : '<p class="empty-copy">No landscape-report item is linked to this selected object yet.</p>'}
      </div>
    </div>
  `;
}

function reportAnchorsForSelection({ component = null, edge = null, finding = null } = {}) {
  const anchors = state.model.reportAnchors || [];
  const targetIds = new Set();
  const findingIds = new Set();
  const edgeIds = new Set();
  if (component?.targetId) {
    targetIds.add(component.targetId);
    (component.findingsList || []).forEach((row) => row.id && findingIds.add(row.id));
    connectedEdgesForComponent(component).forEach((row) => row.id && edgeIds.add(row.id));
  }
  if (edge?.id) {
    edgeIds.add(edge.id);
    if (edge.from_target) targetIds.add(edge.from_target);
    if (edge.to_target) targetIds.add(edge.to_target);
  }
  if (finding?.id) findingIds.add(finding.id);
  return anchors.filter((anchor) =>
    (anchor.targetId && targetIds.has(anchor.targetId)) ||
    (anchor.findingId && findingIds.has(anchor.findingId)) ||
    (anchor.edgeId && edgeIds.has(anchor.edgeId))
  );
}

function renderEdgeButton(edge) {
  const active = state.selectedEdgeId === edge.id;
  const endpoints = edgeEndpointComponents(edge);
  const cohortSample = edge.relationship_semantics === 'cohort-sample';
  const label = endpoints.length === 2
    ? (cohortSample ? `${endpoints[0].label} shares evidence with ${endpoints[1].label}` : `${endpoints[0].label} -> ${endpoints[1].label}`)
    : edge.label || edge.id;
  const meta = cohortSample
    ? `${edge.evidence_state || 'unknown'} / bounded cohort sample ${formatNumber(edge.cohort_sampled || endpoints.length)} of ${formatNumber(edge.cohort_total || endpoints.length)}`
    : edge.evidence_state || 'unknown';
  return `
    <button type="button" class="${active ? 'is-active' : ''}" data-action="select-edge" data-edge="${escapeAttr(edge.id)}">
      <span>${escapeHtml(edge.kind || 'relationship')}</span>
      <strong>${escapeHtml(label)}</strong>
      <em>${escapeHtml(meta)}</em>
    </button>
  `;
}

function renderGapMini(gap) {
  const target = componentForGap(gap);
  return `
    <button type="button" class="gap-mini" data-action="select-gap" data-view="graph"
      ${target ? `data-target="${escapeAttr(target.targetId)}"` : ''}>
      <span>${escapeHtml(gap.evidence_state || gap.status || gap.state || 'unknown')}</span>
      <strong>${escapeHtml(gap.subject || gap.surface || gap.layer || gap.id || 'gap')}</strong>
      <em>${escapeHtml(gap.summary || gap.detail || gap.reason || '')}</em>
    </button>
  `;
}

function renderFileTrail(pathValue, repoId) {
  const href = sourceHrefFor(pathValue, 1, repoId);
  const label = shortPath(pathValue);
  return href ? `
    <a href="${escapeAttr(href)}" target="_blank" rel="noreferrer">
      <span>file</span>
      <code>${escapeHtml(label)}</code>
    </a>
  ` : `
    <div>
      <span>file</span>
      <code>${escapeHtml(label || 'not recorded')}</code>
    </div>
  `;
}

function connectedEdgesForComponent(component) {
  if (!component) return [];
  return [...state.model.edges, ...state.model.relationshipEdges]
    .filter((edge) => edge.from_target === component.targetId || edge.to_target === component.targetId)
    .sort((a, b) => {
      const selectedDelta = (b.id === state.selectedEdgeId ? 1 : 0) - (a.id === state.selectedEdgeId ? 1 : 0);
      if (selectedDelta) return selectedDelta;
      return (a.kind || '').localeCompare(b.kind || '') || (a.label || '').localeCompare(b.label || '');
    });
}

function edgeEndpointComponents(edge) {
  if (!edge) return [];
  return [edge.from_target, edge.to_target]
    .map((targetId) => state.model.componentByTarget.get(targetId))
    .filter(Boolean);
}

function fileTrailForComponent(component) {
  const paths = [
    component.profile?.path,
    ...(component.findingsList || []).flatMap((finding) => finding.paths || []),
    ...(component.contentRoutes || []).flatMap((route) => [route.path, route.source_path, route.local_path]),
    ...(component.facts || []).flatMap((fact) => [fact.path, fact.source_path, fact.file]),
  ];
  return uniqueStrings(paths).slice(0, 12);
}

function fileTrailForEdge(edge) {
  const rel = edge.relationship || {};
  const endpoints = edgeEndpointComponents(edge);
  const direct = [
    edge.path,
    edge.file,
    edge.source_path,
    edge.manifest_path,
    edge.producer_ref,
    edge.source,
    rel.path,
    rel.file,
    rel.source_path,
    rel.producer_ref,
    ...(edge.paths || []),
    ...(rel.paths || []),
    ...(rel.evidence_refs || []),
  ];
  const endpointSamples = endpoints.flatMap((component) =>
    (component.findingsList || []).flatMap((finding) => finding.paths || []).slice(0, 3)
  );
  return uniqueStrings([...direct, ...endpointSamples]).slice(0, 12);
}

function visibleGapsForComponent(component) {
  if (!component) return [];
  const keys = [component.targetId, component.repoId, component.label, component.name]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  const fromGapRows = (state.model.gaps || []).filter((gap) => {
    const text = [
      gap.id,
      gap.subject,
      gap.surface,
      gap.layer,
      gap.summary,
      gap.detail,
      gap.reason,
    ].join(' ').toLowerCase();
    return keys.some((key) => key && text.includes(key));
  }).map((gap) => ({ ...gap, target_id: gap.target_id || component.targetId }));
  const fromSurfaceRoutes = (component.surfaceRoutes || [])
    .filter((route) => {
      const stateValue = route.evidence_state || route.route_state || route.state || '';
      return ['missing', 'unknown', 'cannot_verify', 'not_assessed'].includes(String(stateValue).toLowerCase());
    })
    .map((route) => ({
      id: `route-gap:${component.targetId}:${route.slot || route.label}`,
      target_id: component.targetId,
      subject: route.label || route.route_label || route.slot || 'surface',
      evidence_state: route.evidence_state || route.route_state || route.state || 'unknown',
      summary: route.reason || `${component.label} has weak or missing ${route.slot || 'surface'} route.`,
    }));
  const globalRuntimeGap = state.model.coverage.runtime_topology === 'not_assessed'
    ? [{
        id: 'runtime-topology-not-assessed',
        target_id: component.targetId,
        subject: 'runtime topology',
        evidence_state: 'not_assessed',
        summary: 'Runtime calls and deployment topology are not proven by this local bundle.',
      }]
    : [];
  return [...fromSurfaceRoutes, ...fromGapRows, ...globalRuntimeGap].filter(uniqueByGap);
}

function visibleGapsForCaptain(selected) {
  const selectedGaps = visibleGapsForComponent(selected);
  const globalRows = [...(state.model.gaps || [])].map((gap) => ({ ...gap }));
  const coverageRows = [];
  if (state.model.coverage.runtime_topology === 'not_assessed') {
    coverageRows.push({
      id: 'runtime-topology-not-assessed',
      subject: 'runtime topology',
      evidence_state: 'not_assessed',
      summary: 'Runtime calls and deployment topology are not proven by this local bundle.',
    });
  }
  const cannotVerifyRoutes = numberFrom(state.model.coverage.cannot_verify_surface_routes, 0);
  if (cannotVerifyRoutes > 0) {
    coverageRows.push({
      id: 'cannot-verify-surface-routes',
      subject: 'surface routes',
      evidence_state: 'cannot_verify',
      summary: `${cannotVerifyRoutes} mapped surface route(s) need manual or authenticated verification.`,
    });
  }
  return [...selectedGaps, ...globalRows, ...coverageRows]
    .filter(uniqueByGap)
    .sort(compareGapsForCaptain);
}

function uniqueByGap(gap, index, items) {
  const key = [gap.id, gap.subject, gap.surface, gap.summary, gap.evidence_state || gap.status || gap.state].join('|');
  return items.findIndex((item) =>
    [item.id, item.subject, item.surface, item.summary, item.evidence_state || item.status || item.state].join('|') === key
  ) === index;
}

function compareGapsForCaptain(a, b) {
  const rank = { cannot_verify: 5, not_assessed: 4, unknown: 3, partial: 2, missing: 2 };
  const aState = String(a.evidence_state || a.status || a.state || '').toLowerCase();
  const bState = String(b.evidence_state || b.status || b.state || '').toLowerCase();
  return (rank[bState] || 1) - (rank[aState] || 1) ||
    String(a.subject || a.surface || a.layer || '').localeCompare(String(b.subject || b.surface || b.layer || ''));
}

function compareFindings(a, b) {
  const rank = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
  return (rank[String(b.severity || '').toLowerCase()] || 0) -
    (rank[String(a.severity || '').toLowerCase()] || 0);
}

function endpointLabel(targetId, repoId) {
  const component = state.model.componentByTarget.get(targetId) || state.model.componentByRepo.get(repoId);
  return component ? `${component.label} (${component.repoId})` : targetId || repoId || 'unknown';
}

function componentForGap(gap) {
  if (!gap || !state.model) return null;
  const targetId = gap.target_id || gap.targetId || gap.component_id || gap.target || '';
  const repoId = gap.repo_id || gap.repo || '';
  if (targetId && state.model.componentByTarget.has(targetId)) return state.model.componentByTarget.get(targetId);
  if (repoId && state.model.componentByRepo.has(repoId)) return state.model.componentByRepo.get(repoId);
  const text = [
    gap.id,
    gap.subject,
    gap.surface,
    gap.layer,
    gap.summary,
    gap.detail,
    gap.reason,
  ].join(' ').toLowerCase();
  return state.model.components.find((component) => {
    const keys = [component.targetId, component.repoId]
      .filter((key) => String(key || '').length >= 3)
      .map((key) => String(key).toLowerCase());
    return keys.some((key) => text.includes(key));
  }) || null;
}

function prioritizeMapEdges(edges, selectedTargetId, selectedEdgeId, limit) {
  const selected = [];
  const related = [];
  const rest = [];
  for (const edge of edges || []) {
    if (edge.id === selectedEdgeId) selected.push(edge);
    else if (edge.from_target === selectedTargetId || edge.to_target === selectedTargetId) related.push(edge);
    else rest.push(edge);
  }
  return uniqueEdges([...selected, ...related, ...rest]).slice(0, limit);
}

function uniqueEdges(edges) {
  const seen = new Set();
  return (edges || []).filter((edge) => {
    const key = edge.id || [edge.from_target, edge.to_target, edge.kind, edge.label].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueStrings(values) {
  const seen = new Set();
  return (values || [])
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

function renderPromotionHealthPanel() {
  const model = state.model;
  const health = model.promotionHealth || [];
  const promotionCounts = model.manifest?.promotion_health || {};
  const heavyLoading = state.heavyLoad.status === 'loading';
  const knownHealthRows = numberFrom(promotionCounts.health_count, numberFrom(promotionCounts.promotion_health_count, health.length));
  if (!health.length && !heavyLoading && !Object.keys(promotionCounts).length) return '';
  const statusPriority = {
    cannot_verify: 0,
    not_integrated: 1,
    not_assessed: 2,
    polluted_by_non_source: 3,
    dominated_by_fixture_data: 4,
    oversized: 5,
    stale: 6,
    inventory_mismatch: 7,
    non_exhaustive: 8,
    partial: 9,
    raw_available_only: 10,
    unsupported_language: 11,
    ok: 12,
  };
  const rows = [...health]
    .sort((a, b) =>
      (statusPriority[a.status] ?? 20) - (statusPriority[b.status] ?? 20) ||
      String(a.family || '').localeCompare(String(b.family || ''))
    )
    .slice(0, 8);
  const counts = countBy(health, (row) => row.status || 'unknown');
  if (!health.length && heavyLoading) {
    counts.loading = knownHealthRows || 1;
  }
  return `
    <section class="briefing-board" aria-label="Promotion health">
      <article class="brief-card brief-card--shape">
        <div class="brief-head">
          <span class="section-kicker">Promotion health</span>
          <h2>What can become atlas truth</h2>
        </div>
        <div class="evidence-chips">
          ${Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)).map(([status, count]) =>
            `<span>${escapeHtml(status)} ${formatNumber(count)}</span>`
          ).join('')}
        </div>
        <p>${heavyLoading && !health.length
          ? 'Promotion health is loading as a bounded query sample. Until it arrives, pollution, fixture dominance and oversized strata are not proven absent.'
          : 'Facts, claims, source roles and raw artifacts stay in separate strata. Weak families qualify the atlas before hotspots are ranked.'}</p>
      </article>
      <article class="brief-card">
        <div class="section-row">
          <h3>Weakest families</h3>
          <span>${heavyLoading && !health.length ? 'loading bounded health rows' : `${formatNumber(health.length)} health rows`}</span>
        </div>
        <div class="brief-list">
          ${rows.length ? rows.map((row) => `
            <button type="button" data-action="view" data-view="agent">
              <strong>${escapeHtml(row.family || row.id || 'family')}</strong>
              <span>${escapeHtml(row.status || 'unknown')} / ${escapeHtml(row.fact_kind || 'family_route')}</span>
              <em>${escapeHtml(row.reason || row.calculation_rule || '')}</em>
            </button>
          `).join('') : '<p class="empty-copy">Loading promotion-health rows; degraded states are unknown until the bounded query returns.</p>'}
        </div>
      </article>
      <article class="brief-card">
        <div class="section-row">
          <h3>Drill-down refs</h3>
          <span>queryable strata</span>
        </div>
        <div class="brief-list">
          ${[
            ['classified-sources', numberFrom(promotionCounts.classified_source_count, model.classifiedSources.length), 'source roles'],
            ['promoted-facts', numberFrom(promotionCounts.promoted_fact_count, model.promotedFacts.length), 'facts and claims'],
            ['raw-artifacts', numberFrom(promotionCounts.raw_artifact_count, model.rawArtifacts.length), 'lazy raw refs'],
            ['promotion-health', health.length, 'family health'],
          ].map(([family, count, label]) => `
            <button type="button" data-action="view" data-view="agent">
              <strong>${escapeHtml(family)}</strong>
              <span>${formatNumber(count)} ${escapeHtml(label)}</span>
              <em>portolan-bundle-query ${escapeHtml(family)}</em>
            </button>
          `).join('')}
        </div>
      </article>
    </section>
  `;
}

function renderExecutiveBriefing(selected) {
  const insights = state.model.insights;
  const briefActions = executiveBriefActions(insights);
  const reportAnchors = state.model.reportAnchors || [];
  const maxLayerFindings = Math.max(...insights.layerShape.map((item) => item.findings), 1);
  const maxPressure = Math.max(...insights.pressure.map((item) => item.medium), 1);
  return `
    <section class="briefing-board" aria-label="Executive landscape briefing">
      <article class="brief-card brief-card--shape">
        <div class="brief-head">
          <span class="section-kicker">Executive brief</span>
          <h2>What the atlas says first</h2>
        </div>
        <div class="evidence-chips">
          ${insights.evidenceSummary.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}
        </div>
        <p>The current view is derived from local bundle artifacts. Runtime topology and live ownership stay outside the claim until captured.</p>
        ${briefActions.length ? `
          <div class="brief-next">
            ${briefActions.map((item) => {
              return `
              <button type="button" data-action="${escapeAttr(item.action)}" data-view="${escapeAttr(item.view)}"
                ${item.findingId ? `data-finding="${escapeAttr(item.findingId)}"` : ''}>
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml(item.meta)}</span>
                <em>${escapeHtml(item.detail)}</em>
              </button>
            `;
            }).join('')}
          </div>
        ` : ''}
      </article>
      <article class="brief-card">
        <div class="section-row">
          <h3>Report drill-down</h3>
          <span>${formatNumber(reportAnchors.length)} anchors</span>
        </div>
        <div class="brief-list report-anchor-list" data-testid="report-anchor-list">
          ${reportAnchors.length
            ? reportAnchors.slice(0, 4).map(renderReportAnchor).join('')
            : '<p class="empty-copy">No report item could be linked to a map object yet.</p>'}
        </div>
      </article>
      <article class="brief-card">
        <div class="section-row">
          <h3>System shape</h3>
          <span>${formatNumber(state.model.components.length)} repos</span>
        </div>
        <div class="shape-bars">
          ${insights.layerShape.map((layer) => `
            <div>
              <span>${escapeHtml(layer.title)}</span>
              <i><b style="width:${Math.max(6, (layer.findings / maxLayerFindings) * 100)}%"></b></i>
              <strong>${layer.count}</strong>
            </div>
          `).join('')}
        </div>
      </article>
      <article class="brief-card">
        <div class="section-row">
          <h3>Architecture anchors</h3>
          <span>deps + relations</span>
        </div>
        <div class="brief-list">
          ${insights.anchors.slice(0, 4).map((component) => `
            <button type="button" data-action="select-component" data-target="${escapeAttr(component.targetId)}">
              <strong>${escapeHtml(component.label)}</strong>
              <span>${component.depsIn}/${component.depsOut} deps, ${component.relationshipRecords} relations</span>
            </button>
          `).join('')}
        </div>
      </article>
      <article class="brief-card">
        <div class="section-row">
          <h3>Inspection pressure</h3>
          <span>medium findings</span>
        </div>
        <div class="pressure-list">
          ${insights.pressure.slice(0, 4).map((component) => `
            <button type="button" class="${component.targetId === selected.targetId ? 'is-active' : ''}"
              data-action="select-component" data-target="${escapeAttr(component.targetId)}">
              <span>${escapeHtml(component.label)}</span>
              <i><b style="width:${Math.max(6, (component.medium / maxPressure) * 100)}%"></b></i>
              <strong>${formatNumber(component.medium)}</strong>
            </button>
          `).join('')}
        </div>
      </article>
    </section>
  `;
}

function renderReportAnchor(anchor) {
  const action = anchor.action || 'select-component';
  return `
    <button type="button" class="report-anchor" data-action="${escapeAttr(action)}" data-view="atlas"
      data-scroll-target="#atlas-map-stage"
      ${anchor.targetId ? `data-target="${escapeAttr(anchor.targetId)}"` : ''}
      ${anchor.findingId ? `data-finding="${escapeAttr(anchor.findingId)}"` : ''}
      ${anchor.edgeId ? `data-edge="${escapeAttr(anchor.edgeId)}"` : ''}>
      <strong>${escapeHtml(anchor.title || 'Report item')}</strong>
      <span>${escapeHtml(anchor.meta || anchor.source || 'landscape report')}</span>
      <em>Show on map</em>
    </button>
  `;
}

function executiveBriefActions(insights) {
  const actions = [];
  for (const group of (insights.nextStepGroups || []).slice(0, 2)) {
    const repoText = group.repos.length ? ` / ${group.repos.slice(0, 3).join(', ')}` : '';
    actions.push({
      action: group.findingId && state.model.findingById.has(group.findingId) ? 'select-finding' : 'view',
      view: 'risks',
      findingId: group.findingId || '',
      title: group.summary,
      meta: `${formatNumber(group.count)} report samples${repoText}`,
      detail: group.severity ? `${group.kind} / ${group.severity}` : group.kind,
    });
  }

  if (state.model.coverage.runtime_topology === 'not_assessed') {
    actions.push({
      action: 'view',
      view: 'graph',
      findingId: '',
      title: 'Runtime topology not assessed',
      meta: 'service calls and production deployment are not in this local bundle',
      detail: 'visibility gap',
    });
  }

  const cannotVerifyRoutes = numberFrom(state.model.coverage.cannot_verify_surface_routes, 0);
  if (cannotVerifyRoutes > 0) {
    actions.push({
      action: 'view',
      view: 'sources',
      findingId: '',
      title: 'Public surface readability is partial',
      meta: `${formatNumber(cannotVerifyRoutes)} route(s) remain cannot_verify`,
      detail: 'surface gap',
    });
  }

  if (actions.length < 3 && (insights.sharedDependencies || []).length) {
    const hub = insights.sharedDependencies[0];
    actions.push({
      action: 'view',
      view: 'risks',
      findingId: '',
      title: 'Shared dependency pressure',
      meta: `${formatNumber((hub.repos || []).length)} repos touch ${hub.detail?.component || hub.summary || hub.id}`,
      detail: 'relationship hub',
    });
  }

  return actions.slice(0, 3);
}

function renderMapIntelligence(selected) {
  const depsIn = state.model.edges.filter((edge) => edge.to_target === selected.targetId);
  const depsOut = state.model.edges.filter((edge) => edge.from_target === selected.targetId);
  const relationshipCorridor = selectedRelationshipCorridor(selected).slice(0, 5);
  const layerShape = state.model.insights.layerShape || [];
  const activeLayer = layerShape.find((layer) => layer.id === selected.layer);
  const maxLayerFindings = Math.max(...layerShape.map((layer) => layer.findings), 1);
  const neighborEdges = [...depsOut.slice(0, 3), ...depsIn.slice(0, 2)];
  return `
    <section class="map-intel-strip" aria-label="Selected map context">
      <article class="map-intel-card map-intel-card--selected">
        <span>Selected node</span>
        <strong>${escapeHtml(selected.label)}</strong>
        <em>${escapeHtml(selected.role)} / ${escapeHtml(selected.evidenceState)}</em>
        <div class="map-intel-metrics">
          ${smallInlineMetric('Layer', compactLayerTitle(activeLayer?.title || selected.layer))}
          ${smallInlineMetric('Findings', formatNumber(selected.findings))}
          ${smallInlineMetric('Deps', `${selected.depsIn}/${selected.depsOut}`)}
        </div>
      </article>
      <article class="map-intel-card">
        <span>Dependency corridor</span>
        <strong>${depsIn.length} inbound / ${depsOut.length} outbound</strong>
        <div class="map-neighbor-list">
          ${neighborEdges.length ? neighborEdges.map((edge) => renderMapNeighbor(edge, selected)).join('') :
            '<p class="empty-copy">No manifest edge recorded for this node.</p>'}
        </div>
      </article>
      <article class="map-intel-card">
        <span>Relationship corridor</span>
        <strong>${formatNumber(selected.relationships.length)} records</strong>
        <div class="map-neighbor-list">
          ${relationshipCorridor.length ? relationshipCorridor.map((edge) => renderMapNeighbor(edge, selected)).join('') :
            '<p class="empty-copy">No shared-dependency or cross-repo relationship recorded for this node.</p>'}
        </div>
      </article>
      <article class="map-intel-card">
        <span>Layer pressure</span>
        <strong>${escapeHtml(activeLayer?.title || selected.layer)}</strong>
        <div class="map-layer-bars">
          ${layerShape.map((layer) => `
            <button type="button" class="${layer.id === selected.layer ? 'is-active' : ''}"
              data-action="layer-focus" data-layer="${escapeAttr(layer.id)}">
              <span>${escapeHtml(layer.title)}</span>
              <i><b style="width:${Math.max(5, (layer.findings / maxLayerFindings) * 100)}%"></b></i>
              <em>${formatNumber(layer.count)}</em>
            </button>
          `).join('')}
        </div>
      </article>
    </section>
  `;
}

function renderMapNeighbor(edge, selected) {
  const outbound = edge.from_target === selected.targetId;
  const targetId = outbound ? edge.to_target : edge.from_target;
  const component = state.model.componentByTarget.get(targetId);
  if (!component) return '';
  const relationDirection = edge.relationship_semantics === 'cohort-sample'
    ? 'shared'
    : outbound ? 'out' : 'in';
  return `
    <button type="button" data-action="${edge.id ? 'select-edge' : 'select-component'}"
      ${edge.id ? `data-edge="${escapeAttr(edge.id)}"` : `data-target="${escapeAttr(component.targetId)}"`}>
      <span>${escapeHtml(relationDirection)}</span>
      <strong>${escapeHtml(component.label)}</strong>
      <em>${escapeHtml(edge.evidence_state || edge.kind || 'edge')}</em>
    </button>
  `;
}

function smallInlineMetric(label, value) {
  return `
    <div>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
    </div>
  `;
}

function compactLayerTitle(value) {
  return String(value || '')
    .replace('Compute and SQL', 'Compute SQL')
    .replace('Integration', 'Integrate');
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function renderAtlasCockpit(selected) {
  const finding = activeFindingFor(selected);
  const sourcePath = finding ? (finding.paths || [])[0] || '' : '';
  return `
    <section class="cockpit-strip" aria-label="Atlas cockpit">
      <article class="cockpit-card">
        <span>1. Brief</span>
        <strong>Read the enterprise shape</strong>
        <em>${escapeHtml(state.model.insights.evidenceSummary.join(' / '))}</em>
      </article>
      <button type="button" class="cockpit-card cockpit-card--button" data-action="scroll"
        data-view="atlas" data-scroll-target="#atlas-map-stage">
        <span>2. Map</span>
        <strong>${escapeHtml(selected.label)}</strong>
        <em>${escapeHtml(selected.layer)} / ${formatNumber(selected.findings)} findings</em>
      </button>
      <button type="button" class="cockpit-card cockpit-card--button" data-action="${finding ? 'select-finding' : 'view'}"
        data-view="risks" ${finding ? `data-finding="${escapeAttr(finding.id)}"` : ''}>
        <span>3. Evidence</span>
        <strong>${finding ? escapeHtml(cleanFindingSummary(finding.summary || finding.id)) : 'No linked finding'}</strong>
        <em>${escapeHtml(sourcePath ? shortPath(sourcePath) : 'open risks for corpus-level clusters')}</em>
      </button>
      <button type="button" class="cockpit-card cockpit-card--button" data-action="view" data-view="agent">
        <span>4. Agent handoff</span>
        <strong>Open agent loop</strong>
        <em>repo, hotspots, source and claim-import commands</em>
      </button>
    </section>
  `;
}

function renderGuidedTour() {
  const tours = atlasTours(state.model);
  if (!tours.length) return '';
  const active = tours.find((tour) => tour.id === state.activeTour) || tours[0];
  return `
    <section class="rail-card">
      <div class="rail-head">
        <span class="section-kicker">Guided routes</span>
        <strong>${escapeHtml(active.title)}</strong>
        <em>${escapeHtml(active.summary)}</em>
      </div>
      <div class="tour-switcher">
        ${tours.map((tour) => `
          <button type="button" class="${tour.id === state.activeTour ? 'is-active' : ''}"
            data-action="tour" data-tour="${escapeAttr(tour.id)}">${escapeHtml(tour.id)}</button>
        `).join('')}
      </div>
      <ol class="tour-list">
        ${active.steps.map((target, index) => {
          const component = state.model.componentByTarget.get(target);
          if (!component) return '';
          return `
          <li>
            <button type="button" class="${state.selectedId === target ? 'is-active' : ''}"
              data-action="select-component" data-target="${target}">
              <span>${index + 1}</span>
              <strong>${escapeHtml(component.label)}</strong>
              <em>${escapeHtml(component.summary || component.role)}</em>
            </button>
          </li>
        `;
        }).join('')}
      </ol>
    </section>
  `;
}

function atlasTours(model) {
  const components = model.components || [];
  const uniqueTargets = (items) => uniqueStrings((items || [])
    .map((item) => item?.targetId || item)
    .filter((id) => model.componentByTarget.has(id)));
  const anchors = uniqueTargets(model.insights?.anchors).slice(0, 6);
  const pressure = uniqueTargets(model.insights?.pressure).slice(0, 6);
  const gapTargets = uniqueTargets(
    components
      .map((component) => ({ component, gaps: visibleGapsForComponent(component).length }))
      .filter((item) => item.gaps > 0)
      .sort((a, b) => b.gaps - a.gaps || b.component.findings - a.component.findings)
      .map((item) => item.component)
  ).slice(0, 6);
  const fallback = uniqueTargets(components.slice(0, 6));
  return [
    {
      id: 'shape',
      title: 'Landscape shape',
      summary: 'Start with the most connected components in this bundle.',
      steps: anchors.length ? anchors : fallback,
    },
    {
      id: 'risk',
      title: 'Risk route',
      summary: 'Inspect repos with the strongest local hotspot pressure.',
      steps: pressure.length ? pressure : anchors,
    },
    {
      id: 'gaps',
      title: 'Coverage gaps',
      summary: 'Check where local evidence is partial or cannot be verified.',
      steps: gapTargets.length ? gapTargets : anchors,
    },
  ].filter((tour) => tour.steps.length > 0);
}

function renderAtlasLoop() {
  return `
    <section class="rail-card rail-card--loop">
      <div class="rail-head">
        <span class="section-kicker">Atlas loop</span>
        <strong>Human map, agent memory</strong>
      </div>
      <div class="loop-steps">
        ${ATLAS_LOOP.map(([title, text], index) => `
          <div>
            <span>${index + 1}</span>
            <strong>${escapeHtml(title)}</strong>
            <em>${escapeHtml(text)}</em>
          </div>
        `).join('')}
      </div>
      <button type="button" class="primary-inline" data-action="view" data-view="agent">Open agent loop</button>
    </section>
  `;
}

function renderQuestionStack() {
  return `
    <section class="rail-card rail-card--questions">
      <div class="rail-head">
        <span class="section-kicker">Questions</span>
        <strong>What this report answers</strong>
      </div>
      <div class="question-stack">
        ${IMPORTANT_QUESTIONS.map((item) => `
          <button type="button" data-action="question" data-target="${item.target}">
            <strong>${escapeHtml(item.label)}</strong>
            <span>${escapeHtml(item.answer)}</span>
          </button>
        `).join('')}
      </div>
    </section>
  `;
}

function renderLandscapeMap() {
  const model = state.model;
  const selected = selectedComponent();
  const mapView = buildMapView(selected);
  const positions = mapView.positions;
  const hasEdges = mapView.totalEdges > 0;
  return `
    <div class="map-canvas atlas-network ${mapView.visibleComponents > 36 ? 'is-dense' : ''}" data-testid="atlas-map" data-map-mode="${escapeAttr(state.mapMode)}" data-map-layer="${escapeAttr(state.mapLayer || 'all')}">
      ${renderMapControls(mapView)}
      <div class="map-orbit" aria-hidden="true"></div>
      <div class="context-node network-context">
        <span>C1 enterprise landscape</span>
        <strong>${escapeHtml(landscapeTitle(model))}</strong>
        <em>${escapeHtml(landscapeDetail(model, landscapeTitle(model)) || model.corpus.purpose || 'Local multi-repo corpus with code, metadata and runtime surface gaps.')}</em>
      </div>
      <div class="domain-lanes" aria-hidden="true">
        ${LAYERS.map((layer) => `
          <div class="domain-lane lane-${layer.id}">
            <span>${escapeHtml(layer.title)}</span>
          </div>
        `).join('')}
      </div>
      <svg class="dependency-svg network-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Relationship edges">
        ${mapView.manifestEdges.map((edge) => renderEdge(edge, positions)).join('')}
        ${mapView.relationshipEdges.map((edge) => renderEdge(edge, positions, 'relationship-edge')).join('')}
      </svg>
      ${hasEdges ? renderFilteredMapEmpty(mapView) : '<div class="map-empty" data-testid="atlas-map-empty">No graph edge rows were present; the atlas is showing repository nodes only.</div>'}
      <div class="network-nodes">
        ${mapView.components.map((component) => renderComponentNode(component, mapView)).join('')}
      </div>
      <div class="edge-point-layer" aria-label="Clickable relationship edge points">
        ${[...mapView.manifestEdges, ...mapView.relationshipEdges].map((edge) => renderEdgePointButton(edge, positions)).join('')}
      </div>
      <div class="map-status" data-testid="atlas-map-counts">
        <span>${formatNumber(mapView.visibleComponents)} visible nodes</span>
        <span>${formatNumber(mapView.hiddenComponents)} hidden nodes</span>
        ${mapView.activeLayer ? `<span>${formatNumber(mapView.activeLayer.visible)}/${formatNumber(mapView.activeLayer.total)} ${escapeHtml(mapView.activeLayer.title)} nodes</span>` : ''}
        <span>${formatNumber(mapView.visibleEdges)} visible edges</span>
        <span>${formatNumber(mapView.hiddenEdges)} hidden edges</span>
        ${mapView.sampledCohorts > 0 ? `<span>${formatNumber(mapView.sampledCohorts)} bounded cohort samples</span>` : ''}
        <span>runtime topology ${escapeHtml(model.coverage.runtime_topology || 'not_assessed')}</span>
      </div>
    </div>
  `;
}

function renderMapControls(mapView) {
  const modes = [
    ['overview', 'Overview'],
    ['important', 'Important edges'],
    ['risks', 'Risks'],
  ];
  return `
    <div class="map-controls" data-testid="atlas-map-controls">
      <label class="map-search-control">
        <span>Search repos/components</span>
        <input id="map-search" type="search" value="${escapeAttr(state.mapQuery)}"
          placeholder="repo, component, relation"
          data-testid="atlas-map-search">
      </label>
      <div class="map-mode-control" role="group" aria-label="Map filter mode" data-testid="atlas-map-filter">
        ${modes.map(([mode, label]) => `
          <button type="button" class="${state.mapMode === mode ? 'is-active' : ''}"
            data-action="map-mode" data-mode="${mode}" aria-pressed="${state.mapMode === mode ? 'true' : 'false'}">
            ${escapeHtml(label)}
          </button>
        `).join('')}
      </div>
      <div class="map-layer-control" role="group" aria-label="Map layer drill-down" data-testid="atlas-map-layer-filter">
        <button type="button" class="${state.mapLayer ? '' : 'is-active'}"
          data-action="map-layer" data-layer="" aria-pressed="${state.mapLayer ? 'false' : 'true'}">
          All layers
        </button>
        ${mapView.layerSummaries.map((layer) => `
          <button type="button" class="${state.mapLayer === layer.id ? 'is-active' : ''}"
            data-action="map-layer" data-layer="${escapeAttr(layer.id)}"
            aria-pressed="${state.mapLayer === layer.id ? 'true' : 'false'}"
            title="${escapeAttr(`${layer.title}: ${formatNumber(layer.visible)} visible, ${formatNumber(layer.hidden)} hidden`)}">
            <strong>${escapeHtml(layer.title)}</strong>
            <span>${formatNumber(layer.visible)}/${formatNumber(layer.total)}</span>
            ${layer.hidden > 0 ? `<em>${formatNumber(layer.hidden)} hidden</em>` : '<em>complete</em>'}
          </button>
        `).join('')}
      </div>
      <div class="map-focus-control">
        <button type="button" class="${state.mapFocusOnly ? 'is-active' : ''}"
          data-action="map-focus" aria-pressed="${state.mapFocusOnly ? 'true' : 'false'}"
          data-testid="atlas-map-focus-selected">Focus selected</button>
        <button type="button" data-action="map-reset" data-testid="atlas-map-reset">Reset</button>
      </div>
      <div class="map-count-copy" aria-live="polite">
        <strong>${formatNumber(mapView.visibleComponents)}/${formatNumber(mapView.totalComponents)} nodes</strong>
        <span>${formatNumber(mapView.hiddenComponents)} hidden, ${formatNumber(mapView.visibleEdges)}/${formatNumber(mapView.totalEdges)} edges</span>
      </div>
    </div>
  `;
}

function renderFilteredMapEmpty(mapView) {
  if (mapView.visibleEdges > 0 || (!state.mapQuery && state.mapMode === 'overview' && !state.mapFocusOnly)) return '';
  return `
    <div class="map-empty" data-testid="atlas-map-filter-empty">
      No graph edges match the current map filter; visible repository nodes remain selectable.
    </div>
  `;
}

function buildMapView(selected) {
  const model = state.model;
  const allComponents = model.components || [];
  const allManifestEdges = model.edges || [];
  const allRelationshipEdges = model.relationshipEdges || [];
  const allEdges = [...allManifestEdges, ...allRelationshipEdges].filter((edge) => edgeHasPositions(edge));
  const query = state.mapQuery.toLowerCase().trim();
  const selectedTargets = selectedMapTargets(selected, allEdges);

  let candidateComponents = allComponents;
  let candidateEdges = allEdges;
  const activeLayer = LAYERS.find((layer) => layer.id === state.mapLayer) || null;

  if (state.mapFocusOnly) {
    candidateEdges = allEdges.filter((edge) => edgeTouchesAny(edge, selectedTargets));
    const focusTargets = new Set(selectedTargets);
    candidateEdges.forEach((edge) => {
      focusTargets.add(edge.from_target);
      focusTargets.add(edge.to_target);
    });
    candidateComponents = allComponents.filter((component) => focusTargets.has(component.targetId));
  }

  if (activeLayer) {
    const layerTargets = new Set(allComponents.filter((component) => component.layer === activeLayer.id).map((component) => component.targetId));
    candidateComponents = candidateComponents.filter((component) => layerTargets.has(component.targetId));
    candidateEdges = candidateEdges.filter((edge) => layerTargets.has(edge.from_target) || layerTargets.has(edge.to_target));
  }

  if (state.mapMode === 'risks') {
    candidateComponents = candidateComponents.filter((component) => component.findings > 0 || component.medium > 0);
    candidateEdges = candidateEdges.filter((edge) => {
      const endpoints = edgeEndpointComponents(edge);
      return endpoints.some((component) => component.findings > 0 || component.medium > 0) || /risk|gap|cannot|unknown/i.test(edge.evidence_state || edge.kind || '');
    });
  } else if (state.mapMode === 'important') {
    const importantEdges = new Set(
      [...candidateEdges]
        .sort((a, b) => edgeImportance(b, selectedTargets) - edgeImportance(a, selectedTargets))
        .slice(0, MAP_EDGE_SOFT_LIMIT)
        .map((edge) => edge.id)
    );
    candidateEdges = candidateEdges.filter((edge) => importantEdges.has(edge.id));
    const importantTargets = new Set(selectedTargets);
    candidateEdges.forEach((edge) => {
      importantTargets.add(edge.from_target);
      importantTargets.add(edge.to_target);
    });
    candidateComponents = candidateComponents.filter((component) => importantTargets.has(component.targetId) || componentImportance(component, selectedTargets) >= 70);
  }

  if (query) {
    const matchedTargets = new Set();
    const matchingComponents = candidateComponents.filter((component) => nodeMatchesMapQuery(component, query));
    matchingComponents.forEach((component) => matchedTargets.add(component.targetId));

    const matchingEdges = candidateEdges.filter((edge) => edgeMatchesMapQuery(edge, query));
    matchingEdges.forEach((edge) => {
      matchedTargets.add(edge.from_target);
      matchedTargets.add(edge.to_target);
    });

    candidateComponents = candidateComponents.filter((component) => matchedTargets.has(component.targetId));
    candidateEdges = matchingEdges.length
      ? matchingEdges
      : candidateEdges.filter((edge) => matchedTargets.has(edge.from_target) && matchedTargets.has(edge.to_target));
  }

  const visibleTargetIds = chooseVisibleTargets(candidateComponents, candidateEdges, selectedTargets, activeLayer);
  const visibleComponents = allComponents.filter((component) => visibleTargetIds.has(component.targetId));
  const visibleEdges = prioritizeMapEdges(
    candidateEdges.filter((edge) => visibleTargetIds.has(edge.from_target) && visibleTargetIds.has(edge.to_target)),
    selected.targetId,
    state.selectedEdgeId,
    MAP_EDGE_SOFT_LIMIT
  );
  const visibleEdgeIds = new Set(visibleEdges.map((edge) => edge.id));
  const manifestEdges = visibleEdges.filter((edge) => allManifestEdges.includes(edge));
  const relationshipEdges = visibleEdges.filter((edge) => allRelationshipEdges.includes(edge));

  return {
    components: visibleComponents,
    positions: positionComponents(visibleComponents),
    manifestEdges,
    relationshipEdges,
    visibleEdgeIds,
    visibleTargetIds,
    totalComponents: allComponents.length,
    visibleComponents: visibleComponents.length,
    hiddenComponents: Math.max(0, allComponents.length - visibleComponents.length),
    totalEdges: allEdges.length,
    visibleEdges: visibleEdges.length,
    hiddenEdges: Math.max(0, allEdges.length - visibleEdges.length),
    sampledCohorts: visibleEdges.filter((edge) => edge.relationship_semantics === 'cohort-sample' && numberFrom(edge.cohort_total, 0) > numberFrom(edge.cohort_sampled, 0)).length,
    layerSummaries: summarizeMapLayers(allComponents, visibleComponents),
    activeLayer: activeLayer ? summarizeActiveLayer(activeLayer, allComponents, visibleComponents) : null,
  };
}

function selectedMapTargets(selected, allEdges) {
  const targets = new Set();
  if (selected?.targetId) targets.add(selected.targetId);
  const edge = selectedEdge();
  if (edge) {
    if (edge.from_target) targets.add(edge.from_target);
    if (edge.to_target) targets.add(edge.to_target);
  }
  for (const item of allEdges || []) {
    if (item.id === state.selectedEdgeId) {
      if (item.from_target) targets.add(item.from_target);
      if (item.to_target) targets.add(item.to_target);
    }
  }
  return targets;
}

function chooseVisibleTargets(candidateComponents, candidateEdges, selectedTargets, activeLayer = null) {
  const targetIds = new Set(candidateComponents.map((component) => component.targetId));
  selectedTargets.forEach((targetId) => {
    const component = state.model.componentByTarget.get(targetId);
    if (!activeLayer || component?.layer === activeLayer.id) targetIds.add(targetId);
  });
  candidateEdges.forEach((edge) => {
    if (edgeImportance(edge, selectedTargets) >= 90) {
      targetIds.add(edge.from_target);
      targetIds.add(edge.to_target);
    }
  });

  if (targetIds.size <= MAP_NODE_SOFT_LIMIT) return targetIds;

  const ranked = [...targetIds]
    .map((targetId) => state.model.componentByTarget.get(targetId))
    .filter(Boolean)
    .sort((a, b) => componentImportance(b, selectedTargets) - componentImportance(a, selectedTargets));
  return new Set(ranked.slice(0, MAP_NODE_SOFT_LIMIT).map((component) => component.targetId));
}

function summarizeMapLayers(allComponents, visibleComponents) {
  const visibleByLayer = groupBy(visibleComponents, (component) => component.layer);
  const allByLayer = groupBy(allComponents, (component) => component.layer);
  return LAYERS.map((layer) => {
    const total = (allByLayer.get(layer.id) || []).length;
    const visible = (visibleByLayer.get(layer.id) || []).length;
    const findings = (allByLayer.get(layer.id) || []).reduce((sum, component) => sum + (component.findings || 0), 0);
    return {
      ...layer,
      total,
      visible,
      hidden: Math.max(0, total - visible),
      findings,
    };
  }).filter((layer) => layer.total > 0);
}

function summarizeActiveLayer(layer, allComponents, visibleComponents) {
  const total = allComponents.filter((component) => component.layer === layer.id).length;
  const visible = visibleComponents.filter((component) => component.layer === layer.id).length;
  return {
    ...layer,
    total,
    visible,
    hidden: Math.max(0, total - visible),
  };
}

function edgeHasPositions(edge) {
  return Boolean(edge?.from_target && edge?.to_target && state.model.graphPositions.has(edge.from_target) && state.model.graphPositions.has(edge.to_target));
}

function edgeTouchesAny(edge, targets) {
  return targets.has(edge.from_target) || targets.has(edge.to_target);
}

function nodeMatchesMapQuery(component, query) {
  return [
    component.label,
    component.name,
    component.repoId,
    component.role,
    component.summary,
    component.layer,
    component.evidenceState,
  ].join(' ').toLowerCase().includes(query);
}

function edgeMatchesMapQuery(edge, query) {
  const endpoints = edgeEndpointComponents(edge);
  return [
    edge.label,
    edge.kind,
    edge.source,
    edge.from_repo,
    edge.to_repo,
    edge.evidence_state,
    ...endpoints.map((component) => `${component.label} ${component.repoId} ${component.role}`),
  ].join(' ').toLowerCase().includes(query);
}

function componentImportance(component, selectedTargets) {
  let score = 0;
  if (selectedTargets.has(component.targetId)) score += 1000;
  score += Math.min(component.findings || 0, 500) / 5;
  score += Math.min(component.medium || 0, 120);
  score += Math.min((component.depsIn || 0) + (component.depsOut || 0) + (component.relationshipRecords || 0), 80);
  if (component.evidenceState === 'source-visible') score += 8;
  return score;
}

function edgeImportance(edge, selectedTargets) {
  const endpoints = edgeEndpointComponents(edge);
  let score = edgeTouchesAny(edge, selectedTargets) ? 1000 : 0;
  score += edge.kind === 'manifest-dependency' ? 18 : 28;
  if (/cannot|unknown|gap|partial/i.test(edge.evidence_state || '')) score += 24;
  for (const component of endpoints) {
    score += Math.min(component.findings || 0, 300) / 12;
    score += Math.min(component.relationshipRecords || 0, 30);
  }
  return score;
}

function renderEdge(edge, positions, extraClass = '') {
  const from = positions.get(edge.from_target);
  const to = positions.get(edge.to_target);
  if (!from || !to) return '';
  const midX = (from.x + to.x) / 2;
  const selected = state.selectedEdgeId === edge.id;
  const related = [edge.from_target, edge.to_target].includes(state.selectedId);
  const classes = [selected ? 'is-selected' : '', related ? 'is-related' : '', extraClass].filter(Boolean).join(' ');
  const d = `M ${from.x} ${from.y} C ${midX} ${from.y - 6}, ${midX} ${to.y + 6}, ${to.x} ${to.y}`;
  const label = edge.label || edge.id || 'Select edge';
  return `
    <path class="edge-hit-target ${classes}"
      data-action="select-edge" data-edge="${escapeAttr(edge.id || '')}"
      tabindex="0" role="button" aria-label="${escapeAttr(label)}"
      d="${escapeAttr(d)}"
      vector-effect="non-scaling-stroke">
      <title>${escapeHtml(label)}</title>
    </path>
    <path class="edge-visible ${classes}"
      data-action="select-edge" data-edge="${escapeAttr(edge.id || '')}"
      d="${escapeAttr(d)}"
      vector-effect="non-scaling-stroke">
      <title>${escapeHtml(label)}</title>
    </path>
    <circle class="edge-hit-point ${classes}"
      data-action="select-edge" data-edge="${escapeAttr(edge.id || '')}"
      tabindex="0" role="button" aria-label="${escapeAttr(label)}"
      cx="${edgePickPoint(from, to).x}" cy="${edgePickPoint(from, to).y}" r="1.8">
      <title>${escapeHtml(label)}</title>
    </circle>
  `;
}

function renderEdgePointButton(edge, positions) {
  const from = positions.get(edge.from_target);
  const to = positions.get(edge.to_target);
  if (!from || !to) return '';
  const selected = state.selectedEdgeId === edge.id;
  const related = [edge.from_target, edge.to_target].includes(state.selectedId);
  const relationship = edge.relationship || edge.relationship_semantics;
  const classes = [
    'edge-map-button',
    relationship ? 'relationship-edge' : '',
    selected ? 'is-selected' : '',
    related ? 'is-related' : '',
  ].filter(Boolean).join(' ');
  const point = edgePickPoint(from, to);
  const label = edge.label || edge.id || 'Select edge';
  return `
    <button type="button" class="${classes}"
      style="--edge-x:${point.x}; --edge-y:${point.y}"
      data-testid="atlas-map-edge"
      data-action="select-edge"
      data-edge="${escapeAttr(edge.id || '')}"
      aria-label="${escapeAttr(label)}"
      title="${escapeAttr(label)}"></button>
  `;
}

function edgePickPoint(from, to) {
  const midX = (from.x + to.x) / 2;
  const verticalish = Math.abs(from.x - to.x) < 6;
  const horizontalish = Math.abs(from.y - to.y) < 6;
  return {
    x: clamp(midX + (verticalish ? 9 : 0), 4, 96),
    y: clamp(((from.y + to.y) / 2) + (horizontalish ? 7 : 0), 4, 96),
  };
}

function renderComponentNode(component, mapView = null) {
  const selected = state.selectedId === component.targetId;
  const edgeSelected = selectedEdge();
  const endpointSelected = edgeSelected && [edgeSelected.from_target, edgeSelected.to_target].includes(component.targetId);
  const missingDocs = (component.surfaceRoutes || []).some((route) => route.slot === 'docs' && route.state === 'missing');
  const stateClass = component.evidenceState === 'source-visible' ? 'dot-source' : 'dot-meta';
  const pos = mapView?.positions?.get(component.targetId) ||
    state.model.graphPositions.get(component.targetId) ||
    { x: 50, y: 50 };
  const tone = component.findings > 350 ? 'hot' : component.findings > 150 ? 'warm' : 'calm';
  const related = selected || endpointSelected || connectedEdgesForComponent(component).some((edge) => edge.id === state.selectedEdgeId);
  const classes = [
    'component-node',
    `node-${tone}`,
    selected ? 'is-selected' : '',
    endpointSelected ? 'is-edge-endpoint' : '',
    mapView && state.mapFocusOnly && !related ? 'is-muted' : '',
  ].filter(Boolean).join(' ');
  return `
    <button type="button" class="${classes}"
      style="--x:${pos.x}; --y:${pos.y};"
      data-action="select-component" data-target="${escapeAttr(component.targetId)}"
      data-testid="atlas-map-node" data-node-id="${escapeAttr(component.targetId)}">
      <span class="node-title">${escapeHtml(shortComponentLabel(component.label))}</span>
      <span class="node-role">${escapeHtml(component.role)}</span>
      <span class="node-stats">
        <i class="dot ${stateClass}"></i>
        <i class="dot ${component.findings > 150 ? 'dot-risk' : 'dot-ok'}"></i>
        <i class="dot ${missingDocs ? 'dot-gap' : 'dot-meta'}"></i>
      </span>
      <em>${formatNumber(component.findings)} findings / ${component.depsIn}:${component.depsOut} deps</em>
    </button>
  `;
}

function renderInspector(component) {
  const topCards = component.contentCards.slice(0, 4);
  const topFindings = component.findingsList.slice(0, 4);
  const activeFinding = activeFindingFor(component);
  const depsOut = state.model.edges.filter((edge) => edge.from_target === component.targetId);
  const depsIn = state.model.edges.filter((edge) => edge.to_target === component.targetId);
  const relationshipCorridor = selectedRelationshipCorridor(component).slice(0, 5);
  return `
    <section class="inspector-card">
      <div class="inspector-header">
        <span class="section-kicker">Component drill-down</span>
        <h2>${escapeHtml(component.label)}</h2>
        <p>${escapeHtml(component.summary || component.role)}</p>
      </div>
      <div class="fact-grid">
        ${smallFact('Files', component.files)}
        ${smallFact('Findings', component.findings)}
        ${smallFact('Deps in/out', `${component.depsIn}/${component.depsOut}`)}
        ${smallFact('Relations', component.relationshipRecords)}
      </div>
      ${renderRepoEvidenceBrief(component)}
      <div class="signal-columns">
        ${renderSignals('Good', component.signals.good || [], 'good')}
        ${renderSignals('Needs attention', component.signals.needs_attention || component.signals.attention || [], 'watch')}
        ${renderSignals('Unknown', component.signals.unknown || [], 'unknown')}
      </div>
      ${renderDrilldownLadder(component)}
      ${renderAgentContextCard(component)}
      <div class="inspector-section">
        <div class="section-row">
          <h3>Evidence surfaces</h3>
          <button type="button" class="link-button" data-action="view" data-view="sources">Open sources</button>
        </div>
        <div class="surface-strip">
          ${(component.surfaceRoutes || []).map(renderSurfacePill).join('')}
        </div>
      </div>
      <div class="inspector-section">
        <div class="section-row">
          <h3>Recent tracker/wiki cards</h3>
          <span>${topCards.length}/${component.contentCards.length}</span>
        </div>
        <div class="mini-card-list">
          ${topCards.length ? topCards.map(renderContentMiniCard).join('') : '<p class="empty-copy">No imported cards for this surface.</p>'}
        </div>
      </div>
      ${component.claims.length ? `
        <div class="inspector-section">
          <div class="section-row">
            <h3>Agent claims</h3>
            <span>${component.claims.length}</span>
          </div>
          <div class="mini-card-list">
            ${component.claims.slice(0, 3).map(renderClaimMini).join('')}
          </div>
        </div>
      ` : ''}
      <div class="inspector-section">
        <div class="section-row">
          <h3>Dependency paths</h3>
          <span>${depsIn.length} in / ${depsOut.length} out</span>
        </div>
        <div class="dependency-list">
          ${[...depsIn.slice(0, 3), ...depsOut.slice(0, 3)].map((edge) => `
            <button type="button" data-action="select-edge" data-edge="${escapeAttr(edge.id || '')}" data-view="atlas">
              ${escapeHtml(edge.label || edge.id)}
            </button>
          `).join('') || '<p class="empty-copy">No manifest dependency edge in this bundle.</p>'}
        </div>
      </div>
      <div class="inspector-section">
        <div class="section-row">
          <h3>Relationship records</h3>
          <span>${relationshipCorridor.length}/${component.relationships.length}</span>
        </div>
        <div class="mini-card-list">
          ${relationshipCorridor.length ? relationshipCorridor.map((edge) => {
            const target = state.model.componentByTarget.get(edge.to_target);
            return `
              <button type="button" class="mini-card mini-card--finding" data-action="select-edge"
                data-edge="${escapeAttr(edge.id || '')}" data-view="atlas">
                <span>${escapeHtml(edge.kind || 'relationship')}</span>
                <strong>${escapeHtml(edge.label || edge.id)}</strong>
                <em>${escapeHtml(target ? `${target.label} / ${edge.evidence_state || 'metadata-visible'}` : edge.evidence_state || 'metadata-visible')}</em>
              </button>
            `;
          }).join('') : '<p class="empty-copy">No relationship record linked to this component.</p>'}
        </div>
      </div>
      <div class="inspector-section">
        <div class="section-row">
          <h3>Top findings</h3>
          <button type="button" class="link-button" data-action="view" data-view="risks">Open risks</button>
        </div>
        <div class="mini-card-list">
          ${topFindings.length ? topFindings.map(renderFindingMini).join('') : '<p class="empty-copy">No findings linked to this component.</p>'}
        </div>
      </div>
      ${renderEvidenceDrawer(component, activeFinding)}
    </section>
  `;
}

function renderDrilldownLadder(component) {
  return `
    <div class="drill-ladder" aria-label="Drill-down ladder">
      ${[
        ['C2', 'system', component.layer],
        ['C3', 'repo', component.repoId],
        ['C4', 'surfaces', `${component.surfaceRoutes.length} routes`],
        ['C5', 'work', `${formatNumber(component.findings)} findings`],
      ].map(([step, label, value]) => `
        <div>
          <span>${escapeHtml(step)}</span>
          <strong>${escapeHtml(label)}</strong>
          <em>${escapeHtml(value)}</em>
        </div>
      `).join('')}
    </div>
  `;
}

function renderAgentContextCard(component) {
  const commands = agentCommands(component);
  return `
    <div class="agent-card">
      <div class="section-row">
        <h3>Agent handoff</h3>
        <button type="button" class="link-button" data-action="view" data-view="agent">Open loop</button>
      </div>
      <p>Bounded queries for the selected node. The coding agent reads the same atlas the viewer renders.</p>
      <div class="command-list">
        ${commands.slice(0, 3).map((command) => `
          <button type="button" data-action="copy" data-copy="${escapeAttr(command.command)}">
            <span>${escapeHtml(command.label)}</span>
            <code>${escapeHtml(command.command)}</code>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderClaimMini(claim) {
  return `
    <details class="mini-card claim-card">
      <summary>
        <span>${escapeHtml(claim.claim_tier || 'claim')}</span>
        <strong>${escapeHtml(claim.statement || claim.id)}</strong>
      </summary>
      <em>${escapeHtml((claim.cited_refs || []).slice(0, 5).join(', ') || 'no cited refs')}</em>
      ${claim.agent ? `<code>${escapeHtml(claim.agent)}</code>` : ''}
    </details>
  `;
}

function renderRejectedClaimMini(claim) {
  const id = claim.id || claim.claim?.id || 'rejected-claim';
  const reason = claim.reason || claim.error || claim.message || 'rejected by importer';
  const refs = claim.cited_refs || claim.claim?.cited_refs || [];
  return `
    <details class="mini-card claim-card claim-card--rejected">
      <summary>
        <span>rejected</span>
        <strong>${escapeHtml(id)}</strong>
      </summary>
      <em>${escapeHtml(reason)}</em>
      ${refs.length ? `<code>${escapeHtml(refs.slice(0, 5).join(', '))}</code>` : ''}
    </details>
  `;
}

function renderRelationshipMini(rel, selected) {
  const edge = relationshipToDisplayEdge(rel, selected);
  return `
    <button type="button" class="mini-card mini-card--finding"
      data-action="select-component" data-target="${escapeAttr(edge?.to_target || selected.targetId)}">
      <span>${escapeHtml(rel.type || 'relationship')}</span>
      <strong>${escapeHtml(rel.summary || rel.id)}</strong>
      <em>${escapeHtml(`${rel.type || 'relationship'} / ${rel.evidence_state || 'metadata-visible'}`)}</em>
    </button>
  `;
}

function renderRepoEvidenceBrief(component) {
  const purpose = component.profile?.purpose || {};
  const languages = component.languages || [];
  const manifests = purpose.manifests || [];
  const compose = purpose.compose || [];
  const docker = purpose.docker || [];
  const firstCompose = compose[0];
  const services = firstCompose?.services || [];
  return `
    <div class="repo-evidence-brief">
      <div class="repo-purpose">
        <span class="section-kicker">Repo facts</span>
        <strong>${escapeHtml(purpose.readme_title || component.summary || component.role)}</strong>
        <em>${escapeHtml(shortPath(component.profile?.path || component.repoId))}</em>
      </div>
      <div class="repo-fact-columns">
        <div>
          <span>Languages</span>
          <strong>${languages.slice(0, 4).map((item) => escapeHtml(item.ext || item.name || '')).filter(Boolean).join(' ') || 'not_assessed'}</strong>
        </div>
        <div>
          <span>Manifests</span>
          <strong>${manifests.length ? manifests.slice(0, 2).map((item) => escapeHtml(item.type || item.path)).join(', ') : 'none visible'}</strong>
        </div>
        <div>
          <span>Deploy model</span>
          <strong>${compose.length ? `${compose.length} compose / ${services.length} services` : `${docker.length} docker files`}</strong>
        </div>
      </div>
      ${services.length ? `
        <div class="service-strip">
          ${services.slice(0, 6).map((service) => `
            <span>${escapeHtml(service.name)}${(service.ports || []).length ? ` : ${escapeHtml((service.ports || []).join(', '))}` : ''}</span>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function smallFact(label, value) {
  return `
    <div class="small-fact">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
    </div>
  `;
}

function renderSignals(title, items, tone) {
  return `
    <div class="signal-column signal-${tone}">
      <strong>${escapeHtml(title)}</strong>
      <ul>
        ${(items || []).slice(0, 4).map((item) => `<li>${escapeHtml(item)}</li>`).join('') ||
          '<li>None recorded</li>'}
      </ul>
    </div>
  `;
}

function renderSurfacePill(route) {
  const state = route.evidence_state || route.route_state || route.state || 'unknown';
  return `
    <a class="surface-pill surface-${cssState(state)}" href="${escapeAttr(route.url || '#')}" target="_blank" rel="noreferrer">
      <span>${escapeHtml(route.label || route.route_label || route.slot)}</span>
      <strong>${escapeHtml(state)}</strong>
    </a>
  `;
}

function renderContentMiniCard(card) {
  return `
    <a class="mini-card" href="${escapeAttr(card.url || '#')}" target="_blank" rel="noreferrer">
      <span>${escapeHtml(card.slot || (card.tags || [])[0] || 'content')}</span>
      <strong>${escapeHtml(card.title || card.id)}</strong>
      <em>${escapeHtml(card.summary || card.source || '')}</em>
    </a>
  `;
}

function renderFindingMini(finding) {
  const active = state.selectedFindingId === finding.id;
  return `
    <button type="button" class="mini-card mini-card--finding ${active ? 'is-active' : ''}"
      data-action="select-finding" data-finding="${escapeAttr(finding.id)}">
      <span>${escapeHtml(finding.kind || 'finding')} / ${escapeHtml(finding.severity || 'unknown')}</span>
      <strong>${escapeHtml(cleanFindingSummary(finding.summary || finding.id))}</strong>
      <em>${escapeHtml(shortPath((finding.paths || [])[0] || ''))}</em>
    </button>
  `;
}

function renderEvidenceDrawer(component, finding) {
  if (!finding) {
    return `
      <div class="evidence-drawer">
        <div class="section-row">
          <h3>Evidence drill-down</h3>
          <span>no linked finding</span>
        </div>
        <p class="empty-copy">This component has no hotspot row in the loaded bundle. Use Sources or Graph for its available surfaces.</p>
      </div>
    `;
  }
  const path = (finding.paths || [])[0] || '';
  const line = evidenceLine(finding, path);
  const producerRef = finding.producer_ref || finding.producerRef || '';
  const sourceHref = path ? sourceHrefFor(path, line, component.repoId) : '';
  const commands = findingCommands(component, finding);
  return `
    <div class="evidence-drawer">
      <div class="section-row">
        <h3>Evidence drill-down</h3>
        <span>${escapeHtml(finding.id || 'hotspot')}</span>
      </div>
      <div class="evidence-summary">
        <span>${escapeHtml(finding.kind || 'finding')}</span>
        <strong>${escapeHtml(cleanFindingSummary(finding.summary || finding.id))}</strong>
        <em>${escapeHtml(finding.evidence_state || 'unknown')} / ${escapeHtml(finding.producer || 'producer unknown')}</em>
      </div>
      <dl class="evidence-facts">
        <div>
          <dt>Source path</dt>
          <dd>${path ? `<code>${escapeHtml(shortPath(path))}</code>` : 'not recorded'}</dd>
        </div>
        <div>
          <dt>Producer ref</dt>
          <dd>${producerRef ? `<code>${escapeHtml(shortPath(producerRef))}</code>` : 'not recorded'}</dd>
        </div>
      </dl>
      <div class="evidence-actions">
        ${sourceHref ? `<a href="${escapeAttr(sourceHref)}" target="_blank" rel="noreferrer">Open source snippet</a>` : ''}
        <button type="button" data-action="view" data-view="agent">Open agent loop</button>
      </div>
      <div class="command-list">
        ${commands.map((command) => `
          <button type="button" data-action="copy" data-copy="${escapeAttr(command.command)}">
            <span>${escapeHtml(command.label)}</span>
            <code>${escapeHtml(command.command)}</code>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderRisksView(selected) {
  return `
    <section class="wide-view">
      <div class="view-heading">
        <span class="section-kicker">Risk clusters</span>
        <h2>Collapse scanner noise into decisions.</h2>
        <p>Repeated findings are grouped by rule and sample paths. This makes the report explain where to inspect, not just how many rows a scanner emitted.</p>
      </div>
      <div class="risk-layout">
        <section class="cluster-board">
          ${state.model.clusters.slice(0, 10).map(renderClusterCard).join('')}
        </section>
        <aside class="risk-aside">
          ${renderEvidenceDrawer(selected, activeFindingFor(selected))}
          ${renderComponentHeat(selected)}
          ${renderSharedDependencies()}
        </aside>
      </div>
    </section>
  `;
}

function renderClusterCard(cluster) {
  const active = state.activeCluster === cluster.id;
  const repos = cluster.repos.slice(0, 5);
  const firstFindingId = cluster.samples?.[0]?.id || '';
  return `
    <article class="cluster-card ${active ? 'is-active' : ''}">
      <button type="button" class="cluster-main" data-action="cluster" data-cluster="${cluster.id}"
        ${firstFindingId ? `data-finding="${escapeAttr(firstFindingId)}"` : ''}>
        <span>${escapeHtml(cluster.kind)} / ${escapeHtml(cluster.severity)}</span>
        <strong>${escapeHtml(cleanFindingSummary(cluster.summary))}</strong>
        <em>${formatNumber(cluster.count)} findings across ${formatNumber(cluster.repos.length)} repos</em>
      </button>
      <div class="cluster-repos">
        ${repos.map((component) => `
          <button type="button" data-action="select-component" data-target="${escapeAttr(component.targetId)}">
            ${escapeHtml(component.label)}
          </button>
        `).join('')}
      </div>
      <div class="cluster-samples">
        ${cluster.samples.slice(0, active ? 6 : 2).map((finding) => `
          <button type="button" data-action="select-finding" data-finding="${escapeAttr(finding.id || '')}">
            <span>${escapeHtml(finding.producer || cluster.producer)}</span>
            <code>${escapeHtml(shortPath((finding.paths || [])[0] || ''))}</code>
          </button>
        `).join('')}
      </div>
    </article>
  `;
}

function renderComponentHeat(selected) {
  const components = [...state.model.components].sort((a, b) => b.findings - a.findings);
  const max = Math.max(...components.map((component) => component.findings), 1);
  return `
    <section class="side-card">
      <div class="section-row">
        <h3>Component heat</h3>
        <span>findings</span>
      </div>
      <div class="heat-list">
        ${components.map((component) => `
          <button type="button" class="${component.targetId === selected.targetId ? 'is-active' : ''}"
            data-action="select-component" data-target="${escapeAttr(component.targetId)}">
            <span>${escapeHtml(component.label)}</span>
            <i><b style="width:${Math.max(5, (component.findings / max) * 100)}%"></b></i>
            <strong>${formatNumber(component.findings)}</strong>
          </button>
        `).join('')}
      </div>
    </section>
  `;
}

function renderSharedDependencies() {
  return `
    <section class="side-card">
      <div class="section-row">
        <h3>Shared dependency pressure</h3>
        <span>${state.model.sharedDependencies.length} hubs</span>
      </div>
      <div class="dependency-hubs">
        ${state.model.sharedDependencies.slice(0, 8).map((rel) => `
          <div>
            <strong>${escapeHtml(rel.detail?.component || rel.summary || rel.id)}</strong>
            <span>${formatNumber((rel.repos || []).length)} repos</span>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function renderSourcesView(selected) {
  return `
    <section class="wide-view">
      <div class="view-heading">
        <span class="section-kicker">Source directory</span>
        <h2>Every component has a fact trail.</h2>
        <p>Repositories, trackers, wiki and docs stay separated by evidence state. Imported tracker/wiki cards are visible from the same row.</p>
      </div>
      <div class="source-grid">
        ${state.model.components.map((component) => renderSourceRow(component, component.targetId === selected.targetId)).join('')}
      </div>
    </section>
  `;
}

function renderSourceRow(component, active) {
  const cards = component.contentCards.slice(0, 3);
  return `
    <article class="source-row ${active ? 'is-active' : ''}">
      <button type="button" class="source-title" data-action="select-component" data-target="${escapeAttr(component.targetId)}">
        <strong>${escapeHtml(component.label)}</strong>
        <span>${escapeHtml(component.role)}</span>
      </button>
      <div class="source-surfaces">
        ${(component.surfaceRoutes || []).slice(0, 5).map(renderSurfacePill).join('')}
      </div>
      <div class="source-cards">
        ${cards.length ? cards.map(renderContentMiniCard).join('') : '<span class="empty-copy">No imported tracker/wiki card</span>'}
      </div>
    </article>
  `;
}

function renderAgentView(selected) {
  const commands = agentCommands(selected);
  const activeFinding = activeFindingFor(selected);
  const activeEdge = selectedEdge();
  const selectedEdges = [
    ...state.model.edges.filter((edge) => edge.from_target === selected.targetId || edge.to_target === selected.targetId),
    ...selectedRelationshipCorridor(selected).slice(0, 8),
  ];
  return `
    <section class="wide-view agent-view">
      <div class="view-heading">
        <span class="section-kicker">Agent loop</span>
        <h2>Map once, then let agents navigate the same atlas.</h2>
        <p>Cursor, OpenCode or Codex can run the scan, query the bundle, import cited analysis claims, and reopen the viewer without turning prose into truth.</p>
      </div>
      <div class="agent-layout">
        <section class="agent-primary">
          <div class="agent-panel agent-selected">
            <div>
              <span class="section-kicker">Selected context</span>
              <h3>${escapeHtml(selected.label)}</h3>
              <p>${escapeHtml(selected.summary || selected.role)}</p>
            </div>
            <div class="agent-kpis">
              ${smallFact('Repo id', selected.repoId)}
              ${smallFact('Hotspots', selected.findings)}
              ${smallFact('Relations', selected.relationshipRecords)}
              ${smallFact('Claims', selected.claims.length)}
            </div>
          </div>
          <div class="agent-panel">
            <div class="section-row">
              <h3>Bounded commands</h3>
              <span>copy into Cursor/OpenCode</span>
            </div>
            <div class="command-list command-list--large">
              ${commands.map((command) => `
                <button type="button" data-action="copy" data-copy="${escapeAttr(command.command)}">
                  <span>${escapeHtml(command.label)}</span>
                  <code>${escapeHtml(command.command)}</code>
                </button>
              `).join('')}
            </div>
          </div>
          ${activeEdge ? renderSelectedEdgeAgentPanel(activeEdge) : ''}
          ${renderSelectedCodePanel(selected)}
          ${renderCaptainHandoffPanel()}
          ${renderEvidenceHandoffPanel(selected, activeFinding)}
          ${renderClaimsPanel(selected)}
          <div class="agent-panel">
            <div class="section-row">
              <h3>Edges to inspect</h3>
              <span>${selectedEdges.length}</span>
            </div>
            <div class="edge-list edge-list--compact">
              ${selectedEdges.map((edge) => `
                <button type="button" data-action="select-edge" data-edge="${escapeAttr(edge.id || '')}">
                  <span>${escapeHtml(edge.kind)}</span>
                  <strong>${escapeHtml(edge.label || edge.id)}</strong>
                  <em>${escapeHtml(edge.evidence_state || 'unknown')}</em>
                </button>
              `).join('') || '<p class="empty-copy">No selected dependency edge.</p>'}
            </div>
          </div>
        </section>
        <aside class="agent-side">
          <section class="agent-panel">
            <h3>Runbook</h3>
            <div class="runbook-steps">
              ${[
                ['1', 'Scan', 'Run local producers against the landscape root.'],
                ['2', 'Query', 'Use repos, relationships, hotspots, search and source families.'],
                ['3', 'Enrich', 'Write claims.jsonl with cited refs only.'],
                ['4', 'Import', 'Run import-analysis-claims; broken refs are rejected.'],
                ['5', 'Review', 'Open Atlas; claims and gaps stay visible.'],
              ].map(([num, title, text]) => `
                <div>
                  <span>${num}</span>
                  <strong>${escapeHtml(title)}</strong>
                  <em>${escapeHtml(text)}</em>
                </div>
              `).join('')}
            </div>
          </section>
          <section class="agent-panel">
            <h3>Bundle contract</h3>
            <div class="artifact-list">
              ${[
                ['manifest.json', 'bundle budget and target root'],
                ['atlas-facts.json', 'map nodes, edges, coverage'],
                ['relationships.jsonl', 'cross-repo relationships'],
                ['hotspots-full.jsonl', 'full ranked findings'],
                ['claims.jsonl', `${state.model.claims.length} imported / ${state.model.rejectedClaims.length} rejected`],
              ].map(([name, text]) => `
                <div>
                  <strong>${escapeHtml(name)}</strong>
                  <span>${escapeHtml(text)}</span>
                </div>
              `).join('')}
            </div>
          </section>
        </aside>
      </div>
    </section>
  `;
}

function renderSelectedCodePanel(selected) {
  const selectedCode = state.selectedCode;
  const result = selectedCode.result;
  const packet = result?.records?.[0] || null;
  const command = selectedCodeCommand(selected);
  return `
    <div class="agent-panel selected-code-panel" data-testid="selected-code-panel">
      <div class="section-row">
        <h3>Selected code lookup</h3>
        <span>${escapeHtml(selectedCode.status)}</span>
      </div>
      <p>Map a highlighted file, line, or symbol back to repo, component, source snippet, risks, relationships, gaps, and atlas routes.</p>
      <form class="selected-code-form" data-testid="selected-code-form">
        <label>
          <span>Repo</span>
          <input name="repo" type="text" value="${escapeAttr(selectedCode.repo || selected.repoId || '')}" autocomplete="off">
        </label>
        <label>
          <span>Path</span>
          <input name="path" type="text" value="${escapeAttr(selectedCode.path || selectedSourcePath(selected) || '')}" placeholder="src/server.ts" autocomplete="off">
        </label>
        <label>
          <span>Line</span>
          <input name="line" type="number" min="1" value="${escapeAttr(selectedCode.line || 1)}">
        </label>
        <label>
          <span>Symbol</span>
          <input name="symbol" type="text" value="${escapeAttr(selectedCode.symbol || '')}" placeholder="optional" autocomplete="off">
        </label>
        <label>
          <span>Limit</span>
          <input name="limit" type="number" min="1" max="100" value="${escapeAttr(selectedCode.limit || 20)}">
        </label>
        <button type="submit">Lookup context</button>
      </form>
      <div class="command-list">
        <button type="button" data-action="copy" data-copy="${escapeAttr(command)}">
          <span>Copy selected-code command</span>
          <code>${escapeHtml(command)}</code>
        </button>
      </div>
      ${selectedCode.status === 'loading' ? '<p class="empty-copy">Loading bounded selected-code packet...</p>' : ''}
      ${selectedCode.error ? `<p class="empty-copy selected-code-error">${escapeHtml(selectedCode.error)}</p>` : ''}
      ${packet ? renderSelectedCodePacket(packet) : '<p class="empty-copy">Run lookup or open a selected-code hash route to see the bounded packet.</p>'}
    </div>
  `;
}

function selectedCodeCommand(selected) {
  const repo = state.selectedCode.repo || selected.repoId || '';
  const pathValue = state.selectedCode.path || selectedSourcePath(selected) || '<path>';
  const line = state.selectedCode.line || 1;
  const symbol = state.selectedCode.symbol || '';
  const limit = state.selectedCode.limit || 20;
  const query = '"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh"';
  return [
    `${query} selected-code --bundle "$BUNDLE_DIR"`,
    repo ? `--repo ${quoteArg(repo)}` : '',
    pathValue ? `--path ${quoteArg(pathValue)}` : '',
    `--line ${line}`,
    symbol ? `--symbol ${quoteArg(symbol)}` : '',
    `--limit ${limit}`,
  ].filter(Boolean).join(' ');
}

function renderSelectedEdgeAgentPanel(edge) {
  const commands = edgeCommands(edge);
  return `
    <div class="agent-panel selected-edge-agent-panel" data-testid="selected-edge-agent-panel">
      <div class="section-row">
        <h3>Selected relationship query</h3>
        <span>${escapeHtml(edge.kind || 'relationship')}</span>
      </div>
      <p>${escapeHtml(edge.label || edge.id || 'Selected atlas relationship')} is still selected. These commands keep the agent on that edge instead of falling back to a generic repo prompt.</p>
      <div class="command-list command-list--large">
        ${commands.map((command) => `
          <button type="button" data-action="copy" data-copy="${escapeAttr(command.command)}">
            <span>${escapeHtml(command.label)}</span>
            <code>${escapeHtml(command.command)}</code>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function edgeCommands(edge) {
  const query = '"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh"';
  const endpoints = edgeEndpointComponents(edge);
  const repos = [...new Set([
    edge.from_repo,
    edge.to_repo,
    ...endpoints.map((endpoint) => endpoint.repoId),
  ].filter(Boolean))];
  const commands = [
    {
      label: 'Query this relationship family',
      command: `${query} relationships --bundle "$BUNDLE_DIR" --type ${quoteArg(edge.kind || 'relationship')} --limit 20`,
    },
  ];
  repos.slice(0, 2).forEach((repo, index) => {
    commands.push({
      label: `Endpoint ${index + 1} relationships`,
      command: `${query} relationships --bundle "$BUNDLE_DIR" --repo ${quoteArg(repo)} --limit 20`,
    });
  });
  if (edge.from_target || edge.to_target) {
    commands.push({
      label: 'Atlas edge evidence',
      command: `${query} atlas --bundle "$BUNDLE_DIR" --section edges ${edge.from_target ? `--target ${quoteArg(edge.from_target)}` : ''} --limit 20`.replace(/\s+/g, ' ').trim(),
    });
  }
  if (edge.evidence_ref || edge.producer_ref || edge.source) {
    commands.push({
      label: 'Edge evidence ref',
      command: `printf '%s\\n' ${quoteArg(edge.evidence_ref || edge.producer_ref || edge.source)}`,
    });
  }
  return commands;
}

function renderCaptainHandoffPanel() {
  const handoff = state.model.captainHandoff || {};
  const hasHandoff = handoff.scenario === 'captain-atlas-handoff';
  const topRisk = handoff.top_risk || {};
  const topGap = handoff.top_gap || {};
  const queryCommands = Array.isArray(handoff.query_handoff) ? handoff.query_handoff.slice(0, 4) : [];
  return `
    <div class="agent-panel captain-handoff-panel" data-testid="captain-handoff-panel">
      <div class="section-row">
        <h3>Captain handoff</h3>
        <span>${escapeHtml(handoff.verdict || 'not_assessed')}</span>
      </div>
      ${hasHandoff ? `
        <p>${escapeHtml(handoff.first_useful_captain_insight?.summary || 'Portable run handoff generated from receipt, scorecard, Q&A eval, and bounded queries.')}</p>
        <div class="handoff-summary-grid">
          ${smallFact('Repos', formatNumber(handoff.counts?.repos || 0))}
          ${smallFact('Relationships', formatNumber(handoff.counts?.relationships || 0))}
          ${smallFact('Gaps', formatNumber(handoff.counts?.gaps || 0))}
          ${smallFact('Q&A', formatNumber(handoff.counts?.qna_answers || 0))}
        </div>
        <div class="captain-mini-list">
          <button type="button" data-action="view" data-view="risks">
            <strong>${escapeHtml(topRisk.summary || topRisk.id || 'No top risk recorded')}</strong>
            <span>top risk</span>
          </button>
          <button type="button" data-action="view" data-view="graph">
            <strong>${escapeHtml(topGap.summary || topGap.id || 'No top gap recorded')}</strong>
            <span>top gap</span>
          </button>
        </div>
        <div class="command-list">
          ${queryCommands.map((command, index) => `
            <button type="button" data-action="copy" data-copy="${escapeAttr(command)}">
              <span>${escapeHtml(index === 0 ? 'handoff query' : `handoff query ${index + 1}`)}</span>
              <code>${escapeHtml(command)}</code>
            </button>
          `).join('')}
        </div>
      ` : '<p>No captain-handoff.json is present. Run portolan-query-eval.sh and portolan-captain-handoff.sh to make this atlas portable for agent handoff.</p>'}
    </div>
  `;
}

function selectedSourcePath(component) {
  return fileTrailForComponent(component).find(Boolean) || '';
}

function renderSelectedCodePacket(packet) {
  const bounded = packet.bounded_records || {};
  const selection = packet.selection || {};
  const counts = [
    ['Repo', bounded.repo],
    ['Component', bounded.component],
    ['Source', bounded.source],
    ['Symbols', bounded.symbols],
    ['Risks', bounded.risks],
    ['Relations', bounded.relationships],
    ['Gaps', bounded.gaps],
  ];
  return `
    <div class="selected-code-result" data-testid="selected-code-result">
      <div class="selected-code-summary">
        <span>${escapeHtml(packet.kind || 'selected-code-context')}</span>
        <strong>${escapeHtml(selection.path || packet.summary || packet.id)}</strong>
        <em>${escapeHtml(`line ${selection.line || 1} / repo ${selection.repo_id || 'unknown'} / ${packet.evidence_state || 'unknown'}`)}</em>
      </div>
      <div class="fact-grid selected-code-facts">
        ${counts.map(([label, rows]) => smallFact(label, formatNumber(Array.isArray(rows) ? rows.length : 0))).join('')}
      </div>
      <div class="selected-code-routes">
        ${packet.routes?.atlas ? `<a href="${escapeAttr(packet.routes.atlas)}">Open atlas node</a>` : ''}
        ${packet.routes?.source ? `<a href="${escapeAttr(packet.routes.source)}" target="_blank" rel="noreferrer">Open source snippet</a>` : ''}
        ${packet.routes?.api ? `<a href="${escapeAttr(packet.routes.api)}" target="_blank" rel="noreferrer">Open API packet</a>` : ''}
      </div>
      <div class="selected-code-sections">
        ${renderSelectedCodeSection('Source', bounded.source, (row) => row.summary || row.path || row.id)}
        ${renderSelectedCodeSection('Risks', bounded.risks, (row) => row.summary || row.reason || row.id)}
        ${renderSelectedCodeSection('Relationships', bounded.relationships, (row) => row.summary || row.label || row.id)}
        ${renderSelectedCodeSection('Gaps', bounded.gaps, (row) => row.summary || row.reason || row.id)}
      </div>
      <div class="selected-code-followups">
        <div class="section-row">
          <h4>Follow-up queries</h4>
          <span>${formatNumber((packet.follow_up_queries || []).length)}</span>
        </div>
        <div class="command-list">
          ${(packet.follow_up_queries || []).map((item) => `
            <button type="button" data-action="copy" data-copy="${escapeAttr(item.route || '')}">
              <span>${escapeHtml(item.family || 'query')}</span>
              <code>${escapeHtml(item.route || '')}</code>
            </button>
          `).join('') || '<p class="empty-copy">No follow-up query route returned.</p>'}
        </div>
      </div>
      <p class="resolution-limit"><strong>Resolution limit:</strong> ${escapeHtml(packet.resolution_limit || '')}</p>
    </div>
  `;
}

function renderSelectedCodeSection(title, rows, summaryFn) {
  const safeRows = Array.isArray(rows) ? rows.slice(0, 3) : [];
  return `
    <section>
      <div class="section-row">
        <h4>${escapeHtml(title)}</h4>
        <span>${formatNumber(Array.isArray(rows) ? rows.length : 0)}</span>
      </div>
      <div class="captain-mini-list">
        ${safeRows.length ? safeRows.map((row) => `
          <button type="button" data-action="${row.routes?.source ? 'open-source' : 'copy'}"
            ${row.path ? `data-path="${escapeAttr(row.path)}"` : ''}
            ${row.repo_id ? `data-repo="${escapeAttr(row.repo_id)}"` : ''}
            ${row.line ? `data-line="${escapeAttr(row.line)}"` : ''}
            data-copy="${escapeAttr(row.reference || row.id || '')}">
            <strong>${escapeHtml(summaryFn(row))}</strong>
            <span>${escapeHtml(row.kind || row.status || row.evidence_state || 'record')}</span>
          </button>
        `).join('') : '<p class="empty-copy">No bounded rows returned.</p>'}
      </div>
    </section>
  `;
}

function selectedCodeQueryKey(input = state.selectedCode) {
  return [
    String(input.repo || ''),
    String(input.path || ''),
    String(input.line || 1),
    String(input.symbol || ''),
    String(input.radius || 20),
    String(input.limit || 20),
  ].join('\u001f');
}

function selectedCodeParamsFromState(selected) {
  return {
    repo: state.selectedCode.repo || selected?.repoId || '',
    path: state.selectedCode.path || selectedSourcePath(selected) || '',
    line: clamp(numberFrom(state.selectedCode.line, 1) || 1, 1, 1000000),
    symbol: state.selectedCode.symbol || '',
    radius: clamp(numberFrom(state.selectedCode.radius, 20) || 20, 1, 500),
    limit: clamp(numberFrom(state.selectedCode.limit, 20) || 20, 1, 100),
  };
}

function selectedCodeApiUrl(params) {
  const query = new URLSearchParams();
  if (params.repo) query.set('repo', params.repo);
  if (params.path) query.set('path', params.path);
  if (params.line) query.set('line', String(params.line));
  if (params.symbol) query.set('symbol', params.symbol);
  if (params.radius) query.set('radius', String(params.radius));
  if (params.limit) query.set('limit', String(params.limit));
  return `/api/selected-code?${query.toString()}`;
}

function maybeLoadSelectedCodeFromRoute(selected) {
  if (state.view !== 'agent') return;
  if (!state.selectedCode.path && !state.selectedCode.symbol) return;
  if (state.selectedCode.status === 'loading') return;
  const params = selectedCodeParamsFromState(selected);
  const queryKey = selectedCodeQueryKey(params);
  if (state.selectedCode.lastQueryKey === queryKey && state.selectedCode.result) return;
  state.selectedCode.status = 'loading';
  state.selectedCode.error = '';
  state.selectedCode.warnings = [];
  state.selectedCode.lastQueryKey = queryKey;
  window.setTimeout(() => loadSelectedCodeContext(params).catch((err) => {
    state.selectedCode.status = 'failed';
    state.selectedCode.error = err && err.message ? err.message : String(err);
    render();
  }), 0);
}

async function submitSelectedCodeForm(form) {
  const data = new FormData(form);
  const selected = selectedComponent();
  const params = {
    repo: String(data.get('repo') || selected.repoId || '').trim(),
    path: String(data.get('path') || '').trim(),
    line: clamp(numberFrom(data.get('line'), 1) || 1, 1, 1000000),
    symbol: String(data.get('symbol') || '').trim(),
    radius: clamp(numberFrom(data.get('radius'), state.selectedCode.radius || 20) || 20, 1, 500),
    limit: clamp(numberFrom(data.get('limit'), state.selectedCode.limit || 20) || 20, 1, 100),
  };
  state.view = 'agent';
  state.selectedCode = {
    ...state.selectedCode,
    ...params,
    status: 'loading',
    result: null,
    warnings: [],
    error: '',
    lastQueryKey: selectedCodeQueryKey(params),
  };
  render();
  await loadSelectedCodeContext(params);
}

async function loadSelectedCodeContext(params) {
  const queryKey = selectedCodeQueryKey(params);
  state.selectedCode = {
    ...state.selectedCode,
    ...params,
    status: 'loading',
    error: '',
    warnings: [],
    lastQueryKey: queryKey,
  };
  const res = await fetch(selectedCodeApiUrl(params));
  if (!res.ok) {
    throw new Error(`/api/selected-code returned HTTP ${res.status}`);
  }
  const payload = await res.json();
  const packet = Array.isArray(payload.records) ? payload.records[0] : null;
  const selectedTarget = selectedCodeTargetId(packet);
  if (selectedTarget && state.model.componentByTarget.has(selectedTarget)) {
    state.selectedId = selectedTarget;
  }
  state.selectedCode = {
    ...state.selectedCode,
    repo: packet?.selection?.repo_id || params.repo || state.selectedCode.repo,
    path: packet?.selection?.path || params.path || state.selectedCode.path,
    line: numberFrom(packet?.selection?.line, params.line, state.selectedCode.line, 1) || 1,
    symbol: packet?.selection?.symbol || params.symbol || state.selectedCode.symbol,
    radius: params.radius,
    limit: params.limit,
    status: 'loaded',
    result: payload,
    warnings: Array.isArray(payload.warnings) ? payload.warnings : [],
    error: '',
    lastQueryKey: queryKey,
  };
  render();
}

function selectedCodeTargetId(packet) {
  const bounded = packet?.bounded_records || {};
  const component = Array.isArray(bounded.component) ? bounded.component[0] : null;
  if (component?.target_id) return component.target_id;
  if (component?.id && state.model.componentByTarget.has(component.id)) return component.id;
  const repoId = packet?.selection?.repo_id || (Array.isArray(bounded.repo) ? bounded.repo[0]?.id : '');
  if (repoId && state.model.componentByRepo.has(repoId)) return state.model.componentByRepo.get(repoId).targetId;
  return '';
}

function renderClaimsPanel(selected) {
  const landscapeClaims = state.model.landscapeClaims || [];
  const rejected = state.model.rejectedClaims || [];
  const selectedClaims = selected.claims || [];
  return `
    <div class="agent-panel">
      <div class="section-row">
        <h3>Agent analysis claims</h3>
        <span>${selectedClaims.length} selected / ${landscapeClaims.length} landscape / ${rejected.length} rejected</span>
      </div>
      <p>Claims are agent-authored and stay claim-only. Analytical and synthetic claims must carry refs that resolved during import.</p>
      <div class="mini-card-list">
        ${[
          ...selectedClaims.slice(0, 3).map(renderClaimMini),
          ...landscapeClaims.slice(0, 2).map(renderClaimMini),
          ...rejected.slice(0, 2).map(renderRejectedClaimMini),
        ].join('') || '<p class="empty-copy">No imported claims in this bundle.</p>'}
      </div>
    </div>
  `;
}

function renderEvidenceHandoffPanel(component, finding) {
  const commands = finding ? findingCommands(component, finding) : [];
  return `
    <div class="agent-panel">
      <div class="section-row">
        <h3>Evidence handoff</h3>
        <span>${finding ? escapeHtml(finding.id) : 'none selected'}</span>
      </div>
      ${finding ? `
        <p>${escapeHtml(cleanFindingSummary(finding.summary || finding.id))}</p>
        <div class="command-list command-list--large">
          ${commands.map((command) => `
            <button type="button" data-action="copy" data-copy="${escapeAttr(command.command)}">
              <span>${escapeHtml(command.label)}</span>
              <code>${escapeHtml(command.command)}</code>
            </button>
          `).join('')}
        </div>
      ` : '<p>No selected hotspot for this component. Start with repo profile and relationship commands.</p>'}
    </div>
  `;
}

function renderGraphView(selected) {
  const allEdges = [...state.model.edges, ...state.model.relationshipEdges];
  const selectedEdges = allEdges.filter((edge) =>
    edge.from_target === selected.targetId || edge.to_target === selected.targetId
  );
  return `
    <section class="wide-view graph-view">
      <div class="view-heading">
        <span class="section-kicker">Evidence graph</span>
        <h2>Trace relationship edges and visibility gaps.</h2>
        <p>Use this when the map raises a question: which dependency, config, runtime or imported relationship connects two repos, and which surfaces remain outside the local bundle.</p>
      </div>
      <div class="graph-columns">
        <section class="side-card">
          <h3>Selected edges for ${escapeHtml(selected.label)}</h3>
          <div class="edge-list">
            ${selectedEdges.map((edge) => `
              <button type="button" data-action="select-edge" data-edge="${escapeAttr(edge.id || '')}" data-view="atlas">
                <span>${escapeHtml(edge.kind)}</span>
                <strong>${escapeHtml(edge.label || edge.id)}</strong>
                <em>${escapeHtml(edge.evidence_state || 'unknown')}</em>
              </button>
            `).join('') || '<p class="empty-copy">No selected edge.</p>'}
          </div>
        </section>
        <section class="side-card">
          <h3>Known visibility gaps</h3>
          <div class="gap-list">
            ${state.model.gaps.map(renderGapMini).join('')}
          </div>
        </section>
      </div>
    </section>
  `;
}

function bindEvents() {
  const search = document.getElementById('global-search');
  if (search) {
    search.addEventListener('input', (event) => {
      state.query = event.target.value;
      queueRemoteSearch(state.query);
      render();
      const next = document.getElementById('global-search');
      if (next) {
        next.focus();
        next.setSelectionRange(state.query.length, state.query.length);
      }
    });
  }
  const mapSearch = document.getElementById('map-search');
  if (mapSearch) {
    mapSearch.addEventListener('input', (event) => {
      state.mapQuery = event.target.value;
      render();
      const next = document.getElementById('map-search');
      if (next) {
        next.focus();
        next.setSelectionRange(state.mapQuery.length, state.mapQuery.length);
      }
    });
  }
  const selectedCodeForm = app.querySelector('.selected-code-form');
  if (selectedCodeForm) {
    selectedCodeForm.addEventListener('submit', (event) => {
      event.preventDefault();
      submitSelectedCodeForm(event.currentTarget).catch((err) => {
        state.selectedCode.status = 'failed';
        state.selectedCode.error = err && err.message ? err.message : String(err);
        render();
      });
    });
  }

  app.querySelectorAll('[data-action]').forEach((element) => {
    element.addEventListener('click', async (event) => {
      const target = event.currentTarget;
      const action = target.dataset.action;
      let scrollTarget = '';
      if (action === 'view') {
        state.view = target.dataset.view || 'atlas';
      } else if (action === 'select-component') {
        selectComponent(target.dataset.target);
        if (target.dataset.view) state.view = target.dataset.view;
      } else if (action === 'select-edge') {
        selectEdge(target.dataset.edge);
        if (target.dataset.view) state.view = target.dataset.view;
      } else if (action === 'select-finding') {
        selectFinding(target.dataset.finding);
        if (target.dataset.view) state.view = target.dataset.view;
      } else if (action === 'open-source') {
        if (target.dataset.target) selectComponent(target.dataset.target);
        const repo = target.dataset.repo || (target.dataset.target ? selectedComponent()?.repoId || '' : '');
        const href = sourceHrefFor(target.dataset.path || '', target.dataset.line || 1, repo);
        if (href) window.open(href, '_blank', 'noopener,noreferrer');
      } else if (action === 'scroll') {
        state.view = target.dataset.view || state.view;
        scrollTarget = target.dataset.scrollTarget || '';
      } else if (action === 'layer-focus') {
        focusLayer(target.dataset.layer);
        scrollTarget = '#atlas-map-stage';
      } else if (action === 'open-component') {
        selectComponent(target.dataset.target);
        if (target.dataset.view) state.view = target.dataset.view;
      } else if (action === 'tour') {
        state.activeTour = target.dataset.tour || state.activeTour;
        const nextTour = atlasTours(state.model).find((tour) => tour.id === state.activeTour);
        if (nextTour?.steps?.[0]) selectComponent(nextTour.steps[0]);
      } else if (action === 'question') {
        const questionTarget = target.dataset.target;
        if (questionTarget === 'risks') state.view = 'risks';
        if (questionTarget === 'sources') state.view = 'sources';
        if (questionTarget === 'gaps') state.view = 'graph';
        if (questionTarget === 'map') state.view = 'atlas';
      } else if (action === 'cluster') {
        state.activeCluster = state.activeCluster === target.dataset.cluster ? '' : target.dataset.cluster;
        if (target.dataset.finding) selectFinding(target.dataset.finding);
        if (target.dataset.view) state.view = target.dataset.view;
      } else if (action === 'select-gap') {
        if (target.dataset.target) selectComponent(target.dataset.target);
        state.selectedEdgeId = '';
        state.mapMode = 'risks';
        state.mapFocusOnly = Boolean(target.dataset.target);
        state.view = target.dataset.view || 'graph';
      } else if (action === 'map-mode') {
        state.mapMode = target.dataset.mode || 'overview';
      } else if (action === 'map-layer') {
        state.mapLayer = target.dataset.layer || '';
        state.view = 'atlas';
      } else if (action === 'map-focus') {
        state.mapFocusOnly = !state.mapFocusOnly;
        state.view = 'atlas';
      } else if (action === 'map-reset') {
        state.mapQuery = '';
        state.mapMode = 'overview';
        state.mapFocusOnly = false;
        state.mapLayer = '';
        state.selectedEdgeId = '';
        ensureSelectedFinding();
        state.view = 'atlas';
      } else if (action === 'copy') {
        await copyText(target.dataset.copy || '');
        state.toast = 'Copied command';
        setTimeout(() => {
          state.toast = '';
          render();
        }, 1200);
      }
      scrollTarget = scrollTarget || target.dataset.scrollTarget || '';
      state.query = action === 'select-component' ||
        action === 'select-edge' ||
        action === 'open-component' ||
        action === 'select-finding' ||
        action === 'open-source' ||
        action === 'cluster' ||
        action === 'select-gap'
        ? ''
        : state.query;
      render();
      if (scrollTarget) {
        requestAnimationFrame(() => {
          document.querySelector(scrollTarget)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    });
    element.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && element.tagName.toLowerCase() !== 'button') {
        event.preventDefault();
        element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    });
  });
}

function queueRemoteSearch(query) {
  const q = String(query || '').trim();
  state.searchRequestId += 1;
  const requestId = state.searchRequestId;
  if (q.length < 2) {
    state.searchLoading = false;
    state.searchRemoteQuery = '';
    state.searchRemoteResults = [];
    return;
  }
  state.searchLoading = true;
  fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`)
    .then((res) => (res.ok ? res.json() : null))
    .then((payload) => {
      if (requestId !== state.searchRequestId || String(state.query || '').trim() !== q) return;
      state.searchRemoteQuery = q;
      state.searchRemoteResults = apiSearchResults(payload, q);
      state.searchLoading = false;
      render();
    })
    .catch(() => {
      if (requestId !== state.searchRequestId) return;
      state.searchLoading = false;
      state.searchRemoteResults = [];
      render();
    });
}

function apiSearchResults(payload, query) {
  const records = Array.isArray(payload?.records) ? payload.records : [];
  return records.map((record) => ({
    kind: 'source',
    title: record.summary || record.path || record.id,
    meta: `${record.repo_id || 'source'} / ${shortPath(record.path || '')}:${record.line || 1}`,
    action: 'open-source',
    repo: record.repo_id || '',
    path: record.path || '',
    line: record.line || 1,
    view: 'sources',
    api: record.routes?.api || `/api/search?q=${encodeURIComponent(query)}&limit=8`,
  }));
}

async function copyText(text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', 'true');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
  }
}

function selectComponent(targetId) {
  if (targetId && state.model.componentByTarget.has(targetId)) {
    state.selectedId = targetId;
    state.selectedEdgeId = '';
    ensureSelectedFinding();
  }
}

function focusLayer(layerId) {
  if (!layerId) return;
  const component = state.model.components
    .filter((item) => item.layer === layerId)
    .sort((a, b) => b.findings - a.findings || b.relationshipRecords - a.relationshipRecords)[0];
  if (component) selectComponent(component.targetId);
}

function selectFinding(findingId) {
  const finding = findingId ? state.model.findingById.get(findingId) : null;
  if (!finding) return;
  if (finding.targetId && state.model.componentByTarget.has(finding.targetId)) {
    state.selectedId = finding.targetId;
  }
  state.selectedFindingId = finding.id;
  state.selectedEdgeId = '';
}

function selectEdge(edgeId) {
  const edge = edgeId ? state.model.edgeById.get(edgeId) : null;
  if (!edge) return;
  state.selectedEdgeId = edge.id;
  const targetId = edge.from_target || edge.to_target;
  if (targetId && state.model.componentByTarget.has(targetId)) {
    state.selectedId = targetId;
  }
  ensureSelectedFinding();
}

function ensureSelectedFinding() {
  if (!state.model) return;
  const component = selectedComponent();
  if (component.findingsList.some((finding) => finding.id === state.selectedFindingId)) return;
  state.selectedFindingId = component.findingsList[0]?.id || '';
}

function selectedComponent() {
  return state.model.componentByTarget.get(state.selectedId) || state.model.components[0] || emptyComponent();
}

function selectedEdge() {
  return state.selectedEdgeId ? state.model.edgeById.get(state.selectedEdgeId) || null : null;
}

function emptyComponent() {
  return {
    id: 'landscape',
    targetId: 'landscape',
    repoId: '',
    name: 'Landscape',
    label: 'Landscape',
    role: 'target ecosystem',
    layer: 'support',
    lifecycle: 'unknown',
    summary: 'No repository component rows were present in the loaded bundle.',
    evidenceState: 'unknown',
    profile: {},
    counts: {},
    surfaces: {},
    surfaceRoutes: [],
    facts: [],
    signals: { good: [], needs_attention: [], unknown: [] },
    files: 0,
    findings: 0,
    medium: 0,
    low: 0,
    info: 0,
    depsIn: 0,
    depsOut: 0,
    relationshipRecords: 0,
    languages: [],
    contentRoutes: [],
    contentCards: [],
    findingsList: [],
    relationships: [],
    claims: [],
  };
}

function activeFindingFor(component) {
  if (!component) return null;
  return component.findingsList.find((finding) => finding.id === state.selectedFindingId) ||
    component.findingsList[0] ||
    null;
}

function searchResults(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const results = [];

  for (const component of state.model.components) {
    const haystack = [
      component.label,
      component.name,
      component.role,
      component.summary,
      component.evidenceState,
    ].join(' ').toLowerCase();
    if (haystack.includes(q)) {
      results.push({
        kind: 'component',
        title: component.label,
        meta: `${component.role} / ${formatNumber(component.findings)} findings`,
        action: 'open-component',
        target: component.targetId,
        view: 'atlas',
      });
    }
  }

  for (const component of state.model.components) {
    for (const card of component.contentCards) {
      const haystack = [card.title, card.summary, card.source, ...(card.tags || [])].join(' ').toLowerCase();
      if (haystack.includes(q)) {
        results.push({
          kind: card.slot || 'surface',
          title: card.title || card.id,
          meta: `${component.label} / ${card.source || 'content'}`,
          action: 'open-component',
          target: component.targetId,
          view: 'sources',
        });
      }
    }
  }

  for (const cluster of state.model.clusters) {
    const haystack = [cluster.summary, cluster.kind, cluster.producer].join(' ').toLowerCase();
    if (haystack.includes(q)) {
      results.push({
        kind: 'risk',
        title: cleanFindingSummary(cluster.summary),
        meta: `${formatNumber(cluster.count)} findings / ${cluster.kind}`,
        action: 'cluster',
        cluster: cluster.id,
        finding: cluster.samples?.[0]?.id || '',
        view: 'risks',
        target: '',
      });
    }
  }

  for (const gap of state.model.gaps || []) {
    const haystack = [
      gap.id,
      gap.subject,
      gap.surface,
      gap.layer,
      gap.summary,
      gap.detail,
      gap.reason,
      gap.evidence_state,
      gap.status,
      gap.state,
    ].join(' ').toLowerCase();
    if (haystack.includes(q)) {
      const component = componentForGap(gap);
      results.push({
        kind: 'gap',
        title: gap.subject || gap.surface || gap.layer || gap.id || 'visibility gap',
        meta: `${gap.evidence_state || gap.status || gap.state || 'unknown'} / ${component?.label || 'landscape'}`,
        action: 'select-gap',
        target: component?.targetId || '',
        view: 'graph',
      });
    }
  }

  for (const edge of state.model.relationshipEdges || []) {
    const rel = edge.relationship || {};
    const haystack = [
      edge.label,
      edge.kind,
      edge.source,
      edge.from_repo,
      edge.to_repo,
      rel.summary,
      rel.type,
      rel.producer,
      rel.detail?.component,
      ...(rel.repos || []),
    ].join(' ').toLowerCase();
    if (haystack.includes(q)) {
      const cohortSample = edge.relationship_semantics === 'cohort-sample';
      results.push({
        kind: edge.kind || 'relationship',
        title: edge.label || edge.id,
        meta: cohortSample
          ? `${edge.evidence_state || 'metadata-visible'} / shared cohort sample ${formatNumber(edge.cohort_sampled || 0)} of ${formatNumber(edge.cohort_total || 0)}`
          : `${edge.evidence_state || 'metadata-visible'} / ${endpointLabel(edge.from_target, edge.from_repo)} -> ${endpointLabel(edge.to_target, edge.to_repo)}`,
        action: 'select-edge',
        edge: edge.id,
        view: 'atlas',
      });
    }
  }

  for (const claim of state.model.claims || []) {
    const haystack = [claim.statement, claim.subject, claim.claim_tier, ...(claim.cited_refs || [])].join(' ').toLowerCase();
    if (haystack.includes(q)) {
      const subject = String(claim.subject || '');
      const repoId = subject.startsWith('repo:') ? subject.slice(5) : '';
      const component = repoId ? state.model.componentByRepo.get(repoId) || state.model.componentByTarget.get(repoId) : null;
      results.push({
        kind: claim.claim_tier || 'claim',
        title: claim.statement || claim.id,
        meta: `${claim.subject || 'landscape'} / claim-only`,
        action: component ? 'select-component' : 'view',
        target: component?.targetId || '',
        view: component ? 'atlas' : 'agent',
      });
    }
  }

  if (state.searchRemoteQuery === query.trim() && Array.isArray(state.searchRemoteResults)) {
    for (const result of state.searchRemoteResults) {
      results.push(result);
    }
  }

  for (const row of state.model.searchIndex || []) {
    const haystack = [row.path, row.text].join(' ').toLowerCase();
    if (haystack.includes(q)) {
      const component = detectComponentForPath(row.path, state.model.components);
      const repoComponent = row.repo_id ? state.model.componentByRepo.get(row.repo_id) : null;
      results.push({
        kind: 'source',
        title: row.text || row.path,
        meta: `${repoComponent?.label || row.repo_id || 'source'} / ${shortPath(row.path)}:${row.line || 1}`,
        action: 'open-source',
        target: repoComponent?.targetId || component?.targetId || '',
        repo: row.repo_id || '',
        path: row.path,
        line: row.line || 1,
      });
    }
    if (results.length > 40) break;
  }

  return results;
}

function agentCommands(component) {
  const repo = component.repoId;
  const repoArg = quoteArg(repo);
  const labelArg = quoteArg(component.label);
  const query = '"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh"';
  const importClaims = '"$TARGET_ROOT/.portolan/bin/portolan-import-analysis-claims.sh"';
  return [
    {
      label: 'Find this repo profile',
      command: `${query} repos --bundle "$BUNDLE_DIR" --repo ${repoArg} --limit 1`,
    },
    {
      label: 'Get selected repo hotspots',
      command: `${query} hotspots --bundle "$BUNDLE_DIR" --repo ${repoArg} --limit 20 --full`,
    },
    {
      label: 'Inspect repo relationships',
      command: `${query} relationships --bundle "$BUNDLE_DIR" --repo ${repoArg} --limit 20`,
    },
    {
      label: 'Search selected concept',
      command: `${query} search --bundle "$BUNDLE_DIR" --q ${labelArg} --limit 30`,
    },
    {
      label: 'Query selected atlas component',
      command: `${query} atlas --bundle "$BUNDLE_DIR" --section components --repo ${repoArg} --limit 5`,
    },
    {
      label: 'Inspect promotion health',
      command: `${query} promotion-health --bundle "$BUNDLE_DIR" --limit 20`,
    },
    {
      label: 'Inspect promoted facts',
      command: `${query} promoted-facts --bundle "$BUNDLE_DIR" --limit 20`,
    },
    {
      label: 'Inspect raw artifact refs',
      command: `${query} raw-artifacts --bundle "$BUNDLE_DIR" --limit 20`,
    },
    {
      label: 'Inspect source roles',
      command: `${query} classified-sources --bundle "$BUNDLE_DIR" --limit 20`,
    },
    {
      label: 'Import cited agent claims',
      command: `${importClaims} "$BUNDLE_DIR" claims.jsonl`,
    },
  ];
}

function findingCommands(component, finding) {
  if (!finding) return [];
  const repo = component.repoId;
  const repoArg = quoteArg(repo);
  const path = (finding.paths || [])[0] || '';
  const line = evidenceLine(finding, path);
  const summary = cleanFindingSummary(finding.summary || finding.id);
  const query = '"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh"';
  return [
    {
      label: 'Query matching hotspots',
      command: `${query} hotspots --bundle "$BUNDLE_DIR" --repo ${repoArg} --text ${quoteArg(summary)} --limit 10 --full`,
    },
    path ? {
      label: 'Read source snippet',
      command: `${query} source --bundle "$BUNDLE_DIR" --repo ${repoArg} --path ${quoteArg(path)} --line ${line} --radius 24`,
    } : null,
    finding.producer_ref ? {
      label: 'Inspect producer JSON',
      command: `jq '.results? // .' ${quoteArg(finding.producer_ref)} | head -n 80`,
    } : null,
  ].filter(Boolean);
}

function findingIdFromEvidenceRef(value) {
  const match = String(value || '').match(/^hotspot:(.+)$/);
  return match ? match[1] : '';
}

function edgeIdFromEvidenceRef(value) {
  const match = String(value || '').match(/^(edge|relationship):(.+)$/);
  return match ? match[2] : '';
}

function targetIdFromEvidenceRef(value) {
  const match = String(value || '').match(/^(target|component):(.+)$/);
  return match ? match[2] : '';
}

function repoIdFromEvidenceRef(value) {
  const match = String(value || '').match(/^repo:(.+)$/);
  return match ? match[1] : '';
}

function landscapeLabel(model) {
  return model.corpus?.label ||
    model.reportSections?.find((section) => section.id === 'overview')?.blocks?.find((block) => block.type === 'text')?.text ||
    model.coverage?.target_root ||
    'Local software landscape';
}

function landscapeTitle(model) {
  const raw = String(landscapeLabel(model) || '').trim();
  const targetPath = model.coverage?.target_root || model.corpus?.target_root || targetPathFromLabel(raw);
  const compactPath = compactPathLabel(targetPath);
  if (/^target:/i.test(raw) && compactPath) return `Target: ${compactPath}`;
  if (raw.length > 84 && compactPath) return compactPath;
  return raw || compactPath || 'Local software landscape';
}

function landscapeDetail(model, title = '') {
  const raw = String(landscapeLabel(model) || '').trim();
  const targetPath = model.coverage?.target_root || model.corpus?.target_root || targetPathFromLabel(raw);
  if (targetPath) return `Local path ${shortPath(targetPath)}`;
  if (raw && raw !== title) return raw;
  return model.corpus?.purpose || '';
}

function targetPathFromLabel(value) {
  const match = String(value || '').match(/^target:\s*(.+)$/i);
  return match ? match[1].trim() : '';
}

function compactPathLabel(value) {
  const parts = String(value || '')
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean);
  if (!parts.length) return '';
  return parts.slice(-2).join('/');
}

function selectedRelationshipCorridor(component) {
  if (!component) return [];
  const out = [];
  for (const edge of state.model.relationshipEdges || []) {
    if (edge.from_target || edge.to_target) {
      if (edge.from_target === component.targetId || edge.to_target === component.targetId) {
        out.push(edge);
      }
      continue;
    }
    const repoIds = edge.repo_ids || edge.repos || [];
    if (!repoIds.includes(component.repoId)) continue;
    for (const repoId of repoIds) {
      if (repoId === component.repoId) continue;
      const target = state.model.componentByRepo.get(repoId);
      if (!target) continue;
      out.push({
        id: `${edge.id || edge.label}:${component.targetId}->${target.targetId}`,
        kind: edge.kind || edge.type || 'relationship',
        from_target: component.targetId,
        to_target: target.targetId,
        from_repo: component.repoId,
        to_repo: target.repoId,
        label: edge.label || edge.summary || edge.id,
        evidence_state: edge.evidence_state || 'metadata-visible',
        source: edge.source || edge.producer || '',
      });
      if (out.length >= 18) break;
    }
  }
  return out.sort((a, b) => (a.kind || '').localeCompare(b.kind || '') || (a.label || '').localeCompare(b.label || ''));
}

function relationshipToDisplayEdge(rel, selected) {
  if (!rel || !selected) return null;
  if (rel.from_repo || rel.to_repo) {
    const from = state.model.componentByRepo.get(rel.from_repo);
    const to = state.model.componentByRepo.get(rel.to_repo);
    if (from && to) {
      if (from.targetId === selected.targetId) return { from_target: from.targetId, to_target: to.targetId };
      if (to.targetId === selected.targetId) return { from_target: to.targetId, to_target: from.targetId };
      return { from_target: selected.targetId, to_target: to.targetId };
    }
  }
  const repos = rel.repos || rel.repo_ids || [];
  const otherRepo = repos.find((repoId) => repoId !== selected.repoId);
  const other = otherRepo ? state.model.componentByRepo.get(otherRepo) : null;
  return other ? { from_target: selected.targetId, to_target: other.targetId } : null;
}

function evidenceLine(finding, sourcePath = '') {
  const direct = numberFrom(finding?.line, finding?.start_line);
  if (direct > 0) return direct;
  const locations = finding?.locations || [];
  const match = locations.find((location) => !sourcePath || location.path === sourcePath);
  const line = numberFrom(match?.line, match?.start_line);
  return line > 0 ? line : 1;
}

function sourceHrefFor(pathValue, line = 1, repoId = '') {
  if (!pathValue) return '';
  const params = new URLSearchParams();
  params.set('path', pathValue);
  params.set('line', String(line || 1));
  if (repoId) params.set('repo', repoId);
  return `/source?${params.toString()}`;
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function numberFrom(...values) {
  for (const value of values) {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(numberFrom(value));
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

function shortPath(value) {
  if (!value) return '';
  return String(value)
    .replace(/^.*\/repos\//, '')
    .replace(/^.*\/bundle\//, 'bundle/')
    .slice(0, 96);
}

function shortComponentLabel(value) {
  return String(value || '')
    .replace(/\s+Repository$/i, '')
    .trim() || String(value || '');
}

function cleanFindingSummary(value) {
  return String(value || '')
    .replace(/^Semgrep harness\.recipes\.semgrep-rules\./, 'Semgrep ')
    .replace(/portolan-/g, '')
    .replace(/-/g, ' ');
}

function quoteArg(value) {
  return `"${String(value || '').replace(/(["\\$`])/g, '\\$1')}"`;
}

function cssState(value) {
  return String(value || 'unknown').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

function highlight(text, query) {
  const escaped = escapeHtml(text || '');
  if (!query) return escaped;
  const idx = escaped.toLowerCase().indexOf(escapeHtml(query).toLowerCase());
  if (idx < 0) return escaped;
  return `${escaped.slice(0, idx)}<mark>${escaped.slice(idx, idx + query.length)}</mark>${escaped.slice(idx + query.length)}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

window.addEventListener('hashchange', () => {
  routeFromHash();
  render();
});
