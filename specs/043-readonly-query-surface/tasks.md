# Tasks: Readonly Query Surface

**Input**: Design documents from `specs/043-readonly-query-surface/`

**Tests**: Required for CLI behavior and output contracts.

## Phase 1: Setup

- [x] T001 Create pre-implementation review in `specs/043-readonly-query-surface/reviews/requirements-product-vision-drift-2026-05-27.md`
- [x] T002 Record analyze disposition in `specs/043-readonly-query-surface/reviews/analyze-disposition-2026-05-27.md`

## Phase 2: Foundational

- [x] T003 Add failing query contract tests in `internal/query/query_test.go`
- [x] T004 Add app-level CLI test coverage in `internal/app/app_test.go`

## Phase 3: User Story 1 - Query Evidence For A Bundle (Priority: P1)

- [x] T005 [US1] Implement bounded finding query logic in `internal/query/`
- [x] T006 [US1] Wire `portolan query findings` in `cmd/portolan/main.go` and `internal/app/`
- [x] T007 [US1] Run finding query smoke from `quickstart.md`

## Phase 4: User Story 2 - Ask Why A Surface Is Unknown (Priority: P1)

- [x] T008 [US2] Implement gap/coverage weak-state query logic in `internal/query/`
- [x] T009 [US2] Wire `portolan query gaps` in `cmd/portolan/main.go` and `internal/app/`
- [x] T010 [US2] Verify weak records include reason and artifact reference

## Phase 5: User Story 3 - Provide Stable Agent References (Priority: P2)

- [x] T011 [US3] Add `portolan://` reference fields to query results
- [x] T012 [US3] Document query usage in `docs/agent/QUICKSTART.md`
- [x] T013 [US3] Update `README.md` command list if command shape is final

## Phase 6: Review And Closeout

- [x] T014 Run `go test -count=1 ./...`
- [x] T015 Run `jq empty schema/*.json`
- [x] T016 Run `git diff --check`
- [x] T017 Run independent review lanes and record `slice-review-disposition-2026-05-27.md`
- [x] T018 Update spec, task ledger, and P5-043 backlog status
- [x] T019 Prepare PR readiness closeout
