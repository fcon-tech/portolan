/**
 * Read-only query surface over a Portolan harness bundle (spec 095).
 * Shared by serve.js HTTP /api/* and portolan-bundle-query CLI.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCHEMA_VERSION = '0.1.0';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

function hashText(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

function parseLimit(raw, fallback = DEFAULT_LIMIT) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, MAX_LIMIT);
}

function readJSONL(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const text = fs.readFileSync(filePath, 'utf8');
  const rows = [];
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try {
      rows.push(JSON.parse(t));
    } catch {
      /* skip malformed */
    }
  }
  return rows;
}

function scanJSONL(filePath, onRow) {
  if (!fs.existsSync(filePath)) return 0;
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  let carry = '';
  let parsed = 0;

  try {
    while (true) {
      const bytes = fs.readSync(fd, buffer, 0, buffer.length, null);
      if (bytes <= 0) break;
      const chunk = carry + buffer.toString('utf8', 0, bytes);
      const lines = chunk.split('\n');
      carry = lines.pop() || '';
      for (const line of lines) {
        const t = line.trim();
        if (!t) continue;
        try {
          parsed += 1;
          if (onRow(JSON.parse(t)) === false) return parsed;
        } catch {
          /* skip malformed */
        }
      }
    }

    const tail = carry.trim();
    if (tail) {
      try {
        parsed += 1;
        onRow(JSON.parse(tail));
      } catch {
        /* skip malformed */
      }
    }
  } finally {
    fs.closeSync(fd);
  }

  return parsed;
}

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function loadRepoRoots(bundlePath, repoId = '') {
  const repos = readJSON(path.join(bundlePath, 'repos.json'));
  if (!Array.isArray(repos)) return [];
  const repoFilter = repoId ? resolveRepoFilterIds(bundlePath, repoId) : { ids: [], unknown: false };
  const roots = [];
  repos
    .filter((r) => r && typeof r.path === 'string' && r.path.trim())
    .filter((r) => !repoId || r.id === repoId || r.name === repoId || repoFilter.ids.includes(r.id))
    .forEach((r) => {
      const declared = path.resolve(r.path);
      roots.push(declared);
      try {
        roots.push(fs.realpathSync(declared));
      } catch {
        /* keep declared root; later file checks will fail closed */
      }
    });
  return [...new Set(roots)];
}

function resolveRepoFilterIds(bundlePath, repoFilter = '') {
  const filter = String(repoFilter || '').trim();
  if (!filter) return { ids: [], unknown: false };
  const ids = new Set();
  const repos = readJSON(path.join(bundlePath, 'repos.json'));
  if (Array.isArray(repos)) {
    repos.forEach((repo) => {
      if (!repo) return;
      const candidates = [
        repo.id,
        repo.name,
        repo.path ? path.basename(repo.path) : '',
      ].filter(Boolean);
      if (candidates.includes(filter)) ids.add(repo.id);
    });
  }
  const facts = readJSON(path.join(bundlePath, 'atlas-facts.json'));
  if (Array.isArray(facts?.components)) {
    facts.components.forEach((component) => {
      const repoId = component.repo_id || component.repoId || '';
      if (!repoId) return;
      const candidates = [
        component.target_id,
        component.targetId,
        component.id,
        component.label,
        repoId,
      ].filter(Boolean);
      if (candidates.includes(filter)) ids.add(repoId);
    });
  }
  return { ids: [...ids], unknown: ids.size === 0 };
}

function isPathUnderRoot(filePath, root) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(filePath);
  return resolved === resolvedRoot || resolved.startsWith(resolvedRoot + path.sep);
}

function isUnderRepoRoot(filePath, repoRoots) {
  const resolved = path.resolve(filePath);
  return repoRoots.some((root) => isPathUnderRoot(resolved, root));
}

function isReadableRepoFile(filePath, repoRoots) {
  let stats;
  try {
    stats = fs.lstatSync(filePath);
  } catch {
    return false;
  }
  if (stats.isSymbolicLink()) return false;
  if (!stats.isFile()) return false;
  let realPath;
  try {
    realPath = fs.realpathSync(filePath);
  } catch {
    return false;
  }
  return isUnderRepoRoot(realPath, repoRoots);
}

function resolveSourcePath(requestPath, repoRoots) {
  if (!requestPath || typeof requestPath !== 'string') return null;
  const raw = requestPath.trim();
  if (!raw || raw.includes('\0')) return null;

  if (path.isAbsolute(raw)) {
    const resolved = path.resolve(raw);
    if (!isUnderRepoRoot(resolved, repoRoots)) return null;
    return isReadableRepoFile(resolved, repoRoots) ? resolved : null;
  }

  for (const root of repoRoots) {
    const candidate = path.resolve(root, raw);
    if (!isPathUnderRoot(candidate, root)) continue;
    if (isReadableRepoFile(candidate, repoRoots)) return candidate;
  }
  return null;
}

const MAX_FULL_SOURCE_LINES = 2000;

