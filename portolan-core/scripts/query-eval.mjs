#!/usr/bin/env node
/**
 * Thin CLI driver: build the captain Q&A acceptance artifact.
 * Composition root over use-cases/run-query-eval. Mirrors the legacy
 * viewer/scripts/query-eval.js.
 *
 * Usage: node query-eval.mjs [--out FILE] <bundle-dir>
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createBundleArtifactReader } = require('../src/adapters/bundle-artifact-reader.js');
const { createSourceFilePort } = require('../src/adapters/source-file.js');
const { buildEval } = require('../src/use-cases/run-query-eval.js');

function bundleContext(bundle) {
  const reader = createBundleArtifactReader(bundle);
  const manifest = reader.readJson('manifest.json');
  const targetRoot = (manifest && manifest.target_root) || '';
  const sourceFile = createSourceFilePort({ reader, targetRoot });
  return { reader, sourceFile, bundlePath: reader.bundleDir };
}

function parseArgs(argv) {
  const opts = { out: '' };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      process.stderr.write('usage: query-eval.mjs [--out FILE] <bundle-dir>\n');
      process.exit(0);
    }
    if (arg === '--out') { opts.out = argv[i + 1] || ''; i += 1; continue; }
    if (arg.startsWith('-')) throw new Error(`unknown option: ${arg}`);
    positional.push(arg);
  }
  if (positional.length < 1) throw new Error('bundle-dir is required');
  return { out: opts.out, bundle: path.resolve(positional[0]) };
}

function main() {
  try {
    const opts = parseArgs(process.argv.slice(2));
    if (!fs.existsSync(opts.bundle)) throw new Error(`bundle not found: ${opts.bundle}`);
    const report = buildEval(bundleContext(opts.bundle));
    const text = `${JSON.stringify(report, null, 2)}\n`;
    if (opts.out) {
      fs.writeFileSync(opts.out, text);
    } else {
      process.stdout.write(text);
    }
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.stderr.write('usage: query-eval.mjs [--out FILE] <bundle-dir>\n');
    process.exit(2);
  }
}

main();
