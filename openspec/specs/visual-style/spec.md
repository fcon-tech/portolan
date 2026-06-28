# Visual Style Specification

## Purpose

Defines the presentation contract for the atlas's two switchable display styles
(Cartographic default, Plain) as a behavioral token system: same data, two
palettes, decorative cartographic chrome, and the accessibility guarantees both
styles must hold.

(migrated). Runtime token values live in the theme adapter; this spec states the
behavioral requirement, not the individual hex values.

## Requirements

### Requirement: Two styles with a single token contract
The style system SHALL provide both a Cartographic palette (warm parchment,
aged-map chrome) and a Plain palette (cool/dark/neutral) through one set of
design tokens. Both styles SHALL render identical underlying data; switching
styles MUST be a presentation-only change and MUST NOT alter layout, routes,
data, or DOM structure. The default style MUST be Cartographic.

#### Scenario: Toggle preserves data and structure
- GIVEN the atlas is rendered in Cartographic style
- WHEN the admiral toggles to Plain
- THEN the same units, edges, dossiers, and routes render
- AND only palette, fonts, family resolution, edge curvature, node halo mode, and chrome change
- AND layout, routes, data, and DOM structure are unchanged

#### Scenario: Default style is Cartographic
- GIVEN no persisted style preference exists
- WHEN the atlas first renders
- THEN the Cartographic style is active

### Requirement: Token contract covers palette, typography, and graph treatment
The style system SHALL expose design tokens spanning core surface and text
palette, shadows, the seven family colors, the font stacks, the rem-based size
scale, the weight ladder, line-height/measure, letter-spacing, and graph
element treatment (nodes, edges, cluster halos, donut segments, context rings).
Each token MUST resolve to a concrete value in both palettes. Tokens MUST hold
across SVG and WebGL rendering paths.

#### Scenario: Every token resolves in both palettes
- GIVEN the style system is initialized in either style
- WHEN the render layer requests any documented token
- THEN it receives a concrete value appropriate to the active palette

### Requirement: Family color identity is constant across styles
The seven family hues SHALL keep constant identity across styles: a given family
MUST remain the same hue (for example, teal is always teal). Only lightness and
saturation MAY shift between palettes; the family-to-hue mapping MUST NOT change
when the style is toggled.

#### Scenario: Family hue does not change with style
- GIVEN a unit belongs to a given family
- WHEN the admiral toggles between Cartographic and Plain
- THEN the unit's family hue identity is preserved
- AND only lightness or saturation shifts

### Requirement: Cartographic chrome is decorative and non-interactive
Cartographic-only chrome SHALL be decorative only. This covers the compass rose,
graticule, region borders, legend cartouche, panel aged edge, and dossier
diamond rule. Such chrome MUST be `aria-hidden`, MUST have `pointer-events: none`
unless it is interactive, and MUST respect opacity ceilings so it never overlaps
or obscures interactive nodes or labels. The Plain style MUST NOT render this
chrome.

#### Scenario: Plain style omits cartographic chrome
- GIVEN the atlas is rendered in Plain style
- WHEN the behaviour map stage renders
- THEN no compass rose, graticule, or cartouche chrome is present

#### Scenario: Chrome never obscures interactive elements
- GIVEN the atlas is rendered in Cartographic style
- WHEN a node or label is displayed
- THEN decorative chrome does not overlap it
- AND chrome opacity stays within its documented ceiling

### Requirement: Style toggle persists and respects reduced motion
The style toggle SHALL persist the admiral's choice across sessions and default
to Cartographic on first load. Transitioning between styles SHALL animate tokens,
colors, and backgrounds over approximately 200ms; under a reduced-motion
preference all transitions MUST be 0ms.

#### Scenario: Choice persists across sessions
- GIVEN the admiral selects Plain style
- WHEN the atlas is reopened in a new session
- THEN Plain style is active without further input

#### Scenario: Reduced motion disables the transition
- GIVEN the admiral's environment signals prefers-reduced-motion
- WHEN the style is toggled
- THEN the style change applies with 0ms transitions

### Requirement: Accessibility contract — contrast, focus, reduced motion, screen-reader labels
The atlas SHALL meet WCAG AA contrast (at least 4.5:1 for body text and 3:1 for
large/UI elements) in both styles, expose a visible `:focus-visible` outline
using the focus-ring token, disable motion-related effects under a
reduced-motion preference, and give every rendered graph a `role="img"` plus an
`aria-label` with a visually-hidden text alternative describing the data it
encodes. Decorative chrome MUST be hidden from assistive technology.

#### Scenario: Graphs expose a screen-reader text alternative
- GIVEN a behaviour map or diagram renders
- WHEN assistive technology reads the element
- THEN it has role="img" and an aria-label
- AND a visually-hidden alternative lists the data the graph encodes

#### Scenario: Focus is visible in both styles
- GIVEN an interactive control is focused via keyboard
- WHEN focus is applied
- THEN a focus outline appears using the active style's focus-ring token
