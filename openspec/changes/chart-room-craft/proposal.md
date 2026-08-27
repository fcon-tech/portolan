## Why

The Governor's standing verdict on the Chart Room: right prototype, wants
the visual result pushed to real cartographic quality. A screenshot review
against the craft checklist (stepped bathymetry, figure-ground, lane
geometry, label ladders) shows six concrete gaps — none of them new data,
all of them rendering.

## What Changes

- **Figure-ground**: the sea becomes a deeper, desaturated field; island
  halo bands deepen toward the coast so water visibly recedes and land
  advances.
- **Lanes**: stroked arrows become tapered filled curves (wide at the
  source, narrow at the target) with per-lane curvature from the seed, a
  paper casing underneath to lift them off the water, hub-fan spread (no
  bundle collapsing into one point), and no crossing over destination
  labels.
- **Labels**: the small tier grows and darkens to stay legible at overview;
  small vessels use spaced small-caps.
- **Ports of entry**: anchor glyph sits on the coast away from the label
  side, protocol renders as a small chip.
- **Rhumb lines and rose**: rhumb net visible above the sea fill at low
  opacity; compass rose fully inside the neatline corner.
- **Legend**: trust-band swatches get separated, edged cells; legend panel
  fully opaque.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `chart-room`: adds a requirement (ADDED delta): the nautical
  representation reads as a chart — receding water, tapered lanes, legible
  laddered labels — with every trust distinction still visible.

## Impact

- Code: `template.html` CSS + drawing functions only. No data bytes move;
  determinism holds (same seed discipline).
