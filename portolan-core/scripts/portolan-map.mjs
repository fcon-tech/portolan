#!/usr/bin/env node
/**
 * /portolan:map — the single entry point (charter 08 UX principle).
 *
 * What the agent runs after managed intake. This script:
 *   1. Loads the intake result from `<target>/.portolan/intake.json` (produced
 *      by the root skill's conversational intake). If absent, errors with the
 *      exact remediation ("run managed intake first").
 *   2. Builds (or reuses) the deterministic snapshot via the frozen build-system-map
 *      pipeline — if the system-map.json is stale or absent, rebuild it.
 *   3. Exports the clean-stack shell + inlined atlas to a portable HTML and
 *      opens it (or prints the path for the agent to open).
 *
 * This is the "one entry point" — the admiral drops a link, the agent runs
 * intake then `/portolan:map`, and the atlas opens. Zero copied commands beyond
 * the initial prompt.
 *
 * Usage: node scripts/portolan-map.mjs --target <target-root> [--open]
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createIntakeFileStore } = require('../src/adapters/intake-file-store.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

function parseArgs(argv) {
  const args = { open: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--target' && argv[i + 1]) args.target = path.resolve(argv[++i]);
    else if (argv[i] === '--bundle' && argv[i + 1]) args.bundle = path.resolve(argv[++i]);
    else if (argv[i] === '--open') args.open = true;
    else if (argv[i] === '--help' || argv[i] === '-h') args.help = true;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help || (!args.target && !args.bundle)) {
    console.error('usage: portolan-map.mjs --target <target-root> [--open]');
    console.error('       portolan-map.mjs --bundle <bundle-dir> [--open]   (scan/harness mode)');
    console.error('');
    console.error('Exports the atlas as inlined HTML (charter-08 single entry point).');
    console.error(' --target: loads .portolan/intake.json, builds the snapshot if stale.');
    console.error(' --bundle: opens a scan-produced bundle directly (scripted mode, no intake).');
    process.exit(args.help ? 0 : 2);
  }

  // --bundle mode (scan/harness flow): the snapshot is the bundle's
  // system-map.json; the atlas is exported next to it. No intake required.
  if (args.bundle) {
    const snapshotFile = path.join(args.bundle, 'system-map.json');
    if (!fs.existsSync(snapshotFile)) {
      console.error(`error: no system-map.json in bundle ${args.bundle}`);
      console.error('Run build-system-map.sh over the bundle first.');
      process.exit(1);
    }
    const manifest = (() => { try { return JSON.parse(fs.readFileSync(path.join(args.bundle, 'manifest.json'), 'utf8')); } catch (e) { return {}; } })();
    const navBundleDir = path.join(args.bundle, 'navigation-index');
    let navGenerated = false;
    try {
      execFileSync('node', [path.join(__dirname, 'build-atlas-navigation-index.mjs'), '--target', manifest.target_root || args.bundle, '--out', navBundleDir], { stdio: 'inherit' });
      const receiptPath = path.join(navBundleDir, 'receipt-validation.json');
      try {
        navGenerated = fs.existsSync(receiptPath) && JSON.parse(fs.readFileSync(receiptPath, 'utf8')).machine_status !== 'failed';
      } catch (re) { navGenerated = false; }
    } catch (e) {
      console.error('warning: navigation-index generation failed; atlas.html will be exported without nav surfaces.');
    }
    const outFile = path.join(args.bundle, 'atlas.html');
    const exportArgs = [path.join(__dirname, 'export-shell.mjs'), '--system-map', snapshotFile, '--out', outFile, '--title', `Portolan Atlas — ${manifest.target_root || args.bundle}`, '--target-root', manifest.target_root || args.bundle];
    if (navGenerated) exportArgs.push('--nav-bundle', navBundleDir);
    try {
      execFileSync('node', exportArgs, { stdio: 'inherit' });
    } catch (e) {
      console.error('error: atlas export failed.');
      console.error(e.stack || e);
      process.exit(1);
    }
    if (args.open) {
      if (process.platform === 'win32') {
        try { execFileSync('cmd.exe', ['/c', 'start', '', outFile]); } catch (e) { /* non-fatal */ }
      } else {
        const opener = process.platform === 'darwin' ? 'open' : 'xdg-open';
        try { execFileSync(opener, [outFile]); } catch (e) { /* non-fatal */ }
      }
    }
    console.error(`\nPortolan atlas ready: ${outFile}`);
    return;
  }

  const intakeStore = createIntakeFileStore(args.target);
  let intake;
  if (intakeStore.exists()) {
    intake = intakeStore.load();
  } else {
    // Scripted / harness mode: no managed intake result. Continue with a
    // target-root-only intake so /portolan:map works over a scan-produced
    // bundle. (Managed intake remains the charter-08 primary path.)
    console.error(`note: no intake result at ${intakeStore.path()}; using scripted mode (target-root only).`);
    intake = { target_root: args.target };
  }

  // The snapshot lives under .portolan/. Build it if absent using the frozen
  // build-system-map pipeline (read-only adapter over the target's bundle).
  const snapshotDir = path.join(args.target, '.portolan');
  const snapshotFile = path.join(snapshotDir, 'system-map.json');
  if (!fs.existsSync(snapshotFile)) {
    // Delegate to the frozen build pipeline if a bundle exists; otherwise this
    // is the boundary where the deterministic core would run its analyzers.
    // For Part-1a parity with the existing demo path, we reuse the existing
    // build-system-map.sh over the target's bundle dir if present.
    const bundleDir = path.join(snapshotDir, 'bundle');
    if (fs.existsSync(bundleDir)) {
      try {
        // execFileSync (array form) avoids shell injection from interpolated paths.
        execFileSync('bash', [`${REPO_ROOT}/scripts/build-system-map.sh`, bundleDir, args.target], { stdio: 'inherit' });
      } catch (e) {
        console.error('snapshot build failed; the target may not have a bundle yet');
        process.exit(1);
      }
    } else {
      console.error(`error: no snapshot at ${snapshotFile} and no bundle at ${bundleDir}`);
      console.error('Run the deterministic core (portolan-scan) to produce a bundle first.');
      process.exit(1);
    }
  }

  // Export the clean-stack shell + atlas to a portable HTML.
  // First generate the additive navigation index (captain-atlas 13) into the
  // snapshot dir, then pass it as --nav-bundle so atlas.html carries the nav
  // surfaces. This is additive; if generation fails we still export the atlas
  // (nav surfaces simply absent), but we print a clear warning.
  const navBundleDir = path.join(snapshotDir, 'navigation-index');
  let navGenerated = false;
  try {
    execFileSync('node', [path.join(__dirname, 'build-atlas-navigation-index.mjs'), '--target', args.target, '--out', navBundleDir], { stdio: 'inherit' });
    // The build script exits non-zero on validation failure but still writes a
    // receipt, so presence alone is not enough — check machine_status. A corrupt
    // receipt is a distinct failure from a failed generation.
    const receiptPath = path.join(navBundleDir, 'receipt-validation.json');
    try {
      navGenerated = fs.existsSync(receiptPath)
        && JSON.parse(fs.readFileSync(receiptPath, 'utf8')).machine_status !== 'failed';
    } catch (re) {
      console.error(`warning: receipt-validation.json is present but unparseable; nav surfaces dropped: ${re.message}`);
      navGenerated = false;
    }
  } catch (e) {
    console.error(`warning: navigation-index generation failed; atlas.html will be exported without nav surfaces.`);
    console.error(e.stack || e);
  }

  const outFile = path.join(snapshotDir, 'atlas.html');
  // execFileSync (array form): no shell, so interpolated paths/title cannot inject.
  const exportArgs = [path.join(__dirname, 'export-shell.mjs'), '--system-map', snapshotFile, '--out', outFile, '--title', `Portolan Atlas — ${intake.target_root}`, '--target-root', args.target];
  if (navGenerated) exportArgs.push('--nav-bundle', navBundleDir);
  try {
    execFileSync('node', exportArgs, { stdio: 'inherit' });
  } catch (e) {
    console.error('error: atlas export failed.');
    console.error(e.stack || e);
    process.exit(1);
  }

  if (args.open) {
    // 'start' is a cmd.exe builtin, not an executable, so on win32 invoke via cmd.
    if (process.platform === 'win32') {
      try { execFileSync('cmd.exe', ['/c', 'start', '', outFile]); } catch (e) { /* non-fatal */ }
    } else {
      const opener = process.platform === 'darwin' ? 'open' : 'xdg-open';
      try { execFileSync(opener, [outFile]); } catch (e) { /* non-fatal */ }
    }
  }
  console.error(`\nPortolan atlas ready: ${outFile}`);
  console.error(`Open it in a browser, or the agent serves it at the printed path.`);
}

main();
