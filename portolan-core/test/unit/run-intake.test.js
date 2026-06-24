/**
 * Unit tests for run-intake use-case — builds a typed intake result from raw
 * admiral answers.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { runIntake, intakeFromAnchors } = require('../../src/use-cases/run-intake');

test('runIntake: builds a valid result from a repo root + docs anchor', () => {
  const r = runIntake({
    target_root: '/repos/bigtop',
    anchors: [
      { kind: 'repository', location: '/repos/bigtop', access_method: 'local' },
      { kind: 'docs', location: 'https://bigtop.apache.org/docs', access_method: 'api' },
    ],
  });
  assert.strictEqual(r.target_root, '/repos/bigtop');
  assert.strictEqual(r.anchors.length, 2);
  assert.ok(r.anchors[0].id);
  assert.ok(r.generated_at);
  assert.deepStrictEqual(r.perimeter, ['/repos/bigtop']);
});

test('runIntake: throws on invalid input (no target_root)', () => {
  assert.throws(() => runIntake({ anchors: [] }), /target_root/i);
});

test('runIntake: throws on no anchors', () => {
  assert.throws(() => runIntake({ target_root: '/x', anchors: [] }), /at least one anchor/i);
});

test('runIntake: assigns stable ids to anchors that are deterministic', () => {
  const a = runIntake({ target_root: '/r', anchors: [{ kind: 'repository', location: '/r', access_method: 'local' }] });
  const b = runIntake({ target_root: '/r', anchors: [{ kind: 'repository', location: '/r', access_method: 'local' }] });
  assert.strictEqual(a.anchors[0].id, b.anchors[0].id);
});

test('runIntake: perimeter defaults to [target_root] when not provided', () => {
  const r = runIntake({ target_root: '/r', anchors: [{ kind: 'repository', location: '/r', access_method: 'local' }] });
  assert.deepStrictEqual(r.perimeter, ['/r']);
});

test('runIntake: explicit perimeter overrides default', () => {
  const r = runIntake({
    target_root: '/r',
    anchors: [{ kind: 'repository', location: '/r', access_method: 'local' }],
    perimeter: ['/r', '/other'],
  });
  assert.deepStrictEqual(r.perimeter, ['/r', '/other']);
});

test('runIntake: architectural_principles carried through when provided', () => {
  const r = runIntake({
    target_root: '/r',
    anchors: [{ kind: 'repository', location: '/r', access_method: 'local' }],
    architectural_principles: ['no-circular-deps'],
  });
  assert.deepStrictEqual(r.architectural_principles, ['no-circular-deps']);
});

test('intakeFromAnchors: convenience builder from a list of [kind, location, method]', () => {
  const r = intakeFromAnchors('/r', [['repository', '/r', 'local'], ['docs', '/d', 'file']]);
  assert.strictEqual(r.anchors.length, 2);
  assert.strictEqual(r.anchors[0].kind, 'repository');
});

test('runIntake: the produced result passes validateIntakeResult', () => {
  const { validateIntakeResult } = require('../../src/domain/intake-result');
  const r = runIntake({ target_root: '/r', anchors: [{ kind: 'repository', location: '/r', access_method: 'local' }] });
  assert.deepStrictEqual(validateIntakeResult(r), []);
});
