#!/usr/bin/env node
/**
 * Generator for the semantic component investigation bundle (captain-atlas 17).
 *
 * Loads a fixture, validates it, and writes a producer-compatible
 * semantic-investigation.json into the output nav-bundle dir (alongside
 * navigation-index.jsonl). A future producer overwrites this file with real
 * output; the fixture path is the same shape.
 *
 * The output JSON is what the shell + browser harness consume. It is
 * machine-readable: sample.components drives which ids are "selected".
 *
 * Usage: node scripts/build-semantic-investigation.mjs --fixture <si.json> --out <dir>
 *   --fixture  source fixture (with sources_ref)
 *   --out      output nav-bundle directory (semantic-investigation.json written here)
 *   --sources-dir  directory containing sources.json + notes/ (default: fixture dir)
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { validateShape } = require('../src/domain/semantic-investigation');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--fixture' && argv[i + 1]) args.fixture = path.resolve(argv[++i]);
    else if (a === '--out' && argv[i + 1]) args.out = path.resolve(argv[++i]);
    else if (a === '--sources-dir' && argv[i + 1]) args.sourcesDir = path.resolve(argv[++i]);
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.fixture || !args.out) {
    console.error('usage: build-semantic-investigation.mjs --fixture <si.json> --out <dir> [--sources-dir <dir>]');
    process.exit(args.help ? 0 : 2);
  }
  if (!fs.existsSync(args.fixture)) {
    console.error(`error: fixture not found: ${args.fixture}`);
    process.exit(1);
  }
  let si;
  try {
    si = JSON.parse(fs.readFileSync(args.fixture, 'utf8'));
  } catch (e) {
    console.error(`error: fixture is not valid JSON: ${args.fixture}: ${e.message}`);
    process.exit(1);
  }

  // Load + inline the source registry into the output so the bundle is
  // self-contained (the shell reads sources off the inlined object, not a
  // separate file). Keep curated-note note_path text out of the bundle by
  // design: the shell surfaces the card label/summary/url, not the note body.
  const sourcesDir = args.sourcesDir || path.dirname(args.fixture);
  const sourcesPath = si.sources_ref ? path.join(sourcesDir, si.sources_ref) : path.join(sourcesDir, 'sources.json');
  if (!fs.existsSync(sourcesPath)) {
    console.error(`error: source-card registry not found: ${sourcesPath}`);
    process.exit(1);
  }
  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));
  } catch (e) {
    console.error(`error: source-card registry is not valid JSON: ${sourcesPath}: ${e.message}`);
    process.exit(1);
  }
  si.sources = registry.sources || [];

  // Validate BEFORE writing. Never emit an invalid contract.
  const violations = validateShape(si, { offline: true });
  if (violations.length) {
    console.error(`\n${violations.length} semantic-investigation violation(s); not writing output:`);
    for (const v of violations) {
      const at = v.componentId ? ` [${v.componentId}]` : '';
      console.error(`  ✗ ${v.code}${at}: ${v.message}`);
    }
    process.exit(1);
  }

  fs.mkdirSync(args.out, { recursive: true });
  const outPath = path.join(args.out, 'semantic-investigation.json');
  fs.writeFileSync(outPath, JSON.stringify(si, null, 2) + '\n');
  const selected = si.sample.components.length;
  console.error(`semantic-investigation: wrote ${outPath} (${si.components.length} components, ${selected} selected, ${si.sources.length} source cards)`);
}

main();
