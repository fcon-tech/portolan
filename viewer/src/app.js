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

/** Tier ladder labels for agent analysis claims (spec 106/107). */
const TIER_META = {
  analytical: { letter: 'B', label: 'Analytical', hint: 'agent aggregated from cited evidence; refs resolved at import' },
  synthetic: { letter: 'C', label: 'Synthetic', hint: 'agent inference over cited evidence; conclusion not tool-verified' },
  speculative: { letter: 'D', label: 'Speculative', hint: 'agent hypothesis; labeling only' },
};

let allHotspots = [];
let repos = [];
let manifest = null;
let gaps = [];
let landscapeCard = null;
let landscapeReport = null;
let repoProfiles = [];
let relationships = [];
let claims = [];
let selectedRepoId = null;
let filters = { kinds: new Set(), severities: new Set(), repoIds: new Set() };
let searchQuery = '';
let searchCodeHits = [];
let searchFetchTimer = null;
let searchFetchGen = 0;
let selectedId = null;
let expandedDirs = new Set();
/** @type {'overview' | 'repos' | 'findings' | 'gaps'} */
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

const SEV_MATTERS = {
  critical: 'Highest priority in the ranked list — address before lower severities.',
  high: 'High priority — likely user-visible pain or strong tool signal.',
  medium: 'Worth a look when higher-severity items are understood.',
  low: 'Informational or weaker signal; still evidence-backed.',
  info: 'Inventory or context — not a severity claim by itself.',
};

function severityMatters(sev) {
  return SEV_MATTERS[sev] || 'Ranked using bundle severity ordering.';
}

function gapRecipeForProducer(producer) {
  if (!producer || !gaps.length) return null;
  const p = String(producer).toLowerCase();
  const match = gaps.find(
    (g) =>
      (g.recipe || g.recipe_ref) &&
      (String(g.surface || '').toLowerCase().includes(p) ||
        String(g.summary || '').toLowerCase().includes(p) ||
        String(g.producer_ref || '').toLowerCase().includes(p))
  );
  return match?.recipe || match?.recipe_ref || null;
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
  const recipeRef = gapRecipeForProducer(h.producer);
  const primaryPath = (h.paths || []).find((p) => p && p !== '(dependency-hub)');
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
      <p class="why-matters"><strong>Why it matters:</strong> ${escapeHtml(severityMatters(h.severity))}</p>
      ${help.limit ? `<p class="guide-meta">${escapeHtml(help.limit)}</p>` : ''}
      ${symCount ? `<p>Symbol count in file: <strong>${escapeHtml(symCount)}</strong> (ctags).</p>` : ''}
      <p class="guide-meta">Tool: <code>${escapeHtml(h.producer)}</code> · Evidence: ${escapeHtml(h.evidence_state)}</p>
      ${h.producer_ref ? `<p class="guide-meta">Producer ref: <code>${escapeHtml(h.producer_ref)}</code></p>` : ''}
    </div>
    <div class="detail-actions">
      ${primaryPath ? `<button type="button" class="detail-cta" id="detail-open-source">Open source preview</button>` : ''}
      ${recipeRef ? `<button type="button" class="detail-cta secondary" id="detail-gap-recipe">See gap recipe</button>` : ''}
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

  el.querySelector('#detail-open-source')?.addEventListener('click', () => {
    if (primaryPath) loadSourcePreview(h, primaryPath);
  });
  el.querySelector('#detail-gap-recipe')?.addEventListener('click', () => {
    switchTab('gaps');
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
  else if (tab === 'repos') renderReposTab();
  else if (tab === 'gaps') renderGapsTab();
  else if (tab === 'graph-hints') renderGraphHintsTab();
  else renderFindingsTab();
}

function tierBadge(tier) {
  const meta = TIER_META[tier];
  if (!meta) return `<span class="tier-badge tier-d" title="agent claim">?</span>`;
  return `<span class="tier-badge tier-${meta.letter.toLowerCase()}" title="${escapeAttr(meta.hint)}">${meta.letter} · ${escapeHtml(meta.label)}</span>`;
}

function profileById(rid) {
  return repoProfiles.find((p) => p.id === rid) || null;
}

function claimsForSubject(subject) {
  return claims.filter((c) => (c.subject || '') === subject);
}

function repoPurpose(rid) {
  // Tier B claim wins (with badge); otherwise tier-A manifest description / README title.
  const claim = claimsForSubject(`repo:${rid}`).find((c) => c.claim_tier === 'analytical');
  if (claim) return { text: claim.statement, tier: claim.claim_tier };
  const p = profileById(rid);
  const desc = (p?.purpose?.manifests || []).map((m) => m.description).find(Boolean);
  if (desc) return { text: desc, tier: null };
  if (p?.purpose?.readme_title) return { text: p.purpose.readme_title, tier: null };
  return { text: '', tier: null };
}

function repoSeverityCounts(rid) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const h of allHotspots) {
    if (hotspotRepo(h) !== rid) continue;
    if (counts[h.severity] != null) counts[h.severity] += 1;
  }
  return counts;
}

