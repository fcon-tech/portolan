# Feature Specification: Importer Normalization

**Feature Branch**: `004-importer-normalization`
**Created**: 2026-05-20
**Status**: Implemented
**Input**: Product backlog P1-004: import existing OSS/tool outputs through reviewed adapters.

## User Scenarios & Testing

### User Story 1 - Import Tool Output (Priority: P1)

A user points Portolan at an exported file from another tool and receives graph facts with source attribution.

**Independent Test**: A fixture importer converts one tool export into graph nodes and edges with `metadata-visible` evidence.

### User Story 2 - Review Adapter Fit Before Dependency (Priority: P1)

A maintainer can see license, format, privacy, and maintenance notes before an importer is accepted.

**Independent Test**: Each importer plan includes a fit table before code adds a dependency.

## Requirements

- **FR-001**: Each importer MUST declare supported input format and version.
- **FR-002**: Each importer MUST record source attribution on every generated fact.
- **FR-003**: Each importer MUST preserve uncertainty from the source tool.
- **FR-004**: Importer specs MUST compare license, maintenance, privacy, and adapter cost before implementation.
- **FR-005**: Importers MUST be file-based by default, not live API integrations.

## Success Criteria

- **SC-001**: First importer fixture maps at least one node and one edge.
- **SC-002**: Malformed importer input produces `cannot_verify` with a reason.
- **SC-003**: Importer documentation names what the source tool can and cannot prove.

## Assumptions

- The first importer target is local CycloneDX JSON because it is a mature,
  tool-neutral SBOM standard with an official JSON encoding and broad OSS tool
  support.
- Candidate generators such as cdxgen, Syft, and Trivy remain external tools;
  this slice imports their local file output instead of invoking them.
- File exports come before invoking external binaries or live APIs.
