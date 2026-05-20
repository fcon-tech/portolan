# Tasks: Importer Normalization

**Input**: Design documents from `specs/004-importer-normalization/`
**Prerequisites**: `spec.md`, `plan.md`
**Tests**: Required. Write focused tests before behavior implementation.

## Phase 1: Fixtures And Contract Tests

- [x] T001 [P] Add CycloneDX importer fixtures in `testdata/importer-normalization/cyclonedx.json`, `testdata/importer-normalization/cyclonedx-unknown-ref.json`, and `testdata/importer-normalization/malformed-cyclonedx.json`.
- [x] T002 [P] Add failing CLI help tests for `portolan import --help` and `portolan import cyclonedx --help` in `internal/app/app_test.go`.
- [x] T003 [P] Add failing CLI import test for `import cyclonedx --in <file> --out <file>` in `internal/app/app_test.go`.
- [x] T004 [P] Add failing malformed CycloneDX test proving output is a valid graph with `cannot_verify` and no partial parsed facts.
- [x] T005 [P] Add failing unknown dependency ref test proving unresolved refs are represented as `cannot_verify`.

## Phase 2: CycloneDX Importer

- [x] T006 [US1] Add `internal/importer` package with CycloneDX JSON loader and graph normalizer.
- [x] T007 [US1] Normalize CycloneDX components into `package` nodes with `metadata-visible` evidence.
- [x] T008 [US1] Normalize CycloneDX dependencies into `depends-on` edges with input-file attribution.
- [x] T009 [US1] Preserve BOM metadata as an importer/source node without claiming source visibility.
- [x] T010 [US2] Represent malformed input as `cannot_verify` with a clear reason.
- [x] T011 [US2] Represent unresolved dependency refs as `cannot_verify` package nodes and edges.

## Phase 3: CLI Wiring

- [x] T012 [US1] Wire `import cyclonedx --in <file> --out <file> [--force]` through `internal/app/app.go`.
- [x] T013 [US1] Return clear stdout/stderr behavior and non-zero exit codes for invalid flags or output write failures.
- [x] T014 [US1] Keep `cmd/portolan/main.go` thin and route behavior through `internal/app`.

## Phase 4: Documentation, Review, And PR

- [x] T015 Update `README.md` command examples after CycloneDX import exists.
- [x] T016 Record pre-implementation review disposition under `specs/004-importer-normalization/reviews/`.
- [x] T017 Record post-slice review disposition under `specs/004-importer-normalization/reviews/`.
- [x] T018 Update `docs/product-backlog.md` and `specs/004-importer-normalization/spec.md` status after implementation.
- [x] T019 Run `go test -count=1 ./...`.
- [x] T020 Run `jq empty schema/*.json`.
- [x] T021 Run `go run ./cmd/portolan import cyclonedx --in testdata/importer-normalization/cyclonedx.json --out /tmp/portolan-import-graph.json --force`.
- [x] T022 Run `git diff --check`.
- [x] T023 Create or update PR and run PR review cycle.

## Dependencies

- Phase 1 tests and fixtures precede implementation.
- Phase 2 importer precedes Phase 3 CLI wiring.
- All tasks must be complete before PR readiness.

## Implementation Strategy

Deliver one coherent slice: fixtures, tests, stdlib CycloneDX importer, CLI
wiring, docs, review disposition, verification, and PR review. Do not add JSON
Schema validation, external tool invocation, graph merge, SPDX import, or live
API integration in this slice.