function readSourceSnippet(filePath, lineNum, radius = 20, full = false) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const total = lines.length;
  const center = Math.min(Math.max(parseInt(lineNum, 10) || 1, 1), total || 1);
  const start = full ? 1 : Math.max(1, center - radius);
  const end = full ? Math.min(total, MAX_FULL_SOURCE_LINES) : Math.min(total, center + radius);
  const snippet = [];
  for (let i = start; i <= end; i++) {
    snippet.push({
      no: i,
      text: lines[i - 1] ?? '',
      highlight: !full && i === center,
    });
  }
  return {
    path: filePath,
    line: center,
    startLine: start,
    endLine: end,
    totalLines: total,
    truncated: full && total > end,
    lines: snippet,
  };
}

function makeRef(bundlePath, artifact, recordId) {
  const base = path.resolve(bundlePath);
  return `portolan://${base}/${artifact}#${encodeURIComponent(recordId)}`;
}

function wrapResult(query, records, total, limit, warnings = []) {
  const out = records.slice(0, limit);
  const truncated = total > out.length;
  return {
    schema_version: SCHEMA_VERSION,
    query,
    records: out,
    total_records: total,
    truncated,
    truncated_records: truncated ? total - out.length : 0,
    warnings,
  };
}

function hotspotRecord(bundlePath, h, artifact = 'hotspots.jsonl') {
  return {
    id: h.id,
    reference: makeRef(bundlePath, artifact, h.id),
    bundle_path: path.resolve(bundlePath),
    artifact,
    record_id: h.id,
    kind: h.kind,
    evidence_state: h.evidence_state,
    status: h.status || '',
    reason: h.reason || '',
    evidence_source: h.producer_ref || h.producer || '',
    summary: h.summary || '',
    severity: h.severity || '',
    rank: h.rank,
    repo_id: h.repo_id || '',
    line: h.line || h.start_line || undefined,
    locations: h.locations || undefined,
    paths: h.paths || [],
    producer: h.producer || '',
    producer_ref: h.producer_ref || '',
  };
}

function gapRecord(bundlePath, g) {
  return {
    id: g.id,
    reference: makeRef(bundlePath, 'gaps.jsonl', g.id),
    bundle_path: path.resolve(bundlePath),
    artifact: 'gaps.jsonl',
    record_id: g.id,
    kind: 'gap',
    evidence_state: g.evidence_state || 'unknown',
    status: g.status || 'unknown',
    reason: g.summary || '',
    summary: g.summary || '',
    surface: g.surface || '',
    recipe: g.recipe || g.recipe_ref || g.producer_ref || '',
  };
}

function loadHotspots(bundlePath, useFull) {
  const file = useFull ? 'hotspots-full.jsonl' : 'hotspots.jsonl';
  const fp = path.join(bundlePath, file);
  if (useFull && !fs.existsSync(fp)) {
    return { rows: readJSONL(path.join(bundlePath, 'hotspots.jsonl')), artifact: 'hotspots.jsonl' };
  }
  return { rows: readJSONL(fp), artifact: file };
}

function repoPathPrefixes(bundlePath, repoId) {
  // Absolute root plus target-root-relative form, so hotspot paths recorded
  // either way attribute to the right repo.
  const repos = readJSON(path.join(bundlePath, 'repos.json'));
  if (!Array.isArray(repos)) return null;
  const repo = repos.find((r) => r && r.id === repoId);
  if (!repo || typeof repo.path !== 'string') return null;
  const prefixes = [repo.path.replace(/\\/g, '/')];
  const repoName = (repo.name || path.basename(repo.path)).replace(/\\/g, '/');
  if (repoName) prefixes.push(repoName);
  const manifest = readJSON(path.join(bundlePath, 'manifest.json'));
  const targetRoot = (manifest?.target_root || '').replace(/\\/g, '/');
  if (targetRoot && prefixes[0].startsWith(targetRoot + '/')) {
    prefixes.push(prefixes[0].slice(targetRoot.length + 1));
  }
  if (repos.length === 1) prefixes.push('');
  return [...new Set(prefixes)];
}

function pathInRepo(p, prefixes) {
  const norm = String(p).replace(/\\/g, '/');
  return prefixes.some((pre) => {
    if (pre === '') return !path.isAbsolute(norm);
    return norm === pre || norm.startsWith(pre + '/');
  });
}

