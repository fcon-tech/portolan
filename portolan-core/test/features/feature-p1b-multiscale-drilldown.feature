Feature: Multiscale drill-down across ecosystem to concept
  Part-1b: the atlas supports multiscale drill-down across ecosystem → capability →
  component → module/package/concept. Each scale is evidence-backed and connected
  to its neighbours. A scale with no evidence renders honestly empty, not fabricated.
  Bound to openspec/specs/navigation.

  Scenario: Reader moves across scales
    Given a snapshot has ecosystem, capability, component, and module evidence
    When the reader drills down
    Then each scale from ecosystem to module/package/concept is reachable
    And each scale is backed by evidence and linked to its neighbours

  Scenario: Unevidenced scale is honest-empty
    Given a snapshot has no module-level evidence for a component
    When the reader reaches the module scale
    Then it renders honestly empty with an explanation
    And it is not fabricated from names or guesses
