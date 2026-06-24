#!/usr/bin/env node
/**
 * Clean Architecture dependency-rule checker.
 *
 * The rule: dependencies point strictly inward.
 *   adapters  → use-cases → domain
 *   ports     → (interface only, may reference domain types)
 *   domain    → domain ONLY (never use-cases, ports, adapters)
 *   use-cases → domain + ports (never adapters)
 *
 * This script statically scans require()/import targets in each layer and fails
 * if an inward-forbidden import is found. It is deliberately simple — a guard
 * rail, not a full module resolver.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');
const LAYERS = ['domain', 'use-cases', 'ports', 'adapters'];

// What each layer may import (by relative path prefix under src/).
const ALLOWED = {
  domain: ['domain/'],
  'use-cases': ['domain/', 'ports/', 'use-cases/'],
  ports: ['domain/', 'ports/'],
  adapters: ['domain/', 'ports/', 'use-cases/', 'adapters/'],
};

// Anything NOT in src/ (node builtins, npm) is always allowed.
const REQUIRE_RE = /require\(['"]([^'"]+)['"]\)/g;

function listJs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isFile() && d.name.endsWith('.js'))
    .map(d => path.join(dir, d.name));
}

let violations = 0;

for (const layer of LAYERS) {
  const layerDir = path.join(ROOT, layer);
  for (const file of listJs(layerDir)) {
    const src = fs.readFileSync(file, 'utf8');
    let m;
    while ((m = REQUIRE_RE.exec(src)) !== null) {
      const target = m[1];
      // Skip non-relative (node builtins / npm packages).
      if (!target.startsWith('.')) continue;
      const resolved = path.relative(ROOT, path.resolve(path.dirname(file), target)).replace(/\\/g, '/');
      const targetLayer = resolved.split('/')[0];
      if (!LAYERS.includes(targetLayer)) continue; // outside src, ignore
      const allowed = ALLOWED[layer];
      const ok = allowed.some(a => resolved.startsWith(a));
      if (!ok) {
        violations++;
        console.error(`VIOLATION: ${path.relative(ROOT, file)} (${layer}) requires ${resolved} (${targetLayer})`);
      }
    }
  }
}

if (violations > 0) {
  console.error(`\n${violations} dependency-rule violation(s) found.`);
  process.exit(1);
}
console.log('dependency-rule: OK (0 violations)');
process.exit(0);
