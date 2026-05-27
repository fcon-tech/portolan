# Tasks: Runtime Security Boundary

**Input**: Design documents from `specs/044-runtime-security-boundary/`

**Tests**: Required for runtime fixture validation and secret/path safety.

## Phase 1: Setup

- [x] T001 Create pre-implementation review in `specs/044-runtime-security-boundary/reviews/requirements-product-vision-drift-2026-05-27.md`
- [x] T002 Record analyze disposition in `specs/044-runtime-security-boundary/reviews/analyze-disposition-2026-05-27.md`

## Phase 2: Foundational

- [x] T003 Add runtime observation contract docs in `docs/runtime-observations.md`
- [x] T004 Add product-specific threat model in `docs/security-threat-model.md`

## Phase 3: User Story 1 - Supply Runtime Observations Safely (Priority: P1)

- [x] T005 [US1] Add sample runtime observation fixture under `internal/app/testdata/`
- [x] T006 [US1] Add focused validation or import test for runtime observation handling
- [x] T007 [US1] Verify partial runtime coverage does not become complete topology

## Phase 4: User Story 2 - Protect Against Untrusted Artifact Input (Priority: P1)

- [x] T008 [US2] Add threat records for prompt injection, path traversal, secret leakage, query/MCP exposure, and stale evidence
- [x] T009 [US2] Add or update focused tests proving secret values are not emitted in config outputs
- [x] T010 [US2] Add or update focused tests for output path boundary behavior if existing tests are insufficient

## Phase 5: User Story 3 - Keep Product Claims In Sync (Priority: P2)

- [x] T011 [US3] Update `docs/product-claims.md` only to the verified runtime/security scope
- [x] T012 [US3] Update `README.md` boundaries if runtime/security wording changes

## Phase 6: Review And Closeout

- [x] T013 Run `go test -count=1 ./...`
- [x] T014 Run `jq empty schema/*.json`
- [x] T015 Run `git diff --check`
- [x] T016 Run independent review lanes and record `slice-review-disposition-2026-05-27.md`
- [x] T017 Update spec, task ledger, and P5-044 backlog status
- [x] T018 Prepare PR readiness closeout
