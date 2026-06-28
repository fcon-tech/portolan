/**
 * Use-case: build the captain-facing handoff artifact.
 *
 * Reads receipt/scorecard/qna-eval via the reader, runs bounded bundle-query
 * families via the query-bundle facade, and derives a verified/not_assessed
 * verdict + a Markdown render. Pure transformation given the query results.
 *
 * Use-case layer — depends on domain + ports (via ctx) + sibling query-bundle.
 */
'use strict';

const path = require('path');
const queryBundle = require('./query-bundle');

const SCHEMA_VERSION = '0.1.0';

function query(ctx, family, opts = {}) {
  try {
    return queryBundle.dispatch(ctx, family, opts);
  } catch (err) {
    return {
      query: { family, opts },
      total_records: 0,
      total_records_relation: 'exact',
      records: [],
      warnings: [err.message],
    };
  }
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function first(records) {
  return Array.isArray(records) && records.length ? records[0] : null;
}

function recordIds(records, limit = 5) {
  return (records || [])
    .slice(0, limit)
    .map((record) => record.id || record.record_id || record.reference || '')
    .filter(Boolean);
}

function hasRelationshipEndpoints(record) {
  const hasDirectEndpoints = Boolean(record.from_repo && record.to_repo);
  const hasCohortEndpoints = Array.isArray(record.repos) && record.repos.length >= 2;
  return hasDirectEndpoints || hasCohortEndpoints;
}

function hasRelationshipRoute(record) {
  return Boolean(record.routes && (record.routes.graph || record.routes.api || record.routes.atlas));
}

function navigableRelationshipRecords(records) {
  return (records || []).filter((record) => hasRelationshipEndpoints(record) && hasRelationshipRoute(record));
}

function command(binDir, bundle, family, opts = {}) {
  const queryBin = path.join(binDir || '.portolan/bin', 'portolan-bundle-query.sh');
  const args = [queryBin, family, '--bundle', bundle];
  Object.entries(opts).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    const flag = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    args.push(`--${flag}`, String(value));
  });
  return args.map(shellQuote).join(' ');
}

function statusOf(value) {
  return value || 'not_assessed';
}

function buildHandoff(ctx) {
  const { reader, bundlePath: bundle } = ctx;
  const manifest = reader.readJson('manifest.json') || {};
  const receipt = reader.readJson('receipt.json') || {};
  const scorecard = reader.readJson('captain-atlas-scorecard.json') || {};
  const qna = reader.readJson('captain-qna-eval.json');

  const overview = query(ctx, 'overview', { limit: 5 });
  const repos = query(ctx, 'repos', { limit: 10 });
  const relationships = query(ctx, 'relationships', { limit: 10 });
  const hotspots = query(ctx, 'hotspots', { limit: 10 });
  const gaps = query(ctx, 'gaps', { limit: 10 });
  const claims = query(ctx, 'claims', { limit: 10 });

  const dimensions = Object.fromEntries((scorecard.dimensions || []).map((d) => [d.name, d.verdict || 'not_assessed']));
  const targetRoot = (receipt.target && receipt.target.root) || (scorecard.target && scorecard.target.root) || '';
  const binDir = targetRoot ? path.join(targetRoot, '.portolan/bin') : '.portolan/bin';
  const topRisk = first(hotspots.records);
  const topGap = first(gaps.records);
  const qnaStatus = (qna && qna.verdict) || 'not_assessed';
  const scanStatus = receipt.status || 'not_assessed';
  const scorecardStatus = scorecard.verdict || 'not_assessed';
  const drillDownStatus = statusOf(dimensions.drill_down);
  const relationshipCount = relationships.total_records || manifest.relationship_count || 0;
  const relationshipDrillDownRecords = navigableRelationshipRecords(relationships.records);
  const selectedAnswersVerified = Array.isArray(qna && qna.answers) &&
    qna.answers.filter((answer) => String(answer.id || '').startsWith('selected-')).length >= 2 &&
    qna.answers
      .filter((answer) => String(answer.id || '').startsWith('selected-'))
      .every((answer) => answer.verdict === 'verified' || answer.verdict === 'verified_with_warnings');
  const relationshipDrillDownStatus = relationshipDrillDownRecords.length > 0 ? 'verified' : 'not_assessed';
  const requiredQueries = [overview, repos];
  const requiredQueriesOk = requiredQueries.every((result) => Array.isArray(result.records) && result.records.length > 0);
  const verified =
    scanStatus === 'completed' &&
    scorecardStatus === 'verified' &&
    qnaStatus === 'verified' &&
    drillDownStatus === 'verified' &&
    selectedAnswersVerified &&
    relationshipDrillDownStatus === 'verified' &&
    requiredQueriesOk;

  return {
    schema_version: SCHEMA_VERSION,
    scenario: 'captain-atlas-handoff',
    generated_at: new Date().toISOString(),
    bundle_path: bundle,
    verdict: verified ? 'verified' : 'not_assessed',
    target: {
      root: targetRoot,
      repo_count: manifest.repo_count != null ? manifest.repo_count : ((scorecard.target && scorecard.target.repo_count) != null ? scorecard.target.repo_count : (repos.total_records != null ? repos.total_records : 0)),
      discovered_total: manifest.repo_discovered_total != null ? manifest.repo_discovered_total : (manifest.repo_count != null ? manifest.repo_count : 0),
    },
    statuses: {
      scan: statusOf(scanStatus),
      scorecard: statusOf(scorecardStatus),
      qna_eval: statusOf(qnaStatus),
      agent_autonomy: statusOf(dimensions.agent_autonomy),
      drill_down: drillDownStatus,
      selected_code_drill_down: selectedAnswersVerified ? 'verified' : 'not_assessed',
      relationship_drill_down: relationshipDrillDownStatus,
      scale: statusOf(dimensions.scale),
      portability: statusOf(dimensions.portability),
    },
    counts: {
      repos: repos.total_records || manifest.repo_count || 0,
      relationships: relationshipCount,
      relationship_drilldown_records: relationshipDrillDownRecords.length,
      hotspots: hotspots.total_records || manifest.hotspot_count || 0,
      gaps: gaps.total_records || manifest.gap_count || 0,
      claims: claims.total_records || 0,
      qna_answers: (qna && qna.answer_count) || 0,
    },
    first_useful_captain_insight: scorecard.first_useful_captain_insight || {},
    top_risk: topRisk ? {
      id: topRisk.id || topRisk.record_id || '',
      summary: topRisk.summary || topRisk.reason || topRisk.kind || '',
      route: (topRisk.routes && (topRisk.routes.atlas || topRisk.routes.source)) || '',
    } : null,
    top_gap: topGap ? {
      id: topGap.id || topGap.record_id || '',
      summary: topGap.summary || topGap.reason || topGap.status || '',
      route: (topGap.routes && topGap.routes.atlas) || '',
    } : null,
    next_actions: scorecard.next_actions || [],
    viewer_handoff: (scorecard.demo_evidence && scorecard.demo_evidence.viewer_handoff) || (receipt.viewer && receipt.viewer.launch_argv) || [],
    query_handoff: [
      command(binDir, bundle, 'overview', { limit: 5 }),
      command(binDir, bundle, 'repos', { limit: 10 }),
      command(binDir, bundle, 'relationships', { limit: 10 }),
      command(binDir, bundle, 'hotspots', { limit: 10 }),
      command(binDir, bundle, 'gaps', { limit: 10 }),
      command(binDir, bundle, 'selected-code', { repo: '<repo-id>', path: '<path>', line: '<line>', limit: 20 }),
    ],
    evidence: {
      receipt: path.join(bundle, 'receipt.json'),
      scorecard: path.join(bundle, 'captain-atlas-scorecard.json'),
      qna_eval: path.join(bundle, 'captain-qna-eval.json'),
      record_ids: {
        repos: recordIds(repos.records),
        relationships: recordIds(relationships.records),
        relationship_drilldown: recordIds(relationshipDrillDownRecords),
        hotspots: recordIds(hotspots.records),
        gaps: recordIds(gaps.records),
        claims: recordIds(claims.records),
      },
      query_warnings: [
        ...(overview.warnings || []), ...(repos.warnings || []), ...(relationships.warnings || []),
        ...(hotspots.warnings || []), ...(gaps.warnings || []), ...(claims.warnings || []),
      ],
      query_health: {
        required_queries_ok: requiredQueriesOk,
        relationship_drill_down_ok: relationshipDrillDownStatus === 'verified',
      },
    },
  };
}