function relationshipsForRepo(rid) {
  return relationships.filter(
    (r) => r.from_repo === rid || r.to_repo === rid || (r.repos || []).includes(rid)
  );
}

function repoLabelById(rid) {
  return repos.find((r) => r.id === rid)?.name || rid;
}

function relEndpointsHtml(r) {
  if (r.from_repo && r.to_repo) {
    return `<button type="button" class="repo-link" data-repo="${escapeAttr(r.from_repo)}">${escapeHtml(repoLabelById(r.from_repo))}</button> → <button type="button" class="repo-link" data-repo="${escapeAttr(r.to_repo)}">${escapeHtml(repoLabelById(r.to_repo))}</button>`;
  }
  return (r.repos || [])
    .map((id) => `<button type="button" class="repo-link" data-repo="${escapeAttr(id)}">${escapeHtml(repoLabelById(id))}</button>`)
    .join(', ');
}

function wireRepoLinks(rootEl) {
  rootEl.querySelectorAll('.repo-link').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedRepoId = btn.dataset.repo;
      if (activeTab !== 'repos') switchTab('repos');
      else renderReposTab();
    });
  });
}

function renderReposTab() {
  const cardsEl = document.getElementById('repos-cards');
  if (!cardsEl) return;

  if (!repos.length) {
    cardsEl.innerHTML = '<p class="empty-hint">repos.json missing or empty in this bundle.</p>';
    return;
  }

  cardsEl.innerHTML = repos
    .map((r) => {
      const p = profileById(r.id);
      const purpose = repoPurpose(r.id);
      const sev = repoSeverityCounts(r.id);
      const langs = (p?.languages || [])
        .slice(0, 3)
        .map((l) => `${l.ext} ${l.files}`)
        .join(' · ');
      const activity = p?.activity || {};
      const maturity = p?.maturity || {};
      const relCount = relationshipsForRepo(r.id).length;
      const sevBits = ['critical', 'high', 'medium']
        .filter((s) => sev[s] > 0)
        .map((s) => `<span class="sev-pill sev-${s}">${sev[s]} ${s}</span>`)
        .join(' ');
      return `
        <button type="button" class="repo-card ${selectedRepoId === r.id ? 'selected' : ''}" data-repo="${escapeAttr(r.id)}">
          <span class="repo-card-name">${escapeHtml(r.name || r.id)}</span>
          ${purpose.text ? `<span class="repo-card-purpose">${purpose.tier ? tierBadge(purpose.tier) : ''} ${escapeHtml(purpose.text)}</span>` : '<span class="repo-card-purpose dim">no manifest description / README title found</span>'}
          <span class="repo-card-meta">
            ${langs ? `<span>${escapeHtml(langs)}</span>` : ''}
            ${activity.commits_30d != null ? `<span>${escapeHtml(String(activity.commits_30d))} commits/30d</span>` : ''}
            ${relCount ? `<span>${relCount} connection${relCount === 1 ? '' : 's'}</span>` : ''}
          </span>
          <span class="repo-card-badges">
            ${boolBadge(maturity.has_readme, 'README', 'no README')}
            ${boolBadge(maturity.has_ci, 'CI', 'no CI')}
            ${boolBadge(maturity.has_tests, 'tests', 'no tests')}
            ${sevBits}
          </span>
        </button>`;
    })
    .join('');

  cardsEl.querySelectorAll('.repo-card').forEach((card) => {
    card.addEventListener('click', () => {
      selectedRepoId = card.dataset.repo;
      renderReposTab();
    });
  });

  renderRelationshipsView();
  renderRepoDrill();
}

