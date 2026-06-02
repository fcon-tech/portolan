# Feature Specification: Bigtop Protobuf API Descriptors

**Feature Branch**: `codex/066-bigtop-protobuf-api-descriptors`

**Created**: 2026-06-02

**Status**: Ready-for-review PR

**Input**: The broader objective requires real producer outputs beyond
Syft/CycloneDX. Prior slices verified small API/catalog outputs and Semgrep
mention evidence, but Hadoop and HBase still have large `.proto` surfaces that
can be processed read-only by an existing OSS producer.

## User Scenarios & Testing

### User Story 1 - Generate Real API Producer Outputs (Priority: P1)

A maintainer can inspect standard protobuf descriptor outputs for bounded
Bigtop Hadoop/HBase API surfaces without building repositories or starting
services.

**Independent Test**: External `protoc` outputs include descriptor sets,
text-decoded descriptor summaries, hashes, sizes, command stdout/stderr, and
exit codes.

### User Story 2 - Keep Producer Scope Honest (Priority: P1)

A maintainer can see exactly which descriptor groups succeeded and which larger
or generated-source-dependent groups remain blocked.

**Independent Test**: The ledger distinguishes successful descriptor sets from
whole-Hadoop duplicate-symbol failure and HBase shaded missing generated import
failure.

### User Story 3 - Prevent Architecture Overclaims (Priority: P1)

A maintainer can use the descriptor outputs as API/catalog evidence without
promoting them to runtime topology, full def/ref graph, call graph, or
enterprise code-intelligence parity.

**Independent Test**: Cursor stress preserves runtime topology and full
symbol/reference/call graph as `cannot_verify`.

## Requirements

- **FR-001**: The feature MUST use existing OSS `protoc` output rather than a
  Portolan-owned protobuf parser.
- **FR-002**: The feature MUST write generated outputs outside target repository
  source trees.
- **FR-003**: The feature MUST record source file lists, include directories,
  stdout/stderr, exit codes, descriptor sets, decoded descriptor text, hashes,
  and sizes.
- **FR-004**: The feature MUST classify successful descriptor sets as
  `metadata-visible` API/catalog producer evidence.
- **FR-005**: The feature MUST NOT claim runtime topology, full symbol/reference
  graph, call graph, or enterprise parity from protobuf descriptor outputs.
- **FR-006**: Failed broader descriptor groups MUST remain blocked or
  `cannot_verify` with exact stderr evidence.

## Success Criteria

- **SC-001**: At least one Hadoop descriptor set is generated with exit code
  `0`.
- **SC-002**: At least one HBase descriptor set is generated with exit code
  `0`, or the failure is recorded with exact blocker evidence.
- **SC-003**: Descriptor summaries include file/message/enum/service/method
  counts.
- **SC-004**: Cursor stress preserves architecture/runtime graph limits.
- **SC-005**: Local baseline checks pass before PR readiness.

## Out Of Scope

- Building Hadoop, HBase, or any target repository.
- Generating Java/Go/Python code from protobuf schemas.
- Adding protobuf importers or dependencies to Portolan.
- Starting Bigtop runtime services.
- Claiming full architecture parity.

## Assumptions

- The target landscape root is `/home/fall_out_bug/projects/bigtop-landscape`.
- `protoc` is available locally as `libprotoc 35.0`.
- Descriptor outputs are committed only as ledger summaries; generated binary
  descriptor artifacts remain external stress evidence.
