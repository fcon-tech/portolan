#!/usr/bin/env node
/**
 * Thin CLI driver: build the captain-facing handoff (JSON + Markdown).
 * Composition root over use-cases/build-handoff. Mirrors the legacy
 * viewer/scripts/captain-handoff.js.
 *
 * Usage: node captain-handoff.mjs [--out-json FILE] [--out-md FILE] <bundle-dir>
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createBundleArtifactReader } = require('../src/adapters/bundle-artifact-reader.js');
const { createSourceFilePort } = require('../src/adapters/source-file.js');
const { buildHandoff, renderMarkdown } = require('../src/use-cases/build-handoff.js');

function bundleContext(bundle) {
  const reader = createBundleArtifactReader(bundle);
  const manifest = reader.readJson('manifest.json');
  const targetRoot = (manifest && manifest.target_root) || '';
  const sourceFile = createSourceFilePort({ reader, targetRoot });
  return { reader, sourceFile, bundlePath: reader.bundleDir };
}

function parseArgs(argv) {
  const opts = { outJson: '', outMd: '' };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      process.stderr.write('usage: captain-handoff.mjs [--out-json FILE] [--out-md FILE] <bundle-dir>\n');
      process.exit(0);
    }
    if (arg === '--out-json') { opts.outJson = argv[i + 1] || ''; i += 1; continue; }
    if (arg === '--out-md') { opts.outMd = argv[i + 1] || ''; i += 1; continue; }
    if (arg.startsWith('-')) throw new Error(`unknown option: ${arg}`);
    positional.push(arg);
  }
  if (positional.length !== 1) throw new Error('bundle-dir is required');
  const bundle = path.resolve(positional[0]);
  return { bundle, outJson: opts.outJson || path.join(bundle, 'captain-handoff.json'), outMd: opts.outMd || path.join(bundle, 'captain-handoff.md') };
}

function main() {
  try {
    const opts = parseArgs(process.argv.slice(2));
    if (!fs.existsSync(opts.bundle)) throw new Error(`bundle not found: ${opts.bundle}`);
    const report = buildHandoff(bundleContext(opts.bundle));
    fs.writeFileSync(opts.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(opts.outMd, renderMarkdown(report));
    process.stdout.write(`captain-handoff: wrote ${opts.outJson}\n`);
    process.stdout.write(`captain-handoff: wrote ${opts.outMd}\n`);
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.stderr.write('usage: captain-handoff.mjs [--out-json FILE] [--out-md FILE] <bundle-dir>\n');
    process.exit(2);
  }
}

main();
