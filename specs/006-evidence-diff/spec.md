# Feature Specification: Evidence Graph Diff

**Feature Branch**: `006-evidence-diff`
**Created**: 2026-05-20
**Status**: Implemented
**Input**: Product backlog P3-006: compare two evidence graphs and show what became visible, changed, or stayed unknown.

## User Scenarios & Testing

### User Story 1 - Compare Two Runs (Priority: P1)

A lead compares two Portolan graph outputs and sees changed nodes, changed edges, and changed evidence states.

**Independent Test**: Fixture graphs produce a diff where one fact moves from `unknown` to `metadata-visible`.

### User Story 2 - Avoid Readiness Verdicts (Priority: P1)

A reviewer sees movement facts without Portolan declaring improvement or degradation.

**Independent Test**: Diff output reports state transitions but no pass/fail or readiness verdict.

## Requirements

- **FR-001**: System MUST accept two graph JSON files.
- **FR-002**: System MUST report added, removed, unchanged, and changed facts.
- **FR-003**: System MUST report evidence-state transitions.
- **FR-004**: System MUST NOT emit readiness, modernization, or degradation verdicts.
- **FR-005**: System MUST support machine-readable diff output before human summaries.

## Success Criteria

- **SC-001**: Fixture diff output identifies at least one added node, one changed edge, and one evidence-state transition.
- **SC-002**: Diff output validates as JSON.
- **SC-003**: No generated diff field uses pass/fail/readiness language.

## Assumptions

- Graph IDs are stable enough for first diff tests.
- Sophisticated matching and rename detection are out of scope for the first diff.
