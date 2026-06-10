# ADR 001: Go CLI Fate (Decision Gate)

**Status**: Provisional — thin maintenance layer (2026-06-10)

**Context**: Harness pivot (spec 087) ships recipes, orient bundle, and viewer
without requiring Go. Phase 5 smoke validates harness-only path on fixtures.

## Decision gate criteria

| Criterion | Result (2026-06-10 smoke) |
| --- | --- |
| Harness + scripts build orient bundle | Pass (`build-orient-bundle.sh`) |
| Viewer loads bundle without Go | Pass (`harness-orient-smoke.sh`) |
| Importer edge cases in production | Not re-tested; legacy `internal/importer` retained |
| Large JSONL / path safety | Legacy Go still has tests; harness uses jq/bash |

## Decision

**Keep Go in maintenance mode** until harness importers cover production edge
cases or a dedicated spec deprecates `cmd/portolan`.

Allowed:

- `map`, `import`, `query`, `orient-export-from-map.sh` bridge
- Bugfixes and security fixes per GO-FREEZE-POLICY

Not allowed without new ADR:

- New product features in Go
- `contextprep` / answer-contract growth

## Consequences

- Primary docs and INSTALL-PROMPT point to `harness/SKILL.md`.
- Contributors add recipes and viewer features first.
- Revisit this ADR after real-target harness runs (non-fixture) or importer parity spec.

## Alternatives considered

1. **Deprecate Go immediately** — rejected; importer bridge still useful.
2. **Go as primary** — rejected; conflicts with harness-first product.
