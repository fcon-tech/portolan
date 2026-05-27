# Implementation Disposition - 2026-05-27

Mode: SHIP

## Summary

Implemented spec 042 as a contract/profile-first Agent Adapter Layer:

- added Graphify adapter contract fixture and confidence-map validation;
- added focused tests for Graphify confidence mapping and unsafe producer-state upgrades;
- published Graphify, symbol-index, and Repomix adapter profiles;
- recorded first-wave OSS candidate decisions;
- updated OSS composition and product-claim wording only to the verified scope.

## Decision Gate

- Simpler/Faster: extend the existing adapter contract and profiles instead of building Graphify, SCIP, Serena, or Repomix importers.
- Blocking Edge Cases: producer inference, ambiguous edges, path normalization, source snippets, remote/MCP behavior, and legal/security audit are outside this safe first slice.
- Existing Open Source: Graphify, SCIP, Serena, and Repomix are evaluated as external producers/profiles, not vendored dependencies.

## Verification

- `verified`: `go test -count=1 ./internal/adapter ./internal/app`
- `verified`: `go run ./cmd/portolan adapter validate --in testdata/oss-adapter-contract/graphify-minimal.json`
- `verified`: `go test -count=1 ./...`
- `verified`: `jq empty schema/*.json testdata/oss-adapter-contract/*.json`
- `verified`: `git diff --check`

## Review Evidence

- Pre-implementation status/analyze review:
  `requirements-product-vision-drift-2026-05-27.md`,
  `analyze-disposition-2026-05-27.md`.
- Pre-implementation model review disposition:
  `preimplementation-review-disposition-2026-05-27.md`.
- Slice review disposition:
  `slice-review-disposition-2026-05-27.md`.
- Focused re-review after evidence-semantics fix:
  `focused-rereview-deepseek-2026-05-27.md`,
  `focused-rereview-mimo-2026-05-27.md`.

## Not Assessed

- Full Graphify graph import and path normalization.
- SCIP protobuf parsing.
- Serena MCP/LSP daemon integration.
- Repomix packed-output parsing or redaction enforcement.
- Upstream legal/security audit beyond observed repository license files.
- GitHub PR/check state.

## Stop Reason

Local branch implementation is coherent and verified. Per user instruction, commit locally and do not merge. PR creation/push remains a separate step unless requested.
