const app = document.getElementById('demo-app');

const state = {
  data: null,
  selectedId: '',
  view: 'map',
  group: 'all',
  query: '',
  mapMode: 'ua',
  layout: 'force',
  zoom: 1,
  detailOpen: false,
  riskFilter: 'all',
  typeFilter: 'all',
};

const groupMeta = {
  compute: { label: 'Compute & Orchestration', color: '#4d8dff', x: 610, y: 186 },
  data: { label: 'Data Systems', color: '#ffd04a', x: 700, y: 404 },
  platform: { label: 'Platform & Governance', color: '#ff8b47', x: 875, y: 244 },
  service: { label: 'Services & Integrations', color: '#4ed5d1', x: 270, y: 400 },
  control: { label: 'Coordination', color: '#9c7cff', x: 238, y: 230 },
};

const viewTargets = {
  overview: 'overview',
  map: 'map',
  repos: 'repos',
  risks: 'risks',
  drilldown: 'drilldown-panel',
};

init();

async function init() {
  try {
    const response = await fetch('data/bigtop-demo.json');
    if (!response.ok) throw new Error(`data/bigtop-demo.json returned HTTP ${response.status}`);
    state.data = await response.json();
    state.selectedId = chooseDefault(state.data.atlas_nodes || state.data.components);
    render();
  } catch (error) {
    app.innerHTML = `<main class="loading"><div class="loading-mark">Portolan</div><p>${escapeHtml(error.message || String(error))}</p></main>`;
  }
}

function chooseDefault(components) {
  return [...components].sort((a, b) => riskScore(b) - riskScore(a) || b.relationships - a.relationships)[0]?.id || '';
}

