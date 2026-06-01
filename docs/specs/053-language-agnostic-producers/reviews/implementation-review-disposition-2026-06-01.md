# Implementation Review Disposition

Date: 2026-06-01

Spec: `docs/specs/053-language-agnostic-producers/`

Branch: `codex/053-language-agnostic-producers`

## Implementation State

verified:

- Producer-family JSONL fixtures added under
  `internal/testfixtures/language-agnostic-producers/`.
- `schema/producer-family.schema.json` added for recommendation, evaluation,
  and coverage records.
- `internal/producerfamily` validates recommendation/evaluation/coverage
  records with allow-listed fields and enum values.
- `context prepare` emits `producer-recommendation` records with
  `status: not_assessed`, `evidence_state: not_assessed`, and candidate tools
  represented as objects with `verification_state` and `support_state`.
- `context prepare` emits repository-scoped `producer-coverage` records without
  upgrading manifest visibility into language or producer support.
- `context prepare` loads local producer evaluation records from bounded local
  input files, scopes them to landscape or repository context, and does not
  score, rank, probe, install, fetch, or run producer tools.
- Symlinked producer-family input files and directories are not followed.
- Mixed producer-family files produce a `not_assessed` diagnostic gap for valid
  non-evaluation records that this slice does not promote.
- `answer-contract.md` and `query-plan.md` guide agents to treat recommendations
  as options, not observed evidence, and to inspect producer coverage before
  mixed-language claims.

not_assessed:

- Real local producer outputs beyond the 052 dependency/symbol fixtures.
- Cursor + Composer 2.5 stress for this 053 implementation slice.
- GitHub checks for this branch after implementation.

## Local Verification

verified:

- `go test -count=1 ./...`
- `go vet ./...`
- `jq empty schema/*.json internal/testfixtures/oss-adapter-contract/*.json internal/testfixtures/language-agnostic-producers/*.jsonl .specify/feature.json`
- `git diff --check`
- `go run ./cmd/portolan context prepare --help`

## Review Lanes

| Lane | Model | Result | Counted |
| --- | --- | --- | --- |
| Kimi | `kimi-coding/kimi-for-coding` | timed out with empty artifact | no, `not_assessed` |
| GLM | `zai/glm-5.1` | off-task file-read request | no, `not_assessed` |
| MiMo | `openrouter/xiaomi/mimo-v2.5-pro` | off-task tool-call request | no, `not_assessed` |
| DeepSeek | `openrouter/deepseek/deepseek-v4-pro` | `pass_with_changes` | yes |
| MiniMax | `minimax/MiniMax-M2.7` | provider 404 | no, failed before review |
| Qwen | `openrouter/qwen/qwen3.6-plus` | provider 400 | no, failed before review |
| GLM Turbo | `zai/glm-5-turbo` | `pass_with_changes` | yes |
| Kimi OpenRouter | `openrouter/moonshotai/kimi-k2.6` | returned only `not_assessed` | no, `not_assessed` |
| Kimi Thinking | `kimi-coding/kimi-k2-thinking` | `pass_with_changes` | yes |
| DeepSeek post-fix | `openrouter/deepseek/deepseek-v4-pro` | `pass_with_changes` with minor follow-ups only | focused re-review |

Three assessed independent non-GPT lanes are available: DeepSeek, GLM Turbo,
and Kimi Thinking. Failed, empty, timed-out, or off-task lanes are recorded but
not counted.

## Findings Disposition

| Finding | Source | Disposition |
| --- | --- | --- |
| `producer-recommendation` may lack `evidence_state` in schema. | DeepSeek, Kimi Thinking | Rejected with local evidence. `schema/producer-family.schema.json` and `producerfamily.RecommendationRecord` include `evidence_state`; generated recommendation tests validate the output with `producerfamily.ValidateJSON`. |
| Coverage may overextend manifest visibility into repository or language support. | Kimi Thinking | Rejected with local evidence. Coverage records are generated from missing producer gaps as `not_assessed`; tests include PHP/JVM manifest files and verify `languages_in_scope` remains empty for unassessed coverage. |
| Evaluation file discovery could overread root-level records as repository support. | GLM Turbo | Accepted and fixed. Loaded evaluation records now carry `scope` and `scope_detail`; root inputs are landscape-scoped and repository-local inputs are repository-scoped. |
| Candidate tool `verification_state` and `support_state` can be conflated. | GLM Turbo | Accepted and fixed. `answer-contract.md` now tells agents to check both fields independently. |
| Symlinked producer-family input paths could be followed. | Kimi Thinking | Accepted and fixed. Producer-family input scanning uses `os.Lstat` and skips symlinked directories and files; a regression test covers symlinked input files. |
| Valid non-evaluation records in `producer-family-records.jsonl` are silently ignored. | DeepSeek, GLM Turbo | Accepted and fixed. The context pack now emits a scoped `not_assessed` diagnostic gap when valid non-evaluation records are present in a local producer-family input file. |
| Diagnostic gap for ignored non-evaluation records may lack scope. | DeepSeek post-fix | Accepted and fixed. The diagnostic gap now carries `scope` and `scope_detail`; a focused test covers root landscape scope. |
| Symlink skips could be silent for users intentionally sharing producer records by symlink. | DeepSeek post-fix | Deferred minor follow-up. Current behavior is safer for local-first path boundaries; adding a user-facing warning can be handled in a later output-diagnostics slice. |

## Stop Status

Implementation is locally complete for spec 053. PR readiness work has not
started yet; GitHub checks and PR state remain `not_assessed`.