function queryHotspots(bundlePath, opts = {}) {
  const limit = parseLimit(opts.limit);
  const useFull = opts.full === true || opts.full === 'true';
  const { rows, artifact } = loadHotspots(bundlePath, useFull);
  const warnings = [];
  if (useFull && artifact === 'hotspots.jsonl') {
    warnings.push('hotspots-full.jsonl missing; using budgeted hotspots.jsonl');
  }

  const kind = (opts.kind || '').trim();
  const severity = (opts.severity || '').trim();
  const pathPrefix = (opts.path || opts.pathPrefix || '').trim().toLowerCase();
  const text = (opts.text || opts.q || '').trim().toLowerCase();
  const repoId = (opts.repo || '').trim();
  const repoFilter = resolveRepoFilterIds(bundlePath, repoId);
  let repoPrefixes = [];
  let repoUnknown = false;
  if (repoId) {
    repoPrefixes = repoFilter.ids.flatMap((id) => repoPathPrefixes(bundlePath, id) || []);
    if (repoFilter.unknown) {
      // unknown repo must not silently widen the answer to the whole landscape
      repoUnknown = true;
      warnings.push(`repo not found in repos.json: ${repoId}; returning no records`);
    }
  }

  let matched = repoUnknown ? [] : rows.filter((h) => {
    if (kind && h.kind !== kind) return false;
    if (severity && h.severity !== severity) return false;
    if (repoId) {
      if (h.repo_id && repoFilter.ids.includes(h.repo_id)) {
        // direct producer attribution wins over path heuristics
      } else if (!(h.paths || []).some((p) => pathInRepo(p, repoPrefixes))) {
        return false;
      }
    }
    if (pathPrefix) {
      const paths = (h.paths || []).map((p) => String(p).toLowerCase());
      if (!paths.some((p) => p.includes(pathPrefix))) return false;
    }
    if (text) {
      const hay = `${h.summary || ''} ${h.kind || ''} ${(h.paths || []).join(' ')}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });

  matched.sort((a, b) => (a.rank || 0) - (b.rank || 0));
  const records = matched.map((h, index) => hotspotRecord(
    bundlePath,
    h.rank ? h : { ...h, rank: index + 1 },
    artifact
  ));
  return wrapResult(
    {
      family: 'hotspots',
      kind: kind || undefined,
      severity: severity || undefined,
      path: pathPrefix || undefined,
      text: text || undefined,
      repo: repoId || undefined,
      limit,
      bundle_path: path.resolve(bundlePath),
      artifact,
    },
    records,
    records.length,
    limit,
    warnings
  );
}

function queryGaps(bundlePath, opts = {}) {
  const limit = parseLimit(opts.limit);
  const surface = (opts.surface || '').trim().toLowerCase();
  const status = (opts.status || '').trim().toLowerCase();
  const rows = readJSONL(path.join(bundlePath, 'gaps.jsonl'));

  let matched = rows.filter((g) => {
    if (surface && !(g.surface || '').toLowerCase().includes(surface)) return false;
    if (status && (g.status || '').toLowerCase() !== status) return false;
    return true;
  });

  const records = matched.map((g) => gapRecord(bundlePath, g));
  return wrapResult(
    {
      family: 'gaps',
      surface: surface || undefined,
      status: status || undefined,
      limit,
      bundle_path: path.resolve(bundlePath),
    },
    records,
    records.length,
    limit
  );
}

function queryLandscape(bundlePath, opts = {}) {
  const section = (opts.section || '').trim();
  const card = readJSON(path.join(bundlePath, 'landscape-card.json'));
  const report = readJSON(path.join(bundlePath, 'landscape-report.json'));
  const warnings = [];
  if (!card && !report) {
    return wrapResult(
      { family: 'landscape', section: section || 'all', bundle_path: path.resolve(bundlePath) },
      [],
      0,
      1,
      ['landscape-card.json and landscape-report.json missing']
    );
  }

  const records = [];
  if (!section || section === 'card' || section === 'identity') {
    if (card) {
      records.push({
        id: 'landscape-card',
        reference: makeRef(bundlePath, 'landscape-card.json', 'card'),
        bundle_path: path.resolve(bundlePath),
        artifact: 'landscape-card.json',
        record_id: 'card',
        kind: 'landscape',
        evidence_state: 'metadata-visible',
        status: 'observed',
        summary: card.identity?.name || 'landscape card',
        section: 'card',
        payload: card,
      });
    }
  }
  if (!section || section === 'report' || section === 'sections') {
    if (report?.sections) {
      for (const s of report.sections) {
        if (section && section !== 'report' && section !== 'sections' && s.id !== section) continue;
        records.push({
          id: `landscape-section-${s.id || s.title || records.length}`,
          reference: makeRef(bundlePath, 'landscape-report.json', s.id || s.title || 'section'),
          bundle_path: path.resolve(bundlePath),
          artifact: 'landscape-report.json',
          record_id: s.id || s.title || '',
          kind: 'landscape-section',
          evidence_state: 'metadata-visible',
          status: 'observed',
          summary: s.title || s.id || 'section',
          section: s.id || s.title,
          payload: s,
        });
      }
    }
  }
  return wrapResult(
    {
      family: 'landscape',
      section: section || 'all',
      limit: 1,
      bundle_path: path.resolve(bundlePath),
    },
    records,
    records.length,
    Math.max(records.length, 1),
    warnings
  );
}

function querySearch(bundlePath, opts = {}) {
  const limit = parseLimit(opts.limit);
  const q = (opts.q || opts.text || '').trim().toLowerCase();
  const pathScope = (opts.pathScope || opts.path || '').trim().toLowerCase();
  const repoId = (opts.repo || '').trim();
  const repoFilter = resolveRepoFilterIds(bundlePath, repoId);
  const indexPath = path.join(bundlePath, 'search-index.jsonl');
  const warnings = [];

  if (!q) {
    return wrapResult(
      { family: 'search', q: '', limit, bundle_path: path.resolve(bundlePath) },
      [],
      0,
      limit,
      ['--q is required for search']
    );
  }

  if (!fs.existsSync(indexPath)) {
    return wrapResult(
      { family: 'search', q, path_scope: pathScope || undefined, limit, bundle_path: path.resolve(bundlePath) },
      [],
      0,
      limit,
      ['search-index.jsonl missing; run build-search-index.sh during bundle build']
    );
  }

  const rows = readJSONL(indexPath);
  if (repoId && repoFilter.unknown) {
    warnings.push(`repo not found in bundle: ${repoId}; returning no records`);
  }
  let matched = (repoId && repoFilter.unknown ? [] : rows).filter((row) => {
    const p = (row.path || '').toLowerCase();
    const lineText = (row.text || '').toLowerCase();
    if (repoId && !repoFilter.ids.includes(row.repo_id || '')) return false;
    if (pathScope && !p.includes(pathScope)) return false;
    return p.includes(q) || lineText.includes(q);
  });

  const records = matched.slice(0, limit).map((row, i) => ({
    id: `search-${i}-${row.repo_id || 'repo'}:${row.path}:${row.line}`,
    reference: makeRef(bundlePath, 'search-index.jsonl', `${row.repo_id || ''}:${row.path}:${row.line}`),
    bundle_path: path.resolve(bundlePath),
    artifact: 'search-index.jsonl',
    record_id: `${row.repo_id || ''}:${row.path}:${row.line}`,
    kind: 'search-hit',
    evidence_state: 'source-visible',
    status: 'observed',
    summary: row.text || '',
    repo_id: row.repo_id || '',
    path: row.path,
    line: row.line,
    hotspot_id: row.hotspot_id || '',
  }));

  return wrapResult(
    {
      family: 'search',
      q,
      path_scope: pathScope || undefined,
      repo: repoId || undefined,
      limit,
      bundle_path: path.resolve(bundlePath),
    },
    records,
    matched.length,
    limit,
    warnings
  );
}

function querySymbol(bundlePath, opts = {}) {
  const limit = parseLimit(opts.limit);
  const name = (opts.name || opts.q || '').trim().toLowerCase();
  const symKind = (opts.kind || '').trim().toLowerCase();
  const repoId = (opts.repo || '').trim();
  const repoFilter = resolveRepoFilterIds(bundlePath, repoId);
  const indexPath = path.join(bundlePath, 'symbol-index.jsonl');
  const warnings = [];

  if (!name) {
    return wrapResult(
      { family: 'symbol', name: '', limit, bundle_path: path.resolve(bundlePath) },
      [],
      0,
      limit,
      ['--name is required for symbol query']
    );
  }

  if (!fs.existsSync(indexPath)) {
    return wrapResult(
      { family: 'symbol', name, kind: symKind || undefined, limit, bundle_path: path.resolve(bundlePath) },
      [],
      0,
      limit,
      ['symbol-index.jsonl missing; run ctags producer or import-ast-index.sh']
    );
  }

  const records = [];
  let total = 0;
  if (repoId && repoFilter.unknown) {
    warnings.push(`repo not found in bundle: ${repoId}; returning no records`);
  }
  scanJSONL(indexPath, (row) => {
    if (repoId && repoFilter.unknown) return false;
    const n = (row.name || '').toLowerCase();
    if (!n.includes(name)) return;
    if (symKind && (row.kind || '').toLowerCase() !== symKind) return;
    if (repoId && !repoFilter.ids.includes(row.repo_id || '')) return;
    total += 1;
    if (records.length >= limit) return;
    const recordId = `${row.repo_id || ''}:${row.path}:${row.line}:${row.name}`;
    records.push({
      id: `sym-${recordId}`,
      reference: makeRef(bundlePath, 'symbol-index.jsonl', recordId),
      bundle_path: path.resolve(bundlePath),
      artifact: 'symbol-index.jsonl',
      record_id: recordId,
      kind: 'symbol',
      evidence_state: row.evidence_state || 'metadata-visible',
      status: 'observed',
      summary: `${row.kind || 'symbol'} ${row.name} at ${row.path}:${row.line}`,
      name: row.name,
      symbol_kind: row.kind,
      repo_id: row.repo_id || '',
      path: row.path,
      line: row.line,
      producer: row.producer || 'ctags',
      resolution_limit: row.resolution_limit || 'definition-only; not a full call graph',
    });
  });

  return wrapResult(
    {
      family: 'symbol',
      name,
      kind: symKind || undefined,
      repo: repoId || undefined,
      limit,
      bundle_path: path.resolve(bundlePath),
    },
    records,
    total,
    limit,
    warnings
  );
}

function querySource(bundlePath, opts = {}) {
  const repoId = (opts.repo || '').trim();
  const repoRoots = loadRepoRoots(bundlePath, repoId);
  const filePath = resolveSourcePath(opts.path || '', repoRoots);
  const warnings = [];

  if (!filePath) {
    return wrapResult(
      {
        family: 'source',
        path: opts.path || '',
        repo: repoId || undefined,
        line: opts.line || 1,
        bundle_path: path.resolve(bundlePath),
      },
      [],
      0,
      1,
      ['path forbidden, not found, or outside repo roots']
    );
  }

  const radius = parseInt(opts.radius, 10) || 20;
  const full = opts.full === true || opts.full === 'true' || opts.full === '1';
  const body = readSourceSnippet(filePath, opts.line || 1, radius, full);
  const records = [
    {
      id: `source-${body.path}:${body.line}`,
      reference: makeRef(bundlePath, 'source', `${body.path}:${body.line}`),
      bundle_path: path.resolve(bundlePath),
      artifact: 'source',
      record_id: `${body.path}:${body.line}`,
      kind: 'source-snippet',
      evidence_state: 'source-visible',
      status: 'observed',
      summary: `Source snippet ${body.path}:${body.line}`,
      path: body.path,
      line: body.line,
      payload: body,
    },
  ];

  return wrapResult(
    {
      family: 'source',
      path: opts.path,
      repo: repoId || undefined,
      line: body.line,
      radius,
      full: full || undefined,
      bundle_path: path.resolve(bundlePath),
    },
    records,
    1,
    1,
    warnings
  );
}

function queryAtlas(bundlePath, opts = {}) {
  const limit = parseLimit(opts.limit, MAX_LIMIT);
  const target = (opts.target || '').trim();
  const repoId = (opts.repo || '').trim();
  const repoFilter = resolveRepoFilterIds(bundlePath, repoId);
  const section = (opts.section || 'components').trim().toLowerCase();
  const facts = readJSON(path.join(bundlePath, 'atlas-facts.json'));
  const content = readJSON(path.join(bundlePath, 'atlas-surface-content.json'));
  const warnings = [];

  if (!facts) {
    return wrapResult(
      { family: 'atlas', section, target: target || undefined, repo: repoId || undefined, limit, bundle_path: path.resolve(bundlePath) },
      [],
      0,
      limit,
      ['atlas-facts.json missing; run current portolan-scan/build-portolan-bundle']
    );
  }

  let rows = [];
  let artifact = 'atlas-facts.json';
  if (section === 'surfaces' || section === 'surface-content') {
    rows = Array.isArray(content?.routes) ? content.routes : [];
    artifact = 'atlas-surface-content.json';
    if (!content) warnings.push('atlas-surface-content.json missing; returning no surface-content records');
  } else if (section === 'edges') {
    rows = Array.isArray(facts.edges) ? facts.edges : [];
  } else if (section === 'gaps') {
    rows = Array.isArray(facts.gaps) ? facts.gaps : [];
  } else {
    rows = Array.isArray(facts.components) ? facts.components : [];
  }

  if (repoId && repoFilter.unknown) {
    warnings.push(`repo not found in bundle: ${repoId}; returning no records`);
  }
  const matched = (repoId && repoFilter.unknown ? [] : rows).filter((row) => {
    if (target) {
      const rowTarget = row.target_id || row.targetId || row.from_target || row.to_target || row.id || '';
      const includesTarget = rowTarget === target ||
        row.from_target === target ||
        row.to_target === target ||
        (row.repo_ids || []).includes(target);
      if (!includesTarget) return false;
    }
    if (repoId) {
      const rowRepo = row.repo_id || row.repoId || row.from_repo || row.to_repo || '';
      const includesRepo = repoFilter.ids.includes(rowRepo) ||
        repoFilter.ids.includes(row.from_repo) ||
        repoFilter.ids.includes(row.to_repo) ||
        (row.repo_ids || []).some((id) => repoFilter.ids.includes(id));
      if (!includesRepo) return false;
    }
    return true;
  });

  const records = matched.map((row, index) => {
    const id = row.id || row.target_id || row.route_id || `${section}-${index + 1}`;
    return {
      id,
      reference: makeRef(bundlePath, artifact, id),
      bundle_path: path.resolve(bundlePath),
      artifact,
      record_id: id,
      kind: section === 'components' ? 'atlas-component' : `atlas-${section}`,
      evidence_state: row.evidence_state || row.state || 'metadata-visible',
      status: row.status || 'observed',
      summary: row.summary || row.label || row.title || id,
      target_id: row.target_id || row.targetId || '',
      repo_id: row.repo_id || row.repoId || '',
      payload: row,
    };
  });

  return wrapResult(
    {
      family: 'atlas',
      section,
      target: target || undefined,
      repo: repoId || undefined,
      limit,
      bundle_path: path.resolve(bundlePath),
    },
    records,
    records.length,
    limit,
    warnings
  );
}

function queryEvidenceIndex(bundlePath, opts = {}) {
  const limit = parseLimit(opts.limit);
  const family = (opts.family || '').trim().toLowerCase();
  const bridgeDir = path.join(bundlePath, 'map-bridge');
  const indexPath = path.join(bridgeDir, 'evidence-index.jsonl');

  if (!fs.existsSync(indexPath)) {
    return wrapResult(
      {
        family: 'evidence-index',
        map_bridge: bridgeDir,
        limit,
        bundle_path: path.resolve(bundlePath),
      },
      [],
      0,
      limit,
      ['map-bridge/evidence-index.jsonl missing; run build-map-bridge.sh after portolan map']
    );
  }

  const rows = readJSONL(indexPath);
  let matched = rows;
  if (family) {
    matched = rows.filter((r) => (r.family || r.kind || '').toLowerCase().includes(family));
  }

  const records = matched.slice(0, limit).map((row) => ({
    id: row.id || `evidence-${row.record_id || row.family}`,
    reference: makeRef(bundlePath, 'map-bridge/evidence-index.jsonl', row.id || row.record_id),
    bundle_path: path.resolve(bundlePath),
    artifact: 'map-bridge/evidence-index.jsonl',
    record_id: row.id || row.record_id || '',
    kind: row.family || row.kind || 'evidence',
    evidence_state: row.evidence_state || 'metadata-visible',
    status: row.status || 'observed',
    summary: row.summary || row.reason || '',
    producer: row.producer || '',
    payload: row,
  }));

  return wrapResult(
    {
      family: 'evidence-index',
      filter_family: family || undefined,
      limit,
      bundle_path: path.resolve(bundlePath),
    },
    records,
    matched.length,
    limit
  );
}

function queryRepos(bundlePath, opts = {}) {
  const limit = parseLimit(opts.limit, MAX_LIMIT);
  const repoId = (opts.repo || opts.id || '').trim();
  const text = (opts.text || opts.q || '').trim().toLowerCase();
  const profilesPath = path.join(bundlePath, 'repo-profiles.json');
  const profiles = readJSON(profilesPath);
  const warnings = [];

  let rows = [];
  let artifact = 'repo-profiles.json';
  if (profiles && Array.isArray(profiles.repos)) {
    rows = profiles.repos;
  } else {
    const repos = readJSON(path.join(bundlePath, 'repos.json'));
    rows = Array.isArray(repos) ? repos : [];
    artifact = 'repos.json';
    warnings.push('repo-profiles.json missing; identity-only records from repos.json (run scan-repo-profiles.sh)');
  }

  const matched = rows.filter((r) => {
    if (repoId && r.id !== repoId) return false;
    if (text) {
      const manifests = (r.purpose?.manifests || [])
        .map((m) => `${m.name || ''} ${m.description || ''} ${m.module || ''}`)
        .join(' ');
      const hay = `${r.id} ${r.name || ''} ${r.purpose?.readme_title || ''} ${manifests}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });

  const records = matched.map((r) => ({
    id: r.id,
    reference: makeRef(bundlePath, artifact, r.id),
    bundle_path: path.resolve(bundlePath),
    artifact,
    record_id: r.id,
    kind: 'repo-profile',
    evidence_state: r.purpose?.evidence_state || 'metadata-visible',
    // record-level state describes the profile artifact; per-section states
    // (activity may be unknown) must stay visible, not be flattened to observed
    activity_evidence_state: r.activity?.evidence_state || 'unknown',
    status: 'observed',
    summary:
      r.purpose?.readme_title ||
      (r.purpose?.manifests || []).map((m) => m.description).find(Boolean) ||
      r.name ||
      r.id,
    name: r.name || r.id,
    path: r.path || '',
    payload: r,
  }));

  return wrapResult(
    {
      family: 'repos',
      repo: repoId || undefined,
      text: text || undefined,
      limit,
      bundle_path: path.resolve(bundlePath),
      artifact,
    },
    records,
    matched.length,
    limit,
    warnings
  );
}

function queryRelationships(bundlePath, opts = {}) {
  const limit = parseLimit(opts.limit);
  const type = (opts.type || '').trim().toLowerCase();
  const repoId = (opts.repo || '').trim();
  const repoFilter = resolveRepoFilterIds(bundlePath, repoId);
  const relPath = path.join(bundlePath, 'relationships.jsonl');
  const warnings = [];

  if (!fs.existsSync(relPath)) {
    return wrapResult(
      { family: 'relationships', type: type || undefined, repo: repoId || undefined, limit, bundle_path: path.resolve(bundlePath) },
      [],
      0,
      limit,
      ['relationships.jsonl missing; bundle built before spec 105 or scan-cross-repo failed (see gaps)']
    );
  }

  const rows = readJSONL(relPath);
  if (repoId && repoFilter.unknown) {
    warnings.push(`repo not found in bundle: ${repoId}; returning no records`);
  }
  const matched = (repoId && repoFilter.unknown ? [] : rows).filter((r) => {
    if (type && (r.type || '').toLowerCase() !== type) return false;
    if (repoId) {
      const members = [r.from_repo, r.to_repo, ...(r.repos || [])].filter(Boolean);
      if (!members.some((member) => repoFilter.ids.includes(member))) return false;
    }
    return true;
  });

  const records = matched.map((r) => ({
    id: r.id,
    reference: makeRef(bundlePath, 'relationships.jsonl', r.id),
    bundle_path: path.resolve(bundlePath),
    artifact: 'relationships.jsonl',
    record_id: r.id,
    kind: 'relationship',
    relationship_type: r.type || '',
    evidence_state: r.evidence_state || 'metadata-visible',
    status: 'observed',
    summary: r.summary || '',
    from_repo: r.from_repo || null,
    to_repo: r.to_repo || null,
    repos: r.repos || undefined,
    detail: r.detail || {},
    producer: r.producer || '',
    producer_ref: r.producer_ref || '',
  }));

  return wrapResult(
    {
      family: 'relationships',
      type: type || undefined,
      repo: repoId || undefined,
      limit,
      bundle_path: path.resolve(bundlePath),
    },
    records,
    matched.length,
    limit,
    warnings
  );
}

function queryClaims(bundlePath, opts = {}) {
  const limit = parseLimit(opts.limit);
  const tier = (opts.tier || '').trim().toLowerCase();
  const subject = (opts.subject || '').trim().toLowerCase();
  const claimsPath = path.join(bundlePath, 'claims.jsonl');
  const warnings = [];

  if (!fs.existsSync(claimsPath)) {
    return wrapResult(
      { family: 'claims', tier: tier || undefined, subject: subject || undefined, limit, bundle_path: path.resolve(bundlePath) },
      [],
      0,
      limit,
      ['claims.jsonl missing; no agent analysis imported (see scripts/import-analysis-claims.sh and harness/guardrails/analysis-claims.md)']
    );
  }

  const VALID_TIERS = ['analytical', 'synthetic', 'speculative'];
  if (tier && !VALID_TIERS.includes(tier)) {
    warnings.push(`unknown tier filter: ${tier} (expected ${VALID_TIERS.join(' | ')}); returning no records`);
  }

  const rows = readJSONL(claimsPath);
  const matched = rows.filter((c) => {
    if (tier && (c.claim_tier || '').toLowerCase() !== tier) return false;
    if (subject) {
      // exact subject match; "repo:" / "path:" prefix filters all of that scheme.
      // Substring matching would let repo:foo answer for repo:foo-bar.
      const s = (c.subject || '').toLowerCase();
      const schemeOnly = subject === 'repo:' || subject === 'path:';
      if (schemeOnly ? !s.startsWith(subject) : s !== subject) return false;
    }
    return true;
  });

  const records = matched.map((c) => ({
    id: c.id,
    reference: makeRef(bundlePath, 'claims.jsonl', c.id),
    bundle_path: path.resolve(bundlePath),
    artifact: 'claims.jsonl',
    record_id: c.id,
    kind: 'analysis-claim',
    claim_tier: c.claim_tier || 'speculative',
    evidence_state: 'claim-only',
    status: 'imported',
    summary: c.statement || '',
    statement: c.statement || '',
    subject: c.subject || '',
    cited_refs: c.cited_refs || [],
    agent: c.agent || '',
    imported_at: c.imported_at || '',
    resolution_limit:
      'LLM-authored analysis (tier ' +
      (c.claim_tier === 'analytical' ? 'B' : c.claim_tier === 'synthetic' ? 'C' : 'D') +
      '); refs resolved at import time, conclusion not tool-verified',
  }));

  return wrapResult(
    {
      family: 'claims',
      tier: tier || undefined,
      subject: subject || undefined,
      limit,
      bundle_path: path.resolve(bundlePath),
    },
    records,
    matched.length,
    limit,
    warnings
  );
}

function stratumRecord(bundlePath, artifact, row) {
  const id = row.id || row.record_id || `${artifact}-${hashText(JSON.stringify(row)).slice(0, 12)}`;
  return {
    id,
    reference: makeRef(bundlePath, artifact, id),
    bundle_path: path.resolve(bundlePath),
    artifact,
    record_id: id,
    kind: row.stratum || row.kind || artifact.replace(/\.(jsonl|json)$/g, ''),
    stratum: row.stratum || '',
    family: row.family || '',
    fact_kind: row.fact_kind || '',
    evidence_layer: row.evidence_layer || '',
    evidence_state: row.evidence_state || 'metadata-visible',
    status: row.status || 'observed',
    health_status: row.stratum === 'promotion_health' ? row.status || '' : undefined,
    summary: row.reason || row.summary || row.promotion_basis || row.path || row.statement || id,
    promotion_basis: row.promotion_basis || '',
    resolution_limit: row.resolution_limit || '',
    source_refs: row.source_refs || row.evidence_refs || [],
    producer: row.producer || '',
    producer_ref: row.producer_ref || '',
    payload: row,
  };
}

function queryStratumFile(bundlePath, opts = {}, config) {
  const limit = parseLimit(opts.limit, MAX_LIMIT);
  const family = (opts.family || '').trim().toLowerCase();
  const status = (opts.status || '').trim().toLowerCase();
  const stratum = (opts.stratum || '').trim().toLowerCase();
  const filePath = path.join(bundlePath, config.artifact);
  const warnings = [];
  if (!fs.existsSync(filePath)) {
    return wrapResult(
      { family: config.family, filter_family: family || undefined, status: status || undefined, limit, bundle_path: path.resolve(bundlePath) },
      [],
      0,
      limit,
      [`${config.artifact} missing; run build-evidence-promotion-atlas.sh or portolan-scan`]
    );
  }
  let rows = config.json ? (readJSON(filePath)?.records || readJSON(filePath)?.families || []) : readJSONL(filePath);
  if (!Array.isArray(rows)) rows = [];
  const matched = rows.filter((row) => {
    if (family && (row.family || '').toLowerCase() !== family) return false;
    if (status && (row.status || '').toLowerCase() !== status) return false;
    if (stratum && (row.stratum || '').toLowerCase() !== stratum) return false;
    return true;
  });
  return wrapResult(
    {
      family: config.family,
      filter_family: family || undefined,
      status: status || undefined,
      stratum: stratum || undefined,
      limit,
      bundle_path: path.resolve(bundlePath),
      artifact: config.artifact,
    },
    matched.map((row) => stratumRecord(bundlePath, config.artifact, row)),
    matched.length,
    limit,
    warnings
  );
}

function dispatch(bundlePath, family, opts) {
  const resolved = path.resolve(bundlePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`bundle not found: ${resolved}`);
  }
  switch (family) {
    case 'hotspots':
      return queryHotspots(resolved, opts);
    case 'gaps':
      return queryGaps(resolved, opts);
    case 'landscape':
      return queryLandscape(resolved, opts);
    case 'search':
      return querySearch(resolved, opts);
    case 'symbol':
      return querySymbol(resolved, opts);
    case 'source':
      return querySource(resolved, opts);
    case 'atlas':
      return queryAtlas(resolved, opts);
    case 'evidence-index':
      return queryEvidenceIndex(resolved, opts);
    case 'claims':
      return queryClaims(resolved, opts);
    case 'repos':
      return queryRepos(resolved, opts);
    case 'relationships':
      return queryRelationships(resolved, opts);
    case 'promotion-health':
      return queryStratumFile(resolved, opts, { family, artifact: 'promotion-health.jsonl' });
    case 'promoted-facts':
      return queryStratumFile(resolved, opts, { family, artifact: 'promoted-facts.jsonl' });
    case 'raw-artifacts':
      return queryStratumFile(resolved, opts, { family, artifact: 'raw-artifacts.jsonl' });
    case 'classified-sources':
      return queryStratumFile(resolved, opts, { family, artifact: 'classified-sources.jsonl' });
    default:
      throw new Error(`unknown query family ${family}`);
  }
}

