# PR #66 review disposition — 2026-06-11

**Head**: `71d471f` (refactor orient purge + prior 093 viewer commits)  
**PR**: https://github.com/fcon-tech/portolan/pull/66

## Verification

| Check | Status |
| --- | --- |
| `scripts/harness-portolan-smoke.sh` | verified |
| `go test ./...` | verified |
| GitHub Baseline + CodeQL | verified (SUCCESS on push) |
| OpenCode independent lanes (glm/kimi/minimax) | not_assessed — runs hung, no `result.md` |

## Review lanes

| Lane | Model / harness | Status |
| --- | --- | --- |
| Repo-grounded | cavecrew-reviewer (local diff) | assessed |
| Requirements | zai-coding-plan/glm-5.1 | not_assessed |
| Code | kimi-for-coding/k2p6 | not_assessed |
| Security | minimax/MiniMax-M2.7 | not_assessed |

## Accepted (fix before merge)

| ID | Severity | Finding | Action |
| --- | --- | --- | --- |
| R1 | major | `viewer/src/app.js` language display sorts `{files,ratio}` objects with subtraction → `[object Object]` | Fix sort + format |
| R2 | major | Gaps table uses `recipe_ref`; bundle emits `recipe` | Use `g.recipe \|\| g.recipe_ref` |
| R3 | major | After load-all, findings sections still from budgeted `landscapeReport` | Regroup from `allHotspots` when full list loaded |

## Rejected / deferred

| ID | Finding | Disposition |
| --- | --- | --- |
| D1 | Overview does not render all `landscape-report.json` blocks | deferred — slice 5 delivered card + next_steps; spec/plan alignment follow-up |
| D2 | `total_loc` always unknown | deferred — remove stat or add LOC in scanner (095) |
| D3 | Loose landscape schemas + no CI artifact validation | deferred — tighten in follow-up slice |
| D4 | Silent stub card on scan-landscape-card failure | accepted as minor; fix optional |

## Merge readiness

**Not ready-to-merge** until R1–R3 fixed and at least two independent non-GPT lanes assessed per AGENTS.md.
