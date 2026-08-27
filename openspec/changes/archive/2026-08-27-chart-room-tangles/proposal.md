## Why

The structure-soundness lens ("is the graph clean — no hidden tangles?") is
the one CTO question the Chart Room cannot answer yet. The honest answer
needs to exist even when it is "none": both real provinces (Bigtop,
dogfood) are DAGs today, and "verified: no dependency tangles" is exactly
the statement a leader wants pinned. When a cycle does appear, it must be
unmissable.

## What Changes

- Core computes **tangles** — strongly connected components (size ≥ 2) of
  the fairway graph over vessel ids — deterministically at render time, and
  the Chart Room embeds them as data (`tangles: [{ids}]`).
- Nautical mode renders each tangle as a **whirlpool mark** at the centroid
  of its member islands; engineering mode lists a "Dependency tangles"
  panel section. The dossier of a tangled vessel names its tangle-mates.
- An explicit calm-sea state ("no dependency tangles") ships in the panel
  when the province is clean — verified absence, never silence.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `chart-room`: adds requirements (ADDED deltas — no standing requirement
  changes text): tangle detection embedded as data, whirlpool rendering in
  the nautical representation, an explicit zero state, and tangle-mates in
  the dossier.

## Impact

- Code: `core/src/chartroom/render.ts` gains `findTangles` + embedding;
  `template.html` gains marks, panel section, dossier section. Storage and
  CLI/MCP contracts untouched.
