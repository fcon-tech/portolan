# Pi Review Disposition: Docs And Harness Onboarding

Date: 2026-05-30

## Scope

- Review source: `pi` lanes requested by user
- Feature: `specs/045-docs-harness-onboarding/`
- Branch: `codex/045-docs-harness-onboarding`

## Lanes

| Lane | Model | State | Verdict |
| --- | --- | --- | --- |
| Opus latest | `openrouter/anthropic/claude-opus-latest` | `verified` | `APPROVED` |
| Gemini Pro latest | `openrouter/google/gemini-pro-latest` | `verified` | `APPROVED` |

## Findings

| ID | Source | Decision | Evidence | Action |
| --- | --- | --- | --- | --- |
| OPUS-1 | Opus | accepted/fixed | `docs/onboarding.md` install section | Added `docs/agent/TROUBLESHOOTING.md` pointer. |
| OPUS-2 | Opus | accepted/fixed | `specs/045-docs-harness-onboarding/plan.md` structure tree | Updated tree with checklist and review files. |
| OPUS-3 | Opus | accepted/fixed | `specs/045-docs-harness-onboarding/quickstart.md` verification section | Added explicit route-link grep for README, RU README, and EN/RU quickstarts. |
| OPUS-4 | Opus | accepted/fixed | `docs/ru/README.md` onboarding section | Added note that onboarding route is currently English while Russian agent prompts remain under `docs/agent/`. |
| OPUS-5 | Opus | accepted/narrowed | `specs/045-docs-harness-onboarding/spec.md` success criteria | Kept as reviewer-facing success criteria; not claimed as automated timed measurement. |
| GEMINI-1 | Gemini | accepted/no-change | `docs/onboarding.md`, `docs/agent/INSTALL-PROMPT.md` | Redundancy retained to protect operator UX. |
| GEMINI-2 | Gemini | accepted/no-change | `README.md`, `docs/ru/README.md` | Redundant links retained for discoverability. |

## Verification

- `verified`: Opus latest lane produced usable review output after complete packet retry.
- `verified`: Gemini Pro latest lane produced usable review output after explicit reasoning retry.
- `verified`: accepted fixes applied.
- `not_assessed`: PR review state and GitHub checks.

## Remaining Risk

- Review evidence is not merge approval.
- Cursor UI and fresh OpenCode runtime execution remain `not_assessed`.
