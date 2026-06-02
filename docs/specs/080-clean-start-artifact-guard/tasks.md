# Tasks: Clean Start Artifact Guard

**Input**: Design documents from
`docs/specs/080-clean-start-artifact-guard/`

## Phase 1: Setup And Review Surface

- [x] T001 Create dedicated branch/worktree for spec 080.
- [x] T002 Create concrete `spec.md`, `plan.md`, `research.md`, `quickstart.md`, and `tasks.md`.
- [x] T003 Update `.specify/feature.json`, `AGENTS.md`, and `docs/product-backlog.md` for spec 080.
- [x] T004 Record requirements/product-vision drift review under `docs/specs/080-clean-start-artifact-guard/reviews/`.

## Phase 2: US1 - Current Context Boundary

**Goal**: Generated context guidance names the current context output and stale
artifact exclusions.

**Independent Test**: `go test ./internal/contextprep` verifies the generated
brief, contract, and query plan.

- [x] T005 [US1] Add focused contextprep test in `internal/contextprep/contextprep_test.go`.
- [x] T006 [US1] Update generated `agent-brief.md` guidance in `internal/contextprep/contextprep.go`.
- [x] T007 [US1] Update generated `answer-contract.md` guidance in `internal/contextprep/contextprep.go`.
- [x] T008 [US1] Update generated `query-plan.md` guidance in `internal/contextprep/contextprep.go`.

## Phase 3: US2 - Honest Contamination Handling

**Goal**: Acceptance guidance classifies forbidden artifact reads as
contaminated, non-counting evidence.

**Independent Test**: Inspect `docs/agent/ACCEPTANCE.md` and generated context
artifacts for the contamination rule.

- [x] T009 [US2] Update clean-start lane rules in `docs/agent/ACCEPTANCE.md`.
- [x] T010 [US2] Run fresh Bigtop context smoke into a new `.portolan/stress` directory.
- [x] T011 [US2] Record Bigtop smoke and artifact residue evidence under `docs/specs/080-clean-start-artifact-guard/reviews/`.

## Phase 4: Review And PR Closeout

- [x] T012 Run local baseline checks: `go test ./internal/contextprep`, `go test ./...`, `go vet ./...`, `jq empty schema/*.json`, `git diff --check`.
- [x] T013 Run three assessed independent non-GPT review lanes or record degraded lanes and replacements.
- [x] T014 Record review disposition and PR readiness closeout under `docs/specs/080-clean-start-artifact-guard/reviews/`.
- [x] T015 Commit, push, create PR, and refresh GitHub check state.

## Phase 5: Cursor Composer Clean-Start Stress Feedback

- [x] T016 Run headless Cursor Agent Composer 2.5 against the fresh Bigtop
  context pack without allowing sibling stress roots or root-level generated
  artifacts.
- [x] T017 [US1] Downgrade and scrub stale sibling `.portolan/stress/*`
  producer-run outputs so they cannot appear as current verified evidence in a
  fresh stress context.
- [x] T018 [US1] Update producer-run coverage summary text to count current
  `verified` and `not_assessed` statuses from `evidence-index.jsonl`.
- [x] T019 Record Cursor stress evidence, accepted findings, fixes, and final
  pass under `docs/specs/080-clean-start-artifact-guard/reviews/`.
- [x] T020 Refresh local baseline checks, PR review evidence, push the updated
  branch, and refresh GitHub check state.

## Dependencies & Execution Order

- T003-T004 before implementation.
- T005 before T006-T008.
- T010 after code changes.
- T012-T015 after the first implementation tasks.
- T020 after Cursor Composer stress fixes.

## Implementation Strategy

Keep the change local-first and read-only. Do not add cleanup commands, schema
changes, target mutation, network access, daemon behavior, or dependencies.
Stale producer-run metadata may be normalized into `not_assessed` records, but
must not delete the source ledger or prior stress artifacts.
