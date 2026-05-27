# Tasks: Bounded jscpd Profile

**Input**: Design documents from `specs/039-bounded-jscpd-profile/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/bounded-jscpd-profile.md`, `quickstart.md`

**Tests**: Behavior changes require focused tests before implementation.
Documentation-only status changes are verified through review artifacts and
baseline checks.

**Organization**: Tasks are grouped by user story so bounded producer execution
and product claim updates can be reviewed independently.

## Phase 1: Setup And Reconstruction

**Purpose**: Establish current truth before changing producer behavior or
claims.

- [x] T001 Create `specs/039-bounded-jscpd-profile/reviews/status-reconstruction-2026-05-27.md`.
- [x] T002 [P] Record requirements/product-vision drift review in `specs/039-bounded-jscpd-profile/reviews/requirements-product-vision-drift-2026-05-27.md`.
- [x] T003 [P] Record analyze findings and disposition in `specs/039-bounded-jscpd-profile/reviews/analyze-disposition-2026-05-27.md`.
- [x] T004 [P] Inventory current jscpd and near-clone evidence from `specs/035-oss-producer-acceptance/reviews/`, `specs/038-product-claim-gate/reviews/`, and `docs/product-claims.md`.

## Phase 2: Foundational Bounded Profile

**Purpose**: Define the safe execution shape before running or parsing
producer output.

- [x] T005 Define the bounded `jscpd` profile and result-state ledger format in `specs/039-bounded-jscpd-profile/reviews/bounded-jscpd-profile-2026-05-27.md`.
- [x] T006 Add focused tests for bounded profile result-state handling in the relevant `internal/...` package.
- [x] T007 Implement bounded profile/result-state handling in the relevant `internal/...` package without adding network access or target mutation.
- [x] T008 Run focused package tests for the changed `internal/...` package and record results in `specs/039-bounded-jscpd-profile/reviews/verification-2026-05-27.md`.

**Checkpoint**: The profile can represent verified, failed, blocked, and
not_assessed attempts without accepting partial output.

## Phase 3: User Story 1 - Bound Near-Clone Producer Execution (Priority: P1)

**Goal**: Produce or explicitly fail/block/not_assess bounded `jscpd` evidence.

**Independent Test**: Run the bounded profile against a fixture or fixed local
Bigtop target and inspect the producer ledger.

- [x] T009 [US1] Add or update fixture coverage for usable and malformed `jscpd` JSON under `testdata/`.
- [x] T010 [US1] Run the bounded `jscpd` profile against the selected local target or fixture and record raw evidence or blocker in `specs/039-bounded-jscpd-profile/reviews/jscpd-run-2026-05-27.md`.
- [x] T011 [US1] Normalize or surface bounded `jscpd` output through the existing context/tool-output path.
- [x] T012 [US1] Record producer attempt disposition in `specs/039-bounded-jscpd-profile/reviews/producer-attempt-ledger-2026-05-27.md`.

**Checkpoint**: Near-clone producer evidence has an explicit state and scope.

## Phase 4: User Story 2 - Preserve Product Claim Honesty (Priority: P1)

**Goal**: Update product claims only to the validated bounded scope.

**Independent Test**: Inspect product claims and verify every near-clone
positive statement cites verified bounded evidence.

- [x] T013 [US2] Update `docs/product-claims.md` to reflect bounded `jscpd` evidence or preserve the limitation.
- [x] T014 [US2] Update `docs/product-backlog.md` and `specs/039-bounded-jscpd-profile/spec.md` status to match implementation state.
- [x] T015 [US2] Record implementation disposition in `specs/039-bounded-jscpd-profile/reviews/implementation-disposition-2026-05-27.md`.

**Checkpoint**: Product claim boundary and producer evidence agree.

## Phase 5: Review, Verification, And PR Readiness

**Purpose**: Complete repo-local review and PR readiness without merging.

- [x] T016 Run `go test -count=1 ./...`, `jq empty schema/*.json`, and `git diff --check`; append results to `specs/039-bounded-jscpd-profile/reviews/verification-2026-05-27.md`.
- [x] T017 Run independent review lanes and record raw outputs/disposition under `specs/039-bounded-jscpd-profile/reviews/`.
- [x] T018 Fix accepted review findings and rerun focused verification.
- [x] T019 Create or update the PR, run PR review cycle, and record readiness closeout in `specs/039-bounded-jscpd-profile/reviews/pr-readiness-closeout-2026-05-27.md`.

## Dependencies & Execution Order

- Phase 1 blocks implementation.
- Phase 2 depends on Phase 1 and blocks producer execution.
- US1 depends on Phase 2.
- US2 depends on US1.
- Phase 5 depends on US1 and US2.

## Parallel Opportunities

- T002-T004 can run in parallel after T001.
- Review lanes in T017 can run in parallel after local verification.

## Implementation Strategy

1. Reconstruct existing jscpd failure and product claim boundaries.
2. Define bounded execution and result states before running the producer.
3. Run or explicitly block the bounded profile.
4. Update claims only to the proven scope.
5. Complete review, verification, PR readiness, and stop before merge approval.
