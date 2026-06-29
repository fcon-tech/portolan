# Spec Delta — engineering-standards

## ADDED Requirements

### Requirement: Pipeline stages produce coherent unit IDs
SHALL the deterministic core, the system-map composer, and the navigation-index
builder use a single unit-ID convention derived from the selection targets.
An ID mismatch between stages is a pipeline defect, not an acceptable
divergence.

#### Scenario: System-map and nav-bundle agree on unit IDs
- GIVEN the pipeline runs on a multi-repository target
- WHEN a unit appears in both the system-map and the nav-bundle
- THEN the unit has the same ID in both artifacts
- AND cross-artifact links resolve without normalization hacks
