/**
 * Read-only query surface over a Portolan harness bundle (spec 095).
 * Shared by serve.js HTTP /api/* and portolan-bundle-query CLI.
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_VERSION = '0.1.0';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

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

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function loadRepoRoots(bundlePath) {
  const repos = readJSON(path.join(bundlePath, 'repos.json'));
  if (!Array.isArray(repos)) return [];
  return repos
    .filter((r) => r && typeof r.path === 'string' && r.path.trim())
    .map((r) => path.resolve(r.path));
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

function readSourceSnippet(filePath, lineNum, radius = 20) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const total = lines.length;
  const center = Math.min(Math.max(parseInt(lineNum, 10) || 1, 1), total || 1);
  const start = Math.max(1, center - radius);
  const end = Math.min(total, center + radius);
  const snippet = [];
  for (let i = start; i <= end; i++) {
    snippet.push({
      no: i,
      text: lines[i - 1] ?? '',
      highlight: i === center,
    });
  }
  return {
    path: filePath,
    line: center,
    startLine: start,
    endLine: end,
    totalLines: total,
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

function hotspotRecord(bundlePath, h) {
  return {
    id: h.id,
    reference: makeRef(bundlePath, 'hotspots.jsonl', h.id),
    bundle_path: path.resolve(bundlePath),
    artifact: 'hotspots.jsonl',
    record_id: h.id,
    kind: h.kind,
    evidence_state: h.evidence_state,
    status: h.status || '',
    reason: h.reason || '',
    evidence_source: h.producer_ref || h.producer || '',
    summary: h.summary || '',
    severity: h.severity || '',
    rank: h.rank,
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

  let matched = rows.filter((h) => {
    if (kind && h.kind !== kind) return false;
    if (severity && h.severity !== severity) return false;
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
  const records = matched.map((h) => hotspotRecord(bundlePath, h));
  return wrapResult(
    {
      family: 'hotspots',
      kind: kind || undefined,
      severity: severity || undefined,
      path: pathPrefix || undefined,
      text: text || undefined,
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
  let matched = rows.filter((row) => {
    const p = (row.path || '').toLowerCase();
    const lineText = (row.text || '').toLowerCase();
    if (pathScope && !p.includes(pathScope)) return false;
    return p.includes(q) || lineText.includes(q);
  });

  const records = matched.slice(0, limit).map((row, i) => ({
    id: `search-${i}-${row.path}:${row.line}`,
    reference: makeRef(bundlePath, 'search-index.jsonl', `${row.path}:${row.line}`),
    bundle_path: path.resolve(bundlePath),
    artifact: 'search-index.jsonl',
    record_id: `${row.path}:${row.line}`,
    kind: 'search-hit',
    evidence_state: 'source-visible',
    status: 'observed',
    summary: row.text || '',
    path: row.path,
    line: row.line,
    hotspot_id: row.hotspot_id || '',
  }));

  return wrapResult(
    {
      family: 'search',
      q,
      path_scope: pathScope || undefined,
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

  const rows = readJSONL(indexPath);
  let matched = rows.filter((row) => {
    const n = (row.name || '').toLowerCase();
    if (!n.includes(name)) return false;
    if (symKind && (row.kind || '').toLowerCase() !== symKind) return false;
    return true;
  });

  const records = matched.slice(0, limit).map((row) => ({
    id: `sym-${row.path}:${row.line}:${row.name}`,
    reference: makeRef(bundlePath, 'symbol-index.jsonl', `${row.path}:${row.line}:${row.name}`),
    bundle_path: path.resolve(bundlePath),
    artifact: 'symbol-index.jsonl',
    record_id: `${row.path}:${row.line}:${row.name}`,
    kind: 'symbol',
    evidence_state: row.evidence_state || 'metadata-visible',
    status: 'observed',
    summary: `${row.kind || 'symbol'} ${row.name} at ${row.path}:${row.line}`,
    name: row.name,
    symbol_kind: row.kind,
    path: row.path,
    line: row.line,
    producer: row.producer || 'ctags',
    resolution_limit: row.resolution_limit || 'definition-only; not a full call graph',
  }));

  return wrapResult(
    {
      family: 'symbol',
      name,
      kind: symKind || undefined,
      limit,
      bundle_path: path.resolve(bundlePath),
    },
    records,
    matched.length,
    limit,
    warnings
  );
}

function querySource(bundlePath, opts = {}) {
  const repoRoots = loadRepoRoots(bundlePath);
  const filePath = resolveSourcePath(opts.path || '', repoRoots);
  const warnings = [];

  if (!filePath) {
    return wrapResult(
      {
        family: 'source',
        path: opts.path || '',
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
  const body = readSourceSnippet(filePath, opts.line || 1, radius);
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
      line: body.line,
      radius,
      bundle_path: path.resolve(bundlePath),
    },
    records,
    1,
    1,
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

  const rows = readJSONL(claimsPath);
  const matched = rows.filter((c) => {
    if (tier && (c.claim_tier || '').toLowerCase() !== tier) return false;
    if (subject && !(c.subject || '').toLowerCase().includes(subject)) return false;
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
    case 'evidence-index':
      return queryEvidenceIndex(resolved, opts);
    case 'claims':
      return queryClaims(resolved, opts);
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
      limit: searchParams.get('limit'),
    });
  }
  if (p === '/api/symbol') {
    return dispatch(bundlePath, 'symbol', {
      name: searchParams.get('name') || searchParams.get('q'),
      kind: searchParams.get('kind'),
      limit: searchParams.get('limit'),
    });
  }
  if (p === '/api/source') {
    return dispatch(bundlePath, 'source', {
      path: searchParams.get('path'),
      line: searchParams.get('line'),
      radius: searchParams.get('radius'),
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
  queryEvidenceIndex,
  queryClaims,
};
