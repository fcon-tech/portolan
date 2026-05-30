# Pi Review: Opus Latest

Date: 2026-05-30

## Lane

- Harness: `pi`
- Model: `openrouter/anthropic/claude-opus-latest`
- Tools/context files: disabled
- Prompt packet: local tracked diff plus new docs and SpecKit files
- State: `verified`

## Verdict

`APPROVED` for the docs-only slice; merge gating remains `not_assessed`.

## Findings

| ID | Severity | File/path | Finding | Disposition |
| --- | --- | --- | --- | --- |
| OPUS-1 | minor | `docs/onboarding.md` | Install route omits an explicit Troubleshooting pointer. | accepted/fixed |
| OPUS-2 | minor | `specs/045-docs-harness-onboarding/plan.md` | Project structure tree is stale; it omits checklist and later review files. | accepted/fixed |
| OPUS-3 | minor | `specs/045-docs-harness-onboarding/quickstart.md` | Verification command checks broad route text but does not explicitly assert EN/RU quickstart route links. | accepted/fixed |
| OPUS-4 | minor | `docs/ru/README.md` | Russian overview points to English-only onboarding without saying it is English-only. | accepted/fixed |
| OPUS-5 | minor | success criteria | Timed/discoverability success criteria are backed by grep/manual inspection, not a timed reviewer test. | accepted/narrowed; retained as design success criteria, not automated proof |

## Reviewer Notes

- Cursor UI wording is correctly bounded.
- OpenCode default-permission wording correctly preserves repo-local verified behavior and external-output `failed` state.
- No overbroad product claims found.
- SpecKit artifacts are present and internally cross-referenced.

## Not Assessed

- PR review lanes
- GitHub checks for this branch
- Cursor UI execution
- Fresh OpenCode execution after docs changes

## Raw Output Summary

The reviewer returned `APPROVED`, identified no critical or major findings, and stated that the four actionable findings are quality polish rather than blockers before PR review.
