# Tasks: Local Evidence Graph MVP

**Input**: Design documents from `specs/001-local-evidence-graph/`
**Prerequisites**: `spec.md`, `plan.md`, `data-model.md`, `quickstart.md`
**Tests**: Required. Write focused tests before behavior implementation.

## Phase 1: CLI Contract Tests

- [ ] T001 [P] Add failing tests for `portolan scan --selection <file> --out <file>` in `internal/app/`.
- [ ] T002 [P] Add failing tests for missing selection file, duplicate target IDs, and malformed claim file.
- [ ] T003 [P] Add failing tests proving scan help documents no-network and read-only defaults.

## Phase 2: Data Model

- [ ] T004 Create `internal/selection` types and parser for JSON selection files.
- [ ] T005 Create `internal/graph` types matching `schema/evidence-graph.schema.json`.
- [ ] T006 Add fixture files under `testdata/local-evidence-graph/`.

## Phase 3: Scanner

- [ ] T007 Implement local repository target detection without remote access.
- [ ] T008 Implement claim file import as `claim-only` evidence.
- [ ] T009 Implement missing or malformed optional source handling as `unknown` or `cannot_verify` with reasons.
- [ ] T010 Implement deterministic JSON graph writer.

## Phase 4: CLI Wiring

- [ ] T011 Wire `scan --selection` and `--out` through `cmd/portolan` and `internal/app`.
- [ ] T012 Return clear stderr messages and non-zero exit codes for invalid inputs.
- [ ] T013 Keep default behavior non-mutating and network-free.

## Phase 5: Verification And Documentation

- [ ] T014 Update `README.md` command examples after scan exists.
- [ ] T015 Run `go test -count=1 ./...`.
- [ ] T016 Run `jq empty schema/*.json`.
- [ ] T017 Run `git diff --check`.
- [ ] T018 Record remaining gaps in this task list before closing the slice.
