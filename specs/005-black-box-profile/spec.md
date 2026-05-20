# Feature Specification: Black-Box Profile

**Feature Branch**: `005-black-box-profile`
**Created**: 2026-05-20
**Status**: Backlog spec
**Input**: Product backlog P1-005: represent black-box systems through metadata, runtime observations, and claims.

## User Scenarios & Testing

### User Story 1 - Represent A System Without Source (Priority: P1)

A user can include a system whose source code is unavailable and still see how it is known.

**Independent Test**: A fixture black-box system produces nodes with `metadata-visible`, `runtime-visible`, or `claim-only` evidence, but never `source-visible`.

### User Story 2 - Preserve Unknowns (Priority: P1)

A reviewer can see which relationships remain unknown rather than inferred.

**Independent Test**: A fixture with runtime evidence for a service but no dependency data records dependencies as `unknown`.

## Requirements

- **FR-001**: System MUST support black-box target declarations.
- **FR-002**: System MUST prevent black-box facts from using `source-visible`.
- **FR-003**: System MUST distinguish metadata, runtime, and claim evidence.
- **FR-004**: System MUST record explicit unknowns for expected-but-missing fields when a profile requires them.
- **FR-005**: System MUST document what each black-box profile can and cannot prove.

## Success Criteria

- **SC-001**: Black-box fixture output contains no `source-visible` facts.
- **SC-002**: Missing dependency evidence remains `unknown` or `cannot_verify`.
- **SC-003**: Packet summaries do not imply black-box source analysis happened.

## Assumptions

- Initial black-box profile is manually selected.
- Runtime observations arrive as files, not live telemetry queries.
