# Tasks: Evidence Graph Diff

**Input**: Design documents from `specs/006-evidence-diff/`
**Prerequisites**: `spec.md`, `plan.md`
**Tests**: Required. Write focused tests before behavior implementation.

## Phase 1: Fixtures And Contract Tests

- [x] T001 [P] Add diff fixtures in `testdata/evidence-diff/base.json` and `testdata/evidence-diff/head.json` with added, removed, unchanged, and changed graph facts.
- [x] T002 [P] Add failing CLI help test for `portolan diff --help` in `internal/app/app_test.go`.
- [x] T003 [P] Add failing CLI diff test for `diff --base <graph> --head <graph> --out <file> --force` in `internal/app/app_test.go`.
- [x] T004 [P] Add failing graph diff assertion proving evidence-state transitions are reported as data, not verdicts.
- [x] T005 [P] Add failing regression test proving diff output contains no readiness, pass/fail, improvement, or degradation fields.

## Phase 2: Diff Model

- [x] T006 [US1] Add `internal/diff` package with input loading, output model, and deterministic JSON writing.
- [x] T007 [US1] Compare nodes by `id` and report added, removed, unchanged, and changed nodes.
- [x] T008 [US1] Compare edges by `from`, `to`, and `kind` and report added, removed, unchanged, and changed edges.
- [x] T009 [US1] Report evidence-state transitions for changed nodes and edges.
- [x] T010 [US2] Ensure diff output does not include readiness, improvement, degradation, or pass/fail verdict fields.

## Phase 3: CLI Wiring

- [x] T011 [US1] Wire `diff --base <graph> --head <graph> --out <file> [--force]` through `internal/app/app.go`.
- [x] T012 [US1] Return clear stdout/stderr behavior and non-zero exit codes for missing flags, malformed graph files, or output write failures.
- [x] T013 [US1] Keep `cmd/portolan/main.go` thin and route behavior through `internal/app`.

## Phase 4: Documentation, Review, And PR

- [x] T014 Update `README.md` command examples after machine-readable graph diff exists.
- [x] T015 Update `docs/product-backlog.md` and `specs/006-evidence-diff/spec.md` status after implementation.
- [x] T016 Record pre-implementation review disposition under `specs/006-evidence-diff/reviews/`.
- [x] T017 Record post-slice review disposition under `specs/006-evidence-diff/reviews/`.
- [x] T018 Run `go test -count=1 ./...`.
- [x] T019 Run `jq empty schema/*.json`.
- [x] T020 Run `go run ./cmd/portolan diff --base testdata/evidence-diff/base.json --head testdata/evidence-diff/head.json --out /tmp/portolan-diff.json --force`.
- [x] T021 Run `jq empty /tmp/portolan-diff.json`.
- [x] T022 Run `git diff --check`.
- [x] T023 Create or update PR and run PR review cycle.

## Dependencies

- Phase 1 fixtures and tests precede implementation.
- Phase 2 diff model precedes Phase 3 CLI wiring.
- Phase 3 CLI wiring precedes README and final verification.
- All tasks must be complete before PR readiness.

## Parallel Execution Examples

- T001, T002, T003, T004, and T005 can be drafted in parallel after the output
  shape is agreed.
- T007 and T008 can proceed in parallel after `internal/diff` output types
  exist.
- T014 can proceed after the CLI contract is implemented.

## Implementation Strategy

Deliver one coherent slice: fixtures, failing tests, graph-aware diff model, CLI
wiring, docs, review disposition, verification, and PR review. Do not add human
Markdown summaries, rename detection, graph merge semantics, JSON Patch output,
external diff libraries, or readiness scoring in this slice.
