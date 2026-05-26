# PR Review Disposition: Cursor Comparison Validation

Date: 2026-05-26

## Scope

- PR: https://github.com/governor/portolan/pull/14
- Branch: `034-cursor-comparison-validation`
- Base: `origin/main`

## Reviewer Lanes

| Lane | Status | Artifact |
| --- | --- | --- |
| local repo-grounded review | `verified` | `pr-review-local-2026-05-26.md` |
| `openrouter/qwen/qwen3.6-plus` | `verified` | `pr-review-qwen-2026-05-26.md` |
| `openrouter/deepseek/deepseek-v4-pro` | `not_assessed` | `pr-review-deepseek-2026-05-26.md` |
| `openrouter/~google/gemini-pro-latest` | `not_assessed` | model ID absent from `~/.pi/agent/settings.json` |

## Findings

| ID | Source | Decision | Evidence | Action |
| --- | --- | --- | --- | --- |
| L1 | local | accepted/fixed | `.specify/extensions/git/git-config.yml` and `config-template.yml` enabled auto-commit by default before review. | Disabled auto-commit by default in both config files, updated workflow docs, and changed orchestrator wording to explicit commit boundaries. |
| L2/R3 | local + Qwen | accepted/fixed | Assisted output preserves many `not_assessed` and `unknown` surfaces while the ledger scored zero unsupported assisted claims. | Added ledger coverage interpretation and an explicit limitation that zero unsupported claims includes bounded abstention, not complete coverage. |
| R1 | Qwen | rejected | `summary.json` contains the duplication count and `graph-index.json` contains the duplicate examples and relationship samples cited by the strict assisted rerun. | No change beyond disposition; lane input remains bounded to context pack, `summary.json`, and `graph-index.json`. |
| R2 | Qwen | rejected | `git diff --name-status origin/main...HEAD \| rg '^A\\s+\\.portolan\|^M\\s+\\.portolan'` returned no `.portolan` files in the PR diff. | No change. |
| R4 | Qwen | accepted/narrowed | DeepSeek lane produced no usable output and is recorded as `not_assessed`; Qwen and local lanes did produce review evidence. | Recorded DeepSeek and missing Gemini as degraded lanes; do not count them as clean review evidence. |
| R5 | Qwen | rejected | Product backlog row describes product-validation outcome; PR review evidence belongs in PR review disposition and readiness closeout. | No backlog change; closeout records review-lane degradation. |

## Verification

- `verified`: `go test ./...`
- `verified`: `jq empty schema/*.json`
- `verified`: `git diff --check`
- `verified`: PR state reconstructed as draft PR #14 with clean merge state and
  no reported GitHub checks at the time of inspection.
- `not_assessed`: Gemini PR review lane, DeepSeek substantive review output,
  GitHub CI checks, merge approval.

## Remaining Risk

- The PR is ready for review only if degraded model lanes are acceptable as
  explicit `not_assessed` evidence. It is not ready-to-merge without approval
  and final check-state reconstruction.
