# chart-room Tasks

## 1. Core render

- [ ] 1.1 Port the spike into `core/src/chartroom/render.ts` +
      `template.ts` (placeholders substituted via function replacements;
      `sailing-directions.md` inlined as briefing HTML; no chart → loud
      error naming the target path) and verify unit tests: placeholder
      exhaustion, `$`-sequence safety, byte-stable double render, no-chart
      failure
- [ ] 1.2 Add `core/src/chartroom/cli.ts render --target <t>` (stdout =
      written path + entry counts, exit 1 with stderr on failure) and
      verify: renders the Bigtop chart, refuses a target without
      `.portolan/chart/`

## 2. Entry points

- [ ] 2.1 Register the `chart.render` MCP tool (no arguments beyond the
      bound target; returns the written path and counts) and verify the
      registry test covers the new name and its no-chart error surface

## 3. Contract + artifact

- [ ] 3.1 Extend the MANIFEST glossary with **Chart room** and verify the
      term appears exactly once, in the glossary, without touching the
      non-goals list
- [ ] 3.2 Regenerate the Bigtop artifact from core and verify the
      headless checks pass (islands/lanes rendered, zero overlaps, zero
      label collisions, both modes, impact-set click, no console errors)
- [ ] 3.3 Delete `experiments/map-spike/` (the visual contract now lives
      in this change + the spec) and verify the full suite:
      `bun test` green, `tsc --noEmit` green, `openspec validate --strict`
