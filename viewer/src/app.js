/**
 * Portolan viewer — ranked hotspots and folder tree from /bundle/* (evidence only).
 */

const SEV_RANK = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

const KIND_LABELS = {
  duplication: 'Duplication',
  'static-finding': 'Static smell',
  config: 'Config surface',
  'debt-candidate': 'Symbol density',
  'dep-hub': 'Dependency hub',
};

/** viewMode: preset id or 'custom' when user toggles kind chips */
const VIEWS = {
  all: {
    label: 'All',
    description: 'Every hotspot in this bundle (subject to search & severity filters).',
  },
  top15: {
    label: 'Tour · top 15',
    description:
      'Only ranks #1–#15. Rank is bundle sort order (severity first, then kind quotas) — a guided slice, not the full landscape.',
    maxRank: 15,
  },
  'code-pain': {
    label: 'Code pain',
    description: 'Duplication, semgrep smells, and symbol-dense files — typical refactor/review targets.',
    kinds: ['duplication', 'static-finding', 'debt-candidate'],
  },
  config: {
    label: 'Config & deploy',
    description: 'Docker, CI, compose, env, terraform inventory — where ops/config risk lives (informational).',
    kinds: ['config'],
  },
  deps: {
    label: 'Dependencies',
    description: 'Packages with many dependents in the SBOM (Syft) — upgrade blast-radius hubs.',
    kinds: ['dep-hub'],
  },
};

const KIND_HELP = {
  duplication: {
    why: 'jscpd found a repeated code block. Copies drift apart when you change one copy and forget the other.',
    tool: 'jscpd',
    limit: 'Only near-identical fragments; not design-level duplication.',
  },
  'static-finding': {
    why: 'Semgrep matched a local rule (TODO/FIXME, secret-like patterns, etc.).',
    tool: 'semgrep',
    limit: 'Rule-based; not a full security audit.',
  },
  config: {
    why: 'File is part of deploy/config surface (Dockerfile, workflow, .env, terraform…).',
    tool: 'config scan',
    limit: 'Inventory only — severity is info, not a vulnerability claim.',
  },
  'debt-candidate': {
    why: 'File has many symbols (ctags). Dense files are harder to navigate — candidate for split or review.',
    tool: 'universal-ctags',
    limit: 'Symbol count ≠ complexity score; no AI judgment.',
  },
  'dep-hub': {
    why: 'Package has many dependency edges in the CycloneDX SBOM.',
    tool: 'syft',
    limit: 'Landscape-level; no file path attached.',
  },
};

let allHotspots = [];
let repos = [];
let manifest = null;
let gaps = [];
let landscapeCard = null;
let landscapeReport = null;
let filters = { kinds: new Set(), severities: new Set(), repoIds: new Set() };
let searchQuery = '';
let searchCodeHits = [];
let searchFetchTimer = null;
let searchFetchGen = 0;
let selectedId = null;
let expandedDirs = new Set();
/** @type {'overview' | 'findings' | 'gaps'} */
let activeTab = 'overview';
let usingFullHotspots = false;
/** @type {keyof VIEWS | 'custom'} */
let viewMode = 'top15';

