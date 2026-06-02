# Tasks: jscpd Sharded Duplication Plan

**Input**: Design documents from
`docs/specs/079-jscpd-sharded-duplication-plan/`

## Phase 1: Setup And Review

- [x] T001 Create dedicated branch/worktree for spec 079.
- [x] T002 Create concrete `spec.md`, `plan.md`, `research.md`, `quickstart.md`, and `tasks.md`.
- [x] T003 Update `.specify/feature.json`, `AGENTS.md`, and `docs/product-backlog.md` to point at spec 079.
- [x] T004 Record requirements/product-vision drift review.
- [x] T005 Record analyze/manual consistency disposition.

## Phase 2: US1 - Sharded jscpd Next Actions

- [x] T006 Add focused `internal/contextprep` test for multi-repo jscpd shard commands.
- [x] T007 Pass repositories into `buildOSSPlan`/`jscpdPlan`.
- [x] T008 Emit per-repository jscpd commands for multi-repo contexts.
- [x] T009 Preserve single-target jscpd behavior for single-repo contexts.

## Phase 3: US2 - Failure Discipline Guidance

- [x] T010 Update generated answer-contract/query-plan guidance for sharded jscpd and failed shards.
- [x] T011 Add focused assertions for guidance wording.

## Phase 4: US3 - Bigtop Smoke Recheck

- [x] T012 Run fresh Bigtop `context prepare` into a new `.portolan/stress` directory.
- [x] T013 Record smoke evidence in `reviews/bigtop-context-smoke-2026-06-02.md`.

## Final Phase: Verification And PR Readiness

- [x] T014 Run `go test ./internal/contextprep`.
- [x] T015 Run `go test ./internal/app`.
- [x] T016 Run `go test ./...`.
- [x] T017 Run `go vet ./...`.
- [x] T018 Run `jq empty schema/*.json`.
- [x] T019 Run `git diff --check`.
- [x] T020 Update task ledger and status surfaces.
- [x] T021 Run three assessed independent non-GPT review lanes or record the exact blocker.
- [x] T022 Create/update PR and record PR readiness closeout.
