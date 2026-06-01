# OpenSSF Best Practices Follow-Up Review Disposition

**Date**: 2026-05-31

**Branch**: `codex/048-openssf-best-practices-assessment`

## Scope

Focused review of the OpenSSF Best Practices self-assessment follow-up:

- add `go vet ./...` to CI and public contributor/release checks;
- record a passing-badge readiness evidence packet;
- preserve badge honesty by not adding Best Practices or Scorecard badges until
  the external services produce real badge states.

## Review Lanes

| Lane | State | Result |
| --- | --- | --- |
| `openrouter/moonshotai/kimi-k2.6` | `assessed` | No blockers; minor findings on PR template wording, CI ordering, and avoiding overclaiming `go vet`. |
| `zai/glm-5.1` | `assessed` | No blockers; minor finding that PR template should say `.go files changed`, not behavior only. |
| `openrouter/xiaomi/mimo-v2.5-pro` | `assessed` | No blockers; minor findings on CI ordering and PR template conditionality. |

## Findings

| Finding | Disposition |
| --- | --- |
| PR template says `go vet` only when Go behavior changed, but vet should run for any Go source change. | `accepted/fixed`; PR template now says `if Go files changed`. |
| CI runs `go test` before faster `go vet`, wasting time on static failures. | `accepted/fixed`; CI now runs `go vet ./...` before `go test -count=1 ./...`. |
| Adding raw `go vet ./...` could be overclaiming static-analysis strength. | `accepted as residual risk`; assessment still cites CodeQL and Semgrep separately and does not claim broad security certification. No extra vet config added. |
| No Best Practices or Scorecard badge is added. | `accepted`; this is intentional until external badge state exists. |

## Verification After Fixes

| Check | State |
| --- | --- |
| `go test ./...` | `verified` |
| `go vet ./...` | `verified` |
| `jq empty schema/*.json` | `verified` |
| `git diff --check` | `verified` |
| YAML parse for issue templates and workflows | `verified` |