function render() {
  const data = state.data;
  const atlasNodes = data.atlas_nodes || data.components;
  const visibleNodes = filteredComponents();
  let selected = componentById(state.selectedId) || visibleNodes[0] || atlasNodes[0];
  if (visibleNodes.length && !visibleNodes.some((component) => component.id === selected.id)) {
    selected = visibleNodes[0];
    state.selectedId = selected.id;
  }
  app.innerHTML = `
    <div class="demo-shell">
      <header class="topbar">
        <a class="brand" href="../">
          <span class="brand-compass" aria-hidden="true"></span>
          <span class="brand-copy"><strong>PORTOLAN</strong><em>BIGTOP ATLAS</em></span>
        </a>
        <nav class="nav" aria-label="Demo navigation">
          ${navButton('overview', 'Overview')}
          ${navButton('map', 'Map')}
          ${navButton('repos', 'Repos')}
          ${navButton('risks', 'Risks')}
          ${navButton('drilldown', 'Drill-down')}
        </nav>
        <div class="top-actions">
          <input class="search" type="search" value="${escapeAttr(state.query)}" placeholder="Search anything..." aria-label="Search atlas">
          <a class="home-link" href="../portolan/">Product</a>
        </div>
      </header>

      <main class="atlas-workspace">
        <aside class="summary-panel panel ${state.view === 'overview' ? 'is-view-focus' : ''}" id="overview">
          <h1>${escapeHtml(data.title)}</h1>
          <p class="lede">Understand the structure, dependencies, and risk signals across the Apache Bigtop ecosystem.</p>
          <section class="executive-summary">
            <h2>Executive summary</h2>
            <p>${escapeHtml(data.narrative[0]?.body || data.subtitle)}</p>
            <button type="button" data-view="drilldown" class="text-link">Read more</button>
          </section>
          <div class="metric-grid">
            ${metric('Source repos', data.totals.source_repos || data.totals.repos, '+0', 'Git repositories scanned', 'teal')}
            ${metric('Relationships', relationFanout(data), '+8%', 'Dependency touches', 'blue')}
            ${metric('Hotspots', data.hotspots.length, '+3', 'Bounded public rows', 'orange')}
            ${metric('Atlas nodes', data.totals.atlas_nodes || atlasNodes.length, '+modules', 'Repos + packages + tests', 'muted')}
          </div>
          <section class="recent-signals">
            <h2>Recent signals</h2>
            ${topRisks().slice(0, 4).map((risk, index) => `
              <button type="button" data-component="${escapeAttr(risk.component.id)}" class="signal-row">
                <span class="signal-dot signal-${index % 4}"></span>
                <span>${escapeHtml(signalSummary(risk))}</span>
                <em>${index + 2}h ago</em>
              </button>
            `).join('')}
          </section>
        </aside>

        <section class="map-panel panel ${state.view === 'map' ? 'is-view-focus' : ''}" id="map">
          <div class="map-toolbar">
            <label>View:
              <select data-control="map-mode" aria-label="Map view">
                <option value="ua" ${selectedAttr(state.mapMode, 'ua')}>Understand-Anything</option>
                <option value="risk" ${selectedAttr(state.mapMode, 'risk')}>Risk clusters</option>
              </select>
            </label>
            <label>Layout:
              <select data-control="layout" aria-label="Map layout">
                <option value="force" ${selectedAttr(state.layout, 'force')}>Force Directed</option>
                <option value="fanout" ${selectedAttr(state.layout, 'fanout')}>Dependency fanout</option>
              </select>
            </label>
            <div class="layer-tabs" aria-label="Map filters">
              ${groupButton('all', 'All')}
              ${groupButton('compute', 'Compute')}
              ${groupButton('data', 'Data')}
              ${groupButton('platform', 'Platform')}
            </div>
            <div class="zoom-actions" aria-label="Map controls">
              <button type="button" data-zoom="in" aria-label="Zoom in">+</button>
              <button type="button" data-zoom="out" aria-label="Zoom out">-</button>
              <button type="button" data-zoom="fit" aria-label="Fit map">[]</button>
              <span class="zoom-value">${Math.round(state.zoom * 100)}%</span>
            </div>
          </div>
          ${renderMap(selected)}
          <div class="map-footer">
            <span>Legend:</span>
            ${legendItems()}
            <span class="line-sample"></span><span>Shared dependency</span>
            <strong>Showing ${filteredComponents().length} of ${atlasNodes.length} nodes</strong>
          </div>
        </section>

        ${renderInspector(selected)}

        <section class="repo-panel panel ${state.view === 'repos' ? 'is-view-focus' : ''}" id="repos">
          <div class="repo-head">
            <h2>Atlas nodes <span>(${visibleNodes.length}/${atlasNodes.length})</span></h2>
            <input class="repo-search" type="search" value="${escapeAttr(state.query)}" placeholder="Search nodes..." aria-label="Search atlas nodes">
            <select data-filter="risk" aria-label="Filter by risk">
              <option value="all" ${selectedAttr(state.riskFilter, 'all')}>Risk: All</option>
              <option value="high" ${selectedAttr(state.riskFilter, 'high')}>Risk: High</option>
              <option value="medium" ${selectedAttr(state.riskFilter, 'medium')}>Risk: Medium</option>
              <option value="low" ${selectedAttr(state.riskFilter, 'low')}>Risk: Low</option>
            </select>
            <select data-filter="type" aria-label="Filter by type">
              <option value="all" ${selectedAttr(state.typeFilter, 'all')}>Type: All</option>
              <option value="Application" ${selectedAttr(state.typeFilter, 'Application')}>Type: Application</option>
              <option value="Platform" ${selectedAttr(state.typeFilter, 'Platform')}>Type: Platform</option>
              <option value="Tool" ${selectedAttr(state.typeFilter, 'Tool')}>Type: Tool</option>
              <option value="Library" ${selectedAttr(state.typeFilter, 'Library')}>Type: Library</option>
            </select>
            <button type="button" class="export-button" data-action="export">Export</button>
          </div>
          <div class="repo-table" role="table" aria-label="Bigtop atlas nodes">
            <div class="repo-table-row repo-table-head" role="row">
              <span></span><span>Node</span><span>Type</span><span>Cluster</span><span>Files</span><span>Risk Score</span><span>Top Risk Drivers</span><span>Relations</span><span>State</span>
            </div>
            ${visibleNodes.map(renderTableRow).join('')}
          </div>
        </section>
      </main>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  app.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      navigateTo(button.dataset.view);
    });
  });
  app.querySelectorAll('[data-group]').forEach((button) => {
    button.addEventListener('click', () => {
      state.group = state.group === button.dataset.group ? 'all' : button.dataset.group;
      render();
    });
  });
  app.querySelectorAll('[data-component]').forEach((element) => {
    element.addEventListener('click', () => {
      state.selectedId = element.dataset.component;
      state.view = 'map';
      state.detailOpen = false;
      render();
      scrollToView('map');
    });
  });
  app.querySelectorAll('.search, .repo-search').forEach((input) => {
    input.addEventListener('input', (event) => {
      state.query = event.target.value;
      if (state.query.trim()) state.group = 'all';
      render();
    });
  });
  app.querySelector('[data-control="map-mode"]')?.addEventListener('change', (event) => {
    state.mapMode = event.target.value;
    state.view = 'map';
    render();
    scrollToView('map');
  });
  app.querySelector('[data-control="layout"]')?.addEventListener('change', (event) => {
    state.layout = event.target.value;
    state.view = 'map';
    render();
    scrollToView('map');
  });
  app.querySelectorAll('[data-zoom]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.zoom === 'in') state.zoom = Math.min(1.6, Number((state.zoom + 0.15).toFixed(2)));
      if (button.dataset.zoom === 'out') state.zoom = Math.max(0.7, Number((state.zoom - 0.15).toFixed(2)));
      if (button.dataset.zoom === 'fit') state.zoom = 1;
      state.view = 'map';
      render();
      scrollToView('map');
    });
  });
  app.querySelector('[data-filter="risk"]')?.addEventListener('change', (event) => {
    state.riskFilter = event.target.value;
    render();
    scrollToView('repos');
  });
  app.querySelector('[data-filter="type"]')?.addEventListener('change', (event) => {
    state.typeFilter = event.target.value;
    render();
    scrollToView('repos');
  });
  app.querySelector('[data-action="full-details"]')?.addEventListener('click', () => {
    state.detailOpen = !state.detailOpen;
    state.view = state.detailOpen ? 'drilldown' : 'map';
    render();
    scrollToView(state.detailOpen ? 'drilldown' : 'map');
  });
  app.querySelector('[data-action="close-details"]')?.addEventListener('click', () => {
    state.detailOpen = false;
    state.view = 'map';
    render();
    scrollToView('map');
  });
  app.querySelector('[data-action="export"]')?.addEventListener('click', exportAtlas);
}

function navigateTo(view) {
  state.view = view;
  if (view === 'drilldown') state.detailOpen = true;
  render();
  scrollToView(view);
}

function scrollToView(view) {
  requestAnimationFrame(() => {
    const id = viewTargets[view] || view;
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: view === 'repos' ? 'start' : 'nearest',
      inline: 'nearest',
    });
  });
}

function renderMap(selected) {
  const components = filteredComponents();
  const selectedRelations = state.data.relationships.filter((relationship) => relationship.repos.includes(selected.id));
  const selectedNeighbors = new Set(selectedRelations.flatMap((relationship) => relationship.repos));
  const nodes = layoutNodes(components, selected, selectedNeighbors);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const selectedNode = nodeById.get(selected.id);
  const links = buildVisibleLinks(nodeById, selected);

  return `
    <svg class="atlas-map" viewBox="${mapViewBox()}" role="img" aria-label="Bigtop clustered component map">
      <defs>
        <filter id="nodeGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="blur"></feGaussianBlur>
          <feMerge><feMergeNode in="blur"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
        </filter>
      </defs>
      ${renderMapLabels(components, selected)}
      ${links.map((link) => {
        const from = nodeById.get(link.from);
        const to = nodeById.get(link.to);
        const isSelected = from.id === selected.id || to.id === selected.id;
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2 - 28;
        return `<path class="map-link ${isSelected ? 'is-selected' : ''}" d="M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}"></path>`;
      }).join('')}
      ${selectedNode ? `
        <circle class="focus-ring" cx="${selectedNode.x}" cy="${selectedNode.y}" r="${selectedNode.r + 12}"></circle>
        <text class="node-callout" x="${selectedNode.x + 32}" y="${selectedNode.y + 6}">${escapeHtml(shortLabel(selected.label))}</text>
      ` : ''}
      ${nodes.map((node) => {
        const selectedClass = node.id === selected.id ? ' is-selected' : '';
        const mutedClass = selectedNeighbors.size && !selectedNeighbors.has(node.id) && node.id !== selected.id ? ' is-muted' : '';
        const color = nodeColor(node);
        return `
          <g class="map-node${selectedClass}${mutedClass}" data-component="${escapeAttr(node.id)}" transform="translate(${node.x} ${node.y})">
            <circle r="${node.r}" fill="${color}" filter="${node.id === selected.id ? 'url(#nodeGlow)' : ''}"></circle>
            <title>${escapeHtml(node.label)}</title>
          </g>
        `;
      }).join('')}
    </svg>
  `;
}

function renderMapLabels(components, selected) {
  if (state.layout === 'fanout') {
    return `
      <text class="cluster-label" x="520" y="102" fill="${nodeColor(selected)}">Selected node</text>
      <text class="cluster-label muted-label" x="520" y="194">Direct dependency fanout</text>
      <text class="cluster-label muted-label" x="520" y="546">Other visible nodes</text>
    `;
  }
  return Object.entries(groupMeta).map(([group, meta]) => {
    const count = components.filter((component) => component.group === group).length;
    if (!count) return '';
    return `<text class="cluster-label" x="${meta.x}" y="${meta.y - 76}" fill="${meta.color}">${escapeHtml(meta.label)} (${count} ${count === 1 ? 'node' : 'nodes'})</text>`;
  }).join('');
}

function layoutNodes(components, selected, selectedNeighbors) {
  if (state.layout === 'fanout') return fanoutLayout(components, selected, selectedNeighbors);
  return groupedLayout(components);
}

function groupedLayout(components) {
  const byGroup = components.reduce((acc, component) => {
    (acc[component.group] ||= []).push(component);
    return acc;
  }, {});

  return Object.entries(byGroup).flatMap(([group, rows]) => {
    const meta = groupMeta[group] || groupMeta.service;
    return rows.map((component, index) => {
      const angle = (index / rows.length) * Math.PI * 2 - Math.PI / 2;
      const ring = rows.length <= 2 ? 36 : 62;
      return {
        ...component,
        x: meta.x + Math.cos(angle) * ring,
        y: meta.y + Math.sin(angle) * ring,
        r: Math.max(7, Math.min(15, 6 + Math.sqrt(component.files) / 36 + component.relationships / 14)),
      };
    });
  });
}

function fanoutLayout(components, selected, selectedNeighbors) {
  const rows = [...components].sort((a, b) => {
    if (a.id === selected.id) return -1;
    if (b.id === selected.id) return 1;
    const aNeighbor = selectedNeighbors.has(a.id);
    const bNeighbor = selectedNeighbors.has(b.id);
    if (aNeighbor !== bNeighbor) return aNeighbor ? -1 : 1;
    return (b.relationships || 0) - (a.relationships || 0) || riskScore(b) - riskScore(a);
  });
  const neighbors = rows.filter((component) => component.id !== selected.id && selectedNeighbors.has(component.id));
  const rest = rows.filter((component) => component.id !== selected.id && !selectedNeighbors.has(component.id));
  const placed = [{
    ...selected,
    x: 520,
    y: 325,
    r: Math.max(13, Math.min(19, 9 + Math.sqrt(selected.files || 0) / 40 + (selected.relationships || 0) / 16)),
  }];
  neighbors.forEach((component, index) => {
    const angle = (index / Math.max(1, neighbors.length)) * Math.PI * 2 - Math.PI / 2;
    const radius = 155 + (index % 3) * 22;
    placed.push({
      ...component,
      x: 520 + Math.cos(angle) * radius,
      y: 325 + Math.sin(angle) * radius,
      r: nodeRadius(component),
    });
  });
  rest.forEach((component, index) => {
    const angle = (index / Math.max(1, rest.length)) * Math.PI * 2 - Math.PI / 2;
    const radius = 270 + (index % 4) * 18;
    placed.push({
      ...component,
      x: 520 + Math.cos(angle) * radius,
      y: 325 + Math.sin(angle) * radius,
      r: Math.max(5, nodeRadius(component) - 2),
    });
  });
  return placed;
}

function nodeRadius(component) {
  return Math.max(7, Math.min(15, 6 + Math.sqrt(component.files || 0) / 36 + (component.relationships || 0) / 14));
}

function mapViewBox() {
  const width = 1040 / state.zoom;
  const height = 650 / state.zoom;
  return `${(1040 - width) / 2} ${(650 - height) / 2} ${width} ${height}`;
}

function nodeColor(component) {
  if (state.mapMode !== 'risk') return (groupMeta[component.group] || groupMeta.service).color;
  const score = riskScore(component);
  if (score >= 70) return '#ff6b63';
  if (score >= 45) return '#ffb84d';
  return '#67d978';
}

function legendItems() {
  if (state.mapMode === 'risk') {
    return [
      ['#ff6b63', 'High risk'],
      ['#ffb84d', 'Medium risk'],
      ['#67d978', 'Low risk'],
    ].map(([color, label]) => `<span><i style="background:${color}"></i>${label}</span>`).join('');
  }
  return Object.entries(groupMeta)
    .map(([, meta]) => `<span><i style="background:${meta.color}"></i>${escapeHtml(meta.label.split(' ')[0])}</span>`)
    .join('');
}

function buildVisibleLinks(nodeById, selected) {
  const links = [];
  const seen = new Set();
  const add = (from, to, selectedLink = false) => {
    if (!nodeById.has(from) || !nodeById.has(to) || from === to) return;
    const key = [from, to].sort().join(':');
    if (seen.has(key)) return;
    seen.add(key);
    links.push({ from, to, selectedLink });
  };
  for (const relationship of state.data.relationships) {
    const repos = relationship.repos.filter((repo) => nodeById.has(repo));
    for (let i = 1; i < Math.min(repos.length, 5); i += 1) add(repos[0], repos[i], repos.includes(selected.id));
    if (repos.includes(selected.id)) {
      repos.filter((repo) => repo !== selected.id).slice(0, 14).forEach((repo) => add(selected.id, repo, true));
    }
  }
  return links.sort((a, b) => Number(a.selectedLink) - Number(b.selectedLink)).slice(0, 70);
}

function renderInspector(component) {
  const score = riskScore(component);
  const relations = state.data.relationships.filter((relationship) => relationship.repos.includes(component.id)).slice(0, 5);
  const meta = groupMeta[component.group] || groupMeta.service;
  const detailsVisible = state.detailOpen || state.view === 'drilldown';
  return `
    <aside class="detail-panel panel ${state.view === 'risks' || state.view === 'drilldown' ? 'is-view-focus' : ''}" id="details" aria-label="Selected repository details">
      <div class="detail-title">
        <span class="repo-dot" style="background:${meta.color}"></span>
        <div>
          <h2>${escapeHtml(repoSlug(component))}</h2>
          <span>${escapeHtml(typeLabel(component))}</span>
        </div>
        <button type="button" data-action="close-details" aria-label="Collapse drill-down">x</button>
      </div>
      <dl class="detail-list">
        <dt>Group ID</dt><dd>org.apache.bigtop</dd>
        <dt>Artifact ID</dt><dd>${escapeHtml(repoSlug(component))}</dd>
        <dt>Type</dt><dd>${escapeHtml(typeLabel(component))}</dd>
        <dt>Language</dt><dd>${escapeHtml(((component.languages || [])[0]?.ext || '').replace('.', '').toUpperCase() || 'mixed')}</dd>
        <dt>License</dt><dd>Apache-2.0</dd>
        <dt>Description</dt><dd>${escapeHtml(component.summary || component.role)}</dd>
      </dl>
      <section class="risk-score" id="risks">
        <div><span>Risk score</span><strong>${score}<em>/ 100</em></strong></div>
        <div class="risk-bar"><span style="width:${score}%"></span></div>
      </section>
      <section class="risk-drivers">
        <h3>Top risk drivers</h3>
        ${driverRow('Medium findings', component.medium || 0)}
        ${driverRow('Dependency fanout', component.relationships || 0)}
        ${driverRow('Missing surfaces', (component.surfaces || []).filter((surface) => surface.state === 'missing').length)}
        ${driverRow('Unknown runtime', 1)}
      </section>
      <section class="neighbors">
        <h3>Neighbors (direct)</h3>
        ${relations.map((relationship) => `
          <div class="neighbor-row">
            <span class="repo-dot" style="background:${meta.color}"></span>
            <span>${escapeHtml(relationship.component || relationship.summary)}</span>
            <em>${relationship.count}</em>
          </div>
        `).join('')}
      </section>
      <button type="button" class="text-link detail-toggle" data-action="full-details">${detailsVisible ? 'Hide full details' : 'View full details'} -></button>
      ${detailsVisible ? renderFullDetails(component, relations) : ''}
    </aside>
  `;
}

function renderFullDetails(component, relations) {
  return `
    <section class="drilldown-panel" id="drilldown-panel">
      <h3>Drill-down</h3>
      <div class="detail-kpis">
        ${miniKpi('Source', component.source || component.kind || 'visible')}
        ${miniKpi('Evidence', component.evidence_state || 'visible')}
        ${miniKpi('Manifest in/out', `${component.manifest_in || 0} / ${component.manifest_out || 0}`)}
        ${miniKpi('Files', compact(component.files || 0))}
      </div>
      <div class="detail-block">
        <h4>Surfaces</h4>
        ${(component.surfaces || []).length ? component.surfaces.map((surface) => `
          <a class="surface-row" href="${escapeAttr(surface.url || '#')}" ${surface.url ? 'target="_blank" rel="noreferrer"' : 'aria-disabled="true"'} data-empty="${surface.url ? 'false' : 'true'}">
            <span>${escapeHtml(surface.label || surface.kind)}</span>
            <em>${escapeHtml(surface.state || surface.evidence_state || 'unknown')}</em>
          </a>
        `).join('') : '<p class="empty-state">No explicit surfaces in this node.</p>'}
      </div>
      <div class="detail-block">
        <h4>Top findings</h4>
        ${(component.top_findings || []).length ? component.top_findings.slice(0, 5).map((finding) => `
          <div class="finding-row">
            <strong>${escapeHtml(finding.kind || 'signal')}</strong>
            <span>${escapeHtml(finding.summary || finding.id)}</span>
            <em>${escapeHtml(finding.severity || finding.evidence_state || 'info')}</em>
          </div>
        `).join('') : '<p class="empty-state">No top findings for this node.</p>'}
      </div>
      <div class="detail-block">
        <h4>Relationship anchors</h4>
        ${relations.length ? relations.map((relationship) => `
          <div class="finding-row">
            <strong>${escapeHtml(relationship.type || 'relationship')}</strong>
            <span>${escapeHtml(relationship.summary || relationship.component)}</span>
            <em>${relationship.count || 0}</em>
          </div>
        `).join('') : '<p class="empty-state">No direct relationship anchors in current filter.</p>'}
      </div>
    </section>
  `;
}

function renderTableRow(component) {
  const meta = groupMeta[component.group] || groupMeta.service;
  const score = riskScore(component);
  const selectedClass = state.selectedId === component.id ? ' is-selected' : '';
  return `
    <button type="button" class="repo-table-row${selectedClass}" data-component="${escapeAttr(component.id)}" role="row">
      <span><span class="row-marker" aria-hidden="true"></span></span>
      <span class="repo-name" style="color:${meta.color}">${escapeHtml(repoSlug(component))}</span>
      <span><i style="background:${meta.color}"></i>${escapeHtml(typeLabel(component))}</span>
      <span>${escapeHtml(meta.label)}</span>
      <span>${compact(component.files)}</span>
      <span><strong class="score score-${riskBucket(score)}">${score}</strong></span>
      <span class="driver-icons">${component.medium || 0} medium / ${component.findings || 0} total</span>
      <span>${component.relationships || 0}</span>
      <span>${escapeHtml(component.evidence_state || component.lifecycle || 'visible')}</span>
    </button>
  `;
}

function metric(label, value, delta, caption, tone) {
  return `
    <article class="metric metric-${tone}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
      <em>${escapeHtml(delta)}</em>
      <p>${escapeHtml(caption)}</p>
    </article>
  `;
}

function driverRow(label, value) {
  return `<div class="driver-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
}

