/**
 * Unit tests for intake-result domain — the typed artefact produced by the root
 * Portolan skill's conversational intake (charter 08 "Managed intake").
 *
 * RED phase: intake-result.js does not exist yet; these drive its creation.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { validateIntakeResult, normalizeIntakeResult, ANCHOR_KINDS, ACCESS_METHODS } = require('../../src/domain/intake-result');

function validResult() {
  return {
    target_root: '/path/to/repo',
    anchors: [
      { id: 'repo-1', kind: 'repository', location: '/path/to/repo', access_method: 'local' },
      { id: 'docs-1', kind: 'docs', location: 'https://example.com/docs', access_method: 'api' },
    ],
    perimeter: ['/path/to/repo'],
    generated_at: '2026-06-25T00:00:00.000Z',
  };
}

test('ANCHOR_KINDS lists the six anchor kinds from the charter', () => {
  for (const k of ['repository', 'docs', 'issue-tracker', 'chat', 'mailing-list', 'deploy']) {
    assert.ok(ANCHOR_KINDS.includes(k), `missing anchor kind ${k}`);
  }
});

test('ACCESS_METHODS lists local, api, file', () => {
  for (const m of ['local', 'api', 'file']) {
    assert.ok(ACCESS_METHODS.includes(m), `missing access method ${m}`);
  }
});

test('validateIntakeResult: valid result has zero errors', () => {
  assert.deepStrictEqual(validateIntakeResult(validResult()), []);
});

test('validateIntakeResult: missing target_root fails', () => {
  const r = validResult(); delete r.target_root;
  assert.ok(validateIntakeResult(r).some(e => /target_root/i.test(e)));
});

test('validateIntakeResult: empty anchors fails', () => {
  const r = validResult(); r.anchors = [];
  assert.ok(validateIntakeResult(r).some(e => /at least one anchor/i.test(e)));
});

test('validateIntakeResult: anchor with invalid kind fails', () => {
  const r = validResult(); r.anchors[0].kind = 'mystery';
  assert.ok(validateIntakeResult(r).some(e => /invalid anchor kind/i.test(e)));
});

test('validateIntakeResult: anchor with invalid access_method fails', () => {
  const r = validResult(); r.anchors[0].access_method = 'ftp';
  assert.ok(validateIntakeResult(r).some(e => /invalid access_method/i.test(e)));
});

test('validateIntakeResult: anchor missing location fails', () => {
  const r = validResult(); delete r.anchors[0].location;
  assert.ok(validateIntakeResult(r).some(e => /location/i.test(e)));
});

test('validateIntakeResult: perimeter may be empty (degenerate single-anchor)', () => {
  const r = validResult(); r.perimeter = [];
  // empty perimeter is allowed — degenerates to target_root only
  assert.deepStrictEqual(validateIntakeResult(r), []);
});

test('normalizeIntakeResult: fills architectural_principles default + generated_at if missing', () => {
  const r = validResult(); delete r.architectural_principles;
  const n = normalizeIntakeResult(r);
  assert.ok(Array.isArray(n.architectural_principles));
  assert.ok(n.generated_at);
});

test('normalizeIntakeResult: trims whitespace in locations', () => {
  const r = validResult(); r.anchors[0].location = '  /path  ';
  const n = normalizeIntakeResult(r);
  assert.strictEqual(n.anchors[0].location, '/path');
});

test('normalizeIntakeResult: does not mutate the input', () => {
  const r = validResult();
  const snapshot = JSON.stringify(r);
  normalizeIntakeResult(r);
  assert.strictEqual(JSON.stringify(r), snapshot);
});
