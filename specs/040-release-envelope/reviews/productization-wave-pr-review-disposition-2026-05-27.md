# Productization Wave PR Review Disposition

Date: 2026-05-27

Branch: `codex/productization-delivery-integration`

Base: `origin/main`

Scope: P5-040 through P5-044 integrated diff.

## Lane Status

| Lane | Status | Notes |
| --- | --- | --- |
| `openrouter/deepseek/deepseek-v4-flash` | assessed | No blocking findings. Reported minor risks around runtime observation branching, query streaming, packet renderer regression coverage, release install smoke, and residual `not_assessed` surfaces. |
| `openrouter/minimax/minimax-m2.7` | assessed | First attempt failed provider reasoning negotiation; rerun with `--thinking low` produced a usable review. No blocking findings. Reported `blackbox.Normalize` visibility from diff as a major review concern but accepted it as non-blocking with local verification. |
| `openrouter/~google/gemini-flash-latest` | assessed | No blocking findings. Raised one major concern about unrestricted producer confidence-map keys and minor/residual runtime/query boundaries. |
| `openrouter/xiaomi/mimo-v2.5-pro` | assessed | No blocking findings. Reported minor risks; one accepted CI coverage improvement was fixed in this branch. |
| `kimi-coding/kimi-for-coding` | degraded, not counted | Output included useful diff-grounded findings, but also emitted pseudo tool-call blocks and claimed verification it could not have performed in a no-tools lane. Findings were locally reviewed, but the lane is not counted toward the three assessed lanes. |
| `zai/glm-5.1` | not_assessed | Emitted a pseudo tool-call block and did not produce review findings. |
| `openrouter/minimax/minimax-m2.7` first attempt | failed | Provider rejected the request because reasoning was mandatory for the endpoint. Replaced by the assessed MiniMax rerun with `--thinking low`. |

No GPT-family model was counted as independent review evidence.

## Findings Disposition

| Finding | Source lanes | Disposition |
| --- | --- | --- |
| `blackbox.Normalize` not visible enough from diff review | Kimi degraded, MiniMax | Rejected as blocker. Locally verified `internal/blackbox/blackbox.go` defines `Normalize`; `go test -count=1 ./internal/app ./internal/query ./internal/adapter` passed after review. |
| Confidence-map producer keys are not globally restricted | Gemini | Rejected as current-scope blocker. The adapter contract is intentionally generic and allows profile-specific producer states; `docs/adapter-contracts/graphify-profile.md` explicitly maps missing or unrecognized Graphify states to `cannot_verify` for future import work. A future profile-specific importer may add stricter producer vocab checks. |
| CI validates schemas but not adapter-contract fixtures | MiMo | Accepted and fixed. `.github/workflows/ci.yml`, `docs/release.md`, `specs/040-release-envelope/contracts/release-envelope.md`, and `TestCIWorkflowRunsReleaseEnvelopeBaseline` now validate `testdata/oss-adapter-contract/*.json` with `jq empty`. |
| Query reads all `findings.jsonl` before filtering | DeepSeek, MiniMax | Accepted as residual risk. Current query surface is bounded by output limit but not optimized for very large findings files; streaming pre-filter remains future work. |
| Packet renderer and prompt/secret escaping need broader future coverage | DeepSeek, Kimi degraded | Accepted as residual risk. Existing focused tests cover representative current paths; broad adversarial fuzzing remains `not_assessed`. |
| UI Cursor/Composer, OpenCode, external target, multi-repo, black-box acceptance lanes remain unassessed | all assessed lanes | Accepted and already reflected in product claims and acceptance docs. Do not broaden claims from the Codex self-target lane. |
| GitHub-hosted CI execution remains unassessed until PR checks run | all assessed lanes | Accepted. PR publication and check observation are required before any ready-to-merge claim. |

## Local Follow-Up Verification

- `verified`: `rg -n 'func Normalize|allowedEvidenceStates|isObservedEvidenceState|normalizeBundle|ModeSymlink|runtimeSubjectID' internal/blackbox/blackbox.go internal/adapter/adapter.go internal/query/query.go`
- `verified`: `go test -count=1 ./internal/adapter ./internal/query ./internal/app`
- `verified`: `go test -count=1 ./internal/app -run TestCIWorkflowRunsReleaseEnvelopeBaseline`
- `verified`: `jq empty schema/*.json testdata/oss-adapter-contract/*.json`
- `verified`: `git diff --check`

## Review Result

PR-level independent review evidence is sufficient for a ready-for-review PR
after local baseline and GitHub PR checks are observed. The branch is not
ready-to-merge until GitHub checks and human/GitHub approval are assessed.
