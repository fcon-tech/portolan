# Feature Specification: Bigtop Runtime Capture Preflight

**Feature Branch**: `codex/062-bigtop-runtime-capture-preflight`

**Created**: 2026-06-02

**Status**: Ready-for-review PR; runtime capture approval remains pending

**Input**: Spec 061 defined the approval/runbook boundary for Bigtop runtime
capture. The next step is to verify non-mutating prerequisites and make the
remaining approval gate explicit before any `--create` run.

## User Scenarios & Testing

### User Story 1 - Verify Non-Mutating Runtime Prerequisites (Priority: P1)

A maintainer can see whether local Docker, Docker Compose, Ruby, Docker cgroup
mode, and the Bigtop provisioner environment check are available without
starting containers.

**Independent Test**: A preflight ledger records command transcripts, hashes,
and pass/fail states for read-only prerequisite checks.

### User Story 2 - Preserve The Approval Gate (Priority: P1)

A maintainer can distinguish prerequisite readiness from authorization to start
Bigtop.

**Independent Test**: The preflight ledger states that `--create`, `--provision`,
`--smoke-tests`, `--destroy`, `--exec`, and direct Docker mutation commands
remain approval-required.

### User Story 3 - Prepare The Runtime Capture Decision (Priority: P1)

A maintainer can decide whether to explicitly approve a bounded single-node
Bigtop capture using known prerequisites, expected outputs, and known risks.

**Independent Test**: The spec records the exact command that would be next if
approval is granted and the exact stop condition if approval is not granted.

## Requirements

- **FR-001**: The feature MUST NOT run `./docker-hadoop.sh --create`,
  `--provision`, `--smoke-tests`, `--destroy`, `--exec`, direct `docker compose`
  mutation commands, or direct Docker container/network mutation commands.
- **FR-002**: The feature MUST record read-only preflight command outputs outside
  the target repository source tree.
- **FR-003**: The feature MUST record output hashes and sizes for preflight
  evidence.
- **FR-004**: The feature MUST classify preflight readiness separately from
  runtime topology evidence and approval-blocked commands.
- **FR-005**: Runtime topology MUST remain `cannot_verify` until an explicitly
  approved capture produces runtime-visible Bigtop observations.
- **FR-006**: If preflight passes, the next command MUST still be blocked unless
  explicit design approval is recorded.

## Success Criteria

- **SC-001**: Docker version, Docker Compose version, Ruby version, Docker cgroup
  mode, and Bigtop provisioner `--env-check` are recorded.
- **SC-002**: Preflight evidence is hashed and ledgered.
- **SC-003**: Runtime topology remains `cannot_verify`.
- **SC-004**: The next approval-required command is explicit.
- **SC-005**: Local baseline checks pass before PR readiness.

## Out Of Scope

- Controlled negative-path simulation for missing Docker, Docker Compose, Ruby,
  cgroup support, or Bigtop env-check failure. Those cases require environment
  mutation, dependency shadowing, or a dedicated harness and must be specified
  separately before being treated as verified.

## Assumptions

- The target landscape is `/home/fall_out_bug/projects/bigtop-landscape`.
- The provisioner path is
  `/home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/provisioner/docker`.
- Preflight checks are read-only and do not approve runtime capture.
- `docker info` is read-only by Docker command semantics, but it contacts the
  Docker socket and may be visible to local audit/logging systems.
