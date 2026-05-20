# PR 3 Review Cycle Disposition: Selection And Inventory Input

Date: 2026-05-20

PR: https://github.com/fall-out-bug/portolan/pull/3

## PR State Reconstruction

- PR state: open draft.
- Base: `main` at `8e979ff154168f13bc830acb80f33ff58bae8223`.
- Head before PR-review fixes: `ad07045c822fac440ffc7a0453f44099f42d0b42`.
- Merge state: clean.
- GitHub checks: `not_assessed`; `gh pr checks 3` reported no checks.
- Review decision: empty.

## Review Lanes

- Local repo-grounded PR review: assessed.
- `openrouter/deepseek/deepseek-v4-pro`: assessed with caveats; findings were
  partly speculative and adjudicated locally before edits.
- `openrouter/qwen/qwen3.6-plus`: `not_assessed`; output attempted repo
  exploration rather than returning findings.
- `openrouter/~google/gemini-pro-latest`: assessed; returned `NO FINDINGS`.

## Accepted And Fixed

### Major: Selection CLI Accepted Schema-Unknown Fields

The committed schema uses `additionalProperties: false`, but Go JSON decoding
accepted unknown fields by default. Fixed by using `DisallowUnknownFields()` in
`internal/selection.Load` and adding a CLI test for unknown-field rejection.

### Minor: URL-Like Path Tests Needed Edge Coverage

DeepSeek raised a broad Windows-path concern. Local code inspection showed the
implementation rejects explicit URL prefixes, not generic drive-letter colons.
Accepted narrower: added tests proving `file://` is rejected and `C:\...`
Windows-style local paths are accepted.

## Rejected Findings

- Metadata/runtime arrays required by schema: rejected. They are optional in
  `schema/selection.schema.json`.
- SpecKit completion rule breaking CLI runtime: rejected. The rule is agent
  workflow documentation; no CLI runtime gate was added.
- Arbitrary JSON object injection through metadata/runtime: rejected for this
  slice. The schema and Go model accept only `id` and `path` string fields, and
  validation does not execute or template these values.

## Verification After Fixes

- `go test -count=1 ./...`: passed.
- `jq empty schema/*.json`: passed.
- `go run ./cmd/portolan selection validate --selection testdata/selection-inventory/valid-selection.json`: passed.
- `go run ./cmd/portolan scan --selection testdata/local-evidence-graph/selection.json --out /tmp/portolan-graph.json --force`: passed.
- `jq empty /tmp/portolan-graph.json`: passed.
- `git diff --check`: passed.

## Remaining State

- PR remains draft until the PR-review fixes are committed, pushed, and PR state
  is refreshed.
- GitHub CI remains `not_assessed` because no checks are configured/reported.
