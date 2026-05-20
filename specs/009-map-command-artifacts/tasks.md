# Tasks: Map Command And Artifact Bundle

**Input**: Design documents from `specs/009-map-command-artifacts/`
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/map-cli.md`, `quickstart.md`
**Tests**: Required. Write focused tests before behavior implementation.

## Phase 1: Fixtures And CLI Tests

- [x] T001 [P] Add fixture repository under `testdata/map-command/repo/`.
- [x] T002 [P] [US1] Add failing tests for `portolan map --root testdata/map-command/repo --out <dir> --force` in `internal/app/app_test.go`.
- [x] T003 [P] [US1] Add failing tests for missing root and overwrite protection in `internal/app/app_test.go`.
- [x] T004 [P] [US2] Add failing tests proving `findings.jsonl` contains parseable findings with required fields in `internal/app/app_test.go`.
- [x] T005 [P] [US3] Add failing tests proving `run.json` records root, output, artifacts, surfaces, and warnings in `internal/app/app_test.go`.

## Phase 2: Artifact Model

- [x] T006 [US1] Add `internal/maprun` package with run metadata and finding types.
- [x] T007 [US2] Implement JSON Lines writer and validation helpers for `findings.jsonl` in `internal/maprun`.
- [x] T008 [US3] Implement `run.json` writer in `internal/maprun`.

## Phase 3: Map Command

- [x] T009 [US1] Wire `map --root <dir> --out <dir> [--force]` through `internal/app/app.go`.
- [x] T010 [US1] Implement output directory validation and overwrite protection in `internal/maprun`.
- [x] T011 [US1] Emit `graph.json`, `findings.jsonl`, `run.json`, and `map.md` for fixture roots.
- [x] T012 [US2] Emit `not_assessed` findings for relationship, duplication, configuration, and technical-debt detectors not implemented yet.
- [x] T013 [US3] Ensure generated `.portolan` output is excluded from source mapping.

## Phase 4: Documentation And Verification

- [x] T014 Update `README.md`, `docs/agent-toolbox/README.md`, and `agent/AGENT_GUIDE.md` command examples after map exists.
- [x] T015 Update `docs/product-backlog.md` and `specs/009-map-command-artifacts/spec.md` status after implementation.
- [x] T016 Record review disposition under `specs/009-map-command-artifacts/reviews/`.
- [x] T017 Run `go test ./...`.
- [x] T018 Run `jq empty schema/*.json corpora/apache-bigtop/manifest.json`.
- [x] T019 Run `go run ./cmd/portolan map --root testdata/map-command/repo --out /tmp/portolan-map-run --force`.
- [x] T020 Run `jq empty /tmp/portolan-map-run/run.json /tmp/portolan-map-run/graph.json`.
- [x] T021 Run JSONL parse check over `/tmp/portolan-map-run/findings.jsonl`.
- [x] T022 Run `git diff --check`.

## Dependencies

- T001 through T005 precede implementation.
- T006 through T008 unblock T009 through T013.
- Spec 008 is not a code dependency but is the intended consumer.

## Implementation Strategy

Deliver the artifact bundle before rich detectors. Do not add MCP, LSP,
external scanner execution, network access, or policy verdicts in this slice.
