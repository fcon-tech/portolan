# Tasks: Cursor Comparison Validation

**Input**: Design documents from `specs/034-cursor-comparison-validation/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/comparison-ledger.md`, `quickstart.md`

**Tests**: This slice is a validation workflow, not a runtime behavior change.
Tasks include local command verification and ledger contract checks instead of
new Go tests unless implementation discovers a CLI behavior gap.

**Organization**: Tasks are grouped by the single P1 user story so the
comparison can be executed and reviewed as one independently testable product
validation increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files or only reads
  local artifacts.
- **[Story]**: Maps task to the user story from `spec.md`.
- Every task names the target file or artifact path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the spec-local review workspace and confirm the fixed
target and existing CLI surfaces before validation work starts.

- [ ] T001 Create `specs/034-cursor-comparison-validation/reviews/` for prompts, raw outputs, ledgers, and closeout artifacts.
- [ ] T002 Record fixed-target preconditions in `specs/034-cursor-comparison-validation/reviews/preconditions-2026-05-26.md` using `test -d /home/fall_out_bug/projects/bigtop-landscape` and readable-path checks.
- [ ] T003 [P] Record CLI surface checks in `specs/034-cursor-comparison-validation/reviews/cli-surface-2026-05-26.md` from `go run ./cmd/portolan context prepare --help`, `go run ./cmd/portolan map --help`, and `go run ./cmd/portolan graph slice --help`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the reusable comparison inputs and ledger scaffold required
before either lane can run.

**CRITICAL**: No lane execution should begin until this phase is complete.

- [ ] T004 Create the shared five-question prompt in `specs/034-cursor-comparison-validation/reviews/shared-five-question-prompt.md`.
- [ ] T005 [P] Create the Cursor-alone lane prompt in `specs/034-cursor-comparison-validation/reviews/cursor-alone-prompt.md` that forbids Portolan-generated artifacts.
- [ ] T006 [P] Create the Cursor-plus-Portolan lane prompt in `specs/034-cursor-comparison-validation/reviews/cursor-plus-portolan-prompt.md` that requires the context pack, `summary.json`, `graph-index.json`, and targeted slices only when needed.
- [ ] T007 Create the comparison ledger scaffold in `specs/034-cursor-comparison-validation/reviews/comparison-ledger-2026-05-26.md` using `specs/034-cursor-comparison-validation/contracts/comparison-ledger.md`.
- [ ] T008 Create the scoring rubric in `specs/034-cursor-comparison-validation/reviews/scoring-rubric-2026-05-26.md` covering unsupported claims, scope correctness, evidence use, unknown handling, and next action quality.

**Checkpoint**: Prompts, ledger scaffold, and scoring rubric are ready; lane
execution can start.

---

## Phase 3: User Story 1 - Compare Cursor Alone Against Cursor With Portolan (Priority: P1) MVP

**Goal**: Run both lanes against `/home/fall_out_bug/projects/bigtop-landscape`,
score the same five CTO questions with the same rubric, and publish the final
accepted/narrowed/rejected/blocked product-claim decision.

**Independent Test**: `specs/034-cursor-comparison-validation/reviews/comparison-ledger-2026-05-26.md`
contains two lane records, ten score records, unsupported-claim delta,
next-action pass rate, explicit `unknown`/`not_assessed` notes, and one final
decision that follows `contracts/comparison-ledger.md`.

### Implementation for User Story 1

