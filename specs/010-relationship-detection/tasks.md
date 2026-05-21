# Tasks: Relationship Detection

**Input**: Design documents from `specs/010-relationship-detection/`
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`quickstart.md`
**Tests**: Required. Write focused tests before behavior implementation.

## Phase 1: Fixtures And Failing Tests

- [x] T001 [P] Add relationship fixtures under `testdata/relationship-detection/`, including a map fixture repository with `go.mod`, `go.sum`, `cmd/example/main.go`, and `internal/worker/worker.go`, plus a selection fixture that preserves claim-only and unknown relationship examples.
- [x] T002 [P] [US1] Add failing map test proving Go source imports emit `imports` edges with `source-visible` evidence in `internal/app/app_test.go`.
- [x] T003 [P] [US1] Add failing map test proving single-line and block-form `go.mod` dependencies emit `depends-on` edges with `metadata-visible` evidence in `internal/app/app_test.go`.
- [x] T004 [P] [US2] Add failing map test proving observed relationship evidence replaces the relationship-not-assessed placeholder finding in `internal/app/app_test.go`.
- [x] T005 [P] [US2] Add failing map test proving duplication, configuration, and technical-debt findings remain `not_assessed` in `internal/app/app_test.go`.
- [x] T006 [P] [US2] Add regression tests proving existing `scan --selection` claim-only, metadata-visible, and unknown relationship evidence remains intact, including an overlap case where a claim-only relationship is not overwritten by observed source or metadata evidence, in `internal/app/app_test.go`.
- [x] T007 [P] [US3] Add failing invariant test proving every emitted relationship edge has non-empty `evidence.state` and `evidence.source` in `internal/app/app_test.go`.

## Phase 2: Relationship Detector

- [x] T008 [US1] Add `internal/relationships` package with deterministic relationship result types and graph edge conversion helpers.
- [x] T009 [US1] Implement Go source import detection with `go/parser`/`go/ast`, skipping `.portolan` paths.
- [x] T010 [US1] Add `golang.org/x/mod/modfile` and implement local `go.mod` module and `require` parsing from file bytes without module resolution or network access.
- [x] T011 [US2] Represent unreadable or unparsable relationship inputs as deterministic `cannot_verify` relationship findings without failing the whole map run.

## Phase 3: Map Integration

- [x] T012 [US1] Wire relationship detection into `internal/maprun` so `graph.json` includes `imports` and `depends-on` edges.
- [x] T013 [US2] Update relationship findings in `internal/maprun` so observed relationships replace the relationship `not_assessed` placeholder.
- [x] T014 [US3] Keep unsupported relationship families and non-Go languages explicit as `not_assessed` or out of scope; do not emit clean “no relationships” claims.
- [x] T015 [US3] Ensure graph output remains deterministic by sorting relationship nodes and edges.

## Phase 4: Documentation, Review, And Verification

- [x] T016 [FR-005] Document supported relationship types per language and input family in `docs/relationship-detection.md`.
- [x] T017 Update `README.md`, `docs/agent-toolbox/README.md`, and `agent/AGENT_GUIDE.md` where map output describes relationship findings.
- [x] T018 Update `docs/product-backlog.md` and `specs/010-relationship-detection/spec.md` status after implementation.
- [x] T019 Record pre-implementation review disposition under `specs/010-relationship-detection/reviews/`.
- [x] T020 Record post-slice review disposition under `specs/010-relationship-detection/reviews/`.
- [x] T021 Run `go test -count=1 ./...`.
- [x] T022 Run `jq empty schema/*.json corpora/apache-bigtop/manifest.json`.
- [x] T023 Run `go run ./cmd/portolan map --root testdata/relationship-detection/repo --out /tmp/portolan-relationships-run --force`.
- [x] T024 Run `jq empty /tmp/portolan-relationships-run/run.json /tmp/portolan-relationships-run/graph.json`.
- [x] T025 Run a `jq` check that every `imports` and `depends-on` edge in `/tmp/portolan-relationships-run/graph.json` has `from`, `to`, `kind`, `evidence.state`, and `evidence.source`.
- [x] T026 Run JSONL parse check over `/tmp/portolan-relationships-run/findings.jsonl`.
- [x] T027 Run `git diff --check`.
- [x] T028 Create or update PR and run PR review cycle.
- [x] T029 Record PR readiness closeout and mark PR ready-for-review.

## Dependencies

- Phase 1 fixtures and tests precede behavior implementation.
- T008 unblocks T009 through T011.
- T009 and T010 unblock T012.
- T012 and T013 unblock documentation and final verification.

## Implementation Strategy

Deliver the smallest coherent slice: local Go import relationships, conservative
`go.mod` dependency relationships, observed relationship findings, docs, review
disposition, verification, and PR review. Do not add network access,
credentials, schema version changes, service-topology inference, tree-sitter,
Semgrep, language servers, or broad multi-language scanning in this slice.
