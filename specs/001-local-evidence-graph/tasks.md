# Tasks: Local Evidence Graph MVP

**Input**: Design documents from `specs/001-local-evidence-graph/`
**Prerequisites**: `spec.md`, `plan.md`, `data-model.md`, `quickstart.md`
**Tests**: Required. Write focused tests before behavior implementation.

## Phase 1: CLI Contract Tests

- [x] T001 [P] Add failing tests for `portolan scan --selection <file> --out <file>` in `internal/app/`.
- [x] T002 [P] Add failing tests for missing selection file, duplicate target IDs, and malformed claim file.
- [x] T003 [P] Add failing tests proving scan help documents no-network and read-only defaults.
- [x] T003a [P] Add failing tests for existing output path, `--force`, output directory, missing output parent, output symlink, and output path inside a selected repository.
- [x] T003b [P] Add failing tests for canonical path handling, including `../` lexical variants and repository symlinks that resolve outside the selected root.

## Phase 2: Data Model

- [x] T004 Create `internal/selection` types and parser for JSON selection files.
- [x] T005 Create `internal/graph` types matching `schema/evidence-graph.schema.json`.
- [x] T006 Add fixture files under `testdata/local-evidence-graph/`.

## Phase 3: Scanner

- [x] T007 Implement local repository target detection without remote access.
- [x] T008 Implement claim file import as `claim-only` evidence.
- [x] T009 Implement missing or malformed optional source handling as `unknown` or `cannot_verify` with reasons.
- [x] T010 Implement deterministic JSON graph writer.
- [x] T010a Implement output safety: refuse existing outputs unless `--force`, refuse output directories and symlinks, require an existing output parent, and refuse writing inside selected repository roots.

## Phase 4: CLI Wiring

- [x] T011 Wire `scan --selection` and `--out` through `cmd/portolan` and `internal/app`.
- [x] T012 Return clear stderr messages and non-zero exit codes for invalid inputs.
- [x] T013 Keep default behavior non-mutating and network-free.

## Phase 5: Verification And Documentation

- [x] T014 Update `README.md` command examples after scan exists.
- [x] T015 Run `go test -count=1 ./...`.
- [x] T016 Run `jq empty schema/*.json`.
- [x] T017 Run `jq empty` on the generated fixture graph.
- [x] T018 Run `git diff --check`.
- [x] T019 Record remaining gaps in this task list before closing the slice.
