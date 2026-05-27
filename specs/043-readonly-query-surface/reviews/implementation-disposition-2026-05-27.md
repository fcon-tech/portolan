# Implementation Disposition

Spec: `specs/043-readonly-query-surface/`
Date: 2026-05-27
Branch: `codex/043-readonly-query-surface-delivery`

## Implementation State

Implemented locally.

The slice adds a CLI-only read-only query surface over existing map bundles:

- `portolan query findings --bundle <run-dir> --kind <kind> --limit <n>`
- `portolan query gaps --bundle <run-dir> --limit <n>`

The implementation reads `coverage.json` and `findings.jsonl` from an existing bundle, writes JSON to stdout, and starts no daemon. MCP remains a deferred contract only.

## Requirements Coverage

- FR-001: implemented in `internal/query` and wired through `internal/app`.
- FR-002: default limit is 20 and max limit is 200.
- FR-003: records include evidence state, status, reason, artifact, evidence source when present, and stable `portolan://` references.
- FR-004: local read-only behavior preserved; no network, daemon, credentials, or target mutation.
- FR-005: missing, malformed, unsupported, and symlinked bundle artifacts return clear errors.
- FR-006: MCP is documented as deferred; no MCP runtime or daemon was added.
- FR-007: README and agent quickstart tell agents to query before full graph loading.

## Verification

- verified: `go test -count=1 ./internal/query`
- verified: `go test -count=1 ./internal/app -run Query`
- verified: `go run ./cmd/portolan map --root . --out /tmp/portolan-query-smoke --force`
- verified: `go run ./cmd/portolan query findings --bundle /tmp/portolan-query-smoke --kind relationships --limit 5`
- verified: `go run ./cmd/portolan query gaps --bundle /tmp/portolan-query-smoke --limit 10`
- verified: `go test -count=1 ./...`
- verified: `jq empty schema/*.json`
- verified: `git diff --check`

## Not Assessed

- GitHub checks: not_assessed because no PR was created.
- PR review state: not_assessed because no PR was created.
- MCP runtime: not_assessed and out of scope.
- Very large production bundles beyond the existing large JSONL safeguards: not_assessed.

## Remaining Risks

- Query reads the full `findings.jsonl` for matching before truncation; this is acceptable for the first bounded CLI surface, but streaming early-stop can be revisited if real bundle size requires it.
- Duplicate record IDs are stable only with the artifact scope; consumers should use `reference` or `artifact` plus `record_id`.
