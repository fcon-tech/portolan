/**
 * Unit tests for intake-file-store adapter — reads/writes .portolan/intake.json.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { createIntakeFileStore } = require('../../src/adapters/intake-file-store');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'portolan-intake-'));
}

test('intake-file-store: save then load round-trips the intake result', () => {
  const dir = tmpDir();
  const store = createIntakeFileStore(dir);
  const result = { target_root: '/r', anchors: [{ id: 'a1', kind: 'repository', location: '/r', access_method: 'local' }], perimeter: ['/r'] };
  store.save(result);
  assert.ok(store.exists());
  const loaded = store.load();
  assert.deepStrictEqual(loaded, result);
  fs.rmSync(dir, { recursive: true });
});

test('intake-file-store: load returns null when no file exists', () => {
  const dir = tmpDir();
  const store = createIntakeFileStore(dir);
  assert.strictEqual(store.exists(), false);
  assert.strictEqual(store.load(), null);
  fs.rmSync(dir, { recursive: true });
});

test('intake-file-store: save creates the .portolan directory if absent', () => {
  const dir = tmpDir();
  const store = createIntakeFileStore(dir);
  assert.ok(!fs.existsSync(path.join(dir, '.portolan')));
  store.save({ target_root: '/r', anchors: [], perimeter: [] });
  assert.ok(fs.existsSync(path.join(dir, '.portolan', 'intake.json')));
  fs.rmSync(dir, { recursive: true });
});

test('intake-file-store: path() returns the full file path', () => {
  const store = createIntakeFileStore('/tmp/fake-target');
  assert.ok(store.path().endsWith('.portolan/intake.json'));
});