async function loadJSONL(url) {
  const res = await fetch(url);
  if (!res.ok) return [];
  const text = await res.text();
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

async function loadJSON(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(s) {
  return escapeHtml(s)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeRank(rank) {
  const n = Number(rank);
  return Number.isFinite(n) ? String(n) : '?';
}

function sevRank(s) {
  return SEV_RANK[s] ?? 5;
}

function maxSeverity(sevs) {
  return sevs.reduce((best, s) => (sevRank(s) < sevRank(best) ? s : best), 'info');
}

function sevClass(s) {
  if (s && Object.prototype.hasOwnProperty.call(SEV_RANK, s)) return `sev-${s}`;
  return 'sev-info';
}

function safeKindClass(kind) {
  if (kind && Object.prototype.hasOwnProperty.call(KIND_LABELS, kind)) return kind;
  return 'unknown-kind';
}

function kindLabel(kind) {
  return KIND_LABELS[kind] || kind;
}

const KIND_SECTION_ORDER = [
  'duplication',
  'static-finding',
  'config',
  'debt-candidate',
  'dep-hub',
];

function findingsShownCount() {
  if (usingFullHotspots) return allHotspots.length;
  return manifest?.hotspot_count ?? allHotspots.length;
}

function findingsTotalCount() {
  if (usingFullHotspots) return allHotspots.length;
  return manifest?.hotspots_total ?? allHotspots.length;
}

function updateManifestFooter() {
  const el = document.getElementById('manifest-info');
  if (!manifest) {
    el.textContent = 'no manifest';
    return;
  }
  const targetShort = shortPath(manifest.target_root) || manifest.target_root;
  el.textContent =
    `${targetShort} · ${findingsShownCount()}/${findingsTotalCount()} findings · ${manifest.gap_count} gaps`;
}

function normalizeDisplayPath(p) {
  if (!p) return '';
  return p.replace(/\\/g, '/');
}

function shortPath(p) {
  const norm = normalizeDisplayPath(p);
  if (!norm || norm === '(dependency-hub)') return norm;
  if (norm.startsWith('/')) {
    for (const r of repos) {
      const root = r.path.replace(/\\/g, '/');
      if (norm === root || norm.startsWith(root + '/')) {
        const rel = norm.slice(root.length).replace(/^\//, '');
        return rel || r.name || r.id;
      }
    }
    const parts = norm.split('/').filter(Boolean);
    if (parts.length <= 2) return parts.join('/');
    return '…/' + parts.slice(-2).join('/');
  }
  const parts = norm.split('/').filter(Boolean);
  if (parts.length <= 3) return norm;
  return '…/' + parts.slice(-2).join('/');
}

function primaryPath(h) {
  const paths = h.paths || [];
  if (!paths.length) return null;
  return paths.find((p) => p && p !== '(dependency-hub)') || paths[0];
}

function repoForPath(p) {
  const norm = normalizeDisplayPath(p);
  if (!norm) return null;
  if (norm.startsWith('/')) {
    for (const r of repos) {
      const root = r.path.replace(/\\/g, '/');
      if (norm === root || norm.startsWith(root + '/')) return r.id;
    }
    return null;
  }
  if (repos.length === 1) return repos[0].id;
  for (const r of repos) {
    const name = r.name || r.id;
    if (norm.startsWith(name + '/')) return r.id;
  }
  return repos[0]?.id ?? null;
}

function hotspotRepo(h) {
  for (const p of h.paths || []) {
    const rid = repoForPath(p);
    if (rid) return rid;
  }
  return repos.length === 1 ? repos[0].id : null;
}

function matchesSearch(h, q) {
  if (!q) return true;
  const hay = [h.summary, h.id, h.kind, h.severity, kindLabel(h.kind), ...(h.paths || [])]
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

function matchesView(h) {
  if (viewMode === 'custom') {
    if (filters.kinds.size && !filters.kinds.has(h.kind)) return false;
    return true;
  }
  const view = VIEWS[viewMode];
  if (!view) return true;
  if (view.kinds && !view.kinds.includes(h.kind)) return false;
  if (view.maxRank != null && h.rank > view.maxRank) return false;
  return true;
}

function matchesFilters(h) {
  if (filters.severities.size && !filters.severities.has(h.severity)) return false;
  if (filters.repoIds.size) {
    if (h.kind !== 'dep-hub') {
      const rid = hotspotRepo(h);
      if (!rid || !filters.repoIds.has(rid)) return false;
    }
  }
  return true;
}

function filteredHotspots() {
  const q = searchQuery.trim().toLowerCase();
  return allHotspots
    .filter((h) => matchesSearch(h, q) && matchesView(h) && matchesFilters(h))
    .sort((a, b) => a.rank - b.rank);
}

async function fetchSearchCodeHits(q) {
  const trimmed = q.trim();
  const gen = ++searchFetchGen;
  if (trimmed.length < 2) {
    searchCodeHits = [];
    renderSearchCodeResults();
    return;
  }
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=12`);
    if (gen !== searchFetchGen || trimmed !== searchQuery.trim()) return;
    if (!res.ok) {
      searchCodeHits = [];
      renderSearchCodeResults();
      return;
    }
    const body = await res.json();
    if (gen !== searchFetchGen || trimmed !== searchQuery.trim()) return;
    searchCodeHits = body.records || [];
    renderSearchCodeResults();
  } catch {
    if (gen !== searchFetchGen) return;
    searchCodeHits = [];
    renderSearchCodeResults();
  }
}

function scheduleSearchCodeFetch(q) {
  if (searchFetchTimer) clearTimeout(searchFetchTimer);
  searchFetchTimer = setTimeout(() => fetchSearchCodeHits(q), 200);
}

function renderSearchCodeResults() {
  const el = document.getElementById('search-code-results');
  if (!el) return;
  const q = searchQuery.trim();
  if (!q || q.length < 2 || !searchCodeHits.length) {
    el.innerHTML = '';
    el.classList.add('hidden');
    return;
  }
  el.classList.remove('hidden');
  el.innerHTML = `
    <p class="search-code-label">Code index (${searchCodeHits.length} shown)</p>
    <ul class="search-code-list">
      ${searchCodeHits
        .map(
          (hit) =>
            `<li><button type="button" class="search-code-hit" data-path="${escapeAttr(hit.path || '')}" data-line="${safeRank(hit.line)}">
              <span class="mono">${escapeHtml(shortPath(hit.path || ''))}:${safeRank(hit.line)}</span>
              <span class="search-code-text">${escapeHtml((hit.summary || '').slice(0, 120))}</span>
            </button></li>`
        )
        .join('')}
    </ul>`;
  el.querySelectorAll('.search-code-hit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.path;
      const line = btn.dataset.line || '1';
      if (!p) return;
      switchTab('findings');
      loadSourcePreview({ paths: [p], id: null, summary: p }, p, line);
      el.classList.add('hidden');
    });
  });
}

function applyHashDeepLink() {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return;
  if (hash.startsWith('hotspot=')) {
    const id = decodeURIComponent(hash.slice('hotspot='.length));
    const h = allHotspots.find((x) => x.id === id);
    if (h) {
      switchTab('findings');
      selectHotspot(h);
    }
  }
}

function kindCounts(hotspots) {
  const counts = {};
  for (const h of hotspots) {
    counts[h.kind] = (counts[h.kind] || 0) + 1;
  }
  return counts;
}

function setView(mode) {
  viewMode = mode;
  filters.kinds.clear();
  renderViewBar();
  renderFilterExplainer();
  renderFilters();
  render();
}

function enterCustomKindFilter(kind) {
  viewMode = 'custom';
  filters.kinds.clear();
  filters.kinds.add(kind);
  renderViewBar();
  renderFilterExplainer();
  renderFilters();
  render();
}

function toggleCustomKind(kind) {
  if (filters.kinds.has(kind)) filters.kinds.delete(kind);
  else filters.kinds.add(kind);
  renderFilterExplainer();
  renderFilters();
  render();
}

function kindChipState(kind) {
  if (viewMode === 'custom') {
    if (filters.kinds.size === 0) return 'inactive';
    return filters.kinds.has(kind) ? 'active' : 'inactive';
  }
  const view = VIEWS[viewMode];
  if (view?.kinds) {
    return view.kinds.includes(kind) ? 'locked' : 'inactive';
  }
  return 'inactive';
}

function renderViewBar() {
  const el = document.getElementById('view-bar');
  el.innerHTML = '';
  for (const [id, view] of Object.entries(VIEWS)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'view-btn' + (viewMode === id ? ' active' : '');
    btn.textContent = view.label;
    btn.title = view.description;
    btn.addEventListener('click', () => setView(id));
    el.appendChild(btn);
  }
  if (viewMode === 'custom') {
    const custom = document.createElement('span');
    custom.className = 'view-btn active custom-tag';
    custom.textContent = 'Custom kind filter';
    el.appendChild(custom);
  }
}

function renderFilterExplainer() {
  const el = document.getElementById('filter-explainer');
  const shown = filteredHotspots().length;
  const total = allHotspots.length;
  let main = '';
  if (viewMode === 'custom') {
    const kinds =
      filters.kinds.size === 0
        ? 'all kinds'
        : [...filters.kinds].map(kindLabel).join(', ');
    main = `<strong>Custom filter</strong> — kinds: ${escapeHtml(kinds)}. Click kind chips below to add/remove. Pick a view above to reset.`;
  } else {
    const view = VIEWS[viewMode];
    main = view
      ? `<strong>${escapeHtml(view.label)}</strong> — ${escapeHtml(view.description)}`
      : '';
  }
  el.innerHTML = `
    <p class="explainer-main">${main}</p>
    <p class="explainer-meta">Showing <strong>${shown}</strong> of ${total} hotspots in bundle.
      Rank #n = sort position (severity + per-kind budget).
      Only tools that ran in this scan appear; missing layers are gaps, not hidden hotspots.</p>
  `;
}

function renderKindGuide() {
  const el = document.getElementById('kind-guide-body');
  const order = ['duplication', 'static-finding', 'debt-candidate', 'config', 'dep-hub'];
  el.innerHTML = order
    .filter((k) => KIND_HELP[k])
    .map((k) => {
      const h = KIND_HELP[k];
      return `<div class="guide-item">
        <h4><span class="kind-pill ${safeKindClass(k)}">${escapeHtml(kindLabel(k))}</span></h4>
        <p>${escapeHtml(h.why)}</p>
        <p class="guide-meta">Tool: <code>${escapeHtml(h.tool)}</code> · ${escapeHtml(h.limit)}</p>
      </div>`;
    })
    .join('');
}

function buildTree(hotspots) {
  const root = {
    name: '',
    pathKey: '',
    children: new Map(),
    hotspotIds: new Set(),
    isFile: false,
  };

  function ensureChild(parent, name, pathKey, isFile) {
    if (!parent.children.has(name)) {
      parent.children.set(name, {
        name,
        pathKey,
        children: new Map(),
        hotspotIds: new Set(),
        isFile,
      });
    }
    return parent.children.get(name);
  }

  function addPath(pathStr, h) {
    const norm = normalizeDisplayPath(pathStr);
    if (!norm || norm === '(dependency-hub)') {
      const node = ensureChild(root, '(dependency-hubs)', '(dependency-hubs)', false);
      node.hotspotIds.add(h.id);
      return;
    }
    let rel = norm;
    if (norm.startsWith('/')) {
      rel = shortPath(norm);
      if (rel.startsWith('…/')) rel = norm.split('/').pop() || norm;
    }
    const parts = rel.split('/').filter(Boolean);
    let node = root;
    let built = '';
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      built = built ? `${built}/${part}` : part;
      const isFile = i === parts.length - 1;
      node = ensureChild(node, part, built, isFile);
      node.hotspotIds.add(h.id);
    }
  }

  for (const h of hotspots) {
    if (!h.paths || h.paths.length === 0) {
      addPath('(dependency-hub)', h);
    } else {
      for (const p of h.paths) addPath(p, h);
    }
  }
  return root;
}

function treeStats(node, hotspotById) {
  const ids = [...node.hotspotIds];
  const sevs = ids.map((id) => hotspotById.get(id)?.severity).filter(Boolean);
  return { count: ids.length, maxSeverity: maxSeverity(sevs.length ? sevs : ['info']) };
}

function renderFilters() {
  const bar = document.getElementById('filter-bar');
  bar.innerHTML = '';
  const counts = kindCounts(allHotspots);
  const kinds = [...new Set(allHotspots.map((h) => h.kind))].sort();
  const severities = [...new Set(allHotspots.map((h) => h.severity))].sort(
    (a, b) => sevRank(a) - sevRank(b)
  );

  const kindWrap = document.createElement('div');
  kindWrap.className = 'filter-group';
  const kindLbl = document.createElement('span');
  kindLbl.className = 'filter-label';
  kindLbl.textContent = viewMode === 'custom' ? 'Kind (custom)' : 'Kind (click to customize)';
  kindWrap.appendChild(kindLbl);
  for (const v of kinds) {
    const state = kindChipState(v);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip ' + state;
    btn.innerHTML =
      escapeHtml(kindLabel(v)) + `<span class="chip-count">${counts[v] ?? 0}</span>`;
    if (state === 'locked') {
      btn.title = 'Set by current view. Click to switch to custom filter for this kind only.';
    } else if (state === 'inactive') {
      btn.title = 'Click to filter by this kind only (switches to custom filter).';
    }
    btn.addEventListener('click', () => {
      if (viewMode !== 'custom') {
        enterCustomKindFilter(v);
      } else {
        toggleCustomKind(v);
      }
    });
    kindWrap.appendChild(btn);
  }
  bar.appendChild(kindWrap);

  bar.appendChild(
    makeChipGroup('Severity', severities, filters.severities, () => render(), (v) => v, null)
  );
  if (repos.length > 1) {
    const repoLabels = repos.map((r) => ({ id: r.id, label: r.name || r.id }));
    bar.appendChild(
      makeChipGroup(
        'Repo',
        repoLabels.map((r) => r.id),
        filters.repoIds,
        () => render(),
        (id) => repoLabels.find((r) => r.id === id)?.label || id,
        null
      )
    );
  }
}

function makeChipGroup(label, values, activeSet, onChange, labelFn = (v) => v, counts = null) {
  const wrap = document.createElement('div');
  wrap.className = 'filter-group';
  const lbl = document.createElement('span');
  lbl.className = 'filter-label';
  lbl.textContent = label;
  wrap.appendChild(lbl);
  for (const v of values) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip' + (activeSet.has(v) ? ' active' : '');
    const count = counts?.[v];
    btn.innerHTML =
      escapeHtml(labelFn(v)) + (count != null ? `<span class="chip-count">${count}</span>` : '');
    btn.addEventListener('click', () => {
      if (activeSet.has(v)) activeSet.delete(v);
      else activeSet.add(v);
      onChange();
    });
    wrap.appendChild(btn);
  }
  return wrap;
}

function renderBanner() {
  const el = document.getElementById('status-banner');
  const parts = [];
  if (manifest?.hotspots_truncated && !usingFullHotspots) {
    parts.push(
      `<span class="status-banner truncation">Bundle truncated: <strong>${manifest.hotspot_count}</strong> of ${manifest.hotspots_total} hotspots (budget ${manifest.hotspot_budget}). Full list: <code>hotspots-full.jsonl</code>.</span>`
    );
  }
  if (gaps.length) {
    const items = gaps
      .slice(0, 4)
      .map((g) => `${escapeHtml(g.surface)}: ${escapeHtml(g.status)}`)
      .join(' · ');
    const more = gaps.length > 4 ? ` (+${gaps.length - 4} more)` : '';
    parts.push(
      `<span class="status-banner gaps">Layers not run or empty: ${items}${more}. These are not hidden hotspots — they were <em>not assessed</em> in this run.</span>`
    );
  }
  if (parts.length) {
    el.innerHTML = parts.join(' ');
    el.classList.remove('hidden');
  } else {
    el.innerHTML = '';
    el.classList.add('hidden');
  }
}

function kindWhyLine(kind) {
  const h = KIND_HELP[kind];
  return h ? h.why : 'Flagged by a local scanner in this Portolan bundle.';
}

function renderTour(hotspots) {
  const list = document.getElementById('hotspot-list');
  list.innerHTML = '';
  document.getElementById('tour-count').textContent =
    hotspots.length === allHotspots.length
      ? `${hotspots.length} shown`
      : `${hotspots.length} of ${allHotspots.length}`;

  if (!hotspots.length) {
    const empty = document.createElement('li');
    empty.className = 'detail-empty';
    empty.innerHTML =
      '<p class="empty-title">No matches</p><p class="empty-hint">Try view <strong>All</strong> or clear severity filters.</p>';
    list.appendChild(empty);
    return;
  }

  for (const h of hotspots) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hotspot-card' + (h.id === selectedId ? ' active' : '');
    const path = primaryPath(h);
    const pathHtml = path
      ? `<div class="card-path" title="${escapeAttr(normalizeDisplayPath(path))}">${escapeHtml(shortPath(path))}</div>`
      : '';
    btn.innerHTML = `
      <div class="card-top">
        <span class="card-rank" title="Bundle sort position">#${safeRank(h.rank)}</span>
        <span class="kind-pill ${safeKindClass(h.kind)}">${escapeHtml(kindLabel(h.kind))}</span>
        <span class="badge ${sevClass(h.severity)}">${escapeHtml(h.severity in SEV_RANK ? h.severity : 'info')}</span>
      </div>
      <p class="card-summary">${escapeHtml(h.summary)}</p>
      <p class="card-why">${escapeHtml(kindWhyLine(h.kind))}</p>
      ${pathHtml}
    `;
    btn.addEventListener('click', () => selectHotspot(h));
    li.appendChild(btn);
    list.appendChild(li);
  }
}

function renderTreeNode(node, hotspotById, parentEl, depth = 0) {
  const entries = [...node.children.entries()].sort((a, b) => {
    if (a[1].isFile !== b[1].isFile) return a[1].isFile ? 1 : -1;
    return a[0].localeCompare(b[0]);
  });

  for (const [, child] of entries) {
    const stats = treeStats(child, hotspotById);
    const hasChildren = child.children.size > 0;
    const isExpanded = expandedDirs.has(child.pathKey) || depth < 1;

    const row = document.createElement('div');
    row.className = 'tree-node';

    const line = document.createElement('div');
    line.className = 'tree-row';
    const toggle = document.createElement('span');
    toggle.className = 'tree-toggle' + (hasChildren ? '' : ' empty');
    toggle.textContent = hasChildren ? (isExpanded ? '▾' : '▸') : '';
    const bar = document.createElement('span');
    bar.className = `sev-bar ${sevClass(stats.maxSeverity)}`;
    const name = document.createElement('span');
    name.className = 'tree-name';
    name.textContent = child.name;
    const meta = document.createElement('span');
    meta.className = 'tree-meta';
    meta.textContent = `${stats.count}`;
    line.appendChild(toggle);
    line.appendChild(bar);
    line.appendChild(name);
    line.appendChild(meta);

    if (hasChildren) {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (expandedDirs.has(child.pathKey)) expandedDirs.delete(child.pathKey);
        else expandedDirs.add(child.pathKey);
        render();
      });
    }

    row.appendChild(line);

    if (child.isFile) {
      const fileHotspots = [...child.hotspotIds]
        .map((id) => hotspotById.get(id))
        .filter(Boolean)
        .sort((a, b) => a.rank - b.rank);
      for (const h of fileHotspots) {
        const hs = document.createElement('div');
        hs.className = 'tree-hotspot' + (h.id === selectedId ? ' active' : '');
        hs.textContent = `#${h.rank} ${kindLabel(h.kind)}`;
        hs.title = h.summary;
        hs.addEventListener('click', () => selectHotspot(h));
        row.appendChild(hs);
      }
    }

    const childWrap = document.createElement('div');
    childWrap.className = 'tree-children' + (isExpanded ? '' : ' collapsed');
    if (hasChildren) renderTreeNode(child, hotspotById, childWrap, depth + 1);
    row.appendChild(childWrap);
    parentEl.appendChild(row);
  }
}

function renderTree(hotspots) {
  const treeEl = document.getElementById('heat-tree');
  const countEl = document.getElementById('tree-count');
  treeEl.innerHTML = '';
  if (countEl) {
    countEl.textContent =
      hotspots.length === allHotspots.length
        ? `${hotspots.length} hotspots`
        : `${hotspots.length} of ${allHotspots.length}`;
  }
  const hotspotById = new Map(hotspots.map((h) => [h.id, h]));
  const root = buildTree(hotspots);

  if (root.children.has('(dependency-hubs)')) {
    const depNode = root.children.get('(dependency-hubs)');
    const stats = treeStats(depNode, hotspotById);
    const row = document.createElement('div');
    row.className = 'tree-row';
    row.innerHTML = `<span class="tree-toggle empty"></span><span class="sev-bar sev-low"></span><span class="tree-name">(dependency-hubs)</span><span class="tree-meta">${stats.count}</span>`;
    treeEl.appendChild(row);
    for (const id of depNode.hotspotIds) {
      const h = hotspotById.get(id);
      if (!h) continue;
      const hs = document.createElement('div');
      hs.className = 'tree-hotspot' + (h.id === selectedId ? ' active' : '');
      hs.textContent = `#${h.rank} ${kindLabel(h.kind)}`;
      hs.title = h.summary;
      hs.addEventListener('click', () => selectHotspot(h));
      treeEl.appendChild(hs);
    }
    root.children.delete('(dependency-hubs)');
  }

  renderTreeNode(root, hotspotById, treeEl);
  if (!treeEl.children.length) {
    treeEl.innerHTML = '<p class="path">No paths match filters.</p>';
  }
}

async function loadSourcePreview(h, pathOverride, lineOverride) {
  const preview = document.getElementById('source-preview');
  const code = document.getElementById('source-code');
  const pathLabel = document.getElementById('source-path');
  const path = pathOverride || primaryPath(h);
  if (!path || path === '(dependency-hub)') {
    preview.classList.add('hidden');
    return;
  }
  const line = lineOverride != null && lineOverride !== '' ? String(lineOverride) : '1';
  pathLabel.textContent = shortPath(path);
  pathLabel.title = normalizeDisplayPath(path);
  try {
    const params = new URLSearchParams({ path, line });
    const res = await fetch(`/source?${params}`);
    if (!res.ok) {
      preview.classList.remove('hidden');
      code.textContent = `Source unavailable (${res.status})`;
      return;
    }
    const data = await res.json();
    preview.classList.remove('hidden');
    code.innerHTML = data.lines
      .map(
        (ln) =>
          `<span class="line${ln.highlight ? ' highlight' : ''}"><span class="lineno">${ln.no}</span>${escapeHtml(ln.text)}</span>`
      )
      .join('\n');
  } catch (e) {
    preview.classList.remove('hidden');
    code.textContent = `Failed to load source: ${e.message}`;
  }
}

function symbolCountFromSummary(summary) {
  const m = String(summary || '').match(/\((\d+) symbols\)/);
  return m ? m[1] : null;
}

function renderDetail(h) {
  const el = document.getElementById('detail-body');
  if (!h) {
    el.className = 'detail-empty';
    el.innerHTML = `
      <p class="empty-title">Select a hotspot</p>
      <p class="empty-hint">Choose a <strong>view</strong> above, then click a row. This panel explains why the tool flagged it.</p>
    `;
    document.getElementById('source-preview').classList.add('hidden');
    return;
  }
  el.className = '';
  const help = KIND_HELP[h.kind] || {};
  const rid = hotspotRepo(h);
  const repoLabel = rid ? repos.find((r) => r.id === rid)?.name || rid : '';
  const symCount = h.kind === 'debt-candidate' ? symbolCountFromSummary(h.summary) : null;
  const paths = (h.paths || []).filter((p) => p && p !== '(dependency-hub)');
  const pathHtml = paths.length
    ? paths
        .map(
          (p, i) =>
            `<button type="button" class="path-chip${i === 0 ? ' primary' : ''}" data-path="${escapeAttr(normalizeDisplayPath(p))}" title="${escapeAttr(normalizeDisplayPath(p))}">${escapeHtml(shortPath(p))}</button>`
        )
        .join('')
    : '<p class="path">No file paths (landscape-level hotspot).</p>';

  el.innerHTML = `
    <div class="detail-header">
      <div class="detail-meta">
        <span class="kind-pill ${safeKindClass(h.kind)}">${escapeHtml(kindLabel(h.kind))}</span>
        <span class="badge ${sevClass(h.severity)}">${escapeHtml(h.severity in SEV_RANK ? h.severity : 'info')}</span>
        ${repoLabel ? `<span class="badge">${escapeHtml(repoLabel)}</span>` : ''}
        <span class="badge" title="Bundle sort position">rank #${safeRank(h.rank)}</span>
      </div>
      <h2 class="detail-title">${escapeHtml(h.summary)}</h2>
    </div>
    <div class="detail-section why-section">
      <h3>Why is this here?</h3>
      <p>${escapeHtml(help.why || kindWhyLine(h.kind))}</p>
      ${help.limit ? `<p class="guide-meta">${escapeHtml(help.limit)}</p>` : ''}
      ${symCount ? `<p>Symbol count in file: <strong>${escapeHtml(symCount)}</strong> (ctags).</p>` : ''}
      <p class="guide-meta">Tool: <code>${escapeHtml(h.producer)}</code> · Evidence: ${escapeHtml(h.evidence_state)}</p>
    </div>
    <div class="detail-section">
      <h3>Paths</h3>
      ${pathHtml}
    </div>
    <details class="evidence-toggle">
      <summary>Raw provenance</summary>
      <div class="evidence-body">
        <p>id: <code>${escapeHtml(h.id)}</code></p>
        <p>producer_ref: ${escapeHtml(h.producer_ref || '')}</p>
      </div>
    </details>
  `;

  el.querySelectorAll('.path-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      loadSourcePreview(h, chip.dataset.path);
    });
  });

  loadSourcePreview(h);
}

