/**
 * Portolan orient viewer — evidence bundle from /bundle/*; UA-inspired navigation.
 */

const SEV_RANK = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

const KIND_LABELS = {
  duplication: 'Duplication',
  'static-finding': 'Static smell',
  config: 'Config surface',
  'debt-candidate': 'Symbol density',
  'dep-hub': 'Dependency hub',
};

const QUICK_PRESETS = [
  { id: 'start', label: 'Where to start', kinds: null, maxRank: 15 },
  { id: 'pain', label: 'Code pain', kinds: ['duplication', 'static-finding', 'debt-candidate'] },
  { id: 'config', label: 'Config & deploy', kinds: ['config'] },
  { id: 'deps', label: 'Dependencies', kinds: ['dep-hub'] },
];

let allHotspots = [];
let repos = [];
let manifest = null;
let gaps = [];
let filters = { kinds: new Set(), severities: new Set(), repoIds: new Set() };
let searchQuery = '';
let selectedId = null;
let expandedDirs = new Set();
let activeQuickPreset = null;

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

function sevRank(s) {
  return SEV_RANK[s] ?? 5;
}

function maxSeverity(sevs) {
  return sevs.reduce((best, s) => (sevRank(s) < sevRank(best) ? s : best), 'info');
}

function sevClass(s) {
  return `sev-${s || 'info'}`;
}

function kindLabel(kind) {
  return KIND_LABELS[kind] || kind;
}

function normalizeDisplayPath(p) {
  if (!p) return '';
  return p.replace(/\\/g, '/');
}

/** Show repo-relative or tail of path for list UI. */
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
  const filePath = paths.find((p) => p && p !== '(dependency-hub)') || paths[0];
  return filePath;
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

function matchesQuickPreset(h) {
  if (!activeQuickPreset) return true;
  const preset = QUICK_PRESETS.find((p) => p.id === activeQuickPreset);
  if (!preset) return true;
  if (preset.kinds && !preset.kinds.includes(h.kind)) return false;
  if (preset.maxRank != null && h.rank > preset.maxRank) return false;
  return true;
}

function matchesFilters(h) {
  if (filters.kinds.size && !filters.kinds.has(h.kind)) return false;
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
    .filter((h) => matchesSearch(h, q) && matchesFilters(h) && matchesQuickPreset(h))
    .sort((a, b) => a.rank - b.rank);
}

function kindCounts(hotspots) {
  const counts = {};
  for (const h of hotspots) {
    counts[h.kind] = (counts[h.kind] || 0) + 1;
  }
  return counts;
}

function renderStatsRow() {
  const el = document.getElementById('stats-row');
  el.innerHTML = '';
  const counts = manifest?.kind_counts || kindCounts(allHotspots);
  const total = manifest?.hotspot_count ?? allHotspots.length;
  const totalPill = document.createElement('span');
  totalPill.className = 'stat-pill';
  totalPill.innerHTML = `<strong>${total}</strong> hotspots`;
  el.appendChild(totalPill);
  const order = ['debt-candidate', 'config', 'static-finding', 'duplication', 'dep-hub'];
  const kinds = [...new Set([...order, ...Object.keys(counts)])];
  for (const k of kinds) {
    const n = counts[k];
    if (!n) continue;
    const pill = document.createElement('span');
    pill.className = 'stat-pill';
    pill.innerHTML = `<span class="stat-dot ${escapeHtml(k)}"></span><strong>${n}</strong> ${escapeHtml(kindLabel(k))}`;
    el.appendChild(pill);
  }
}

