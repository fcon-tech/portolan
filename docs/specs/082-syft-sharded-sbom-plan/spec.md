# Feature Specification: Syft Sharded SBOM Plan

**Feature Branch**: `codex/082-syft-sharded-sbom-plan`

**Created**: 2026-06-02

**Status**: In implementation

**Input**: Integrated Cursor Composer 2.5 stress for PR #57, #58, and #59
classified the combined context as adequate for navigation, but called out a
residual weakness: the generic Syft/CycloneDX SBOM next action remained a
single full-root command while jscpd and Maven had become repository-sharded.

## User Scenarios & Testing

### User Story 1 - Repository-Sharded SBOM Next Actions (Priority: P1)

A Portolan operator preparing context for a large multi-repo landscape sees one
approval-gated Syft/CycloneDX command per discovered repository, with outputs
declared under the current context `tool-outputs` directory.

**Independent Test**: A fixture with two repositories and a local `syft`
executable produces two Syft commands, neither scanning the full root.

### User Story 2 - Evidence Honesty (Priority: P1)

An agent reading the plan understands that Syft commands are native producer
recipes, not Portolan execution receipts or verified component evidence.

**Independent Test**: Fresh Bigtop context and Cursor Composer 2.5 stress
confirm `cyclonedx` remains `available_not_run` / `not_assessed`, no
`tool-outputs` directory exists, and component/dependency inventory is not
claimable.

## Requirements

- **FR-001**: In multi-repo contexts, `oss-plan.json` MUST emit
  repository-sharded Syft/CycloneDX commands.
- **FR-002**: Syft shard commands MUST read exactly one repository path and
  MUST NOT scan the full landscape root.
- **FR-003**: Syft shard outputs MUST be declared under
  `<context>/tool-outputs/syft/`.
- **FR-004**: Syft commands MUST require user approval and keep
  `evidence_state: not_assessed`.
- **FR-005**: Missing, failed, or unrun Syft shards MUST NOT be aggregated into
  component/dependency coverage claims.
- **FR-006**: Single-repository contexts MAY retain the existing single-command
  plan.
- **FR-007**: The feature MUST NOT execute Syft or any native producer during
  context preparation or verification.

## Success Criteria

- **SC-001**: Focused contextprep tests verify sharded Syft commands for a
  multi-repo fixture.
- **SC-002**: Fresh Bigtop context shows 18 Syft/CycloneDX commands and no
  native producer output directory.
- **SC-003**: Cursor Composer 2.5 confirms Syft next actions are specific
  enough while component/dependency evidence remains non-claimable.
- **SC-004**: jscpd and other non-Syft producer-family plan behavior remains
  out of scope and `not_assessed` for this isolated branch.
- **SC-005**: Baseline checks pass.