function selectHotspot(h) {
  selectedId = h?.id ?? null;
  if (h?.id) {
    window.location.hash = `hotspot=${encodeURIComponent(h.id)}`;
  }
  renderDetail(h);
  render();
  requestAnimationFrame(() => {
    const active = document.querySelector('.hotspot-card.active');
    active?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `tab-${tab}`);
  });
  if (tab === 'overview') renderOverview();
  else if (tab === 'gaps') renderGapsTab();
  else if (tab === 'graph-hints') renderGraphHintsTab();
  else renderFindingsTab();
}

function boolBadge(val, yes, no) {
  if (val === true) return `<span class="badge ok">${escapeHtml(yes)}</span>`;
  if (val === false) return `<span class="badge warn">${escapeHtml(no)}</span>`;
  return `<span class="badge unknown">unknown</span>`;
}

function formatLanguageEntry(lang, data) {
  if (data && typeof data === 'object' && data.files != null) {
    const files = Number(data.files) || 0;
    const pct =
      data.ratio != null && !Number.isNaN(Number(data.ratio))
        ? `, ${Math.round(Number(data.ratio) * 100)}%`
        : '';
    return `${lang} (${files} file${files === 1 ? '' : 's'}${pct})`;
  }
  if (typeof data === 'number') return `${lang} (${data})`;
  return lang;
}

