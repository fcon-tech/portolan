/**
 * Read-only query surface over a Portolan harness bundle.
 * Shared by serve.js HTTP /api/* and portolan-bundle-query CLI.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCHEMA_VERSION = '0.1.0';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;
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

function routeQuery(params = {}) {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    q.set(key, String(value));
  }
  return q.toString();
}

function appHashRoute(view, params = {}) {
  return `/#${routeQuery({ view, ...params })}`;
}

function apiRoute(family, params = {}) {
  const q = routeQuery(params);
  return q ? `/api/${family}?${q}` : `/api/${family}`;
}

function sourceRoute(repoId, sourcePath, line = 1) {
  if (!sourcePath) return '';
  return `/source?${routeQuery({ repo: repoId || undefined, path: sourcePath, line: line || 1 })}`;
}

function componentRoutes(targetId, findingId = '') {
  if (!targetId) return {};
  return {
    atlas: appHashRoute('atlas', { component: targetId }),
    risks: appHashRoute('risks', { component: targetId, finding: findingId || undefined }),
    sources: appHashRoute('sources', { component: targetId }),
    agent: appHashRoute('agent', { component: targetId }),
    graph: appHashRoute('graph', { component: targetId }),
  };
}

function normalizeSlash(value) {
  return String(value || '').replace(/\\/g, '/');
}

function loadRepos(bundlePath) {
  const profiles = readJSON(path.join(bundlePath, 'repo-profiles.json'));
  if (Array.isArray(profiles?.repos)) return profiles.repos;
  const repos = readJSON(path.join(bundlePath, 'repos.json'));
  return Array.isArray(repos) ? repos : [];
}

function loadAtlasComponents(bundlePath) {
  const facts = readJSON(path.join(bundlePath, 'atlas-facts.json'));
  return Array.isArray(facts?.components) ? facts.components : [];
}

function loadTargetByRepo(bundlePath) {
  const byRepo = new Map();
  for (const component of loadAtlasComponents(bundlePath)) {
    const repoId = component.repo_id || component.repoId || '';
    const targetId = component.target_id || component.targetId || component.id || '';
    if (repoId && targetId) byRepo.set(repoId, targetId);
  }
  return byRepo;
}

function repoRoots(repo) {
  if (!repo || typeof repo.path !== 'string' || !repo.path.trim()) return [];
  const roots = [path.resolve(repo.path)];
  try {
    roots.push(fs.realpathSync(roots[0]));
  } catch {
    /* declared root is enough for path matching */
  }
  return [...new Set(roots)];
}

function relativePathForRepo(requestPath, repo, targetRoot = '', allowBareRelative = true) {
  if (!requestPath || !repo) return '';
  const raw = String(requestPath).trim();
  if (!raw || raw.includes('\0')) return '';

  const roots = repoRoots(repo);
  if (path.isAbsolute(raw)) {
    const resolved = path.resolve(raw);
    for (const root of roots) {
      if (isPathUnderRoot(resolved, root)) return normalizeSlash(path.relative(root, resolved) || '.');
    }
    return '';
  }

  if (targetRoot) {
    const fromTarget = path.resolve(targetRoot, raw);
    for (const root of roots) {
      if (isPathUnderRoot(fromTarget, root)) return normalizeSlash(path.relative(root, fromTarget) || '.');
    }
  }

  const norm = normalizeSlash(raw).replace(/^\.?\//, '');
  const prefixes = [repo.name, repo.id, repo.path ? path.basename(repo.path) : ''].filter(Boolean);
  for (const prefix of prefixes) {
    const pre = normalizeSlash(prefix);
    if (norm === pre) return '.';
    if (norm.startsWith(`${pre}/`)) return norm.slice(pre.length + 1);
  }

  return allowBareRelative ? norm : '';
}

function resolveSelectionRepo(bundlePath, requestPath = '', repoFilter = '') {
  const repos = loadRepos(bundlePath);
  const manifest = readJSON(path.join(bundlePath, 'manifest.json'));
  const targetRoot = manifest?.target_root || '';
  const warnings = [];
  const filter = String(repoFilter || '').trim();
  const repoIds = filter ? resolveRepoFilterIds(bundlePath, filter) : { ids: [], unknown: false };
  let candidates = [];

  if (filter) {
    candidates = repos.filter((repo) => repoIds.ids.includes(repo.id));
    if (repoIds.unknown || candidates.length === 0) {
      warnings.push(`repo not found in bundle: ${filter}; selected-code lookup will not widen to all repos`);
      return { repo: null, repoId: filter, repoRelativePath: '', warnings };
    }
  } else if (requestPath) {
    candidates = repos
      .map((repo) => ({ repo, rel: relativePathForRepo(requestPath, repo, targetRoot, false) }))
      .filter((candidate) => candidate.rel);
    if (candidates.length === 1) {
      return {
        repo: candidates[0].repo,
        repoId: candidates[0].repo.id,
        repoRelativePath: candidates[0].rel,
        warnings,
      };
    }
    if (candidates.length > 1) {
      warnings.push(`selected path matches multiple repos; pass --repo to disambiguate: ${candidates.map((c) => c.repo.id).join(', ')}`);
      return { repo: null, repoId: '', repoRelativePath: '', warnings };
    }
  }

  if (!filter && repos.length === 1) {
    const repo = repos[0];
    return {
      repo,
      repoId: repo.id,
      repoRelativePath: requestPath ? relativePathForRepo(requestPath, repo, targetRoot) : '',
      warnings,
    };
  }

  if (filter && candidates.length === 1) {
    const repo = candidates[0];
    return {
      repo,
      repoId: repo.id,
      repoRelativePath: requestPath ? relativePathForRepo(requestPath, repo, targetRoot) : '',
      warnings,
    };
  }

  if (!requestPath && filter && candidates.length > 0) {
    return { repo: candidates[0], repoId: candidates[0].id, repoRelativePath: '', warnings };
  }

  if (requestPath) warnings.push('selected path could not be mapped to a repo; pass --repo or a repo-relative path');
  return { repo: null, repoId: filter || '', repoRelativePath: '', warnings };
}

function wrapResult(query, records, total, limit, warnings = [], options = {}) {
  const out = records.slice(0, limit);
  const truncated = options.truncated !== undefined ? Boolean(options.truncated) : total > out.length;
  return {
    schema_version: SCHEMA_VERSION,
    query,
    records: out,
    total_records: total,
    total_records_relation: options.totalRecordsRelation || 'exact',
    truncated,
    truncated_records: truncated ? total - out.length : 0,
    warnings,
  };
}

function hotspotRecord(bundlePath, h, artifact = 'hotspots.jsonl') {
  const firstPath = (h.paths || [])[0] || '';
  const line = h.line || h.start_line || undefined;
  const targetId = h.target_id || h.targetId || h.repo_id || '';
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
    line,
    locations: h.locations || undefined,
    paths: h.paths || [],
    routes: {
      ...componentRoutes(targetId, h.id),
      source: firstPath ? sourceRoute(h.repo_id || '', firstPath, line || 1) : undefined,
      api: apiRoute('hotspots', {
        repo: h.repo_id || undefined,
        text: h.summary || undefined,
        limit: 10,
        full: true,
      }),
    },
    producer: h.producer || '',
    producer_ref: h.producer_ref || '',
  };
}

