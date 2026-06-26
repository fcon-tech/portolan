#!/usr/bin/env node
/**
 * Validate an Atlas Navigation Index bundle (captain-atlas 13).
 *
 * Loads the artifacts from <bundle>, runs the two-mode validator (full bundle
 * vs unsupported_target receipt), and prints a status table. Exits non-zero on
 * failure.
 *
 * Usage:
 *   node validate-atlas-navigation-index.mjs --bundle <dir> [--mode full|receipt]
 *
 * Checks (full mode): required-files, json-parse, jsonl-parse, unique-ids,
 * refs-resolve, required fixture rows, runtime-truth, provenance-labelled,
 * frontier-rows, row-counts-recorded, confidence-rule.
 * Receipt mode: required receipt, no content artifacts, machine_status, profile-selection.
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { readJsonlStrict } from './read-jsonl.mjs';

const require = createRequire(import.meta.url);
const { validateNavigationBundle, CONTENT_ARTIFACTS, ALL_ARTIFACTS } = require('../src/domain/atlas-navigation.js');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--bundle' && argv[i + 1]) args.bundle = path.resolve(argv[++i]);
    else if (a === '--mode' && argv[i + 1]) args.mode = argv[++i];
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

// Validate --mode early so an invalid value fails clearly instead of silently
// falling through to autodetection.
const VALID_MODES = new Set(['full', 'receipt']);
function assertValidMode(mode) {
  if (mode && !VALID_MODES.has(mode)) {
    console.error(`error: --mode must be 'full' or 'receipt' (got '${mode}')`);
    process.exit(2);
  }
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.bundle) {
    console.error('usage: validate-atlas-navigation-index.mjs --bundle <dir> [--mode full|receipt]');
    process.exit(args.help ? 0 : 2);
  }
  assertValidMode(args.mode);

  const dir = args.bundle;
  const filesPresent = new Set();
  for (const f of ALL_ARTIFACTS) if (fs.existsSync(path.join(dir, f))) filesPresent.add(f);

  // Parse content artifacts via the shared strict reader (tolerant of missing).
  const nav = readJsonlStrict(path.join(dir, 'navigation-index.jsonl'));
  const cov = readJsonlStrict(path.join(dir, 'coverage-matrix.jsonl'));
  const find = readJsonlStrict(path.join(dir, 'atlas-findings.jsonl'));
  const probe = readJsonlStrict(path.join(dir, 'unknown-probes.jsonl'));
  const evid = readJsonlStrict(path.join(dir, 'evidence.jsonl'));
  const jsonlFailed = [...nav.failed, ...cov.failed, ...find.failed, ...probe.failed, ...evid.failed];

  let receiptValidation = null;
  try { receiptValidation = JSON.parse(fs.readFileSync(path.join(dir, 'receipt-validation.json'), 'utf8')); }
  catch { /* validator will flag */ }
  let frontierComparisonMarkdown = '';
  try { frontierComparisonMarkdown = fs.readFileSync(path.join(dir, 'frontier-comparison.md'), 'utf8'); }
  catch { /* validator will flag */ }

  const result = validateNavigationBundle({
    navigationIndex: nav.rows, coverageMatrix: cov.rows,
    findings: find.rows, unknownProbes: probe.rows, evidence: evid.rows,
    receiptValidation, frontierComparisonMarkdown, filesPresent,
    jsonlParseFailed: jsonlFailed,
  }, { mode: args.mode });

  // Print the status table.
  console.error(`atlas-navigation-index validation — bundle: ${dir}`);
  console.error(`  mode: ${result.mode}  machine_status: ${result.machineStatus}`);
  const w = Math.max(20, ...(result.checks || []).map(c => c.check_id.length));
  for (const c of result.checks) {
    const icon = c.status === 'verified' ? '✓' : c.status === 'failed' ? '✗' : c.status === 'blocked' ? '⊘' : '?';
    console.error(`  ${icon} ${c.status.padEnd(11)} ${c.check_id.padEnd(w)}  ${c.summary}`);
  }

  if (result.machineStatus === 'failed') {
    console.error(`\nFAILED — ${result.checks.filter(c => c.status === 'failed').length} check(s) failed.`);
    process.exit(1);
  }
  console.error(`\nOK — machine_status: ${result.machineStatus}`);
}

main();