function formatLanguagesSummary(languages, primaryLanguage) {
  if (!languages || typeof languages !== 'object' || !Object.keys(languages).length) {
    return primaryLanguage || 'unknown';
  }
  return Object.entries(languages)
    .sort((a, b) => {
      const af = typeof a[1] === 'object' ? Number(a[1].files) || 0 : Number(a[1]) || 0;
      const bf = typeof b[1] === 'object' ? Number(b[1].files) || 0 : Number(b[1]) || 0;
      return bf - af;
    })
    .slice(0, 4)
    .map(([lang, data]) => formatLanguageEntry(lang, data))
    .join(' · ');
}

function findingsGroupsFromHotspots(hotspots) {
  const byKind = new Map();
  for (const h of hotspots) {
    if (!byKind.has(h.kind)) byKind.set(h.kind, []);
    byKind.get(h.kind).push(h);
  }
  return [...byKind.entries()]
    .sort((a, b) => {
      const ia = KIND_SECTION_ORDER.indexOf(a[0]);
      const ib = KIND_SECTION_ORDER.indexOf(b[0]);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a[0].localeCompare(b[0]);
    })
    .map(([kind, items]) => ({
      kind,
      count: items.length,
      items: [...items]
        .sort((a, b) => a.rank - b.rank)
        .map((h) => ({
          id: h.id,
          rank: h.rank,
          summary: h.summary,
          severity: h.severity,
          evidence_ref: `hotspot:${h.id}`,
        })),
    }));
}