function handleHttpPath(pathname, searchParams, bundlePath) {
  const p = pathname.replace(/\/$/, '');
  if (p === '/api/hotspots') {
    return dispatch(bundlePath, 'hotspots', {
      kind: searchParams.get('kind'),
      severity: searchParams.get('severity'),
      path: searchParams.get('path'),
      text: searchParams.get('text') || searchParams.get('q'),
      repo: searchParams.get('repo'),
      limit: searchParams.get('limit'),
      full: searchParams.get('full'),
    });
  }
  if (p === '/api/gaps') {
    return dispatch(bundlePath, 'gaps', {
      surface: searchParams.get('surface'),
      status: searchParams.get('status'),
      limit: searchParams.get('limit'),
    });
  }
  if (p === '/api/landscape') {
    return dispatch(bundlePath, 'landscape', { section: searchParams.get('section') });
  }
  if (p === '/api/search') {
    return dispatch(bundlePath, 'search', {
      q: searchParams.get('q'),
      pathScope: searchParams.get('path_scope') || searchParams.get('path'),
      repo: searchParams.get('repo'),
      limit: searchParams.get('limit'),
    });
  }
  if (p === '/api/symbol') {
    return dispatch(bundlePath, 'symbol', {
      name: searchParams.get('name') || searchParams.get('q'),
      kind: searchParams.get('kind'),
      repo: searchParams.get('repo'),
      limit: searchParams.get('limit'),
    });
  }
  if (p === '/api/source') {
    return dispatch(bundlePath, 'source', {
      path: searchParams.get('path'),
      repo: searchParams.get('repo'),
      line: searchParams.get('line'),
      radius: searchParams.get('radius'),
      full: searchParams.get('full'),
    });
  }
  if (p === '/api/atlas') {
    return dispatch(bundlePath, 'atlas', {
      section: searchParams.get('section'),
      target: searchParams.get('target') || searchParams.get('component'),
      repo: searchParams.get('repo'),
      limit: searchParams.get('limit'),
    });
  }
  if (p === '/api/evidence-index') {
    return dispatch(bundlePath, 'evidence-index', {
      family: searchParams.get('family'),
      limit: searchParams.get('limit'),
    });
  }
  if (p === '/api/claims') {
    return dispatch(bundlePath, 'claims', {
      tier: searchParams.get('tier'),
      subject: searchParams.get('subject'),
      limit: searchParams.get('limit'),
    });
  }
  if (p === '/api/repos') {
    return dispatch(bundlePath, 'repos', {
      repo: searchParams.get('repo') || searchParams.get('id'),
      text: searchParams.get('text') || searchParams.get('q'),
      limit: searchParams.get('limit'),
    });
  }
  if (p === '/api/relationships') {
    return dispatch(bundlePath, 'relationships', {
      type: searchParams.get('type'),
      repo: searchParams.get('repo'),
      limit: searchParams.get('limit'),
    });
  }
  if (p === '/api/promotion-health') {
    return dispatch(bundlePath, 'promotion-health', {
      family: searchParams.get('family'),
      status: searchParams.get('status'),
      limit: searchParams.get('limit'),
    });
  }
  if (p === '/api/promoted-facts') {
    return dispatch(bundlePath, 'promoted-facts', {
      family: searchParams.get('family'),
      stratum: searchParams.get('stratum'),
      limit: searchParams.get('limit'),
    });
  }
  if (p === '/api/raw-artifacts') {
    return dispatch(bundlePath, 'raw-artifacts', {
      family: searchParams.get('family'),
      status: searchParams.get('status'),
      limit: searchParams.get('limit'),
    });
  }
  if (p === '/api/classified-sources') {
    return dispatch(bundlePath, 'classified-sources', {
      family: searchParams.get('family'),
      status: searchParams.get('status'),
      limit: searchParams.get('limit'),
    });
  }
  return null;
}

module.exports = {
  SCHEMA_VERSION,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  dispatch,
  handleHttpPath,
  loadRepoRoots,
  resolveSourcePath,
  readSourceSnippet,
  queryHotspots,
  queryGaps,
  queryLandscape,
  querySearch,
  querySymbol,
  querySource,
  queryAtlas,
  queryEvidenceIndex,
  queryClaims,
  queryRepos,
  queryRelationships,
};
