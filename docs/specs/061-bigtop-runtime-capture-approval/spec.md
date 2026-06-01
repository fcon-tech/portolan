# Feature Specification: Bigtop Runtime Capture Approval

**Feature Branch**: `codex/061-bigtop-runtime-capture-approval`

**Created**: 2026-06-02

**Status**: Ready-for-review PR; runtime capture approval remains pending and
Bigtop runtime topology remains `cannot_verify`

**Input**: PR #38 proved that existing local surfaces cannot verify Bigtop
runtime topology. The next slice must define a safe approved capture path before
any Bigtop runtime is provisioned.

## User Scenarios & Testing

### User Story 1 - Identify The Minimal Runtime Path (Priority: P1)

A maintainer can see which upstream Bigtop runtime tooling is the smallest
candidate for runtime capture and why it is preferable to broader deployment
systems.

**Independent Test**: A review artifact cites the inspected Bigtop provisioner
files and records the selected candidate, rejected alternatives, and risk
boundary.

### User Story 2 - Separate Approval From Observation (Priority: P1)

A maintainer can decide whether to approve runtime provisioning without the
agent silently starting containers, mutating Docker/Kubernetes state, pulling
images, or reading credentials.

**Independent Test**: The runbook marks every provisioning command as
approval-required and lists preflight-only commands that remain read-only.

### User Story 3 - Define Runtime-Visible Producer Outputs (Priority: P1)

Portolan can know what evidence would be sufficient to classify a bounded Bigtop
runtime topology as `runtime-visible`.

**Independent Test**: The runbook defines accepted outputs such as container
IDs/names, Docker networks, `docker inspect` service metadata, Bigtop component
processes inside containers, smoke-test results, and cleanup evidence.

### User Story 4 - Preserve Cursor Claim Boundaries (Priority: P2)

Cursor plus Portolan can consume the approval/runbook packet and refuse to claim
runtime topology until the approved runtime capture outputs exist.

**Independent Test**: A stress prompt asks Cursor to decide whether runtime is
verified before approval and after hypothetical capture outputs.

## Requirements

- **FR-001**: The feature MUST NOT start, create, stop, destroy, or provision any
  Bigtop runtime without explicit design approval recorded in this spec or a
  follow-up implementation spec.
- **FR-002**: The feature MUST inspect upstream Bigtop runtime/provisioner
  surfaces read-only before choosing a runtime capture path.
- **FR-003**: The selected path MUST prefer upstream OSS tooling over a
  Portolan-owned runtime scanner.
- **FR-004**: The approval packet MUST list commands that mutate Docker,
  Kubernetes, process, filesystem, or network state.
- **FR-005**: The approval packet MUST define cleanup commands and post-cleanup
  evidence required before the run is considered reversible.
- **FR-006**: Runtime topology MUST remain `cannot_verify` until approved capture
  outputs contain running Bigtop process, container, pod, service, endpoint, or
  orchestrator observations.
- **FR-007**: Static Docker Compose, Puppet, Juju, Helm, README, ctags, and
  config files MUST remain `metadata-visible` or `source-visible`, not
  `runtime-visible`.
- **FR-008**: The feature MUST record whether runtime verification is approved,
  blocked, or pending; it MUST NOT collapse pending approval into success.

## Success Criteria

- **SC-001**: A runtime capture runbook identifies a minimal upstream Bigtop
  candidate and exact approval-required commands.
- **SC-002**: The runbook defines sufficient runtime-visible outputs and
  insufficient static outputs.
- **SC-003**: The risk review covers resource use, network/image pulls,
  privileged containers, filesystem writes, cleanup, and credentials.
- **SC-004**: Cursor stress preserves `cannot_verify` before capture.
- **SC-005**: Local baseline checks pass for the documentation-only slice.

## Assumptions

- The target landscape is `/home/fall_out_bug/projects/bigtop-landscape`.
- The primary candidate is
  `/home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/provisioner/docker`.
- The Docker provisioner is upstream Apache Bigtop tooling and is acceptable to
  inspect read-only.
- Runtime provisioning remains out of scope until explicit design approval is
  recorded.
