/**
 * Portolan orient viewer — evidence bundle from /bundle/*; UA-inspired navigation.
 */

const SEV_RANK = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

let allHotspots = [];
let repos = [];
let manifest = null;
let gaps = [];
let filters = { kinds: new Set(), severities: new Set(), repoIds: new Set() };
let searchQuery = '';
let selectedId = null;
let expandedDirs = new Set();

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

function kindClass(kind) {
  return kind || 'debt-candidate';
}

function normalizeDisplayPath(p) {
  if (!p) return '';
  return p.replace(/\\/g, '/');
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
  const hay = [
    h.summary,
    h.id,
    h.kind,
    h.severity,
    ...(h.paths || []),
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

function matchesFilters(h) {
  if (filters.kinds.size && !filters.kinds.has(h.kind)) return false;
  if (filters.severities.size && !filters.severities.has(h.severity)) return false;
  if (filters.repoIds.size) {
    if (h.kind === 'dep-hub') {
      // Dependency hubs are landscape-wide; repo chips should not hide them.
    } else {
      const rid = hotspotRepo(h);
      if (!rid || !filters.repoIds.has(rid)) return false;
    }
  }
  return true;
}

function filteredHotspots() {
  const q = searchQuery.trim().toLowerCase();
  return allHotspots
    .filter((h) => matchesSearch(h, q) && matchesFilters(h))
    .sort((a, b) => a.rank - b.rank);
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
    if (!norm || norm === '(dependency-hubs)') {
      const node = ensureChild(root, '(dependency-hubs)', '(dependency-hubs)', false);
      node.hotspotIds.add(h.id);
      return;
    }
    const parts = norm.split('/').filter(Boolean);
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
      addPath('(dependency-hubs)', h);
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

  const kinds = [...new Set(allHotspots.map((h) => h.kind))].sort();
  const severities = [...new Set(allHotspots.map((h) => h.severity))].sort(
    (a, b) => sevRank(a) - sevRank(b)
  );

  bar.appendChild(makeChipGroup('Kind', kinds, filters.kinds, () => render()));
  bar.appendChild(makeChipGroup('Severity', severities, filters.severities, () => render()));
  if (repos.length > 1) {
    const repoLabels = repos.map((r) => ({ id: r.id, label: r.name || r.id }));
    bar.appendChild(
      makeChipGroup(
        'Repo',
        repoLabels.map((r) => r.id),
        filters.repoIds,
        () => render(),
        (id) => repoLabels.find((r) => r.id === id)?.label || id
      )
    );
  }
}

function makeChipGroup(label, values, activeSet, onChange, labelFn = (v) => v) {
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
    btn.textContent = labelFn(v);
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
      `<span class="status-banner truncation">Showing ${manifest.hotspot_count} of ${manifest.hotspots_total} hotspots (budget ${manifest.hotspot_budget} applied).</span>`
    );
  }
  if (gaps.length) {
    const summary = gaps.map((g) => `${g.surface}: ${g.status}`).join(' · ');
    parts.push(`<span class="status-banner gaps">Gaps: ${escapeHtml(summary)}</span>`);
  }
  if (parts.length) {
    el.innerHTML = parts.join(' ');
    el.classList.remove('hidden');
  } else {
    el.innerHTML = '';
    el.classList.add('hidden');
  }
}

