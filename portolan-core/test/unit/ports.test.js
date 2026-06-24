/**
 * Unit tests for the port contract validators.
 * These confirm the is*() guards correctly identify conforming/non-conforming
 * adapter shapes, so the composition root can fail fast on a malformed adapter.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { isGraphRenderer } = require('../../src/ports/graph-renderer');
const { isAtlasStore } = require('../../src/ports/atlas-store');
const { isThemeProvider } = require('../../src/ports/theme-provider');
const { isNavigator } = require('../../src/ports/navigator');

test('isGraphRenderer: conforming object passes', () => {
  assert.ok(isGraphRenderer({ render(){}, focusNode(){}, onEvent(){ return ()=>{}; }, destroy(){} }));
});

test('isGraphRenderer: missing method fails', () => {
  assert.strictEqual(isGraphRenderer({ render(){}, focusNode(){} }), false);
  assert.strictEqual(isGraphRenderer(null), false);
  assert.strictEqual(isGraphRenderer({}), false);
});

test('isAtlasStore: conforming object passes', () => {
  assert.ok(isAtlasStore({ loadAtlas(){}, saveAtlas(){}, hasAtlas(){} }));
});

test('isAtlasStore: missing method fails', () => {
  assert.strictEqual(isAtlasStore({ loadAtlas(){} }), false);
});

test('isThemeProvider: conforming object passes', () => {
  assert.ok(isThemeProvider({ style(){}, resolve(){}, setStyle(){}, onChange(){ return ()=>{}; } }));
});

test('isThemeProvider: missing method fails', () => {
  assert.strictEqual(isThemeProvider({ style(){}, resolve(){} }), false);
});

test('isNavigator: conforming object passes', () => {
  assert.ok(isNavigator({ current(){}, route(){}, onRouteChange(){ return ()=>{}; } }));
});

test('isNavigator: missing method fails', () => {
  assert.strictEqual(isNavigator({ current(){} }), false);
});