function miniKpi(label, value) {
  return `<div class="mini-kpi"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
}

function filteredComponents() {
  const query = state.query.trim().toLowerCase();
  return (state.data.atlas_nodes || state.data.components)
    .filter((component) => state.group === 'all' || component.group === state.group)
    .filter((component) => state.riskFilter === 'all' || riskBucket(riskScore(component)) === state.riskFilter)
    .filter((component) => state.typeFilter === 'all' || typeLabel(component) === state.typeFilter)
    .filter((component) => {
      if (!query) return true;
      return [component.label, repoSlug(component), component.role, component.kind, component.group, component.summary, component.backing_path]
        .join(' ')
        .toLowerCase()
        .includes(query);
    })
    .sort((a, b) => riskScore(b) - riskScore(a) || b.relationships - a.relationships || b.files - a.files);
}

function topRisks() {
  return state.data.components
    .flatMap((component) => component.top_findings.map((finding) => ({ ...finding, component })))
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || riskScore(b.component) - riskScore(a.component));
}

function signalSummary(risk) {
  const label = repoSlug(risk.component);
  if (risk.kind === 'duplication') return `Duplicated block in ${label}`;
  if (risk.kind === 'config') return `Config surface detected in ${label}`;
  return `${risk.severity || 'Risk'} signal in ${label}`;
}

function componentById(id) {
  return (state.data.atlas_nodes || state.data.components).find((component) => component.id === id);
}

function relationFanout(data) {
  return data.relationships.reduce((sum, relationship) => sum + (relationship.count || 0), 0);
}

function riskScore(component) {
  return Math.max(1, Math.min(99, Math.round((component.medium || 0) * 0.22 + (component.relationships || 0) * 1.5 + (component.findings || 0) * 0.025)));
}

function riskBucket(score) {
  if (score >= 70) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

function typeLabel(component) {
  if (component.group === 'data' || component.group === 'compute') return 'Application';
  if (component.group === 'platform') return 'Platform';
  if (component.group === 'control') return 'Tool';
  return 'Library';
}

function repoSlug(component) {
  return component.label.toLowerCase().replace(/^apache /, 'bigtop-').replace(/\s+/g, '-');
}

function navButton(view, label) {
  return `<button type="button" data-view="${view}" class="${state.view === view ? 'is-active' : ''}">${label}</button>`;
}

function groupButton(group, label) {
  return `<button type="button" data-group="${group}" class="${state.group === group ? 'is-active' : ''}">${label}</button>`;
}

function selectedAttr(current, value) {
  return current === value ? 'selected' : '';
}

function exportAtlas() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'bigtop-portolan-atlas.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function severityRank(severity) {
  return { critical: 5, high: 4, medium: 3, low: 2, info: 1 }[severity] || 0;
}

function compact(value) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value) || 0);
}

function shortLabel(label) {
  return label.replace(/^Apache\s+/, '').replace(/^apache-/, '').slice(0, 18);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
