# Portolan Visual Style Specification

## Authority

This file is the single authority for the two switchable display styles in the
Portolan atlas viewer: **cartographic** (default — warm parchment, aged-map
chrome) and **plain** (cool/dark/neutral). Both render the same data; the toggle
is presentation only.

Authority order for visual decisions: this file → `08-portolan-product-charter.md`
(product concepts) → `07` (frozen contract). Where this spec touches a token
already present in `portolan-core/src/adapters/theme-tokens.js`, the adapter is
the runtime implementation of the values here.

This spec is **render-agnostic**: tokens hold across SVG (Part 1) and WebGL
(Part 2). Every value is consumed by both CSS (`var(--x)`) and the JS render
layer (read into a `THEME` object so WebGL uniforms get the same hexes).

---

## 1. Design Tokens

The runtime implementation is `portolan-core/src/adapters/theme-tokens.js`.
Cartographic is the default (`createThemeProvider()` returns cartographic).

### 1.1 Core surface + text tokens

| Token | `cartographic` (default, warm) | `plain` (cool, dark) |
| --- | --- | --- |
| `bg` | `#efe6d2` (parchment) | `#0e0e12` |
| `bg2` | `#e6d9bd` | `#15161d` |
| `surface` | `#f6efe0` (lighter paper on map table) | `#1a1a1e` |
| `surface2` | `#efe4cd` | `#202231` |
| `surface3` | `#e0d2b4` (inset wells) | `#11131a` |
| `text` | `#2b2419` (dark sepia ink) | `#ededed` |
| `muted` | `#6f6450` | `#8b93a8` |
| `quiet` | `#9a8d72` | `#646d84` |
| `line` | `rgba(60,45,20,0.14)` | `rgba(255,255,255,0.08)` |
| `lineStrong` | `rgba(124,90,42,0.42)` | `rgba(168,181,255,0.28)` |
| `primary` | `#9a4a2e` (oxidized rust) | `#6b7fff` (lavender-blue) |
| `primaryDark` | `#7a3620` | `#4760f3` |
| `accent` | `#1d5e63` (verdigris teal) | `#a8b5ff` |
| `accentSoft` | `#2f7d82` | `#9d9eff` |
| `focusRing` | `#1d5e63` | `#a8b5ff` |

### 1.2 Shadows

| Token | `cartographic` | `plain` |
| --- | --- | --- |
| `soft` | `0 10px 30px rgba(74,53,20,0.16)` | `0 12px 40px rgba(0,0,0,0.32)` |
| `brand` | `0 12px 36px rgba(154,74,46,0.14)` | `0 16px 48px rgba(71,96,243,0.16)` |

Cartographic shadows are warmer and shorter — paper on paper, not glass in space.

### 1.3 The 7 family colors

Family hue identity is **constant** across styles (teal is always teal). Only
lightness/saturation shift: cartographic uses muted earth/ink pigments (desaturated,
darkened) that sit on parchment with AA contrast and read like printed map inks.
Plain keeps the bright-on-dark set.

| Family | `plain.main` | `cartographic.main` | ink (stroke) |
| --- | --- | --- | --- |
| `data-systems` (teal) | `#2dd4bf` | `#1f7a70` | `#0f4e47` |
| `compute-processing` (violet) | `#a78bfa` | `#6b4fa0` | `#43306b` |
| `platform-governance` (rose) | `#fb7185` | `#b03a4a` | `#7a2531` |
| `packaging-runtime` (amber) | `#fbbf24` | `#9c6b14` | `#6a4708` |
| `coordination-community` (blue) | `#60a5fa` | `#2f5fa0` | `#1d3c6b` |
| `integration-services` (green) | `#34d399` | `#3a7d4f` | `#235033` |
| `unknown` (slate) | `#94a3b8` | `#8a7d66` | `#5e5341` |

Each family also has `glow` (lighter variant for rings/halos) and `soft` (an
`r,g,b` triple for `rgba()` glow strings). See `theme-tokens.js`.

---

## 2. Typography

Text is half the product (charter 08). The atlas is maps AND descriptions.

### 2.1 Font stacks

```
--font-sans:    Geologica, Inter, "Helvetica Neue", Arial, sans-serif
--font-serif:   "Source Serif 4", "Iowan Old Style", Georgia, serif
--font-display: Spectral, "Source Serif 4", Georgia, serif
--font-mono:    ui-monospace, SFMono-Regular, Menlo, Consolas, monospace
```

