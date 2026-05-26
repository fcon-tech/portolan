# Implementation Disposition: Agent Answer Contract

## Scope

Implemented `answer-contract.md` as a generated `context prepare` artifact and
aligned CLI help, agent docs, Cursor rule, backlog, tests, and product
hypothesis ledger.

## Decision Gate

- Simpler/Faster: one Markdown artifact in the existing context pack; no MCP,
  daemon, new schema, or dependency.
- Blocking Edge Cases: context preparation cannot know whether a later map run
  exists, so the contract names map artifacts as required evidence instead of
  claiming they are present.
- Existing Open Source: no new OSS dependency is needed. Existing OSS producers
  remain represented through `tool-registry.json` and `oss-plan.json`.

## Review Lanes

- Local reviewer: accepted. Checked diff for evidence-state, UX/DX, docs, and
  local-first boundaries.
- `kimi-coding/kimi-for-coding`: `not_assessed`; lane timed out with no review
  output.
- `minimax/MiniMax-M2.7`: `not_assessed`; lane returned `404 page not found`.
- `zai/glm-5.1`: `not_assessed`; lane returned an off-contract planning
  response and no findings.

## Findings

- No accepted findings.

## Verification

- `verified`: `go test -count=1 ./...`
- `verified`: `jq empty schema/*.json`
- `verified`: `git diff --check`
- `verified`: `go run ./cmd/portolan context prepare --root testdata/landscape-map --out /tmp/portolan-027-context --profile cursor --force`
- `verified`: `/tmp/portolan-027-context/answer-contract.md` exists and names
  the required map, OSS, gap, and missing-evidence surfaces.

## Remaining Risks

- Blind Cursor acceptance against a real inherited estate is still
  `not_assessed` for this slice.
- Semantic architecture coverage, runtime topology, near-clone duplication, and
  component-level SBOM duplication still require map evidence or approved local
  OSS producers.
