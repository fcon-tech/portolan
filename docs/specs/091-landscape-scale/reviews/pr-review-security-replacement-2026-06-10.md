# PR #64 — security lane (replacement)

- **Lane**: security-reviewer
- **Requested model**: `minimax/MiniMax-M2.7`
- **Actual harness**: `ce-security-reviewer` (codex-subagent background runs died without result)
- **Status**: assessed (replacement)
- **Verdict**: partial → P0 fixed

## Accepted findings (fixed)

| ID | Severity | Fix |
| --- | --- | --- |
| SEC-001 | P0 | `/source`: `lstatSync` rejects symlinks; `realpathSync` re-check under repo roots |
| SEC-002 | P1 | static dist guard uses `path.resolve` + trailing separator |
| SEC-003 | P1 | accepted risk: repos.json trusted (local bundle operator model) |

## Not exploitable / accepted

- SEC-004: producer paths bounded by serve guard
- SEC-005/006/007: eval/curl|sh only on operator consent; quoted repo paths

## Test added

- `harness-portolan-smoke.sh`: symlink `leak-outside` → `/etc/passwd` returns 403
