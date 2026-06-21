const app = document.getElementById('app');

const state = {
  model: null,
  selectedId: '',
  selectedFindingId: '',
  view: 'atlas',
  query: '',
  activeCluster: '',
  activeTour: 'cto',
  toast: '',
};

const LAYERS = [
  {
    id: 'integration',
    title: 'Integration',
    subtitle: 'Packaging, governance, streams',
    roles: ['ecosystem-integrator', 'security-governance', 'event-streaming'],
  },
  {
    id: 'foundation',
    title: 'Foundation',
    subtitle: 'Storage, coordination, search',
    roles: [
      'filesystem-yarn-mapreduce-foundation',
      'distributed-nosql-store',
      'coordination-service',
      'search-index',
      'distributed-cache-filesystem',
    ],
  },
  {
    id: 'compute',
    title: 'Compute and SQL',
    subtitle: 'Batch, stream, warehouse, execution',
    roles: [
      'stream-batch-processing',
      'distributed-compute',
      'sql-warehouse',
      'dag-execution-engine',
      'sql-over-hbase',
    ],
  },
  {
    id: 'access',
    title: 'Access',
    subtitle: 'Workflow, notebooks, services',
    roles: ['workflow-orchestration', 'spark-rest-service', 'notebook-analytics'],
  },
  {
    id: 'legacy',
    title: 'Legacy',
    subtitle: 'Retired but still visible',
    roles: ['legacy-hadoop-workflow-scheduler', 'legacy-rdbms-hadoop-transfer'],
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

const ATLAS_TOURS = [
  {
    id: 'cto',
    title: 'CTO landscape briefing',
    summary: 'Packaging, foundation, storage, SQL and interactive access in one route.',
    steps: ['apache-bigtop-repo', 'apache-hadoop', 'apache-hbase', 'apache-hive', 'apache-spark', 'apache-zeppelin'],
  },
  {
    id: 'agent',
    title: 'Coding-agent bootstrap',
    summary: 'The shortest path an agent should follow before making codebase claims.',
    steps: ['apache-bigtop-repo', 'apache-hadoop', 'apache-hive', 'apache-ranger', 'apache-airflow'],
  },
  {
    id: 'risk',
    title: 'Risk and duplication sweep',
    summary: 'Start with high-noise systems, then inspect shared dependency pressure.',
    steps: ['apache-hive', 'apache-spark', 'apache-flink', 'apache-solr', 'apache-hadoop'],
  },
];

const ATLAS_LOOP = [
  ['Scan', 'local producers'],
  ['Map', 'repos + relations'],
  ['Ask', 'bounded query'],
  ['Enrich', 'agent claims'],
  ['Re-render', 'human atlas'],
];

init();

async function init() {
  try {
    const [
      atlasFacts,
      surfaceContent,
      repoProfiles,
      hotspots,
      relationships,
      gaps,
      claims,
      claimsImportReport,
      landscapeReport,
      searchIndex,
    ] =
      await Promise.all([
        fetchJson('/bundle/atlas-facts.json', {}),
        fetchJson('/bundle/atlas-surface-content.json', {}),
        fetchJson('/bundle/repo-profiles.json', {}),
        fetchJsonl('/bundle/hotspots-full.jsonl'),
        fetchJsonl('/bundle/relationships.jsonl'),
        fetchJsonl('/bundle/gaps.jsonl'),
        fetchJsonl('/bundle/claims.jsonl'),
        fetchJson('/bundle/claims-import-report.json', {}),
        fetchJson('/bundle/landscape-report.json', {}),
        fetchJsonl('/bundle/search-index.jsonl'),
      ]);
    state.model = buildModel({
      atlasFacts,
      surfaceContent,
      repoProfiles,
      hotspots,
      relationships,
      gaps,
      claims,
      claimsImportReport,
      landscapeReport,
      searchIndex,
    });
    state.selectedId = chooseDefaultComponent(state.model);
    routeFromHash();
    ensureSelectedFinding();
    render();
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
  searchIndex,
}) {
  const components = normalizeComponents(atlasFacts, repoProfiles);
  const componentByTarget = new Map(components.map((component) => [component.targetId, component]));
  const componentByRepo = new Map(components.map((component) => [component.repoId, component]));

  attachSurfaceContent(components, surfaceContent);
  attachFindings(components, hotspots);
  attachRelationships(components, relationships);
  const landscapeClaims = attachClaims(components, claims);

  const findingById = new Map((hotspots || []).filter((finding) => finding.id).map((finding) => [finding.id, finding]));
  const edges = (atlasFacts.edges || []).filter((edge) => edge.kind === 'manifest-dependency');
  const relationshipEdges = (atlasFacts.edges || []).filter((edge) => edge.kind !== 'manifest-dependency');
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

  const mergedGaps = mergeGaps(atlasFacts.gaps || [], gaps || []);
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
    graphPositions,
    clusters,
    sharedDependencies,
    surfaceContent,
    relationships,
    claims: claims || [],
    landscapeClaims,
    rejectedClaims: Array.isArray(claimsImportReport.rejected) ? claimsImportReport.rejected : [],
    searchIndex: Array.isArray(searchIndex) ? searchIndex.slice(0, 5000) : [],
    findingById,
    reportSections,
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

function normalizeComponents(atlasFacts, repoProfiles) {
  const profiles = new Map((repoProfiles.repos || []).map((repo) => [repo.id, repo]));
  const components = (atlasFacts.components || []).map((component) => {
    const profile = profiles.get(component.repo_id) || {};
    const counts = component.counts || {};
    const surfaces = component.surfaces || {};
    const surfaceRoutes = component.surface_routes || [];
    const layer = inferLayer(component.role);
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
    const layerDelta = LAYERS.findIndex((layer) => layer.id === a.layer) -
      LAYERS.findIndex((layer) => layer.id === b.layer);
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
  for (const finding of hotspots || []) {
    const matched = new Map();
    for (const itemPath of finding.paths || []) {
      const component = detectComponentForPath(itemPath, components);
      if (component) matched.set(component.targetId, component);
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

function inferLayer(role) {
  for (const layer of LAYERS) {
    if (layer.roles.includes(role)) return layer.id;
  }
  return 'integration';
}

function positionComponents(components) {
  const grouped = groupBy(components, (component) => component.layer);
  const positions = new Map();
  const xByLayer = {
    integration: 10,
    foundation: 31,
    compute: 53,
    access: 74,
    legacy: 90,
  };
  for (const layer of LAYERS) {
    const list = grouped.get(layer.id) || [];
    const count = Math.max(1, list.length);
    list.forEach((component, index) => {
      const y = count === 1 ? 52 : 30 + index * (54 / (count - 1));
      positions.set(component.targetId, { x: xByLayer[layer.id], y });
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
  const preferred = loaded.find((component) => component.targetId === 'apache-hive');
  if (preferred) return preferred.targetId;
  return [...(loaded.length ? loaded : model.components)].sort((a, b) => b.findings - a.findings)[0]?.targetId || '';
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
  const tour = params.get('tour');
  if (view && ['atlas', 'risks', 'sources', 'agent', 'graph'].includes(view)) state.view = view;
  if (component && state.model.componentByTarget.has(component)) state.selectedId = component;
  if (finding && state.model.findingById.has(finding)) selectFinding(finding);
  if (tour && ATLAS_TOURS.some((item) => item.id === tour)) state.activeTour = tour;
}

function updateHash() {
  const params = new URLSearchParams();
  params.set('view', state.view);
  if (state.selectedId) params.set('component', state.selectedId);
  if (state.selectedFindingId) params.set('finding', state.selectedFindingId);
  if (state.activeTour) params.set('tour', state.activeTour);
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
          ${results.length ? results.map(renderSearchResult).join('') : '<div class="empty-row">No landscape result</div>'}
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
  const coverage = model.coverage;
  const gapCount =
    (numberFrom(coverage.cannot_verify_surface_routes, 0) > 0 ? 1 : 0) +
    (coverage.runtime_topology === 'not_assessed' ? 1 : 0);
  return `
    <section class="hero-panel">
      <div class="hero-copy">
        <p class="product-line">${escapeHtml(landscapeLabel(model))}</p>
        <h1>One atlas for people and coding agents.</h1>
        <p>
          The loaded landscape is normalized into a local atlas: source code, trackers, wiki, docs,
          dependencies, findings, gaps and agent-authored claims round-trip through one bundle.
        </p>
      </div>
      <div class="hero-metrics" aria-label="Bundle coverage">
        ${metric('Repos', coverage.repo_count || model.components.length, 'source-visible')}
        ${metric('Surfaces', coverage.surface_route_count || 0, 'routes')}
        ${metric('Relations', coverage.relationship_count || model.relationships.length, 'repo + deps')}
        ${metric('Findings', coverage.hotspot_count || state.model.hotspots.length, 'clustered')}
        ${metric('Limits', gapCount, 'kept explicit')}
      </div>
      <div class="hero-selected">
        <span>Selected component</span>
        <strong>${escapeHtml(selected.label)}</strong>
        <em>${escapeHtml(selected.role)}</em>
      </div>
    </section>
  `;
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
    ${renderExecutiveBriefing(selected)}
    ${renderAtlasCockpit(selected)}
    <section class="atlas-grid">
      <aside class="left-rail">
        ${renderGuidedTour()}
        ${renderAtlasLoop()}
        ${renderQuestionStack()}
      </aside>
      <section id="atlas-map-stage" class="canvas-stage" aria-label="Landscape map">
        <div class="stage-head">
          <div>
            <p class="section-kicker">C1 -> C2 -> C3</p>
            <h2>Static architecture landscape</h2>
          </div>
          <div class="stage-legend">
            <span><i class="dot dot-source"></i> source</span>
            <span><i class="dot dot-meta"></i> metadata</span>
            <span><i class="dot dot-gap"></i> gap</span>
          </div>
        </div>
        ${renderMapIntelligence(selected)}
        ${renderLandscapeMap()}
      </section>
      <aside class="inspector">
        ${renderInspector(selected)}
      </aside>
    </section>
  `;
}

function renderExecutiveBriefing(selected) {
  const insights = state.model.insights;
  const briefActions = executiveBriefActions(insights);
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
  return `
    <button type="button" data-action="select-component" data-target="${escapeAttr(component.targetId)}">
      <span>${outbound ? 'out' : 'in'}</span>
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

function renderAtlasCockpit(selected) {
  const finding = activeFindingFor(selected);
  const sourcePath = finding ? (finding.paths || [])[0] || '' : '';
  return `
    <section class="cockpit-strip" aria-label="Demo cockpit">
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
  const active = ATLAS_TOURS.find((tour) => tour.id === state.activeTour) || ATLAS_TOURS[0];
  return `
    <section class="rail-card">
      <div class="rail-head">
        <span class="section-kicker">Guided routes</span>
        <strong>${escapeHtml(active.title)}</strong>
        <em>${escapeHtml(active.summary)}</em>
      </div>
      <div class="tour-switcher">
        ${ATLAS_TOURS.map((tour) => `
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
  const positions = model.graphPositions;
  const manifestEdges = model.edges.slice(0, 34);
  const selected = selectedComponent();
  const relationshipEdges = selectedRelationshipCorridor(selected).slice(0, 24);
  return `
    <div class="map-canvas atlas-network">
      <div class="map-orbit" aria-hidden="true"></div>
      <div class="context-node network-context">
        <span>C1 enterprise landscape</span>
        <strong>${escapeHtml(landscapeLabel(model))}</strong>
        <em>${escapeHtml(model.corpus.purpose || 'Local multi-repo corpus with code, metadata and runtime surface gaps.')}</em>
      </div>
      <div class="domain-lanes" aria-hidden="true">
        ${LAYERS.map((layer) => `
          <div class="domain-lane lane-${layer.id}">
            <span>${escapeHtml(layer.title)}</span>
          </div>
        `).join('')}
      </div>
      <svg class="dependency-svg network-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        ${manifestEdges.map((edge) => renderEdge(edge, positions)).join('')}
        ${relationshipEdges.map((edge) => renderEdge(edge, positions, 'relationship-edge')).join('')}
      </svg>
      <div class="network-nodes">
        ${model.components.map(renderComponentNode).join('')}
      </div>
      <div class="map-status">
        <span>${formatNumber(model.edges.length)} manifest edges</span>
        <span>${formatNumber(model.relationships.length)} relationship records</span>
        <span>runtime topology ${escapeHtml(model.coverage.runtime_topology || 'not_assessed')}</span>
      </div>
    </div>
  `;
}

function renderEdge(edge, positions, extraClass = '') {
  const from = positions.get(edge.from_target);
  const to = positions.get(edge.to_target);
  if (!from || !to) return '';
  const midX = (from.x + to.x) / 2;
  const selected = [edge.from_target, edge.to_target].includes(state.selectedId);
  return `
    <path class="${[selected ? 'is-selected' : '', extraClass].filter(Boolean).join(' ')}"
      d="M ${from.x} ${from.y} C ${midX} ${from.y - 6}, ${midX} ${to.y + 6}, ${to.x} ${to.y}"
      vector-effect="non-scaling-stroke">
      <title>${escapeHtml(edge.label || '')}</title>
    </path>
  `;
}

function renderComponentNode(component) {
  const selected = state.selectedId === component.targetId;
  const missingDocs = (component.surfaceRoutes || []).some((route) => route.slot === 'docs' && route.state === 'missing');
  const stateClass = component.evidenceState === 'source-visible' ? 'dot-source' : 'dot-meta';
  const pos = state.model.graphPositions.get(component.targetId) || { x: 50, y: 50 };
  const tone = component.findings > 350 ? 'hot' : component.findings > 150 ? 'warm' : 'calm';
  return `
    <button type="button" class="component-node node-${tone} ${selected ? 'is-selected' : ''}"
      style="--x:${pos.x}; --y:${pos.y};"
      data-action="select-component" data-target="${escapeAttr(component.targetId)}">
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
            <button type="button" data-action="select-component" data-target="${edge.from_target === component.targetId ? edge.to_target : edge.from_target}">
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
              <button type="button" class="mini-card mini-card--finding" data-action="select-component"
                data-target="${escapeAttr(edge.to_target)}">
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
  return `
    <article class="cluster-card ${active ? 'is-active' : ''}">
      <button type="button" class="cluster-main" data-action="cluster" data-cluster="${cluster.id}">
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
          ${renderEvidenceHandoffPanel(selected, activeFinding)}
          ${renderClaimsPanel(selected)}
          <div class="agent-panel">
            <div class="section-row">
              <h3>Edges to inspect</h3>
              <span>${selectedEdges.length}</span>
            </div>
            <div class="edge-list edge-list--compact">
              ${selectedEdges.map((edge) => `
                <button type="button" data-action="select-component"
                  data-target="${escapeAttr(edge.from_target === selected.targetId ? edge.to_target : edge.from_target)}">
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
  const selectedEdges = state.model.edges.filter((edge) =>
    edge.from_target === selected.targetId || edge.to_target === selected.targetId
  );
  return `
    <section class="wide-view graph-view">
      <div class="view-heading">
        <span class="section-kicker">Evidence graph</span>
        <h2>Trace dependency edges and visibility gaps.</h2>
        <p>Use this when the map raises a question: which manifest edge connects two repos, and which surfaces remain outside the local bundle.</p>
      </div>
      <div class="graph-columns">
        <section class="side-card">
          <h3>Selected dependency edges for ${escapeHtml(selected.label)}</h3>
          <div class="edge-list">
            ${selectedEdges.map((edge) => `
              <button type="button" data-action="select-component"
                data-target="${escapeAttr(edge.from_target === selected.targetId ? edge.to_target : edge.from_target)}">
                <span>${escapeHtml(edge.kind)}</span>
                <strong>${escapeHtml(edge.label || edge.id)}</strong>
                <em>${escapeHtml(edge.evidence_state || 'unknown')}</em>
              </button>
            `).join('') || '<p class="empty-copy">No selected dependency edge.</p>'}
          </div>
        </section>
        <section class="side-card">
          <h3>Known visibility gaps</h3>
          <div class="gap-list">
            ${state.model.gaps.map((gap) => `
              <div>
                <span>${escapeHtml(gap.evidence_state || gap.status || gap.state || 'unknown')}</span>
                <strong>${escapeHtml(gap.subject || gap.surface || gap.layer || 'gap')}</strong>
                <p>${escapeHtml(gap.summary || gap.detail || '')}</p>
              </div>
            `).join('')}
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
      render();
      const next = document.getElementById('global-search');
      if (next) {
        next.focus();
        next.setSelectionRange(state.query.length, state.query.length);
      }
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
      } else if (action === 'tour') {
        state.activeTour = target.dataset.tour || state.activeTour;
        const nextTour = ATLAS_TOURS.find((tour) => tour.id === state.activeTour);
        if (nextTour?.steps?.[0]) selectComponent(nextTour.steps[0]);
      } else if (action === 'question') {
        const questionTarget = target.dataset.target;
        if (questionTarget === 'risks') state.view = 'risks';
        if (questionTarget === 'sources') state.view = 'sources';
        if (questionTarget === 'gaps') state.view = 'graph';
        if (questionTarget === 'map') state.view = 'atlas';
      } else if (action === 'cluster') {
        state.activeCluster = state.activeCluster === target.dataset.cluster ? '' : target.dataset.cluster;
      } else if (action === 'copy') {
        await copyText(target.dataset.copy || '');
        state.toast = 'Copied command';
        setTimeout(() => {
          state.toast = '';
          render();
        }, 1200);
      }
      state.query = action === 'select-component' || action === 'open-component' || action === 'select-finding' || action === 'open-source' ? '' : state.query;
      render();
      if (scrollTarget) {
        requestAnimationFrame(() => {
          document.querySelector(scrollTarget)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    });
  });
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
}

function ensureSelectedFinding() {
  if (!state.model) return;
  const component = selectedComponent();
  if (component.findingsList.some((finding) => finding.id === state.selectedFindingId)) return;
  state.selectedFindingId = component.findingsList[0]?.id || '';
}

function selectedComponent() {
  return state.model.componentByTarget.get(state.selectedId) || state.model.components[0];
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
        action: 'view',
        view: 'risks',
        target: '',
      });
    }
  }

  for (const rel of state.model.relationships || []) {
    const haystack = [rel.summary, rel.type, rel.producer, rel.detail?.component, ...(rel.repos || [])].join(' ').toLowerCase();
    if (haystack.includes(q)) {
      const edge = relationshipToDisplayEdge(rel, selectedComponent());
      results.push({
        kind: rel.type || 'relationship',
        title: rel.summary || rel.id,
        meta: `${rel.evidence_state || 'metadata-visible'} / ${(rel.repos || []).length || 'binary'} repos`,
        action: edge?.to_target ? 'select-component' : 'view',
        target: edge?.to_target || '',
        view: edge?.to_target ? '' : 'graph',
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
        view: component ? '' : 'agent',
      });
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
  return [
    {
      label: 'Find this repo profile',
      command: `"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" repos --bundle "$BUNDLE_DIR" --repo ${repoArg} --limit 1`,
    },
    {
      label: 'Get selected repo hotspots',
      command: `"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" hotspots --bundle "$BUNDLE_DIR" --repo ${repoArg} --limit 20 --full`,
    },
    {
      label: 'Inspect repo relationships',
      command: `"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" relationships --bundle "$BUNDLE_DIR" --repo ${repoArg} --limit 20`,
    },
    {
      label: 'Search selected concept',
      command: `"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" search --bundle "$BUNDLE_DIR" --q ${labelArg} --limit 30`,
    },
    {
      label: 'Query selected atlas component',
      command: `"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" atlas --bundle "$BUNDLE_DIR" --section components --repo ${repoArg} --limit 5`,
    },
    {
      label: 'Import cited agent claims',
      command: `"$PORTOLAN_PATH/scripts/import-analysis-claims.sh" "$BUNDLE_DIR" claims.jsonl`,
    },
  ];
}

function findingCommands(component, finding) {
  if (!finding) return [];
  const repo = component.repoId;
  const path = (finding.paths || [])[0] || '';
  const line = evidenceLine(finding, path);
  const summary = cleanFindingSummary(finding.summary || finding.id);
  return [
    {
      label: 'Query matching hotspots',
      command: `"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" hotspots --bundle "$BUNDLE_DIR" --repo ${repo} --text ${quoteArg(summary)} --limit 10 --full`,
    },
    path ? {
      label: 'Read source snippet',
      command: `"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" source --bundle "$BUNDLE_DIR" --repo ${repo} --path ${quoteArg(path)} --line ${line} --radius 24`,
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

function landscapeLabel(model) {
  return model.corpus?.label ||
    model.reportSections?.find((section) => section.id === 'overview')?.blocks?.find((block) => block.type === 'text')?.text ||
    model.coverage?.target_root ||
    'Local software landscape';
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
    .replace(/^Apache\s+/i, '')
    .replace(/^apache-/i, '')
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
