## Why

The fleet review answers "what does my fleet look like" as a table. The
Governor asked for the map: provinces drawn as archipelagos — each vessel
an island, intra-province fairways as lanes — one sheet, links into every
province's Chart Room. Same byproduct discipline; a bigger picture of the
same data.

## What Changes

- `fleet-review.html` gains an **archipelago sheet** above the table: every
  named province rendered as a compact island group (vessels as islands
  sized by file volume with the shared trust halo language, fairways as
  thin curved lanes, danger marks), group caption = province name.
- Clicking a province group opens its Chart Room (`file://` link when
  rendered; the honest not-rendered chip stays, non-clickable).
- Deterministic per-province mini-layout (seeded relaxation, fixed
  iterations); zero new dependencies; the table stays below as the data
  anchor.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `fleet-review`: adds requirements (ADDED deltas): the visual sheet and
  its link behavior; standing table requirements continue to hold.

## Impact

- Code: `core/src/chartroom/review.ts` embeds per-province vessel/fairway/
  danger entries next to the aggregates; `review-template.html` draws the
  sheet. CLI contract unchanged.
