/**
 * Use-case: bounded query engine over a Portolan bundle.
 *
 * The 15 query families + dispatch facade + HTTP route table, with ALL
 * filesystem access routed through ports (BundleArtifactReader for artifacts,
 * SourceFilePort for target source files). This is the Clean-Architecture
 * extraction of the frozen viewer/scripts/bundle-query.js imperative engine;
 * behaviour is byte-faithful, including the streaming lower_bound semantics
 * (reader.iterateJsonl + caller `break`).
 *
 * `ctx` = { reader, sourceFile, bundlePath }. `bundlePath` is the absolute
 * bundle dir (reader.bundleDir); carried verbatim into record `bundle_path` /
 * `reference` fields.
 *
 * Use-case layer — depends on domain + ports (via ctx) + sibling use-case
 * (query-atlas, for the system-map family). Never imports fs directly.
 */
'use strict';

const path = require('path');
const { DEGRADED_HEALTH_STATUSES, parseLimit, wrapResult } = require('../domain/query-envelope');
const R = require('../domain/query-records');
const { queryAtlas } = require('./query-atlas');

// ---- bundle loaders (read via port; logic pure given data) ----

function loadRepos(reader) {
  const profiles = reader.readJson('repo-profiles.json');
  if (profiles && Array.isArray(profiles.repos)) return profiles.repos;
  const repos = reader.readJson('repos.json');
  return Array.isArray(repos) ? repos : [];
}

function loadAtlasComponents(reader) {
  const facts = reader.readJson('atlas-facts.json');
  return Array.isArray(facts && facts.components) ? facts.components : [];
}

function loadTargetByRepo(reader) {
  const byRepo = new Map();
  for (const component of loadAtlasComponents(reader)) {
    const repoId = component.repo_id || component.repoId || '';
    const targetId = component.target_id || component.targetId || component.id || '';
    if (repoId && targetId) byRepo.set(repoId, targetId);
  }
  return byRepo;
}