function renderOverview() {
  const cardEl = document.getElementById('landscape-card');
  const scaleEl = document.getElementById('findings-scale');
  const repoEl = document.getElementById('repo-matrix');
  const kindEl = document.getElementById('kind-summary');
  const stepsEl = document.getElementById('next-steps');

  const card = landscapeCard || {};
  const id = card.identity || {};
  const scale = card.scale || {};
  const activity = card.activity || {};
  const maturity = card.maturity || {};
  const health = card.health_signals || {};
  const blocksEl = document.getElementById('overview-blocks');
  const overviewSection = landscapeReport?.sections?.find((s) => s.id === 'overview');
  const textBlocks = (overviewSection?.blocks || []).filter((b) => b.type === 'text' && b.text);
  if (blocksEl) {
    blocksEl.innerHTML = textBlocks.length
      ? textBlocks.map((b) => `<p class="overview-block">${escapeHtml(b.text)}</p>`).join('')
      : '';
  }

  const langs = formatLanguagesSummary(id.languages, id.primary_language);

  cardEl.innerHTML = `
    <h2>${escapeHtml(id.name || 'Landscape')}</h2>
    <div class="card-grid">
      <div class="card-stat"><span class="label">Language</span><span class="value">${escapeHtml(String(langs))}</span></div>
      <div class="card-stat"><span class="label">Files</span><span class="value">${scale.total_files != null ? escapeHtml(String(scale.total_files)) : 'unknown'}</span></div>
      ${scale.total_loc != null ? `<div class="card-stat"><span class="label">LOC (approx)</span><span class="value">${escapeHtml(String(scale.total_loc))}</span></div>` : ''}
      <div class="card-stat"><span class="label">Repos</span><span class="value">${repos.length || '—'}</span></div>
      <div class="card-stat"><span class="label">Last commit</span><span class="value">${escapeHtml(activity.last_commit || 'unknown')}</span></div>
      <div class="card-stat"><span class="label">Contributors</span><span class="value">${activity.contributors != null ? escapeHtml(String(activity.contributors)) : 'unknown'}</span></div>
    </div>
    <div class="maturity-row">
      ${boolBadge(maturity.has_readme, 'README', 'no README')}
      ${boolBadge(maturity.has_ci, 'CI', 'no CI')}
      ${boolBadge(maturity.has_tests, 'tests', 'no tests')}
      ${boolBadge(maturity.has_docker, 'Docker', 'no Docker')}
    </div>
    ${health.staleness || health.test_coverage_hint ? `<p class="health-hint">Staleness: ${escapeHtml(health.staleness || 'unknown')} · Test hint: ${escapeHtml(health.test_coverage_hint || 'unknown')}</p>` : ''}
  `;

  const shown = findingsShownCount();
  const total = findingsTotalCount();
  const truncated = manifest?.hotspots_truncated && !usingFullHotspots;
  scaleEl.innerHTML = `
    <p class="scale-line">Scan found <strong>${total}</strong> findings; this bundle shows <strong>${shown}</strong>${truncated ? ' (budget truncated)' : ''}.</p>
    ${truncated ? '<p class="scale-hint">Open the <strong>Findings</strong> tab and use <em>Show all findings from scan</em> to load the full list.</p>' : ''}
    ${usingFullHotspots && shown === total ? '<p class="scale-hint">Showing all findings from scan.</p>' : ''}
  `;

  if (repos.length) {
    repoEl.innerHTML = `
      <h3>Repositories</h3>
      <table class="repo-table"><thead><tr><th>Name</th><th>Path</th></tr></thead>
      <tbody>${repos.map((r) => `<tr><td>${escapeHtml(r.name || r.id)}</td><td class="mono" title="${escapeAttr(r.path)}">${escapeHtml(shortPath(r.path))}</td></tr>`).join('')}</tbody></table>
    `;
  } else {
    repoEl.innerHTML = '';
  }

  const kc = usingFullHotspots ? kindCounts(allHotspots) : manifest?.kind_counts || kindCounts(allHotspots);
  const kcTotal = usingFullHotspots
    ? kindCounts(allHotspots)
    : manifest?.kind_counts_total || kindCounts(allHotspots);
  kindEl.innerHTML = `
    <h3>Findings by kind (shown / scan total)</h3>
    <ul class="kind-list">${Object.keys({ ...kcTotal, ...kc })
      .sort((a, b) => {
        const ia = KIND_SECTION_ORDER.indexOf(a);
        const ib = KIND_SECTION_ORDER.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.localeCompare(b);
      })
      .map((k) => `<li><span class="kind-pill ${safeKindClass(k)}">${escapeHtml(kindLabel(k))}</span> ${kc[k] ?? 0} / ${kcTotal[k] ?? kc[k] ?? 0}</li>`)
      .join('')}</ul>
  `;

  const nextSection = landscapeReport?.sections?.find((s) => s.id === 'next_steps');
  const items = nextSection?.items || allHotspots.slice(0, 5).map((h) => ({
    rank: h.rank,
    kind: h.kind,
    summary: h.summary,
    evidence_ref: `hotspot:${h.id}`,
  }));
  stepsEl.innerHTML = `
    <h3>Where to look first</h3>
    <ol class="next-list">${items
      .map(
        (it) =>
          `<li><button type="button" class="next-link" data-ref="${escapeAttr(it.evidence_ref || '')}"><span class="card-rank">#${safeRank(it.rank)}</span> <span class="kind-pill ${safeKindClass(it.kind || '')}">${escapeHtml(kindLabel(it.kind || ''))}</span> ${escapeHtml(it.summary || '')}</button></li>`
      )
      .join('')}</ol>
  `;
  stepsEl.querySelectorAll('.next-link').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ref = btn.dataset.ref || '';
      const hid = ref.replace(/^hotspot:/, '');
      const h = allHotspots.find((x) => x.id === hid);
      if (h) {
        switchTab('findings');
        selectHotspot(h);
      }
    });
  });
}

async function loadEvidenceIndexRecords() {
  try {
    const res = await fetch('/api/evidence-index?limit=50');
    if (res.ok) {
      const data = await res.json();
      return { records: data.records || [], warnings: data.warnings || [] };
    }
  } catch {
    /* static bundle fallback */
  }
  try {
    const lines = await loadJSONL('/bundle/map-bridge/evidence-index.jsonl');
    return { records: lines.map((row, i) => ({ ...row, id: row.id || `ev-${i}` })), warnings: [] };
  } catch {
    return { records: [], warnings: ['map-bridge/evidence-index.jsonl missing'] };
  }
}

function renderGraphHintsTab() {
  const body = document.getElementById('graph-hints-body');
  if (!body) return;
  body.innerHTML = '<p class="empty-hint">Loading graph hints…</p>';
  loadEvidenceIndexRecords().then(({ records, warnings }) => {
    if (!records.length) {
      const warn = warnings.length ? warnings.join(' ') : 'No map-bridge sidecar in this bundle.';
      body.innerHTML = `
        <p class="empty-hint">${escapeHtml(warn)}</p>
        <p class="empty-hint">Optional: run <code>portolan map</code>, then <code>scripts/build-map-bridge.sh</code> — see <code>harness/SKILL.md</code>.</p>
      `;
      return;
    }
    body.innerHTML = `
      <ul class="graph-hints-list">${records
        .map(
          (r) =>
            `<li><span class="badge">${escapeHtml(r.evidence_state || r.kind || 'hint')}</span> ` +
            `<strong>${escapeHtml(r.summary || r.id || '')}</strong>` +
            `${r.family ? ` <span class="mono">(${escapeHtml(r.family)})</span>` : ''}</li>`
        )
        .join('')}</ul>
    `;
  });
}

function renderGapsTab() {
  const table = document.getElementById('gaps-table');
  if (!gaps.length) {
    table.innerHTML = '<p class="empty-hint">No gaps recorded — all configured layers produced output or explicit skip records.</p>';
    return;
  }
  table.innerHTML = `
    <table class="gaps-table"><thead><tr><th>Surface</th><th>Status</th><th>Summary</th><th>Recipe</th></tr></thead>
    <tbody>${gaps
      .map(
        (g) =>
          `<tr><td>${escapeHtml(g.surface || '')}</td><td><span class="badge">${escapeHtml(g.status || '')}</span></td><td>${escapeHtml(g.summary || '')}</td><td class="mono">${escapeHtml(g.recipe || g.recipe_ref || g.producer_ref || '—')}</td></tr>`
      )
      .join('')}</tbody></table>
  `;
}

function renderFindingsSections() {
  const el = document.getElementById('findings-sections');
  const groups = findingsGroupsFromHotspots(filteredHotspots());
  if (!groups.length) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = `
    <h3>Sections (map.md parity)</h3>
    <div class="section-grid">${groups
      .map(
        (g) => `
      <details class="section-block" open>
        <summary><span class="kind-pill ${safeKindClass(g.kind)}">${escapeHtml(kindLabel(g.kind))}</span> ${g.count ?? (g.items?.length ?? 0)}</summary>
        <ul>${(g.items || [])
          .slice(0, 8)
          .map(
            (it) =>
              `<li><button type="button" class="section-link" data-id="${escapeAttr(it.id)}">#${safeRank(it.rank)} ${escapeHtml(it.summary || '')}</button></li>`
          )
          .join('')}${(g.items?.length ?? 0) > 8 ? `<li class="more">+${g.items.length - 8} more in ranked list</li>` : ''}</ul>
      </details>`
      )
      .join('')}</div>
  `;
  el.querySelectorAll('.section-link').forEach((btn) => {
    btn.addEventListener('click', () => {
      const h = allHotspots.find((x) => x.id === btn.dataset.id);
      if (h) selectHotspot(h);
    });
  });
}

