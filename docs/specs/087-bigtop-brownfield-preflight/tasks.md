# Tasks: Bigtop Brownfield Preflight

**Input**: `docs/specs/087-bigtop-brownfield-preflight/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/`, `quickstart.md`

**Tests**: Required for behavior changes. Add focused tests before changing
preflight behavior.

## Phase 1: Setup And Review

- [x] T001 Update `.specify/feature.json` to point at `docs/specs/087-bigtop-brownfield-preflight`.
- [x] T002 Update `AGENTS.md` SpecKit pointer to `docs/specs/087-bigtop-brownfield-preflight/plan.md`.
- [x] T003 Record requirements/product/constitution drift review in `docs/specs/087-bigtop-brownfield-preflight/reviews/requirements-product-vision-drift-2026-06-09.md`.
- [x] T004 Run three opencode plan/task review lanes and record disposition in `docs/specs/087-bigtop-brownfield-preflight/reviews/plan-task-review-disposition-2026-06-09.md`.

## Phase 2: Foundational Preflight Contract

- [x] T005 Add `schema/preflight-toolchain.schema.json` for `toolchain.json`.
- [x] T006 Add preflight package tests for data model validation, target-shape helpers, artifact-link helpers, gap helpers, and toolchain recommendation helpers in `internal/preflight/preflight_test.go`.
- [x] T007 Implement preflight data model and rendering helpers in `internal/preflight/preflight.go`.
- [x] T008 Add CLI dispatch and help text for `portolan preflight` in `internal/app/app.go` and `internal/app/app_test.go`.
- [x] T009 Add CLI error-path tests for missing `--root`, unreadable or empty `--artifacts`, malformed JSON/JSONL, unsafe `--out`, and write failures in `internal/app/app_test.go` and `internal/preflight/preflight_test.go`.

## Phase 3: User Story 1 - See The Brownfield Shape Before AI Work (Priority: P1)

**Goal**: Generate a bounded `preflight.md` and `preflight-gaps.jsonl` from
local target/artifact inputs.

**Independent Test**: A fixture artifact directory produces target shape,
visible artifact links, top gaps, and next probes without loading full graph
facts or claiming complete architecture.

- [x] T010 [P] [US1] Add fixture inputs for context/map artifact discovery in `internal/preflight/testdata/basic-artifacts/`.
- [x] T011 [US1] Add failing CLI/output integration tests for `preflight.md` and `preflight-gaps.jsonl` output in `internal/preflight/preflight_test.go`.
- [x] T012 [US1] Implement non-recursive artifact discovery, target-shape summary, missing/malformed artifact gaps, and gap emission in `internal/preflight/preflight.go`.
- [x] T013 [US1] Wire `portolan preflight --root --artifacts --out` output creation through `internal/app/app.go`.
- [x] T014 [US1] Run focused verification and one opencode slice review; record disposition in `docs/specs/087-bigtop-brownfield-preflight/reviews/us1-review-disposition-2026-06-09.md`.

## Phase 4: User Story 2 - Select The Right Local Toolchain (Priority: P1)

**Goal**: Generate `toolchain.json` with installed, missing, supplied-output,
approval-required, parked, and rejected recommendation records.

**Independent Test**: Candidate tools are classified by job, availability,
risk, evidence family, and approval boundary, and remain non-evidence until
local output is imported.

- [x] T015 [US2] Add failing tests for toolchain status and approval-boundary classification in `internal/preflight/preflight_test.go`.
- [x] T016 [US2] Implement toolchain recommendation generation and explicit Go validation for required fields/enums in `internal/preflight/preflight.go`.
- [x] T017 [US2] Add `schema/preflight-toolchain.schema.json` syntax validation to the verification path without adding a runtime JSON Schema dependency.
- [x] T018 [US2] Run focused verification and one opencode slice review; record disposition in `docs/specs/087-bigtop-brownfield-preflight/reviews/us2-review-disposition-2026-06-09.md`.

## Phase 5: User Story 3 - Hand Off To An AI Agent Without Becoming A Harness (Priority: P1)

**Goal**: Generate `agent-handoff.md` that tells Cursor, Codex, OpenCode, pi,
or another coding agent where to start and what claims remain bounded.

**Independent Test**: The handoff names starting artifacts, blind spots, safe
next probes, and approval-required actions without instructing Portolan to run
agent loops or model routing.

- [x] T019 [US3] Add failing tests for `agent-handoff.md` start-here, blind-spot, safe-probe, approval-required, escaping, and no-raw-snippet boundaries in `internal/preflight/preflight_test.go`.
- [x] T020 [US3] Implement agent handoff rendering with escaped/bounded target-derived strings in `internal/preflight/preflight.go`.
- [x] T021 [US3] Update `docs/specs/087-bigtop-brownfield-preflight/quickstart.md` with the verified command/output paths.
- [x] T022 [US3] Run focused verification and one opencode slice review; record disposition in `docs/specs/087-bigtop-brownfield-preflight/reviews/us3-review-disposition-2026-06-09.md`.

## Phase 6: User Story 4 - Keep Future Importers Behind The Preflight Decision (Priority: P2)

**Goal**: Preserve ast-index, Graphify, Understand Anything, and similar tools
as preflight recommendations until their local output is explicitly supplied or
imported.

**Independent Test**: Tool recommendations do not create graph evidence and
084/085/086 remain parked/dependent unless preflight output selects them.

- [x] T023 [US4] Add tests proving candidate/importer recommendations are emitted only in `toolchain.json`/handoff text and are not written as findings, graph facts, or imported evidence in `internal/preflight/preflight_test.go`.
- [x] T024 [US4] Add parked/dependent tool reasoning to toolchain recommendations in `internal/preflight/preflight.go`.
- [x] T025 [US4] Update backlog/spec status wording if implementation changes the 084/085/086 dependency boundary in `docs/product-backlog.md` and `docs/specs/087-bigtop-brownfield-preflight/spec.md`.
- [x] T026 [US4] Run focused verification and one opencode slice review; record disposition in `docs/specs/087-bigtop-brownfield-preflight/reviews/us4-review-disposition-2026-06-09.md`.

## Phase 7: Final Verification, PR, And Review

- [x] T027 Run full baseline: `go test ./...`, `go vet ./...`, `jq empty schema/*.json`, `git diff --check`.
- [x] T028 Run CLI smoke: `go run ./cmd/portolan preflight --help` and a fixture preflight command.
- [x] T029 Record final drift/quality review for spec drift, constitution drift, product drift, CRAP < 5, MI > 70, CleanArch hex, CleanCode, SOLID, DRY, and YAGNI in `docs/specs/087-bigtop-brownfield-preflight/reviews/final-quality-drift-2026-06-09.md`.
- [ ] T030 Commit, push, create PR, and run three opencode PR review lanes.
- [ ] T031 Fix accepted PR review findings and update `docs/specs/087-bigtop-brownfield-preflight/reviews/pr-readiness-closeout-2026-06-09.md`.

## Dependencies & Execution Order

- Phase 1 blocks implementation.
- Phase 2 blocks all user stories.
- US1, US2, and US3 are P1 and should be delivered in order because later
  artifacts depend on the bundle structure.
- US4 follows after P1 value is present.
- Final PR review starts only after all task checkboxes and verification
  evidence are coherent.

## Implementation Strategy

1. Complete SpecKit plan/tasks/analyze/review disposition.
2. Implement US1 as the minimum useful Bigtop preflight.
3. Add toolchain decision records in US2.
4. Add agent handoff in US3.
5. Add importer/tool parking safeguards in US4.
6. Run full verification, opencode PR review, fixes, and closeout.
