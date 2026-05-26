# Implementation Disposition: Context Evidence Index

## Scope

Added a bounded `evidence-index.jsonl` entrypoint to context packs so Cursor and
other agents can see repositories, local OSS/tool-output candidates, and gaps
before reading larger or more specialized artifacts.

## Decision Gate

- Simpler/Faster: Index existing `repos.json`, `tool-registry.json`, and
  `gaps.jsonl`; no new scanner, daemon, search backend, or OSS execution.
- Blocking Edge Cases: Large landscapes, private source, malformed tool output,
  and absent evidence require bounded records with honest evidence states.
- Existing Open Source: Existing packing/search tools are adjacent but not
  needed for this local artifact-linking slice.

## Review Lanes

- Local reviewer: accepted. Checked artifact contract, no raw source snippets,
  evidence-state preservation, docs, and tests.
- `kimi-coding/kimi-for-coding`: `not_assessed`. Lane returned a tool-discovery
  plan instead of concrete findings.
- `minimax/MiniMax-M2.7`: `not_assessed`. Lane failed with `404 page not
  found`.
- `zai/glm-5.1`: `not_assessed`. Lane hallucinated a TypeScript project shape
  and files absent from this Go repository.

## Verification

- `verified`: `go test -count=1 ./internal/app`
- `verified`: `go test -count=1 ./...`
- `verified`: `jq empty schema/*.json testdata/oss-adapter-contract/*.json`
- `verified`: `git diff --check`
- `verified`: `go run ./cmd/portolan context prepare --root <tmp multi-repo fixture> --out <tmp>/.portolan/context --profile cursor --force`

## Remaining Risks

- The index is a first-pass navigator, not semantic search.
- It links context-preparation evidence only; map-bundle findings still live in
  `summary.json`, `graph-index.json`, `findings.jsonl`, and optional graph
  slices.
