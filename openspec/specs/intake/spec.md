# Intake Specification

## Purpose

Defines managed conversational intake: how the expedition starts. The agent asks
the admiral what they have (not a filled-in manifest), persists a typed intake
result, and the deterministic core consumes it without re-asking.

Source authority: `docs/captain-atlas/08-portolan-product-charter.md` § Intake
Model, UX Principles (migrated); Gherkin: feature-p1a-managed-intake.feature.

## Requirements

### Requirement: Conversational intake, not a manifest demand
Intake SHALL be a managed conversation where the agent asks the admiral what
anchors they have. The system MUST NOT demand a pre-filled YAML manifest as the
only start; a manifest is one optional input.

#### Scenario: Admiral names repositories only
- GIVEN the admiral drops a Portolan link to an agent
- WHEN the agent runs managed intake
- THEN the agent asks what anchors the admiral has
- AND the admiral names one or more repository roots
- AND a typed intake result is persisted under .portolan/
- AND a deterministic rebuild reuses that intake result without re-asking

#### Scenario: Admiral names repos, docs, and a ticket source
- GIVEN the admiral names a repository root, a docs location, and a ticket API
- WHEN intake completes
- THEN the intake result records all three anchors with their access methods
- AND the perimeter is the union of the named roots

### Requirement: Typed intake result persisted
Intake SHALL persist a typed intake result artefact under `.portolan/` containing
at minimum: `target_root`, an array of anchors (`id`, `kind`, `location`,
`access_method`), a `perimeter` (array of roots), optional
`architectural_principles`, and a `generated_at` timestamp.

#### Scenario: Deterministic rebuild reuses intake
- GIVEN an intake result exists under .portolan/
- WHEN the deterministic core rebuilds the snapshot
- THEN it consumes the existing intake result
- AND it does NOT re-open the intake dialogue

#### Scenario: Unresolvable anchor recorded, not prompted
- GIVEN the deterministic core cannot resolve an anchor's location or access_method
- WHEN it processes the anchor during the build
- THEN it records an unknown rather than prompting the admiral mid-build

### Requirement: Closed anchor kind vocabulary
An anchor's `kind` SHALL be one of: `repository`, `docs`, `issue-tracker`,
`chat`, `mailing-list`, `deploy`. An anchor's `access_method` SHALL be one of
`local`, `api`, `file`.

#### Scenario: Anchor kinds are constrained
- GIVEN intake records an anchor
- WHEN its kind is set
- THEN the kind is one of the closed vocabulary
- AND the access_method is local, api, or file

### Requirement: Explicit perimeter defines external boundary
The expedition perimeter SHALL be exactly what the admiral named. Links leading
outside the perimeter MUST be recorded as external nodes (flagged units, not
crawled) and MUST NOT be crawled without permission.

#### Scenario: External link not crawled
- GIVEN a depends-on edge resolves to a target outside the perimeter
- WHEN the snapshot is built
- THEN the target is recorded as an external node with an external flag
- AND it is not crawled

### Requirement: No single-URL autodiscovery
The system SHALL NOT autodiscover the whole expedition from a single URL with no
named anchors. This is an intentional scope limit.

#### Scenario: URL alone is insufficient
- GIVEN the admiral provides only a URL with no anchors
- WHEN intake runs
- THEN the agent asks for named anchors rather than autodiscovering

### Requirement: Architectural principles are admiral-sourced
Architectural principles for principle-violation checking SHALL be named by the
admiral at intake. If none are given, the system MUST NOT invent principles to
enforce and MUST NOT perform principle-violation checking.

#### Scenario: No principles means no violation checking
- GIVEN intake records no architectural_principles
- WHEN agent producers run
- THEN no architectural-principle-violation findings are produced
