# Tasks: Selection And Inventory Input

**Input**: Design documents from `specs/002-selection-inventory/`
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/selection-cli.md`, `quickstart.md`
**Tests**: Required. Write focused tests before behavior implementation.

## Phase 1: Setup And Contract Fixtures

- [x] T001 [P] Add selection inventory fixtures in `testdata/selection-inventory/valid-selection.json`, `testdata/selection-inventory/duplicate-ids.json`, `testdata/selection-inventory/network-url.json`, and `testdata/selection-inventory/missing-path.json`.
- [x] T002 [P] Add `schema/selection.schema.json` documenting the supported JSON selection contract.

## Phase 2: CLI Contract Tests

- [x] T003 [P] [US1] Add failing tests for valid repository targets plus metadata, runtime, and claim input selection validation in `internal/app/app_test.go`.
- [x] T004 [P] [US1] Add failing tests for duplicate IDs, missing paths, unsupported kinds, and URL-like paths in `internal/app/app_test.go`.
- [x] T005 [P] [US2] Add failing tests for `portolan selection --help` and `portolan selection validate --help` documenting local-first, no-network, and no target-content-read behavior in `internal/app/app_test.go`.
- [x] T006 [P] [US2] Add a regression test proving `portolan scan --selection testdata/local-evidence-graph/selection.json --out <file>` still succeeds in `internal/app/app_test.go`.

## Phase 3: Selection Model And Validation

- [x] T007 [US1] Extend `internal/selection/selection.go` to support `metadata[]` and `runtime[]` input collections plus URL-like path rejection.
- [x] T008 [US1] Add validation helpers in `internal/selection/selection.go` that validate selection documents without reading target contents or treating metadata as a graph node kind.
- [x] T009 [US1] Ensure validation errors are deterministic and identify duplicate or invalid IDs in `internal/selection/selection.go`.

## Phase 4: CLI Wiring

- [x] T010 [US2] Wire `selection` and `selection validate --selection <file>` through `internal/app/app.go`.
- [x] T011 [US2] Return clear stdout/stderr behavior and non-zero exit codes for invalid selection inputs in `internal/app/app.go`.
- [x] T012 [US2] Keep `cmd/portolan/main.go` thin and route behavior through `internal/app`.

## Phase 5: Documentation And Review

- [x] T013 Update `README.md` command examples after selection validation exists.
- [x] T014 Record pre-implementation review disposition under `specs/002-selection-inventory/reviews/`.
- [x] T015 Run `go test -count=1 ./...`.
- [x] T016 Run `jq empty schema/*.json`.
- [x] T017 Run `go run ./cmd/portolan selection validate --selection testdata/selection-inventory/valid-selection.json`.
- [x] T018 Run `go run ./cmd/portolan scan --selection testdata/local-evidence-graph/selection.json --out /tmp/portolan-graph.json --force`.
- [x] T019 Run `jq empty /tmp/portolan-graph.json`.
- [x] T020 Run `git diff --check`.

## Dependencies

- Phase 1 fixtures and schema unblock CLI contract tests.
- Phase 2 tests should fail before Phase 3 and Phase 4 implementation.
- User Story 1 validation is the MVP; User Story 2 CLI ergonomics completes the
  user-facing loop.

## Parallel Execution Examples

- T001 and T002 can run in parallel.
- T003, T004, T005, and T006 can be drafted in parallel after fixtures exist.
- T007, T008, and T009 are related and should be integrated carefully in one
  validation pass.

## Implementation Strategy

Deliver the smallest coherent slice: selection fixtures, schema artifact,
failing tests, validation helpers, CLI wiring, docs, then verification. Do not
add YAML, network profiles, file existence validation, or external schema
validation dependencies in this slice.
