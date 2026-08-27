## Why

The craft pass fixed figure-ground, taper, and hub fan spread, but the
screenshot review shows two residual legibility defects: lanes arriving at
a busy hub from the same direction still run as parallel stripes across the
mid-map, and a vessel label can sit on top of a passing lane (bigtop-jsvc).

## What Changes

- **Braided arrivals**: inbound lanes to one hub that arrive from the same
  rough direction get staggered curvature (index-staggered bend multiplier,
  alternating sides), so the parallel stripe becomes a braid that separates
  mid-run and lands as the existing fan.
- **Label plane kept clear**: after layout, island labels de-collide with
  each other (two deterministic passes) exactly like the fleet sheet; labels
  never move onto another island.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `chart-room`: adds a requirement (ADDED delta): inbound lane bundles read
  as braids, and the label layer resolves its own overlaps deterministically.

## Impact

- Code: `template.html` only (bend staggering in the lane renderer, label
  pass). No data changes.
