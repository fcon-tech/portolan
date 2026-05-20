# Tasks: Human-Readable Evidence Packet

**Input**: Design documents from `specs/003-human-readable-packet/`
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/packet-cli.md`, `quickstart.md`
**Tests**: Required. Write focused tests before behavior implementation.

## Phase 1: Fixtures And Contract Tests

- [x] T001 [P] Add packet graph fixtures in `testdata/human-readable-packet/graph.json`, `testdata/human-readable-packet/claim-only-graph.json`, and `testdata/human-readable-packet/malformed-graph.json`.
- [x] T002 [P] Add failing CLI help tests for `portolan packet --help` and `portolan packet render --help` in `internal/app/app_test.go`.
- [x] T003 [P] Add failing CLI render tests for `packet render --graph <file> --out <file>` in `internal/app/app_test.go`.
- [x] T004 [P] Add failing malformed graph test proving no partial packet is written in `internal/app/app_test.go`.

## Phase 2: Packet Renderer

- [x] T005 [US1] Add `internal/packet` graph loader and Markdown renderer.
- [x] T006 [US1] Render aggregate node, edge, and evidence-state counts from graph data.
- [x] T007 [US2] Render non-aggregate node and edge sections with graph ids.
- [x] T008 [US2] Ensure claim-only facts are labeled as claimed and not observed.
- [x] T009 [US1] Call out `unknown` and `cannot_verify` evidence states separately.

## Phase 3: CLI Wiring

- [x] T010 [US1] Wire `packet render --graph <file> --out <file> [--force]` through `internal/app/app.go`.
- [x] T011 [US1] Return clear stdout/stderr behavior and non-zero exit codes for invalid graph inputs in `internal/app/app.go`.
- [x] T012 [US1] Keep `cmd/portolan/main.go` thin and route behavior through `internal/app`.

## Phase 4: Documentation, Review, And PR

- [x] T013 Update `README.md` command examples after packet rendering exists.
- [x] T014 Record pre-implementation review disposition under `specs/003-human-readable-packet/reviews/`.
- [x] T015 Record post-slice review disposition under `specs/003-human-readable-packet/reviews/`.
- [x] T016 Update `docs/product-backlog.md` and `specs/003-human-readable-packet/spec.md` status after implementation.
- [x] T017 Run `go test -count=1 ./...`.
- [x] T018 Run `jq empty schema/*.json`.
- [x] T019 Run `go run ./cmd/portolan packet render --graph testdata/human-readable-packet/graph.json --out /tmp/portolan-packet.md --force`.
- [x] T020 Run `git diff --check`.
- [ ] T021 Create or update PR and run PR review cycle.

## Dependencies

- Phase 1 tests and fixtures precede implementation.
- Phase 2 renderer precedes Phase 3 CLI wiring.
- All tasks must be complete before PR readiness.

## Implementation Strategy

Deliver one coherent slice: fixtures, tests, stdlib Markdown renderer, CLI
wiring, docs, review disposition, verification, PR review. Do not add a
template engine, HTML/PDF output, recommendations, or graph-rescan behavior.
