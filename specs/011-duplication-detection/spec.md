# Feature Specification: Duplication Detection

**Feature Branch**: `011-duplication-detection`
**Created**: 2026-05-20
**Status**: Backlog spec
**Input**: Product backlog P2-011: report duplicate code, duplicated config,
and repeated wrappers as evidence-backed finding clusters.

## User Scenarios & Testing

### User Story 1 - Report Duplicate Code Clusters (Priority: P1)

An agent can see likely copy/paste or near-duplicate code clusters without
reading the whole repository manually.

**Independent Test**: A fixture with repeated retry logic emits one
`duplication` finding with file/source pointers.

### User Story 2 - Report Duplicated Configuration (Priority: P1)

A reviewer can see repeated or drifting config blocks across environments.

**Independent Test**: A fixture with staging/prod config drift emits a
duplication/config finding with source-visible evidence.

### User Story 3 - Keep Similarity As Evidence, Not Verdict (Priority: P2)

Duplication findings explain the evidence and risk without declaring mandatory
refactoring.

**Independent Test**: Output uses neutral finding language and no rewrite
recommendation unless evidence supports it.

## Requirements

- **FR-001**: System MUST emit duplication findings with file-level evidence.
- **FR-002**: System MUST distinguish exact, near, and config duplication when
  the source tool supports it.
- **FR-003**: System MUST not include raw private code snippets in committed
  fixtures.
- **FR-004**: System MUST not turn duplication into an automatic rewrite plan.
- **FR-005**: System MUST keep unsupported languages or skipped paths as
  `not_assessed`.

## Existing Open Source

- Evaluate local copy/paste detectors such as jscpd before writing a custom
  detector.
- Prefer importing local tool output into Portolan findings over invoking live
  services.
- License, maintenance, language coverage, and output stability must be reviewed
  before adding a dependency.

## Success Criteria

- **SC-001**: Fixture emits at least one duplicate-code finding and one
  duplicated-config finding.
- **SC-002**: Findings include evidence state, source pointers, confidence, and
  severity.
- **SC-003**: Bigtop smoke gaps can decide whether a real duplication scanner is
  justified.

## Assumptions

- This spec should be planned after Bigtop smoke shows which duplication signals
  matter for large ecosystems.
