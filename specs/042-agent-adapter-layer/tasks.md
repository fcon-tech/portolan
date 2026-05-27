# Tasks: Agent Adapter Layer

**Input**: Design documents from `specs/042-agent-adapter-layer/`

**Tests**: Required for adapter fixtures and evidence-state mapping.

## Phase 1: Setup

- [x] T001 Create pre-implementation review in `specs/042-agent-adapter-layer/reviews/requirements-product-vision-drift-2026-05-27.md`
- [x] T002 Record analyze disposition in `specs/042-agent-adapter-layer/reviews/analyze-disposition-2026-05-27.md`

## Phase 2: Foundational

- [x] T003 Create first-wave candidate ledger in `specs/042-agent-adapter-layer/reviews/oss-candidate-ledger-2026-05-27.md`
- [x] T004 Define Graphify supported subset in `docs/adapter-contracts/graphify-profile.md`

## Phase 3: User Story 1 - Evaluate First-Wave OSS Inputs (Priority: P1)

- [x] T005 [US1] Evaluate Graphify license, maintenance, privacy, and adapter cost
- [x] T006 [US1] Evaluate SCIP/Serena-style symbol index fit
- [x] T007 [US1] Evaluate Repomix context pack fit

## Phase 4: User Story 2 - Normalize A Graphify-Like Output (Priority: P1)

- [x] T008 [US2] Add Graphify-style fixture in `testdata/oss-adapter-contract/graphify-minimal.json`
- [x] T009 [US2] Add focused adapter validation test for Graphify confidence mapping
- [x] T010 [US2] Implement the minimal Graphify adapter/profile behavior in `internal/adapter/`
- [x] T011 [US2] Run `go test -count=1 ./internal/adapter ./internal/app`

## Phase 5: User Story 3 - Publish Adapter Profiles For Symbol And Context Tools (Priority: P2)

- [x] T012 [US3] Add symbol-index profile documentation in `docs/adapter-contracts/symbol-index-profile.md`
- [x] T013 [US3] Add Repomix profile documentation in `docs/adapter-contracts/repomix-profile.md`
- [x] T014 [US3] Update `docs/oss-composition.md` with first-wave decisions

## Phase 6: Review And Closeout

- [x] T015 Run baseline checks
- [x] T016 Run independent review lanes and record `slice-review-disposition-2026-05-27.md`
- [x] T017 Update spec, task ledger, product claims if supported, and P5-042 backlog status
- [x] T018 Prepare PR readiness closeout
