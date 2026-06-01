# Feature Specification: Bigtop Runtime, Symbol, And Parity Proof

**Feature Branch**: `codex/058-bigtop-runtime-symbol-parity-proof`

**Created**: 2026-06-02

**Status**: Planning

**Input**: User objective: "доводя до verified: Portolan понимает архитектуру
Bigtop как человек или enterprise code intelligence (обязательно в комбинации с
Cursor), runtime topology, реальные symbol/API/catalog/model/runtime producer
outputs beyond Syft/CycloneDX."

## User Scenarios & Testing

### User Story 1 - Runtime Topology Proof Or Explicit Blocker (Priority: P1)

A maintainer can determine whether a safe local Bigtop runtime observation export
exists and either import/ledger it as `runtime-visible` or record why runtime
topology remains `not_assessed` or `cannot_verify`.

**Independent Test**: A runtime topology ledger entry records command/source,
scope, evidence state, output path or blocker, and why static deployment
evidence was not promoted to runtime topology.

### User Story 2 - Full Symbol/Reference Producer Proof Or Explicit Blocker (Priority: P1)

A maintainer can determine whether a safe full symbol/reference producer exists
for selected Bigtop repos and either generate/ledger it or record why the full
graph remains `not_assessed` or `cannot_verify`.

**Independent Test**: A symbol/reference ledger entry records the selected
producer, coverage target, output validation, and whether the output contains
definitions only, references, or cross-repo edges.

### User Story 3 - Cursor Plus Portolan Parity Rubric (Priority: P2)

A reviewer can compare Cursor alone and Cursor plus Portolan against concrete
human/enterprise code-intelligence criteria without relying on vague parity
language.

**Independent Test**: A rubric defines required capabilities, evidence needed,
accepted partial states, and claims that remain forbidden. Cursor stress uses the
rubric and preserves unsupported states.

## Requirements

- **FR-001**: The feature MUST preserve local-first and read-only defaults.
- **FR-002**: The feature MUST NOT start Bigtop services, mutate target repos,
  enable telemetry, use credentials, or resolve remote rule/index packs unless a
  later explicit design approval is recorded.
- **FR-003**: Runtime topology MUST be `runtime-visible` only when backed by an
  explicit local runtime observation export such as process, endpoint, service,
  container, or orchestrator state captured from a Bigtop runtime.
- **FR-004**: Static Docker Compose, Helm, protobuf, duplication, or symbol-list
  outputs MUST NOT be promoted to runtime topology.
- **FR-005**: Full symbol/reference MUST remain `not_assessed` unless a producer
  output contains sufficient definition/reference coverage for the selected
  Bigtop scope.
- **FR-006**: The parity rubric MUST define concrete criteria for "human or
  enterprise code intelligence" before any stronger architecture-understanding
  claim is made.
- **FR-007**: Cursor stress MUST compare Cursor-only and Cursor-plus-Portolan
  answers against the same rubric and mark unsupported criteria as
  `not_assessed`, `cannot_verify`, or partial.

## Success Criteria

- **SC-001**: Runtime topology is either verified as `runtime-visible` for a
  bounded Bigtop runtime scope or explicitly remains `not_assessed` /
  `cannot_verify` with local evidence.
- **SC-002**: Full symbol/reference coverage is either verified for a bounded
  Bigtop scope or explicitly remains `not_assessed` / `cannot_verify` with local
  evidence.
- **SC-003**: A concrete parity rubric exists and is used in Cursor stress.
- **SC-004**: No artifact claims complete Bigtop architecture understanding,
  runtime topology, or enterprise code-intelligence parity unless the rubric and
  producer evidence support it.

## Assumptions

- The Bigtop landscape remains under
  `/home/fall_out_bug/projects/bigtop-landscape`.
- Current PR #35 closeout state is authoritative until superseded:
  runtime topology, full symbol/reference graph, and enterprise-intelligence
  parity are all `not_assessed`.
- Existing installed tools may be enough to test some symbol surfaces, but
  runtime-visible topology may require an approved export that is not currently
  present.
