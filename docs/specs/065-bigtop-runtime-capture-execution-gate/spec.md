# Feature Specification: Bigtop Runtime Capture Execution Gate

**Feature Branch**: `codex/065-bigtop-runtime-capture-execution-gate`

**Created**: 2026-06-02

**Status**: Merged via PR #43

**Input**: Specs 061 and 062 defined and preflighted a Bigtop Docker
provisioner runtime capture path, but no Bigtop services were started. The
objective still requires runtime topology evidence. This slice must make the
final execution gate auditable without silently treating static or unrelated
runtime surfaces as Bigtop runtime topology.

## User Scenarios & Testing

### User Story 1 - Recheck Current Runtime Surfaces (Priority: P1)

A maintainer can see whether a Bigtop runtime is already present in local
Docker, Kubernetes, or process surfaces before approving any new runtime
mutation.

**Independent Test**: A runtime-surface ledger records fresh read-only Docker,
Kubernetes, process, and runbook-candidate evidence with hashes and sizes.

### User Story 2 - Separate Approval From Evidence (Priority: P1)

A maintainer can distinguish a verified preflight and available runbook from
approval to start Bigtop services.

**Independent Test**: The spec and ledger state that `docker-hadoop.sh
--docker-compose-plugin --create 1` remains blocked unless explicit runtime
execution approval is recorded.

### User Story 3 - Define What Would Become Verified (Priority: P1)

A maintainer can approve or reject a bounded runtime capture knowing exactly
which runtime-visible observations would be accepted and which static or
unrelated signals would remain insufficient.

**Independent Test**: The plan names expected accepted outputs, rejected
substitutes, cleanup commands, stop conditions, and post-run verification.

## Requirements

- **FR-001**: The feature MUST NOT start, stop, destroy, provision, exec into,
  or otherwise mutate Bigtop Docker containers unless a separate explicit
  runtime execution approval is recorded.
- **FR-002**: The feature MUST recheck local Docker, Kubernetes, and process
  surfaces read-only for existing Bigtop runtime evidence.
- **FR-003**: The feature MUST record all probe outputs outside target repo
  source trees and preserve hashes/sizes.
- **FR-004**: The feature MUST classify unrelated running containers, unrelated
  Kubernetes pods, static compose files, Helm charts, ctags/Semgrep outputs, and
  provisioner runbooks as insufficient for runtime topology.
- **FR-005**: The feature MUST define accepted runtime-visible outputs for an
  approved capture before any create command is run.
- **FR-006**: Runtime topology MUST remain `cannot_verify` until approved
  runtime-visible Bigtop observations exist.
- **FR-007**: Cursor stress MUST preserve the approval boundary and reject
  static/runtime-adjacent substitutes.

## Success Criteria

- **SC-001**: Fresh Docker/Kubernetes/process runtime absence or presence is
  ledgered with exact output file paths.
- **SC-002**: The upstream Bigtop runtime candidate runbook path is recorded.
- **SC-003**: The next approval-required command and cleanup plan are explicit.
- **SC-004**: Cursor stress preserves runtime topology as `cannot_verify` when
  only static or unrelated runtime surfaces exist.
- **SC-005**: Local baseline checks pass before PR readiness.

## Out Of Scope

- Starting Bigtop services.
- Pulling container images or packages.
- Mutating Docker networks, volumes, containers, or target repositories.
- Claiming runtime topology from static deployment models.
- Claiming enterprise code-intelligence parity.

## Assumptions

- The target landscape is `/home/fall_out_bug/projects/bigtop-landscape`.
- The candidate Bigtop provisioner path is
  `/home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/provisioner/docker`.
- Docker/Kubernetes/process inspection is read-only, but it may contact local
  sockets and expose command execution to local audit/logging surfaces.
