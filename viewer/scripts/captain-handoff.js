#!/usr/bin/env node
/**
 * Build a compact captain-facing handoff from bounded Portolan bundle artifacts.
 */
const fs = require('fs');
const path = require('path');
const bundleQuery = require('./bundle-query');

const SCHEMA_VERSION = '0.1.0';

function usage() {
  process.stderr.write(`usage: captain-handoff.js [--out-json FILE] [--out-md FILE] <bundle-dir>

Writes captain-handoff.json and captain-handoff.md from receipt, scorecard,
captain-qna-eval, and bounded bundle-query outputs.
`);
}

function parseArgs(argv) {
  const opts = { outJson: '', outMd: '' };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      usage();
      process.exit(0);
    }
    if (arg === '--out-json') {
      opts.outJson = argv[i + 1] || '';
      i += 1;
      continue;
    }
    if (arg === '--out-md') {
      opts.outMd = argv[i + 1] || '';
      i += 1;
      continue;
    }
    if (arg.startsWith('-')) throw new Error(`unknown option: ${arg}`);
    positional.push(arg);
  }
  if (positional.length !== 1) throw new Error('bundle-dir is required');
  const bundle = path.resolve(positional[0]);
  return {
    bundle,
    outJson: opts.outJson || path.join(bundle, 'captain-handoff.json'),
    outMd: opts.outMd || path.join(bundle, 'captain-handoff.md'),
  };
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function query(bundle, family, opts = {}) {
  try {
    return bundleQuery.dispatch(bundle, family, opts);
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
  return Boolean(record.routes?.graph || record.routes?.api || record.routes?.atlas);
}

function navigableRelationshipRecords(records) {
  return (records || []).filter((record) =>
    hasRelationshipEndpoints(record) &&
    hasRelationshipRoute(record));
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

function buildHandoff(bundle) {
  const manifest = readJson(path.join(bundle, 'manifest.json'), {});
  const receipt = readJson(path.join(bundle, 'receipt.json'), {});
  const scorecard = readJson(path.join(bundle, 'captain-atlas-scorecard.json'), {});
  const qna = readJson(path.join(bundle, 'captain-qna-eval.json'), null);

  const overview = query(bundle, 'overview', { limit: 5 });
  const repos = query(bundle, 'repos', { limit: 10 });
  const relationships = query(bundle, 'relationships', { limit: 10 });
  const hotspots = query(bundle, 'hotspots', { limit: 10 });
  const gaps = query(bundle, 'gaps', { limit: 10 });
  const claims = query(bundle, 'claims', { limit: 10 });

  const dimensions = Object.fromEntries((scorecard.dimensions || []).map((d) => [d.name, d.verdict || 'not_assessed']));
  const targetRoot = receipt.target?.root || scorecard.target?.root || '';
  const binDir = targetRoot ? path.join(targetRoot, '.portolan/bin') : '.portolan/bin';
  const topRisk = first(hotspots.records);
  const topGap = first(gaps.records);
  const qnaStatus = qna?.verdict || 'not_assessed';
  const scanStatus = receipt.status || 'not_assessed';
  const scorecardStatus = scorecard.verdict || 'not_assessed';
  const drillDownStatus = statusOf(dimensions.drill_down);
  const relationshipCount = relationships.total_records || manifest.relationship_count || 0;
  const relationshipDrillDownRecords = navigableRelationshipRecords(relationships.records);
  const selectedAnswersVerified = Array.isArray(qna?.answers) &&
    qna.answers.filter((answer) => String(answer.id || '').startsWith('selected-')).length >= 2 &&
    qna.answers
      .filter((answer) => String(answer.id || '').startsWith('selected-'))
      .every((answer) => answer.verdict === 'verified' || answer.verdict === 'verified_with_warnings');
  const relationshipDrillDownStatus = relationshipDrillDownRecords.length > 0
    ? 'verified'
    : 'not_assessed';
  const requiredQueries = [overview, repos];
  const requiredQueriesOk = requiredQueries.every((result) =>
    Array.isArray(result.records) &&
    result.records.length > 0);
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
      repo_count: manifest.repo_count ?? scorecard.target?.repo_count ?? repos.total_records ?? 0,
      discovered_total: manifest.repo_discovered_total ?? manifest.repo_count ?? 0,
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
      qna_answers: qna?.answer_count || 0,
    },
    first_useful_captain_insight: scorecard.first_useful_captain_insight || {},
    top_risk: topRisk ? {
      id: topRisk.id || topRisk.record_id || '',
      summary: topRisk.summary || topRisk.reason || topRisk.kind || '',
      route: topRisk.routes?.atlas || topRisk.routes?.source || '',
    } : null,
    top_gap: topGap ? {
      id: topGap.id || topGap.record_id || '',
      summary: topGap.summary || topGap.reason || topGap.status || '',
      route: topGap.routes?.atlas || '',
    } : null,
    next_actions: scorecard.next_actions || [],
    viewer_handoff: scorecard.demo_evidence?.viewer_handoff || receipt.viewer?.launch_argv || [],
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
        ...overview.warnings || [],
        ...repos.warnings || [],
        ...relationships.warnings || [],
        ...hotspots.warnings || [],
        ...gaps.warnings || [],
        ...claims.warnings || [],
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

function main() {
  try {
    const opts = parseArgs(process.argv.slice(2));
    if (!fs.existsSync(opts.bundle)) throw new Error(`bundle not found: ${opts.bundle}`);
    const report = buildHandoff(opts.bundle);
    fs.writeFileSync(opts.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(opts.outMd, renderMarkdown(report));
    process.stdout.write(`captain-handoff: wrote ${opts.outJson}\n`);
    process.stdout.write(`captain-handoff: wrote ${opts.outMd}\n`);
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    usage();
    process.exit(2);
  }
}

if (require.main === module) main();

module.exports = { buildHandoff, renderMarkdown };
