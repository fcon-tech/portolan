# Tasks: Maven Sharded Producer Plan

**Input**: Design documents from
`docs/specs/081-maven-sharded-producer-plan/`

## Phase 1: Setup And Review

- [x] T001 Create dedicated branch/worktree for spec 081.
- [x] T002 Create concrete `spec.md`, `plan.md`, `research.md`, and `tasks.md`.
- [x] T003 Update `.specify/feature.json`, `AGENTS.md`, and
  `docs/product-backlog.md` for spec 081.
- [x] T004 Record requirements/product-vision drift review.

## Phase 2: US1 - Repository-Sharded Maven Next Actions

**Goal**: Multi-repo Maven landscapes get one approval-gated command per
retained Maven repository.

**Independent Test**: `go test ./internal/contextprep` verifies two Maven
repositories produce two commands under `tool-outputs/maven-cyclonedx/`.

- [x] T005 [US1] Add focused failing test for multi-repo Maven command output.
- [x] T006 [US1] Retain Maven manifest surfaces by repository.
- [x] T007 [US1] Generate repository-sharded Maven/CycloneDX commands.

## Phase 3: US2 - Stress And Evidence

- [x] T008 Run fresh Bigtop context smoke for spec 081.
- [x] T009 Run Cursor Composer 2.5 bounded stress against the fresh context.
- [x] T010 Record smoke/stress evidence under `reviews/`.

## Final Phase: Verification And PR Readiness

- [x] T011 Run `go test ./internal/contextprep`.
- [x] T012 Run `go test ./...`.
- [x] T013 Run `go vet ./...`.
- [x] T014 Run `jq empty schema/*.json`.
- [x] T015 Run `git diff --check`.
- [x] T016 Run independent review lanes or record degraded/not_assessed lanes.
- [x] T017 Commit, push, create PR, and refresh check state.
