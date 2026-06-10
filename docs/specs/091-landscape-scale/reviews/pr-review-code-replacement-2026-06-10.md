# PR #64 — code lane (replacement)

- **Lane**: code-reviewer
- **Requested model**: `kimi-for-coding/k2p6`
- **Actual harness**: `ce-maintainability-reviewer` (codex-subagent crashed; opencode timeout)
- **Status**: assessed (replacement)
- **Verdict**: partial → fixes applied

## Accepted findings (fixed)

| Severity | File | Fix |
| --- | --- | --- |
| P1 | `build-orient-bundle.sh:137` | dep-hub sentinel path |
| P1 | `orient-wizard.sh:45` | `require_opt_value` for value flags |
| P2 | `orient-wizard.sh:90` | shard gap status `cannot_verify` |
| P2 | `build-orient-bundle.sh:173` | integer validation for budgets |
| P2 | `viewer/src/app.js:104` | dep-hub bypasses repo filter |
| P2 | `build-orient-bundle.sh:222` | gap budget cap |
| P3 | `orient-wizard.sh:404` | node check only when viewer starts |

## Deferred (not blocking MVP)

- repo_slug basename collision (multi-repo same name)
- duplicated discover_repos logic
- severity-rank duplication across jq/viewer
- source preview line metadata
- port parseInt validation
- smoke sleep → retry poll
- install_tool eval pattern (hardcoded cmds only today)
