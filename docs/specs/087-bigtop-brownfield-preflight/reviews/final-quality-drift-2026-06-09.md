# Final Quality And Drift Review

Date: 2026-06-09

Spec: `docs/specs/087-bigtop-brownfield-preflight/`

Branch: `codex/087-bigtop-brownfield-preflight`

## Scope

Changed surfaces:

- Product/spec docs for Brownfield Preflight reset.
- `internal/preflight` package.
- `internal/app` CLI dispatch/tests.
- `schema/preflight-toolchain.schema.json`.

## Drift Lenses

- **Spec drift**: verified. US1-US4 map to implemented outputs:
  `preflight.md`, `toolchain.json`, `agent-handoff.md`, and
  `preflight-gaps.jsonl`.
- **Constitution drift**: verified. Local-first/read-only defaults preserved; no
  network, install, target mutation, global config, MCP registration, daemon, or
  watcher behavior is added.
- **Product drift**: verified. The implementation is a preflight/orientation and
  toolchain-recommendation surface, not static HTML, dashboard, scanner,
  coding harness, or importer-first work.
- **CRAP < 5**: not_assessed. No CRAP metric tool is available in the local
  environment. Focused coverage for `internal/preflight` is 85.9%, and lint
  passed.
- **MI > 70**: not_assessed. No Maintainability Index tool is available in the
  local environment.
- **CleanArch hex**: verified for this slice. `cmd/portolan` remains thin via
  `internal/app`; behavior is in `internal/preflight`; schema/docs are separate.
- **CleanCode**: verified through local inspection, focused tests, and
  `golangci-lint run ./internal/preflight ./internal/app`.
- **SOLID**: verified at slice scale. Preflight data types, rendering,
  validation, artifact discovery, and CLI dispatch have separate functions;
  no broad inheritance/extension mechanism is introduced.
- **DRY**: verified. No duplicated scanner/importer logic is introduced;
  tool recommendations use shared constructors/classification.
- **YAGNI**: verified. No daemon, UI, MCP registration, network install,
  runtime execution, or new dependency was added.

## Verification

- `go test ./internal/preflight ./internal/app`: verified
- `go test -cover ./internal/preflight ./internal/app`: verified
  - `internal/preflight`: 85.9% statement coverage
  - `internal/app`: 68.0% statement coverage
- `golangci-lint run ./internal/preflight ./internal/app`: verified
- `go test ./...`: verified
- `go vet ./...`: verified
- `jq empty schema/*.json`: verified
- `git diff --check`: verified
- `go run ./cmd/portolan preflight --help`: verified
- fixture `portolan preflight --root --artifacts --out`: verified

## Remaining Risks

- CRAP and MI numeric thresholds are not measured by local tooling.
- Preflight validates bounded known artifacts but intentionally does not load
  full `graph.json`.
- Tool availability uses local `PATH` checks and supplied-output filenames; it
  does not execute tools or prove their outputs until a later approved
  run/import/refresh loop.

## Verdict

`local_implementation`: verified

`ready_for_pr_review`: verified

`ready_to_merge`: not_assessed

`merge_approval`: not_assessed
