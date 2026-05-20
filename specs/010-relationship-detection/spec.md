# Feature Specification: Relationship Detection

**Feature Branch**: `010-relationship-detection`
**Created**: 2026-05-20
**Status**: Backlog spec
**Input**: Product backlog P2-010: detect source, metadata, runtime, and
claim-backed relationships across a codebase, prioritized by the Bigtop smoke.

## User Scenarios & Testing

### User Story 1 - Detect Source Relationships (Priority: P1)

An agent receives a map of import, module, and package relationships from local
source and manifest files.

**Independent Test**: A fixture repository with Go imports and dependency
manifests emits `depends-on` or `imports` relationships with `source-visible`
or `metadata-visible` evidence.

### User Story 2 - Preserve Metadata And Claim Relationships (Priority: P1)

A reviewer can distinguish relationships found in source from relationships
declared in metadata, runtime exports, or claims.

**Independent Test**: A fixture relationship from a claim file remains
`claim-only` even when source relationships exist elsewhere.

### User Story 3 - Apply To Bigtop Smoke Gaps (Priority: P2)

The Bigtop smoke identifies which dependency and lifecycle relationships are
missing from current Portolan output.

**Independent Test**: A Bigtop-derived fixture includes at least one BOM
dependency, one source relationship, and one unknown relationship gap.

## Requirements

- **FR-001**: System MUST detect local source relationships without network
  access.
- **FR-002**: System MUST preserve evidence state per relationship.
- **FR-003**: System MUST not infer service relationships from naming alone.
- **FR-004**: System MUST represent missing expected relationships as `unknown`
  or `cannot_verify`.
- **FR-005**: System MUST document which relationship types are supported per
  language or input family.

## Existing Open Source

- Prefer standard parsers and manifest readers before custom source analysis.
- Consider tree-sitter or language-native parsers only after fixture needs prove
  regex/string scanning is insufficient.
- Import mature tool outputs when available instead of becoming a full code
  intelligence platform.

## Success Criteria

- **SC-001**: Relationship fixture emits source, metadata, claim, and unknown
  relationship examples.
- **SC-002**: Bigtop smoke gaps can be translated into concrete relationship
  detector tasks.
- **SC-003**: No relationship is emitted without evidence state and source.

## Assumptions

- This spec should be planned after the first Bigtop skill-pack smoke records
  actual missing relationship cases.