function gapRecord(bundlePath, g, artifact = 'gaps.jsonl') {
  return {
    id: g.id,
    reference: makeRef(bundlePath, artifact, g.id),
    bundle_path: path.resolve(bundlePath),
    artifact,
    record_id: g.id,
    kind: 'gap',
    evidence_state: g.evidence_state || g.status || 'unknown',
    status: g.status || 'unknown',
    reason: g.summary || '',
    summary: g.summary || '',
    surface: g.surface || '',
    recipe: g.recipe || g.recipe_ref || g.producer_ref || '',
    routes: {
      api: apiRoute('gaps', { surface: g.surface || undefined, status: g.status || undefined }),
    },
  };
}

function promotionHealthAsGap(row) {
  const id = row.id ? `gap-${row.id}` : `gap-promotion-health-${hashText(JSON.stringify(row)).slice(0, 12)}`;
  return {
    id,
    surface: `promotion-health:${row.family || 'unknown'}`,
    status: row.status || 'unknown',
    evidence_state: row.evidence_state || row.status || 'unknown',
    summary: row.reason || row.summary || row.calculation_rule || `Promotion health ${row.status || 'unknown'}`,
    producer_ref: row.producer_ref || 'promotion-health.jsonl',
    recipe: row.next_action || 'portolan-bundle-query promotion-health',
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
  const manifest = readJSON(path.join(bundlePath, 'manifest.json')) || {};
  let artifact = useFull ? 'hotspots-full.jsonl' : 'hotspots.jsonl';
  let hotspotPath = path.join(bundlePath, artifact);
  const warnings = [];
  if (useFull && !fs.existsSync(hotspotPath)) {
    artifact = 'hotspots.jsonl';
    hotspotPath = path.join(bundlePath, artifact);
    warnings.push('hotspots-full.jsonl missing; using budgeted hotspots.jsonl');
  }

  const kind = (opts.kind || '').trim();
  const severity = (opts.severity || '').trim();
  const pathPrefix = (opts.path || opts.pathPrefix || '').trim().toLowerCase();
  const text = (opts.text || opts.q || '').trim().toLowerCase();
  const repoId = (opts.repo || '').trim();
  const hasFilter = Boolean(kind || severity || pathPrefix || text || repoId);
  if (!useFull && (manifest.hotspots_truncated || Number(manifest.hotspots_total || 0) > Number(manifest.hotspot_count || 0))) {
    warnings.push(hasFilter
      ? 'hotspots query evaluated against budgeted hotspots.jsonl; pass --full for the retained full findings layer'
      : 'hotspots.jsonl is the ranked top layer; pass --full to query hotspots-full.jsonl');
  }
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

  const records = [];
  let total = 0;
  let stoppedAtLimit = false;
  const matchHotspot = (h) => {
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
  };
  if (!repoUnknown && fs.existsSync(hotspotPath)) {
    scanJSONL(hotspotPath, (h) => {
      if (!matchHotspot(h)) return;
      total += 1;
      if (records.length >= limit) {
        stoppedAtLimit = true;
        return false;
      }
      records.push(hotspotRecord(
        bundlePath,
        h.rank ? h : { ...h, rank: records.length + 1 },
        artifact
      ));
      if (records.length >= limit) {
        stoppedAtLimit = true;
        return false;
      }
    });
  }
  if (stoppedAtLimit) {
    warnings.push('hotspots query stopped after the requested limit; total_records is a lower bound for matching rows');
  }
  const totalRecords = !useFull && !hasFilter && Number.isFinite(Number(manifest.hotspots_total))
    ? Number(manifest.hotspots_total)
    : total;
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
    totalRecords,
    limit,
    warnings,
    { totalRecordsRelation: stoppedAtLimit ? 'lower_bound' : 'exact' }
  );
}

