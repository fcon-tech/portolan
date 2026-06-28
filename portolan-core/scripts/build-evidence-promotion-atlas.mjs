#!/usr/bin/env node
/**
 * Thin CLI driver: build/validate the evidence-promotion atlas.
 *
 * Composition root over use-cases/build-promotion-atlas + validate-promotion-atlas.
 * Reads env limits HERE (the only place env is touched), wires the reader +
 * source-inventory adapters, and persists build artifacts. Mirrors the legacy
 * viewer/scripts/evidence-promotion-atlas.js CLI surface.
 *
 * Usage:
 *   node build-evidence-promotion-atlas.mjs build <bundle-dir> [target-root]
 *   node build-evidence-promotion-atlas.mjs validate <bundle-dir> [--completion]
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createBundleArtifactReader } = require('../src/adapters/bundle-artifact-reader.js');
const { createSourceInventoryFs } = require('../src/adapters/source-inventory-fs.js');
const { buildPromotionAtlas } = require('../src/use-cases/build-promotion-atlas.js');
const { validatePromotionAtlas } = require('../src/use-cases/validate-promotion-atlas.js');

function positiveIntEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] || '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function usage() {
  process.stderr.write('usage: build-evidence-promotion-atlas.mjs build <bundle-dir> [target-root]\n');
  process.stderr.write('       build-evidence-promotion-atlas.mjs validate <bundle-dir> [--completion]\n');
}

function writeJson(file, obj) {
  fs.writeFileSync(file, `${JSON.stringify(obj, null, 2)}\n`);
}
function writeJsonl(file, rows) {
  fs.writeFileSync(file, rows.map((row) => JSON.stringify(row)).join('\n') + (rows.length ? '\n' : ''));
}

function runBuild(bundleDir, targetRootArg) {
  const reader = createBundleArtifactReader(bundleDir);
  const manifest = reader.readJson('manifest.json');
  const targetRoot = targetRootArg || (manifest && manifest.target_root) || process.cwd();
  const inventory = createSourceInventoryFs(positiveIntEnv('PORTOLAN_EVIDENCE_SOURCE_CLASSIFICATION_LIMIT', 5000));
  const limits = {
    sourceClassificationLimit: positiveIntEnv('PORTOLAN_EVIDENCE_SOURCE_CLASSIFICATION_LIMIT', 5000),
    promotedFactRowLimit: positiveIntEnv('PORTOLAN_EVIDENCE_PROMOTED_FACT_LIMIT', 200),
    querySampleLimit: positiveIntEnv('PORTOLAN_PROMOTION_QUERY_SAMPLE_LIMIT', 200),
  };
  const result = buildPromotionAtlas({ reader, inventory, targetRoot, generatedAt: new Date().toISOString(), limits });
  for (const [name, data] of Object.entries(result.jsonArtifacts)) writeJson(path.join(bundleDir, name), data);
  for (const [name, rows] of Object.entries(result.jsonlArtifacts)) writeJsonl(path.join(bundleDir, name), rows);
  // query-index size_bytes computed from the just-written artifacts (fresh reader).
  const freshReader = createBundleArtifactReader(bundleDir);
  writeJson(path.join(bundleDir, 'promotion-query-index.json'), result.queryIndex.toJSON((name) => freshReader.size(name)));
  const manifestPath = path.join(bundleDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const updated = { ...(manifest || {}), ...result.manifestPatch };
    writeJson(manifestPath, updated);
  }
  process.stdout.write(`evidence-promotion-atlas: build ok (${result.summary.classified_source_count} classified, ${result.summary.promoted_fact_count} promoted, ${result.summary.health_record_count} health)\n`);
}

function runValidate(bundleDir, completion) {
  const reader = createBundleArtifactReader(bundleDir);
  const { errors } = validatePromotionAtlas({ reader, completion });
  if (errors.length) {
    for (const e of errors) process.stderr.write(`validate-evidence-promotion-atlas: ${e}\n`);
    process.exit(1);
  }
  process.stdout.write('validate-evidence-promotion-atlas: ok\n');
}

function main() {
  const [cmd, bundleArg, ...rest] = process.argv.slice(2);
  if (!cmd || !bundleArg || ['-h', '--help'].includes(cmd)) { usage(); process.exit(cmd ? 0 : 2); }
  const bundleDir = path.resolve(bundleArg);
  if (cmd === 'build') {
    runBuild(bundleDir, rest[0] ? path.resolve(rest[0]) : '');
  } else if (cmd === 'validate') {
    runValidate(bundleDir, rest.includes('--completion'));
  } else {
    usage();
    process.exit(2);
  }
}

main();
