# Implementation Plan: Graph Slice Command

## Decision Gate

- Simpler/Faster: add one CLI subcommand over an existing map bundle. Do not add
  MCP, LSP, daemon behavior, graph database, or a new storage layer in this
  slice.
- Blocking Edge Cases: the command may load full `graph.json` in the local
  process, but the agent receives only a bounded JSON slice. This solves
  prompt-scale drill-down, not graph storage or indexing performance.
- Existing Open Source: graph databases and code search indexes are not needed
  for a bounded local extractor. Go stdlib JSON plus existing graph loading is
  sufficient.

## Technical Approach

- Add `internal/graphslice`.
- Add top-level CLI: `portolan graph slice`.
- Required flags:
  - `--bundle <dir>`
  - one of `--repo <id>`, `--edge-kind <kind>`, `--finding-kind <kind>`
  - `--out <file>`
- Optional flags:
  - `--limit <n>` default 100, max 1000
  - `--force`
- Load `graph.json` and `findings.jsonl` from the bundle.
- Write bounded JSON with criteria, totals, truncation, nodes, edges, findings,
  and evidence-state-preserving samples.

## Verification

Run:

```bash
go test -count=1 ./...
jq empty schema/*.json
git diff --check
go run ./cmd/portolan graph slice --help
go run ./cmd/portolan graph slice --bundle /tmp/portolan-vibecoding-map-029 --repo spark-k8s --limit 25 --out /tmp/portolan-vibecoding-spark-slice.json --force
jq '{criteria, totals, truncated, nodes:(.nodes|length), edges:(.edges|length), findings:(.findings|length)}' /tmp/portolan-vibecoding-spark-slice.json
```