function renderRelationshipsView() {
  const el = document.getElementById('relationships-view');
  if (!el) return;
  if (!relationships.length) {
    el.innerHTML = `
      <h3>Connections between repos</h3>
      <p class="empty-hint">No relationship edges in this bundle. Single-repo landscape, bundle built before spec 105, or detectors found nothing — check the Gaps tab before assuming isolation.</p>
    `;
    return;
  }
  el.innerHTML = `
    <h3>Connections between repos</h3>
    <p class="panel-hint">Tool-derived edges (tier A, metadata-visible): manifests, SBOM intersection, opt-in cross-repo duplication. Not runtime topology.</p>
    <table class="rel-table">
      <thead><tr><th>Type</th><th>Repos</th><th>Evidence</th><th>Detail</th></tr></thead>
      <tbody>
        ${relationships
          .map(
            (r) => `
          <tr id="rel-${escapeAttr(r.id)}">
            <td><span class="rel-type rel-${escapeAttr((r.type || '').replace(/[^a-z-]/g, ''))}">${escapeHtml(r.type || '')}</span></td>
            <td>${relEndpointsHtml(r)}</td>
            <td><span class="badge">${escapeHtml(r.evidence_state || '')}</span> <span class="mono dim">${escapeHtml(r.producer || '')}</span></td>
            <td class="rel-summary">${escapeHtml(r.summary || '')}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>
  `;
  wireRepoLinks(el);
}

async function loadReadmeInto(el, repoPath, readmePath) {
  el.innerHTML = '<p class="empty-hint">Loading README…</p>';
  try {
    const abs = `${repoPath.replace(/\/$/, '')}/${readmePath}`;
    const res = await fetch(`/api/source?path=${encodeURIComponent(abs)}&full=1`);
    if (res.ok) {
      const data = await res.json();
      const payload = data.records?.[0]?.payload;
      if (payload?.lines?.length) {
        const text = payload.lines.map((l) => l.text).join('\n');
        el.innerHTML = `
          <pre class="readme-text">${escapeHtml(text)}</pre>
          ${payload.truncated ? `<p class="guide-meta">Truncated at line ${payload.endLine} of ${payload.totalLines}.</p>` : ''}
        `;
        return;
      }
    }
  } catch {
    /* fall through */
  }
  el.innerHTML = '<p class="empty-hint">README could not be read via the source API (static bundle mode?). Open it in your editor instead.</p>';
}

function renderRepoDrill() {
  const el = document.getElementById('repo-drill');
  if (!el) return;
  if (!selectedRepoId) {
    el.innerHTML = `
      <p class="empty-title">Select a repository</p>
      <p class="empty-hint">Cards show tool-extracted profile; drill-down adds connections, findings, and tier-labeled agent claims.</p>
    `;
    return;
  }
  const rid = selectedRepoId;
  const repo = repos.find((r) => r.id === rid);
  const p = profileById(rid);
  const purpose = p?.purpose || {};
  const sev = repoSeverityCounts(rid);
  const repoRels = relationshipsForRepo(rid);
  const repoClaims = claimsForSubject(`repo:${rid}`);
  const topFindings = allHotspots.filter((h) => hotspotRepo(h) === rid).slice(0, 5);

  const manifestRows = (purpose.manifests || [])
    .map(
      (m) => `<tr><td class="mono">${escapeHtml(m.path || m.type || '')}</td><td>${escapeHtml(m.description || m.module || m.name || '—')}</td></tr>`
    )
    .join('');
  const composeRows = (purpose.compose || [])
    .flatMap((cf) =>
      (cf.services || []).map(
        (s) =>
          `<li><span class="mono">${escapeHtml(s.name)}</span>${s.image ? ` · image <span class="mono">${escapeHtml(s.image)}</span>` : ' · local build'}${(s.depends_on || []).length ? ` · depends on ${escapeHtml(s.depends_on.join(', '))}` : ''}</li>`
      )
    )
    .join('');
  const entryItems = (purpose.entrypoints || []).map((e) => `<li class="mono">${escapeHtml(e)}</li>`).join('');
  const tierGroups = ['analytical', 'synthetic', 'speculative']
    .map((tier) => ({ tier, items: repoClaims.filter((c) => c.claim_tier === tier) }))
    .filter((g) => g.items.length);

  el.innerHTML = `
    <div class="drill-head">
      <h3>${escapeHtml(repo?.name || rid)}</h3>
      <span class="mono dim" title="${escapeAttr(repo?.path || '')}">${escapeHtml(shortPath(repo?.path || ''))}</span>
    </div>

    <div class="drill-section">
      <h4>Tier A — tool-extracted profile <span class="badge ok">direct evidence</span></h4>
      ${p ? `
        <p class="drill-facts">
          ${p.scale?.file_count != null ? `${p.scale.file_count} files (${escapeHtml(p.scale.evidence_state || '')})` : ''}
          ${(p.languages || []).length ? ` · ${p.languages.slice(0, 4).map((l) => `${escapeHtml(l.ext)} ${l.files}`).join(' · ')}` : ''}
        </p>
        <p class="drill-facts">
          ${p.activity?.last_commit ? `Last commit ${escapeHtml(p.activity.last_commit)}` : 'Activity unknown'}
          ${p.activity?.commits_30d != null ? ` · ${p.activity.commits_30d} commits/30d` : ''}
          ${p.activity?.contributors != null ? ` · ${p.activity.contributors} contributor(s)` : ''}
        </p>
        <div class="maturity-row">
          ${boolBadge(p.maturity?.has_readme, 'README', 'no README')}
          ${boolBadge(p.maturity?.has_ci, 'CI', 'no CI')}
          ${boolBadge(p.maturity?.has_tests, 'tests', 'no tests')}
          ${boolBadge(p.maturity?.has_docker, 'Docker', 'no Docker')}
        </div>
        ${manifestRows ? `<table class="drill-table"><thead><tr><th>Manifest</th><th>Describes</th></tr></thead><tbody>${manifestRows}</tbody></table>` : '<p class="empty-hint">No root manifests found.</p>'}
        ${entryItems ? `<p class="drill-label">Entrypoints</p><ul class="drill-list">${entryItems}</ul>` : ''}
        ${composeRows ? `<p class="drill-label">Compose services</p><ul class="drill-list">${composeRows}</ul>` : ''}
        ${(purpose.api_specs || []).length ? `<p class="drill-label">API specs</p><ul class="drill-list">${purpose.api_specs.map((a) => `<li class="mono">${escapeHtml(a)}</li>`).join('')}</ul>` : ''}
        ${purpose.readme_path ? `<button type="button" class="detail-cta" id="drill-readme-btn">Read full README (${escapeHtml(purpose.readme_path)})</button><div id="drill-readme"></div>` : ''}
      ` : '<p class="empty-hint">No profile for this repo — bundle built before spec 104 or scan-repo-profiles failed (see Gaps).</p>'}
    </div>

    <div class="drill-section">
      <h4>Connections (tier A)</h4>
      ${repoRels.length ? `<ul class="drill-list">${repoRels
        .map((r) => `<li><span class="rel-type">${escapeHtml(r.type)}</span> ${relEndpointsHtml(r)} <span class="dim">— ${escapeHtml(r.summary || '')}</span></li>`)
        .join('')}</ul>` : '<p class="empty-hint">No detected edges for this repo.</p>'}
    </div>

    <div class="drill-section">
      <h4>Top findings in this repo (tier A)</h4>
      ${topFindings.length ? `<ul class="drill-list">${topFindings
        .map(
          (h) => `<li><button type="button" class="drill-finding" data-id="${escapeAttr(h.id)}">#${safeRank(h.rank)} <span class="kind-pill ${safeKindClass(h.kind)}">${escapeHtml(kindLabel(h.kind))}</span> ${escapeHtml(h.summary)}</button></li>`
        )
        .join('')}</ul>
        <button type="button" class="inline-link" id="drill-all-findings">All findings of this repo →</button>` : `<p class="empty-hint">No findings attributed to this repo in the shown bundle (severity counts: ${sev.critical} critical / ${sev.high} high / ${sev.medium} medium).</p>`}
    </div>

    <div class="drill-section claims-section">
      <h4>Agent analysis — labeled claims (B/C/D)</h4>
      ${tierGroups.length ? tierGroups
        .map(
          (g) => `
          <div class="claims-group">
            ${g.items
              .map(
                (c) => `
              <div class="claim-item">
                ${tierBadge(c.claim_tier)}
                <p class="claim-statement">${escapeHtml(c.statement || '')}</p>
                ${(c.cited_refs || []).length ? `<details class="claim-refs"><summary>${c.cited_refs.length} cited ref(s)</summary><ul>${c.cited_refs
                  .map((ref) => {
                    if (ref.startsWith('hotspot:')) {
                      return `<li><button type="button" class="ref-chip" data-ref="${escapeAttr(ref)}">${escapeHtml(ref)}</button></li>`;
                    }
                    return `<li><span class="mono">${escapeHtml(ref)}</span></li>`;
                  })
                  .join('')}</ul></details>` : '<p class="guide-meta">No refs (speculative).</p>'}
                <p class="guide-meta">claim-only · agent: <span class="mono">${escapeHtml(c.agent || 'unknown')}</span></p>
              </div>`
              )
              .join('')}
          </div>`
        )
        .join('') : '<p class="empty-hint">No agent analysis imported for this repo. Tiers B/C/D are empty — run an agent per <span class="mono">harness/SKILL.md</span> and import via <span class="mono">import-analysis-claims.sh</span>.</p>'}
    </div>
  `;

  wireRepoLinks(el);
  const readmeBtn = el.querySelector('#drill-readme-btn');
  if (readmeBtn && repo && p?.purpose?.readme_path) {
    readmeBtn.addEventListener('click', () => {
      loadReadmeInto(el.querySelector('#drill-readme'), repo.path, p.purpose.readme_path);
      readmeBtn.disabled = true;
    });
  }
  el.querySelectorAll('.drill-finding').forEach((btn) => {
    btn.addEventListener('click', () => {
      const h = allHotspots.find((x) => x.id === btn.dataset.id);
      if (h) {
        switchTab('findings');
        selectHotspot(h);
      }
    });
  });
  el.querySelector('#drill-all-findings')?.addEventListener('click', () => {
    filters.repoIds = new Set([rid]);
    switchTab('findings');
  });
  el.querySelectorAll('.ref-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      const hid = (btn.dataset.ref || '').replace(/^hotspot:/, '');
      const h = allHotspots.find((x) => x.id === hid);
      if (h) {
        switchTab('findings');
        selectHotspot(h);
      }
    });
  });
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
  const rankEl = document.getElementById('rank-explainer');
  if (rankEl) {
    rankEl.innerHTML = `
      <p><strong>Rank</strong> = severity first, then kind quotas when the bundle is truncated.
        Open <button type="button" class="inline-link" id="goto-tour-view">Findings → Tour view</button> for the full ranked list.</p>
    `;
    rankEl.querySelector('#goto-tour-view')?.addEventListener('click', () => {
      switchTab('findings');
      const tourBtn = document.querySelector('.view-btn[data-view="tour"]');
      tourBtn?.click();
    });
  }

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
      <h3>Findings by repository</h3>
      <p class="panel-hint">Click a repo for profile, connections, and tier-labeled agent analysis.</p>
      <table class="repo-table">
        <thead><tr><th>Name</th><th>Path</th><th>crit</th><th>high</th><th>med</th><th>low+info</th></tr></thead>
        <tbody>${repos
          .map((r) => {
            const sev = repoSeverityCounts(r.id);
            return `<tr class="repo-row" data-repo="${escapeAttr(r.id)}">
              <td><button type="button" class="repo-link" data-repo="${escapeAttr(r.id)}">${escapeHtml(r.name || r.id)}</button></td>
              <td class="mono" title="${escapeAttr(r.path)}">${escapeHtml(shortPath(r.path))}</td>
              <td class="${sev.critical ? 'sev-num sev-critical' : 'dim'}">${sev.critical}</td>
              <td class="${sev.high ? 'sev-num sev-high' : 'dim'}">${sev.high}</td>
              <td class="${sev.medium ? 'sev-num sev-medium' : 'dim'}">${sev.medium}</td>
              <td class="dim">${sev.low + sev.info}</td>
            </tr>`;
          })
          .join('')}</tbody></table>
    `;
    wireRepoLinks(repoEl);
  } else {
    repoEl.innerHTML = '';
  }

  const landscapeClaims = claimsForSubject('landscape');
  const claimsBlockEl = document.getElementById('overview-claims');
  if (claimsBlockEl) {
    claimsBlockEl.innerHTML = landscapeClaims.length
      ? `
      <h3>Agent analysis of the landscape (labeled claims)</h3>
      <p class="panel-hint">Imported via <span class="mono">import-analysis-claims.sh</span>; never mixed into ranked findings.</p>
      ${landscapeClaims
        .slice(0, 5)
        .map(
          (c) => `<div class="claim-item">${tierBadge(c.claim_tier)}<p class="claim-statement">${escapeHtml(c.statement || '')}</p><p class="guide-meta">claim-only · ${(c.cited_refs || []).length} ref(s) · agent: <span class="mono">${escapeHtml(c.agent || 'unknown')}</span></p></div>`
        )
        .join('')}
      ${landscapeClaims.length > 5 ? `<p class="guide-meta">${landscapeClaims.length - 5} more in repo drill-downs and bundle-query claims.</p>` : ''}
    `
      : '';
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
  else if (activeTab === 'repos') renderReposTab();
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
  repoProfiles = (await loadJSON('/bundle/repo-profiles.json'))?.repos || [];
  relationships = await loadJSONL('/bundle/relationships.jsonl');
  claims = await loadJSONL('/bundle/claims.jsonl');

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
