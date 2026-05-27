# Slice Review Disposition: 037 Relationship Evidence Taxonomy

**Date**: 2026-05-27

## Local Review

| Finding | Severity | Disposition |
| --- | --- | --- |
| Generated `answer-contract.md` did not provide a reusable taxonomy for relationship kinds. | major | accepted/fixed with `Relationship Evidence Taxonomy` section in `internal/contextprep/contextprep.go` and focused test expectations in `internal/app/app_test.go` |
| Docs separated evidence states and relationship detection, but did not present the product-level relationship-kind/evidence-type matrix in one place. | major | accepted/fixed in `docs/evidence-model.md` and `docs/relationship-detection.md` |
| SpecKit helper scripts selected stale `034` unless `SPECIFY_FEATURE_DIRECTORY` was set. | minor | accepted/recorded in status reconstruction; no repo script change in this slice |

## Requirements Coverage

- FR-001: implemented in `docs/evidence-model.md` and generated
  `answer-contract.md`.
- FR-002: implemented through relationship kind tables in docs and generated
  output.
- FR-003: implemented through hard boundary wording and focused test.
- FR-004: implemented through explicit runtime topology `not_assessed`
  wording.
- FR-005: implemented through the answer-contract question family and taxonomy
  guidance.
- FR-006: implemented through generated guidance requiring relationship kind
  and evidence type.

## Review Lanes

- local repo-grounded review: verified through direct inspection and focused
  tests.
- `openrouter/deepseek/deepseek-v4-pro`: assessed; no findings.
- `zai/glm-5.1`: assessed; one minor test-strength finding accepted/fixed by
  anchoring taxonomy keyword assertions to the generated taxonomy section.
- `openrouter/minimax/minimax-m2.7`: not_assessed; exact model ID is absent
  from `~/.pi/agent/settings.json`, and no silent substitution was used.

## PR Review Findings

| Lane | Status | Disposition |
| --- | --- | --- |
| local repo-grounded PR review | assessed | no blockers; PR diff scope matches spec 037 |
| `openrouter/deepseek/deepseek-v4-pro` | assessed | minor findings accepted/fixed where useful: generated table now includes evidence type, docs tables are aligned, data-model naming note added, taxonomy test reports all missing section keywords |
| `openrouter/qwen/qwen3.6-plus` | failed | provider returned invalid request error before producing review output; not counted as clean evidence |
| `openrouter/~google/gemini-pro-latest` | not_assessed | exact model ID absent from `~/.pi/agent/settings.json`; no silent substitution used |
| `openrouter/qwen/qwen3.6-max-preview` | failed | provider returned the same invalid request error before producing review output; not counted as clean evidence |
| `openrouter/moonshotai/kimi-k2.6` | assessed-late | output arrived after bounded wait; minor wording/test/task/closeout findings accepted/fixed |
| `minimax/MiniMax-M2.7` | failed | direct provider returned `404 page not found`; not counted as clean evidence |
| `zai/glm-5.1` | assessed | third assessed PR review lane; major task-ledger finding and minor contract wording/fidelity findings accepted/fixed |
| `openrouter/xiaomi/mimo-v2.5-pro` | assessed | third independent model family review; minor generated-contract question example and review-gate wording findings accepted/fixed |

## Status

Local implementation is complete. PR #17 is ready-for-review after at least
three assessed non-GPT model families were recorded: DeepSeek, GLM, Xiaomi
Mimo, and late Kimi.
GitHub checks are
absent/not_assessed. Merge readiness remains not_assessed until explicit merge
approval.
