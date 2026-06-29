# Design — overlap-duplication-and-alternatives

## Decision

Add overlap/alternative/legacy-stale finding kinds to the ontology, emitted as
unit-attached findings with confidence.

## Status

Recorded intent (spec-level). Detection heuristics (how "overlapping capability"
is decided) are design-TBD. Likely a mix of deterministic signals (shared deps,
shared surfaces, naming, reference overlap) and bounded agent claims.

## Reversibility

High. Additive finding kinds; absent signals yield no findings (honest-empty).
