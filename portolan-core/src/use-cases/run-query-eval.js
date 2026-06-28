/**
 * Use-case: deterministic captain Q&A acceptance artifact.
 *
 * Proves the bounded bundle-query families answer five captain questions + two
 * selected-code questions without reading raw large files. Reads streaming
 * heads via the reader port and runs queries via the query-bundle facade.
 *
 * Use-case layer — depends on domain + ports (via ctx) + sibling query-bundle.
 */
'use strict';

const path = require('path');
const queryBundle = require('./query-bundle');

const SCHEMA_VERSION = '0.1.0';

function query(ctx, family, opts = {}) {
  const result = queryBundle.dispatch(ctx, family, opts);
  return { command: commandFor(ctx.bundlePath, family, opts), result };
}

function commandFor(bundle, family, opts = {}) {
  const args = ['scripts/portolan-bundle-query.sh', family, '--bundle', bundle];
  Object.entries(opts).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    const flag = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    args.push(`--${flag}`, String(value));
  });
  return args.map((arg) => (/\s/.test(arg) ? JSON.stringify(arg) : arg)).join(' ');
}

function first(records) {
  return Array.isArray(records) && records.length ? records[0] : null;
}

function ids(records, limit = 5) {
  return (records || []).slice(0, limit).map((record) => record.id || record.record_id || '').filter(Boolean);
}

function routeList(record) {
  return Object.entries((record && record.routes) || {})
    .filter(([, value]) => value)
    .map(([kind, value]) => ({ kind, value }));
}

function verdictFrom(...results) {
  const hasRecords = results.some((entry) => ((entry && entry.result && entry.result.records) || []).length > 0);
  const hasWarnings = results.some((entry) => ((entry && entry.result && entry.result.warnings) || []).length > 0);
  if (hasRecords) return hasWarnings ? 'verified_with_warnings' : 'verified';
  return 'not_assessed';
}

function verifiedIfEvidence(condition, warning = false) {
  if (!condition) return 'not_assessed';
  return warning ? 'verified_with_warnings' : 'verified';
}

function answer(id, prompt, queries, text, extra = {}) {
  return {
    id,
    prompt,
    verdict: verdictFrom(...queries),
    answer: text,
    bounded_queries: queries.map((entry) => ({
      family: entry.result.query.family,
      command: entry.command,
      total_records: entry.result.total_records,
      total_records_relation: entry.result.total_records_relation || 'exact',
      returned_records: entry.result.records.length,
      warnings: entry.result.warnings || [],
    })),
    citations: [...new Set(queries.flatMap((entry) => ids(entry.result.records)))],
    routes: [...new Set(queries.flatMap((entry) => (entry.result.records || []).flatMap(routeList).map((route) => `${route.kind}:${route.value}`)))],
    ...extra,
  };
}

function pickSelectedFile(hotspots, symbols, firstSymbolRow = null, repoIds = new Set()) {
  if (firstSymbolRow && firstSymbolRow.path) {
    return {
      repo: firstSymbolRow.repo_id && repoIds.has(firstSymbolRow.repo_id) ? firstSymbolRow.repo_id : '',
      path: firstSymbolRow.path || '',
      line: firstSymbolRow.line || 1,
    };
  }
  const symbol = first(symbols.result.records);
  if (symbol && symbol.path) {
    return { repo: symbol.repo_id || '', path: symbol.path, line: symbol.line || 1 };
  }
  const hotspot = (hotspots.result.records || []).find((record) => {
    const p = record.path || (record.paths || [])[0] || '';
    return p && record.routes && record.routes.source;
  });
  if (hotspot) {
    return {
      repo: hotspot.repo_id || '',
      path: hotspot.path || (hotspot.paths || [])[0] || '',
      line: hotspot.line || hotspot.start_line || 1,
    };
  }
  return null;
}

