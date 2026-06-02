# Feature Specification: Bigtop Compose Model Producer

**Feature Branch**: `codex/067-bigtop-compose-model-producer`

**Created**: 2026-06-02

**Status**: Ready-for-review PR

**Input**: Runtime topology remains blocked pending explicit execution approval,
but the upstream Bigtop Docker provisioner has Compose files that can be
normalized read-only with Docker Compose itself. This provides real
deployment-model producer output that can later be compared with runtime-visible
container observations.

## User Scenarios & Testing

### User Story 1 - Generate Deployment Model Output (Priority: P1)

A maintainer can inspect normalized Bigtop Docker Compose model outputs without
starting containers.

**Independent Test**: External `docker compose config` outputs include YAML/JSON
model files, exit codes, stderr, hashes, sizes, and summary tables.

### User Story 2 - Preserve Runtime Boundary (Priority: P1)

A maintainer can distinguish deployment-model metadata from runtime-visible
topology.

**Independent Test**: The ledger classifies Compose config output as
`metadata-visible` deployment-model evidence and keeps runtime topology as
`cannot_verify`.

### User Story 3 - Define Expected Runtime Comparison Points (Priority: P1)

A maintainer can see which model fields should be compared against a future
approved runtime capture.

**Independent Test**: The plan records service count, network count, mount
count, image, privilege, memory limit, domain, and cgroup mount differences.

## Requirements

- **FR-001**: The feature MUST use Docker Compose's standard `config` producer
  output rather than parsing Compose YAML by hand.
- **FR-002**: The feature MUST NOT run `up`, `create`, `start`, `exec`,
  `provision`, `smoke-tests`, or any Docker mutation command.
- **FR-003**: The feature MUST record cgroup v1 and cgroup v2 model outputs
  because the Bigtop runbook selects between them by Docker cgroup mode.
- **FR-004**: The feature MUST record explicit environment values used to
  resolve `${DOCKER_IMAGE}` and `${MEM_LIMIT}`.
- **FR-005**: The feature MUST classify generated Compose config as
  `metadata-visible` deployment-model evidence, not `runtime-visible` topology.
- **FR-006**: Cursor stress MUST preserve runtime topology as `cannot_verify`.

## Success Criteria

- **SC-001**: Docker Compose version is recorded.
- **SC-002**: cgroup v2 Compose YAML and JSON config outputs are generated with
  exit code `0`.
- **SC-003**: cgroup v1 Compose JSON config output is generated with exit code
  `0`.
- **SC-004**: Model summaries include service, network, mount, image,
  privilege, memory, and cgroup mount fields.
- **SC-005**: Local baseline checks pass before PR readiness.

## Out Of Scope

- Starting Bigtop containers.
- Verifying runtime topology.
- Pulling images or packages.
- Mutating target repositories or Docker state.
- Claiming full architecture parity.

## Assumptions

- The target provisioner path is
  `/home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/provisioner/docker`.
- The current selected config is `config_ubuntu-24.04.yaml`.
- `DOCKER_IMAGE` is resolved as `bigtop/puppet:trunk-ubuntu-24.04`.
- `MEM_LIMIT` is resolved as `4g`.