function updateLoadAllButton() {
  const btn = document.getElementById('load-all-btn');
  if (!manifest?.hotspots_truncated && !usingFullHotspots) {
    btn.classList.add('hidden');
    return;
  }
  const total = manifest?.hotspots_total ?? allHotspots.length;
  btn.classList.remove('hidden');
  btn.textContent = usingFullHotspots
    ? `Showing all ${allHotspots.length} findings from scan`
    : `Show all ${total} findings from scan`;
  btn.disabled = usingFullHotspots;
}

async function loadFullHotspots() {
  if (usingFullHotspots) return;
  const full = await loadJSONL('/bundle/hotspots-full.jsonl');
  if (!full.length) return;
  allHotspots = full;
  usingFullHotspots = true;
  updateManifestFooter();
  renderFilters();
  updateLoadAllButton();
  if (activeTab === 'overview') renderOverview();
  renderFindingsTab();
}

function renderFindingsTab() {
  const hotspots = filteredHotspots();
  const hotspotById = new Map(hotspots.map((h) => [h.id, h]));
  if (selectedId && !hotspotById.has(selectedId)) {
    selectedId = null;
    renderDetail(null);
  }
  renderFilterExplainer();
  renderBanner();
  renderTour(hotspots);
  renderTree(hotspots);
  renderFindingsSections();
  updateLoadAllButton();
}

