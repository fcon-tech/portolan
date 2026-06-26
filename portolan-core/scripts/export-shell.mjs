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
import { safeInlineJson } from './safe-inline-json.mjs';
import { readJsonl } from './read-jsonl.mjs';
import { escapeHtmlText } from './html-escape.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, '..', 'src');

function parseArgs(argv) {
  const args = { title: 'Portolan Atlas' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--system-map' && argv[i + 1]) args.systemMap = path.resolve(argv[++i]);
    else if (a === '--out' && argv[i + 1]) args.out = path.resolve(argv[++i]);
    else if (a === '--title' && argv[i + 1]) args.title = argv[++i];
    else if (a === '--nav-bundle' && argv[i + 1]) args.navBundle = path.resolve(argv[++i]);
    else if (a === '--target-root' && argv[i + 1]) args.targetRoot = path.resolve(argv[++i]);
    else if (a === '--semantic-investigation' && argv[i + 1]) args.semanticInvestigation = path.resolve(argv[++i]);
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

/**
 * Load the navigation atlas from a nav-bundle dir, or null if absent.
 * Returns the parsed artifact set the shell expects.
 */
function loadNavAtlas(navBundleDir) {
  if (!navBundleDir || !fs.existsSync(navBundleDir)) return null;
  const navAtlas = {
    navigationIndex: readJsonl(path.join(navBundleDir, 'navigation-index.jsonl')),
    coverageMatrix: readJsonl(path.join(navBundleDir, 'coverage-matrix.jsonl')),
    findings: readJsonl(path.join(navBundleDir, 'atlas-findings.jsonl')),
    unknownProbes: readJsonl(path.join(navBundleDir, 'unknown-probes.jsonl')),
    evidence: readJsonl(path.join(navBundleDir, 'evidence.jsonl')),
  };
  try {
    navAtlas.receiptValidation = JSON.parse(fs.readFileSync(path.join(navBundleDir, 'receipt-validation.json'), 'utf8'));
  } catch (e) {
    if (e.code !== 'ENOENT') {
      console.error(`warning: receipt-validation.json is corrupt; nav atlas dropped: ${e.message}`);
      return null;
    }
    navAtlas.receiptValidation = {};
  }
  return navAtlas;
}

/**
 * Extract source excerpts (captain-atlas 15 §5) into the IN-MEMORY navAtlas only.
 *
 * For every navigation-index stage and evidence row with a resolvable target-
 * relative source_path, read up to 12 lines around the anchor and attach:
 *   - source_excerpt: a line-numbered string (max 12 lines)
 *   - anchor_status: 'precise' | 'ambiguous' | 'missing' | 'missing-file'
 *
 * This NEVER mutates the on-disk JSONL — the enriched rows live only in the
 * inlined __NAV_ATLAS. It never fetches remote URLs (only target-relative
 * paths), never traverses forbidden roots, and never fabricates a precise
 * anchor: a 0/0 line range with multiple matches is 'ambiguous', not 'precise'.
 *
 * Rules (doc 15 §5):
 *   - max 12 lines per snippet;
 *   - preserve line numbers;
 *   - ambiguous anchor -> 'ambiguous', no fake precise lines;
 *   - missing file -> 'missing-file', stage kept visible.
 */
const MAX_SNIPPET_LINES = 12;
// Roots that must NEVER be read as evidence (boundary control, mirrors the
// fs-atlas-nav-source adapter).
const FORBIDDEN_SEGMENTS = new Set(['.portolan', '.git', 'node_modules', 'research', 'output', '.cursor']);

function isForbidden(rel) {
  if (!rel) return true;
  const parts = rel.split(/[\\/]/);
  return parts.some(p => FORBIDDEN_SEGMENTS.has(p));
}

// Containment check: the resolved absolute path must stay INSIDE targetRoot.
// Rejects absolute source_path, '..' traversal. NOTE: path.resolve does NOT
// resolve symlinks, so the caller MUST re-check the realpath after resolving
// symlinks (a symlink inside target pointing outside would otherwise pass).
function isInside(targetRoot, absPath) {
  const root = path.resolve(targetRoot) + path.sep;
  return (absPath + path.sep).startsWith(root);
}

function extractSnippets(navAtlas, targetRoot) {
  if (!navAtlas || !targetRoot) return navAtlas;
  let readCount = 0;
  let snippetCount = 0;
  const enrich = (row) => {
    if (!row || !row.source_path || row.anchor_status) return; // don't re-resolve
    if (isForbidden(row.source_path)) { row.anchor_status = 'missing-file'; return; }
    // Resolve the lexical path first (rejects '..' traversal + absolute paths).
    // Use path.resolve consistently (NOT path.join) so isInside and the read
    // agree, and so an absolute source_path cannot replace the root.
    const root = path.resolve(targetRoot) + path.sep;
    const abs = path.resolve(targetRoot, row.source_path);
    if (!(abs + path.sep).startsWith(root)) { row.anchor_status = 'missing-file'; return; }
    // Re-check against the REAL path (resolves symlinks): a symlink inside the
    // target that points outside must still be rejected. readFileSync follows
    // symlinks, so this guard runs first.
    let real = abs;
    try {
      real = fs.realpathSync(abs);
      if (!isInside(targetRoot, real)) { row.anchor_status = 'missing-file'; return; }
    } catch {
      row.anchor_status = 'missing-file';
      return;
    }
    let content;
    try {
      content = fs.readFileSync(real, 'utf8');
    } catch {
      row.anchor_status = 'missing-file';
      return;
    }
    readCount++;
    const lines = content.split(/\r\n|\r|\n/);
    // Resolve the anchor. A precise line range (line_start>0) wins. Otherwise,
    // if the row carries a source_anchor substring, try to locate it.
    let start = Number(row.line_start) || 0;
    let end = Number(row.line_end) || 0;
    let status;
    if (start > 0 && end > 0) {
      status = 'precise';
    } else {
      const needle = row.source_anchor || '';
      if (needle) {
        const hits = [];
        for (let i = 0; i < lines.length; i++) if (lines[i].includes(needle)) hits.push(i + 1);
        if (hits.length === 1) { start = end = hits[0]; status = 'precise'; }
        else if (hits.length > 1) { status = 'ambiguous'; }
        else { status = 'missing'; }
      } else {
        // No anchor and no line range: existence-only; show the file head as a
        // pointer, but classify honestly as unresolved (no precise location).
        status = 'unresolved';
      }
    }
    row.anchor_status = status;
    if (status === 'precise') {
      // Center the snippet on the anchor line, bounded to [1, len], max 12 lines.
      const center = Math.max(1, start);
      const half = Math.floor(MAX_SNIPPET_LINES / 2);
      let s = Math.max(1, center - half);
      let e = Math.min(lines.length, s + MAX_SNIPPET_LINES - 1);
      s = Math.max(1, e - MAX_SNIPPET_LINES + 1);
      const out = [];
      for (let i = s; i <= e; i++) {
        const ln = String(i).padStart(4, ' ');
        out.push(ln + ' │ ' + (lines[i - 1] || ''));
      }
      row.source_excerpt = out.join('\n');
      snippetCount++;
    }
  };
  for (const row of (navAtlas.navigationIndex || [])) enrich(row);
  for (const row of (navAtlas.evidence || [])) enrich(row);
  console.error(`export-shell: snippet extraction — ${readCount} source file(s) read, ${snippetCount} precise snippet(s) attached (in-memory only; on-disk JSONL untouched)`);
  return navAtlas;
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
.triangulation-panel{margin-top:20px}.triangulation-absent{font-style:italic;padding:10px 14px;background:var(--surface-3);border:1px solid var(--line);border-radius:10px}
.triangulation-summary{color:var(--text);max-width:68ch}.badge-conflict{color:#9a4a2e;border-color:rgba(154,74,46,.4);background:rgba(154,74,46,.08)}
.triangulation-conflict-card{border-left:3px solid #9a4a2e}
.nav-route-list{margin-top:8px}.route-family-group{margin-top:18px}
.route-row{background:var(--surface-2);border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin-top:8px;display:flex;flex-wrap:wrap;gap:8px;align-items:baseline}
.route-row .route-row-title{font-weight:600;flex:1 1 320px}
.route-stage{background:var(--surface-3);border:1px solid var(--line);border-radius:8px;padding:10px 12px;margin-top:8px}
.route-stage .stage-head{font-weight:600;font-size:13px}.route-stage .stage-meta{font-family:ui-monospace,monospace;font-size:12px;color:var(--muted);word-break:break-all}
.badge-quality-high{color:#1d5e63;border-color:rgba(29,94,99,.4)}.badge-quality-medium{color:#9a4a2e;border-color:rgba(154,74,46,.4)}.badge-quality-low{color:#6f6450;border-color:rgba(111,100,80,.4)}
.badge-runtime{color:#9a4a2e;border-color:rgba(154,74,46,.4);background:rgba(154,74,46,.06)}
.receipt-status{padding:10px 14px;border-radius:10px;margin-top:8px}.receipt-status.verified{background:rgba(29,94,99,.08);border:1px solid rgba(29,94,99,.3)}
.receipt-status.failed{background:rgba(154,74,46,.08);border:1px solid rgba(154,74,46,.3)}.receipt-status.blocked,.receipt-status.not_assessed{background:var(--surface-3);border:1px solid var(--line)}
.validation-check{font-family:ui-monospace,monospace;font-size:12px;padding:4px 0;display:flex;gap:8px}
.check-icon-verified{color:#1d5e63}.check-icon-failed{color:#9a4a2e}.check-icon-blocked,.check-icon-not_assessed{color:var(--muted)}
/* reading experience (captain-atlas 15) — parchment tokens only, no new palette */
.walkthrough-panel{display:flex;flex-direction:column;gap:6px}
.walkthrough-summary{max-width:74ch;font-size:16px;margin:8px 0 4px}
.fleet-affordance{font-size:13px;margin:2px 0 6px}.cta-secondary{display:inline-block;padding:5px 12px;border-radius:8px;background:var(--surface-3);border:1px solid var(--line-strong);color:var(--accent);font-weight:600;font-size:13px}
.journey-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;margin-top:8px}
.journey-card,.risk-card,.probe-card{display:flex;flex-direction:column;gap:8px;border-left:3px solid var(--accent)}
.journey-card{border-left-color:var(--accent)}.risk-card{border-left-color:#9a4a2e}.probe-card{border-left-color:#6f6450}
.journey-title{font-size:17px;line-height:1.25}
.journey-summary{margin:2px 0}.journey-why{font-size:13px;margin:0}
.journey-facts{margin:6px 0 0;display:flex;flex-direction:column;gap:6px}
.fact-row{display:grid;grid-template-columns:110px 1fr;gap:8px;font-size:13px}
.fact-term{color:var(--muted);font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:.04em;align-self:start;padding-top:1px}
.fact-detail{margin:0;line-height:1.4}
.journey-next{display:flex;gap:8px;align-items:flex-start;margin-top:6px;padding:8px 10px;background:var(--surface-3);border:1px solid var(--line);border-radius:8px}
.journey-next-text{font-size:13px;line-height:1.45}
.risk-summary,.probe-why{margin:0;font-size:13px}
.risk-why{margin:0;font-size:12px}
.probe-perms{margin:4px 0 0;font-size:12px;font-family:ui-monospace,monospace}
.handoff-section{margin-top:18px;padding:14px 16px;background:var(--surface-3);border:1px solid var(--line);border-radius:12px}
.handoff-list{display:flex;flex-direction:column;gap:8px;margin-top:8px}
.handoff-row{display:grid;grid-template-columns:200px 1fr;gap:10px;align-items:center;font-size:12px}
.handoff-label{color:var(--muted);font-weight:600;font-size:12px}
.handoff-cmd{font-family:ui-monospace,monospace;background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:6px 8px;display:block;white-space:pre-wrap;word-break:break-all;color:var(--text)}
.route-thesis{font-size:16px;max-width:72ch;margin:8px 0;border-left:3px solid var(--accent);padding-left:12px}
.route-diagram-wrap{margin-top:14px}
.route-diagram{display:flex;flex-wrap:wrap;align-items:stretch;gap:6px;margin-top:6px}
.route-diagram-node{background:var(--surface-2);border:1px solid var(--line-strong);border-radius:10px;padding:10px 12px;min-width:150px;max-width:230px;display:flex;flex-direction:column;gap:4px}
.route-diagram-node.anchor-precise{border-left:3px solid #1d5e63}
.route-diagram-node.anchor-ambiguous,.route-diagram-node.anchor-missing,.route-diagram-node.anchor-missing-file,.route-diagram-node.anchor-unresolved{border-left:3px solid #9a4a2e;opacity:.92}
.route-diagram-arrow{align-self:center;font-size:20px;color:var(--line-strong);font-weight:700}
.rd-stage{font-weight:650;font-size:13px;line-height:1.25}.rd-role{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
.rd-badges{display:flex;flex-wrap:wrap;gap:4px;margin-top:2px}
.stage-card{display:flex;flex-direction:column;gap:7px;margin-top:8px}
.stage-head{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}
.stage-index{color:var(--muted);font-weight:700}.stage-title{font-weight:650;font-size:14px}.stage-role{font-size:11px}
.stage-meta{font-family:ui-monospace,monospace;font-size:12px;color:var(--muted);word-break:break-all;display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.stage-path{background:var(--surface-3);padding:2px 6px;border-radius:5px}
.stage-anchor{font-family:var(--font);font-style:italic}
.source-snippet{background:var(--surface-3);border:1px solid var(--line);border-radius:8px;padding:8px 10px;margin:4px 0 0;overflow-x:auto;font-family:ui-monospace,monospace;font-size:12px;line-height:1.5}
.snippet-line{display:block}
.anchor-explanation{font-style:italic;margin:2px 0 0;font-size:13px}
.anchor-badge-precise{color:#1d5e63;border-color:rgba(29,94,99,.4)}.anchor-badge-ambiguous,.anchor-badge-missing,.anchor-badge-missing-file,.anchor-badge-unresolved{color:#9a4a2e;border-color:rgba(154,74,46,.4)}
.route-truth{font-style:italic;padding:8px 10px;background:rgba(154,74,46,.06);border:1px solid rgba(154,74,46,.25);border-radius:8px}
.route-next{margin-top:14px}
.coverage-scale{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin-top:8px;margin-bottom:8px}
.coverage-metric{padding:10px 12px}.coverage-region{margin-top:14px}
.coverage-card .coverage-links{margin:4px 0 0;font-size:11px;font-family:ui-monospace,monospace}
.nav-item-secondary{margin-left:auto;background:var(--surface-3)}
/* captain-atlas 16 drill-down — parchment tokens only, no new palette */
.section-intro{max-width:72ch;margin:6px 0 10px;border-left:2px solid var(--line-strong);padding-left:10px}
.rel-from-to{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:10px 0}
.rel-endpoint{background:var(--surface-2);border:1px solid var(--line);border-radius:10px;padding:10px 14px;min-width:140px}
.rel-endpoint-link{font-weight:600;font-size:14px}.rel-endpoint .rd-role{margin-top:4px}
.stage-title-link{font-weight:650;font-size:14px;color:var(--accent)}
.route-diagram-node[data-portolan-kind='stage-target']{cursor:pointer;transition:border-color .1s}
.route-diagram-node[data-portolan-kind='stage-target']:hover{border-color:var(--primary)}
.evidence-usability-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin:10px 0}
.eu-axis-card{display:flex;flex-direction:column;gap:6px}
.eu-axis-verdict{font-size:18px;font-weight:700}
.eu-verdict-verified,.eu-verdict-anchored,.eu-verdict-runtime_verified{color:#1d5e63}
.eu-verdict-runtime_partial{color:#9a4a2e}
.eu-verdict-partial{color:#9a4a2e}
.eu-verdict-failed,.eu-verdict-weak,.eu-verdict-none{color:#9a4a2e}
.eu-verdict-blocked,.eu-verdict-not_assessed,.eu-verdict-runtime_not_assessed{color:var(--muted)}
.eu-axis-copy{font-size:12px;line-height:1.4;margin:0}
.evidence-stage-counts{font-size:12px;margin:2px 0 8px}
.evidence-caveat{font-style:italic;padding:8px 10px;background:rgba(154,74,46,.06);border:1px solid rgba(154,74,46,.25);border-radius:8px}
.evidence-truth{font-style:italic;font-size:12px}
.c4-panel{display:flex;flex-direction:column;gap:4px}
.c4-box{border-left:3px solid var(--accent)}
.c4-honest-empty{padding:10px 14px;background:var(--surface-3);border:1px dashed var(--line-strong);border-radius:10px;margin-top:4px}
.c4-honest-empty .muted{margin:0;font-style:italic}
.c4-limited{font-style:italic;font-size:12px;margin-bottom:6px}
.c4-code-handoff{font-style:italic;font-size:13px}
.finding-context-derived,.probe-context-derived{font-style:italic;font-size:12px;padding:6px 10px;background:var(--surface-3);border:1px solid var(--line);border-radius:8px}
/* captain-atlas 17 semantic investigation + ecosystem map — parchment tokens only */
.semantic-investigation .dossier-section{margin-top:16px}
.ecosystem-map .ecosystem-region-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-top:8px}
.ecosystem-region{display:flex;flex-direction:column;gap:8px}
.ecosystem-placement{border-left:3px solid var(--accent)}
.ecosystem-overlap{border-left:3px solid var(--primary)}
.semantic-investigation .badge[data-portolan-source-boundary]{font-size:10px}
`;

function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.systemMap || !args.out) {
    console.error('usage: export-shell.mjs --system-map <map.json> --out <index.html> [--title "..."] [--nav-bundle <dir>] [--target-root <dir>] [--semantic-investigation <si.json>]');
    process.exit(args.help ? 0 : 2);
  }
  const map = JSON.parse(fs.readFileSync(args.systemMap, 'utf8'));
  if (!map.objects || !Array.isArray(map.objects.components)) {
    console.error('error: not a valid system-map (missing objects.components)');
    process.exit(1);
  }

  // Assemble the clean stack from shell.js entry.
  const bundle = assemble(path.join(SRC, 'shell.js'), { name: '__PORTOLAN' });
  let navAtlas = loadNavAtlas(args.navBundle);
  // Enrich the IN-MEMORY nav-atlas with source snippets + anchor status when a
  // target root is supplied (captain-atlas 15 §5). The on-disk JSONL is NEVER
  // mutated — enriched rows live only in the inlined __NAV_ATLAS.
  if (navAtlas && args.targetRoot) navAtlas = extractSnippets(navAtlas, args.targetRoot);
  // captain-atlas 17: load the semantic-investigation sidecar (optional). When
  // present, it powers the component investigation pages and the ecosystem
  // placement map. Absent => the semantic surfaces are simply not rendered
  // (additive — existing flows are unaffected).
  let semanticInvestigation = null;
  if (args.semanticInvestigation) {
    if (!fs.existsSync(args.semanticInvestigation)) {
      console.error(`warning: semantic-investigation not found: ${args.semanticInvestigation}`);
    } else {
      semanticInvestigation = JSON.parse(fs.readFileSync(args.semanticInvestigation, 'utf8'));
    }
  }
  // safeInlineJson escapes U+2028/U+2029 and < so the inlined blobs cannot
  // break the <script> (applied to atlas, nav-atlas, and semantic-investigation).
  const mapJson = safeInlineJson(map);
  const navJson = navAtlas ? safeInlineJson(navAtlas) : 'null';
  const siJson = semanticInvestigation ? safeInlineJson(semanticInvestigation) : 'null';
  const navArgLine = navAtlas ? ', navAtlas: __NAV_ATLAS' : '';
  const siArgLine = semanticInvestigation ? ', semanticInvestigation: __SEMANTIC_INVESTIGATION' : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtmlText(args.title)}</title>
<style>${BASE_CSS}</style>
</head>
<body>
<div id="app"></div>
<script>
var __ATLAS = ${mapJson};
var __NAV_ATLAS = ${navJson};
var __SEMANTIC_INVESTIGATION = ${siJson};
${bundle}
(function(){
  var shell = __PORTOLAN.createPortolanShell({ root: document.getElementById('app'), atlas: __ATLAS${navArgLine}${siArgLine} });
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
  const navCount = navAtlas ? `${navAtlas.navigationIndex.length} nav-stages, ${navAtlas.findings.length} findings, ${navAtlas.unknownProbes.length} probes` : 'no nav-atlas';
  const siCount = semanticInvestigation ? `${semanticInvestigation.sample.components.length} investigated components` : 'no semantic-investigation';
  console.error(`exported clean-stack shell → ${args.out} (${comps.length} units, ${rels.length} relationships, ${fams.length} families, ${navCount}, ${siCount}, ${Buffer.byteLength(html)} bytes)`);
}

main();