- **Plain** uses `--font-sans` everywhere. Mono for paths/ids.
- **Cartographic** uses `--font-serif` for **prose, dossiers, body** (the engraved
  chart description feel) and `--font-display` for **hero/title/h1**. Labels,
  kickers, badges, nav stay `--font-sans`. Graph **labels always use sans** in
  both styles — small map labels must stay legible.

### 2.2 Size scale (rem-based, 16px root)

| Token | px | rem | Use |
| --- | --- | --- | --- |
| display | 36 | 2.25 | overview hero title |
| title | 28 | 1.75 | panel-title, dossier title |
| h1 | 22 | 1.375 | section heads, metric value |
| h2 | 18 | 1.125 | family-heading, group head |
| body | 15 | 0.9375 | prose, dossier body |
| small | 13 | 0.8125 | card meta, hints, mono paths |
| caption | 12 | 0.75 | legends, dist-legend |
| micro | 11 | 0.6875 | kickers, badges, node labels |

### 2.3 Weight ladder

| Token | plain | carto | Use |
| --- | --- | --- | --- |
| regular | 400 | 400 | prose body |
| medium | 500 | 500 | nav, labels |
| semibold | 600 | 600 | card titles, CTAs |
| bold | 700 | 700 | kickers, titles, metric values |

Carto serif display uses regular/medium for titles (serif carries weight
optically; avoid bold serif display). Carto sans kickers/badges keep 700.

### 2.4 Line-height + measure

| Token | Value | Use |
| --- | --- | --- |
| tight | 1.15 | display/title |
| snug | 1.3 | headings h1/h2 |
| body | 1.55 | prose |
| ui | 1.4 | cards, meta |
| measure-prose | 68ch | dossier/finding prose |
| measure-note | 78ch | level notes, intro |

### 2.5 Letter-spacing

| Token | Value | Use |
| --- | --- | --- |
| kicker | `0.08em` | section-kicker, donut-label |
| eyebrow | `0.14em` | hero-eyebrow |
| title | `-0.01em` | titles |
| display-carto | `0.01em` | carto serif display (slight positive tracking) |

Kickers/eyebrows/labels are **UPPERCASE + tracked** in both styles.

---

## 3. Layout & Text

### 3.1 Dossier

- `.dossier-panel`: `max-width: 920px`, centered.
- Prose inside dossier constrained to `measure-prose` (68ch).
- Section spacing: `.dossier-section { margin-top: 24px }`.
- Each section = `kicker → prose block`.
- Carto dossier: title in display serif; optional hairline rule with `◆` under
  the title (decorative, carto-only).

### 3.2 Findings cards / triangulation conflicts

- Reuse `.card` (radius 12px, padding 14/16).
- Finding severity drives a left marker bar (4px): risk→primary, gap→amber,
  info→muted.
- Triangulation conflict cards: left border `3px solid primary`, badge-conflict
  in primary tone.

### 3.3 Overview

- `.hero-read` 60ch, body line-height.
- `.overview-hero` two-column (identity | donut), collapses < 720px.
- Metric cards grid `minmax(160px,1fr)`.

### 3.4 Legends

- Row of swatch+label, caption size, muted.
- Carto: legend gets a cartouche treatment — bordered, slightly inset box with
  thin double rule. Plain: flat surface-2 chip box.

### 3.5 Text ⟷ embedded graph

- Diagram wrapper gets `margin: 16px 0`, never full-bleed inside dossier.
- Every embedded graph: intro line → figure → legend (mandatory rhythm).
- Graph height: `clamp(440px, 62vh, 720px)` for behaviour map.

---

## 4. Graph Element Treatment

Render-agnostic visual language (maps to SVG attrs today, WebGL uniforms later).

### 4.1 Nodes

