# Tasks: Real Producer Output Proof

**Input**: Design documents from `docs/specs/054-real-producer-output-proof/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/producer-run-record.md`, `quickstart.md`

**Tests**: Required before behavior changes because this slice changes agent
evidence semantics and context/map contracts.

**Organization**: Tasks are grouped by user story so each increment is
independently testable.

## Phase 1: Setup

**Purpose**: Confirm the feature surface and fixture shape before code changes.

- [x] T001 Confirm `.specify/feature.json` points to `docs/specs/054-real-producer-output-proof`
- [x] T002 [P] Add producer-run fixture files under `internal/testfixtures/real-producer-output-proof/`
- [x] T003 [P] Add malformed/unsafe producer-run fixture files under `internal/testfixtures/real-producer-output-proof/`

---

## Phase 2: Foundational

**Purpose**: Shared validation and data-contract support required by all user stories.

- [x] T004 Add focused tests for producer-run record validation in `internal/producerfamily/producer_run_test.go`
- [x] T005 Implement producer-run record types and validation in `internal/producerfamily/producer_run.go`
- [x] T006 Add schema or schema-adjacent validation coverage for producer-run JSONL in `schema/` or `internal/producerfamily/producer_run_test.go`
- [x] T007 Update docs/specs/054-real-producer-output-proof/reviews/ with a pre-implementation requirements/product-vision drift review

**Checkpoint**: Producer-run records can be validated independently without context/map integration.

---

## Phase 3: User Story 1 - Acquire Real Local Producer Outputs (Priority: P1) MVP

**Goal**: Portolan records real producer-output attempts with source, scope,
freshness, evidence state, and failure/blocking reasons.

**Independent Test**: Validate fixture records for Docker Compose, Helm,
protobuf descriptor, missing symbol-index, and absent runtime observation.

### Tests for User Story 1

- [x] T008 [P] [US1] Add app-level test for producer-run record loading in `internal/app/app_test.go`
- [x] T009 [P] [US1] Add negative tests for `runtime-visible` on non-runtime producer families in `internal/producerfamily/producer_run_test.go`
- [x] T010 [P] [US1] Add negative tests for verified records with missing output path or empty scope in `internal/producerfamily/producer_run_test.go`

### Implementation for User Story 1

- [x] T011 [US1] Add producer-run input discovery for selected local JSONL files in `internal/contextprep/`
- [x] T012 [US1] Surface verified/failed/blocked producer-run records in `tool-registry.json` or a bounded companion context artifact from `internal/contextprep/`
- [x] T013 [US1] Preserve unavailable symbol-index and runtime-observation families as `not_assessed` in `gaps.jsonl`
- [x] T014 [US1] Run fresh Bigtop context smoke using `20260601-054-initial-proof` outputs and record evidence under `docs/specs/054-real-producer-output-proof/reviews/`

**Checkpoint**: User Story 1 is independently complete when real producer-run
metadata appears in a fresh context pack and weak families remain weak.

---

## Phase 4: User Story 2 - Normalize Outputs Without Owning Scanners (Priority: P2)

**Goal**: Agents can consume acquired producer outputs through Portolan context
without Portolan becoming a producer execution wrapper or language scanner.

**Independent Test**: Generate a context pack and map bundle that reference the
new producer-run metadata and prove static API/model outputs do not become
runtime topology.

### Tests for User Story 2

- [x] T015 [P] [US2] Add context output test that static deployment/API records stay `metadata-visible` in `internal/app/app_test.go`
- [x] T016 [P] [US2] Add map/context test that runtime topology remains `not_assessed` without runtime-observation records in `internal/app/app_test.go`

### Implementation for User Story 2

- [x] T017 [US2] Add bounded producer coverage summary for producer-run records in `internal/contextprep/`
- [x] T018 [US2] Add agent-brief/answer-contract wording for producer-run outputs and their limitations in `internal/contextprep/`
- [x] T019 [US2] Ensure no `portolan produce ...` command or producer execution wrapper is introduced by searching code/docs and recording evidence
- [x] T020 [US2] Run fresh Bigtop context/map smoke and record whether Compose/Helm/protoc outputs improve coverage without runtime overclaiming

**Checkpoint**: User Story 2 is complete when context/map artifacts can route
agents to real producer outputs while preserving evidence-state boundaries.

---

## Phase 5: User Story 3 - Stress Cursor With Real Outputs (Priority: P3)

**Goal**: Cursor + Composer 2.5 uses the refreshed Portolan bundle and either
improves scoped Bigtop architecture answers or produces recorded gaps.

**Independent Test**: Run headless Cursor + Composer 2.5 with the fresh bundle
and compare against the Syft/CycloneDX-only baseline from prior stress runs.

### Tests for User Story 3

- [x] T021 [P] [US3] Add review packet for Cursor stress prompt and expected evidence boundaries in `docs/specs/054-real-producer-output-proof/reviews/`

### Implementation for User Story 3

- [x] T022 [US3] Run headless Cursor + Composer 2.5 on the fresh 054 bundle and save prompt/output under the Bigtop stress directory
- [x] T023 [US3] Review Cursor output for supported claims, overclaims, and remaining gaps in `docs/specs/054-real-producer-output-proof/reviews/`
- [x] T024 [US3] Update spec/backlog status to reflect verified, failed, blocked, and `not_assessed` evidence states

**Checkpoint**: User Story 3 is complete when Cursor stress evidence is
reviewed and the result is recorded without broadening architecture claims.

---

## Final Phase: PR Readiness

**Purpose**: Bring the implementation to a reviewable PR state.

- [ ] T025 Run full local verification: `go test -count=1 ./...`, `go vet ./...`, `jq empty schema/*.json`, `git diff --check`
- [ ] T026 Run independent review lanes and record disposition under `docs/specs/054-real-producer-output-proof/reviews/`
- [ ] T027 Update `docs/product-backlog.md`, `spec.md`, and `tasks.md` to match actual implementation state
- [ ] T028 Create or update PR and record PR readiness closeout for spec 054

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 has no dependencies.
- Phase 2 depends on Phase 1 and blocks all user stories.
- US1 is the MVP and must complete before US2.
- US2 must complete before US3 because Cursor must consume refreshed artifacts.
- PR readiness depends on all implemented user stories and review disposition.

### Parallel Opportunities

- T002 and T003 can run in parallel.
- T008, T009, and T010 can run in parallel after Phase 2 starts.
- T015 and T016 can run in parallel after US1.
- T021 can be prepared while US2 Bigtop smoke runs, but Cursor execution waits
  for refreshed artifacts.

## Implementation Strategy

1. Deliver US1 first: validate and surface producer-run metadata.
2. Stop and verify Bigtop context evidence before adding broader context/map
   summaries.
3. Deliver US2 only after evidence-state boundaries hold locally.
4. Run Cursor stress only after fresh artifacts exist.
5. Do not claim Bigtop architecture understanding, runtime topology, or
   enterprise code-intelligence parity from this spec alone.
