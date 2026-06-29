## Why

The atlas surfaces duplication (jscpd clones, shared dependencies) but not the
higher-level semantic overlaps that matter to a CTO/agent: overlapping
capabilities (two components doing the same job), duplicated concepts,
alternative capabilities (competing implementations), and legacy/stale semantic
overlap (a retired component still referenced). Without these, the landscape
hides the "why are there three of these" question that is most of a landscape
reading.

## What Changes

- Produce overlap findings: overlapping capabilities, duplicated concepts,
  alternative capabilities, and legacy/stale semantic overlap.
- These SHALL be unit-attached findings (per the ontology findings rule) and
  SHALL carry confidence per the trust contract.

## Capabilities

### Modified Capabilities

- `ontology`: adds overlap/alternative/legacy-stale finding kinds to the
  findings the deterministic core (and agent producers) can emit.

## Impact

- Feeds `semantic-investigation-producer` (overlap findings enrich pages) and
  the multiscale capability scale (`multiscale-system-drilldown`).
- Out of scope: the detection heuristics per kind (design TBD).