function queryGaps(bundlePath, opts = {}) {
  const limit = parseLimit(opts.limit);
  const surface = (opts.surface || '').trim().toLowerCase();
  const status = (opts.status || '').trim().toLowerCase();
  const manifest = readJSON(path.join(bundlePath, 'manifest.json')) || {};
  const fullPath = path.join(bundlePath, 'gaps-full.jsonl');
  const artifact = fs.existsSync(fullPath) ? 'gaps-full.jsonl' : 'gaps.jsonl';
  const rows = readJSONL(path.join(bundlePath, artifact));
  const warnings = [];
  if (artifact === 'gaps.jsonl' && manifest.gaps_truncated) {
    warnings.push('gaps-full.jsonl missing while manifest says gaps are truncated');
  }
  const healthRows = readJSONL(path.join(bundlePath, 'promotion-health.jsonl'))
    .filter((row) => DEGRADED_HEALTH_STATUSES.has(row.status || ''))
    .map(promotionHealthAsGap);
  const atlasRows = ((readJSON(path.join(bundlePath, 'atlas-facts.json')) || {}).gaps || [])
    .map((row) => ({ ...row, __artifact: 'atlas-facts.json' }));
  const seen = new Set();
  const allRows = [...rows, ...atlasRows, ...healthRows].filter((row) => {
    const key = row.id || `${row.surface || row.subject || ''}:${row.status || ''}:${row.summary || row.reason || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let matched = allRows.filter((g) => {
    if (surface && !(g.surface || '').toLowerCase().includes(surface)) return false;
    if (status && (g.status || '').toLowerCase() !== status) return false;
    return true;
  });

  const records = matched.map((g) => gapRecord(
    bundlePath,
    g,
    g.__artifact || (String(g.id || '').startsWith('gap-promotion-health-') ? 'promotion-health.jsonl' : artifact)
  ));
  return wrapResult(
    {
      family: 'gaps',
      surface: surface || undefined,
      status: status || undefined,
      limit,
      bundle_path: path.resolve(bundlePath),
      artifact,
      includes_promotion_health: true,
      includes_atlas_gaps: true,
    },
    records,
    records.length,
    limit,
    warnings
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

  if (repoId && repoFilter.unknown) {
    warnings.push(`repo not found in bundle: ${repoId}; returning no records`);
  }
  const targetByRepo = loadTargetByRepo(bundlePath);
  const records = [];
  let total = 0;
  let stoppedAtLimit = false;
  if (!(repoId && repoFilter.unknown)) {
    scanJSONL(indexPath, (row) => {
      const p = (row.path || '').toLowerCase();
      const lineText = (row.text || '').toLowerCase();
      if (repoId && !repoFilter.ids.includes(row.repo_id || '')) return;
      if (pathScope && !p.includes(pathScope)) return;
      if (!p.includes(q) && !lineText.includes(q)) return;
      total += 1;
      if (records.length >= limit) {
        stoppedAtLimit = true;
        return false;
      }
      const recordId = `${row.repo_id || ''}:${row.path}:${row.line}`;
      records.push({
        id: `search-${records.length}-${row.repo_id || 'repo'}:${row.path}:${row.line}`,
        reference: makeRef(bundlePath, 'search-index.jsonl', recordId),
        bundle_path: path.resolve(bundlePath),
        artifact: 'search-index.jsonl',
        record_id: recordId,
        kind: 'search-hit',
        evidence_state: 'source-visible',
        status: 'observed',
        summary: row.text || '',
        repo_id: row.repo_id || '',
        path: row.path,
        line: row.line,
        routes: {
          ...componentRoutes(targetByRepo.get(row.repo_id || '') || row.repo_id || ''),
          source: sourceRoute(row.repo_id || '', row.path, row.line || 1),
          api: apiRoute('search', {
            q,
            repo: row.repo_id || undefined,
            path: row.path || undefined,
            limit,
          }),
        },
        hotspot_id: row.hotspot_id || '',
      });
      if (records.length >= limit) {
        stoppedAtLimit = true;
        return false;
      }
    });
  }
  if (stoppedAtLimit) {
    warnings.push('search query stopped after the requested limit; total_records is a lower bound for matching rows');
  }

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
    total,
    limit,
    warnings,
    { totalRecordsRelation: stoppedAtLimit ? 'lower_bound' : 'exact' }
  );
}

function querySymbol(bundlePath, opts = {}) {
  const limit = parseLimit(opts.limit);
  const name = (opts.name || opts.q || '').trim().toLowerCase();
  const symKind = (opts.kind || '').trim().toLowerCase();
  const pathScope = (opts.path || opts.pathScope || '').trim().toLowerCase();
  const repoId = (opts.repo || '').trim();
  const repoFilter = resolveRepoFilterIds(bundlePath, repoId);
  const indexPath = path.join(bundlePath, 'symbol-index.jsonl');
  const warnings = [];

  if (!name && !pathScope) {
    return wrapResult(
      { family: 'symbol', name: '', path: '', limit, bundle_path: path.resolve(bundlePath) },
      [],
      0,
      limit,
      ['--name or --path is required for symbol query']
    );
  }

  if (!fs.existsSync(indexPath)) {
    return wrapResult(
      { family: 'symbol', name, path: pathScope || undefined, kind: symKind || undefined, limit, bundle_path: path.resolve(bundlePath) },
      [],
      0,
      limit,
      ['symbol-index.jsonl missing; run ctags producer or import-ast-index.sh']
    );
  }

  const records = [];
  let total = 0;
  let stoppedAtLimit = false;
  if (repoId && repoFilter.unknown) {
    warnings.push(`repo not found in bundle: ${repoId}; returning no records`);
  }
  const targetByRepo = loadTargetByRepo(bundlePath);
  scanJSONL(indexPath, (row) => {
    if (repoId && repoFilter.unknown) return false;
    const n = (row.name || '').toLowerCase();
    const p = (row.path || '').toLowerCase();
    if (name && !n.includes(name)) return;
    if (pathScope && !p.includes(pathScope)) return;
    if (symKind && (row.kind || '').toLowerCase() !== symKind) return;
    if (repoId && !repoFilter.ids.includes(row.repo_id || '')) return;
    total += 1;
    if (records.length >= limit) {
      stoppedAtLimit = true;
      return false;
    }
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
      routes: {
        ...componentRoutes(targetByRepo.get(row.repo_id || '') || row.repo_id || ''),
        source: sourceRoute(row.repo_id || '', row.path, row.line || 1),
        api: apiRoute('symbol', {
          name: row.name || undefined,
          path: row.path || undefined,
          repo: row.repo_id || undefined,
          limit,
        }),
      },
      producer: row.producer || 'ctags',
      resolution_limit: row.resolution_limit || 'definition-only; not a full call graph',
    });
    if (records.length >= limit) {
      stoppedAtLimit = true;
      return false;
    }
  });
  if (stoppedAtLimit) {
    warnings.push('symbol query stopped after the requested limit; total_records is a lower bound for matching rows');
  }

  return wrapResult(
    {
      family: 'symbol',
      name,
      path: pathScope || undefined,
      kind: symKind || undefined,
      repo: repoId || undefined,
      limit,
      bundle_path: path.resolve(bundlePath),
    },
    records,
    total,
    limit,
    warnings,
    {
      totalRecordsRelation: stoppedAtLimit ? 'lower_bound' : 'exact',
      truncated: stoppedAtLimit || undefined,
    }
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
  const targetByRepo = loadTargetByRepo(bundlePath);
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
      request_path: opts.path || '',
      repo_id: repoId || '',
      routes: {
        ...componentRoutes(targetByRepo.get(repoId) || repoId),
        source: sourceRoute(repoId, opts.path || body.path, body.line),
        api: apiRoute('source', {
          repo: repoId || undefined,
          path: opts.path || body.path,
          line: body.line,
          radius,
        }),
      },
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
    const targetId = row.target_id || row.targetId || row.from_target || row.to_target || '';
    const rowRepoId = row.repo_id || row.repoId || row.from_repo || row.to_repo || '';
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
      target_id: targetId,
      repo_id: rowRepoId,
      routes: {
        ...componentRoutes(targetId || rowRepoId),
        api: apiRoute('atlas', {
          section,
          target: targetId || undefined,
          repo: rowRepoId || undefined,
          limit: 5,
        }),
      },
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

  const targetByRepo = loadTargetByRepo(bundlePath);
  const records = matched.map((r) => {
    const targetId = targetByRepo.get(r.id) || r.target_id || r.targetId || r.id;
    return {
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
      target_id: targetId,
      routes: {
        ...componentRoutes(targetId),
        api: apiRoute('repos', { repo: r.id, limit: 1 }),
      },
      payload: r,
    };
  });

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
      ['relationships.jsonl missing; relationship producer output is absent or scan-cross-repo failed (see gaps)']
    );
  }

  if (repoId && repoFilter.unknown) {
    warnings.push(`repo not found in bundle: ${repoId}; returning no records`);
  }
  const targetByRepo = loadTargetByRepo(bundlePath);
  const records = [];
  let total = 0;
  let stoppedAtLimit = false;
  const matchRelationship = (r) => {
    if (type && (r.type || '').toLowerCase() !== type) return false;
    if (repoId) {
      const members = [r.from_repo, r.to_repo, ...(r.repos || [])].filter(Boolean);
      if (!members.some((member) => repoFilter.ids.includes(member))) return false;
    }
    return true;
  };
  const relationshipRecord = (r) => {
    const fromTarget = r.from_target || targetByRepo.get(r.from_repo || '') || '';
    const toTarget = r.to_target || targetByRepo.get(r.to_repo || '') || '';
    return {
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
      routes: {
        graph: appHashRoute('graph', { component: fromTarget || toTarget || undefined }),
        from_atlas: fromTarget ? appHashRoute('atlas', { component: fromTarget }) : undefined,
        to_atlas: toTarget ? appHashRoute('atlas', { component: toTarget }) : undefined,
        api: apiRoute('relationships', { type: r.type || undefined, repo: repoId || undefined, limit }),
      },
      detail: r.detail || {},
      producer: r.producer || '',
      producer_ref: r.producer_ref || '',
    };
  };
  if (!(repoId && repoFilter.unknown)) {
    scanJSONL(relPath, (r) => {
      if (!matchRelationship(r)) return;
      total += 1;
      if (records.length >= limit) {
        stoppedAtLimit = true;
        return false;
      }
      records.push(relationshipRecord(r));
      if (records.length >= limit) {
        stoppedAtLimit = true;
        return false;
      }
    });
  }
  if (stoppedAtLimit) {
    warnings.push('relationships query stopped after the requested limit; total_records is a lower bound for matching rows');
  }

  return wrapResult(
    {
      family: 'relationships',
      type: type || undefined,
      repo: repoId || undefined,
      limit,
      bundle_path: path.resolve(bundlePath),
    },
    records,
    total,
    limit,
    warnings,
    { totalRecordsRelation: stoppedAtLimit ? 'lower_bound' : 'exact' }
  );
}

function compactString(value) {
  return String(value || '').trim().toLowerCase();
}

function endpointAliases(value) {
  const raw = String(value || '').trim();
  const norm = compactString(raw);
  const out = new Set([raw, norm].filter(Boolean));
  if (norm.startsWith('repo:')) out.add(norm.slice(5));
  if (norm.startsWith('component:')) out.add(norm.slice(10));
  if (norm.startsWith('target:')) out.add(norm.slice(7));
  return [...out].filter(Boolean);
}

function resolveClaimEndpoint(bundlePath, input) {
  const aliases = new Set(endpointAliases(input));
  const repos = loadRepos(bundlePath);
  const components = loadAtlasComponents(bundlePath);
  const matchedRepoIds = new Set();
  const matchedTargetIds = new Set();
  const labels = new Set();

  repos.forEach((repo) => {
    const candidates = [
      repo.id,
      repo.name,
      repo.path ? path.basename(repo.path) : '',
      repo.target_id,
      repo.targetId,
    ].filter(Boolean).flatMap(endpointAliases);
    if (candidates.some((candidate) => aliases.has(candidate))) {
      matchedRepoIds.add(repo.id);
      labels.add(repo.name || repo.id);
    }
  });

  components.forEach((component) => {
    const targetId = component.target_id || component.targetId || component.id || '';
    const repoId = component.repo_id || component.repoId || '';
    const candidates = [
      targetId,
      repoId,
      component.id,
      component.label,
    ].filter(Boolean).flatMap(endpointAliases);
    if (candidates.some((candidate) => aliases.has(candidate))) {
      if (repoId) matchedRepoIds.add(repoId);
      if (targetId) matchedTargetIds.add(targetId);
      labels.add(component.label || targetId || repoId);
    }
  });

  return {
    input: String(input || '').trim(),
    repo_ids: [...matchedRepoIds],
    target_ids: [...matchedTargetIds],
    labels: [...labels],
    found: matchedRepoIds.size > 0 || matchedTargetIds.size > 0,
  };
}

function relationshipEndpointSets(row) {
  return {
    fromRepo: new Set([row.from_repo, ...(row.from_repos || [])].filter(Boolean)),
    toRepo: new Set([row.to_repo, ...(row.to_repos || [])].filter(Boolean)),
    memberRepos: new Set([row.from_repo, row.to_repo, ...(row.repos || [])].filter(Boolean)),
    fromTarget: new Set([row.from_target, row.fromTarget].filter(Boolean)),
    toTarget: new Set([row.to_target, row.toTarget].filter(Boolean)),
    memberTargets: new Set([row.from_target, row.fromTarget, row.to_target, row.toTarget, ...(row.target_ids || [])].filter(Boolean)),
  };
}

function setIntersects(set, values) {
  return values.some((value) => set.has(value));
}

function relationshipMatchesDirection(row, from, to) {
  const sets = relationshipEndpointSets(row);
  const fromRepos = from.repo_ids || [];
  const toRepos = to.repo_ids || [];
  const fromTargets = from.target_ids || [];
  const toTargets = to.target_ids || [];

  const directedRepo =
    setIntersects(sets.fromRepo, fromRepos) &&
    setIntersects(sets.toRepo, toRepos);
  const directedTarget =
    setIntersects(sets.fromTarget, fromTargets) &&
    setIntersects(sets.toTarget, toTargets);
  const hubRepo =
    !sets.fromRepo.size &&
    !sets.toRepo.size &&
    setIntersects(sets.memberRepos, fromRepos) &&
    setIntersects(sets.memberRepos, toRepos);
  const hubTarget =
    !sets.fromTarget.size &&
    !sets.toTarget.size &&
    setIntersects(sets.memberTargets, fromTargets) &&
    setIntersects(sets.memberTargets, toTargets);

  return directedRepo || directedTarget || hubRepo || hubTarget;
}

function relationshipMatchesReverse(row, from, to) {
  const sets = relationshipEndpointSets(row);
  return (
    (setIntersects(sets.fromRepo, to.repo_ids || []) && setIntersects(sets.toRepo, from.repo_ids || [])) ||
    (setIntersects(sets.fromTarget, to.target_ids || []) && setIntersects(sets.toTarget, from.target_ids || []))
  );
}

function relationshipKind(row) {
  return compactString(row.type || row.kind || row.relationship_type || '');
}

function relationshipText(row) {
  return compactString([
    row.summary,
    row.label,
    row.reason,
    row.producer,
    row.producer_ref,
    JSON.stringify(row.detail || {}),
  ].join(' '));
}

function isContradictoryRelationship(row) {
  const state = compactString(row.evidence_state || row.status || row.verdict || row.result);
  const type = relationshipKind(row);
  const summary = relationshipText(row);
  return (
    ['contradicted', 'negative', 'not-supported', 'not_supported', 'false'].includes(state) ||
    type.startsWith('not-') ||
    type.startsWith('no-') ||
    summary.includes('contradict')
  );
}

function claimRelationshipRecord(bundlePath, artifact, row, claimKind, from, to, relation = 'supporting') {
  const id = row.id || row.edge_id || `${artifact}:${hashText(JSON.stringify(row)).slice(0, 12)}`;
  const fromTarget = row.from_target || row.fromTarget || from.target_ids[0] || '';
  const toTarget = row.to_target || row.toTarget || to.target_ids[0] || '';
  const fromRepo = row.from_repo || from.repo_ids[0] || '';
  const toRepo = row.to_repo || to.repo_ids[0] || '';
  return {
    id,
    reference: makeRef(bundlePath, artifact, id),
    bundle_path: path.resolve(bundlePath),
    artifact,
    record_id: id,
    kind: 'claim-check-evidence',
    relationship_type: row.type || row.kind || '',
    evidence_state: row.evidence_state || row.state || 'metadata-visible',
    status: row.status || 'observed',
    summary: row.summary || row.label || id,
    relation,
    from_repo: fromRepo || null,
    to_repo: toRepo || null,
    routes: {
      graph: appHashRoute('graph', { component: fromTarget || toTarget || undefined }),
      from_atlas: fromTarget ? appHashRoute('atlas', { component: fromTarget }) : undefined,
      to_atlas: toTarget ? appHashRoute('atlas', { component: toTarget }) : undefined,
      api: apiRoute('claim-check', {
        from: from.input,
        to: to.input,
        kind: claimKind || undefined,
        limit: 5,
      }),
    },
    detail: row.detail || {},
    producer: row.producer || row.source || '',
    producer_ref: row.producer_ref || row.evidence_ref || '',
  };
}

function loadRelationshipEvidenceRows(bundlePath) {
  const rows = [];
  const relPath = path.join(bundlePath, 'relationships.jsonl');
  if (fs.existsSync(relPath)) {
    readJSONL(relPath).forEach((row) => rows.push({ artifact: 'relationships.jsonl', row }));
  }
  const facts = readJSON(path.join(bundlePath, 'atlas-facts.json'));
  if (Array.isArray(facts?.edges)) {
    facts.edges.forEach((row) => rows.push({ artifact: 'atlas-facts.json', row }));
  }
  return rows;
}

function relationshipGapRecords(bundlePath, fromInput, toInput, limit) {
  const gaps = queryGaps(bundlePath, { limit: Math.min(limit, 20) });
  const needle = compactString(`${fromInput} ${toInput} relationships relationship atlas edge dependency`);
  const tokens = needle.split(/\s+/).filter(Boolean);
  return (gaps.records || []).filter((record) => {
    const hay = compactString([
      record.surface,
      record.status,
      record.summary,
      record.reason,
      record.recipe,
    ].join(' '));
    return hay.includes('relationship') || hay.includes('atlas') || tokens.some((token) => token.length > 3 && hay.includes(token));
  });
}

function queryClaimCheck(bundlePath, opts = {}) {
  const limit = parseLimit(opts.limit, 10);
  const fromInput = String(opts.from || opts.fromRepo || opts.fromComponent || '').trim();
  const toInput = String(opts.to || opts.toRepo || opts.toComponent || '').trim();
  const claimKind = compactString(opts.kind || opts.type || opts.relationship || '');
  const claimText = compactString(opts.text || opts.q || '');
  const warnings = [];

  if (!fromInput || !toInput) {
    return wrapResult(
      { family: 'claim-check', from: fromInput || undefined, to: toInput || undefined, kind: claimKind || undefined, limit, bundle_path: path.resolve(bundlePath) },
      [],
      0,
      limit,
      ['--from and --to are required for claim-check']
    );
  }

  const from = resolveClaimEndpoint(bundlePath, fromInput);
  const to = resolveClaimEndpoint(bundlePath, toInput);
  if (!from.found) warnings.push(`from endpoint not found in repos/atlas components: ${fromInput}`);
  if (!to.found) warnings.push(`to endpoint not found in repos/atlas components: ${toInput}`);

  const evidenceRows = loadRelationshipEvidenceRows(bundlePath);
  const relationshipArtifactExists = fs.existsSync(path.join(bundlePath, 'relationships.jsonl'));
  const atlasExists = fs.existsSync(path.join(bundlePath, 'atlas-facts.json'));
  if (!relationshipArtifactExists) warnings.push('relationships.jsonl missing; cross-repo relationship evidence not assessed');
  if (!atlasExists) warnings.push('atlas-facts.json missing; atlas edge evidence not assessed');

  const matchesKindAndText = ({ row }) => {
    const kind = relationshipKind(row);
    const text = relationshipText(row);
    if (claimKind && kind !== claimKind) return false;
    if (claimText && !text.includes(claimText)) return false;
    return true;
  };
  const scoped = evidenceRows.filter(matchesKindAndText);
  const directRows = scoped.filter(({ row }) => relationshipMatchesDirection(row, from, to));
  const reverseRows = scoped.filter(({ row }) => relationshipMatchesReverse(row, from, to));
  const contradictingRows = directRows.filter(({ row }) => isContradictoryRelationship(row));
  const supportingRows = directRows.filter(({ row }) => !isContradictoryRelationship(row));
  const gapRecords = relationshipGapRecords(bundlePath, fromInput, toInput, limit);

  let verdict = 'cannot_verify';
  let evidenceState = 'cannot_verify';
  let status = 'cannot_verify';
  let summary = `No matching local relationship evidence for ${fromInput} -> ${toInput}`;

  if (contradictingRows.length > 0) {
    verdict = 'contradicted';
    evidenceState = contradictingRows[0].row.evidence_state || 'metadata-visible';
    status = 'contradicted';
    summary = `Local evidence contradicts ${fromInput} -> ${toInput}`;
  } else if (supportingRows.length > 0) {
    verdict = 'supported';
    evidenceState = supportingRows[0].row.evidence_state || 'metadata-visible';
    status = 'supported';
    summary = `Local evidence supports ${fromInput} -> ${toInput}`;
  } else if (!relationshipArtifactExists && !atlasExists) {
    verdict = 'not_assessed';
    evidenceState = 'not_assessed';
    status = 'not_assessed';
    summary = 'Relationship and atlas edge evidence are not assessed in this bundle';
  } else if (!from.found || !to.found) {
    verdict = 'cannot_verify';
    evidenceState = 'cannot_verify';
    status = 'cannot_verify';
    summary = 'One or both claim endpoints are absent from indexed repos/components';
  }

  const boundedEvidence = [
    ...contradictingRows.map(({ artifact, row }) => claimRelationshipRecord(bundlePath, artifact, row, claimKind, from, to, 'contradicting')),
    ...supportingRows.map(({ artifact, row }) => claimRelationshipRecord(bundlePath, artifact, row, claimKind, from, to, 'supporting')),
    ...reverseRows.map(({ artifact, row }) => claimRelationshipRecord(bundlePath, artifact, row, claimKind, from, to, 'reverse-context')),
    ...gapRecords.map((record) => ({ ...record, relation: 'gap-context' })),
  ].slice(0, limit);

  const recordId = `${fromInput}->${toInput}:${claimKind || 'relationship'}:${claimText || ''}`;
  const records = [
    {
      id: `claim-check:${hashText(recordId).slice(0, 16)}`,
      reference: makeRef(bundlePath, 'claim-check', recordId),
      bundle_path: path.resolve(bundlePath),
      artifact: 'claim-check',
      record_id: recordId,
      kind: 'relationship-claim-check',
      evidence_state: evidenceState,
      status,
      verdict,
      summary,
      claim: {
        from: fromInput,
        to: toInput,
        kind: claimKind || '',
        text: opts.text || opts.q || '',
      },
      resolved: {
        from,
        to,
      },
      routes: {
        graph: appHashRoute('graph', { component: from.target_ids[0] || to.target_ids[0] || undefined }),
        from_atlas: from.target_ids[0] ? appHashRoute('atlas', { component: from.target_ids[0] }) : undefined,
        to_atlas: to.target_ids[0] ? appHashRoute('atlas', { component: to.target_ids[0] }) : undefined,
        api: apiRoute('claim-check', { from: fromInput, to: toInput, kind: claimKind || undefined, text: opts.text || opts.q || undefined, limit }),
      },
      bounded_records: {
        evidence: boundedEvidence,
        supporting: supportingRows.slice(0, limit).map(({ artifact, row }) => claimRelationshipRecord(bundlePath, artifact, row, claimKind, from, to, 'supporting')),
        contradicting: contradictingRows.slice(0, limit).map(({ artifact, row }) => claimRelationshipRecord(bundlePath, artifact, row, claimKind, from, to, 'contradicting')),
        reverse_context: reverseRows.slice(0, limit).map(({ artifact, row }) => claimRelationshipRecord(bundlePath, artifact, row, claimKind, from, to, 'reverse-context')),
        gaps: gapRecords.slice(0, limit),
      },
      follow_up_queries: [
        { family: 'relationships', route: apiRoute('relationships', { type: claimKind || undefined, repo: from.repo_ids[0] || undefined, limit }) },
        { family: 'atlas', route: apiRoute('atlas', { section: 'edges', target: from.target_ids[0] || undefined, limit }) },
        { family: 'gaps', route: apiRoute('gaps', { surface: 'relationships', limit }) },
      ],
      resolution_limit:
        'Claim-check compares the claim only against bounded relationship, atlas edge, and gap records. Missing evidence is cannot_verify/not_assessed, not proof of absence.',
    },
  ];

  return wrapResult(
    {
      family: 'claim-check',
      from: fromInput,
      to: toInput,
      kind: claimKind || undefined,
      text: opts.text || opts.q || undefined,
      limit,
      bundle_path: path.resolve(bundlePath),
    },
    records,
    records.length,
    1,
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

function nestedWarnings(label, result) {
  return (result.warnings || []).map((warning) => `${label}: ${warning}`);
}

function queryOverview(bundlePath, opts = {}) {
  const limit = parseLimit(opts.limit, 8);
  const manifest = readJSON(path.join(bundlePath, 'manifest.json'));
  const atlasFacts = readJSON(path.join(bundlePath, 'atlas-facts.json'));
  const card = readJSON(path.join(bundlePath, 'landscape-card.json'));
  const report = readJSON(path.join(bundlePath, 'landscape-report.json'));
  const warnings = [];

  const repos = queryRepos(bundlePath, { limit });
  const relationships = queryRelationships(bundlePath, { limit });
  const hotspots = queryHotspots(bundlePath, { limit });
  const gaps = queryGaps(bundlePath, { limit });
  const atlasComponents = queryAtlas(bundlePath, { section: 'components', limit });

  warnings.push(
    ...nestedWarnings('repos', repos),
    ...nestedWarnings('relationships', relationships),
    ...nestedWarnings('hotspots', hotspots),
    ...nestedWarnings('gaps', gaps),
    ...nestedWarnings('atlas', atlasComponents)
  );
  if (!manifest) warnings.push('manifest.json missing');
  if (!atlasFacts) warnings.push('atlas-facts.json missing; atlas coverage unavailable');
  const coreOverviewMissing = !manifest || !atlasFacts;

  const coverage = atlasFacts?.coverage || {};
  const counts = {
    repos: coverage.repo_count ?? repos.total_records,
    components: coverage.component_count ?? atlasComponents.total_records,
    relationships: coverage.relationship_count ?? relationships.total_records,
    relationship_edges: coverage.relationship_edges ?? coverage.edge_count,
    hotspots: coverage.hotspot_count ?? hotspots.total_records,
    gaps: gaps.total_records,
    degraded_health_records: Math.max(0, gaps.total_records - (manifest?.gaps_total ?? manifest?.gap_count ?? 0)),
    runtime_topology: coverage.runtime_topology || 'unknown',
  };
  const summaryParts = [
    `${counts.repos ?? 0} repos`,
    `${counts.relationships ?? 0} relationships`,
    `${counts.hotspots ?? 0} hotspots`,
    `${counts.gaps ?? 0} gaps`,
  ];

  const records = [
    {
      id: 'captain-overview',
      reference: makeRef(bundlePath, 'manifest.json', 'captain-overview'),
      bundle_path: path.resolve(bundlePath),
      artifact: 'manifest.json',
      record_id: 'captain-overview',
      kind: 'captain-overview',
      evidence_state: coreOverviewMissing ? 'not_assessed' : 'metadata-visible',
      status: coreOverviewMissing ? 'not_assessed' : 'observed',
      summary: summaryParts.join(', '),
      identity: {
        target_root: manifest?.target_root || atlasFacts?.target_root || '',
        generated_at: atlasFacts?.generated_at || card?.generated_at || manifest?.generated_at || '',
        name: card?.identity?.name || report?.title || '',
      },
      counts,
      coverage,
      routes: {
        atlas: appHashRoute('atlas'),
        risks: appHashRoute('risks'),
        sources: appHashRoute('sources'),
        agent: appHashRoute('agent'),
        graph: appHashRoute('graph'),
        api: apiRoute('overview', { limit }),
      },
      bounded_records: {
        repos: repos.records,
        components: atlasComponents.records,
        relationships: relationships.records,
        risks: hotspots.records,
        gaps: gaps.records,
      },
      follow_up_queries: [
        { family: 'repos', route: apiRoute('repos', { limit }) },
        { family: 'relationships', route: apiRoute('relationships', { limit }) },
        { family: 'hotspots', route: apiRoute('hotspots', { limit, full: true }) },
        { family: 'gaps', route: apiRoute('gaps', { limit }) },
        { family: 'promotion-health', route: apiRoute('promotion-health', { limit }) },
        { family: 'atlas', route: apiRoute('atlas', { section: 'components', limit }) },
      ],
      answer_contract: {
        cite_records: true,
        separate_unknowns: true,
        no_prebuilt_answer: true,
        evidence_states: ['source-visible', 'metadata-visible', 'runtime-visible', 'not_assessed', 'unknown', 'cannot_verify'],
      },
    },
  ];

  return wrapResult(
    {
      family: 'overview',
      limit,
      bundle_path: path.resolve(bundlePath),
    },
    records,
    records.length,
    1,
    warnings
  );
}

function firstRecord(result) {
  return (result.records || [])[0] || null;
}

function querySelectedCode(bundlePath, opts = {}) {
  const limit = parseLimit(opts.limit, 8);
  const radius = parseInt(opts.radius, 10) || 20;
  const symbolName = (opts.symbol || opts.name || opts.q || '').trim();
  let selectedPath = (opts.path || '').trim();
  let selectedLine = opts.line || 1;
  let selection = resolveSelectionRepo(bundlePath, selectedPath, opts.repo || '');
  const warnings = [...selection.warnings];

  let symbolLookup = null;
  if (symbolName) {
    symbolLookup = querySymbol(bundlePath, {
      name: symbolName,
      repo: selection.repoId || opts.repo,
      limit,
    });
    warnings.push(...nestedWarnings('symbol', symbolLookup));
  }

  if (!selectedPath && symbolLookup && symbolLookup.records.length > 0) {
    const first = symbolLookup.records[0];
    selectedPath = first.path || '';
    selectedLine = opts.line || first.line || 1;
    const symbolRepo = first.repo_id && !resolveRepoFilterIds(bundlePath, first.repo_id).unknown
      ? first.repo_id
      : (opts.repo || '');
    selection = resolveSelectionRepo(bundlePath, selectedPath, symbolRepo);
    warnings.push(...selection.warnings);
  }

  const repoId = selection.repoId || (opts.repo || '').trim();
  const pathForQueries = selection.repoRelativePath || selectedPath;
  const targetByRepo = loadTargetByRepo(bundlePath);
  let source = null;
  let symbols = symbolLookup;
  let search = null;
  let repo = null;
  let component = null;
  let hotspots = null;
  let relationships = null;
  let gaps = null;

  if (!selectedPath && !symbolName) {
    warnings.push('--path or --symbol is required for selected-code lookup');
  }

  if (pathForQueries) {
    source = querySource(bundlePath, {
      path: pathForQueries,
      repo: repoId || undefined,
      line: selectedLine,
      radius,
    });
    warnings.push(...nestedWarnings('source', source));
  }

  if (symbolName || pathForQueries) {
    symbols = querySymbol(bundlePath, {
      name: symbolName || undefined,
      path: pathForQueries || undefined,
      repo: repoId || undefined,
      limit,
    });
    if (symbols.records.length === 0 && repoId) {
      const fallbackSymbols = querySymbol(bundlePath, {
        name: symbolName || undefined,
        path: pathForQueries || undefined,
        limit,
      });
      if (fallbackSymbols.records.length > 0) {
        warnings.push('symbol: scoped lookup returned no records; using unscoped path/name fallback');
        symbols = fallbackSymbols;
      }
    }
    warnings.push(...nestedWarnings('symbol', symbols));
  }

  const searchTerm = symbolName || pathForQueries;
  if (searchTerm) {
    search = querySearch(bundlePath, {
      q: searchTerm,
      pathScope: pathForQueries && symbolName ? pathForQueries : undefined,
      repo: repoId || undefined,
      limit,
    });
    warnings.push(...nestedWarnings('search', search));
  }

  if (repoId) {
    repo = queryRepos(bundlePath, { repo: repoId, limit: 1 });
    component = queryAtlas(bundlePath, { section: 'components', repo: repoId, limit: 1 });
    hotspots = queryHotspots(bundlePath, { repo: repoId, path: pathForQueries || undefined, limit });
    relationships = queryRelationships(bundlePath, { repo: repoId, limit });
    warnings.push(
      ...nestedWarnings('repos', repo),
      ...nestedWarnings('atlas', component),
      ...nestedWarnings('hotspots', hotspots),
      ...nestedWarnings('relationships', relationships)
    );
  } else if (pathForQueries) {
    hotspots = queryHotspots(bundlePath, { path: pathForQueries, limit });
    warnings.push(...nestedWarnings('hotspots', hotspots));
  }

  gaps = queryGaps(bundlePath, { limit: Math.min(limit, 8) });
  warnings.push(...nestedWarnings('gaps', gaps));

  const componentRecord = firstRecord(component || { records: [] });
  const targetId = componentRecord?.target_id || targetByRepo.get(repoId) || repoId || '';
  const sourceRecord = firstRecord(source || { records: [] });
  const selectedSourceRoute = pathForQueries
    ? sourceRoute(repoId, pathForQueries, selectedLine)
    : (sourceRecord?.routes?.source || '');
  const recordId = `${repoId || 'unknown'}:${pathForQueries || symbolName || 'selection'}:${selectedLine || 1}`;

  const records = [
    {
      id: `selected-code:${hashText(recordId).slice(0, 16)}`,
      reference: makeRef(bundlePath, 'selected-code', recordId),
      bundle_path: path.resolve(bundlePath),
      artifact: 'selected-code',
      record_id: recordId,
      kind: 'selected-code-context',
      evidence_state: sourceRecord ? 'source-visible' : 'metadata-visible',
      status: sourceRecord || firstRecord(symbols || { records: [] }) ? 'observed' : 'not_assessed',
      summary: [
        repoId ? `repo ${repoId}` : 'repo unknown',
        pathForQueries ? `path ${pathForQueries}` : '',
        symbolName ? `symbol ${symbolName}` : '',
      ].filter(Boolean).join(', '),
      selection: {
        input_path: opts.path || '',
        path: pathForQueries || '',
        line: Number(selectedLine) || 1,
        symbol: symbolName || '',
        repo_id: repoId || '',
        target_id: targetId || '',
      },
      routes: {
        ...componentRoutes(targetId),
        source: selectedSourceRoute || undefined,
        api: apiRoute('selected-code', {
          repo: repoId || undefined,
          path: pathForQueries || undefined,
          symbol: symbolName || undefined,
          line: selectedLine || undefined,
          limit,
        }),
      },
      bounded_records: {
        repo: repo ? repo.records : [],
        component: component ? component.records : [],
        source: source ? source.records : [],
        symbols: symbols ? symbols.records : [],
        search_hits: search ? search.records : [],
        risks: hotspots ? hotspots.records : [],
        relationships: relationships ? relationships.records : [],
        gaps: gaps ? gaps.records : [],
      },
      follow_up_queries: [
        pathForQueries ? { family: 'source', route: apiRoute('source', { repo: repoId || undefined, path: pathForQueries, line: selectedLine, radius }) } : null,
        symbolName || pathForQueries ? { family: 'symbol', route: apiRoute('symbol', { repo: repoId || undefined, name: symbolName || undefined, path: pathForQueries || undefined, limit }) } : null,
        searchTerm ? { family: 'search', route: apiRoute('search', { repo: repoId || undefined, q: searchTerm, path: symbolName && pathForQueries ? pathForQueries : undefined, limit }) } : null,
        repoId ? { family: 'hotspots', route: apiRoute('hotspots', { repo: repoId, path: pathForQueries || undefined, limit, full: true }) } : null,
        repoId ? { family: 'relationships', route: apiRoute('relationships', { repo: repoId, limit }) } : null,
        repoId ? { family: 'atlas', route: apiRoute('atlas', { section: 'components', repo: repoId, limit: 1 }) } : null,
      ].filter(Boolean),
      resolution_limit:
        'Selected-code lookup joins bounded source/search/symbol/atlas records. It is not a semantic call graph unless imported evidence says so.',
    },
  ];

  return wrapResult(
    {
      family: 'selected-code',
      path: opts.path || undefined,
      symbol: symbolName || undefined,
      repo: opts.repo || undefined,
      line: Number(selectedLine) || 1,
      radius,
      limit,
      bundle_path: path.resolve(bundlePath),
    },
    records,
    records.length,
    1,
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
    path: row.path || '',
    source_root: row.source_root || '',
    total_file_count: row.total_file_count,
    retained_file_refs: row.retained_file_refs,
    truncated: row.truncated,
    expansion_mode: row.expansion_mode || '',
    promotion_basis: row.promotion_basis || '',
    resolution_limit: row.resolution_limit || '',
    source_refs: row.source_refs || row.evidence_refs || [],
    producer: row.producer || '',
    producer_ref: row.producer_ref || '',
    payload: row,
  };
}

function summaryCountForStratum(bundlePath, artifact) {
  const summary = readJSON(path.join(bundlePath, 'promotion-summary.json')) || {};
  const fieldByArtifact = {
    'promoted-facts.jsonl': 'promoted_fact_count',
    'raw-artifacts.jsonl': 'raw_artifact_count',
    'classified-sources.jsonl': 'classified_source_count',
  };
  const field = fieldByArtifact[artifact];
  const value = field ? Number(summary[field]) : Number.NaN;
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function summaryFieldForArtifact(artifact) {
  return {
    'promotion-health.jsonl': 'health_record_count',
    'promoted-facts.jsonl': 'promoted_fact_count',
    'raw-artifacts.jsonl': 'raw_artifact_count',
    'classified-sources.jsonl': 'classified_source_count',
  }[artifact] || '';
}

function normalizeStratumFilterValue(value) {
  return String(value || '').trim().toLowerCase();
}

function stratumQueryKey(filters) {
  return ['family', 'status', 'stratum']
    .filter((field) => filters[field])
    .map((field) => `${field}=${normalizeStratumFilterValue(filters[field])}`)
    .join('&');
}

function indexedStratumRows(bundlePath, artifact, filters) {
  const queryKey = stratumQueryKey(filters);
  if (!queryKey) return null;
  const index = readJSON(path.join(bundlePath, 'promotion-query-index.json'));
  const artifactIndex = index?.artifacts?.[artifact];
  if (!artifactIndex || typeof artifactIndex !== 'object') return null;
  const stats = artifactIndex.artifact_stats || {};
  const expectedRows = Number(stats.row_count);
  const expectedSize = Number(stats.size_bytes);
  const summary = readJSON(path.join(bundlePath, 'promotion-summary.json')) || {};
  const summaryField = summaryFieldForArtifact(artifact);
  const summaryRows = Number(summaryField ? summary[summaryField] : Number.NaN);
  if (!Number.isFinite(expectedRows) || !Number.isFinite(summaryRows) || expectedRows !== summaryRows) return null;
  try {
    const current = fs.statSync(path.join(bundlePath, artifact));
    if (Number.isFinite(expectedSize) && expectedSize >= 0 && current.size !== expectedSize) return null;
  } catch {
    return null;
  }
  const query = artifactIndex.queries?.[queryKey] || { total: 0, records: [] };
  const total = Number(query.total);
  return {
    total: Number.isFinite(total) && total >= 0 ? total : 0,
    records: Array.isArray(query.records) ? query.records : [],
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
  const matches = (row) => {
    if (family && (row.family || '').toLowerCase() !== family) return false;
    if (status && (row.status || '').toLowerCase() !== status) return false;
    if (stratum && (row.stratum || '').toLowerCase() !== stratum) return false;
    return true;
  };
  const records = [];
  let total = 0;
  let stoppedAtLimit = false;
  const hasFilter = Boolean(family || status || stratum);
  const exactSummaryTotal = hasFilter ? null : summaryCountForStratum(bundlePath, config.artifact);
  const indexed = hasFilter ? indexedStratumRows(bundlePath, config.artifact, { family, status, stratum }) : null;
  if (indexed) {
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
      indexed.records.map((row) => stratumRecord(bundlePath, config.artifact, row)),
      indexed.total,
      limit,
      [],
      { totalRecordsRelation: 'exact' }
    );
  }
  if (config.json) {
    let rows = readJSON(filePath)?.records || readJSON(filePath)?.families || [];
    if (!Array.isArray(rows)) rows = [];
    for (const row of rows) {
      if (!matches(row)) continue;
      total += 1;
      if (records.length < limit) records.push(stratumRecord(bundlePath, config.artifact, row));
    }
  } else {
    scanJSONL(filePath, (row) => {
      if (!matches(row)) return;
      total += 1;
      if (records.length >= limit) {
        stoppedAtLimit = true;
        return false;
      }
      records.push(stratumRecord(bundlePath, config.artifact, row));
      if (records.length >= limit) {
        stoppedAtLimit = true;
        return false;
      }
    });
  }
  if (stoppedAtLimit && exactSummaryTotal === null) {
    warnings.push(`${config.artifact} query stopped after the requested limit; total_records is a lower bound for matching rows`);
  }
  const totalRecords = exactSummaryTotal === null ? total : exactSummaryTotal;
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
    records,
    totalRecords,
    limit,
    warnings,
    {
      totalRecordsRelation: exactSummaryTotal === null && stoppedAtLimit ? 'lower_bound' : 'exact',
      truncated: stoppedAtLimit || undefined,
    }
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
    case 'overview':
      return queryOverview(resolved, opts);
    case 'search':
      return querySearch(resolved, opts);
    case 'symbol':
      return querySymbol(resolved, opts);
    case 'source':
      return querySource(resolved, opts);
    case 'selected-code':
      return querySelectedCode(resolved, opts);
    case 'claim-check':
      return queryClaimCheck(resolved, opts);
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
  if (p === '/api/overview') {
    return dispatch(bundlePath, 'overview', { limit: searchParams.get('limit') });
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
      path: searchParams.get('path'),
      kind: searchParams.get('kind'),
      repo: searchParams.get('repo'),
      limit: searchParams.get('limit'),
    });
  }
  if (p === '/api/selected-code') {
    return dispatch(bundlePath, 'selected-code', {
      path: searchParams.get('path'),
      symbol: searchParams.get('symbol') || searchParams.get('name') || searchParams.get('q'),
      repo: searchParams.get('repo'),
      line: searchParams.get('line'),
      radius: searchParams.get('radius'),
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
  if (p === '/api/claim-check') {
    return dispatch(bundlePath, 'claim-check', {
      from: searchParams.get('from'),
      to: searchParams.get('to'),
      kind: searchParams.get('kind') || searchParams.get('type') || searchParams.get('relationship'),
      text: searchParams.get('text') || searchParams.get('q'),
      limit: searchParams.get('limit'),
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
      stratum: searchParams.get('stratum'),
      limit: searchParams.get('limit'),
    });
  }
  if (p === '/api/promoted-facts') {
    return dispatch(bundlePath, 'promoted-facts', {
      family: searchParams.get('family'),
      status: searchParams.get('status'),
      stratum: searchParams.get('stratum'),
      limit: searchParams.get('limit'),
    });
  }
  if (p === '/api/raw-artifacts') {
    return dispatch(bundlePath, 'raw-artifacts', {
      family: searchParams.get('family'),
      status: searchParams.get('status'),
      stratum: searchParams.get('stratum'),
      limit: searchParams.get('limit'),
    });
  }
  if (p === '/api/classified-sources') {
    return dispatch(bundlePath, 'classified-sources', {
      family: searchParams.get('family'),
      status: searchParams.get('status'),
      stratum: searchParams.get('stratum'),
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
  queryOverview,
  querySearch,
  querySymbol,
  querySource,
  querySelectedCode,
  queryClaimCheck,
  queryAtlas,
  queryEvidenceIndex,
  queryClaims,
  queryRepos,
  queryRelationships,
};