| Property | plain | cartographic |
| --- | --- | --- |
| fill | family `main` (bright) | family `cartographic.main` (muted) |
| stroke (ring) | `glow` @ 1.5px | `ink` @ 1.5px (firmer, inked) |
| size | `r = 9 + 14·(deg/maxDeg)` | same |
| halo | `rgba(soft,0.10)` blur glow | flat `rgba(soft,0.14)` filled disc (no blur — parchment stains, doesn't glow) |
| label | sans, micro, stroke-halo | sans, micro, sepia on parchment |
| retired | dashed ring `4 3` | dashed ink ring |
| hover | ring thickens to 3px | ring 3px + 1 step darker fill |
| dim (focus) | opacity 0.18 | opacity 0.22 |

### 4.2 Edges

| Property | plain | cartographic |
| --- | --- | --- |
| stroke | `rgba(168,181,255,0.22)` (accent) | `rgba(124,90,42,0.5)` (sepia ink) |
| width | `1.2` base; width-by-weight `1.2 + 0.8·(w/maxW)` capped 3.5 | same formula, ink |
| shape | straight, trimmed to borders | gently curved quadratic (one control point, `0.12·dist`) — reads as charted route |
| arrowhead | triangle, accent @ 0.55 | triangle, sepia ink, slightly larger |
| hover | accent-soft, width 2 | primary (rust), width 2.2 |

### 4.3 Cluster halos

- Plain: soft filled hull `rgba(soft,0.06)`, no border.
- Carto: `rgba(soft,0.10)` fill + dashed ink region border @ 0.35 — the "region
  boundary on a map." Data-driven (hull of family members).

### 4.4 Donut segments

- Plain: family `main`, `stroke: bg 2px`.
- Carto: family `cartographic.main`, `stroke: bg 2px` + ink inner hairline.

### 4.5 Context rings (C4 level-1)

- Center node: primary tint fill + primary ring (plain) / rust ring (carto).
- Neighbor: surface-2 fill, line-strong ring (plain) / parchment-card, ink ring (carto).
- Edge to center: dashed accent @ 0.18 (plain) / dashed sepia @ 0.3, curved (carto).

---

## 5. Cartographic Chrome (carto-only)

These exist **only** under `data-style="cartographic"`. Each is `aria-hidden`,
`pointer-events:none` unless interactive.

### 5.1 Compass rose — decorative
Top-right of the behaviour map stage, ~64px, ink @ 0.35, "N" marked. Does not
rotate with pan (would imply false orientation).

### 5.2 Graticule — decorative
Faint lat/long grid behind behaviour-map and context-diagram stage. Ink @ 0.06,
1px, spaced ~80px. Replaces the plain radial vignette. Opacity ceiling 0.08.

### 5.3 Region borders — data-driven
Family cluster hull + dashed ink border (§4.3). Always present in carto when
clusters exist.

### 5.4 Legend cartouche — decorative frame
Double-rule border: outer ink 1px, inner ink 0.5px @ 6px inset, `◆` corner motif.
Background surface (lighter parchment). Plain uses flat surface-2 box.

### 5.5 Panel aged edge — decorative
`.panel` in carto gets `inset 0 0 0 1px rgba(124,90,42,0.10)` + warm shadow. No
raster paper texture (stays crisp, theme-able, zero-asset).

### 5.6 Dossier diamond rule — decorative
Thin centered rule with `◆` under dossier titles. Carto-only.

**Distraction guardrails:** opacity ceilings (graticule ≤0.08, compass ≤0.35),
no animation, `aria-hidden`, chrome never overlaps interactive nodes/labels.

---

## 6. The Toggle

- **Control:** segmented two-option toggle in topbar, right side, left of search.
  Compass glyph (cartographic) + grid glyph (plain). Label visible ≥ 720px.
- **Mechanism:** sets `document.documentElement.dataset.style`; persisted to
  `localStorage('portolan-style')`; default = `cartographic`.
- **What changes:** all tokens (palette, fonts), family resolution, edge
  curvature, node halo mode, chrome render/teardown. Layout/routes/data/DOM
  do not change.
- **Transition:** token/color/background `200ms`; graph re-render once (cheap at
  hundreds of nodes). Reduced motion: all transitions `0ms`.

---

## 7. Accessibility

### 7.1 Contrast (WCAG AA: ≥4.5:1 body, ≥3:1 large/UI)

**Plain (dark):** text/bg ~15.8:1 (AAA); muted/bg ~6.4:1 (AA); primary/bg ~5.1:1
(AA). CTA white-on-primary: use primaryDark for AA on normal text.

**Cartographic (parchment):** text/bg ~11.9:1 (AAA); muted/bg ~5.0:1 (AA);
primary (rust)/bg ~6.0:1 (AA); accent (verdigris)/bg ~5.4:1 (AA); white-on-primary
~5.9:1 (AA). Carto family `main` values darkened to clear 3:1 on parchment for
node fills.

### 7.2 Focus states
`:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px }`.
Plain ring = lavender (8.9:1), carto ring = verdigris (5.4:1).

### 7.3 Reduced motion
`@media (prefers-reduced-motion: reduce)`: zero CTA transforms, hover lift,
toggle cross-fade, transitions. Hover color changes stay. Graph never
auto-animates (layout computed once).

### 7.4 Screen reader labels
Every `<svg>` has `role="img"` + `aria-label`. Visually-hidden text alternative
listing the data each graph encodes. Decorative chrome: `aria-hidden`.
