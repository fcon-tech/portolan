#!/usr/bin/env node
/**
 * Export the Portolan Part-1a clean-stack shell as a single portable HTML file.
 *
 * Assembles the shell + all portolan-core modules (via assemble.mjs), inlines a
 * system-map.json as the atlas, and emits one self-contained index.html that
 * runs in any browser (file://, GitHub Pages, USB stick). Mirrors the frozen
 * viewer's export-single-file.mjs.
 *
 * Usage: node scripts/export-shell.mjs --system-map <map.json> --out <index.html> [--title "..."]
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assemble } from './assemble.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, '..', 'src');

function parseArgs(argv) {
  const args = { title: 'Portolan Atlas' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--system-map' && argv[i + 1]) args.systemMap = path.resolve(argv[++i]);
    else if (a === '--out' && argv[i + 1]) args.out = path.resolve(argv[++i]);
    else if (a === '--title' && argv[i + 1]) args.title = argv[++i];
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

const BASE_CSS = `
:root{--bg:#efe6d2;--surface:#f6efe0;--surface-2:#efe4cd;--surface-3:#e0d2b4;--text:#2b2419;--muted:#6f6450;--line:rgba(60,45,20,0.14);--line-strong:rgba(124,90,42,0.42);--primary:#9a4a2e;--accent:#1d5e63;--font:Georgia,"Source Serif 4",serif;}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:var(--font);font-size:15px;line-height:1.5}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}.muted{color:var(--muted)}
.workspace{width:min(100%,1280px);margin:0 auto;padding:24px}
.panel{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:28px}
.panel-title{margin:0 0 8px;font-size:24px}.hero-title{font-size:30px}
.hero-eyebrow{font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--primary);margin-bottom:6px}
.hero-read{max-width:60ch;margin:10px 0 14px}.cta-primary{display:inline-block;padding:9px 18px;border-radius:10px;background:var(--primary);color:#fff;font-weight:600}
.target-root{font-family:ui-monospace,monospace;font-size:13px;word-break:break-all}
.section-kicker{margin:20px 0 8px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--primary)}
.hero-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-top:16px}
.metric-card{background:var(--surface-2);border:1px solid var(--line);border-radius:12px;padding:14px 16px}
.metric-label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}.metric-value{font-size:22px;font-weight:700;margin-top:4px}
.dist-bar{display:flex;height:12px;border-radius:6px;overflow:hidden;border:1px solid var(--line);margin-top:4px}
.dist-seg{background:var(--primary);opacity:.7}.dist-legend{display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:10px;font-size:12px;color:var(--muted)}
.route-button-grid,.component-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin-top:8px}
.card{background:var(--surface-2);border:1px solid var(--line);border-radius:12px;padding:14px 16px}
.card-title{font-weight:650;font-size:15px}.card-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.badge{display:inline-flex;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;border:1px solid var(--line)}.badge-quiet{color:var(--muted)}
.chip{display:inline-block;padding:6px 10px;background:var(--surface-2);border:1px solid var(--line);border-radius:8px;font-size:13px}
.topbar{position:sticky;top:0;z-index:20;display:flex;gap:16px;align-items:center;padding:12px 24px;background:rgba(239,230,210,0.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.brand-mark{font-weight:700;color:var(--primary)}.nav{display:flex;gap:4px}
.nav-item{padding:7px 12px;border-radius:8px;color:var(--muted);font-size:14px;font-weight:500}.nav-item:hover{background:var(--surface-2)}.nav-item.is-active{color:var(--text);background:var(--surface-3);border:1px solid var(--line-strong)}
.graph-legend{display:flex;flex-wrap:wrap;gap:10px 18px;margin:14px 0}.legend-item{display:inline-flex;align-items:center;gap:7px;font-size:12px;color:var(--muted)}.legend-swatch{width:12px;height:12px;border-radius:50%;border:1px solid rgba(0,0,0,.15)}
.graph-stage{background:radial-gradient(ellipse at center,rgba(224,210,180,.5),var(--surface-3));border:1px solid var(--line);border-radius:14px;padding:10px;margin-top:16px;overflow:hidden}
.graph-svg{width:100%;height:clamp(440px,62vh,720px);display:block}
.graph-edge{stroke:rgba(124,90,42,.4);stroke-width:1.2;cursor:pointer}.graph-edge:hover{stroke:var(--primary);stroke-width:2}
.graph-node{cursor:pointer}.node-label{fill:var(--text);font-size:11px;font-family:var(--font);text-anchor:middle;paint-order:stroke;stroke:var(--bg);stroke-width:3px;stroke-linejoin:round}
.dossier-section{margin-top:18px}.ref-list{margin-top:18px}.back-link{font-size:13px;color:var(--muted);display:inline-block;margin-top:16px}
.prose{max-width:68ch}.map-intro{max-width:78ch}
.is-disabled{opacity:.5;pointer-events:none}
`;

function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.systemMap || !args.out) {
    console.error('usage: export-shell.mjs --system-map <map.json> --out <index.html> [--title "..."]');
    process.exit(args.help ? 0 : 2);
  }
  const map = JSON.parse(fs.readFileSync(args.systemMap, 'utf8'));
  if (!map.objects || !Array.isArray(map.objects.components)) {
    console.error('error: not a valid system-map (missing objects.components)');
    process.exit(1);
  }

  // Assemble the clean stack from shell.js entry.
  const bundle = assemble(path.join(SRC, 'shell.js'), { name: '__PORTOLAN' });
  const mapJson = JSON.stringify(map);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${args.title}</title>
<style>${BASE_CSS}</style>
</head>
<body>
<div id="app"></div>
<script>
var __ATLAS = ${mapJson};
${bundle}
(function(){
  var shell = __PORTOLAN.createPortolanShell({ root: document.getElementById('app'), atlas: __ATLAS });
  // render once; hashchange handled by the navigator inside the shell
  shell.render();
  // if no hash, default to overview
  if(!location.hash) shell._internals.navigator.route('/overview');
})();
</script>
</body>
</html>`;

  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, html);
  const comps = map.objects.components;
  const rels = map.objects.relationships || [];
  const fams = (map.c4 && map.c4.families) || [];
  console.error(`exported clean-stack shell → ${args.out} (${comps.length} units, ${rels.length} relationships, ${fams.length} families, ${Buffer.byteLength(html)} bytes)`);
}

main();
