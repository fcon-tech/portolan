# Model Lane Policy And Candidates

**Date**: 2026-05-27

## Rule

Each implementation or PR review iteration requires three assessed independent
model review lanes. Failed, empty, hung, unavailable, malformed, stale,
off-topic, or `not_assessed` lanes do not count. GPT-family models do not count
as independent review evidence because Codex itself is GPT-family.

If a default lane fails, the reviewer must select an explicit enabled non-GPT
replacement and record:

- original lane;
- failure reason;
- replacement lane;
- whether the replacement produced actionable review output.

## Current Enabled Non-GPT Models

From `~/.pi/agent/settings.json`:

- `openrouter/deepseek/deepseek-v4-pro`
- `openrouter/qwen/qwen3-coder:free`
- `openrouter/qwen/qwen3.6-max-preview`
- `openrouter/qwen/qwen3.6-plus`
- `openrouter/xiaomi/mimo-v2.5-pro`
- `openrouter/moonshotai/kimi-k2.6`
- `kimi-coding/kimi-for-coding`
- `kimi-coding/kimi-k2-thinking`
- `minimax/MiniMax-M2.7`
- `zai/glm-5.1`
- `zai/glm-5-turbo`

## Observed In PR #17

| Lane | Result | Counts? | Notes |
| --- | --- | --- | --- |
| `openrouter/deepseek/deepseek-v4-pro` | assessed | yes | produced actionable review |
| `zai/glm-5.1` | assessed | yes | produced actionable review |
| `openrouter/qwen/qwen3.6-plus` | failed | no | provider rejected request before output |
| `openrouter/qwen/qwen3.6-max-preview` | failed | no | provider rejected request before output |
| `openrouter/moonshotai/kimi-k2.6` | assessed-late | yes | output arrived after bounded wait; useful but latency is risky |
| `minimax/MiniMax-M2.7` | failed | no | returned `404 page not found` |
| `openrouter/xiaomi/mimo-v2.5-pro` | assessed | yes | produced actionable review; useful fallback lane |

## OpenRouter Candidates To Enable Or Smoke

Live OpenRouter model listing on 2026-05-27 showed these relevant non-GPT
candidates:

- `openrouter/minimax/minimax-m2.7`: enable this exact OpenRouter ID and smoke
  it; direct `minimax/MiniMax-M2.7` still fails with 404.
- `openrouter/~google/gemini-pro-latest`: enable because repo PR workflow
  already names it as a default lane and OpenRouter lists it.
- `openrouter/google/gemini-3.1-pro-preview`: smoke as a concrete Gemini
  fallback if the alias is unavailable or unstable.
- `openrouter/anthropic/claude-sonnet-4.6`: strong non-GPT reviewer candidate
  if budget/access allow.
- `openrouter/anthropic/claude-haiku-4.5`: cheaper non-GPT fallback for
  lower-risk docs/process reviews.
- `openrouter/qwen/qwen3.7-max`: promising Qwen replacement, but Qwen provider
  errors in this run mean it must be smoke-tested before becoming default.
- `openrouter/moonshotai/kimi-k2.6`: enabled and eventually assessed, but
  latency exceeded the bounded wait; keep as fallback until reliability improves.

## Recommended Default Set

Use these as the next non-GPT review pool after smoke tests:

1. `openrouter/deepseek/deepseek-v4-pro`
2. `zai/glm-5.1`
3. `openrouter/minimax/minimax-m2.7`
4. `openrouter/~google/gemini-pro-latest`
5. `openrouter/anthropic/claude-sonnet-4.6`
6. `openrouter/xiaomi/mimo-v2.5-pro`

Keep Qwen as fallback/experimental until provider errors are revalidated. Keep
Kimi as a slower fallback unless bounded prompt latency improves.
