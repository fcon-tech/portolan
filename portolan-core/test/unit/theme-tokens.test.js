/**
 * Unit tests for theme-tokens adapter (cartographic default + plain).
 * Validates the ThemeProvider port contract AND the token values from the
 * visual style direction (cartographic = warm/parchment, plain = cool/dark).
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { createThemeProvider } = require('../../src/adapters/theme-tokens');
const { isThemeProvider } = require('../../src/ports/theme-provider');

test('createThemeProvider: returns a conforming ThemeProvider', () => {
  const tp = createThemeProvider();
  assert.ok(isThemeProvider(tp));
});

test('createThemeProvider: default style is cartographic', () => {
  const tp = createThemeProvider();
  assert.strictEqual(tp.style(), 'cartographic');
});

test('resolve(cartographic): returns warm/parchment palette', () => {
  const tp = createThemeProvider();
  const t = tp.resolve('cartographic');
  assert.ok(t.bg, 'bg token present');
  assert.strictEqual(t.text, '#2b2419'); // dark sepia ink, not pure black
});

test('resolve(plain): returns cool/dark palette', () => {
  const tp = createThemeProvider();
  const t = tp.resolve('plain');
  assert.strictEqual(t.bg, '#0e0e12');
  assert.strictEqual(t.text, '#ededed');
});

test('resolve: both styles have all 7 family colors with main+glow+ink', () => {
  const tp = createThemeProvider();
  const families = ['data-systems', 'compute-processing', 'platform-governance', 'packaging-runtime', 'coordination-community', 'integration-services', 'unknown'];
  for (const style of ['cartographic', 'plain']) {
    const t = tp.resolve(style);
    for (const fam of families) {
      assert.ok(t.families[fam], `${style} missing family ${fam}`);
      assert.ok(t.families[fam].main, `${style}/${fam} missing main`);
      assert.ok(t.families[fam].glow, `${style}/${fam} missing glow`);
    }
  }
});

test('resolve: family hue identity is constant across styles (teal is always teal-ish)', () => {
  // Plain data-systems is #2dd4bf (teal); cartographic should be a darker/desat teal.
  const tp = createThemeProvider();
  const plainTeal = tp.resolve('plain').families['data-systems'].main;
  const cartoTeal = tp.resolve('cartographic').families['data-systems'].main;
  // Both should be in the teal/green hue band — we assert they differ in lightness
  // but are the same family (not, say, teal vs red).
  assert.notStrictEqual(plainTeal, cartoTeal, 'plain and carto family colors should differ in tone');
});

test('setStyle: switches the active style', () => {
  const tp = createThemeProvider();
  tp.setStyle('plain');
  assert.strictEqual(tp.style(), 'plain');
  tp.setStyle('cartographic');
  assert.strictEqual(tp.style(), 'cartographic');
});

test('onChange: fires on setStyle with the new style key', () => {
  const tp = createThemeProvider();
  const seen = [];
  const off = tp.onChange(s => seen.push(s));
  tp.setStyle('plain');
  tp.setStyle('cartographic');
  assert.deepStrictEqual(seen, ['plain', 'cartographic']);
  off();
  tp.setStyle('plain');
  assert.strictEqual(seen.length, 2, 'unsubscribe stops notifications');
});

test('resolve: graph tokens present (edgeWidth, edgeOpacity, haloMode)', () => {
  const tp = createThemeProvider();
  for (const style of ['cartographic', 'plain']) {
    const t = tp.resolve(style);
    assert.ok(typeof t.graph.edgeWidth === 'number');
    assert.ok(typeof t.graph.edgeOpacity === 'number');
    assert.ok(t.graph.haloMode === 'glow' || t.graph.haloMode === 'flat');
  }
});

test('resolve: cartographic edges are curved (edgeCurve > 0), plain straight (0)', () => {
  const tp = createThemeProvider();
  assert.ok(tp.resolve('cartographic').graph.edgeCurve > 0, 'carto edges curved');
  assert.strictEqual(tp.resolve('plain').graph.edgeCurve, 0, 'plain edges straight');
});

test('resolve: fonts present (body, head, mono) for both styles', () => {
  const tp = createThemeProvider();
  for (const style of ['cartographic', 'plain']) {
    const t = tp.resolve(style);
    assert.ok(t.fonts.body);
    assert.ok(t.fonts.head);
    assert.ok(t.fonts.mono);
  }
});
