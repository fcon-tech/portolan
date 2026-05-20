# Feature Specification: Selection And Inventory Input

**Feature Branch**: `002-selection-inventory`
**Created**: 2026-05-20
**Status**: Backlog spec
**Input**: Product backlog P0-002: declare repositories, metadata files, runtime exports, and claim files without editing code.

## User Scenarios & Testing

### User Story 1 - Declare Landscape Inputs (Priority: P1)

A lead creates a selection file that names all local inputs Portolan may inspect.

**Independent Test**: A fixture selection with repository, metadata, runtime, and claim inputs validates without scanning.

**Acceptance Scenarios**:

1. **Given** a selection file with four target kinds, **When** validation runs, **Then** each target has an id, kind, path, and evidence-source intent.
2. **Given** duplicate ids, **When** validation runs, **Then** the error identifies both duplicates.

### User Story 2 - Validate Before Scan (Priority: P1)

A user can check selection quality before running a scan.

**Independent Test**: `portolan selection validate --selection selection.json` exits non-zero for malformed input.

## Requirements

- **FR-001**: System MUST define a versioned selection schema.
- **FR-002**: System MUST support repository, metadata, runtime, and claim input kinds.
- **FR-003**: System MUST validate duplicate ids and missing paths before scan execution.
- **FR-004**: System MUST keep every selected input local by default.
- **FR-005**: System MUST reject network URLs unless a later explicit network profile exists.

## Success Criteria

- **SC-001**: Invalid fixture selections produce deterministic error messages.
- **SC-002**: Valid fixture selections can be validated without reading target contents.
- **SC-003**: Selection schema examples cover all supported input kinds.

## Assumptions

- JSON remains the first selection format.
- YAML and UI-based selection are out of scope until the JSON shape stabilizes.
