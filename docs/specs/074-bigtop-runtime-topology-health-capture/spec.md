# Feature Specification: Bigtop Runtime Topology Health Capture

**Feature Branch**: `codex/074-bigtop-runtime-topology-health-capture`

**Created**: 2026-06-02

**Status**: Approval-gated implementation

**Input**: PR #51/spec 073 executed the approved single-node Bigtop Docker
provisioner run. The Docker lifecycle and one YARN NodeManager were
`runtime-visible`, but NameNode, ResourceManager, HistoryServer, and
ProxyServer failed, while Datanode was skipped/not found. This slice converts
that partial evidence into a health-oriented topology proof attempt: either a
bounded HDFS/YARN/MapReduce topology becomes verified with service and smoke
evidence, or the failure becomes verified with root-cause artifacts.

## User Scenarios & Testing

### User Story 1 - Verify Or Falsify Bounded Runtime Topology (Priority: P1)

A maintainer can tell whether a single-node Bigtop HDFS/YARN/MapReduce topology
is actually healthy, rather than relying on the provisioner script exit code.

**Independent Test**: The runtime ledger records create/provision exit code,
per-service systemd state, process state, daemon logs, port/listening state
where available, and bounded smoke probes. If any required component is not
healthy, the topology is `failed` or `cannot_verify`, not verified.

### User Story 2 - Preserve Cleanup And Local Safety (Priority: P1)

A maintainer can re-run or stop the runtime capture without leaving Docker or
target-repository residue.

**Independent Test**: Destroy cleanup runs after capture and residue checks for
containers, networks, volumes, provisioner-generated files, and target repo
status are recorded.

### User Story 3 - Stress Cursor Against Health Evidence (Priority: P1)

Cursor plus Portolan must answer the Bigtop runtime topology question from the
health evidence and must not promote partial service observations to a healthy
cluster.

**Independent Test**: Cursor `composer-2.5` classifies each runtime claim as
`verified`, `partial`, `failed`, `cannot_verify`, or `not_assessed`, and
independent non-GPT reviewers assess the claim boundary.

## Requirements

- **FR-001**: The feature MUST start from the spec 073 failure evidence and MUST
  not treat `docker-hadoop.sh --create 1` exit `0` as topology success.
- **FR-002**: The feature MUST record explicit approval before any additional
  Docker provisioner create/provision/smoke/destroy command is run.
- **FR-003**: The feature MUST capture pre-run Docker, target repo, and
  environment state.
- **FR-004**: The feature MUST execute a bounded single-node runtime command
  sequence only within the approved scope.
- **FR-005**: The feature MUST capture per-service health for at least NameNode,
  Datanode, ResourceManager, NodeManager, MapReduce HistoryServer, and
  ProxyServer.
- **FR-006**: The feature MUST capture daemon logs for failed services, not only
  systemd wrapper status.
- **FR-007**: The feature MUST run bounded read-only smoke probes when services
  are healthy enough to test them, including HDFS filesystem status and YARN
  node/application status where available.
- **FR-008**: The feature MUST classify the topology as `verified` only if the
  required service-health and smoke-probe checks pass.
- **FR-009**: The feature MUST classify the topology as `failed` or
  `cannot_verify` when core services fail, logs are insufficient, cleanup
  fails, or probes cannot run.
- **FR-010**: The feature MUST run cleanup/destroy and record residue checks.
- **FR-011**: Cursor stress and independent review MUST reject claims of healthy
  Bigtop runtime topology unless FR-005 through FR-008 pass.

## Success Criteria

- **SC-001**: The approval artifact names the exact command sequence, runtime
  scope, cleanup command, and stop conditions.
- **SC-002**: The runtime ledger distinguishes create/provision script success
  from component health.
- **SC-003**: Service-health evidence covers NameNode, Datanode,
  ResourceManager, NodeManager, HistoryServer, and ProxyServer.
- **SC-004**: Daemon logs or explicit missing-log evidence are captured for
  failed services.
- **SC-005**: Smoke probes either pass and support a bounded verified topology,
  or are recorded as failed/skipped with reason.
- **SC-006**: Cleanup leaves no matching Docker or target-repository residue.
- **SC-007**: Cursor stress and three assessed independent non-GPT review lanes
  agree that the runtime claim is either verified with evidence or remains
  failed/cannot_verify.

## Out Of Scope

- Multi-node Bigtop.
- Kubernetes runtime topology.
- Service repair requiring upstream Bigtop source changes.
- Portolan runtime importer implementation.
- Full source symbol/reference graph or call graph.
- Human/enterprise architecture parity; this is deferred to spec 076.

## Assumptions

- The approved runtime command sequence may use the upstream Bigtop Docker
  provisioner and read-only `docker exec` checks inside the created container.
- If a healthy single-node HDFS/YARN/MapReduce topology cannot be reached
  safely, a verified failure with logs is still forward progress and must not be
  described as verified topology.
- Raw runtime outputs remain external under a dated Bigtop landscape
  `.portolan/stress/` directory.
