# Feature Specification: Bigtop Runtime Capture Execution

**Feature Branch**: `codex/073-bigtop-runtime-capture-execution`

**Created**: 2026-06-02

**Status**: Merged via PR #51

**Input**: Specs 061, 062, and 065 defined the bounded approval gate for a
single-node Apache Bigtop Docker provisioner runtime capture. The user
explicitly approved execution with `разрешаю` on 2026-06-02. This slice records
the approved create/capture/destroy run, preserves service-level failures, and
prevents a partial runtime observation from being promoted into complete Bigtop
runtime topology proof.

## User Scenarios & Testing

### User Story 1 - Execute Approved Runtime Capture (Priority: P1)

A maintainer can see that the previously blocked Bigtop runtime create command
was executed only after explicit approval and that all command outputs, exit
codes, inspected containers, networks, service statuses, and hashes were saved.

**Independent Test**: The runtime ledger cites the approval text, create
command, create exit code, Docker container/network observations, service
status capture, destroy command, destroy exit code, residue checks, and output
hashes.

### User Story 2 - Preserve Partial Runtime Boundaries (Priority: P1)

A maintainer can distinguish verified runtime-visible observations from failed
or unverifiable Bigtop topology claims.

**Independent Test**: The ledger classifies the running container, Docker
network, inspect output, and YARN NodeManager process/service as
`runtime-visible`, while NameNode, ResourceManager, HistoryServer, ProxyServer,
Datanode, full topology, and enterprise parity remain failed, partial, or
`cannot_verify`.

## Requirements

- **FR-001**: The feature MUST record the explicit approval timestamp and
  approved command scope before runtime creation.
- **FR-002**: The feature MUST execute only the bounded single-node Bigtop
  Docker provisioner create command approved by the user.
- **FR-003**: The feature MUST capture Docker state before create, after
  create, and after destroy.
- **FR-004**: The feature MUST inspect the created container and network before
  cleanup.
- **FR-005**: The feature MUST capture Hadoop/YARN/HDFS/MapReduce service and
  process status from inside the created container.
- **FR-006**: The feature MUST record service failures and skipped dependencies
  instead of treating create exit `0` as a healthy topology.
- **FR-007**: The feature MUST run cleanup/destroy and record residue checks for
  containers, networks, volumes, and target repository state.
- **FR-008**: The feature MUST NOT claim complete Bigtop runtime topology,
  production architecture parity, call graph, full symbol/reference graph, or
  enterprise-intelligence parity from this partial runtime capture.
- **FR-009**: Cursor stress and independent review MUST reject broad runtime
  overclaims and preserve `cannot_verify` for unsupported claims.

## Success Criteria

- **SC-001**: Runtime create and destroy commands both exit `0`.
- **SC-002**: Runtime-visible Docker evidence includes one created/running
  Bigtop container and its Docker network before cleanup.
- **SC-003**: Service evidence identifies at least one running Bigtop component
  and every failed or missing Hadoop component observed during capture.
- **SC-004**: Cleanup evidence shows no matching runtime container, network, or
  volume residue and no target repository residue after destroy.
- **SC-005**: The evidence ledger states the runtime capture is partial/failed
  for full topology even though the create command exited `0`.
- **SC-006**: Local baseline checks pass before PR readiness.

## Out Of Scope

- Retrying or repairing Bigtop service startup.
- Expanding to multi-node Bigtop.
- Running Kubernetes or Helm runtime workloads.
- Adding Portolan runtime import code.
- Adding network, daemon, credentials, or mutation behavior to Portolan.
- Claiming full runtime topology, full source graph, call graph, or enterprise
  code-intelligence parity.

## Assumptions

- Raw runtime outputs remain external under
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-073-runtime-capture-execution/tool-outputs/`.
- The approved Bigtop provisioner mutation is limited to Docker state and
  transient files under the upstream Bigtop provisioner directory.
- Destroy cleanup is part of the evidence requirement, not optional polish.