function renderQuickFilters() {
  const el = document.getElementById('quick-filters');
  el.innerHTML = '';
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'quick-btn' + (!activeQuickPreset && !filters.kinds.size ? ' active' : '');
  clear.textContent = 'All';
  clear.addEventListener('click', () => {
    activeQuickPreset = null;
    filters.kinds.clear();
    filters.severities.clear();
    filters.repoIds.clear();
    renderFilters();
    render();
  });
  el.appendChild(clear);
  for (const preset of QUICK_PRESETS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quick-btn' + (activeQuickPreset === preset.id ? ' active' : '');
    btn.textContent = preset.label;
    btn.addEventListener('click', () => {
      activeQuickPreset = preset.id === activeQuickPreset ? null : preset.id;
      if (activeQuickPreset) {
        filters.kinds.clear();
        if (preset.kinds) preset.kinds.forEach((k) => filters.kinds.add(k));
      }
      renderFilters();
      render();
    });
    el.appendChild(btn);
  }
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
  bar.appendChild(
    makeChipGroup('Kind', kinds, filters.kinds, () => {
      activeQuickPreset = null;
      renderQuickFilters();
      render();
    }, (v) => kindLabel(v), counts)
  );
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
  if (manifest?.hotspots_truncated) {
    parts.push(
      `<span class="status-banner truncation">Showing top <strong>${manifest.hotspot_count}</strong> of ${manifest.hotspots_total} hotspots (budget ${manifest.hotspot_budget}). Use <code>hotspots-full.jsonl</code> for the full list.</span>`
    );
  }
  if (gaps.length) {
    const items = gaps
      .slice(0, 4)
      .map((g) => `${escapeHtml(g.surface)}: ${escapeHtml(g.status)}`)
      .join(' · ');
    const more = gaps.length > 4 ? ` (+${gaps.length - 4} more)` : '';
    parts.push(`<span class="status-banner gaps">Not assessed: ${items}${more}</span>`);
  }
  if (parts.length) {
    el.innerHTML = parts.join(' ');
    el.classList.remove('hidden');
  } else {
    el.innerHTML = '';
    el.classList.add('hidden');
  }
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
      '<p class="empty-title">No matches</p><p class="empty-hint">Try clearing filters or search.</p>';
    list.appendChild(empty);
    return;
  }

  for (const h of hotspots) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hotspot-card' + (h.id === selectedId ? ' active' : '');
    btn.dataset.id = h.id;
    const path = primaryPath(h);
    const pathHtml = path
      ? `<div class="card-path" title="${escapeHtml(normalizeDisplayPath(path))}">${escapeHtml(shortPath(path))}</div>`
      : '';
    btn.innerHTML = `
      <div class="card-top">
        <span class="card-rank">#${h.rank}</span>
        <span class="kind-pill ${escapeHtml(h.kind)}">${escapeHtml(kindLabel(h.kind))}</span>
        <span class="badge ${sevClass(h.severity)}">${escapeHtml(h.severity)}</span>
      </div>
      <p class="card-summary">${escapeHtml(h.summary)}</p>
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
  treeEl.innerHTML = '';
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

async function loadSourcePreview(h, pathOverride) {
  const preview = document.getElementById('source-preview');
  const code = document.getElementById('source-code');
  const pathLabel = document.getElementById('source-path');
  const path = pathOverride || primaryPath(h);
  if (!path || path === '(dependency-hub)') {
    preview.classList.add('hidden');
    return;
  }
  pathLabel.textContent = shortPath(path);
  pathLabel.title = normalizeDisplayPath(path);
  try {
    const params = new URLSearchParams({ path, line: '1' });
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
      <p class="empty-title">Pick a hotspot</p>
      <p class="empty-hint">Use quick filters above or search. Each item links to local source when a file path exists.</p>
    `;
    document.getElementById('source-preview').classList.add('hidden');
    return;
  }
  el.className = '';
  const rid = hotspotRepo(h);
  const repoLabel = rid ? repos.find((r) => r.id === rid)?.name || rid : '';
  const symCount = h.kind === 'debt-candidate' ? symbolCountFromSummary(h.summary) : null;
  const paths = (h.paths || []).filter((p) => p && p !== '(dependency-hub)');
  const pathHtml = paths.length
    ? paths
        .map(
          (p, i) =>
            `<button type="button" class="path-chip${i === 0 ? ' primary' : ''}" data-path="${escapeHtml(normalizeDisplayPath(p))}" title="${escapeHtml(normalizeDisplayPath(p))}">${escapeHtml(shortPath(p))}</button>`
        )
        .join('')
    : '<p class="path">No file paths (landscape-level hotspot).</p>';

  el.innerHTML = `
    <div class="detail-header">
      <div class="detail-meta">
        <span class="kind-pill ${escapeHtml(h.kind)}">${escapeHtml(kindLabel(h.kind))}</span>
        <span class="badge ${sevClass(h.severity)}">${escapeHtml(h.severity)}</span>
        ${repoLabel ? `<span class="badge">${escapeHtml(repoLabel)}</span>` : ''}
        <span class="badge">#${h.rank}</span>
      </div>
      <h2 class="detail-title">${escapeHtml(h.summary)}</h2>
      ${symCount ? `<p class="path">Symbol count: <strong>${escapeHtml(symCount)}</strong></p>` : ''}
    </div>
    <div class="detail-section">
      <h3>Paths</h3>
      ${pathHtml}
    </div>
    <details class="evidence-toggle">
      <summary>Evidence &amp; provenance</summary>
      <div class="evidence-body">
        <p>State: ${escapeHtml(h.evidence_state)} · Producer: ${escapeHtml(h.producer)}</p>
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
  renderDetail(h);
  render();
  requestAnimationFrame(() => {
    const active = document.querySelector('.hotspot-card.active');
    active?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

function render() {
  const hotspots = filteredHotspots();
  const hotspotById = new Map(hotspots.map((h) => [h.id, h]));
  if (selectedId && !hotspotById.has(selectedId)) {
    selectedId = null;
    renderDetail(null);
  }
  renderBanner();
  renderTour(hotspots);
  renderTree(hotspots);
}

async function main() {
  manifest = await loadJSON('/bundle/manifest.json');
  allHotspots = await loadJSONL('/bundle/hotspots.jsonl');
  gaps = await loadJSONL('/bundle/gaps.jsonl');
  repos = (await loadJSON('/bundle/repos.json')) || [];

  const targetShort = manifest?.target_root
    ? shortPath(manifest.target_root) || manifest.target_root
    : '';
  document.getElementById('manifest-info').textContent = manifest
    ? `${targetShort} · ${manifest.hotspot_count} hotspots · ${manifest.gap_count} gaps`
    : 'no manifest';

  renderStatsRow();
  renderQuickFilters();
  renderFilters();
  renderBanner();

  document.getElementById('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    render();
  });

  render();
}

main().catch((e) => {
  document.getElementById('detail-body').innerHTML =
    `<p>Failed to load bundle. Run: npm run serve -- --bundle &lt;orient-dir&gt;</p><pre>${escapeHtml(e.message)}</pre>`;
});
