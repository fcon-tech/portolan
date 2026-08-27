# chart-room-tangles Design

## Decision 1: detection in core, rendering in the page

`findTangles(entries)` (Tarjan SCC over fairways restricted to known vessel
ids; groups of size ≥ 2, members sorted by id) runs in `render.ts` and the
result is embedded next to `notices`. Unit tests cover detection fully
(2-cycle, 3-cycle, self-loops excluded, DAG → empty); the page only draws
what core computed. Blast radius stays page-side arithmetic; tangles are
contract data.

## Decision 2: whirlpool = mark + panel section + dossier line

- Nautical map: one spiral glyph at the centroid of each tangle's member
  islands, styled in `--danger`, non-interactive below labels' layer.
- Panel (both modes): "Dependency tangles" section listing members per
  tangle; **calm state** when none — a stated line, mirroring the notices
  empty-state rule.
- Dossier: a tangled vessel's dossier gains "In a tangle with …" line
  naming the other members; lanes between members tint toward danger on
  selection.

## Decision 3: honesty for both states

The calm state exists because absence of cycles is a verified structural
fact (deterministic algorithm), not missing data. The whirlpool appears
only where core found a real SCC; nothing is inferred from naming or
density heuristics.

## Not here

Edge-bundling or lane re-routing around whirlpools; tangle history over
time (needs notices accumulation); cyclomatic metrics of any kind.
