/**
 * Unit tests for id/route helpers + the schema route regex contract.
 * Covers Feature 9 (UI Route And DOM Contract) at the data level.
 *
 * RED phase: imports from scripts/system-map/ids.js (not yet extracted).
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { shortId, route, detailRoute } = require('../scripts/system-map/ids');

const ID_PATTERN = /^[A-Za-z0-9._:/@+\-]+$/;
const ROUTE_PATTERN = /^#\/(dossier|detail)\/[A-Za-z0-9._:@+\-]+\/[A-Za-z0-9._:/@+\-]+$/;

test('shortId strips the "component:" prefix', () => {
  assert.strictEqual(shortId('component:apache-sqoop'), 'apache-sqoop');
});

test('shortId leaves a non-prefixed id unchanged', () => {
  assert.strictEqual(shortId('apache-sqoop'), 'apache-sqoop');
});

test('shortId handles empty/undefined', () => {
  assert.strictEqual(shortId(''), '');
  assert.strictEqual(shortId(undefined), '');
});

test('route produces a dossier route matching the schema regex', () => {
  const r = route('component', 'component:apache-sqoop');
  assert.strictEqual(r, '#/dossier/component/apache-sqoop');
  assert.match(r, ROUTE_PATTERN);
});

test('detailRoute produces a detail route matching the schema regex', () => {
  const r = detailRoute('relationship', 'rel:manifest-dep:a--to--b');
  assert.strictEqual(r, '#/detail/relationship/rel:manifest-dep:a--to--b');
  assert.match(r, ROUTE_PATTERN);
});

test('route kind segment is the object kind, id segment is the shortId', () => {
  const r = route('surface', 'surf:bigtop-ci');
  assert.strictEqual(r, '#/dossier/surface/surf:bigtop-ci');
});

test('every route has a dossier or detail family (Feature 9 contract)', () => {
  for (const kind of ['component', 'repository', 'surface', 'c4-box', 'c4-family']) {
    assert.match(route(kind, 'x:y'), /^#\/dossier\//);
  }
  for (const kind of ['relationship', 'finding', 'unknown']) {
    assert.match(detailRoute(kind, 'x:y'), /^#\/detail\//);
  }
});

test('route helpers do not introduce "->" themselves (the builder must sanitize ids)', () => {
  // The id pattern forbids ">"; the route helper builds verbatim from the id,
  // so it must never ADD a ">" — but it does not sanitize an already-bad id.
  // Here we confirm a clean id round-trips without ">" appearing.
  const r = route('component', 'component:a--to--b');
  assert.doesNotMatch(r, /->/, `route introduced "->": ${r}`);
});
