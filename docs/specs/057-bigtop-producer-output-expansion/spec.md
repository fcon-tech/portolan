# Feature Specification: Bigtop Producer Output Expansion

**Feature Branch**: `codex/057-bigtop-producer-output-expansion`

**Created**: 2026-06-02

**Status**: In implementation; additional real producer outputs acquired and
Cursor Composer 2.5 stress preserved runtime/symbol/enterprise-parity
boundaries

**Input**: User description: "Continue proving Portolan on Bigtop with real
symbol/API/catalog/model/runtime producer outputs beyond Syft/CycloneDX."

## User Scenarios & Testing

### User Story 1 - Acquire Additional Real Local Producer Outputs (Priority: P1)

A maintainer can run safe local producer tools against Bigtop and record which
outputs are verified, partial, blocked, or not_assessed.

**Why this priority**: The architecture comparison remains partial until more
real producer families are available.

**Independent Test**: Generate at least two additional non-Syft/CycloneDX local
producer outputs and record producer-run ledger entries with scope,
freshness, evidence state, limitations, and privacy review state.

### User Story 2 - Preserve Producer Family Boundaries (Priority: P2)

An agent can use expanded producer evidence without confusing static model,
API/catalog, duplication, or security findings with runtime topology.

**Independent Test**: Cursor Composer 2.5 answers a bounded Bigtop question
using the new producer-run IDs and keeps runtime/symbol gaps explicit.

### User Story 3 - Decide Remaining Blockers (Priority: P3)

The project can say exactly which requested producer families remain blocked or
not_assessed and why.

**Independent Test**: A final ledger records API/catalog/model/duplication or
security producer successes and preserves runtime and symbol/reference blockers
unless real outputs exist.

## Requirements

- **FR-001**: The feature MUST use only local read-only producer commands.
- **FR-002**: The feature MUST NOT start Bigtop runtime services, collect live
  telemetry, use credentials, or mutate target repositories.
- **FR-003**: Every producer run MUST record command, target root, output path,
  scope, freshness, status, evidence state, limitations, and privacy review.
- **FR-004**: Static Helm, Docker Compose, protobuf, duplication, and semgrep
  outputs MUST remain `metadata-visible`, not runtime-visible.
- **FR-005**: Runtime topology MUST remain blocked/not_assessed unless a safe
  local runtime observation export is selected.
- **FR-006**: Symbol/reference MUST remain not_assessed unless a real
  symbol/reference producer output is generated.
- **FR-007**: Cursor stress MUST preserve producer family boundaries and cite
  producer-run IDs.

## Success Criteria

- **SC-001**: At least two additional non-Syft/CycloneDX producer outputs are
  generated and ledgered as verified or explicitly blocked.
- **SC-002**: At least one expanded API/catalog or deployment/model output is
  available beyond the bounded spec 054 output.
- **SC-003**: Cursor Composer 2.5 uses the new producer-run IDs without
  promoting them to runtime topology.
- **SC-004**: Remaining runtime and symbol/reference states are explicitly
  verified as available, blocked, or not_assessed.

## Assumptions

- The Bigtop landscape remains under
  `/home/fall_out_bug/projects/bigtop-landscape`.
- Safe available producers include `protoc`, `helm`, `jscpd`, `semgrep`, and
  possibly `gopls` for Go subtrees.
- Full Bigtop runtime topology likely remains blocked without explicit runtime
  capture approval.
