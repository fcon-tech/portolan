# Final Documentation PI Review Disposition

Date: 2026-05-28

Scope:

- `README.md`
- `docs/ru/README.md`
- `docs/product-boundary.md`
- `docs/ru/product-boundary.md`
- `docs/agent/INSTALL.md`
- `docs/agent/INSTALL.ru.md`
- `docs/agent/INSTALL-PROMPT.md`
- `docs/agent/INSTALL-PROMPT.ru.md`
- `docs/agent/QUICKSTART.md`
- `docs/agent/ACCEPTANCE.md`
- `docs/product-claims.md`
- `docs/oss-composition.md`
- `docs/release.md`
- `docs/product-backlog.md`

## Review Lanes

| Lane | Model | State | Evidence |
| --- | --- | --- | --- |
| Opus latest | `openrouter/~anthropic/claude-opus-latest` | `verified` | `pi --no-tools --no-context-files --no-session --model openrouter/~anthropic/claude-opus-latest ...` exited 0 and wrote `/tmp/portolan-doc-review-opus.txt`. |
| Gemini Pro latest | `openrouter/~google/gemini-pro-latest` | `verified` | Initial run failed because reasoning was mandatory; rerun with `--thinking medium` exited 0 and wrote `/tmp/portolan-doc-review-gemini.txt`. |
| DeepSeek V4 Pro | `openrouter/deepseek/deepseek-v4-pro` | `verified` | `pi --no-tools --no-context-files --no-session --model openrouter/deepseek/deepseek-v4-pro ...` exited 0 and wrote `/tmp/portolan-doc-review-deepseek.txt`. |

Focused re-review after fixes also ran through the same three requested lanes:

- `openrouter/~anthropic/claude-opus-latest`: `verified`, no critical or major
  issues remained; four minor polish observations were reported in
  `/tmp/portolan-doc-rereview-opus.txt`.
- `openrouter/~google/gemini-pro-latest`: `verified` with `--thinking medium`,
  no critical or major issues remained; no actionable blocker reported in
  `/tmp/portolan-doc-rereview-gemini.txt`.
- `openrouter/deepseek/deepseek-v4-pro`: `verified`, no critical or major
  issues remained; two minor polish observations were reported in
  `/tmp/portolan-doc-rereview-deepseek.txt`.

## Findings And Disposition

| Finding | Source lane | Disposition | Fix |
| --- | --- | --- | --- |
| README Quick Start lacked a clone path and newcomer install entry. | Opus, DeepSeek | accepted / fixed | Added `git clone https://github.com/fall-out-bug/portolan.git`, `cd portolan`, `--help`, and Go prerequisite language to `README.md`; mirrored in `docs/ru/README.md`. |
| README's short agent instruction competed with the canonical install prompt. | Opus, DeepSeek | accepted / fixed | `README.md` now points users to the copyable `docs/agent/INSTALL-PROMPT.md` block as the safest reusable instruction before showing the shorter form. |
| English and Russian overview structure drifted. | Opus | accepted / fixed | Added language switch links, `Когда Использовать`, `Что Получится`, artifact trees, and `Текущие Ограничения` to `docs/ru/README.md`; standardized README output paths to `<output-dir>/context` and `<output-dir>/map`. |
| English install docs missed an explicit `cd` before source bootstrap. | Gemini | accepted / fixed | Added `cd <portolan-checkout>` to `docs/agent/INSTALL.md` and `docs/agent/QUICKSTART.md`. |
| Install docs lacked success and failure guidance after bootstrap. | Opus, DeepSeek | accepted / fixed | Added version-command success expectation and troubleshooting pointer to `docs/agent/INSTALL.md`. |
| Selection validation fallback was unspecified. | Opus | accepted / fixed | Added `failed` validation recording and `map --root` fallback language to `docs/agent/INSTALL.md`, `docs/agent/INSTALL.ru.md`, `docs/agent/INSTALL-PROMPT.md`, `docs/agent/INSTALL-PROMPT.ru.md`, and `docs/agent/QUICKSTART.md`. |
| OpenCode/default-permission failures need a friendlier output fallback. | Gemini | accepted / fixed | Added repo-local `.portolan/runs/<target-name>` fallback rule to English and Russian install prompts when a harness rejects writes to `OUTPUT_PATH`. |
| OSS producer docs did not say clearly what is bundled vs externally installed. | Opus | accepted / fixed | `docs/agent/INSTALL.md`, `docs/agent/INSTALL.ru.md`, and `docs/oss-composition.md` now state that scanners are optional local dependencies, must be approved, and should be verified on `PATH`; upstream entry points are listed. |
| English product boundary lacked the Russian OSS-as-solution and limits sections. | local consistency review | accepted / fixed | Added matching English sections to `docs/product-boundary.md`. |
| Prompt should infer missing `PORTOLAN_PATH`, `TARGET_PATH`, or `OUTPUT_PATH` placeholders. | Gemini | rejected narrower | Inferring target paths risks hidden scope changes. The docs still require explicit local paths. Only write-permission fallback is allowed after a concrete `OUTPUT_PATH` is rejected. |
| Russian variables should be localized. | DeepSeek | rejected | Kept `PORTOLAN_PATH`, `TARGET_PATH`, and `OUTPUT_PATH` stable across languages because they are the shared agent contract; added Russian placeholder explanation in `docs/ru/README.md`. |
| README should mention bootstrap troubleshooting and network opt-in. | Opus re-review | accepted / fixed | Added troubleshooting and `PORTOLAN_BOOTSTRAP_ALLOW_NETWORK=1` pointers to `README.md` and `docs/ru/README.md`. |
| README short prompt should point Russian skimmers to the Russian prompt. | Opus re-review | accepted / fixed | Added a direct `docs/agent/INSTALL-PROMPT.ru.md` pointer near the short agent instruction in `README.md`. |
| Russian quickstart was missing. | DeepSeek re-review | accepted / fixed | Added `docs/agent/QUICKSTART.ru.md` and linked it from `README.md`. |
| Russian README should mention Graphify staging-copy safety. | DeepSeek re-review | accepted / fixed | Added Graphify read-only staging-copy wording to `docs/ru/README.md`. |

## Verification Status

- Review evidence: `verified` for all three requested pi lanes and focused
  re-review lanes.
- Docs consistency fixes: implemented locally, including re-review minor
  findings.
- Remaining product limits: preserved in `docs/product-claims.md` and `docs/agent/ACCEPTANCE.md`.
