# Review Lane Recovery: OSS Producer Acceptance

Date: 2026-05-27

## Scope

This recovery pass investigated the degraded slice-review lanes recorded for
PR #15 and updated the Portolan review workflow after explicit approval to use
DeepSeek V4 Pro instead of Kimi and OpenRouter MiniMax instead of the direct
MiniMax provider.

## Tool State

| Check | Result |
| --- | --- |
| `pi --version` | `0.75.5` |
| `pi update self` | already up to date |
| `pi update` | packages updated |
| `~/.pi/agent/settings.json` | Kimi, MiniMax, GLM, and OpenRouter MiniMax lanes are enabled |

## Lane Recovery Results

| Lane | State | Evidence |
| --- | --- | --- |
| `kimi-coding/kimi-for-coding` | `replaced` | Smoke prompt returned `OK-KIMI`, but full and narrowed review prompts timed out after 180 seconds without output. Replaced by `openrouter/deepseek/deepseek-v4-pro` after explicit approval. |
| `openrouter/deepseek/deepseek-v4-pro` | `verified` | Smoke prompt returned `OK-DEEPSEEK`; review prompt over the code diff returned `NO FINDINGS`. |
| `minimax/MiniMax-M2.7` | `failed` | Direct provider returned `404 404 page not found`; JSON mode showed provider `minimax`, model `MiniMax-M2.7`, API `anthropic-messages`, token usage 0, and `stopReason: error`. |
| `minimax/MiniMax-M2.7-highspeed` | `failed` | Direct provider returned `404 404 page not found`. |
| `minimax/MiniMax-Text-01` | `failed` | Direct provider returned `401 invalid api key (2049)`. |
| `openrouter/minimax/minimax-m2.7` | `verified` | Smoke prompt returned `OK-OR-MINIMAX`; review prompt over the code diff returned `NO FINDINGS`. |
| `zai/glm-5.1` | `verified` with findings | Smoke prompt returned `OK-GLM`; review prompt returned substantive findings. |

## GLM Finding Disposition

| Finding | Disposition | Reason |
| --- | --- | --- |
| `input_present` assertion may be vacuous | `rejected` | `buildOSSPlan` always includes a CycloneDX plan and `markInputPresent` sets `input_present` when `toolFamiliesPresent` sees CycloneDX in `tool-registry.json`; the current test exercises this path. |
| Duplicate detection when both root and output `tool-outputs` are scanned | `rejected` for current slice | Exact duplicate candidate paths are deduplicated by path. Root-level `tool-outputs` and context-local `<out>/tool-outputs` are distinct evidence sources when both exist. No duplicate was observed in the verified Bigtop context pack. |
| Nested `tool-outputs` are silently skipped | `accepted` as follow-up, not blocker | Current generated producer commands write top-level JSON files. Recursive producer output preservation is a broader contract decision and should be specified before implementation. |
| Additional symlink and nested-output tests | `accepted` as follow-up, not blocker | Symlink guards exist for the output directory and regular files are required before copying. More focused tests are useful but not required to validate the current top-level producer output contract. |

## Workflow Change

The default Portolan slice-review lanes are now:

```text
openrouter/deepseek/deepseek-v4-pro
openrouter/minimax/minimax-m2.7
zai/glm-5.1
```

`kimi-coding/kimi-for-coding` must not be treated as restored until it completes
a bounded review prompt without timing out and is explicitly re-approved.
The direct `minimax/MiniMax-M2.7` lane must not be treated as restored until it
passes a direct smoke test and is explicitly re-approved.

## Stop State

Review infrastructure is restored for the default three-lane slice-review set:

- DeepSeek V4 Pro replaces the degraded Kimi lane.
- MiniMax slice review is restored through the approved OpenRouter lane.
- GLM slice review is restored.
- Kimi remains degraded for review prompts and is no longer a default lane.
