# Implementation Disposition: Graph Slice Command

## Scope

Implemented read-only `portolan graph slice` for bounded second-pass graph
drill-down from an existing map bundle.

## Decision Gate

- Simpler/Faster: one CLI subcommand over an existing map bundle; no MCP,
  daemon, graph database, or alternate storage layer.
- Blocking Edge Cases: the local process still loads `graph.json`; the agent
  receives only the bounded slice. This solves prompt-scale UX, not graph
  storage performance.
- Existing Open Source: no dependency is needed. Go stdlib JSON and existing
  graph loading are sufficient.

## Review Lanes

- Local reviewer: accepted. Checked CLI contract, output bounds,
  evidence-state preservation, output-path safety, docs, and real bundle
  behavior.
- `kimi-coding/kimi-for-coding`: `not_assessed`; lane timed out with no review
  output.
- `minimax/MiniMax-M2.7`: `not_assessed`; lane returned `404 page not found`.
- `zai/glm-5.1`: `not_assessed`; lane returned an off-contract planning
  response and no findings.

## Verification

- `verified`: `go test -count=1 ./...`
- `verified`: `jq empty schema/*.json`
- `verified`: `git diff --check`
- `verified`: focused tests for `internal/app`.
- `verified`: `go run ./cmd/portolan graph slice --help`.
- `verified`: real repo slice for `spark-k8s`.
- `verified`: real edge-kind slice for `imports`.
- `verified`: real finding-kind slice for `technical-debt`.
- `verified`: real `-o` alias smoke for `spark-k8s`.
- `verified`: headless Cursor Agent used the bounded slice and did not load
  full `graph.json`.

## Remaining Risks

- `graph slice` is a bounded extractor, not a query engine. More filters may be
  needed later, but repo, edge-kind, and finding-kind modes cover the immediate
  graph-index follow-up path.
- Full `graph.json` remains canonical and large.