- [ ] T009 [US1] Generate the Portolan context pack at `/tmp/portolan-034-bigtop-context` and record command output in `specs/034-cursor-comparison-validation/reviews/portolan-artifacts-2026-05-26.md`.
- [ ] T010 [US1] Generate the Portolan map bundle at `/tmp/portolan-034-bigtop-map` and record `summary.json`, `graph-index.json`, `coverage.json`, and artifact sizes in `specs/034-cursor-comparison-validation/reviews/portolan-artifacts-2026-05-26.md`.
- [ ] T011 [P] [US1] Run or explicitly block the Cursor-alone lane and save raw output to `specs/034-cursor-comparison-validation/reviews/cursor-alone-output.md`.
- [ ] T012 [P] [US1] Run or explicitly block the Cursor-plus-Portolan lane and save raw output to `specs/034-cursor-comparison-validation/reviews/cursor-plus-portolan-output.md`.
- [ ] T013 [US1] Add lane records with prompt paths, raw output paths, input artifacts, run states, and failure reasons to `specs/034-cursor-comparison-validation/reviews/comparison-ledger-2026-05-26.md`.
- [ ] T014 [US1] Score all five Cursor-alone answers in `specs/034-cursor-comparison-validation/reviews/comparison-ledger-2026-05-26.md` with unsupported-claim counts and evidence notes.
- [ ] T015 [US1] Score all five Cursor-plus-Portolan answers in `specs/034-cursor-comparison-validation/reviews/comparison-ledger-2026-05-26.md` with unsupported-claim counts and evidence notes.
- [ ] T016 [US1] Calculate unsupported-claim reduction and useful-next-action pass rate in `specs/034-cursor-comparison-validation/reviews/comparison-ledger-2026-05-26.md`.
- [ ] T017 [US1] Classify the final product claim as accepted, narrowed, rejected, blocked, or inconclusive in `specs/034-cursor-comparison-validation/reviews/comparison-ledger-2026-05-26.md`.
- [ ] T018 [US1] Update the product hypothesis result in `docs/product-backlog.md` and cross-reference `specs/034-cursor-comparison-validation/reviews/comparison-ledger-2026-05-26.md`.

**Checkpoint**: User Story 1 is independently complete when the ledger applies
the contract and the backlog points to the validation result.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Verify contracts, preserve evidence-state honesty, and prepare the
spec for review without claiming merge readiness.

- [ ] T019 [P] Validate ledger completeness against `specs/034-cursor-comparison-validation/contracts/comparison-ledger.md` and record the result in `specs/034-cursor-comparison-validation/reviews/ledger-contract-check-2026-05-26.md`.
- [ ] T020 [P] Run baseline checks `go test ./...`, `jq empty schema/*.json`, and `git diff --check`, then record verified/failed/not_assessed results in `specs/034-cursor-comparison-validation/reviews/verification-2026-05-26.md`.
- [ ] T021 Update `specs/034-cursor-comparison-validation/spec.md`, `specs/034-cursor-comparison-validation/tasks.md`, and `docs/product-backlog.md` so status, completed tasks, and validation outcome agree.
- [ ] T022 Create final implementation closeout in `specs/034-cursor-comparison-validation/reviews/implementation-disposition-2026-05-26.md` with verified, failed, blocked, and not_assessed surfaces.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks lane
  execution.
- **User Story 1 (Phase 3)**: Depends on Foundational completion.
- **Polish (Phase 4)**: Depends on User Story 1 ledger completion.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational. It has no dependency on
  other user stories because this spec has one user story.

### Within User Story 1

- T009 and T010 prepare Portolan artifacts before the assisted lane can be
  scored.
- T011 and T012 may run in parallel after prompts and artifacts are ready.
- T013 must wait for lane outputs or blocked lane records.
- T014 and T015 must complete before T016.
- T017 must wait for T016.
- T018 must wait for T017.

### Parallel Opportunities

- T003 can run after T001 while T002 records target preconditions.
- T005 and T006 can run in parallel after T004.
- T011 and T012 can run in parallel after T009 and T010 if both lane operators
  are available.
- T019 and T020 can run in parallel after the comparison ledger is complete.

---

## Parallel Example: User Story 1

```text
Task: "Run or explicitly block the Cursor-alone lane and save raw output to specs/034-cursor-comparison-validation/reviews/cursor-alone-output.md"
Task: "Run or explicitly block the Cursor-plus-Portolan lane and save raw output to specs/034-cursor-comparison-validation/reviews/cursor-plus-portolan-output.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup and Phase 2 prompt/ledger scaffolding.
2. Run Portolan artifact generation for the fixed Bigtop target.
3. Run both Cursor lanes or record exact blockers.
4. Score all five questions and classify the product claim.
5. Stop and review the ledger before changing any product messaging.

### Incremental Delivery

1. Preconditions and CLI surface evidence.
2. Prompts and ledger scaffold.
3. Portolan artifact generation.
4. Lane execution.
5. Scoring, decision, backlog/status alignment.

### Validation Discipline

- Do not substitute another target if Bigtop is absent; record `blocked`.
- Do not treat unavailable Cursor UI/Composer as green; record `not_assessed`.
- Do not treat safer but less useful output as accepted; apply the threshold
  rule.
- Do not load full `graph.json` into the assisted lane before bounded
  artifacts; record that as a workflow failure if it happens.
