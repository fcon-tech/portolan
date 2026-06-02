# Slice Review Disposition

Date: 2026-06-02

Spec: `docs/specs/083-tool-acquisition-guidance/`

## Independent Lanes

| Lane | Model | State | Verdict |
| --- | --- | --- | --- |
| Kimi | `openrouter/moonshotai/kimi-k2.6` | assessed with degraded process text | Found no stack-boundary or evidence-state blockers. Raised schema-contract concern that was locally checked. |
| DeepSeek | `openrouter/deepseek/deepseek-v4-pro` | assessed | Stack-agnostic boundary, evidence honesty, and local-first behavior pass. Raised backward-compat concern for old `oss-plan.json`. |
| Qwen | `openrouter/qwen/qwen3-coder` | assessed | No actionable findings. |

Degraded lanes:

- `openrouter/xiaomi/mimo-v2.5-pro`: returned a tool-call request instead of a
  review verdict; `not_assessed`.
- `minimax/MiniMax-M2.7`: provider id returned 404; `failed`.
- `openrouter/minimax/minimax-m2.7`: endpoint rejected no-reasoning mode;
  `failed`.

## Findings

### F1: `oss-plan.json` schema-contract drift

Sources: Kimi, DeepSeek

Classification: major from reviewers; rejected as current blocker after local
verification.

Local verification:

- `schema/` exists, but there is no committed `schema/oss-plan.json` contract in
  current `origin/main`.
- Current verification command `jq empty schema/*.json` checks committed schema
  syntax only; it does not validate `oss-plan.json` output shape.
- Current code writes `oss-plan.json` but does not consume older context packs
  as a public input contract.

Disposition:

- Rejected as a blocker for this slice.
- Recorded as a future contract-hardening option if `oss-plan.json` becomes a
  formal schema-validated artifact.
- The field is additive and does not remove existing JSON fields.

### F2: Older `oss-plan.json` without `acquisition` may unmarshal with empty fields

Source: DeepSeek

Classification: major from reviewer; rejected as current blocker.

Rationale:

- No current Portolan code path reads old `oss-plan.json` as an input contract.
- The new field is generated for all current tool plans.
- Downstream consumers that ignore unknown fields remain compatible; consumers
  requiring a formal schema need a future `oss-plan` schema/contract slice.

### F3: Availability-string coverage could be stricter

Source: DeepSeek

Classification: minor

Disposition: non-blocking.

Rationale:

- Focused test already verifies Gradle's local-evaluation next action and
  acquisition presence.
- Availability exact strings are less important than evidence-state and
  approval boundaries.

### F4: Gradle/Semgrep remain partial next actions

Sources: Cursor, DeepSeek

Classification: residual, not a 083 defect.

Disposition: accepted as residual.

Rationale:

- 083 makes acquisition guidance explicit; it does not add new bounded native
  commands.
- `not_assessed` plus local-evaluation guidance is the desired boundary for
  tools without safe output-bounded commands.

## Verification

verified:

- `go test ./internal/contextprep`
- `go test ./...`
- `go vet ./...`
- `jq empty schema/*.json`
- `git diff --check`
- Fresh Bigtop context smoke.
- Cursor Agent `composer-2.5` bounded tool-acquisition stress.

not_assessed:

- Actual native producer execution.
- Actual tool install/acquisition.
- Formal JSON Schema validation for `oss-plan.json`, because no such committed
  schema exists in the current repository.
