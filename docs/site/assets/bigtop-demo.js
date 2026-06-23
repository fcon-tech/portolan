const app = document.getElementById('demo-app');

const state = {
  data: null,
  selectedId: '',
  view: 'overview',
  group: 'all',
  query: '',
};

const groupColor = {
  platform: '#49d6c5',
  compute: '#63b7ff',
  data: '#a99cff',
  control: '#f1b65c',
  service: '#6fd28c',
};

init();

async function init() {
  try {
    const response = await fetch('data/bigtop-demo.json');
    if (!response.ok) throw new Error(`data/bigtop-demo.json returned HTTP ${response.status}`);
    state.data = await response.json();
    state.selectedId = chooseDefault(state.data.components);
    render();
  } catch (error) {
    app.innerHTML = `<main class="loading"><div class="loading-mark">Portolan</div><p>${escapeHtml(error.message || String(error))}</p></main>`;
  }
}

function chooseDefault(components) {
  return [...components].sort((a, b) => b.relationships - a.relationships || b.files - a.files)[0]?.id || '';
}

function render() {
  const data = state.data;
  const selected = componentById(state.selectedId) || data.components[0];
  app.innerHTML = `
    <div class="demo-shell">
      <header class="topbar">
        <a class="brand" href="../">
          <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
          <span><strong>Portolan Bigtop Atlas</strong><span>public demo over a large OSS landscape</span></span>
        </a>
        <nav class="nav" aria-label="Demo navigation">
          ${navButton('overview', 'Overview')}
          ${navButton('map', 'Map')}
          ${navButton('repos', 'Repos')}
          ${navButton('risks', 'Risks')}
          <a class="home-link" href="../portolan/">Product</a>
        </nav>
        <input class="search" type="search" value="${escapeAttr(state.query)}" placeholder="Find repo, role, dependency" aria-label="Search atlas">
      </header>

      <main>
        <section class="hero" id="overview">
          <aside class="brief panel">
            <p class="demo-label">Apache Bigtop demo</p>
            <h1>${escapeHtml(data.title)}</h1>
            <p class="lede">${escapeHtml(data.subtitle)}</p>
            <div class="metric-grid">
              ${metric('Repositories', data.totals.repos)}
              ${metric('Files mapped', compact(data.totals.files))}
              ${metric('Relationships', data.relationships.length)}
              ${metric('Findings', compact(data.totals.findings))}
            </div>
            <div class="narrative">
              ${data.narrative.map((item) => `
                <article>
                  <h3>${escapeHtml(item.title)}</h3>
                  <p>${escapeHtml(item.body)}</p>
                </article>
              `).join('')}
            </div>
          </aside>
          <section class="map-panel panel" id="map">
            <div class="map-toolbar">
              <div class="layer-tabs" aria-label="Map layers">
                ${groupButton('all', 'All')}
                ${groupButton('platform', 'Platform')}
                ${groupButton('compute', 'Compute')}
                ${groupButton('data', 'Data')}
                ${groupButton('control', 'Control')}
              </div>
              <button class="map-action" type="button" data-action="focus-risk">Focus risk</button>
            </div>
            ${renderMap(selected)}
            ${renderInspector(selected)}
          </section>
        </section>

        <section class="section" id="repos">
          <div class="section-grid">
            <div class="panel">
              <div class="section-head">
                <div>
                  <h2>Repositories by inspection priority</h2>
                  <p>Sorted by relationship count, findings, and scale. Select a row to update the map inspector.</p>
                </div>
              </div>
              ${filteredComponents().slice(0, 14).map(renderRepoRow).join('')}
            </div>
            <div class="panel" id="risks">
              <div class="section-head">
                <div>
                  <h2>Drill-down queue</h2>
                  <p>Public demo records are bounded and sanitized; source snippets stay out of Pages.</p>
                </div>
              </div>
              ${topRisks().slice(0, 10).map(renderRiskRow).join('')}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="panel">
            <div class="section-head">
              <div>
                <h2>Cross-repo connective tissue</h2>
                <p>High-fanout shared dependencies become navigation handles for a captain and for coding agents.</p>
              </div>
            </div>
            ${data.relationships.slice(0, 12).map(renderRelationRow).join('')}
          </div>
        </section>
      </main>

      <footer class="footer-note">
        Demo snapshot generated from a local Portolan Bigtop bundle. Heavy symbol indexes, raw producer files, and local source paths are excluded from this public surface.
      </footer>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  app.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      state.view = button.dataset.view;
      document.getElementById(state.view)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      render();
    });
  });
  app.querySelectorAll('[data-group]').forEach((button) => {
    button.addEventListener('click', () => {
      state.group = button.dataset.group;
      render();
    });
  });
  app.querySelectorAll('[data-component]').forEach((element) => {
    element.addEventListener('click', () => {
      state.selectedId = element.dataset.component;
      state.view = 'map';
      render();
      document.getElementById('map')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
  app.querySelector('.search')?.addEventListener('input', (event) => {
    state.query = event.target.value;
    if (state.query.trim()) state.group = 'all';
    render();
  });
  app.querySelector('[data-action="focus-risk"]')?.addEventListener('click', () => {
    const candidate = [...state.data.components].sort((a, b) => b.findings - a.findings)[0];
    if (candidate) state.selectedId = candidate.id;
    render();
  });
}

function renderMap(selected) {
  const components = filteredComponents().slice(0, 32);
  const visible = new Set(components.map((component) => component.id));
  const selectedRelations = state.data.relationships.filter((relationship) => relationship.repos.includes(selected.id));
  const selectedNeighbors = new Set(selectedRelations.flatMap((relationship) => relationship.repos));
  const center = { x: 560, y: 360 };
  const nodes = components.map((component, index) => {
    const angle = (index / components.length) * Math.PI * 2 - Math.PI / 2;
    const ring = index < 10 ? 185 : 285;
    return {
      ...component,
      x: center.x + Math.cos(angle) * ring,
      y: center.y + Math.sin(angle) * ring,
      r: Math.max(9, Math.min(24, 8 + Math.sqrt(component.files) / 18 + component.relationships / 5)),
    };
  });
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const seenLinks = new Set();
  const links = state.data.relationships
    .filter((relationship) => relationship.repos.some((id) => id === selected.id))
    .flatMap((relationship) => relationship.repos
      .filter((id) => id !== selected.id && visible.has(id))
      .slice(0, 12)
      .map((id) => ({ from: selected.id, to: id, relationship })))
    .filter((link) => {
      if (!nodeById.has(link.from) || !nodeById.has(link.to)) return false;
      const key = [link.from, link.to].sort().join(':');
      if (seenLinks.has(key)) return false;
      seenLinks.add(key);
      return true;
    })
    .slice(0, 42);

  return `
    <svg class="atlas-map" viewBox="0 0 1120 720" role="img" aria-label="Bigtop component relationship map">
      <defs>
        <filter id="nodeGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" result="blur"></feGaussianBlur>
          <feMerge><feMergeNode in="blur"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
        </filter>
      </defs>
      ${links.map((link) => {
        const from = nodeById.get(link.from);
        const to = nodeById.get(link.to);
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2 - 36;
        return `<path class="map-link is-selected" d="M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}"><title>${escapeHtml(link.relationship.summary)}</title></path>`;
      }).join('')}
      ${state.data.relationships.slice(0, 24).flatMap((relationship) => {
        const visibleRepos = relationship.repos.filter((id) => nodeById.has(id)).slice(0, 2);
        if (visibleRepos.length < 2) return [];
        const from = nodeById.get(visibleRepos[0]);
        const to = nodeById.get(visibleRepos[1]);
        return `<path class="map-link" d="M ${from.x} ${from.y} L ${to.x} ${to.y}"></path>`;
      }).join('')}
      ${nodes.map((node) => {
        const selectedClass = node.id === selected.id ? ' is-selected' : '';
        const mutedClass = selectedNeighbors.size && !selectedNeighbors.has(node.id) ? ' is-muted' : '';
        return `
          <g class="map-node${selectedClass}${mutedClass}" data-component="${escapeAttr(node.id)}" transform="translate(${node.x} ${node.y})">
            <circle r="${node.r}" fill="${groupColor[node.group] || groupColor.service}" filter="${node.id === selected.id ? 'url(#nodeGlow)' : ''}"></circle>
            <text y="${node.r + 16}" text-anchor="middle">${escapeHtml(shortLabel(node.label))}</text>
          </g>
        `;
      }).join('')}
    </svg>
  `;
}

function renderInspector(component) {
  const relations = state.data.relationships.filter((relationship) => relationship.repos.includes(component.id)).slice(0, 4);
  return `
    <aside class="inspector" aria-label="Selected component">
      <div class="role">${escapeHtml(component.role)} / ${escapeHtml(component.group)}</div>
      <h2>${escapeHtml(component.label)}</h2>
      <p>${escapeHtml(component.summary || 'No human summary was available in the public snapshot.')}</p>
      <div class="fact-row">
        <div><span>Files</span><strong>${compact(component.files)}</strong></div>
        <div><span>Findings</span><strong>${compact(component.findings)}</strong></div>
        <div><span>Links</span><strong>${component.relationships}</strong></div>
        <div><span>Medium</span><strong>${component.medium}</strong></div>
      </div>
      <div class="surface-list">
        ${component.surfaces.map((surface) => surface.url
          ? `<a class="pill is-${surface.state}" href="${escapeAttr(surface.url)}">${escapeHtml(surface.label)}</a>`
          : `<span class="pill is-${surface.state}">${escapeHtml(surface.label)}</span>`).join('')}
      </div>
      <h3>Connected through</h3>
      ${relations.length ? relations.map((relationship) => `<div class="relation-row"><div><strong>${escapeHtml(relationship.component || relationship.summary)}</strong><p>${escapeHtml(relationship.summary)} across ${relationship.count} repos</p></div><span class="meta">${escapeHtml(relationship.producer)}</span></div>`).join('') : '<p class="meta">No high-fanout public relationships in this snapshot.</p>'}
    </aside>
  `;
}

function filteredComponents() {
  const query = state.query.trim().toLowerCase();
  return state.data.components
    .filter((component) => state.group === 'all' || component.group === state.group)
    .filter((component) => {
      if (!query) return true;
      return [component.label, component.role, component.group, component.summary]
        .join(' ')
        .toLowerCase()
        .includes(query);
    })
    .sort((a, b) => b.relationships - a.relationships || b.findings - a.findings || b.files - a.files);
}

function topRisks() {
  return state.data.components
    .flatMap((component) => component.top_findings.map((finding) => ({ ...finding, component })))
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
}

function renderRepoRow(component) {
  const max = Math.max(...state.data.components.map((item) => item.findings), 1);
  return `
    <div class="repo-row">
      <button type="button" data-component="${escapeAttr(component.id)}">
        <strong>${escapeHtml(component.label)}</strong>
        <div class="meta">${escapeHtml(component.role)} / ${compact(component.files)} files / ${component.relationships} relationships</div>
      </button>
      <div>
        <span class="severity">${compact(component.findings)} findings</span>
        <div class="bar"><span style="width:${Math.max(4, Math.round((component.findings / max) * 100))}%"></span></div>
      </div>
    </div>
  `;
}

function renderRiskRow(risk) {
  return `
    <div class="risk-row">
      <div>
        <strong>${escapeHtml(risk.component.label)}</strong>
        <p>${escapeHtml(risk.summary)}</p>
      </div>
      <span class="severity">${escapeHtml(risk.severity || risk.kind)}</span>
    </div>
  `;
}

function renderRelationRow(relationship) {
  const first = relationship.repos.map(componentById).filter(Boolean)[0];
  return `
    <div class="relation-row">
      <button type="button" ${first ? `data-component="${escapeAttr(first.id)}"` : ''}>
        <strong>${escapeHtml(relationship.component || relationship.summary)}</strong>
        <p>${escapeHtml(relationship.summary)}: ${relationship.labels.slice(0, 6).join(', ')}${relationship.labels.length > 6 ? '...' : ''}</p>
      </button>
      <span class="meta">${relationship.count} repos</span>
    </div>
  `;
}

function componentById(id) {
  return state.data.components.find((component) => component.id === id);
}

function navButton(view, label) {
  return `<button type="button" data-view="${view}" class="${state.view === view ? 'is-active' : ''}">${label}</button>`;
}

function groupButton(group, label) {
  return `<button type="button" data-group="${group}" class="${state.group === group ? 'is-active' : ''}">${label}</button>`;
}

function metric(label, value) {
  return `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
}

function severityRank(severity) {
  return { critical: 5, high: 4, medium: 3, low: 2, info: 1 }[severity] || 0;
}

function compact(value) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value) || 0);
}

function shortLabel(label) {
  return label.replace(/^Apache\s+/, '').replace(/^apache-/, '').slice(0, 16);
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