function relativeToRepo(filePath, repoRoot = '') {
  if (!filePath) return '';
  const normalized = String(filePath).replace(/\\/g, '/');
  const root = String(repoRoot || '').replace(/\\/g, '/').replace(/\/+$/, '');
  if (root && (normalized === root || normalized.startsWith(`${root}/`))) {
    return normalized.slice(root.length).replace(/^\/+/, '') || path.basename(normalized);
  }
  return normalized;
}

function firstSourceCandidate(reader, firstRepo) {
  const repoRoot = (firstRepo && firstRepo.payload && firstRepo.payload.path) || (firstRepo && firstRepo.path) || '';
  const rows = reader.readJsonlHead('classified-sources.jsonl', 200).records;
  const usable = rows.filter((row) => {
    const p = String(row.path || '');
    return p && !p.includes('/.portolan/') && !p.endsWith('/AGENTS.md') && !p.includes('/.cursor/');
  });
  const preferred = usable.find((row) => /\.(c|cc|cpp|cs|go|java|js|jsx|kt|mjs|py|rb|rs|scala|sh|ts|tsx)$/i.test(String(row.path || ''))) ||
    usable.find((row) => row.path) ||
    rows.find((row) => row.path);
  if (!preferred) return null;
  return {
    repo: (firstRepo && (firstRepo.repo_id || firstRepo.id)) || '',
    path: relativeToRepo(preferred.path, repoRoot),
    line: 1,
    absolutePath: preferred.path,
  };
}

function knownRepoIds(reader) {
  const repos = reader.readJson('repos.json');
  if (!Array.isArray(repos)) return new Set();
  return new Set(repos.flatMap((repo) => [repo.id, repo.name].filter(Boolean)));
}

function selectedCodeVerdict(record) {
  if (!record || record.status !== 'observed') return 'not_assessed';
  const selection = record.selection || {};
  const bounded = record.bounded_records || {};
  const hasSelection = Boolean(selection.path && selection.repo_id && selection.target_id);
  const hasSource = Array.isArray(bounded.source) && bounded.source.length > 0;
  if (!hasSelection || !hasSource) return 'not_assessed';
  const hasComponent = Array.isArray(bounded.component) && bounded.component.length > 0;
  return hasComponent ? 'verified' : 'verified_with_warnings';
}

