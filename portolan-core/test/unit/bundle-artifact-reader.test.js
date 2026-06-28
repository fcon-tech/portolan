/**
 * Unit tests for the bundle-artifact-reader port guard and the fs adapter.
 *
 * The port guard is tested the same way as the other ports (ports.test.js).
 * The adapter is exercised over a throwaway tmpdir bundle: JSON, JSONL,
 * head-with-truncation, absence tolerance, and producer-subdir listing.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { isBundleArtifactReader } = require('../../src/ports/bundle-artifact-reader');
const { createBundleArtifactReader } = require('../../src/adapters/bundle-artifact-reader');

function tmpBundle() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portolan-bundle-'));
  return { dir, clean: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

test('isBundleArtifactReader: conforming adapter passes', () => {
  const r = createBundleArtifactReader('/tmp/fake-bundle');
  assert.ok(isBundleArtifactReader(r));
});

test('isBundleArtifactReader: missing method or missing bundleDir fails', () => {
  assert.strictEqual(isBundleArtifactReader({ readJson(){} }), false);
  assert.strictEqual(isBundleArtifactReader(null), false);
  // missing iterateJsonl/size fails under the expanded contract
  assert.strictEqual(isBundleArtifactReader({ readJson(){}, readJsonl(){}, readJsonlHead(){}, exists(){}, listProducerDirs(){}, bundleDir:'/x' }), false);
  assert.strictEqual(isBundleArtifactReader({ readJson(){}, readJsonl(){}, readJsonlHead(){}, iterateJsonl(){}, exists(){}, listProducerDirs(){}, bundleDir:'/x' }), false);
});

test('readJson: parses a JSON artifact, returns null when absent', () => {
  const { dir, clean } = tmpBundle();
  try {
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ schema_version: '0.1.0' }));
    const r = createBundleArtifactReader(dir);
    assert.deepStrictEqual(r.readJson('manifest.json'), { schema_version: '0.1.0' });
    assert.strictEqual(r.readJson('absent.json'), null);
    assert.deepStrictEqual(r.readJson('manifest.json'), { schema_version: '0.1.0' }); // re-read ok
  } finally { clean(); }
});

test('readJson: returns null for malformed JSON (not throw)', () => {
  const { dir, clean } = tmpBundle();
  try {
    fs.writeFileSync(path.join(dir, 'broken.json'), '{ not json');
    const r = createBundleArtifactReader(dir);
    assert.strictEqual(r.readJson('broken.json'), null);
  } finally { clean(); }
});

test('readJsonl: parses records, skips blank/malformed lines, returns [] when absent', () => {
  const { dir, clean } = tmpBundle();
  try {
    const lines = [
      JSON.stringify({ id: 'h1', kind: 'duplication' }),
      '',
      '  ',
      '{ malformed',
      JSON.stringify({ id: 'h2', kind: 'config' }),
    ].join('\n');
    fs.writeFileSync(path.join(dir, 'hotspots.jsonl'), lines);
    const r = createBundleArtifactReader(dir);
    const records = r.readJsonl('hotspots.jsonl');
    assert.strictEqual(records.length, 2);
    assert.strictEqual(records[0].id, 'h1');
    assert.strictEqual(records[1].id, 'h2');
    assert.deepStrictEqual(r.readJsonl('absent.jsonl'), []);
  } finally { clean(); }
});

test('readJsonlHead: returns first N records and sets truncated when more remain', () => {
  const { dir, clean } = tmpBundle();
  try {
    const lines = [0, 1, 2, 3, 4].map((i) => JSON.stringify({ i })).join('\n');
    fs.writeFileSync(path.join(dir, 'gaps.jsonl'), lines);
    const r = createBundleArtifactReader(dir);
    const head = r.readJsonlHead('gaps.jsonl', 2);
    assert.strictEqual(head.records.length, 2);
    assert.strictEqual(head.records[0].i, 0);
    assert.strictEqual(head.truncated, true);

    const exact = r.readJsonlHead('gaps.jsonl', 5);
    assert.strictEqual(exact.records.length, 5);
    assert.strictEqual(exact.truncated, false);

    const over = r.readJsonlHead('gaps.jsonl', 99);
    assert.strictEqual(over.records.length, 5);
    assert.strictEqual(over.truncated, false);

    const absent = r.readJsonlHead('absent.jsonl', 10);
    assert.strictEqual(absent.records.length, 0);
    assert.strictEqual(absent.truncated, false);
  } finally { clean(); }
});

test('readJsonl: handles nested-path names (map-bridge/evidence-index.jsonl)', () => {
  const { dir, clean } = tmpBundle();
  try {
    fs.mkdirSync(path.join(dir, 'map-bridge'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'map-bridge', 'evidence-index.jsonl'), JSON.stringify({ id: 'ev1' }) + '\n');
    const r = createBundleArtifactReader(dir);
    assert.strictEqual(r.readJsonl('map-bridge/evidence-index.jsonl').length, 1);
    assert.strictEqual(r.exists('map-bridge/evidence-index.jsonl'), true);
  } finally { clean(); }
});

test('exists: reports artifact presence', () => {
  const { dir, clean } = tmpBundle();
  try {
    fs.writeFileSync(path.join(dir, 'repos.json'), '[]');
    const r = createBundleArtifactReader(dir);
    assert.strictEqual(r.exists('repos.json'), true);
    assert.strictEqual(r.exists('nope.json'), false);
  } finally { clean(); }
});

test('listProducerDirs: lists producer subdirs, returns [] when absent', () => {
  const { dir, clean } = tmpBundle();
  try {
    fs.mkdirSync(path.join(dir, 'producers', 'syft'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'producers', 'jscpd'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'producers', 'README.md'), 'not a dir');
    const r = createBundleArtifactReader(dir);
    const dirs = r.listProducerDirs().sort();
    assert.deepStrictEqual(dirs, ['jscpd', 'syft']);
    const r2 = createBundleArtifactReader(os.tmpdir());
    assert.deepStrictEqual(r2.listProducerDirs().includes('syft'), false);
  } finally { clean(); }
});

test('bundleDir: exposes the absolute bundle path', () => {
  const r = createBundleArtifactReader('relative/bundle');
  assert.ok(path.isAbsolute(r.bundleDir));
  assert.ok(r.bundleDir.endsWith('relative/bundle'));
});

test('size: reports artifact byte size, null when absent', () => {
  const { dir, clean } = tmpBundle();
  try {
    fs.writeFileSync(path.join(dir, 'manifest.json'), '{"a":1}');
    const r = createBundleArtifactReader(dir);
    assert.strictEqual(r.size('manifest.json'), 7);
    assert.strictEqual(r.size('absent.json'), null);
  } finally { clean(); }
});

test('iterateJsonl: yields parsed records and stops on caller break (streaming)', () => {
  const { dir, clean } = tmpBundle();
  try {
    const lines = [0, 1, 2, 3, 4].map((i) => JSON.stringify({ i })).join('\n');
    fs.writeFileSync(path.join(dir, 'gaps.jsonl'), lines);
    const r = createBundleArtifactReader(dir);
    const seen = [];
    for (const rec of r.iterateJsonl('gaps.jsonl')) {
      seen.push(rec.i);
      if (seen.length === 2) break; // early termination
    }
    assert.deepStrictEqual(seen, [0, 1]);
    // full iteration yields all 5
    const all = [...r.iterateJsonl('gaps.jsonl')];
    assert.strictEqual(all.length, 5);
  } finally { clean(); }
});

test('iterateJsonl: yields nothing for an absent file (does not throw)', () => {
  const { dir, clean } = tmpBundle();
  try {
    const r = createBundleArtifactReader(dir);
    assert.deepStrictEqual([...r.iterateJsonl('absent.jsonl')], []);
  } finally { clean(); }
});

test('iterateJsonl: skips malformed lines silently', () => {
  const { dir, clean } = tmpBundle();
  try {
    const lines = [JSON.stringify({ ok: 1 }), '{ bad', JSON.stringify({ ok: 2 })].join('\n');
    fs.writeFileSync(path.join(dir, 'hotspots.jsonl'), lines);
    const r = createBundleArtifactReader(dir);
    const recs = [...r.iterateJsonl('hotspots.jsonl')];
    assert.strictEqual(recs.length, 2);
    assert.deepStrictEqual(recs.map((x) => x.ok), [1, 2]);
  } finally { clean(); }
});
