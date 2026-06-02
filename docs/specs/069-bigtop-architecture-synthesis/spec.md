# Feature Specification: Bigtop Architecture Synthesis

**Feature Branch**: `codex/069-bigtop-architecture-synthesis`

**Created**: 2026-06-02

**Status**: Ready-for-review PR after refreshed checks pass and draft is removed

**Input**: After PRs #35-#46, Portolan has additional real Bigtop producer
outputs beyond Syft/CycloneDX: ctags definitions, local Semgrep metadata,
protobuf descriptor sets, Docker Compose desired-state config, Helm
desired-state manifests, runtime absence probes, and explicit execution gates.
The project needs a fresh Cursor plus Portolan synthesis to decide whether the
architecture-understanding claim can be upgraded or must stay bounded.

## User Scenarios & Testing

### User Story 1 - Re-score Architecture Understanding (Priority: P1)

A maintainer can see whether accumulated evidence from specs 059-068 changes
the C1-C9 architecture parity score first defined in specs 056 and 058.

**Independent Test**: Cursor Composer 2.5 receives the C1-C9 rubric and the
post-PR #46 evidence summary, then produces criterion-by-criterion scoring with
explicit `verified`, `partial`, `cannot_verify`, and `not_assessed` states.

### User Story 2 - Preserve Runtime And Def/Ref Boundaries (Priority: P1)

A maintainer can tell whether runtime topology, full symbol/reference graph, and
enterprise code-intelligence parity are proven or still blocked.

**Independent Test**: The synthesis ledger rejects any claim that promotes
metadata-visible Compose/Helm/protobuf/static-symbol outputs to
runtime-visible topology or full def/ref coverage.

### User Story 3 - Decide Next Evidence Slice (Priority: P2)

A maintainer can choose the next implementation slice from the remaining proof
gaps rather than continuing producer expansion blindly.

**Independent Test**: The synthesis ledger names the strongest remaining
blockers and the next evidence that would be required to move them to verified.

## Requirements

- **FR-001**: The feature MUST reuse the existing C1-C9 parity rubric from
  spec 058 instead of inventing a new architecture benchmark.
- **FR-002**: The feature MUST include evidence from specs 059-068, including
  ctags, runtime absence/provisioner gates, Semgrep, def/ref feasibility,
  protobuf descriptors, Compose config, and Helm rendering.
- **FR-003**: The feature MUST run Cursor Agent `composer-2.5` in combination
  with Portolan evidence and record the prompt and output under this spec.
- **FR-004**: The feature MUST preserve `metadata-visible`,
  `runtime-visible`, `cannot_verify`, and `not_assessed` boundaries.
- **FR-005**: The feature MUST NOT start Bigtop services, contact Kubernetes,
  install Helm releases, mutate target repositories, or add network-dependent
  producers.
- **FR-006**: The feature MUST record whether the human/enterprise
  code-intelligence parity claim is verified, partial, blocked, or still
  unverified.
- **FR-007**: The feature MUST produce a review disposition with three assessed
  independent non-GPT review lanes or explicit degraded-lane replacements.

## Success Criteria

- **SC-001**: Cursor synthesis scores every C1-C9 criterion.
- **SC-002**: The synthesis ledger states exactly what changed after PR #46.
- **SC-003**: Runtime topology remains `cannot_verify` unless live
  runtime-visible evidence exists.
- **SC-004**: Enterprise parity remains unclaimed unless C4 runtime topology
  and C6 full symbol/reference graph are verified or explicitly excluded from a
  narrowed claim.
- **SC-005**: Local baseline checks pass before PR readiness.

## Out Of Scope

- Starting Bigtop runtime capture.
- Installing new symbol/reference indexers.
- Adding Portolan import code.
- Changing CLI behavior or schemas.
- Public marketing copy changes.

## Assumptions

- PR #46 is merged on `main` and is the base for this synthesis.
- The Bigtop landscape remains at
  `/home/fall_out_bug/projects/bigtop-landscape`.
- Cursor Composer 2.5 is the accepted stress client for this claim check.
