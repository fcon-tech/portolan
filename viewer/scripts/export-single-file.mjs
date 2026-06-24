#!/usr/bin/env node
/**
 * export-single-file.mjs — Reproducible single-file Portolan Atlas exporter.
 *
 * Reads the viewer source (viewer/src/{index.html, styles.css, app.js}) plus a
 * generated system-map.json, and writes ONE self-contained index.html that any
 * browser can open directly (file://, GitHub Pages, a USB stick). No server,
 * no bundler, no build step required by the consumer.
 *
 * This is the Cursor-reproducible path: an agent running Portolan over ANY set
 * of repos runs `portolan-scan` → `build-system-map` → `export-single-file`,
 * and gets the same interactive atlas the Bigtop demo shows. The viewer is
 * fully data-driven; nothing about a specific ecosystem is hard-coded here.
 *
 * Usage:
 *   node viewer/scripts/export-single-file.mjs \
 *     --system-map <path/to/system-map.json> \
 *     --out <path/to/index.html> \
 *     [--title "Portolan Atlas — My Target"] \
 *     [--description "..."]
 *
 * The fetch shim serves the inlined map for /bundle/system-map.json so the
 * unmodified viewer app.js works unchanged.
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, '..', 'src');

function parseArgs(argv) {
  const args = { title: 'Portolan Atlas', description: '' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--system-map' && argv[i + 1]) args.systemMap = path.resolve(argv[++i]);
    else if (a === '--out' && argv[i + 1]) args.out = path.resolve(argv[++i]);
    else if (a === '--title' && argv[i + 1]) args.title = argv[++i];
    else if (a === '--description' && argv[i + 1]) args.description = argv[++i];
    else if (a === '--help' || a === '-h') { args.help = true; }
  }
  return args;
}

function usage() {
  return [
    'usage: export-single-file.mjs --system-map <system-map.json> --out <index.html>',
    '                          [--title "..."] [--description "..."]',
    '',
    'Produces a single self-contained HTML file from the viewer source + map.',
  ].join('\n');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// The fetch shim: served inlined data so unmodified app.js works from file://.
// manifest/handoff are synthesized from the map so the viewer does not 404.
function buildShim(mapJson, manifestJson) {
  return [
    '// Portolan single-file fetch shim: serve inlined bundle data instead of HTTP.',
    'const __PORTOLAN_MAP = ' + mapJson + ';',
    'const __PORTOLAN_MANIFEST = ' + manifestJson + ';',
    'window.__originalFetch = window.fetch;',
    'window.fetch = async function(url) {',
    '  if (url === "/bundle/system-map.json") {',
    '    return { ok: true, json: async () => __PORTOLAN_MAP };',
    '  }',
    '  if (url === "/bundle/manifest.json") {',
    '    return { ok: true, json: async () => __PORTOLAN_MANIFEST };',
    '  }',
    '  if (url === "/bundle/captain-handoff.json") {',
    '    return { ok: false, json: async () => null };',
    '  }',
    '  return { ok: false, json: async () => null };',
    '};',
  ].join('\n');
}

function synthesizeManifest(map) {
  // Minimal manifest shape the viewer reads (repo_count). Keeps app.js unchanged.
  const comps = (map && map.objects && map.objects.components) || [];
  return {
    repo_count: comps.length,
    generated_at: map && map.generated_at,
    source: 'portolan-single-file-export',
    schema_version: (map && map.schema_version) || '0.1.0',
  };
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.systemMap || !args.out) {
    console.error(usage());
    process.exit(args.help ? 0 : 2);
  }

  // 1. Read inputs.
  if (!fs.existsSync(args.systemMap)) {
    console.error(`error: system-map not found: ${args.systemMap}`);
    process.exit(2);
  }
  const map = JSON.parse(fs.readFileSync(args.systemMap, 'utf8'));
  if (!map || !map.objects || !Array.isArray(map.objects.components)) {
    console.error('error: system-map.json is missing objects.components — not a valid Portolan system map');
    process.exit(1);
  }

  const indexHtml = fs.readFileSync(path.join(SRC_DIR, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(SRC_DIR, 'styles.css'), 'utf8');
  const appJs = fs.readFileSync(path.join(SRC_DIR, 'app.js'), 'utf8');

  // 2. Build pieces. Compact JSON for the inlined map (no whitespace bloat).
  const mapJson = JSON.stringify(map);
  const manifestJson = JSON.stringify(synthesizeManifest(map));
  const shim = buildShim(mapJson, manifestJson);

  // 3. Assemble: replace <link rel="stylesheet"> with inline <style>,
  //    and <script src="app.js"> with inline shim + app.js.
  let html = indexHtml;

  // Inline CSS: swap the <link> for a <style> block.
  html = html.replace(
    /<link rel="stylesheet" href="styles\.css">/,
    '<style>\n' + css + '\n  </style>',
  );

  // Derive <title> from the map target if the caller didn't override.
  const targetName = (map.target && map.target.display_name) || 'Portolan target';
  const title = args.title === 'Portolan Atlas'
    ? `Portolan Atlas — ${targetName}`
    : args.title;
  const description = args.description ||
    `Portolan system map of ${targetName}: typed components, C4 families, relationships, surfaces, findings, and honest unknowns.`;

  // Replace <title> and add meta description.
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  if (!/<meta name="description"/.test(html)) {
    html = html.replace(
      /<meta name="viewport"[^>]*>/,
      '$&\n  <meta name="description" content="' + escapeHtml(description) + '">',
    );
  }

  // Inline JS: swap <script src="app.js"> with shim + app.js in one <script>.
  html = html.replace(
    /<script src="app\.js"><\/script>/,
    '<script>\n' + shim + '\n\n' + appJs + '\n  </script>',
  );

  // 4. Sanity checks: refuse to ship if the inlining failed.
  if (html.includes('styles.css') || html.includes('app.js"')) {
    console.error('error: inlining failed — source references remain in output');
    process.exit(1);
  }
  // Refuse obvious local-path leakage in the inlined data.
  const leaked = ['/home/', '/Users/', 'C:\\\\Users'].filter((p) => mapJson.includes(p));
  if (leaked.length) {
    console.error(`warning: inlined map may contain local paths: ${leaked.join(', ')}`);
  }

  // 5. Write.
  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, html);

  const comps = map.objects.components;
  const rels = map.objects.relationships || [];
  const fams = (map.c4 && map.c4.families) || [];
  console.error(
    `exported single-file atlas → ${args.out}`,
    `(${comps.length} components, ${rels.length} relationships, ${fams.length} C4 families, ${Buffer.byteLength(html)} bytes)`,
  );
}

main();
