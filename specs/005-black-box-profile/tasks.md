# Tasks: Black-Box Profile

**Input**: Design documents from `specs/005-black-box-profile/`
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/black-box-cli.md`, `quickstart.md`
**Tests**: Required. Write focused tests before behavior implementation.

## Phase 1: Fixtures And Contract Tests

- [x] T001 [P] Add black-box profile fixtures in `testdata/black-box-profile/selection.json`, `testdata/black-box-profile/missing-dependency-selection.json`, `testdata/black-box-profile/malformed-runtime-selection.json`, `testdata/black-box-profile/metadata/payments.json`, `testdata/black-box-profile/runtime/payments.json`, `testdata/black-box-profile/runtime/malformed.json`, and `testdata/black-box-profile/claims/payments.json`.
- [x] T002 [P] [US1] Add failing CLI scan test for `portolan scan --selection testdata/black-box-profile/selection.json --out <file> --force` in `internal/app/app_test.go`.
- [x] T003 [P] [US1] Add failing graph assertion proving black-box-derived facts never use `source-visible` in `internal/app/app_test.go`.
- [x] T004 [P] [US2] Add failing test proving missing expected dependency evidence emits `unknown` with a reason in `internal/app/app_test.go`.
- [x] T005 [P] [US2] Add failing test proving malformed runtime input emits `cannot_verify` with a reason while preserving other usable inputs in `internal/app/app_test.go`.
- [x] T006 [P] [US3] Add failing packet regression test proving black-box-only facts are not described as source analysis in `internal/app/app_test.go`.

## Phase 2: Selection And Profile Model

- [x] T007 [US1] Extend `internal/selection/selection.go` to parse `black_boxes[]` entries with local metadata, runtime, claim, and expected evidence fields.
- [x] T008 [US1] Add validation in `internal/selection/selection.go` rejecting repository/source paths, URL-like input paths, duplicate ids, unsupported black-box kinds, and live telemetry settings.
- [x] T009 [US1] Add `internal/blackbox` types for black-box target, metadata input, runtime observation input, claim input, and expected evidence fields.

## Phase 3: Black-Box Normalization

- [x] T010 [US1] Implement metadata input loading in `internal/blackbox` and normalize service, owner, and declared dependency facts as `metadata-visible`.
- [x] T011 [US1] Implement runtime observation loading in `internal/blackbox` and normalize observation facts as `runtime-visible`.
- [x] T012 [US2] Implement expected missing field handling in `internal/blackbox` that emits `unknown` nodes or edges with deterministic reasons.
- [x] T013 [US2] Implement malformed or unreadable selected input handling in `internal/blackbox` that emits `cannot_verify` facts with deterministic reasons.
- [x] T014 [US1] Ensure black-box normalization never emits `source-visible` for black-box-derived nodes or edges.

## Phase 4: Scan And Packet Integration

- [x] T015 [US1] Wire black-box normalization into `internal/scan` so existing `scan --selection --out [--force]` emits black-box facts.
- [x] T016 [US1] Keep `cmd/portolan/main.go` thin and route all behavior through `internal/app`.
- [x] T017 [US3] Update `internal/packet` wording to describe metadata, runtime, claim, unknown, and cannot-verify black-box facts without implying source analysis.
- [x] T018 [US3] Ensure packet output cites graph ids or reasons for black-box `unknown` and `cannot_verify` facts.

## Phase 5: Documentation, Review, And PR

- [x] T019 Update `README.md` command examples after black-box scan exists.
- [x] T020 Update `docs/product-backlog.md` and `specs/005-black-box-profile/spec.md` status after implementation.
- [x] T021 Record pre-implementation review disposition under `specs/005-black-box-profile/reviews/`.
- [x] T022 Record post-slice review disposition under `specs/005-black-box-profile/reviews/`.
- [x] T023 Run `go test -count=1 ./...`.
- [x] T024 Run `jq empty schema/*.json`.
- [x] T025 Run `go run ./cmd/portolan scan --selection testdata/black-box-profile/selection.json --out /tmp/portolan-black-box-graph.json --force`.
- [x] T026 Run `jq empty /tmp/portolan-black-box-graph.json`.
- [x] T027 Run `go run ./cmd/portolan packet render --graph /tmp/portolan-black-box-graph.json --out /tmp/portolan-black-box-packet.md --force`.
- [x] T028 Run `git diff --check`.
- [x] T029 Create or update PR and run PR review cycle.

## Dependencies

- Phase 1 fixtures and tests precede implementation.
- Phase 2 selection/profile model unblocks Phase 3 normalization.
- Phase 3 normalization precedes Phase 4 scan and packet integration.
- User Story 1 is the MVP; User Story 2 completes evidence honesty; User Story
  3 protects the human-facing output.

## Parallel Execution Examples

- T001, T002, T003, T004, T005, and T006 can be drafted in parallel after the
  fixture shape is agreed.
- T007 and T009 can proceed in parallel if their interface is agreed first.
- T010 and T011 can proceed in parallel after `internal/blackbox` types exist.
- T017 and T018 can proceed after graph fixture outputs are available.

## Implementation Strategy

Deliver the smallest coherent slice: fixtures, failing tests, selection model,
black-box normalization, scan integration, packet wording, docs, review
disposition, verification, and PR review. Do not add live observability
queries, service catalog integrations, network access, credentials, schema
migrations, or graph merge semantics in this slice.