function renderTour(hotspots, hotspotById) {
  const list = document.getElementById('hotspot-list');
  list.innerHTML = '';
  document.getElementById('tour-count').textContent = `(${hotspots.length})`;
  for (const h of hotspots) {
    const li = document.createElement('li');
    li.className = h.id === selectedId ? 'active' : '';
    li.innerHTML = `<span class="badge ${sevClass(h.severity)}">${escapeHtml(h.severity)}</span>${escapeHtml(h.summary)}`;
    li.addEventListener('click', () => selectHotspot(h));
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
    const isExpanded = expandedDirs.has(child.pathKey) || depth < 2;

    const row = document.createElement('div');
    row.className = 'tree-node';

    const line = document.createElement('div');
    line.className = 'tree-row';
    const toggle = document.createElement('span');
    toggle.className = 'tree-toggle' + (hasChildren ? '' : ' empty');
    toggle.textContent = hasChildren ? (isExpanded ? '▾' : '▸') : '';
    const bar = document.createElement('span');
    bar.className = `sev-bar ${child.isFile ? sevClass(stats.maxSeverity) : sevClass(stats.maxSeverity)}`;
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
        hs.innerHTML = `<span class="badge">${escapeHtml(h.kind)}</span>#${h.rank} ${escapeHtml(h.summary)}`;
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
    row.innerHTML = `<span class="tree-toggle empty"></span><span class="sev-bar low"></span><span class="tree-name">(dependency-hubs)</span><span class="tree-meta">${stats.count}</span>`;
    treeEl.appendChild(row);
    for (const id of depNode.hotspotIds) {
      const h = hotspotById.get(id);
      if (!h) continue;
      const hs = document.createElement('div');
      hs.className = 'tree-hotspot' + (h.id === selectedId ? ' active' : '');
      hs.innerHTML = `<span class="badge">${escapeHtml(h.kind)}</span>#${h.rank} ${escapeHtml(h.summary)}`;
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

async function loadSourcePreview(h) {
  const preview = document.getElementById('source-preview');
  const code = document.getElementById('source-code');
  const path = (h.paths || [])[0];
  if (!path) {
    preview.classList.add('hidden');
    return;
  }
  try {
    const params = new URLSearchParams({ path, line: '1' });
    const res = await fetch(`/source?${params}`);
    if (!res.ok) {
      preview.classList.remove('hidden');
      code.textContent = `Source unavailable (${res.status}) for ${path}`;
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

function renderDetail(h) {
  const el = document.getElementById('detail-body');
  if (!h) {
    el.innerHTML = '<p>Select a hotspot.</p>';
    document.getElementById('source-preview').classList.add('hidden');
    return;
  }
  const paths = (h.paths || [])
    .map((p) => `<div class="path">${escapeHtml(p)}</div>`)
    .join('');
  const rid = hotspotRepo(h);
  const repoLabel = rid ? repos.find((r) => r.id === rid)?.name || rid : '';
  el.innerHTML = `
    <p>
      <span class="badge ${sevClass(h.severity)}">${escapeHtml(h.severity)}</span>
      <span class="badge">${escapeHtml(h.kind)}</span>
      <span class="badge">${escapeHtml(h.evidence_state)}</span>
      <span class="badge">${escapeHtml(h.producer)}</span>
      <span class="badge">#${h.rank}</span>
      ${repoLabel ? `<span class="badge">${escapeHtml(repoLabel)}</span>` : ''}
    </p>
    <p><strong>${escapeHtml(h.summary)}</strong></p>
    <p>id: <code>${escapeHtml(h.id)}</code></p>
    ${paths || '<p class="path">(no file paths)</p>'}
    <p class="path">producer_ref: ${escapeHtml(h.producer_ref || '')}</p>
  `;
  loadSourcePreview(h);
}

function selectHotspot(h) {
  selectedId = h?.id ?? null;
  renderDetail(h);
  render();
}

function render() {
  const hotspots = filteredHotspots();
  const hotspotById = new Map(hotspots.map((h) => [h.id, h]));
  if (selectedId && !hotspotById.has(selectedId)) {
    selectedId = null;
    renderDetail(null);
  }
  renderBanner();
  renderTour(hotspots, hotspotById);
  renderTree(hotspots);
}

async function main() {
  manifest = await loadJSON('/bundle/manifest.json');
  allHotspots = await loadJSONL('/bundle/hotspots.jsonl');
  gaps = await loadJSONL('/bundle/gaps.jsonl');
  repos = (await loadJSON('/bundle/repos.json')) || [];

  document.getElementById('manifest-info').textContent = manifest
    ? `target: ${manifest.target_root} · hotspots: ${manifest.hotspot_count} · gaps: ${manifest.gap_count}`
    : 'no manifest';

  renderFilters();
  renderBanner();

  document.getElementById('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    render();
  });

  render();
  if (allHotspots.length) {
    const first = filteredHotspots()[0] || allHotspots[0];
    selectHotspot(first);
  }
}

main().catch((e) => {
  document.getElementById('detail-body').innerHTML =
    `<p>Failed to load bundle. Run: npm run serve -- --bundle &lt;orient-dir&gt;</p><pre>${escapeHtml(e.message)}</pre>`;
});
