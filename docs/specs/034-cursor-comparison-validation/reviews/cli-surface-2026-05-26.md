# CLI Surface Check: Cursor Comparison Validation

Date: 2026-05-26

## Commands

- `go run ./cmd/portolan context prepare --help`: `verified`
- `go run ./cmd/portolan map --help`: `verified`
- `go run ./cmd/portolan graph slice --help`: `verified`

## Observed Contract

`context prepare` supports:

```text
portolan context prepare --root <dir> --out <dir> --profile cursor [--force]
```

It writes a context pack with `agent-brief.md`, `answer-contract.md`,
`query-plan.md`, `evidence-index.jsonl`, `repos.json`, `tool-registry.json`,
`oss-plan.json`, and `gaps.jsonl`.

`map` supports:

```text
portolan map --selection selection.json --out .portolan/run [--force]
portolan map --root . --out .portolan/run [--force]
```

It writes `run.json`, `coverage.json`, `graph.json`, `graph-index.json`,
`findings.jsonl`, `summary.json`, and `map.md`.

`graph slice` supports bounded slices:

```text
portolan graph slice --bundle <map-run-dir> --repo <id> --out slice.json [--limit 100] [--force]
portolan graph slice --bundle <map-run-dir> --edge-kind <kind> --out slice.json [--limit 100] [--force]
portolan graph slice --bundle <map-run-dir> --finding-kind <kind> --out slice.json [--limit 100] [--force]
```

## Evidence State

- CLI availability: `verified`
- CLI behavior beyond help and later artifact generation: `not_assessed`
