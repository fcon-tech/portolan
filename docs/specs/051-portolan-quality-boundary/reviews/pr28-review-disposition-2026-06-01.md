# PR 28 Review Disposition

Date: 2026-06-01
PR: https://github.com/fcon-tech/portolan/pull/28

## Review Lanes

| Lane | Status | Verdict | Notes |
| --- | --- | --- | --- |
| `openrouter/deepseek/deepseek-v4-pro` | not_assessed first attempt | n/a | Returned tool-instruction/off-task output. |
| `openrouter/deepseek/deepseek-v4-pro` retry | assessed | PASS | No blockers; CRAP and MI not tool-measured. |
| `kimi-coding/kimi-for-coding` | assessed | APPROVE with minor findings | No blockers. |
| `zai/glm-5.1` | assessed | APPROVE with minor observations | No blockers. |

Raw outputs:

- `pr28-review-deepseek-v4-pro-2026-06-01.raw.md`
- `pr28-review-deepseek-v4-pro-retry-2026-06-01.raw.md`
- `pr28-review-kimi-2026-06-01.raw.md`
- `pr28-review-zai-glm-5-1-2026-06-01.raw.md`

## Findings Disposition

| Finding | Source | Disposition |
| --- | --- | --- |
| Extract strict JSON decode and trailing-content check into a helper. | DeepSeek | Rejected for this slice. There is only one new decoder path in `reportquality`; extracting now would add abstraction before reuse. |
| Preallocate `failures` and `warnings`. | Kimi | Rejected. The slices are tiny report summaries, and clarity is better than micro-optimization. |
| Windows junction behavior is not covered by the symlink check. | Kimi | Rejected as not required by the current Linux/macOS local-first contract. The existing `os.Lstat` symlink guard matches project path-safety patterns. |
| Add unit-level error tests for `LoadSummary`. | Kimi/Z.ai | Rejected as follow-up. CLI-level and package tests cover the main pass/fail contract; parse/path edge branches are lower risk and not required for this slice. |
| Docs mention CRAP/MI without enforcement. | Kimi | Rejected as factual mismatch. The new product docs do not claim CRAP or MI enforcement; these were PR review lenses requested for this session. |
| Derive weak-state values from schema/shared constants. | Z.ai | Rejected for this slice. Go stdlib validation intentionally avoids schema runtime dependencies; schema and Go enum are kept aligned by tests and review. |

## Required Lenses

| Lens | Result | Evidence |
| --- | --- | --- |
| Spec drift | verified | Spec, plan, tasks, docs, schema, fixtures, and validator align for spec 051; adjacent 052 files were pruned from PR diff. |
| Constitution drift | verified | Local-first/read-only preserved; no network, daemon, credentials, or target mutation added. |
| Product drift | verified | Product boundary and claims docs route through the quality boundary without broadening claims. |
| CRAP < 5 | verified after correction | `gocyclo` was available at `/home/fall_out_bug/go/bin/gocyclo` outside `PATH`. After refactoring the new report-quality code path, the highest computed CRAP among new/changed report-quality functions is 4.84. |
| MI > 70 | verified after correction | `golangci-lint` includes `maintidx`; `golangci-lint run --tests=false --config /tmp/maintidx70.yml ./internal/reportquality ./internal/app` completed with no findings for production code using `maintidx.under: 70`. |
| CleanArch/hex | verified by review | `internal/reportquality` owns domain validation; `internal/app` is CLI wiring. |
| CleanCode | verified by review | Reviewers found small functions, clear naming, and no blocking readability issues. |
| SOLID | verified by review | Load, validate, and CLI orchestration are separated. |
| DRY | verified by review | No harmful duplication found; shared helper extraction deferred until reuse exists. |
| YAGNI | verified by review | No new dependency, config system, daemon, or broad governance engine added. |

## Local Verification

- `go test -count=1 ./...`: verified
- `go vet ./...`: verified
- `jq empty schema/*.json internal/testfixtures/report-quality/*.json`: verified
- `git diff --check`: verified
- `golangci-lint run ./...`: verified
- `/home/fall_out_bug/go/bin/gocyclo internal/reportquality internal/app`: verified, used for CRAP calculation
- `golangci-lint run --tests=false --config /tmp/maintidx70.yml ./internal/reportquality ./internal/app`: verified, used for MI > 70 gate
- `go run ./cmd/portolan report quality --summary internal/testfixtures/report-quality/thin-honest.json`: verified pass verdict
- `go run ./cmd/portolan report quality --summary internal/testfixtures/report-quality/hidden-weak-state.json`: verified fail verdict

## Status

Accepted PR review findings are either fixed or explicitly rejected with local
rationale. CRAP and MI are now verified after correcting the local tooling path
assumption.
