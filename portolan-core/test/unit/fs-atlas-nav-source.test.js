/**
 * Unit tests for the fs-atlas-nav-source adapter.
 *
 * Builds a temporary fixture tree, then exercises boundary-aware enumeration
 * (Bigtop repos/*, portolan-self regions) and deterministic anchor matching
 * (single/no/multiple matches).
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createFsAtlasNavSource } = require('../../src/adapters/fs-atlas-nav-source');

// Track all temp dirs so they can be cleaned up after the suite.
const TMP_DIRS = [];
function registerTmp(dir) { TMP_DIRS.push(dir); return dir; }

// Clean up every temp dir after the whole suite (no per-test leakage).
test.after(() => {
  for (const dir of TMP_DIRS) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
  }
});

// Build a tmp Bigtop-like tree.
function bigtopTree() {
  const dir = registerTmp(fs.mkdtempSync(path.join(os.tmpdir(), 'nav-big-')));
  fs.mkdirSync(path.join(dir, 'repos', 'apache-bigtop-repo'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'repos', 'apache-bigtop-repo', 'bigtop.bom'), 'bigtop version 3.5.0\n');
  fs.mkdirSync(path.join(dir, 'repos', 'apache-spark'), { recursive: true });
  // forbidden dirs that must NOT be enumerated (dot-dir + BIGTOP_FORBIDDEN set)
  fs.mkdirSync(path.join(dir, 'repos', '.hidden'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'repos', 'node_modules'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'repos', '.portolan'), { recursive: true });
  return dir;
}

// Build a tmp portolan-self-like tree.
function selfTree() {
  const dir = registerTmp(fs.mkdtempSync(path.join(os.tmpdir(), 'nav-self-')));
  for (const r of ['cmd/portolan', 'internal', 'scripts', 'viewer', 'portolan-core', 'schema', 'internal/testfixtures']) {
    fs.mkdirSync(path.join(dir, r), { recursive: true });
  }
  fs.writeFileSync(path.join(dir, 'cmd', 'portolan', 'main.go'), 'package main\nfunc main(){ app.Run() }\n');
  return dir;
}

test('enumerateSubjects(bigtop): lists repos/* non-dot dirs, skips forbidden', () => {
  const src = createFsAtlasNavSource(bigtopTree());
  const subjects = src.enumerateSubjects('bigtop');
  const ids = subjects.map(s => s.subject_id);
  assert.ok(ids.includes('repo:apache-bigtop-repo'));
  assert.ok(ids.includes('repo:apache-spark'));
  assert.ok(!ids.some(id => /\.hidden/.test(id)), 'hidden dir not enumerated');
  assert.ok(!ids.some(id => /node_modules/.test(id)), 'node_modules (BIGTOP_FORBIDDEN) not enumerated');
  assert.ok(!ids.some(id => /\.portolan/.test(id)), '.portolan (BIGTOP_FORBIDDEN) not enumerated');
  for (const s of subjects) { assert.strictEqual(s.exists, true); assert.strictEqual(s.promotion_state, 'promoted'); }
});

test('enumerateSubjects(portolan-self): lists the six required regions', () => {
  const src = createFsAtlasNavSource(selfTree());
  const subjects = src.enumerateSubjects('portolan-self');
  const ids = subjects.map(s => s.subject_id);
  for (const required of ['region:go-cli', 'region:scripts', 'region:viewer', 'region:portolan-core', 'region:schemas', 'region:fixtures']) {
    assert.ok(ids.includes(required), `${required} enumerated`);
  }
});

test('enumerateSubjects(portolan-self): missing region marked exists:false', () => {
  const dir = selfTree();
  fs.rmSync(path.join(dir, 'schema'), { recursive: true, force: true });
  const src = createFsAtlasNavSource(dir);
  const schemas = src.enumerateSubjects('portolan-self').find(s => s.subject_id === 'region:schemas');
  assert.strictEqual(schemas.exists, false);
  assert.strictEqual(schemas.promotion_state, 'missing');
});

test('resolveAnchors: single substring match records line range', () => {
  const dir = selfTree();
  const src = createFsAtlasNavSource(dir);
  const out = src.resolveAnchors([{ key: 'k', file: 'cmd/portolan/main.go', substring: 'app.Run' }]);
  const r = out.get('k');
  assert.strictEqual(r.found, true);
  assert.strictEqual(r.matchCount, 1);
  assert.ok(r.lineStart >= 1);
});

test('resolveAnchors: no match -> found:false, 0/0', () => {
  const dir = selfTree();
  const src = createFsAtlasNavSource(dir);
  const out = src.resolveAnchors([{ key: 'k', file: 'cmd/portolan/main.go', substring: 'NOT_PRESENT' }]);
  const r = out.get('k');
  assert.strictEqual(r.found, false);
  assert.strictEqual(r.lineStart, 0);
  assert.strictEqual(r.matchCount, 0);
});

test('resolveAnchors: multiple matches -> found:true, 0/0, matchCount>1', () => {
  const dir = selfTree();
  fs.writeFileSync(path.join(dir, 'cmd', 'dup.txt'), 'foo\nfoo\nfoo\n');
  const src = createFsAtlasNavSource(dir);
  const out = src.resolveAnchors([{ key: 'k', file: 'cmd/dup.txt', substring: 'foo' }]);
  const r = out.get('k');
  assert.strictEqual(r.found, true);
  assert.strictEqual(r.matchCount, 3);
  assert.strictEqual(r.lineStart, 0);
  assert.strictEqual(r.lineEnd, 0);
});

test('resolveAnchors: empty substring -> existence check only', () => {
  const dir = selfTree();
  const src = createFsAtlasNavSource(dir);
  const out = src.resolveAnchors([{ key: 'k', file: 'schema', substring: '' }]);
  const r = out.get('k');
  assert.strictEqual(r.found, true); // schema dir exists
});

test('exists + findFile: capability checks for profile selection', () => {
  const dir = bigtopTree();
  const src = createFsAtlasNavSource(dir);
  assert.strictEqual(src.exists('repos/apache-bigtop-repo'), true);
  assert.strictEqual(src.exists('repos/nope'), false);
  assert.ok(src.findFile('bigtop.bom', 'repos'));
});
