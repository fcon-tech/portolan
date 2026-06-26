#!/usr/bin/env node
/**
 * Query an Atlas Navigation Index bundle (captain-atlas 13 §Agent Handoff).
 *
 * Follow-up-agent query surface over the parsed artifacts. Outputs JSON.
 *
 * Usage:
 *   node query-atlas-navigation.mjs --bundle <dir> <op> [filters]
 *
 * Ops:
 *   list-routes         [--family <f>] [--subject <id>]
 *   route               --id <route_id>
 *   findings-by-route   --id <route_id>
 *   probes-by-route     --id <route_id>
 *   list-findings       [--type <t>] [--severity <s>]
 *   list-probes         [--state <s>]
 *   coverage-by-subject --subject <id>
 *   receipt
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { readJsonl } from './read-jsonl.mjs';

const require = createRequire(import.meta.url);
const { queryAtlasNavigation } = require('../src/use-cases/query-atlas-navigation.js');

function parseArgs(argv) {
  const args = { filters: {} };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--bundle') { if (!argv[i + 1] || argv[i + 1].startsWith('--')) { console.error('error: --bundle requires a value'); process.exit(2); } args.bundle = path.resolve(argv[++i]); }
    else if (a === '--id') { if (!argv[i + 1] || argv[i + 1].startsWith('--')) { console.error('error: --id requires a value'); process.exit(2); } args.filters.id = argv[++i]; }
    else if (a === '--subject') { if (!argv[i + 1] || argv[i + 1].startsWith('--')) { console.error('error: --subject requires a value'); process.exit(2); } args.filters.subject = argv[++i]; }
    else if (a === '--family') { if (!argv[i + 1] || argv[i + 1].startsWith('--')) { console.error('error: --family requires a value'); process.exit(2); } args.filters.family = argv[++i]; }
    else if (a === '--type') { if (!argv[i + 1] || argv[i + 1].startsWith('--')) { console.error('error: --type requires a value'); process.exit(2); } args.filters.type = argv[++i]; }
    else if (a === '--severity') { if (!argv[i + 1] || argv[i + 1].startsWith('--')) { console.error('error: --severity requires a value'); process.exit(2); } args.filters.severity = argv[++i]; }
    else if (a === '--state') { if (!argv[i + 1] || argv[i + 1].startsWith('--')) { console.error('error: --state requires a value'); process.exit(2); } args.filters.state = argv[++i]; }
    else if (a === '--limit') {
      if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) { console.error('error: --limit requires a non-negative integer value'); process.exit(2); }
      const n = Number(argv[++i]);
      if (!Number.isInteger(n) || n < 0) { console.error(`error: --limit must be a non-negative integer (got '${argv[i]}')`); process.exit(2); }
      args.filters.limit = n;
    }
    else if (a === '--help' || a === '-h') args.help = true;
    else if (!a.startsWith('--')) args.op = a;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.bundle || !args.op) {
    console.error('usage: query-atlas-navigation.mjs --bundle <dir> <op> [--id|--subject|--family|--type|--severity|--state|--limit]');
    console.error('ops: list-routes, route, findings-by-route, probes-by-route, list-findings, list-probes, coverage-by-subject, receipt');
    process.exit(args.help ? 0 : 2);
  }

  const dir = args.bundle;
  const navAtlas = {
    navigationIndex: readJsonl(path.join(dir, 'navigation-index.jsonl')),
    coverageMatrix: readJsonl(path.join(dir, 'coverage-matrix.jsonl')),
    findings: readJsonl(path.join(dir, 'atlas-findings.jsonl')),
    unknownProbes: readJsonl(path.join(dir, 'unknown-probes.jsonl')),
    evidence: readJsonl(path.join(dir, 'evidence.jsonl')),
  };
  try {
    navAtlas.receiptValidation = JSON.parse(fs.readFileSync(path.join(dir, 'receipt-validation.json'), 'utf8'));
  } catch { navAtlas.receiptValidation = {}; }

  const result = queryAtlasNavigation(navAtlas, args.op, args.filters);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

main();
