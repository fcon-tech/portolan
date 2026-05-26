# Implementation Disposition: Bounded Graph Index

## Scope

Implemented `graph-index.json` as a bounded map-bundle artifact for agents that
need graph entrypoints without loading full `graph.json`.

## Decision Gate

- Simpler/Faster: one generated JSON artifact in the existing bundle; no daemon,
  MCP, database, or new CLI query surface.
- Blocking Edge Cases: `graph.json` remains canonical. The index exposes
  bounded references and artifact budgets only; it is not a second graph truth.
- Existing Open Source: Go stdlib JSON and existing in-memory graph structures
  are sufficient for this slice.

## Review Lanes

- Local reviewer: accepted. Checked evidence-state preservation, bounded
  samples, artifact metadata, docs alignment, and real landscape behavior.
- `kimi-coding/kimi-for-coding`: `not_assessed`; lane returned an off-contract
  "I will inspect files" response and no findings.
- `minimax/MiniMax-M2.7`: `not_assessed`; lane returned `404 page not found`.
- `zai/glm-5.1`: `not_assessed`; lane timed out with no review output.

## Verification

- `verified`: `go test -count=1 ./...`
- `verified`: `jq empty schema/*.json`
- `verified`: `git diff --check`
- `verified`: focused tests for `internal/app` and `internal/maprun`.
- `verified`: fixture smoke wrote `/tmp/portolan-029-fixture/graph-index.json`.
- `verified`: real landscape smoke wrote
  `/tmp/portolan-vibecoding-map-029/graph-index.json`.
- `verified`: real `graph-index.json` was 112077 bytes and recorded
  `graph.json` as 680659572 bytes.
- `verified`: headless Cursor Agent used `graph-index.json` to answer first
  graph drill-down questions and did not load full `graph.json`.

## Remaining Risks

- `graph-index.json` reduces first-read pressure but does not provide arbitrary
  graph slicing by repo, node ID, finding ID, or edge kind.
- Full `graph.json` is still large for real workspaces and remains a scale
  concern for deeper drill-downs.
