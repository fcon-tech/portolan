const app = document.getElementById('demo-app');

const state = {
  data: null,
  selectedId: '',
  view: 'map',
  group: 'all',
  query: '',
};

const groupMeta = {
  compute: { label: 'Compute & Orchestration', color: '#4d8dff', x: 610, y: 186 },
  data: { label: 'Data Systems', color: '#ffd04a', x: 700, y: 404 },
  platform: { label: 'Platform & Governance', color: '#ff8b47', x: 875, y: 244 },
  service: { label: 'Services & Integrations', color: '#4ed5d1', x: 270, y: 400 },
  control: { label: 'Coordination', color: '#9c7cff', x: 238, y: 230 },
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
  const selected = componentById(state.selectedId) || atlasNodes[0];
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
        <aside class="summary-panel panel" id="overview">
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

        <section class="map-panel panel" id="map">
          <div class="map-toolbar">
            <label>View:
              <select aria-label="Map view">
                <option>Understand-Anything</option>
                <option>Risk clusters</option>
              </select>
            </label>
            <label>Layout:
              <select aria-label="Map layout">
                <option>Force Directed</option>
                <option>Dependency fanout</option>
              </select>
            </label>
            <div class="layer-tabs" aria-label="Map filters">
              ${groupButton('all', 'Filters')}
              ${groupButton('compute', 'Compute')}
              ${groupButton('data', 'Data')}
              ${groupButton('platform', 'Platform')}
            </div>
            <div class="zoom-actions" aria-label="Map controls">
              <button type="button">+</button>
              <button type="button">-</button>
              <button type="button">[]</button>
            </div>
          </div>
          ${renderMap(selected)}
          <div class="map-footer">
            <span>Legend:</span>
            ${Object.entries(groupMeta).map(([, meta]) => `<span><i style="background:${meta.color}"></i>${escapeHtml(meta.label.split(' ')[0])}</span>`).join('')}
            <span class="line-sample"></span><span>Shared dependency</span>
            <strong>Showing ${filteredComponents().length} of ${atlasNodes.length} nodes</strong>
          </div>
        </section>

        ${renderInspector(selected)}

        <section class="repo-panel panel" id="repos">
          <div class="repo-head">
            <h2>Atlas nodes <span>(${atlasNodes.length})</span></h2>
            <input class="repo-search" type="search" value="${escapeAttr(state.query)}" placeholder="Search nodes..." aria-label="Search atlas nodes">
            <select><option>Risk: All</option><option>Risk: High</option></select>
            <select><option>Type: All</option><option>Type: Application</option></select>
            <button type="button" class="export-button">Export</button>
          </div>
          <div class="repo-table" role="table" aria-label="Bigtop atlas nodes">
            <div class="repo-table-row repo-table-head" role="row">
              <span></span><span>Node</span><span>Type</span><span>Cluster</span><span>Files</span><span>Risk Score</span><span>Top Risk Drivers</span><span>Relations</span><span>State</span>
            </div>
            ${filteredComponents().map(renderTableRow).join('')}
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
      state.view = button.dataset.view;
      document.getElementById(state.view === 'drilldown' ? 'risks' : state.view)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      render();
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
      render();
    });
  });
  app.querySelectorAll('.search, .repo-search').forEach((input) => {
    input.addEventListener('input', (event) => {
      state.query = event.target.value;
      if (state.query.trim()) state.group = 'all';
      render();
    });
  });
}

function renderMap(selected) {
  const components = filteredComponents();
  const selectedRelations = state.data.relationships.filter((relationship) => relationship.repos.includes(selected.id));
  const selectedNeighbors = new Set(selectedRelations.flatMap((relationship) => relationship.repos));
  const nodes = layoutNodes(components);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const selectedNode = nodeById.get(selected.id);
  const links = buildVisibleLinks(nodeById, selected);

  return `
    <svg class="atlas-map" viewBox="0 0 1040 650" role="img" aria-label="Bigtop clustered component map">
      <defs>
        <filter id="nodeGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="blur"></feGaussianBlur>
          <feMerge><feMergeNode in="blur"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
        </filter>
      </defs>
      ${Object.entries(groupMeta).map(([group, meta]) => {
        const count = components.filter((component) => component.group === group).length;
        if (!count) return '';
        return `<text class="cluster-label" x="${meta.x}" y="${meta.y - 76}" fill="${meta.color}">${escapeHtml(meta.label)} (${count} ${count === 1 ? 'node' : 'nodes'})</text>`;
      }).join('')}
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
        const meta = groupMeta[node.group] || groupMeta.service;
        return `
          <g class="map-node${selectedClass}${mutedClass}" data-component="${escapeAttr(node.id)}" transform="translate(${node.x} ${node.y})">
            <circle r="${node.r}" fill="${meta.color}" filter="${node.id === selected.id ? 'url(#nodeGlow)' : ''}"></circle>
            <title>${escapeHtml(node.label)}</title>
          </g>
        `;
      }).join('')}
    </svg>
  `;
}

function layoutNodes(components) {
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
  return `
    <aside class="detail-panel panel" aria-label="Selected repository details">
      <div class="detail-title">
        <span class="repo-dot" style="background:${meta.color}"></span>
        <div>
          <h2>${escapeHtml(repoSlug(component))}</h2>
          <span>${escapeHtml(typeLabel(component))}</span>
        </div>
        <button type="button" aria-label="Close details">x</button>
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
      <button type="button" class="text-link">View full details</button>
    </aside>
  `;
}

function renderTableRow(component) {
  const meta = groupMeta[component.group] || groupMeta.service;
  const score = riskScore(component);
  return `
    <button type="button" class="repo-table-row" data-component="${escapeAttr(component.id)}" role="row">
      <span><input type="checkbox" aria-label="Select ${escapeAttr(component.label)}"></span>
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

function filteredComponents() {
  const query = state.query.trim().toLowerCase();
  return (state.data.atlas_nodes || state.data.components)
    .filter((component) => state.group === 'all' || component.group === state.group)
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
