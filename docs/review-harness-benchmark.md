# Review Harness And Model Roster

Date: 2026-05-27

## Decision

Use `pi` as the default Portolan review harness for durable review evidence.
Use `omp` for interactive agent work, sub-agent orchestration, or cases where
its tool surface is explicitly needed. Do not count an `omp` lane as equivalent
review evidence until its credentials, model resolution, and non-interactive
output are smoke-tested in the current environment.

Rejected alternatives:

- `omp` as default review harness: richer agent surface, but this environment
  did not have OpenRouter credentials wired into `omp`, and `omp --list-models
  glm` hung during local inspection.
- model text as enough evidence: rejected. Portolan review evidence needs
  runnable harness evidence, raw output, and disposition.

Why now: previous repo defaults were narrower than the desired reviewer roster
and mixed stale lane behavior into policy.

Reversibility: high. This is a repo-local operating rule and can be adjusted as
provider behavior changes.

Risk if wrong: wasted review time, false confidence from degraded lanes, or
over-spending heavyweight reviewers on routine changes.

Confidence: medium. The recommendation is based on local CLI inspection, current
`~/.pi/agent/settings.json`, existing Portolan review artifacts, and short smoke
tests, not a full multi-model benchmark run.

## Model Roster

Routine review lanes:

| Preferred lane | Fallback lane | Notes |
| --- | --- | --- |
| `minimax/MiniMax-M2.7` | `openrouter/minimax/minimax-m2.7` | Direct lane returned `404 page not found` in local smoke and prior Portolan review. OpenRouter fallback passed a short smoke. |
| `kimi-coding/kimi-for-coding` | `openrouter/~moonshotai/kimi-latest` | Direct lane passed a short review smoke. |
| `zai/glm-5.1` | `openrouter/z-ai/glm-5.1` | Direct lane passed a short review smoke. |
| `openrouter/xiaomi/mimo-v2.5-pro` | `openrouter/auto` | Listed by `pi`; not yet quality-smoked for review. |
| `openrouter/qwen/qwen3.6-plus` | `openrouter/auto` | Listed by `pi`, but local smoke returned a provider role error through `pi`; do not count until fixed or re-smoked. |
| `openrouter/deepseek/deepseek-v4-flash` | `openrouter/auto` | Passed a short smoke through `pi`. |
| `openrouter/~google/gemini-flash-latest` | `openrouter/auto` | Listed by `pi`; reserve when Google lane is needed and smoke first. |
| `openrouter/~anthropic/claude-sonnet-latest` | `openrouter/auto` | Listed by `pi`; reserve for higher-value review slots. |

Final fallback:

- `openrouter/auto`: use only after the same-family fallback fails or when the
  goal is generic sanity review. Record it as a fallback lane, not as evidence
  for the originally requested model.

Serious or risky review lanes:

| Lane | Use when |
| --- | --- |
| `openrouter/qwen/qwen3.7-max` | broad code/spec critique where Qwen diversity is useful. |
| `openrouter/~anthropic/claude-opus-latest` | highest-risk correctness, security, trust, or executive-facing decisions. |
| `openrouter/~google/gemini-pro-latest` | large-context cross-artifact review, but smoke first because prior Portolan lanes sometimes returned unusable file-access complaints. |
| `openrouter/deepseek/deepseek-v4-pro` | deep code/spec review, evidence semantics, and path/output safety. |

## Harness Assessment

`pi` strengths:

- Uses the existing Portolan review pattern and `pi-review` discipline.
- Has `--no-tools`, `--no-context-files`, `--no-session`, and explicit
  provider/model selection for bounded review lanes.
- Shares the current local allowlist in `~/.pi/agent/settings.json`.
- Existing Portolan review artifacts already use `pi` and record lane
  degradation cleanly.

`pi` weaknesses:

- Some OpenRouter models can fail at provider/harness boundaries even when they
  are listed. On 2026-05-27, `openrouter/qwen/qwen3.6-plus` returned a role
  compatibility error through `pi`.
- It is less useful for interactive multi-step agent operation than `omp`.

`omp` strengths:

- Better interactive agent surface: model cycling, smol/slow/plan roles,
  sub-agents, plugins, LSP/browser tools, and richer session workflows.
- Useful for exploratory agent work or when a reviewer needs a tool-enabled
  investigation rather than a bounded no-tools review.

`omp` weaknesses:

- In this environment, `omp` did not see OpenRouter credentials during smoke.
- `omp --list-models glm` hung during local inspection on 2026-05-27.
- Tool-rich defaults make it easier to blur independent review evidence with
  agent execution unless `--no-tools --no-session` is enforced.

