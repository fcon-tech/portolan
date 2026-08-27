# fleet-review-map Design

## Decision 1: sheet + table, not sheet instead of table

The archipelago is the hero; the existing table remains below it as the
data anchor (counts stay greppable and comparable without parsing a
picture). No information moves — the sheet renders exactly what the rows
aggregate.

## Decision 2: one shared drawing language, miniature scale

Islands = radial seeded blobs (mulberry32 per province+id), radius scaled
log10(files) but compressed so 25k-file provinces fit beside 400-file
ones (cap at group scale). Trust halo = single band in the same ramp as
the Chart Room legend. Lanes = thin tapered strokes with fan spread.
Dangers = the three Chart No.1 marks, smaller. Everything derives from
the same tokens as the main chart — the fleet looks like one atlas.

## Decision 3: layout per province, packing between provinces

Each province lays its vessels out via a short deterministic force pass
(seeded init on an ellipse, ~120 iterations) inside its own bounding box;
groups are placed left-to-right by index with fixed gaps inside a fixed
canvas (1880-wide like the Chart Room, height grows with row count:
groups wrap every 2). Province caption above each box + clickable
transparent hull rect over the group carrying the `file://` link.

## Decision 4: data

`buildFleetReview` embeds per-province `entries` (vessels, fairways,
dangers only — beacons/lights never appear on the fleet sheet) next to
the aggregates already computed. Failure paths unchanged (any target
without a chart fails loudly).

## Not here

Inter-province fairways (no cross-target edges exist in any chart);
zoom/pan (fixed-fit sheet); island click dossiers (the province link is
the granularity of a fleet).
