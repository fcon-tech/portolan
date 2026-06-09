# PR Review Disposition

Date: 2026-06-09

Spec: `docs/specs/087-bigtop-brownfield-preflight/`

PR: https://github.com/fcon-tech/portolan/pull/63

## Review Lanes

- `kimi-for-coding/k2p6`: not_assessed. PR lane failed with certificate
  verification error before final verdict.
- `openrouter/qwen/qwen3.7-plus`: assessed. No high or medium findings. Low
  findings: CRAP/MI not measured, duplicate repository count helper, T030/T031
  pending.
- `openrouter/deepseek/deepseek-v4-pro`: not_assessed. Lane ended with
  certificate verification error before verdict.
- `openrouter/~google/gemini-pro-latest`: assessed. No blocking findings.
  Accepted low findings: stream JSONL validation, escape Markdown control
  characters in untrusted non-backticked text, remove no-op output self-check.
- `openrouter/~anthropic/claude-sonnet-latest`: assessed. Accepted findings:
  marshal validation must return an error instead of panic, local DRY fix must
  be committed, stale spec status must be updated, preflight overwrite must
  require `--force`, unreachable `curated-landscape` v1 state must be removed,
  artifact paths must be locally resolvable, gap JSONL scanner buffer should
  match validation, truncated gap lists need a notice, and the roadmap doc
  should be linked from the spec.

Assessed independent non-GPT lanes: 3 (`qwen`, `gemini`, `claude-sonnet`).

## Accepted And Fixed

- Repository counting DRY issue: fixed by computing the repository count once
  and passing it to scope detection.
- JSONL validation memory pressure: fixed by streaming JSONL validation with a
  bounded scanner buffer.
- Markdown control-character injection in gap reason text: fixed and covered by
  a regression test.
- No-op `ensureInside(out, out)`: removed.
- `mustMarshalToolchain` panic path: replaced with `MarshalToolchain` returning
  validation or marshal errors through `Run`.
- Missing overwrite guard: added `--force`; existing preflight output files now
  fail without `--force`.
- Stale spec status: updated to implemented-local / draft PR-review closeout.
- Unreachable `curated-landscape` enum: removed from v1 schema/data model.
- Artifact path ambiguity: artifact links now use resolvable local paths.
- `readGapRecords` scanner buffer mismatch: fixed with the same 4 MiB max line
  buffer as JSONL validation.
- Silent gap truncation: rendered Markdown now points to `preflight-gaps.jsonl`
  when additional gaps are hidden.
- Root-level roadmap discoverability: linked from the spec related product
  surface.

## Rejected Or Deferred

- CRAP < 5: not_assessed. No local CRAP metric tool is available.
- MI > 70: not_assessed. No local Maintainability Index tool is available.
- HTML entities in terminal Markdown rendering: accepted as current trade-off.
  The artifact is agent/browser-facing and escaping untrusted strings is the
  higher-priority requirement.

## Verification After Fixes

- `go test ./internal/preflight ./internal/app`: verified
- `go test ./...`: verified
- `go vet ./...`: verified
- `jq empty schema/*.json`: verified
- `git diff --check`: verified
- `go run ./cmd/portolan preflight --help`: verified
- fixture `go run ./cmd/portolan preflight --root . --artifacts internal/preflight/testdata/basic-artifacts --out <tmp> --force`: verified

## Verdict

`review_findings`: fixed or explicitly not_assessed

`ready_for_pr_state_refresh`: verified

`ready_to_merge`: not_assessed

`merge_approval`: not_assessed
