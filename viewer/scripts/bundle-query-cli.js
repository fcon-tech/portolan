#!/usr/bin/env node
/**
 * CLI for Portolan harness bundle queries (spec 095).
 * Usage: node bundle-query-cli.js <family> --bundle <dir> [options]
 */
const bundleQuery = require('./bundle-query');

const families = [
  'hotspots',
  'gaps',
  'landscape',
  'search',
  'symbol',
  'source',
  'atlas',
  'evidence-index',
  'claims',
  'repos',
  'relationships',
];

function printUsage() {
  const msg = `usage: portolan-bundle-query <family> --bundle <bundle-dir> [options]

Families:
  hotspots       --kind K --severity S --path PREFIX --text Q [--repo ID] --limit N [--full]
  gaps           --surface S --status S --limit N
  landscape      --section ID
  search         --q QUERY [--repo ID] [--path-scope PREFIX] --limit N
  symbol         --name NAME [--repo ID] [--kind K] --limit N
  source         --path PATH [--repo ID] [--line N] [--radius N] [--full]
  atlas          [--section components|surfaces|edges|gaps] [--target ID] [--repo ID] --limit N
  evidence-index [--family F] --limit N
  claims         [--tier analytical|synthetic|speculative] [--subject S] --limit N
  repos          [--repo ID] [--text Q] --limit N
  relationships  [--type T] [--repo ID] --limit N

Options:
  --bundle DIR   Portolan bundle directory (required)
  --limit N      Max records (default ${bundleQuery.DEFAULT_LIMIT}, max ${bundleQuery.MAX_LIMIT})
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
      case '--bundle':
        bundle = next;
        i++;
        break;
      case '--kind':
        opts.kind = next;
        i++;
        break;
      case '--severity':
        opts.severity = next;
        i++;
        break;
      case '--path':
        opts.path = next;
        i++;
        break;
      case '--path-scope':
        opts.pathScope = next;
        i++;
        break;
      case '--text':
        opts.text = next;
        i++;
        break;
      case '--q':
        opts.q = next;
        i++;
        break;
      case '--surface':
        opts.surface = next;
        i++;
        break;
      case '--status':
        opts.status = next;
        i++;
        break;
      case '--section':
        opts.section = next;
        i++;
        break;
      case '--name':
        opts.name = next;
        i++;
        break;
      case '--line':
        opts.line = next;
        i++;
        break;
      case '--radius':
        opts.radius = next;
        i++;
        break;
      case '--family':
        opts.family = next;
        i++;
        break;
      case '--tier':
        opts.tier = next;
        i++;
        break;
      case '--subject':
        opts.subject = next;
        i++;
        break;
      case '--repo':
        opts.repo = next;
        i++;
        break;
      case '--target':
        opts.target = next;
        i++;
        break;
      case '--type':
        opts.type = next;
        i++;
        break;
      case '--limit':
        opts.limit = next;
        i++;
        break;
      case '--full':
        opts.full = true;
        break;
      default:
        process.stderr.write(`unknown option: ${a}\n`);
        process.exit(2);
    }
  }

  if (!bundle) {
    process.stderr.write('--bundle is required\n');
    process.exit(2);
  }

  try {
    const result = bundleQuery.dispatch(bundle, family, opts);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exit(2);
  }
}

parseArgs(process.argv.slice(2));