function line(value, fallback = '') {
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

function renderMarkdown(report) {
  const nextActions = (report.next_actions || []).slice(0, 5);
  const queryCommands = report.query_handoff || [];
  const viewer = (report.viewer_handoff || []).map(shellQuote).join(' ');
  const fallbackViewer = [path.join(report.target.root || '.', '.portolan', 'bin', 'portolan-viewer.sh'), '--bundle', report.bundle_path]
    .map(shellQuote)
    .join(' ');
  return `# Portolan Captain Handoff

Verdict: ${report.verdict}
Bundle: \`${report.bundle_path}\`
Target: \`${line(report.target.root, 'unknown')}\`

## What Was Built

- Repos: ${report.counts.repos} visible (${report.target.discovered_total} discovered)
- Relationships: ${report.counts.relationships}
- Hotspots: ${report.counts.hotspots}
- Gaps: ${report.counts.gaps}
- Q&A answers: ${report.counts.qna_answers}

## First Useful Insight

${line(report.first_useful_captain_insight.summary, 'No first-useful insight was recorded.')}

## Top Inspection Targets

- Top risk: ${report.top_risk ? `${report.top_risk.id} - ${report.top_risk.summary}` : 'not_assessed'}
- Top gap: ${report.top_gap ? `${report.top_gap.id} - ${report.top_gap.summary}` : 'not_assessed'}

## Statuses

- scan: ${report.statuses.scan}
- scorecard: ${report.statuses.scorecard}
- qna_eval: ${report.statuses.qna_eval}
- agent_autonomy: ${report.statuses.agent_autonomy}
- drill_down: ${report.statuses.drill_down}
- scale: ${report.statuses.scale}
- portability: ${report.statuses.portability}

## Open The Atlas

\`\`\`bash
${viewer || fallbackViewer}
\`\`\`

## Query Handoff

\`\`\`bash
${queryCommands.join('\n')}
\`\`\`

## Next Actions

${nextActions.length ? nextActions.map((item) => `- ${line(item.status, 'not_assessed')}: ${line(item.summary || item.action || item.surface, 'inspect bundle')} (${line(item.evidence_path || item.evidence, 'no evidence path')})`).join('\n') : '- No next actions recorded.'}

## Evidence

- receipt: \`${report.evidence.receipt}\`
- scorecard: \`${report.evidence.scorecard}\`
- qna_eval: \`${report.evidence.qna_eval}\`
`;
}

module.exports = { buildHandoff, renderMarkdown };
