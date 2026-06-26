#!/usr/bin/env node
/**
 * Build the Atlas Navigation Index artifacts for a target (captain-atlas 13).
 *
 * Reproducible generator: reads the target via the boundary-aware fs adapter,
 * selects a fixture profile (auto or explicit), builds the seven additive
 * artifacts, and writes them to <out>/. For unsupported targets it writes ONLY
 * a receipt-validation.json (blocked/not_assessed) — no content artifacts.
 *
 * Usage (single target):
 *   node build-atlas-navigation-index.mjs --target <root> --out <dir>
 *       [--profile bigtop|portolan-self|auto]
 *
 * Usage (combined multi-corpus acceptance bundle):
 *   node build-atlas-navigation-index.mjs --combine --bigtop <path> --self <path> --out <dir>
 *   Builds each corpus into <out>/<corpus>/ then merges a combined bundle at
 *   <out>/ whose frontier-comparison satisfies the spec's literal AND
 *   pass-condition (>=1 Bigtop AND >=1 portolan-self matches/exceeds).
 *
 * Outputs: navigation-index.jsonl, coverage-matrix.jsonl, atlas-findings.jsonl,
 *          unknown-probes.jsonl, evidence.jsonl, receipt-validation.json,
 *          frontier-comparison.md
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createFsAtlasNavSource } = require('../src/adapters/fs-atlas-nav-source.js');
const { buildAtlasNavigationIndex } = require('../src/use-cases/build-atlas-navigation-index.js');
const { combineMultiCorpusFrontier } = require('../src/use-cases/combine-multi-corpus.js');
const { validateNavigationBundle } = require('../src/domain/atlas-navigation.js');

function parseArgs(argv) {
  const args = { profile: 'auto' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--target' && argv[i + 1]) args.target = path.resolve(argv[++i]);
    else if (a === '--out' && argv[i + 1]) args.out = path.resolve(argv[++i]);
    else if (a === '--profile' && argv[i + 1]) args.profile = argv[++i];
    else if (a === '--combine') args.combine = true;
    else if (a === '--bigtop' && argv[i + 1]) args.bigtop = path.resolve(argv[++i]);
    else if (a === '--self' && argv[i + 1]) args.self = path.resolve(argv[++i]);
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function writeJsonl(file, rows) {
  try {
    const lines = rows.map(r => JSON.stringify(r));
    fs.writeFileSync(file, lines.length ? lines.join('\n') + '\n' : '');
  } catch (e) { console.error(`error: failed to write ${file}: ${e.message}`); process.exit(1); }
}

function writeBundle(out, bundle, unsupported) {
  if (!unsupported) {
    writeJsonl(path.join(out, 'navigation-index.jsonl'), bundle.navigationIndex);
    writeJsonl(path.join(out, 'coverage-matrix.jsonl'), bundle.coverageMatrix);
    writeJsonl(path.join(out, 'atlas-findings.jsonl'), bundle.findings);
    writeJsonl(path.join(out, 'unknown-probes.jsonl'), bundle.unknownProbes);
    writeJsonl(path.join(out, 'evidence.jsonl'), bundle.evidence);
    try { fs.writeFileSync(path.join(out, 'frontier-comparison.md'), bundle.frontierComparison); } catch (e) { console.error(`error: failed to write frontier-comparison.md: ${e.message}`); process.exit(1); }
  } else {
    for (const f of ['navigation-index.jsonl', 'coverage-matrix.jsonl', 'atlas-findings.jsonl', 'unknown-probes.jsonl', 'evidence.jsonl', 'frontier-comparison.md']) {
      const p = path.join(out, f);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  }
  // NOTE: receipt-validation.json is written ONCE, by stampReceipt after the
  // machine verdict is computed (avoids a stale double-write).
}

function stampReceipt(out, bundle, unsupported) {
  const filesPresent = new Set();
  if (!unsupported) for (const f of ['navigation-index.jsonl', 'coverage-matrix.jsonl', 'atlas-findings.jsonl', 'unknown-probes.jsonl', 'evidence.jsonl', 'frontier-comparison.md']) filesPresent.add(f);
  filesPresent.add('receipt-validation.json');
  const validation = validateNavigationBundle({
    navigationIndex: bundle.navigationIndex, coverageMatrix: bundle.coverageMatrix,
    findings: bundle.findings, unknownProbes: bundle.unknownProbes, evidence: bundle.evidence,
    receiptValidation: bundle.receiptValidation, frontierComparisonMarkdown: bundle.frontierComparison,
    filesPresent,
  }, { mode: unsupported ? 'receipt' : 'full' });
  bundle.receiptValidation.machine_status = validation.machineStatus;
  bundle.receiptValidation.validation_checks = validation.checks;
  fs.writeFileSync(path.join(out, 'receipt-validation.json'), JSON.stringify(bundle.receiptValidation, null, 2) + '\n');
  return validation;
}

function buildOne(target, out, explicit) {
  fs.mkdirSync(out, { recursive: true });
  const source = createFsAtlasNavSource(target);
  const result = buildAtlasNavigationIndex({ targetRoot: target, sourceAdapter: source, explicitProfile: explicit });
  // Stamp the reproducible generator command (spec: command receipt) onto the receipt.
  result.bundle.receiptValidation.generator_command = `node build-atlas-navigation-index.mjs --target ${target} --out ${out}${explicit ? ' --profile ' + explicit : ''}`;
  writeBundle(out, result.bundle, result.unsupported);
  const validation = stampReceipt(out, result.bundle, result.unsupported);
  return { result, validation };
}

function main() {
  const args = parseArgs(process.argv);

  // Validate --profile against the known set in BOTH modes (combine ignores
  // it, but an invalid value should still fail rather than be silently dropped).
  const VALID_PROFILES = new Set(['auto', 'bigtop', 'portolan-self']);
  if (args.profile && !VALID_PROFILES.has(args.profile)) {
    console.error(`error: --profile must be bigtop|portolan-self|auto (got '${args.profile}')`);
    process.exit(2);
  }

  if (args.combine) {
    if (!args.bigtop || !args.self || !args.out) {
      console.error('usage: build-atlas-navigation-index.mjs --combine --bigtop <path> --self <path> --out <dir>');
      process.exit(2);
    }
    fs.mkdirSync(args.out, { recursive: true });
    // Build each corpus (single-target bundles also written to <out>/<corpus>/).
    const { result: bigtopR } = buildOne(args.bigtop, path.join(args.out, 'bigtop'), 'bigtop');
    const { result: selfR } = buildOne(args.self, path.join(args.out, 'portolan-self'), 'portolan-self');
    // Merge into one acceptance bundle at <out>/.
    let merged;
    try { merged = combineMultiCorpusFrontier(bigtopR, selfR); }
    catch (e) { console.error('error: multi-corpus merge failed.'); console.error(e.stack || e); process.exit(1); }
    writeBundle(args.out, merged, false);
    const validation = stampReceipt(args.out, merged, false);
    console.error(`atlas-navigation-index: combined multi-corpus bundle (Bigtop + portolan-self)`);
    console.error(`  machine_status: ${validation.machineStatus} (${validation.checks.filter(c => c.status === 'failed').length} failed, ${validation.checks.filter(c => c.status === 'verified').length} verified)`);
    console.error(`  out: ${args.out}`);
    if (validation.machineStatus === 'failed') process.exit(1);
    return;
  }

  if (args.help || !args.target || !args.out) {
    console.error('usage: build-atlas-navigation-index.mjs --target <root> --out <dir> [--profile bigtop|portolan-self|auto]');
    console.error('   or: build-atlas-navigation-index.mjs --combine --bigtop <path> --self <path> --out <dir>');
    process.exit(args.help ? 0 : 2);
  }

  const { result, validation } = buildOne(args.target, args.out, args.profile === 'auto' ? undefined : args.profile);
  const b = result.bundle;
  console.error(`atlas-navigation-index: profile=${result.profileId} target_id=${result.targetId}`);
  console.error(`  reason: ${result.reason}`);
  if (result.unsupported) console.error(`  mode: receipt-only (no content artifacts)`);
  else console.error(`  rows: nav=${b.navigationIndex.length} cov=${b.coverageMatrix.length} find=${b.findings.length} probe=${b.unknownProbes.length} ev=${b.evidence.length}`);
  console.error(`  machine_status: ${validation.machineStatus} (${validation.checks.filter(c => c.status === 'failed').length} failed, ${validation.checks.filter(c => c.status === 'verified').length} verified)`);
  console.error(`  out: ${args.out}`);
  if (validation.machineStatus === 'failed') process.exit(1);
}

main();