function resolveClaimEndpoint(reader, input) {
  const aliases = new Set(R.endpointAliases(input));
  const repos = loadRepos(reader);
  const components = loadAtlasComponents(reader);
  const matchedRepoIds = new Set();
  const matchedTargetIds = new Set();
  const labels = new Set();

  repos.forEach((repo) => {
    const candidates = [
      repo.id, repo.name,
      repo.path ? path.basename(repo.path) : '',
      repo.target_id, repo.targetId,
    ].filter(Boolean).flatMap(R.endpointAliases);
    if (candidates.some((candidate) => aliases.has(candidate))) {
      matchedRepoIds.add(repo.id);
      labels.add(repo.name || repo.id);
    }
  });

  components.forEach((component) => {
    const targetId = component.target_id || component.targetId || component.id || '';
    const repoId = component.repo_id || component.repoId || '';
    const candidates = [targetId, repoId, component.id, component.label]
      .filter(Boolean).flatMap(R.endpointAliases);
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

function repoPathPrefixes(reader, repoId) {
  const repos = reader.readJson('repos.json');
  if (!Array.isArray(repos)) return null;
  const repo = repos.find((r) => r && r.id === repoId);
  if (!repo || typeof repo.path !== 'string') return null;
  const prefixes = [repo.path.replace(/\\/g, '/')];
  const repoName = (repo.name || path.basename(repo.path)).replace(/\\/g, '/');
  if (repoName) prefixes.push(repoName);
  const manifest = reader.readJson('manifest.json');
  const targetRoot = ((manifest && manifest.target_root) || '').replace(/\\/g, '/');
  if (targetRoot && prefixes[0].startsWith(targetRoot + '/')) {
    prefixes.push(prefixes[0].slice(targetRoot.length + 1));
  }
  if (repos.length === 1) prefixes.push('');
  return [...new Set(prefixes)];
}

function loadRelationshipEvidenceRows(reader) {
  const rows = [];
  if (reader.exists('relationships.jsonl')) {
    for (const row of reader.readJsonl('relationships.jsonl')) rows.push({ artifact: 'relationships.jsonl', row });
  }
  const facts = reader.readJson('atlas-facts.json');
  if (Array.isArray(facts && facts.edges)) {
    for (const row of facts.edges) rows.push({ artifact: 'atlas-facts.json', row });
  }
  return rows;
}

function summaryCountForStratum(reader, artifact) {
  const summary = reader.readJson('promotion-summary.json') || {};
  const fieldByArtifact = {
    'promoted-facts.jsonl': 'promoted_fact_count',
    'raw-artifacts.jsonl': 'raw_artifact_count',
    'classified-sources.jsonl': 'classified_source_count',
  };
  const field = fieldByArtifact[artifact];
  const value = field ? Number(summary[field]) : Number.NaN;
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function indexedStratumRows(reader, artifact, filters) {
  const queryKey = R.stratumQueryKey(filters);
  if (!queryKey) return null;
  const index = reader.readJson('promotion-query-index.json');
  const artifactIndex = index && index.artifacts && index.artifacts[artifact];
  if (!artifactIndex || typeof artifactIndex !== 'object') return null;
  const stats = artifactIndex.artifact_stats || {};
  const expectedRows = Number(stats.row_count);
  const expectedSize = Number(stats.size_bytes);
  const summary = reader.readJson('promotion-summary.json') || {};
  const summaryField = R.summaryFieldForArtifact(artifact);
  const summaryRows = Number(summaryField ? summary[summaryField] : Number.NaN);
  if (!Number.isFinite(expectedRows) || !Number.isFinite(summaryRows) || expectedRows !== summaryRows) return null;
  const currentSize = reader.size(artifact);
  if (currentSize === null) return null;
  if (Number.isFinite(expectedSize) && expectedSize >= 0 && currentSize !== expectedSize) return null;
  const query = (artifactIndex.queries && artifactIndex.queries[queryKey]) || { total: 0, records: [] };
  const total = Number(query.total);
  return {
    total: Number.isFinite(total) && total >= 0 ? total : 0,
    records: Array.isArray(query.records) ? query.records : [],
  };
}

function resolveSelectionRepo(reader, sourceFile, requestPath = '', repoFilter = '') {
  const repos = loadRepos(reader);
  const manifest = reader.readJson('manifest.json');
  const targetRoot = (manifest && manifest.target_root) || '';
  const warnings = [];
  const filter = String(repoFilter || '').trim();
  const repoIds = filter ? sourceFile.resolveRepoFilterIds(filter) : { ids: [], unknown: false };
  let candidates = [];

  if (filter) {
    candidates = repos.filter((repo) => repoIds.ids.includes(repo.id));
    if (repoIds.unknown || candidates.length === 0) {
      warnings.push(`repo not found in bundle: ${filter}; selected-code lookup will not widen to all repos`);
      return { repo: null, repoId: filter, repoRelativePath: '', warnings };
    }
  } else if (requestPath) {
    candidates = repos
      .map((repo) => ({ repo, rel: R.relativePathForRepo(requestPath, repo, sourceFile.repoRootsFor(repo), targetRoot, false) }))
      .filter((candidate) => candidate.rel);
    if (candidates.length === 1) {
      return { repo: candidates[0].repo, repoId: candidates[0].repo.id, repoRelativePath: candidates[0].rel, warnings };
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
      repoRelativePath: requestPath ? R.relativePathForRepo(requestPath, repo, sourceFile.repoRootsFor(repo), targetRoot) : '',
      warnings,
    };
  }

  if (filter && candidates.length === 1) {
    const repo = candidates[0];
    return {
      repo,
      repoId: repo.id,
      repoRelativePath: requestPath ? R.relativePathForRepo(requestPath, repo, sourceFile.repoRootsFor(repo), targetRoot) : '',
      warnings,
    };
  }

  if (!requestPath && filter && candidates.length > 0) {
    return { repo: candidates[0], repoId: candidates[0].id, repoRelativePath: '', warnings };
  }

  if (requestPath) warnings.push('selected path could not be mapped to a repo; pass --repo or a repo-relative path');
  return { repo: null, repoId: filter || '', repoRelativePath: '', warnings };
}

// ---- query families ----

function queryHotspots(ctx, opts = {}) {
  const { reader, sourceFile, bundlePath } = ctx;
  const limit = parseLimit(opts.limit);
  const useFull = opts.full === true || opts.full === 'true';
  const manifest = reader.readJson('manifest.json') || {};
  let artifact = useFull ? 'hotspots-full.jsonl' : 'hotspots.jsonl';
  const warnings = [];
  if (useFull && !reader.exists(artifact)) {
    artifact = 'hotspots.jsonl';
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
  const repoFilter = sourceFile.resolveRepoFilterIds(repoId);
  let repoPrefixes = [];
  let repoUnknown = false;
  if (repoId) {
    repoPrefixes = repoFilter.ids.flatMap((id) => repoPathPrefixes(reader, id) || []);
    if (repoFilter.unknown) {
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
      } else if (!(h.paths || []).some((p) => R.pathInRepo(p, repoPrefixes))) {
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
  if (!repoUnknown && reader.exists(artifact)) {
    for (const h of reader.iterateJsonl(artifact)) {
      if (!matchHotspot(h)) continue;
      total += 1;
      if (records.length >= limit) { stoppedAtLimit = true; break; }
      records.push(R.hotspotRecord(bundlePath, h.rank ? h : { ...h, rank: records.length + 1 }, artifact));
      if (records.length >= limit) { stoppedAtLimit = true; break; }
    }
  }
  if (stoppedAtLimit) {
    warnings.push('hotspots query stopped after the requested limit; total_records is a lower bound for matching rows');
  }
  const totalRecords = !useFull && !hasFilter && Number.isFinite(Number(manifest.hotspots_total))
    ? Number(manifest.hotspots_total)
    : total;
  return wrapResult(
    { family: 'hotspots', kind: kind || undefined, severity: severity || undefined, path: pathPrefix || undefined, text: text || undefined, repo: repoId || undefined, limit, bundle_path: bundlePath, artifact },
    records, totalRecords, limit, warnings,
    { totalRecordsRelation: stoppedAtLimit ? 'lower_bound' : 'exact' }
  );
}

function queryGaps(ctx, opts = {}) {
  const { reader, bundlePath } = ctx;
  const limit = parseLimit(opts.limit);
  const surface = (opts.surface || '').trim().toLowerCase();
  const status = (opts.status || '').trim().toLowerCase();
  const manifest = reader.readJson('manifest.json') || {};
  const artifact = reader.exists('gaps-full.jsonl') ? 'gaps-full.jsonl' : 'gaps.jsonl';
  const rows = reader.readJsonl(artifact);
  const warnings = [];
  if (artifact === 'gaps.jsonl' && manifest.gaps_truncated) {
    warnings.push('gaps-full.jsonl missing while manifest says gaps are truncated');
  }
  const healthRows = reader.readJsonl('promotion-health.jsonl')
    .filter((row) => DEGRADED_HEALTH_STATUSES.has(row.status || ''))
    .map(R.promotionHealthAsGap);
  const atlasRows = ((reader.readJson('atlas-facts.json') || {}).gaps || [])
    .map((row) => ({ ...row, __artifact: 'atlas-facts.json' }));
  const seen = new Set();
  const allRows = [...rows, ...atlasRows, ...healthRows].filter((row) => {
    const key = row.id || `${row.surface || row.subject || ''}:${row.status || ''}:${row.summary || row.reason || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const matched = allRows.filter((g) => {
    if (surface && !(g.surface || '').toLowerCase().includes(surface)) return false;
    if (status && (g.status || '').toLowerCase() !== status) return false;
    return true;
  });

  const records = matched.map((g) => R.gapRecord(
    bundlePath, g,
    g.__artifact || (String(g.id || '').startsWith('gap-promotion-health-') ? 'promotion-health.jsonl' : artifact)
  ));
  return wrapResult(
    { family: 'gaps', surface: surface || undefined, status: status || undefined, limit, bundle_path: bundlePath, artifact, includes_promotion_health: true, includes_atlas_gaps: true },
    records, records.length, limit, warnings
  );
}

function queryLandscape(ctx, opts = {}) {
  const { reader, bundlePath } = ctx;
  const section = (opts.section || '').trim();
  const card = reader.readJson('landscape-card.json');
  const report = reader.readJson('landscape-report.json');
  const warnings = [];
  if (!card && !report) {
    return wrapResult(
      { family: 'landscape', section: section || 'all', bundle_path: bundlePath },
      [], 0, 1, ['landscape-card.json and landscape-report.json missing']
    );
  }
  const records = [];
  if (!section || section === 'card' || section === 'identity') {
    if (card) {
      records.push({
        id: 'landscape-card', reference: R.makeRef(bundlePath, 'landscape-card.json', 'card'),
        bundle_path: bundlePath, artifact: 'landscape-card.json', record_id: 'card',
        kind: 'landscape', evidence_state: 'metadata-visible', status: 'observed',
        summary: (card.identity && card.identity.name) || 'landscape card', section: 'card', payload: card,
      });
    }
  }
  if (!section || section === 'report' || section === 'sections') {
    if (report && report.sections) {
      for (const s of report.sections) {
        if (section && section !== 'report' && section !== 'sections' && s.id !== section) continue;
        records.push({
          id: `landscape-section-${s.id || s.title || records.length}`,
          reference: R.makeRef(bundlePath, 'landscape-report.json', s.id || s.title || 'section'),
          bundle_path: bundlePath, artifact: 'landscape-report.json',
          record_id: s.id || s.title || '', kind: 'landscape-section',
          evidence_state: 'metadata-visible', status: 'observed',
          summary: s.title || s.id || 'section', section: s.id || s.title, payload: s,
        });
      }
    }
  }
  return wrapResult(
    { family: 'landscape', section: section || 'all', limit: 1, bundle_path: bundlePath },
    records, records.length, Math.max(records.length, 1), warnings
  );
}

function querySearch(ctx, opts = {}) {
  const { reader, bundlePath } = ctx;
  const limit = parseLimit(opts.limit);
  const q = (opts.q || opts.text || '').trim().toLowerCase();
  const pathScope = (opts.pathScope || opts.path || '').trim().toLowerCase();
  const repoId = (opts.repo || '').trim();
  const repoFilter = ctx.sourceFile.resolveRepoFilterIds(repoId);
  const warnings = [];

  if (!q) {
    return wrapResult({ family: 'search', q: '', limit, bundle_path: bundlePath }, [], 0, limit, ['--q is required for search']);
  }
  if (!reader.exists('search-index.jsonl')) {
    return wrapResult({ family: 'search', q, path_scope: pathScope || undefined, limit, bundle_path: bundlePath }, [], 0, limit, ['search-index.jsonl missing; run build-search-index.sh during bundle build']);
  }
  if (repoId && repoFilter.unknown) {
    warnings.push(`repo not found in bundle: ${repoId}; returning no records`);
  }
  const targetByRepo = loadTargetByRepo(reader);
  const records = [];
  let total = 0;
  let stoppedAtLimit = false;
  if (!(repoId && repoFilter.unknown)) {
    for (const row of reader.iterateJsonl('search-index.jsonl')) {
      const p = (row.path || '').toLowerCase();
      const lineText = (row.text || '').toLowerCase();
      if (repoId && !repoFilter.ids.includes(row.repo_id || '')) continue;
      if (pathScope && !p.includes(pathScope)) continue;
      if (!p.includes(q) && !lineText.includes(q)) continue;
      total += 1;
      if (records.length >= limit) { stoppedAtLimit = true; break; }
      const recordId = `${row.repo_id || ''}:${row.path}:${row.line}`;
      records.push({
        id: `search-${records.length}-${row.repo_id || 'repo'}:${row.path}:${row.line}`,
        reference: R.makeRef(bundlePath, 'search-index.jsonl', recordId),
        bundle_path: bundlePath, artifact: 'search-index.jsonl', record_id: recordId,
        kind: 'search-hit', evidence_state: 'source-visible', status: 'observed',
        summary: row.text || '', repo_id: row.repo_id || '', path: row.path, line: row.line,
        routes: {
          ...R.componentRoutes(targetByRepo.get(row.repo_id || '') || row.repo_id || ''),
          source: R.sourceRoute(row.repo_id || '', row.path, row.line || 1),
          api: R.apiRoute('search', { q, repo: row.repo_id || undefined, path: row.path || undefined, limit }),
        },
        hotspot_id: row.hotspot_id || '',
      });
      if (records.length >= limit) { stoppedAtLimit = true; break; }
    }
  }
  if (stoppedAtLimit) {
    warnings.push('search query stopped after the requested limit; total_records is a lower bound for matching rows');
  }
  return wrapResult(
    { family: 'search', q, path_scope: pathScope || undefined, repo: repoId || undefined, limit, bundle_path: bundlePath },
    records, total, limit, warnings,
    { totalRecordsRelation: stoppedAtLimit ? 'lower_bound' : 'exact' }
  );
}

function querySymbol(ctx, opts = {}) {
  const { reader, bundlePath } = ctx;
  const limit = parseLimit(opts.limit);
  const name = (opts.name || opts.q || '').trim().toLowerCase();
  const symKind = (opts.kind || '').trim().toLowerCase();
  const pathScope = (opts.path || opts.pathScope || '').trim().toLowerCase();
  const repoId = (opts.repo || '').trim();
  const repoFilter = ctx.sourceFile.resolveRepoFilterIds(repoId);
  const warnings = [];

  if (!name && !pathScope) {
    return wrapResult({ family: 'symbol', name: '', path: '', limit, bundle_path: bundlePath }, [], 0, limit, ['--name or --path is required for symbol query']);
  }
  if (!reader.exists('symbol-index.jsonl')) {
    return wrapResult({ family: 'symbol', name, path: pathScope || undefined, kind: symKind || undefined, limit, bundle_path: bundlePath }, [], 0, limit, ['symbol-index.jsonl missing; run ctags producer or import-ast-index.sh']);
  }

  const records = [];
  let total = 0;
  let stoppedAtLimit = false;
  if (repoId && repoFilter.unknown) {
    warnings.push(`repo not found in bundle: ${repoId}; returning no records`);
  }
  const targetByRepo = loadTargetByRepo(reader);
  outer: for (const row of reader.iterateJsonl('symbol-index.jsonl')) {
    if (repoId && repoFilter.unknown) break;
    const n = (row.name || '').toLowerCase();
    const p = (row.path || '').toLowerCase();
    if (name && !n.includes(name)) continue;
    if (pathScope && !p.includes(pathScope)) continue;
    if (symKind && (row.kind || '').toLowerCase() !== symKind) continue;
    if (repoId && !repoFilter.ids.includes(row.repo_id || '')) continue;
    total += 1;
    if (records.length >= limit) { stoppedAtLimit = true; break; }
    const recordId = `${row.repo_id || ''}:${row.path}:${row.line}:${row.name}`;
    records.push({
      id: `sym-${recordId}`, reference: R.makeRef(bundlePath, 'symbol-index.jsonl', recordId),
      bundle_path: bundlePath, artifact: 'symbol-index.jsonl', record_id: recordId,
      kind: 'symbol', evidence_state: row.evidence_state || 'metadata-visible', status: 'observed',
      summary: `${row.kind || 'symbol'} ${row.name} at ${row.path}:${row.line}`,
      name: row.name, symbol_kind: row.kind, repo_id: row.repo_id || '', path: row.path, line: row.line,
      routes: {
        ...R.componentRoutes(targetByRepo.get(row.repo_id || '') || row.repo_id || ''),
        source: R.sourceRoute(row.repo_id || '', row.path, row.line || 1),
        api: R.apiRoute('symbol', { name: row.name || undefined, path: row.path || undefined, repo: row.repo_id || undefined, limit }),
      },
      producer: row.producer || 'ctags',
      resolution_limit: row.resolution_limit || 'definition-only; not a full call graph',
    });
    if (records.length >= limit) { stoppedAtLimit = true; break; }
  }
  if (stoppedAtLimit) {
    warnings.push('symbol query stopped after the requested limit; total_records is a lower bound for matching rows');
  }
  return wrapResult(
    { family: 'symbol', name, path: pathScope || undefined, kind: symKind || undefined, repo: repoId || undefined, limit, bundle_path: bundlePath },
    records, total, limit, warnings,
    { totalRecordsRelation: stoppedAtLimit ? 'lower_bound' : 'exact', truncated: stoppedAtLimit || undefined }
  );
}

function querySource(ctx, opts = {}) {
  const { reader, sourceFile, bundlePath } = ctx;
  const repoId = (opts.repo || '').trim();
  const roots = sourceFile.loadAllRepoRoots(repoId);
  const filePath = sourceFile.resolveSourcePath(opts.path || '', roots);
  const warnings = [];

  if (!filePath) {
    return wrapResult(
      { family: 'source', path: opts.path || '', repo: repoId || undefined, line: opts.line || 1, bundle_path: bundlePath },
      [], 0, 1, ['path forbidden, not found, or outside repo roots']
    );
  }

  const radius = parseInt(opts.radius, 10) || 20;
  const full = opts.full === true || opts.full === 'true' || opts.full === '1';
  const content = sourceFile.readSourceFile(filePath);
  const body = R.buildSnippet(filePath, content || '', opts.line || 1, radius, full);
  const targetByRepo = loadTargetByRepo(reader);
  const records = [
    {
      id: `source-${body.path}:${body.line}`,
      reference: R.makeRef(bundlePath, 'source', `${body.path}:${body.line}`),
      bundle_path: bundlePath, artifact: 'source', record_id: `${body.path}:${body.line}`,
      kind: 'source-snippet', evidence_state: 'source-visible', status: 'observed',
      summary: `Source snippet ${body.path}:${body.line}`, path: body.path, line: body.line,
      request_path: opts.path || '', repo_id: repoId || '',
      routes: {
        ...R.componentRoutes(targetByRepo.get(repoId) || repoId),
        source: R.sourceRoute(repoId, opts.path || body.path, body.line),
        api: R.apiRoute('source', { repo: repoId || undefined, path: opts.path || body.path, line: body.line, radius }),
      },
      payload: body,
    },
  ];
  return wrapResult(
    { family: 'source', path: opts.path, repo: repoId || undefined, line: body.line, radius, full: full || undefined, bundle_path: bundlePath },
    records, 1, 1, warnings
  );
}

function queryAtlasFamily(ctx, opts = {}) {
  const { reader, sourceFile, bundlePath } = ctx;
  const limit = parseLimit(opts.limit, 200);
  const target = (opts.target || '').trim();
  const repoId = (opts.repo || '').trim();
  const repoFilter = sourceFile.resolveRepoFilterIds(repoId);
  const section = (opts.section || 'components').trim().toLowerCase();
  const facts = reader.readJson('atlas-facts.json');
  const content = reader.readJson('atlas-surface-content.json');
  const warnings = [];

  if (!facts) {
    return wrapResult(
      { family: 'atlas', section, target: target || undefined, repo: repoId || undefined, limit, bundle_path: bundlePath },
      [], 0, limit, ['atlas-facts.json missing; run current portolan-scan/build-portolan-bundle']
    );
  }

  let rows = [];
  let artifact = 'atlas-facts.json';
  if (section === 'surfaces' || section === 'surface-content') {
    rows = Array.isArray(content && content.routes) ? content.routes : [];
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
        row.from_target === target || row.to_target === target ||
        (row.repo_ids || []).includes(target);
      if (!includesTarget) return false;
    }
    if (repoId) {
      const rowRepo = row.repo_id || row.repoId || row.from_repo || row.to_repo || '';
      const includesRepo = repoFilter.ids.includes(rowRepo) ||
        repoFilter.ids.includes(row.from_repo) || repoFilter.ids.includes(row.to_repo) ||
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
      id, reference: R.makeRef(bundlePath, artifact, id), bundle_path: bundlePath,
      artifact, record_id: id,
      kind: section === 'components' ? 'atlas-component' : `atlas-${section}`,
      evidence_state: row.evidence_state || row.state || 'metadata-visible',
      status: row.status || 'observed', summary: row.summary || row.label || row.title || id,
      target_id: targetId, repo_id: rowRepoId,
      routes: {
        ...R.componentRoutes(targetId || rowRepoId),
        api: R.apiRoute('atlas', { section, target: targetId || undefined, repo: rowRepoId || undefined, limit: 5 }),
      },
      payload: row,
    };
  });

  return wrapResult(
    { family: 'atlas', section, target: target || undefined, repo: repoId || undefined, limit, bundle_path: bundlePath },
    records, records.length, limit, warnings
  );
}

function queryEvidenceIndex(ctx, opts = {}) {
  const { reader, bundlePath } = ctx;
  const limit = parseLimit(opts.limit);
  const family = (opts.family || '').trim().toLowerCase();
  const bridgeDir = path.join(reader.bundleDir, 'map-bridge');
  if (!reader.exists('map-bridge/evidence-index.jsonl')) {
    return wrapResult(
      { family: 'evidence-index', map_bridge: bridgeDir, limit, bundle_path: bundlePath },
      [], 0, limit, ['map-bridge/evidence-index.jsonl missing; run build-map-bridge.sh after portolan map']
    );
  }
  const rows = reader.readJsonl('map-bridge/evidence-index.jsonl');
  let matched = rows;
  if (family) {
    matched = rows.filter((r) => (r.family || r.kind || '').toLowerCase().includes(family));
  }
  const records = matched.slice(0, limit).map((row) => ({
    id: row.id || `evidence-${row.record_id || row.family}`,
    reference: R.makeRef(bundlePath, 'map-bridge/evidence-index.jsonl', row.id || row.record_id),
    bundle_path: bundlePath, artifact: 'map-bridge/evidence-index.jsonl',
    record_id: row.id || row.record_id || '', kind: row.family || row.kind || 'evidence',
    evidence_state: row.evidence_state || 'metadata-visible', status: row.status || 'observed',
    summary: row.summary || row.reason || '', producer: row.producer || '', payload: row,
  }));
  return wrapResult(
    { family: 'evidence-index', filter_family: family || undefined, limit, bundle_path: bundlePath },
    records, matched.length, limit
  );
}

function queryRepos(ctx, opts = {}) {
  const { reader, bundlePath } = ctx;
  const limit = parseLimit(opts.limit, 200);
  const repoId = (opts.repo || opts.id || '').trim();
  const text = (opts.text || opts.q || '').trim().toLowerCase();
  const profiles = reader.readJson('repo-profiles.json');
  const warnings = [];

  let rows = [];
  let artifact = 'repo-profiles.json';
  if (profiles && Array.isArray(profiles.repos)) {
    rows = profiles.repos;
  } else {
    const repos = reader.readJson('repos.json');
    rows = Array.isArray(repos) ? repos : [];
    artifact = 'repos.json';
    warnings.push('repo-profiles.json missing; identity-only records from repos.json (run scan-repo-profiles.sh)');
  }

  const matched = rows.filter((r) => {
    if (repoId && r.id !== repoId) return false;
    if (text) {
      const manifests = ((r.purpose && r.purpose.manifests) || [])
        .map((m) => `${m.name || ''} ${m.description || ''} ${m.module || ''}`)
        .join(' ');
      const hay = `${r.id} ${r.name || ''} ${(r.purpose && r.purpose.readme_title) || ''} ${manifests}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });

  const targetByRepo = loadTargetByRepo(reader);
  const records = matched.map((r) => {
    const targetId = targetByRepo.get(r.id) || r.target_id || r.targetId || r.id;
    return {
      id: r.id, reference: R.makeRef(bundlePath, artifact, r.id), bundle_path: bundlePath,
      artifact, record_id: r.id, kind: 'repo-profile',
      evidence_state: (r.purpose && r.purpose.evidence_state) || 'metadata-visible',
      activity_evidence_state: (r.activity && r.activity.evidence_state) || 'unknown',
      status: 'observed',
      summary: (r.purpose && r.purpose.readme_title) ||
        ((r.purpose && r.purpose.manifests || []).map((m) => m.description).find(Boolean)) ||
        r.name || r.id,
      name: r.name || r.id, path: r.path || '', target_id: targetId,
      routes: { ...R.componentRoutes(targetId), api: R.apiRoute('repos', { repo: r.id, limit: 1 }) },
      payload: r,
    };
  });

  return wrapResult(
    { family: 'repos', repo: repoId || undefined, text: text || undefined, limit, bundle_path: bundlePath, artifact },
    records, matched.length, limit, warnings
  );
}

function queryRelationships(ctx, opts = {}) {
  const { reader, sourceFile, bundlePath } = ctx;
  const limit = parseLimit(opts.limit);
  const type = (opts.type || '').trim().toLowerCase();
  const repoId = (opts.repo || '').trim();
  const repoFilter = sourceFile.resolveRepoFilterIds(repoId);
  const warnings = [];

  if (!reader.exists('relationships.jsonl')) {
    return wrapResult(
      { family: 'relationships', type: type || undefined, repo: repoId || undefined, limit, bundle_path: bundlePath },
      [], 0, limit, ['relationships.jsonl missing; relationship producer output is absent or scan-cross-repo failed (see gaps)']
    );
  }
  if (repoId && repoFilter.unknown) {
    warnings.push(`repo not found in bundle: ${repoId}; returning no records`);
  }
  const targetByRepo = loadTargetByRepo(reader);
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
      id: r.id, reference: R.makeRef(bundlePath, 'relationships.jsonl', r.id), bundle_path: bundlePath,
      artifact: 'relationships.jsonl', record_id: r.id, kind: 'relationship',
      relationship_type: r.type || '', evidence_state: r.evidence_state || 'metadata-visible',
      status: 'observed', summary: r.summary || '', from_repo: r.from_repo || null, to_repo: r.to_repo || null,
      repos: r.repos || undefined,
      routes: {
        graph: R.appHashRoute('graph', { component: fromTarget || toTarget || undefined }),
        from_atlas: fromTarget ? R.appHashRoute('atlas', { component: fromTarget }) : undefined,
        to_atlas: toTarget ? R.appHashRoute('atlas', { component: toTarget }) : undefined,
        api: R.apiRoute('relationships', { type: r.type || undefined, repo: repoId || undefined, limit }),
      },
      detail: r.detail || {}, producer: r.producer || '', producer_ref: r.producer_ref || '',
    };
  };
  if (!(repoId && repoFilter.unknown)) {
    for (const r of reader.iterateJsonl('relationships.jsonl')) {
      if (!matchRelationship(r)) continue;
      total += 1;
      if (records.length >= limit) { stoppedAtLimit = true; break; }
      records.push(relationshipRecord(r));
      if (records.length >= limit) { stoppedAtLimit = true; break; }
    }
  }
  if (stoppedAtLimit) {
    warnings.push('relationships query stopped after the requested limit; total_records is a lower bound for matching rows');
  }
  return wrapResult(
    { family: 'relationships', type: type || undefined, repo: repoId || undefined, limit, bundle_path: bundlePath },
    records, total, limit, warnings,
    { totalRecordsRelation: stoppedAtLimit ? 'lower_bound' : 'exact' }
  );
}

function relationshipGapRecords(ctx, fromInput, toInput, limit) {
  const gaps = queryGaps(ctx, { limit: Math.min(limit, 20) });
  const needle = R.compactString(`${fromInput} ${toInput} relationships relationship atlas edge dependency`);
  const tokens = needle.split(/\s+/).filter(Boolean);
  return (gaps.records || []).filter((record) => {
    const hay = R.compactString([record.surface, record.status, record.summary, record.reason, record.recipe].join(' '));
    return hay.includes('relationship') || hay.includes('atlas') || tokens.some((token) => token.length > 3 && hay.includes(token));
  });
}

function queryClaimCheck(ctx, opts = {}) {
  const { reader, sourceFile, bundlePath } = ctx;
  const limit = parseLimit(opts.limit, 10);
  const fromInput = String(opts.from || opts.fromRepo || opts.fromComponent || '').trim();
  const toInput = String(opts.to || opts.toRepo || opts.toComponent || '').trim();
  const claimKind = R.compactString(opts.kind || opts.type || opts.relationship || '');
  const claimText = R.compactString(opts.text || opts.q || '');
  const warnings = [];

  if (!fromInput || !toInput) {
    return wrapResult(
      { family: 'claim-check', from: fromInput || undefined, to: toInput || undefined, kind: claimKind || undefined, limit, bundle_path: bundlePath },
      [], 0, limit, ['--from and --to are required for claim-check']
    );
  }

  const from = resolveClaimEndpoint(reader, fromInput);
  const to = resolveClaimEndpoint(reader, toInput);
  if (!from.found) warnings.push(`from endpoint not found in repos/atlas components: ${fromInput}`);
  if (!to.found) warnings.push(`to endpoint not found in repos/atlas components: ${toInput}`);

  const evidenceRows = loadRelationshipEvidenceRows(reader);
  const relationshipArtifactExists = reader.exists('relationships.jsonl');
  const atlasExists = reader.exists('atlas-facts.json');
  if (!relationshipArtifactExists) warnings.push('relationships.jsonl missing; cross-repo relationship evidence not assessed');
  if (!atlasExists) warnings.push('atlas-facts.json missing; atlas edge evidence not assessed');

  const matchesKindAndText = ({ row }) => {
    const kind = R.relationshipKind(row);
    const text = R.relationshipText(row);
    if (claimKind && kind !== claimKind) return false;
    if (claimText && !text.includes(claimText)) return false;
    return true;
  };
  const scoped = evidenceRows.filter(matchesKindAndText);
  const directRows = scoped.filter(({ row }) => R.relationshipMatchesDirection(row, from, to));
  const reverseRows = scoped.filter(({ row }) => R.relationshipMatchesReverse(row, from, to));
  const contradictingRows = directRows.filter(({ row }) => R.isContradictoryRelationship(row));
  const supportingRows = directRows.filter(({ row }) => !R.isContradictoryRelationship(row));
  const gapRecords = relationshipGapRecords(ctx, fromInput, toInput, limit);

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
    ...contradictingRows.map(({ artifact, row }) => R.claimRelationshipRecord(bundlePath, artifact, row, claimKind, from, to, 'contradicting')),
    ...supportingRows.map(({ artifact, row }) => R.claimRelationshipRecord(bundlePath, artifact, row, claimKind, from, to, 'supporting')),
    ...reverseRows.map(({ artifact, row }) => R.claimRelationshipRecord(bundlePath, artifact, row, claimKind, from, to, 'reverse-context')),
    ...gapRecords.map((record) => ({ ...record, relation: 'gap-context' })),
  ].slice(0, limit);

  const recordId = `${fromInput}->${toInput}:${claimKind || 'relationship'}:${claimText || ''}`;
  const records = [
    {
      id: `claim-check:${R.hashText(recordId).slice(0, 16)}`,
      reference: R.makeRef(bundlePath, 'claim-check', recordId), bundle_path: bundlePath,
      artifact: 'claim-check', record_id: recordId, kind: 'relationship-claim-check',
      evidence_state: evidenceState, status, verdict, summary,
      claim: { from: fromInput, to: toInput, kind: claimKind || '', text: opts.text || opts.q || '' },
      resolved: { from, to },
      routes: {
        graph: R.appHashRoute('graph', { component: from.target_ids[0] || to.target_ids[0] || undefined }),
        from_atlas: from.target_ids[0] ? R.appHashRoute('atlas', { component: from.target_ids[0] }) : undefined,
        to_atlas: to.target_ids[0] ? R.appHashRoute('atlas', { component: to.target_ids[0] }) : undefined,
        api: R.apiRoute('claim-check', { from: fromInput, to: toInput, kind: claimKind || undefined, text: opts.text || opts.q || undefined, limit }),
      },
      bounded_records: {
        evidence: boundedEvidence,
        supporting: supportingRows.slice(0, limit).map(({ artifact, row }) => R.claimRelationshipRecord(bundlePath, artifact, row, claimKind, from, to, 'supporting')),
        contradicting: contradictingRows.slice(0, limit).map(({ artifact, row }) => R.claimRelationshipRecord(bundlePath, artifact, row, claimKind, from, to, 'contradicting')),
        reverse_context: reverseRows.slice(0, limit).map(({ artifact, row }) => R.claimRelationshipRecord(bundlePath, artifact, row, claimKind, from, to, 'reverse-context')),
        gaps: gapRecords.slice(0, limit),
      },
      follow_up_queries: [
        { family: 'relationships', route: R.apiRoute('relationships', { type: claimKind || undefined, repo: from.repo_ids[0] || undefined, limit }) },
        { family: 'atlas', route: R.apiRoute('atlas', { section: 'edges', target: from.target_ids[0] || undefined, limit }) },
        { family: 'gaps', route: R.apiRoute('gaps', { surface: 'relationships', limit }) },
      ],
      resolution_limit: 'Claim-check compares the claim only against bounded relationship, atlas edge, and gap records. Missing evidence is cannot_verify/not_assessed, not proof of absence.',
    },
  ];

  return wrapResult(
    { family: 'claim-check', from: fromInput, to: toInput, kind: claimKind || undefined, text: opts.text || opts.q || undefined, limit, bundle_path: bundlePath },
    records, records.length, 1, warnings
  );
}

function queryClaims(ctx, opts = {}) {
  const { reader, bundlePath } = ctx;
  const limit = parseLimit(opts.limit);
  const tier = (opts.tier || '').trim().toLowerCase();
  const subject = (opts.subject || '').trim().toLowerCase();
  const warnings = [];

  if (!reader.exists('claims.jsonl')) {
    return wrapResult(
      { family: 'claims', tier: tier || undefined, subject: subject || undefined, limit, bundle_path: bundlePath },
      [], 0, limit, ['claims.jsonl missing; no agent analysis imported (see scripts/import-analysis-claims.sh and harness/guardrails/analysis-claims.md)']
    );
  }
  const VALID_TIERS = ['analytical', 'synthetic', 'speculative'];
  if (tier && !VALID_TIERS.includes(tier)) {
    warnings.push(`unknown tier filter: ${tier} (expected ${VALID_TIERS.join(' | ')}); returning no records`);
  }

  const rows = reader.readJsonl('claims.jsonl');
  const matched = rows.filter((c) => {
    if (tier && (c.claim_tier || '').toLowerCase() !== tier) return false;
    if (subject) {
      const s = (c.subject || '').toLowerCase();
      const schemeOnly = subject === 'repo:' || subject === 'path:';
      if (schemeOnly ? !s.startsWith(subject) : s !== subject) return false;
    }
    return true;
  });

  const records = matched.map((c) => ({
    id: c.id, reference: R.makeRef(bundlePath, 'claims.jsonl', c.id), bundle_path: bundlePath,
    artifact: 'claims.jsonl', record_id: c.id, kind: 'analysis-claim',
    claim_tier: c.claim_tier || 'speculative', evidence_state: 'claim-only', status: 'imported',
    summary: c.statement || '', statement: c.statement || '', subject: c.subject || '',
    cited_refs: c.cited_refs || [], agent: c.agent || '', imported_at: c.imported_at || '',
    resolution_limit: 'LLM-authored analysis (tier ' +
      (c.claim_tier === 'analytical' ? 'B' : c.claim_tier === 'synthetic' ? 'C' : 'D') +
      '); refs resolved at import time, conclusion not tool-verified',
  }));

  return wrapResult(
    { family: 'claims', tier: tier || undefined, subject: subject || undefined, limit, bundle_path: bundlePath },
    records, matched.length, limit, warnings
  );
}

function queryOverview(ctx, opts = {}) {
  const { reader, bundlePath } = ctx;
  const limit = parseLimit(opts.limit, 8);
  const manifest = reader.readJson('manifest.json');
  const atlasFacts = reader.readJson('atlas-facts.json');
  const card = reader.readJson('landscape-card.json');
  const report = reader.readJson('landscape-report.json');
  const warnings = [];

  const repos = queryRepos(ctx, { limit });
  const relationships = queryRelationships(ctx, { limit });
  const hotspots = queryHotspots(ctx, { limit });
  const gaps = queryGaps(ctx, { limit });
  const atlasComponents = queryAtlasFamily(ctx, { section: 'components', limit });

  warnings.push(
    ...R.nestedWarnings('repos', repos),
    ...R.nestedWarnings('relationships', relationships),
    ...R.nestedWarnings('hotspots', hotspots),
    ...R.nestedWarnings('gaps', gaps),
    ...R.nestedWarnings('atlas', atlasComponents)
  );
  if (!manifest) warnings.push('manifest.json missing');
  if (!atlasFacts) warnings.push('atlas-facts.json missing; atlas coverage unavailable');
  const coreOverviewMissing = !manifest || !atlasFacts;

  const coverage = (atlasFacts && atlasFacts.coverage) || {};
  const counts = {
    repos: coverage.repo_count != null ? coverage.repo_count : repos.total_records,
    components: coverage.component_count != null ? coverage.component_count : atlasComponents.total_records,
    relationships: coverage.relationship_count != null ? coverage.relationship_count : relationships.total_records,
    relationship_edges: coverage.relationship_edges != null ? coverage.relationship_edges : coverage.edge_count,
    hotspots: coverage.hotspot_count != null ? coverage.hotspot_count : hotspots.total_records,
    gaps: gaps.total_records,
    degraded_health_records: Math.max(0, gaps.total_records - ((manifest && (manifest.gaps_total ?? manifest.gap_count)) || 0)),
    runtime_topology: coverage.runtime_topology || 'unknown',
  };
  const summaryParts = [
    `${counts.repos != null ? counts.repos : 0} repos`,
    `${counts.relationships != null ? counts.relationships : 0} relationships`,
    `${counts.hotspots != null ? counts.hotspots : 0} hotspots`,
    `${counts.gaps != null ? counts.gaps : 0} gaps`,
  ];

  const records = [
    {
      id: 'captain-overview', reference: R.makeRef(bundlePath, 'manifest.json', 'captain-overview'),
      bundle_path: bundlePath, artifact: 'manifest.json', record_id: 'captain-overview',
      kind: 'captain-overview',
      evidence_state: coreOverviewMissing ? 'not_assessed' : 'metadata-visible',
      status: coreOverviewMissing ? 'not_assessed' : 'observed',
      summary: summaryParts.join(', '),
      identity: {
        target_root: (manifest && manifest.target_root) || (atlasFacts && atlasFacts.target_root) || '',
        generated_at: (atlasFacts && atlasFacts.generated_at) || (card && card.generated_at) || (manifest && manifest.generated_at) || '',
        name: (card && card.identity && card.identity.name) || (report && report.title) || '',
      },
      counts, coverage,
      routes: {
        atlas: R.appHashRoute('atlas'), risks: R.appHashRoute('risks'), sources: R.appHashRoute('sources'),
        agent: R.appHashRoute('agent'), graph: R.appHashRoute('graph'), api: R.apiRoute('overview', { limit }),
      },
      bounded_records: {
        repos: repos.records, components: atlasComponents.records, relationships: relationships.records,
        risks: hotspots.records, gaps: gaps.records,
      },
      follow_up_queries: [
        { family: 'repos', route: R.apiRoute('repos', { limit }) },
        { family: 'relationships', route: R.apiRoute('relationships', { limit }) },
        { family: 'hotspots', route: R.apiRoute('hotspots', { limit, full: true }) },
        { family: 'gaps', route: R.apiRoute('gaps', { limit }) },
        { family: 'promotion-health', route: R.apiRoute('promotion-health', { limit }) },
        { family: 'atlas', route: R.apiRoute('atlas', { section: 'components', limit }) },
      ],
      answer_contract: {
        cite_records: true, separate_unknowns: true, no_prebuilt_answer: true,
        evidence_states: ['source-visible', 'metadata-visible', 'runtime-visible', 'not_assessed', 'unknown', 'cannot_verify'],
      },
    },
  ];

  return wrapResult(
    { family: 'overview', limit, bundle_path: bundlePath },
    records, records.length, 1, warnings
  );
}

function querySelectedCode(ctx, opts = {}) {
  const { reader, sourceFile, bundlePath } = ctx;
  const limit = parseLimit(opts.limit, 8);
  const radius = parseInt(opts.radius, 10) || 20;
  const symbolName = (opts.symbol || opts.name || opts.q || '').trim();
  let selectedPath = (opts.path || '').trim();
  let selectedLine = opts.line || 1;
  let selection = resolveSelectionRepo(reader, sourceFile, selectedPath, opts.repo || '');
  const warnings = [...selection.warnings];

  let symbolLookup = null;
  if (symbolName) {
    symbolLookup = querySymbol(ctx, { name: symbolName, repo: selection.repoId || opts.repo, limit });
    warnings.push(...R.nestedWarnings('symbol', symbolLookup));
  }

  if (!selectedPath && symbolLookup && symbolLookup.records.length > 0) {
    const first = symbolLookup.records[0];
    selectedPath = first.path || '';
    selectedLine = opts.line || first.line || 1;
    const symbolRepo = first.repo_id && !sourceFile.resolveRepoFilterIds(first.repo_id).unknown
      ? first.repo_id
      : (opts.repo || '');
    selection = resolveSelectionRepo(reader, sourceFile, selectedPath, symbolRepo);
    warnings.push(...selection.warnings);
  }

  const repoId = selection.repoId || (opts.repo || '').trim();
  const pathForQueries = selection.repoRelativePath || selectedPath;
  const targetByRepo = loadTargetByRepo(reader);
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
    source = querySource(ctx, { path: pathForQueries, repo: repoId || undefined, line: selectedLine, radius });
    warnings.push(...R.nestedWarnings('source', source));
  }
  if (symbolName || pathForQueries) {
    symbols = querySymbol(ctx, { name: symbolName || undefined, path: pathForQueries || undefined, repo: repoId || undefined, limit });
    if (symbols.records.length === 0 && repoId) {
      const fallbackSymbols = querySymbol(ctx, { name: symbolName || undefined, path: pathForQueries || undefined, limit });
      if (fallbackSymbols.records.length > 0) {
        warnings.push('symbol: scoped lookup returned no records; using unscoped path/name fallback');
        symbols = fallbackSymbols;
      }
    }
    warnings.push(...R.nestedWarnings('symbol', symbols));
  }
  const searchTerm = symbolName || pathForQueries;
  if (searchTerm) {
    search = querySearch(ctx, { q: searchTerm, pathScope: pathForQueries && symbolName ? pathForQueries : undefined, repo: repoId || undefined, limit });
    warnings.push(...R.nestedWarnings('search', search));
  }
  if (repoId) {
    repo = queryRepos(ctx, { repo: repoId, limit: 1 });
    component = queryAtlasFamily(ctx, { section: 'components', repo: repoId, limit: 1 });
    hotspots = queryHotspots(ctx, { repo: repoId, path: pathForQueries || undefined, limit });
    relationships = queryRelationships(ctx, { repo: repoId, limit });
    warnings.push(
      ...R.nestedWarnings('repos', repo), ...R.nestedWarnings('atlas', component),
      ...R.nestedWarnings('hotspots', hotspots), ...R.nestedWarnings('relationships', relationships)
    );
  } else if (pathForQueries) {
    hotspots = queryHotspots(ctx, { path: pathForQueries, limit });
    warnings.push(...R.nestedWarnings('hotspots', hotspots));
  }
  gaps = queryGaps(ctx, { limit: Math.min(limit, 8) });
  warnings.push(...R.nestedWarnings('gaps', gaps));

  const componentRecord = R.firstRecord(component || { records: [] });
  const targetId = (componentRecord && componentRecord.target_id) || targetByRepo.get(repoId) || repoId || '';
  const sourceRecord = R.firstRecord(source || { records: [] });
  const selectedSourceRoute = pathForQueries
    ? R.sourceRoute(repoId, pathForQueries, selectedLine)
    : ((sourceRecord && sourceRecord.routes && sourceRecord.routes.source) || '');
  const recordId = `${repoId || 'unknown'}:${pathForQueries || symbolName || 'selection'}:${selectedLine || 1}`;

  const records = [
    {
      id: `selected-code:${R.hashText(recordId).slice(0, 16)}`,
      reference: R.makeRef(bundlePath, 'selected-code', recordId), bundle_path: bundlePath,
      artifact: 'selected-code', record_id: recordId, kind: 'selected-code-context',
      evidence_state: sourceRecord ? 'source-visible' : 'metadata-visible',
      status: sourceRecord || R.firstRecord(symbols || { records: [] }) ? 'observed' : 'not_assessed',
      summary: [
        repoId ? `repo ${repoId}` : 'repo unknown',
        pathForQueries ? `path ${pathForQueries}` : '',
        symbolName ? `symbol ${symbolName}` : '',
      ].filter(Boolean).join(', '),
      selection: {
        input_path: opts.path || '', path: pathForQueries || '', line: Number(selectedLine) || 1,
        symbol: symbolName || '', repo_id: repoId || '', target_id: targetId || '',
      },
      routes: {
        ...R.componentRoutes(targetId), source: selectedSourceRoute || undefined,
        api: R.apiRoute('selected-code', { repo: repoId || undefined, path: pathForQueries || undefined, symbol: symbolName || undefined, line: selectedLine || undefined, limit }),
      },
      bounded_records: {
        repo: repo ? repo.records : [], component: component ? component.records : [],
        source: source ? source.records : [], symbols: symbols ? symbols.records : [],
        search_hits: search ? search.records : [], risks: hotspots ? hotspots.records : [],
        relationships: relationships ? relationships.records : [], gaps: gaps ? gaps.records : [],
      },
      follow_up_queries: [
        pathForQueries ? { family: 'source', route: R.apiRoute('source', { repo: repoId || undefined, path: pathForQueries, line: selectedLine, radius }) } : null,
        symbolName || pathForQueries ? { family: 'symbol', route: R.apiRoute('symbol', { repo: repoId || undefined, name: symbolName || undefined, path: pathForQueries || undefined, limit }) } : null,
        searchTerm ? { family: 'search', route: R.apiRoute('search', { repo: repoId || undefined, q: searchTerm, path: symbolName && pathForQueries ? pathForQueries : undefined, limit }) } : null,
        repoId ? { family: 'hotspots', route: R.apiRoute('hotspots', { repo: repoId, path: pathForQueries || undefined, limit, full: true }) } : null,
        repoId ? { family: 'relationships', route: R.apiRoute('relationships', { repo: repoId, limit }) } : null,
        repoId ? { family: 'atlas', route: R.apiRoute('atlas', { section: 'components', repo: repoId, limit: 1 }) } : null,
      ].filter(Boolean),
      resolution_limit: 'Selected-code lookup joins bounded source/search/symbol/atlas records. It is not a semantic call graph unless imported evidence says so.',
    },
  ];

  return wrapResult(
    { family: 'selected-code', path: opts.path || undefined, symbol: symbolName || undefined, repo: opts.repo || undefined, line: Number(selectedLine) || 1, radius, limit, bundle_path: bundlePath },
    records, records.length, 1, warnings
  );
}

function queryStratumFile(ctx, opts = {}, config) {
  const { reader, bundlePath } = ctx;
  const limit = parseLimit(opts.limit, 200);
  const family = (opts.family || '').trim().toLowerCase();
  const status = (opts.status || '').trim().toLowerCase();
  const stratum = (opts.stratum || '').trim().toLowerCase();
  const warnings = [];
  if (!reader.exists(config.artifact)) {
    return wrapResult(
      { family: config.family, filter_family: family || undefined, status: status || undefined, limit, bundle_path: bundlePath },
      [], 0, limit, [`${config.artifact} missing; run build-evidence-promotion-atlas.sh or portolan-scan`]
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
  const exactSummaryTotal = hasFilter ? null : summaryCountForStratum(reader, config.artifact);
  const indexed = hasFilter ? indexedStratumRows(reader, config.artifact, { family, status, stratum }) : null;
  if (indexed) {
    return wrapResult(
      { family: config.family, filter_family: family || undefined, status: status || undefined, stratum: stratum || undefined, limit, bundle_path: bundlePath, artifact: config.artifact },
      indexed.records.map((row) => R.stratumRecord(bundlePath, config.artifact, row)),
      indexed.total, limit, [], { totalRecordsRelation: 'exact' }
    );
  }
  if (config.json) {
    const data = reader.readJson(config.artifact);
    let rows = (data && data.records) || (data && data.families) || [];
    if (!Array.isArray(rows)) rows = [];
    for (const row of rows) {
      if (!matches(row)) continue;
      total += 1;
      if (records.length < limit) records.push(R.stratumRecord(bundlePath, config.artifact, row));
    }
  } else {
    for (const row of reader.iterateJsonl(config.artifact)) {
      if (!matches(row)) continue;
      total += 1;
      if (records.length >= limit) { stoppedAtLimit = true; break; }
      records.push(R.stratumRecord(bundlePath, config.artifact, row));
      if (records.length >= limit) { stoppedAtLimit = true; break; }
    }
  }
  if (stoppedAtLimit && exactSummaryTotal === null) {
    warnings.push(`${config.artifact} query stopped after the requested limit; total_records is a lower bound for matching rows`);
  }
  const totalRecords = exactSummaryTotal === null ? total : exactSummaryTotal;
  return wrapResult(
    { family: config.family, filter_family: family || undefined, status: status || undefined, stratum: stratum || undefined, limit, bundle_path: bundlePath, artifact: config.artifact },
    records, totalRecords, limit, warnings,
    { totalRecordsRelation: exactSummaryTotal === null && stoppedAtLimit ? 'lower_bound' : 'exact', truncated: stoppedAtLimit || undefined }
  );
}

function querySystemMapFamily(ctx, opts = {}) {
  const map = ctx.reader.readJson('system-map.json');
  if (!map) {
    return wrapResult(
      { family: 'system-map', section: (opts.section || ''), bundle_path: ctx.bundlePath },
      [], 0, parseLimit(opts.limit), ['system-map.json missing; run build-system-map first']
    );
  }
  // Delegate to the pure query-atlas use-case (canonical system-map query).
  return queryAtlas(map, opts);
}

// ---- dispatch facade + HTTP route table ----

function dispatch(ctx, family, opts) {
  switch (family) {
    case 'hotspots': return queryHotspots(ctx, opts);
    case 'gaps': return queryGaps(ctx, opts);
    case 'landscape': return queryLandscape(ctx, opts);
    case 'overview': return queryOverview(ctx, opts);
    case 'search': return querySearch(ctx, opts);
    case 'symbol': return querySymbol(ctx, opts);
    case 'source': return querySource(ctx, opts);
    case 'selected-code': return querySelectedCode(ctx, opts);
    case 'claim-check': return queryClaimCheck(ctx, opts);
    case 'atlas': return queryAtlasFamily(ctx, opts);
    case 'evidence-index': return queryEvidenceIndex(ctx, opts);
    case 'claims': return queryClaims(ctx, opts);
    case 'repos': return queryRepos(ctx, opts);
    case 'relationships': return queryRelationships(ctx, opts);
    case 'system-map': return querySystemMapFamily(ctx, opts);
    case 'promotion-health': return queryStratumFile(ctx, opts, { family, artifact: 'promotion-health.jsonl' });
    case 'promoted-facts': return queryStratumFile(ctx, opts, { family, artifact: 'promoted-facts.jsonl' });
    case 'raw-artifacts': return queryStratumFile(ctx, opts, { family, artifact: 'raw-artifacts.jsonl' });
    case 'classified-sources': return queryStratumFile(ctx, opts, { family, artifact: 'classified-sources.jsonl' });
    default: throw new Error(`unknown query family ${family}`);
  }
}

function handleHttpPath(ctx, pathname, searchParams) {
  const p = pathname.replace(/\/$/, '');
  const g = (k) => searchParams.get(k);
  if (p === '/api/hotspots') return dispatch(ctx, 'hotspots', { kind: g('kind'), severity: g('severity'), path: g('path'), text: g('text') || g('q'), repo: g('repo'), limit: g('limit'), full: g('full') });
  if (p === '/api/gaps') return dispatch(ctx, 'gaps', { surface: g('surface'), status: g('status'), limit: g('limit') });
  if (p === '/api/landscape') return dispatch(ctx, 'landscape', { section: g('section') });
  if (p === '/api/overview') return dispatch(ctx, 'overview', { limit: g('limit') });
  if (p === '/api/search') return dispatch(ctx, 'search', { q: g('q'), pathScope: g('path_scope') || g('path'), repo: g('repo'), limit: g('limit') });
  if (p === '/api/symbol') return dispatch(ctx, 'symbol', { name: g('name') || g('q'), path: g('path'), kind: g('kind'), repo: g('repo'), limit: g('limit') });
  if (p === '/api/selected-code') return dispatch(ctx, 'selected-code', { path: g('path'), symbol: g('symbol') || g('name') || g('q'), repo: g('repo'), line: g('line'), radius: g('radius'), limit: g('limit') });
  if (p === '/api/source') return dispatch(ctx, 'source', { path: g('path'), repo: g('repo'), line: g('line'), radius: g('radius'), full: g('full') });
  if (p === '/api/claim-check') return dispatch(ctx, 'claim-check', { from: g('from'), to: g('to'), kind: g('kind') || g('type') || g('relationship'), text: g('text') || g('q'), limit: g('limit') });
  if (p === '/api/atlas') return dispatch(ctx, 'atlas', { section: g('section'), target: g('target') || g('component'), repo: g('repo'), limit: g('limit') });
  if (p === '/api/evidence-index') return dispatch(ctx, 'evidence-index', { family: g('family'), limit: g('limit') });
  if (p === '/api/claims') return dispatch(ctx, 'claims', { tier: g('tier'), subject: g('subject'), limit: g('limit') });
  if (p === '/api/repos') return dispatch(ctx, 'repos', { repo: g('repo') || g('id'), text: g('text') || g('q'), limit: g('limit') });
  if (p === '/api/relationships') return dispatch(ctx, 'relationships', { type: g('type'), repo: g('repo'), limit: g('limit') });
  if (p === '/api/promotion-health') return dispatch(ctx, 'promotion-health', { family: g('family'), status: g('status'), stratum: g('stratum'), limit: g('limit') });
  if (p === '/api/promoted-facts') return dispatch(ctx, 'promoted-facts', { family: g('family'), status: g('status'), stratum: g('stratum'), limit: g('limit') });
  if (p === '/api/raw-artifacts') return dispatch(ctx, 'raw-artifacts', { family: g('family'), status: g('status'), stratum: g('stratum'), limit: g('limit') });
  if (p === '/api/classified-sources') return dispatch(ctx, 'classified-sources', { family: g('family'), status: g('status'), stratum: g('stratum'), limit: g('limit') });
  if (p === '/api/system-map') return dispatch(ctx, 'system-map', { section: g('section'), kind: g('kind'), q: g('q') || g('text'), id: g('id'), limit: g('limit') });
  return null;
}

module.exports = {
  dispatch,
  handleHttpPath,
  queryHotspots, queryGaps, queryLandscape, querySearch, querySymbol,
  querySource, queryAtlasFamily, queryEvidenceIndex, queryRepos,
  queryRelationships, queryClaimCheck, queryClaims, queryOverview,
  querySelectedCode, queryStratumFile, querySystemMapFamily,
};
