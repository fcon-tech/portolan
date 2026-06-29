# Spec Delta — ontology

## ADDED Requirements

### Requirement: Overlap, alternative, and legacy-stale findings
The deterministic core (and agent producers) SHALL be able to emit overlap
findings: overlapping capabilities, duplicated concepts, alternative
capabilities, and legacy/stale semantic overlap. These SHALL be unit-attached
findings carrying confidence per the trust contract, like all findings.

#### Scenario: Overlapping capabilities surface as a finding
- GIVEN two components provide the same capability
- WHEN the core emits findings
- THEN an overlapping-capabilities finding attaches to both components
- AND it carries a confidence level per the trust contract

#### Scenario: Legacy/stale semantic overlap is visible
- GIVEN a retired component is still referenced by active components
- WHEN the core emits findings
- THEN a legacy/stale-overlap finding records the stale reference
- AND it is not hidden
