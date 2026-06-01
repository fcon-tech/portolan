# Feature Specification: Bigtop Symbol/Reference Producer Acquisition

**Feature Branch**: `codex/059-bigtop-symbol-reference-producer-acquisition`

**Created**: 2026-06-02

**Status**: Planning

Note: "symbol/reference" names the broader C6 gap. This slice's selected
producer output may land as symbol definitions only. It must not be called a
full symbol/reference graph unless reference edges are actually produced and
validated.

**Input**: User objective requires real symbol/API/catalog/model/runtime producer
outputs beyond Syft/CycloneDX and a path toward Cursor + Portolan
enterprise-style Bigtop understanding.

## User Scenarios & Testing

### User Story 1 - Select A Mature Local Symbol/Reference Producer (Priority: P1)

A maintainer can compare mature OSS producer options and choose the lowest-risk
local option for a bounded Bigtop scope.

**Independent Test**: A producer decision record compares fit, maturity,
license, local execution, privacy posture, target mutation risk, install cost,
and output validation.

### User Story 2 - Acquire And Run The Producer Safely (Priority: P1)

A maintainer can acquire the chosen producer without mutating Bigtop repositories
or storing credentials, then run it against a bounded target scope.

**Independent Test**: The run ledger records install/acquisition method, command,
target scope, output path, validation, evidence state, limitations, and whether
the output contains definitions only or definitions plus references.

### User Story 3 - Feed Evidence Back Into Cursor + Portolan Rubric (Priority: P2)

Cursor plus Portolan can use the new symbol/reference output in the C1-C9 rubric
without claiming runtime topology or enterprise parity unless the evidence
supports it.

**Independent Test**: Cursor stress or a bounded review packet cites the new
producer output and updates C6 symbol/reference status without upgrading C4
runtime or C9 enterprise parity incorrectly.

## Requirements

- **FR-001**: The feature MUST preserve local-first and read-only target
  defaults.
- **FR-002**: The feature MUST NOT mutate Bigtop repositories, start Bigtop
  services, use credentials, or send target source to remote services.
- **FR-003**: Any new producer acquisition MUST document OSS fit, maturity,
  license, maintenance risk, local execution, privacy posture, install cost, and
  output validation.
- **FR-004**: Definition-only outputs MUST NOT be called full symbol/reference
  graphs.
- **FR-005**: A symbol definition or symbol/reference claim MUST state selected
  scope, languages covered, exclusions, validation results, and whether
  references are present. Definition-only outputs MUST use definition-only
  wording.
- **FR-006**: If no producer can be acquired or run safely, the result MUST be
  `cannot_verify` or `not_assessed` with exact blocker evidence.
- **FR-007**: Cursor/Portolan stress MUST preserve runtime topology and
  enterprise parity as `not_assessed` unless separate evidence exists.

## Success Criteria

- **SC-001**: At least two mature OSS symbol/reference producer options are
  evaluated.
- **SC-002**: One producer is either acquired and run on a bounded Bigtop scope,
  or acquisition/run is blocked with exact evidence.
- **SC-003**: The output is validated enough to classify it as definitions-only,
  definitions plus references, or cannot_verify.
- **SC-004**: The C1-C9 rubric is updated with the new C6 status while C4
  runtime and C9 enterprise parity remain honest.

## Assumptions

- The target landscape is `/home/fall_out_bug/projects/bigtop-landscape`.
- Installing a user-local producer may be acceptable only after documenting the
  design trade-off and keeping target repos read-only.
- Runtime topology remains out of scope for this slice except as an explicit
  non-claim.
