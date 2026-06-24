/**
 * Port: theme provider interface.
 *
 * Contract for resolving display-style tokens (cartographic | plain). The theme
 * is render-agnostic — the same tokens drive CSS (HTML chrome), SVG attributes
 * (today), and WebGL uniforms (Part 2). This is the single source of visual
 * truth; switching style = swapping the resolved token set, not re-modelling.
 *
 * Ports layer — may reference domain types, never adapters.
 *
 * Contract:
 *
 *   ThemeProvider = {
 *     // Current active style key.
 *     style(): 'cartographic' | 'plain',
 *
 *     // Resolve the full token set for a style (or the current one if omitted).
 *     resolve(style?): ThemeTokens,
 *
 *     // Switch the active style. Emits a 'style-change' to subscribers.
 *     setStyle(style): void,
 *
 *     // Subscribe to style changes. Returns unsubscribe.
 *     onChange(handler): () => void,
 *   }
 *
 * ThemeTokens shape (consumed by renderers + CSS):
 *   {
 *     bg, bg2, surface, surface2, surface3, text, muted, quiet,
 *     line, lineStrong, primary, primaryDark, accent, accentSoft, focusRing,
 *     shadows: { soft, brand },
 *     families: { <family>: { main, glow, ink, soft } },
 *     graph: { nodeStrokeWidth, edgeWidth, edgeOpacity, edgeCurve, haloMode },
 *     fonts: { body, head, mono },
 *   }
 */
'use strict';

function isThemeProvider(t) {
  return !!(t && typeof t.style === 'function' && typeof t.resolve === 'function'
    && typeof t.setStyle === 'function' && typeof t.onChange === 'function');
}

module.exports = { isThemeProvider };
