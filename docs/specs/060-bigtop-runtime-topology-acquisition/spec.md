# Feature Specification: Bigtop Runtime Topology Acquisition

**Feature Branch**: `codex/060-bigtop-runtime-topology-acquisition`

**Created**: 2026-06-02

**Status**: Planning

**Input**: User objective requires runtime topology to become verified as part
of proving Portolan with Cursor on Bigtop.

## User Scenarios & Testing

### User Story 1 - Probe Existing Local Runtime Surfaces (Priority: P1)

A maintainer can inspect existing local Docker, Kubernetes, process, and
Portolan selection surfaces without starting Bigtop services or mutating target
repositories.

**Independent Test**: A runtime probe ledger records commands, outputs, scope,
and whether any Bigtop runtime-visible observation exists.

### User Story 2 - Classify Runtime Evidence Honestly (Priority: P1)

The project can distinguish runtime-visible Bigtop observations from unrelated
local workloads and static deployment files.

**Independent Test**: Any runtime topology claim cites process/container/pod/
service/endpoint evidence. If only unrelated workloads or static files exist,
runtime remains `not_assessed` or `cannot_verify`.

### User Story 3 - Re-run Cursor Boundary Stress (Priority: P2)

Cursor plus Portolan can consume the runtime probe result and avoid promoting
Docker Compose, Helm, ctags, protobuf, or unrelated minikube state to Bigtop
runtime topology.

**Independent Test**: Cursor stress answers whether runtime topology is verified
and preserves unsupported states.

## Requirements

- **FR-001**: The feature MUST preserve local-first and read-only defaults.
- **FR-002**: The feature MUST NOT start Bigtop services, mutate target repos,
  use credentials, or change Kubernetes/Docker state.
- **FR-003**: Runtime topology MUST be `runtime-visible` only if an observation
  from a running Bigtop process, container, pod, service, endpoint, or
  orchestrator object is present.
- **FR-004**: Unrelated local containers, minikube nodes, Docker Compose files,
  Helm templates, protobuf descriptors, ctags outputs, or documentation MUST NOT
  be promoted to Bigtop runtime topology.
- **FR-005**: If no Bigtop runtime observation exists, the result MUST remain
  `not_assessed` or `cannot_verify` with exact probe evidence.
- **FR-006**: Cursor stress MUST preserve runtime topology and enterprise parity
  boundaries.

## Success Criteria

- **SC-001**: Docker, Kubernetes, process, selection, and existing Portolan
  runtime surfaces are probed read-only and ledgered.
- **SC-002**: Runtime topology is either verified as `runtime-visible` for a
  bounded Bigtop runtime scope or explicitly remains `not_assessed` /
  `cannot_verify` with evidence.
- **SC-003**: Cursor plus Portolan stress does not overclaim runtime topology.
- **SC-004**: Local verification and independent review are recorded before PR
  readiness.

## Assumptions

- The target landscape is `/home/fall_out_bug/projects/bigtop-landscape`.
- Existing local Docker and minikube workloads may be unrelated to Bigtop.
- Starting a Bigtop cluster or provisioning runtime is out of scope without
  explicit design approval.
