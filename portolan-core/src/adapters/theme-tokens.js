/**
 * Adapter: theme tokens — cartographic (default) + plain display styles.
 *
 * Implements the ThemeProvider port. Provides the render-agnostic token set that
 * drives CSS, SVG attributes, and (Part 2) WebGL uniforms. Switching style =
 * swapping the resolved token set; the graph model and DOM structure do not
 * change.
 *
 * Token values follow the visual style direction: cartographic = warm parchment
 * / aged-map; plain = cool dark / neutral (the current viewer identity).
 * Family hue identity is constant across styles (teal is always teal); only
 * lightness/saturation shift.
 *
 * Adapters layer — may depend on domain/ports.
 */
'use strict';

const FONT_SANS = 'Geologica, Inter, "Helvetica Neue", Arial, sans-serif';
const FONT_SERIF = '"Source Serif 4", "Iowan Old Style", Georgia, serif';
const FONT_DISPLAY = 'Spectral, "Source Serif 4", Georgia, serif';
const FONT_MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const PLAIN = {
  bg: '#0e0e12',
  bg2: '#15161d',
  surface: '#1a1a1e',
  surface2: '#202231',
  surface3: '#11131a',
  text: '#ededed',
  muted: '#8b93a8',
  quiet: '#646d84',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(168,181,255,0.28)',
  primary: '#6b7fff',
  primaryDark: '#4760f3',
  accent: '#a8b5ff',
  accentSoft: '#9d9eff',
  focusRing: '#a8b5ff',
  shadows: { soft: '0 12px 40px rgba(0,0,0,0.32)', brand: '0 16px 48px rgba(71,96,243,0.16)' },
  families: {
    'data-systems': { main: '#2dd4bf', glow: '#5eead4', ink: '#0f4e47', soft: '45,212,191' },
    'compute-processing': { main: '#a78bfa', glow: '#c4b5fd', ink: '#43306b', soft: '167,139,250' },
    'platform-governance': { main: '#fb7185', glow: '#fda4af', ink: '#7a2531', soft: '251,113,133' },
    'packaging-runtime': { main: '#fbbf24', glow: '#fcd34d', ink: '#6a4708', soft: '251,191,36' },
    'coordination-community': { main: '#60a5fa', glow: '#93c5fd', ink: '#1d3c6b', soft: '96,165,250' },
    'integration-services': { main: '#34d399', glow: '#6ee7b7', ink: '#235033', soft: '52,211,153' },
    'unknown': { main: '#94a3b8', glow: '#cbd5e1', ink: '#5e5341', soft: '148,163,184' },
  },
  graph: { nodeStrokeWidth: 1.5, edgeWidth: 1.2, edgeOpacity: 0.22, edgeCurve: 0, haloMode: 'glow' },
  fonts: { body: FONT_SANS, head: FONT_SANS, mono: FONT_MONO },
};

const CARTOGRAPHIC = {
  bg: '#efe6d2',
  bg2: '#e6d9bd',
  surface: '#f6efe0',
  surface2: '#efe4cd',
  surface3: '#e0d2b4',
  text: '#2b2419',
  muted: '#6f6450',
  quiet: '#9a8d72',
  line: 'rgba(60,45,20,0.14)',
  lineStrong: 'rgba(124,90,42,0.42)',
  primary: '#9a4a2e',
  primaryDark: '#7a3620',
  accent: '#1d5e63',
  accentSoft: '#2f7d82',
  focusRing: '#1d5e63',
  shadows: { soft: '0 10px 30px rgba(74,53,20,0.16)', brand: '0 12px 36px rgba(154,74,46,0.14)' },
  families: {
    'data-systems': { main: '#1f7a70', glow: '#2fa396', ink: '#0f4e47', soft: '31,122,112' },
    'compute-processing': { main: '#6b4fa0', glow: '#8a6dc4', ink: '#43306b', soft: '107,79,160' },
    'platform-governance': { main: '#b03a4a', glow: '#d05566', ink: '#7a2531', soft: '176,58,74' },
    'packaging-runtime': { main: '#9c6b14', glow: '#c58e26', ink: '#6a4708', soft: '156,107,20' },
    'coordination-community': { main: '#2f5fa0', glow: '#4a7cc0', ink: '#1d3c6b', soft: '47,95,160' },
    'integration-services': { main: '#3a7d4f', glow: '#56a06e', ink: '#235033', soft: '58,125,79' },
    'unknown': { main: '#8a7d66', glow: '#aa9d86', ink: '#5e5341', soft: '138,125,102' },
  },
  graph: { nodeStrokeWidth: 1.5, edgeWidth: 1.2, edgeOpacity: 0.5, edgeCurve: 0.12, haloMode: 'flat' },
  fonts: { body: FONT_SERIF, head: FONT_DISPLAY, mono: FONT_MONO },
};

const TOKEN_SETS = { cartographic: CARTOGRAPHIC, plain: PLAIN };

function createThemeProvider(initialStyle) {
  let active = initialStyle === 'plain' ? 'plain' : 'cartographic';
  const listeners = new Set();
  return {
    style() { return active; },
    resolve(style) {
      return TOKEN_SETS[style || active] || CARTOGRAPHIC;
    },
    setStyle(style) {
      if (!TOKEN_SETS[style] || style === active) return;
      active = style;
      for (const fn of listeners) fn(active);
    },
    onChange(handler) {
      listeners.add(handler);
      return () => listeners.delete(handler);
    },
  };
}

module.exports = { createThemeProvider, TOKEN_SETS };
