/**
 * Domain: pure helpers for the bundle-query families.
 *
 * Record shapers, route/reference builders, path-string logic, relationship
 * matchers, stratum filter helpers, and the source-snippet window math. Every
 * function here is pure (no fs/network); the bundle path passed to record
 * shapers is carried verbatim into the `reference`/`bundle_path` fields.
 *
 * Domain layer — may depend only on domain (sibling query-envelope).
 */
'use strict';

const path = require('path');
const crypto = require('crypto');

const MAX_FULL_SOURCE_LINES = 2000;

function hashText(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

function normalizeSlash(value) {
  return String(value || '').replace(/\\/g, '/');
}

// ---- reference / route builders ----

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

// ---- path-string logic (pure given roots/strings) ----

function isPathUnderRoot(filePath, root) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(filePath);
  return resolved === resolvedRoot || resolved.startsWith(resolvedRoot + path.sep);
}

function pathInRepo(p, prefixes) {
  const norm = String(p).replace(/\\/g, '/');
  return prefixes.some((pre) => {
    if (pre === '') return !path.isAbsolute(norm);
    return norm === pre || norm.startsWith(pre + '/');
  });
}

/**
 * Resolve a request path to a repo-relative slash-normalized path, given the
 * repo's pre-resolved roots (declared + realpath). Pure: the realpath I/O lives
 * in the SourceFilePort adapter.
 */
function relativePathForRepo(requestPath, repo, roots, targetRoot = '', allowBareRelative = true) {
  if (!requestPath || !repo) return '';
  const raw = String(requestPath).trim();
  if (!raw || raw.includes('\0')) return '';

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

// ---- source-snippet window math (pure given content) ----

function buildSnippet(filePath, content, lineNum, radius = 20, full = false) {
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

// ---- record shapers ----

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

// ---- stratum index/filter helpers (pure) ----

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

// ---- relationship / claim helpers ----

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

// ---- small utilities ----

function nestedWarnings(label, result) {
  return (result && (result.warnings || []) ? result.warnings : []).map((w) => `${label}: ${w}`);
}

function firstRecord(result) {
  return (result && result.records && result.records[0]) || null;
}

module.exports = {
  MAX_FULL_SOURCE_LINES,
  hashText,
  normalizeSlash,
  makeRef,
  routeQuery,
  appHashRoute,
  apiRoute,
  sourceRoute,
  componentRoutes,
  isPathUnderRoot,
  pathInRepo,
  relativePathForRepo,
  buildSnippet,
  hotspotRecord,
  gapRecord,
  promotionHealthAsGap,
  stratumRecord,
  summaryFieldForArtifact,
  normalizeStratumFilterValue,
  stratumQueryKey,
  compactString,
  endpointAliases,
  relationshipEndpointSets,
  setIntersects,
  relationshipMatchesDirection,
  relationshipMatchesReverse,
  relationshipKind,
  relationshipText,
  isContradictoryRelationship,
  claimRelationshipRecord,
  nestedWarnings,
  firstRecord,
};