function render() {
  if (activeTab === 'overview') renderOverview();
  else if (activeTab === 'gaps') renderGapsTab();
  else if (activeTab === 'graph-hints') renderGraphHintsTab();
  else renderFindingsTab();
}

async function main() {
  manifest = await loadJSON('/bundle/manifest.json');
  allHotspots = await loadJSONL('/bundle/hotspots.jsonl');
  gaps = await loadJSONL('/bundle/gaps.jsonl');
  repos = (await loadJSON('/bundle/repos.json')) || [];
  landscapeCard = await loadJSON('/bundle/landscape-card.json');
  landscapeReport = await loadJSON('/bundle/landscape-report.json');

  updateManifestFooter();

  renderKindGuide();
  renderViewBar();
  renderFilters();
  renderBanner();

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  document.getElementById('load-all-btn').addEventListener('click', () => loadFullHotspots());
  document.getElementById('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    scheduleSearchCodeFetch(searchQuery);
    if (activeTab === 'findings') renderFindingsTab();
  });

  switchTab('overview');
  applyHashDeepLink();
}

main().catch((e) => {
  document.getElementById('detail-body').innerHTML =
    `<p>Failed to load bundle. Run: <code>npm run serve -- --bundle &lt;bundle-dir&gt;</code></p><pre>${escapeHtml(e.message)}</pre>`;
});
