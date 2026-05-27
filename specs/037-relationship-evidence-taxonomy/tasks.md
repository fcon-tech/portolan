# Tasks: Relationship Evidence Taxonomy

**Input**: Design documents from
`specs/037-relationship-evidence-taxonomy/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/relationship-taxonomy.md`, `quickstart.md`

**Tests**: This slice changes generated agent-facing wording and product docs,
not scanner behavior. Add focused Go coverage for the generated answer contract
before implementation edits.

**Organization**: Tasks are grouped by the single P1 user story so the taxonomy
can be delivered and reviewed as one independently testable increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files or only reads
  local artifacts.
- **[Story]**: Maps task to the user story from `spec.md`.
- Every task names the target file or artifact path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare spec-local review and confirm current behavior.

- [x] T001 Create `specs/037-relationship-evidence-taxonomy/reviews/`.
- [x] T002 [P] Record current relationship/evidence surfaces in `specs/037-relationship-evidence-taxonomy/reviews/status-reconstruction-2026-05-27.md`.
- [x] T003 [P] Record requirements/product-vision drift review in `specs/037-relationship-evidence-taxonomy/reviews/requirements-product-vision-drift-2026-05-27.md`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Lock the taxonomy contract before generated output changes.

- [x] T004 [P] Review `specs/037-relationship-evidence-taxonomy/contracts/relationship-taxonomy.md` against `docs/evidence-model.md` and `docs/relationship-detection.md`.
- [x] T005 Add focused generated-contract expectations to `internal/app/app_test.go`.

**Checkpoint**: Generated output expectations exist before implementation.

---

## Phase 3: User Story 1 - Explain Relationship Claims By Evidence Type (Priority: P1) MVP

**Goal**: A CTO or evaluator can distinguish source-visible dependencies,
metadata-declared service/API relationships, runtime-observed communication,
ownership, lifecycle, and claim-only/unknown surfaces in generated Portolan
guidance.

**Independent Test**: `go test -count=1 ./internal/app -run TestRunContextPrepareWritesCursorPack`
passes and verifies the generated `answer-contract.md` contains the taxonomy
and runtime-topology boundary.

### Implementation for User Story 1

- [x] T006 [US1] Add the plain-language relationship evidence taxonomy to `docs/evidence-model.md`.
- [x] T007 [US1] Update `docs/relationship-detection.md` so relationship kind, evidence type, and unsupported runtime/service topology boundaries are explicit.
- [x] T008 [US1] Update generated answer-contract wording in `internal/contextprep/contextprep.go`.
- [x] T009 [US1] Run the focused generated-contract test and record results in `specs/037-relationship-evidence-taxonomy/reviews/verification-2026-05-27.md`.

**Checkpoint**: User Story 1 is independently complete when generated guidance
names relationship kinds and refuses runtime topology without runtime-visible
evidence.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Align SpecKit state and prepare for review/PR work.

- [x] T010 [P] Run `go test ./...`, `jq empty schema/*.json`, and `git diff --check`, then record results in `specs/037-relationship-evidence-taxonomy/reviews/verification-2026-05-27.md`.
- [x] T011 Create slice review disposition in `specs/037-relationship-evidence-taxonomy/reviews/slice-review-disposition-2026-05-27.md`.
- [x] T012 Update `specs/037-relationship-evidence-taxonomy/spec.md`, `specs/037-relationship-evidence-taxonomy/tasks.md`, and `docs/product-backlog.md` so status and task state agree.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on setup and blocks implementation.
- **User Story 1 (Phase 3)**: Depends on focused test expectations.
- **Polish (Phase 4)**: Depends on User Story 1 completion.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational. It has no dependency on
  other stories because this spec has one user story.

### Parallel Opportunities

- T002 and T003 can run in parallel after T001.
- T004 can run in parallel with T005 because it reads docs while T005 changes
  tests.
- T010 can run after T009 while T011 draft evidence is prepared.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Create review evidence and drift review.
2. Add generated-contract test expectations.
3. Update docs and generated answer contract.
4. Verify focused and baseline checks.
5. Align task/spec/backlog status before PR review.
