# Spec Delta — navigation

## ADDED Requirements

### Requirement: Multiscale drill-down across ecosystem to concept
The atlas SHALL support multiscale drill-down across ecosystem → capability →
component → module/package/concept. Each scale SHALL be backed by evidence and
SHALL connect to the scales immediately above and below. A scale with no
evidence MUST render honestly empty with an explanation, not fabricated.

#### Scenario: Reader moves across scales
- GIVEN a snapshot has ecosystem, capability, component, and module evidence
- WHEN the reader drills down
- THEN each scale from ecosystem to module/package/concept is reachable
- AND each scale is backed by evidence and linked to its neighbours

#### Scenario: Unevidenced scale is honest-empty
- GIVEN a snapshot has no module-level evidence for a component
- WHEN the reader reaches the module scale
- THEN it renders honestly empty with an explanation
- AND it is not fabricated from names or guesses
