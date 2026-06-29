Feature: Overlap, alternative, and legacy-stale findings surface in the atlas
  Part-1b: the deterministic core emits overlap findings (overlapping capabilities,
  duplicated concepts, alternative capabilities, legacy/stale semantic overlap) as
  unit-attached, confidence-carrying findings per the ontology findings rule.
  Bound to openspec/specs/ontology.

  Scenario: Overlapping capabilities surface as a finding
    Given two components share three or more external dependencies
    When the core emits findings
    Then an overlapping-capabilities finding attaches to both components
    And it carries a confidence level per the trust contract

  Scenario: Legacy/stale semantic overlap is visible
    Given a stale external target is referenced by two or more active units
    When the core emits findings
    Then a legacy-stale-semantic-overlap finding records the stale reference
    And it is not hidden
