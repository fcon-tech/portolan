#!/usr/bin/env node
/**
 * Thin CLI driver for bounded bundle queries.
 *
 * Composition root: parses argv, wires the fs bundle-artifact-reader adapter +
 * source-file adapter into the query-bundle use-case facade, and prints the
 * result envelope as JSON. Mirrors the legacy viewer/scripts/bundle-query-cli.js
 * behaviour; this is the OpenSpec migrate-viewer-to-portolan-core replacement
 * reached by scripts/portolan-bundle-query.sh.
 *
 * Usage: node bundle-query-cli.mjs <family> --bundle <dir> [options]
 */
'use strict';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createBundleArtifactReader } = require('../src/adapters/bundle-artifact-reader.js');
const { createSourceFilePort } = require('../src/adapters/source-file.js');
const { dispatch } = require('../src/use-cases/query-bundle.js');
const { DEFAULT_LIMIT, MAX_LIMIT } = require('../src/domain/query-envelope.js');

const families = [
  'hotspots', 'gaps', 'landscape', 'overview', 'search', 'symbol', 'source',
  'selected-code', 'claim-check', 'atlas', 'evidence-index', 'claims', 'repos',
  'relationships', 'system-map', 'promotion-health', 'promoted-facts',
  'raw-artifacts', 'classified-sources',
];

function printUsage() {
  const msg = `usage: portolan-bundle-query <family> --bundle <bundle-dir> [options]

Families:
  hotspots       --kind K --severity S --path PREFIX --text Q [--repo ID] --limit N [--full]
  gaps           --surface S --status S --limit N
  landscape      --section ID
  overview       --limit N
  search         --q QUERY [--repo ID] [--path-scope PREFIX] --limit N
  symbol         --name NAME [--path PATH] [--repo ID] [--kind K] --limit N
  source         --path PATH [--repo ID] [--line N] [--radius N] [--full]
  selected-code  --path PATH [--symbol NAME] [--repo ID] [--line N] [--radius N] --limit N
  claim-check    --from ID --to ID [--kind K|--type T] [--text TEXT] --limit N
  atlas          [--section components|surfaces|edges|gaps] [--target ID] [--repo ID] --limit N
  evidence-index [--family F] --limit N
  claims         [--tier analytical|synthetic|speculative] [--subject S] --limit N
  repos          [--repo ID] [--text Q] --limit N
  relationships  [--type T] [--repo ID] --limit N
  system-map     [--section overview|components|repositories|surfaces|relationships|findings|unknowns|c4] [--kind K] [--id ID] [--q TEXT] --limit N
  promotion-health [--family F] [--status S] [--stratum S] --limit N
  promoted-facts   [--family F] [--status S] [--stratum S] --limit N
  raw-artifacts    [--family F] [--status S] [--stratum S] --limit N
  classified-sources [--family F] [--status S] [--stratum S] --limit N

Options:
  --bundle DIR   Portolan bundle directory (required)
  --limit N      Max records (default ${DEFAULT_LIMIT}, max ${MAX_LIMIT})
`;
  process.stderr.write(msg);
}

function parseArgs(argv) {
  if (argv.length === 0 || argv[0] === '-h' || argv[0] === '--help') {
    printUsage();
    process.exit(0);
  }
  const family = argv[0];
  if (!families.includes(family)) {
    process.stderr.write(`unknown family: ${family}\n`);
    printUsage();
    process.exit(2);
  }

  const opts = {};
  let bundle = '';
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    switch (a) {
      case '--bundle': bundle = next; i++; break;
      case '--kind': opts.kind = next; i++; break;
      case '--severity': opts.severity = next; i++; break;
      case '--path': opts.path = next; i++; break;
      case '--path-scope': opts.pathScope = next; i++; break;
      case '--text': opts.text = next; i++; break;
      case '--q': opts.q = next; i++; break;
      case '--surface': opts.surface = next; i++; break;
      case '--status': opts.status = next; i++; break;
      case '--section': opts.section = next; i++; break;
      case '--name': opts.name = next; i++; break;
      case '--symbol': opts.symbol = next; i++; break;
      case '--from': opts.from = next; i++; break;
      case '--to': opts.to = next; i++; break;
      case '--line': opts.line = next; i++; break;
      case '--radius': opts.radius = next; i++; break;
      case '--family': opts.family = next; i++; break;
      case '--stratum': opts.stratum = next; i++; break;
      case '--tier': opts.tier = next; i++; break;
      case '--subject': opts.subject = next; i++; break;
      case '--repo': opts.repo = next; i++; break;
      case '--target': opts.target = next; i++; break;
      case '--type': opts.type = next; i++; break;
      case '--id': opts.id = next; i++; break;
      case '--limit': opts.limit = next; i++; break;
      case '--full': opts.full = true; break;
      default:
        process.stderr.write(`unknown option: ${a}\n`);
        process.exit(2);
    }
  }

  if (!bundle) {
    process.stderr.write('--bundle is required\n');
    process.exit(2);
  }

  const reader = createBundleArtifactReader(bundle);
  const manifest = reader.readJson('manifest.json');
  const targetRoot = (manifest && manifest.target_root) || '';
  const sourceFile = createSourceFilePort({ reader, targetRoot });
  const ctx = { reader, sourceFile, bundlePath: reader.bundleDir };
  try {
    const result = dispatch(ctx, family, opts);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exit(2);
  }
}

parseArgs(process.argv.slice(2));
