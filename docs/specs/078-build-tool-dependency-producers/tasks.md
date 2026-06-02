# Tasks: Build Tool Dependency Producers

**Input**: Design documents from
`docs/specs/078-build-tool-dependency-producers/`

## Phase 1: Setup And Review

- [x] T001 Create dedicated branch/worktree for spec 078.
- [x] T002 Create concrete `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, and `tasks.md`.
- [x] T003 Update `.specify/feature.json`, `AGENTS.md`, and `docs/product-backlog.md` to point at spec 078.
- [x] T004 Record requirements/product-vision drift review in `docs/specs/078-build-tool-dependency-producers/reviews/requirements-product-vision-drift-2026-06-02.md`.
- [x] T005 Record analyze/manual consistency disposition in `docs/specs/078-build-tool-dependency-producers/reviews/analyze-disposition-2026-06-02.md`.

## Phase 2: US1 - Build Tool Dependency Next Actions

**Goal**: Fresh context packs expose approval-gated Maven/Gradle dependency producer plans when manifests are visible.

**Independent Test**: A fixture with Maven/Gradle manifests produces `maven-cyclonedx` and `gradle-cyclonedx` plans in `oss-plan.json`.

- [x] T006 [US1] Add focused `internal/contextprep` test coverage for Maven/Gradle plan generation.
- [x] T007 [US1] Implement bounded Maven/Gradle manifest surface detection in `internal/contextprep/contextprep.go`.
- [x] T008 [US1] Add Maven/Gradle CycloneDX producer plans to `oss-plan.json` with approval/network/mutation boundaries.

## Phase 3: US2 - No Per-Language Scanner Ownership

**Goal**: Agent guidance keeps native build-tool output separate from Portolan-owned scanners.

**Independent Test**: `answer-contract.md` and `query-plan.md` mention native build-tool producer output and keep JVM/PHP/Scala adapters rejected as default.

- [x] T009 [US2] Update generated answer-contract guidance in `internal/contextprep/contextprep.go`.
- [x] T010 [US2] Add focused test assertions for guidance wording.

## Phase 4: US3 - Bigtop Stress Gap Recheck

**Goal**: Fresh Bigtop context smoke proves the improved next-action surface without producer execution.

**Independent Test**: Fresh Bigtop context under `.portolan/stress/<run-id>` contains Maven/Gradle producer plans and no executed Maven/Gradle output.

- [x] T011 [US3] Run fresh Bigtop `context prepare` into a new `.portolan/stress` directory.
- [x] T012 [US3] Record smoke evidence in `docs/specs/078-build-tool-dependency-producers/reviews/bigtop-context-smoke-2026-06-02.md`.

## Final Phase: Verification And PR Readiness

- [x] T013 Run `go test ./internal/contextprep`.
- [x] T013a Run `go test ./internal/app`.
- [x] T014 Run `go test ./...`.
- [x] T015 Run `go vet ./...`.
- [x] T016 Run `jq empty schema/*.json`.
- [x] T017 Run `git diff --check`.
- [x] T018 Update task ledger and status surfaces.
- [x] T019 Run three assessed independent non-GPT review lanes or record the exact blocker.
- [x] T020 Create/update PR and record PR readiness closeout.

## Dependencies

- US1 blocks US2 and US3.
- US3 runs after code/guidance changes.
- Spec 076 parity validation remains blocked until its own execution gate is satisfied.
