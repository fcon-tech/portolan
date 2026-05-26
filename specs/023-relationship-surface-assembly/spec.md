# Feature Specification: Relationship Surface Assembly

**Feature Branch**: `023-relationship-surface-assembly`

**Created**: 2026-05-26

**Status**: Implemented

**Input**: Product validation showed that Cursor-plus-Portolan avoids unsupported
service-relationship claims when Backstage/OpenAPI/AsyncAPI/Structurizr outputs
are absent. The next useful OSS assembly layer is to summarize those local
relationship surface files when they are present.

## Requirements

- **FR-001**: Context preparation MUST summarize local Backstage catalog files
  as metadata-visible service catalog candidates.
- **FR-002**: Context preparation MUST summarize local OpenAPI files as
  metadata-visible HTTP API contract candidates.
- **FR-003**: Context preparation MUST summarize local AsyncAPI files as
  metadata-visible event/API contract candidates.
- **FR-004**: Context preparation MUST summarize local Structurizr DSL files as
  metadata-visible architecture model candidates.
- **FR-005**: The summary MUST be shallow and local-only; it MUST NOT fetch,
  resolve remote refs, run generators, start daemons, or claim runtime
  topology.
- **FR-006**: Malformed or unreadable JSON contract candidates MUST remain in
  the registry as `cannot_verify`.

## Success Criteria

- **SC-001**: A fixture with Backstage, OpenAPI, AsyncAPI, and Structurizr files
  produces observed registry entries with metrics.
- **SC-002**: Missing relationship surface families still produce
  `not_assessed` gaps.
- **SC-003**: Cursor can answer that relationship surfaces are present without
  converting them into verified runtime topology.
