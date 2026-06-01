# Tasks: Product Claim Gate

**Input**: Design documents from `docs/specs/038-product-claim-gate/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/product-claim-ledger.md`, `quickstart.md`

**Tests**: Documentation-first slice. Run repository baseline checks and
contract inspection; add focused Go tests only if implementation discovers a
CLI/schema behavior change.

**Organization**: Tasks are grouped by user story so the claim ledger and
client-safe answer can be reviewed independently.

## Phase 1: Setup And Reconstruction

**Purpose**: Establish review workspace and current truth before claim
classification.

- [x] T001 Create `docs/specs/038-product-claim-gate/reviews/`.
- [x] T002 [P] Record status reconstruction in `docs/specs/038-product-claim-gate/reviews/status-reconstruction-2026-05-27.md`.
- [x] T003 [P] Record requirements/product-vision drift review in `docs/specs/038-product-claim-gate/reviews/requirements-product-vision-drift-2026-05-27.md`.
- [x] T004 [P] Record analyze findings and disposition in `docs/specs/038-product-claim-gate/reviews/analyze-disposition-2026-05-27.md`.

## Phase 2: Foundational Claim Sources

**Purpose**: Collect the local evidence surfaces that all claim decisions depend
on.

- [x] T005 [P] Inventory candidate claims from `docs/mvp.md`, `docs/product-boundary.md`, and `docs/product-backlog.md`.
- [x] T006 [P] Inventory validation evidence from `docs/specs/034-cursor-comparison-validation/reviews/`.
- [x] T007 [P] Inventory OSS producer and scope evidence from `docs/specs/035-oss-producer-acceptance/reviews/` and `docs/specs/036-scope-completeness-validation/reviews/`.
- [x] T008 [P] Inventory relationship taxonomy evidence from `docs/specs/037-relationship-evidence-taxonomy/reviews/`.

**Checkpoint**: Candidate claims and evidence sources are known before status
decisions.

## Phase 3: User Story 1 - Gate Public Claims With Evidence (Priority: P1)

**Goal**: A product owner can accept, narrow, reject, block, fail, or mark each
current claim `not_assessed` based on validation evidence.

**Independent Test**: Inspect the claim ledger and verify every accepted or
narrowed claim cites local evidence, while unproven claims are not positive
client-safe claims.

- [x] T009 [US1] Create `docs/specs/038-product-claim-gate/reviews/product-claim-ledger-2026-05-27.md` using the contract in `docs/specs/038-product-claim-gate/contracts/product-claim-ledger.md`.
- [x] T010 [US1] Classify Cursor comparison claims in `docs/specs/038-product-claim-gate/reviews/product-claim-ledger-2026-05-27.md`.
- [x] T011 [US1] Classify OSS producer, completeness, runtime, and relationship claims in `docs/specs/038-product-claim-gate/reviews/product-claim-ledger-2026-05-27.md`.
- [x] T012 [US1] Record backlog actions for rejected, blocked, failed, or material `not_assessed` claims in `docs/specs/038-product-claim-gate/reviews/product-claim-ledger-2026-05-27.md`.

**Checkpoint**: User Story 1 is complete when all current claims have a status,
evidence, and backlog action.

## Phase 4: User Story 2 - Produce A Client-Safe Answer (Priority: P1)

**Goal**: A consultant can answer "Why Portolan if we already have Cursor?"
using only accepted or narrowed claims and explicit limitations.

**Independent Test**: Inspect the answer and verify every positive sentence maps
to an accepted or narrowed claim ID from the ledger.

- [x] T013 [US2] Create `docs/specs/038-product-claim-gate/reviews/client-safe-answer-2026-05-27.md` from accepted and narrowed ledger claims.
- [x] T014 [US2] Include material limitations for UI Cursor/Composer, full ecosystem completeness, runtime topology, near-clone/SBOM duplication, and OSS producer execution in `docs/specs/038-product-claim-gate/reviews/client-safe-answer-2026-05-27.md`.
- [x] T015 [US2] Cross-check every positive sentence in `docs/specs/038-product-claim-gate/reviews/client-safe-answer-2026-05-27.md` against claim IDs in `docs/specs/038-product-claim-gate/reviews/product-claim-ledger-2026-05-27.md`.

**Checkpoint**: User Story 2 is complete when the answer is traceable to the
ledger and does not hide limitations.

## Phase 5: Verification, Review, And Status

**Purpose**: Align SpecKit surfaces and prepare PR review.

- [x] T016 Run `go test -count=1 ./...`, `jq empty schema/*.json`, and `git diff --check`; record results in `docs/specs/038-product-claim-gate/reviews/verification-2026-05-27.md`.
- [x] T017 Run independent review lanes and record raw outputs/disposition under `docs/specs/038-product-claim-gate/reviews/`.
- [x] T018 Update `docs/specs/038-product-claim-gate/spec.md`, `docs/specs/038-product-claim-gate/tasks.md`, `docs/product-claims.md`, and `docs/product-backlog.md` so implementation state agrees.
- [x] T019 Record implementation disposition in `docs/specs/038-product-claim-gate/reviews/implementation-disposition-2026-05-27.md`.
- [x] T020 Create or update the PR, run PR review cycle, and record readiness closeout in `docs/specs/038-product-claim-gate/reviews/pr-readiness-closeout-2026-05-27.md`.

## Dependencies & Execution Order

- Phase 1 blocks implementation.
- Phase 2 depends on Phase 1 and blocks claim decisions.
- US1 depends on Phase 2.
- US2 depends on US1.
- Phase 5 depends on US1 and US2.

## Parallel Opportunities

- T002-T004 can run in parallel after T001.
- T005-T008 can run in parallel after Phase 1.
- Independent review lanes in T017 can run in parallel after local
  verification.

## Implementation Strategy

1. Complete setup, reconstruction, analyze disposition, and product drift
   review.
2. Build the claim ledger first; it is the MVP.
3. Generate the client-safe answer only from the ledger.
4. Verify, run independent review, align status, and prepare PR readiness.