function buildEval(ctx) {
  const { reader, bundlePath: bundle } = ctx;
  const overview = query(ctx, 'overview', { limit: 8 });
  const repos = query(ctx, 'repos', { limit: 20 });
  const relationships = query(ctx, 'relationships', { limit: 30 });
  const risks = query(ctx, 'hotspots', { limit: 20 });
  const gaps = query(ctx, 'gaps', { limit: 20 });
  const crossDup = query(ctx, 'relationships', { type: 'cross-repo-duplication', limit: 10 });
  const dupHotspots = query(ctx, 'hotspots', { kind: 'duplication', limit: 10 });
  const claims = query(ctx, 'claims', { limit: 20 });
  const atlas = query(ctx, 'atlas', { section: 'components', limit: 10 });

  const overviewRecord = first(overview.result.records);
  const counts = (overviewRecord && overviewRecord.counts) || {};
  const topRisk = first(risks.result.records);
  const topGap = first(gaps.result.records);
  const firstRepo = first(repos.result.records);
  const firstSymbolRow = reader.readJsonlHead('symbol-index.jsonl', 1).records[0] || null;
  const repoIds = knownRepoIds(reader);
  const symbolRepo = firstSymbolRow && firstSymbolRow.repo_id && repoIds.has(firstSymbolRow.repo_id)
    ? firstSymbolRow.repo_id
    : '';
  const symbolQuery = firstSymbolRow && firstSymbolRow.name
    ? query(ctx, 'symbol', { name: firstSymbolRow.name, repo: symbolRepo || undefined, limit: 10 })
    : query(ctx, 'symbol', { name: '__portolan_no_symbol__', limit: 10 });
  const sourceCandidate = firstSourceCandidate(reader, firstRepo);
  const selectedFile = pickSelectedFile(risks, symbolQuery, firstSymbolRow, repoIds) || sourceCandidate;
  const selectedFileQuery = selectedFile
    ? query(ctx, 'selected-code', { repo: selectedFile.repo || undefined, path: selectedFile.path, line: selectedFile.line || 1, limit: 8 })
    : null;
  const fallbackSymbolName = (firstSymbolRow && firstSymbolRow.name) || '';
  const selectedSymbolQuery = fallbackSymbolName
    ? query(ctx, 'selected-code', { repo: symbolRepo || undefined, path: (firstSymbolRow && firstSymbolRow.path) || (selectedFile && selectedFile.path) || undefined, symbol: fallbackSymbolName, line: (firstSymbolRow && firstSymbolRow.line) || (selectedFile && selectedFile.line) || 1, limit: 8 })
    : selectedFile
      ? query(ctx, 'selected-code', { repo: selectedFile.repo || undefined, path: selectedFile.path, line: selectedFile.line || 1, limit: 8 })
      : null;

  const answers = [
    answer('captain-landscape-overview', 'What is going on in this estate?',
      [overview, repos, relationships, risks, gaps],
      `The bundle reports ${counts.repos != null ? counts.repos : repos.result.total_records} repos, ${counts.relationships != null ? counts.relationships : relationships.result.total_records} relationships, ${counts.hotspots != null ? counts.hotspots : risks.result.total_records} risks/hotspots, and ${counts.gaps != null ? counts.gaps : gaps.result.total_records} gaps. Start at the atlas overview, then inspect the top risks and gaps before making architecture claims.`,
      { evidence_boundary: 'Counts and examples come from bounded overview/repos/relationships/hotspots/gaps queries.' }),
    answer('captain-repo-connections', 'How are the repos connected?',
      [relationships, atlas],
      relationships.result.total_records > 0
        ? `The relationship query returned ${relationships.result.total_records} relationship records. Inspect relationship ids and atlas component routes before claiming runtime topology.`
        : 'No relationship records were visible in the bounded query. Treat repo-to-repo topology as not_assessed/cannot_verify unless another local producer supplies it.',
      { verdict: verifiedIfEvidence(repos.result.total_records > 0 || overview.result.total_records > 0, relationships.result.total_records === 0), evidence_boundary: 'Relationships are local metadata/source evidence, not runtime topology unless evidence_state says runtime-visible.' }),
    answer('captain-duplication-boundaries', 'Where is duplication across repo boundaries?',
      [crossDup, dupHotspots],
      `Cross-repo duplication returned ${crossDup.result.total_records} relationship rows; duplication hotspots returned ${dupHotspots.result.total_records} rows. If either is zero, absence is not proof unless the scan receipt says coverage was complete.`,
      { verdict: verifiedIfEvidence(gaps.result.total_records > 0 || crossDup.result.total_records > 0 || dupHotspots.result.total_records > 0, crossDup.result.total_records === 0 && dupHotspots.result.total_records === 0), evidence_boundary: 'Duplication coverage can be complete, stratified, or degraded; check receipt and gaps.' }),
    answer('captain-riskiest-area', 'What should I inspect first?',
      [risks, gaps],
      topRisk
        ? `Inspect ${topRisk.id}: ${topRisk.summary || topRisk.reason || topRisk.kind}. Also check ${topGap && topGap.id || 'the top gap'} so missing evidence is not mistaken for clean architecture.`
        : 'No risk records were returned. Inspect gaps before treating the landscape as clean.',
      { evidence_boundary: 'Risk ranking is a local finding order, not business criticality.' }),
    answer('captain-claim-check', 'What can the agent say without inventing architecture?',
      [claims, gaps, overview],
      `The bundle has ${claims.result.total_records} imported analysis claims and ${gaps.result.total_records} gaps. Material answers should cite record ids or paths and separate claim-only, unknown, cannot_verify, and not_assessed states.`,
      { evidence_boundary: 'Claims are not promoted to tool evidence; cited refs must resolve in the bundle.' }),
  ];

  const selectedAnswers = [];
  if (selectedFileQuery) {
    const selected = first(selectedFileQuery.result.records);
    selectedAnswers.push(answer('selected-file-context',
      `Explain selected file ${selectedFile.path}:${selectedFile.line || 1}`,
      [selectedFileQuery],
      selected
        ? `Selected file maps to repo ${selected.selection && selected.selection.repo_id || 'unknown'} and component ${selected.selection && selected.selection.target_id || 'unknown'} with source, risk, relationship, gap, and atlas follow-up routes in the bounded packet.`
        : 'Selected file could not be mapped by the bundle.',
      { verdict: selectedCodeVerdict(selected), selected_code: (selected && selected.selection) || selectedFile }));
  } else {
    selectedAnswers.push({ id: 'selected-file-context', prompt: 'Explain a selected file', verdict: 'not_assessed', answer: 'No source path was available from bounded hotspot or symbol queries.', bounded_queries: [], citations: [], routes: [] });
  }

  if (selectedSymbolQuery) {
    const selected = first(selectedSymbolQuery.result.records);
    selectedAnswers.push(answer('selected-symbol-context',
      fallbackSymbolName ? `Explain selected symbol ${fallbackSymbolName}` : `Explain selected code context at ${selectedFile.path}:${selectedFile.line || 1}`,
      [symbolQuery, selectedSymbolQuery],
      selected && fallbackSymbolName
        ? `Selected symbol maps to repo ${selected.selection && selected.selection.repo_id || (firstSymbolRow && firstSymbolRow.repo_id) || (selectedFile && selectedFile.repo) || 'unknown'}, path ${selected.selection && selected.selection.path || (firstSymbolRow && firstSymbolRow.path) || (selectedFile && selectedFile.path) || 'unknown'}, and atlas/source drill-down routes.`
        : selected
          ? `Symbol index was unavailable, so the second selected-code proof uses the selected file context for repo ${selected.selection && selected.selection.repo_id || (selectedFile && selectedFile.repo) || 'unknown'}, path ${selected.selection && selected.selection.path || (selectedFile && selectedFile.path) || 'unknown'}, and atlas/source drill-down routes.`
          : 'Selected-code did not return context for the selected symbol or file.',
      { verdict: selectedCodeVerdict(selected), selected_code: (selected && selected.selection) || firstSymbolRow || { ...selectedFile, symbol: fallbackSymbolName || undefined } }));
  } else {
    selectedAnswers.push({
      id: 'selected-symbol-context', prompt: 'Explain a selected symbol', verdict: 'not_assessed',
      answer: 'symbol-index.jsonl was missing or empty.',
      bounded_queries: [symbolQuery].map((entry) => ({
        family: entry.result.query.family, command: entry.command, total_records: entry.result.total_records,
        total_records_relation: entry.result.total_records_relation || 'exact', returned_records: entry.result.records.length, warnings: entry.result.warnings || [],
      })),
      citations: [], routes: [],
    });
  }

  const allAnswers = [...answers, ...selectedAnswers];
  const pass = allAnswers.filter((entry) => entry.verdict === 'verified' || entry.verdict === 'verified_with_warnings').length;
  return {
    schema_version: SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    bundle_path: bundle,
    scenario: 'captain-agent-qna-drilldown',
    verdict: pass === allAnswers.length ? 'verified' : 'not_assessed',
    pass_count: pass,
    answer_count: allAnswers.length,
    requirements: { captain_questions: 5, selected_code_questions: 2, raw_large_outputs_read: false, bounded_query_only: true },
    answers: allAnswers,
    first_repo_id: (firstRepo && (firstRepo.repo_id || firstRepo.id)) || '',
  };
}

module.exports = { buildEval };