## Benchmark Plan

Run three benchmark tiers before changing defaults again:

1. Speed smoke:
   - prompt: minimal JSON echo and one tiny code-review bug;
   - models: every routine lane plus its fallback;
   - metrics: exit status, elapsed seconds, time to first usable output if
     available, output parseability, and provider error class.

2. Review quality:
   - prompt: fixed Portolan diff packet with seeded issues across evidence
     states, path/output safety, schema compatibility, CLI UX, and test gaps;
   - metrics: accepted seeded findings found, false positives, citation quality,
     preservation of `unknown`/`not_assessed`, and actionable fix quality.

3. Robustness:
   - prompt sizes: small, medium spec packet, large PR packet;
   - metrics: timeout rate, empty/off-topic rate, context-following failures,
     and whether retry with a shorter bounded prompt recovers the lane.

Suggested timeouts:

| Benchmark | First attempt | Retry |
| --- | ---: | ---: |
| Speed smoke | 90s | no retry |
| Focused small review | 6m | 3m shortened prompt |
| Normal implementation slice review | 10m | 5m shortened prompt |
| Large PR/spec packet | 15m | 7m shortened prompt |
| High-stakes serious lane | 20m | 10m shortened prompt |

## Prompting Rules

- Always make the review plane explicit: code correctness, requirements fit,
  evidence/tracing, security/privacy, tests/CI, or UX/DX.
- For no-tools lanes, include all required context in the prompt or attached
  packet. Do not let the model pretend it inspected files it cannot access.
- If a requested lane returns provider errors, requires unsupported reasoning
  negotiation, hangs without output, returns empty output, or asks for tools
  despite a no-tools prompt, record it as `not_assessed` or `failed` and launch
  an explicit enabled non-GPT replacement lane. Do not count the requested lane
  as assessed just because a fallback was attempted.
- Require output fields: `findings`, `severity`, `evidence`, `recommendation`,
  `verdict`, and `not_assessed`.
- Tell reviewers that `unknown`, `cannot_verify`, and `not_assessed` are valid
  outcomes and must not be collapsed into pass/fail.
- Preserve raw output and write a separate disposition. Raw model output is not
  the accepted decision.

## Current Local Evidence

- `pi --list-models` showed the requested OpenRouter Google, Anthropic,
  DeepSeek, MiniMax, Kimi, GLM, Qwen, MiMo, and `openrouter/auto` entries.
- `~/.pi/agent/settings.json` currently enables only a subset of the desired
  roster; Google/Anthropic latest, DeepSeek flash, Qwen 3.7 max,
  OpenRouter GLM fallback, and `openrouter/auto` were listed but not enabled.
- Short `pi` review smoke passed for `zai/glm-5.1` in 10.55s.
- Short `pi` review smoke passed for `kimi-coding/kimi-for-coding` in 15.34s.
- Direct `minimax/MiniMax-M2.7` returned `404 page not found` in 5.72s.
- Short `pi` smoke passed for `openrouter/minimax/minimax-m2.7` in 7.58s.
- On 2026-05-30, direct `minimax/MiniMax-M2.7` again returned
  `404 page not found` during spec 049 review. `openrouter/minimax/minimax-m2.7`
  first failed because reasoning was mandatory for the endpoint, then produced
  no usable output before termination when retried with `--thinking low`.
  Treat MiniMax coverage as `not_assessed` in this environment until a fresh
  smoke succeeds; use an explicit enabled non-GPT replacement lane.
- On 2026-05-30, spec 048 Socratic/full-diff review used
  `openrouter/moonshotai/kimi-k2.6`, `zai/glm-5.1`, and
  `openrouter/xiaomi/mimo-v2.5-pro` as assessed non-GPT lanes. All three
  produced usable review output. `minimax/MiniMax-M2.7` again failed with
  `404 page not found`; `openrouter/qwen/qwen3.6-plus` again returned a
  provider role error; `openrouter/deepseek/deepseek-v4-pro` produced
  tool-request/off-task output under a no-tools prompt. Treat these degraded
  lanes as `failed` or `not_assessed` unless a fresh smoke succeeds.
- Short `pi` smoke passed for `openrouter/deepseek/deepseek-v4-flash` in 9.20s.
- Short `pi` smoke passed for `openrouter/auto` in 8.83s.
- `openrouter/qwen/qwen3.6-plus` returned a provider role error through `pi` in
  18.78s and should not be counted as working until re-smoked.
- `omp` was installed, but an OpenRouter smoke failed because no `omp`
  OpenRouter API key was available.
