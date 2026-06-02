# Tasks: Syft Sharded SBOM Plan

**Input**: Design documents from
`docs/specs/082-syft-sharded-sbom-plan/`

## Phase 1: Setup And Review

- [x] T001 Create dedicated branch/worktree for spec 082.
- [x] T002 Create concrete `spec.md`, `plan.md`, `research.md`, and `tasks.md`.
- [x] T003 Update `.specify/feature.json`, `AGENTS.md`, and
  `docs/product-backlog.md` for spec 082.
- [x] T004 Record requirements/product-vision drift review.

## Phase 2: US1 - Repository-Sharded Syft Next Actions

- [x] T005 Add focused failing test for multi-repo Syft command output.
- [x] T006 Generate repository-sharded Syft/CycloneDX commands.
- [x] T007 Keep Syft execution approval-gated and evidence `not_assessed`.

## Phase 3: Stress And Evidence

- [x] T008 Run fresh Bigtop context smoke.
- [x] T009 Run Cursor Composer 2.5 bounded stress.
- [x] T010 Record smoke/stress evidence under `reviews/`.

## Final Phase: Verification And PR Readiness

- [x] T011 Run `go test ./internal/contextprep`.
- [x] T012 Run `go test ./...`.
- [x] T013 Run `go vet ./...`.
- [x] T014 Run `jq empty schema/*.json`.
- [x] T015 Run `git diff --check`.
- [x] T016 Run independent review lanes or record degraded/not_assessed lanes.
- [ ] T017 Commit, push, create PR, and refresh check state.
