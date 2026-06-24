#!/usr/bin/env node
/**
 * Minimal CommonJS -> browser bundler for portolan-core.
 *
 * Walks the require() tree from an entry module, wraps each module in a
 * function keyed by its resolved path, and emits a single IIFE that provides a
 * CommonJS-style `require` shim. No external bundler dependency (no webpack/
 * esbuild/rollup) — keeps the local-first, zero-deps product contract.
 *
 * Output is a JS string that, when executed in a browser, defines
 * `globalThis.__PORTOLAN_CORE` = the entry module's exports.
 *
 * Usage: node scripts/assemble.mjs <entry.js> [--name NAME]
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, '..', 'src');

function resolveModule(fromFile, target) {
  if (!target.startsWith('.')) return null; // skip node builtins + npm
  const resolved = path.resolve(path.dirname(fromFile), target);
  for (const ext of ['', '.js']) {
    const candidate = resolved + ext;
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

const REQUIRE_RE = /require\(['"]([^'"]+)['"]\)/g;

export function assemble(entryPath, opts = {}) {
  const name = opts.name || '__PORTOLAN_CORE';
  const modules = new Map(); // absPath -> { code, deps: [absPath...] }
  const order = [];

  function visit(absPath) {
    if (modules.has(absPath)) return;
    const code = fs.readFileSync(absPath, 'utf8');
    const deps = [];
    let m;
    const re = new RegExp(REQUIRE_RE);
    while ((m = re.exec(code)) !== null) {
      const dep = resolveModule(absPath, m[1]);
      if (dep) deps.push(dep);
    }
    modules.set(absPath, { code, deps });
    for (const d of deps) visit(d);
    order.push(absPath);
  }
  visit(path.resolve(entryPath));

  // Build the bundle: each module wrapped, keyed by a stable id.
  const idMap = new Map();
  order.forEach((p, i) => idMap.set(p, i));
  const wrapped = order.map((p) => {
    const mod = modules.get(p);
    const id = idMap.get(p);
    // Rewrite every relative require() by position: for each match, resolve it
    // and replace with __r(<depId>). This handles both './x' and '../x' forms
    // regardless of .js suffix, since we resolve the actual target path.
    let rewritten = mod.code;
    let match;
    const re = new RegExp(REQUIRE_RE);
    const replacements = [];
    while ((match = re.exec(rewritten)) !== null) {
      const target = match[1];
      if (!target.startsWith('.')) continue; // skip builtins/npm
      const dep = resolveModule(p, target);
      if (dep && idMap.has(dep)) {
        replacements.push({ start: match.index, end: match.index + match[0].length, id: idMap.get(dep) });
      }
    }
    // apply replacements right-to-left to preserve indices
    for (let i = replacements.length - 1; i >= 0; i--) {
      const r = replacements[i];
      rewritten = rewritten.slice(0, r.start) + `__r(${r.id})` + rewritten.slice(r.end);
    }
    return `function(module, exports, require){${rewritten}\n}`;
  }).join(',\n');

  return `(function(){
var __mods = [${wrapped}];
var __cache = {};
function __r(id){
  if(__cache[id]) return __cache[id].exports;
  var mod = __cache[id] = { exports: {} };
  __mods[id].call(mod.exports, mod, mod.exports, __r);
  return mod.exports;
}
globalThis.${name} = __r(${idMap.get(path.resolve(entryPath))});
})();`;
}

// CLI
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const entry = process.argv[2];
  const nameIdx = process.argv.indexOf('--name');
  const name = nameIdx > -1 ? process.argv[nameIdx + 1] : '__PORTOLAN_CORE';
  if (!entry) {
    console.error('usage: assemble.mjs <entry.js> [--name NAME]');
    process.exit(2);
  }
  process.stdout.write(assemble(path.resolve(entry), { name }));
}
