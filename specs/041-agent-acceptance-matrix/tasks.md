# Tasks: Agent Acceptance Matrix

**Input**: Design documents from `specs/041-agent-acceptance-matrix/`

**Tests**: Required for ledger consistency and at least one lane run or explicit blocker.

## Phase 1: Setup

- [x] T001 Create pre-implementation review in `specs/041-agent-acceptance-matrix/reviews/requirements-product-vision-drift-2026-05-27.md`
- [x] T002 Record analyze disposition in `specs/041-agent-acceptance-matrix/reviews/analyze-disposition-2026-05-27.md`

## Phase 2: Foundational

- [x] T003 Add acceptance matrix contract to `docs/agent/ACCEPTANCE.md`
- [x] T004 Add matrix fixture or ledger template under `specs/041-agent-acceptance-matrix/reviews/acceptance-matrix-2026-05-27.md`

## Phase 3: User Story 1 - Define A Reproducible Acceptance Matrix (Priority: P1)

- [x] T005 [US1] Define Codex, Cursor UI/Composer, and OpenCode planned lanes in `docs/agent/ACCEPTANCE.md`
- [x] T006 [US1] Define single-repo, multi-repo, and black-box/metadata-heavy target shapes in `docs/agent/ACCEPTANCE.md`
- [x] T007 [US1] Ensure every unrun lane is marked `not_assessed` with a reason

## Phase 4: User Story 2 - Run Acceptance Without Hidden Prompt Scaffolding (Priority: P1)

- [x] T008 [US2] Add blind acceptance prompt in `docs/agent/ACCEPTANCE.md`
- [x] T009 [US2] Execute or explicitly block one lane and record it under `specs/041-agent-acceptance-matrix/reviews/`
- [x] T010 [US2] Score unsupported claims and useful next actions for the executed or blocked lane

## Phase 5: User Story 3 - Keep Product Claims Narrow (Priority: P2)

- [x] T011 [US3] Compare lane evidence with `docs/product-claims.md`
- [x] T012 [US3] Update `docs/product-claims.md` only if the evidence supports a narrowed or accepted claim

## Phase 6: Review And Closeout

- [x] T013 Run baseline checks
- [x] T014 Run independent review lanes and record `slice-review-disposition-2026-05-27.md`
- [x] T015 Update task ledger, spec status, and P5-041 backlog status
- [x] T016 Prepare PR readiness closeout
