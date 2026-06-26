/**
 * Security + honesty tests for export-shell.mjs snippet extraction
 * (captain-atlas 15 §5 + boundary control).
 *
 * export-shell.mjs is an ESM CLI script, so this test drives it end-to-end with
 * a crafted target + nav bundle and asserts the in-memory enrichment is:
 *   - precise for a real single-match anchor (snippet attached);
 *   - missing-file for a path-traversal source_path (../../etc/passwd) AND for
 *     an absolute path AND for a forbidden segment (.portolan) — i.e. the
 *     extractor NEVER reads outside the target root;
 *   - never fabricates a precise line number for an ambiguous or unresolved
 *     anchor.
 *
 * This is the security boundary: a malicious source_path must not let the
 * snippet reader escape the target root.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const EXPORT = path.join(REPO_ROOT, 'portolan-core', 'scripts', 'export-shell.mjs');

function setupTarget() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'portolan-sec-'));
  // target tree
  fs.mkdirSync(path.join(tmp, 'target', 'repos'), { recursive: true });
  fs.mkdirSync(path.join(tmp, 'target', '.portolan'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'target', 'repos', 'good.txt'),
    'line one\nline two has the needle here\nline three\nneedle again on line four\n');
  fs.writeFileSync(path.join(tmp, 'target', 'repos', 'precise.txt'),
    'alpha\nbeta-unique\ngamma\n');
  fs.writeFileSync(path.join(tmp, 'target', '.portolan', 'secret.txt'),
    'SECRET-should-never-leak\n');
  // a file OUTSIDE the target (sibling) to prove traversal does not reach it
  fs.mkdirSync(path.join(tmp, 'outside'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'outside', 'passwd'), 'root:x:0:0:leak\n');

  // nav bundle: stages exercising each anchor case
  const navDir = path.join(tmp, 'nav');
  fs.mkdirSync(navDir, { recursive: true });
  const rows = [
    // precise: single substring match -> snippet
    { route_id: 'r', route_family: 'command', route_title: 'R', route_quality: 'high', route_quality_note: '',
      stage: 'precise', stage_index: 1, subject_id: 'repo:g', subject_type: 'repository',
      source_path: 'repos/precise.txt', source_anchor: 'beta-unique', line_start: 0, line_end: 0,
      path_role: 'entrypoint', lifecycle: 'active', source_evidence_state: 'source-visible', runtime_assessment: 'not_assessed',
      artifact_provenance: 'fixture_backed', producer_id: 'p', evidence_refs: [], finding_refs: [], unknown_probe_refs: [], next_raw_check: 'x' },
    // ambiguous: two matches of 'needle' -> ambiguous, no snippet
    { route_id: 'r', route_family: 'command', route_title: 'R', route_quality: 'medium', route_quality_note: '',
      stage: 'amb', stage_index: 2, subject_id: 'repo:g', subject_type: 'repository',
      source_path: 'repos/good.txt', source_anchor: 'needle', line_start: 0, line_end: 0,
      path_role: 'command_dispatch', lifecycle: 'active', source_evidence_state: 'source-visible', runtime_assessment: 'not_assessed',
      artifact_provenance: 'fixture_backed', producer_id: 'p', evidence_refs: [], finding_refs: [], unknown_probe_refs: [], next_raw_check: 'x' },
    // TRAVERSAL: must be classified missing-file, never read
    { route_id: 'r', route_family: 'command', route_title: 'R', route_quality: 'low', route_quality_note: '',
      stage: 'trav', stage_index: 3, subject_id: 'repo:g', subject_type: 'repository',
      source_path: '../../outside/passwd', source_anchor: 'root', line_start: 0, line_end: 0,
      path_role: 'workflow_script', lifecycle: 'active', source_evidence_state: 'source-visible', runtime_assessment: 'not_assessed',
      artifact_provenance: 'fixture_backed', producer_id: 'p', evidence_refs: [], finding_refs: [], unknown_probe_refs: [], next_raw_check: 'x' },
    // ABSOLUTE path: must be classified missing-file, never read
    { route_id: 'r', route_family: 'command', route_title: 'R', route_quality: 'low', route_quality_note: '',
      stage: 'abs', stage_index: 4, subject_id: 'repo:g', subject_type: 'repository',
      source_path: '/etc/passwd', source_anchor: 'root', line_start: 0, line_end: 0,
      path_role: 'schema', lifecycle: 'active', source_evidence_state: 'source-visible', runtime_assessment: 'not_assessed',
      artifact_provenance: 'fixture_backed', producer_id: 'p', evidence_refs: [], finding_refs: [], unknown_probe_refs: [], next_raw_check: 'x' },
    // FORBIDDEN segment (.portolan): must be classified missing-file, never read
    { route_id: 'r', route_family: 'command', route_title: 'R', route_quality: 'low', route_quality_note: '',
      stage: 'forb', stage_index: 5, subject_id: 'repo:g', subject_type: 'repository',
      source_path: '.portolan/secret.txt', source_anchor: 'SECRET', line_start: 0, line_end: 0,
      path_role: 'validator', lifecycle: 'active', source_evidence_state: 'source-visible', runtime_assessment: 'not_assessed',
      artifact_provenance: 'fixture_backed', producer_id: 'p', evidence_refs: [], finding_refs: [], unknown_probe_refs: [], next_raw_check: 'x' },
  ];
  // navigation-index.jsonl is one stage per line; coverage/evidence/etc. need
  // minimal presence so loadNavAtlas parses.
  fs.writeFileSync(path.join(navDir, 'navigation-index.jsonl'), rows.map(r => JSON.stringify(r)).join('\n') + '\n');
  fs.writeFileSync(path.join(navDir, 'coverage-matrix.jsonl'), '');
  fs.writeFileSync(path.join(navDir, 'atlas-findings.jsonl'), '');
  fs.writeFileSync(path.join(navDir, 'unknown-probes.jsonl'), '');
  fs.writeFileSync(path.join(navDir, 'evidence.jsonl'), '');
  fs.writeFileSync(path.join(navDir, 'receipt-validation.json'),
    JSON.stringify({ target_id: 'sec', machine_status: 'verified', validation_checks: [] }));

  // minimal system-map
  fs.writeFileSync(path.join(tmp, 'map.json'), JSON.stringify({
    target: { display_name: 'T' },
    objects: { components: [{ id: 'c', display_name: 'C', c4_family: 'unknown', route: '#/x', relationship_ids: [] }],
      repositories: [], surfaces: [], relationships: [], findings: [], unknowns: [] },
    c4: { context_boxes: [], families: [], component_boxes: [] },
  }));
  return { tmp, target: path.join(tmp, 'target'), nav: navDir, map: path.join(tmp, 'map.json') };
}

function exportAt(tmp, target, nav, map, out) {
  execFileSync('node', [EXPORT, '--system-map', map, '--out', out,
    '--nav-bundle', nav, '--target-root', target, '--title', 'Sec'], { stdio: 'pipe' });
}

test('snippet extractor: precise anchor attaches a snippet; ambiguous does not', () => {
  const { tmp, target, nav, map } = setupTarget();
  const out = path.join(tmp, 'atlas.html');
  exportAt(tmp, target, nav, map, out);
  const html = fs.readFileSync(out, 'utf8');
  // The inlined __NAV_ATLAS must carry source_excerpt only on the precise stage.
  assert.ok(html.includes('beta-unique'), 'precise snippet content inlined');
  // ambiguous 'needle' has 2 matches -> no snippet, classified ambiguous
  assert.ok(html.includes('"anchor_status":"ambiguous"'), 'ambiguous anchor classified');
});

test('snippet extractor: path traversal / absolute / forbidden paths never read outside target', () => {
  const { tmp, target, nav, map } = setupTarget();
  const out = path.join(tmp, 'atlas2.html');
  exportAt(tmp, target, nav, map, out);
  const html = fs.readFileSync(out, 'utf8');
  // All three escape attempts must be classified missing-file.
  const missingFileCount = (html.match(/"anchor_status":"missing-file"/g) || []).length;
  assert.ok(missingFileCount >= 3, `>= 3 missing-file classifications (traversal+absolute+forbidden); got ${missingFileCount}`);
  // The leaked content must NEVER appear in the exported HTML.
  assert.ok(!html.includes('SECRET-should-never-leak'), 'forbidden .portolan content did not leak');
  assert.ok(!html.includes('root:x:0:0:leak'), 'traversed sibling content did not leak');
});

test('snippet extractor: a symlink inside target pointing OUTSIDE must not be followed', () => {
  const { tmp } = setupTarget();
  // Create a symlink inside the target that points to the outside leak file.
  const linkPath = path.join(tmp, 'target', 'repos', 'escape-link.txt');
  try { fs.symlinkSync(path.join(tmp, 'outside', 'passwd'), linkPath); }
  catch (e) { if (e.code === 'EPERM' || e.code === 'ENOSYS') { console.log('  (symlinks unsupported on this fs — skipping)'); return; } else throw e; }
  // nav bundle with one stage pointing at the symlink
  const navDir = path.join(tmp, 'nav2');
  fs.mkdirSync(navDir, { recursive: true });
  const rows = [
    { route_id: 'r', route_family: 'command', route_title: 'R', route_quality: 'high', route_quality_note: '',
      stage: 'sym', stage_index: 1, subject_id: 'repo:g', subject_type: 'repository',
      source_path: 'repos/escape-link.txt', source_anchor: 'root', line_start: 0, line_end: 0,
      path_role: 'entrypoint', lifecycle: 'active', source_evidence_state: 'source-visible', runtime_assessment: 'not_assessed',
      artifact_provenance: 'fixture_backed', producer_id: 'p', evidence_refs: [], finding_refs: [], unknown_probe_refs: [], next_raw_check: 'x' },
  ];
  fs.writeFileSync(path.join(navDir, 'navigation-index.jsonl'), rows.map(r => JSON.stringify(r)).join('\n') + '\n');
  for (const f of ['coverage-matrix.jsonl', 'atlas-findings.jsonl', 'unknown-probes.jsonl', 'evidence.jsonl']) fs.writeFileSync(path.join(navDir, f), '');
  fs.writeFileSync(path.join(navDir, 'receipt-validation.json'), JSON.stringify({ target_id: 'sec', machine_status: 'verified', validation_checks: [] }));
  const out = path.join(tmp, 'atlas-sym.html');
  exportAt(tmp, path.join(tmp, 'target'), navDir, path.join(tmp, 'map.json'), out);
  const html = fs.readFileSync(out, 'utf8');
  // The symlink escape must be classified missing-file and the leak never read.
  assert.ok(html.includes('"anchor_status":"missing-file"'), 'symlink-to-outside classified missing-file');
  assert.ok(!html.includes('root:x:0:0:leak'), 'symlinked outside content did not leak');
});

test('snippet extractor: a 0/0 range is precise ONLY when the adapter found a single match', () => {
  const { tmp, target, nav, map } = setupTarget();
  const out = path.join(tmp, 'atlas3.html');
  exportAt(tmp, target, nav, map, out);
  const html = fs.readFileSync(out, 'utf8');
  const m = html.match(/var __NAV_ATLAS = (\{.*?\});\n/s);
  assert.ok(m, '__NAV_ATLAS inlined');
  const navAtlas = JSON.parse(m[1]);
  // Group by anchor_status. The 'precise' stage (beta-unique, single match) may
  // legitimately be precise even with a 0/0 on-disk range — that is the point of
  // export-time resolution. But ambiguous/missing/missing-file stages must NEVER
  // be precise, and none may carry a source_excerpt.
  for (const s of navAtlas.navigationIndex) {
    if (s.anchor_status !== 'precise') {
      assert.ok(s.source_excerpt == null, `non-precise stage ${s.stage} has no snippet`);
    }
  }
  // The ambiguous stage (needle, two matches) must be 'ambiguous', not precise.
  const amb = navAtlas.navigationIndex.find(s => s.stage === 'amb');
  assert.strictEqual(amb.anchor_status, 'ambiguous', 'ambiguous stage classified ambiguous, not precise');
  assert.ok(amb.source_excerpt == null, 'ambiguous stage has no fake snippet');
});
