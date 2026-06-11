# PR #66 review disposition — 2026-06-11

**Head**: `abcf87b` (fix viewer load-all sync + attribute escaping)  
**PR**: https://github.com/fcon-tech/portolan/pull/66

## Verification

| Check | Status |
| --- | --- |
| `scripts/harness-portolan-smoke.sh` | verified |
| `go test ./...` | verified (prior runs) |
| GitHub Baseline + CodeQL | verified (SUCCESS on `abcf87b` push) |
| OpenCode independent lanes (glm/kimi/minimax) | not_assessed — prior runs hung, no `result.md` |

## Review lanes (iteration 3 — post `abcf87b`)

| Lane | Model / harness | Status | Verdict |
| --- | --- | --- | --- |
| Repo-grounded | cavecrew-reviewer | assessed | LGTM (0 blockers, 2 residual 🟡) |
| Correctness | ce-correctness-reviewer | assessed | LGTM |
| Security | ce-security-reviewer | assessed | LGTM |
| Requirements | zai-coding-plan/glm-5.1 | not_assessed | — |
| Code | kimi-for-coding/k2p6 | not_assessed | — |
| Security (OpenCode) | minimax/MiniMax-M2.7 | not_assessed | — |

## Fixed (was blocking)

| ID | Severity | Finding | Fix commit |
| --- | --- | --- | --- |
| R1 | major | Language display `[object Object]` | `517fd47` |
| R2 | major | Gaps `recipe_ref` vs `recipe` | `517fd47` |
| R3 | major | Findings sections stale after load-all | `517fd47` |
| R4 | major | Truncation banner after load-all | `abcf87b` |
| R5 | major | Overview scale/kind counts stale after load-all | `abcf87b` |
| R6 | major | `escapeHtml` in attributes → attribute-breakout XSS | `abcf87b` |
| R7 | major | Filter chip counts stale after load-all | `abcf87b` |
| R8 | minor | Findings sections vs active filters misaligned | `abcf87b` |
| R9 | minor | Kind section order not map.md order | `abcf87b` |
| R10 | minor | Manifest footer stale after load-all | `abcf87b` |

## Accepted residuals (non-blocking)

| ID | Finding | Disposition |
| --- | --- | --- |
| Y1 | Empty `hotspots-full.jsonl` → silent load-all click | accepted — edge case; bundle contract expects file when truncated |
| Y2 | Short full file vs `manifest.hotspots_total` mismatch | accepted — pre-existing bundle contract assumption |
| Y3 | Manifest numeric fields in banner innerHTML unescaped | accepted — local bundle threat model; low risk |
| Y4 | Overview `renderOverview()` on load-all only when on overview tab | accepted — tab switch re-renders via `switchTab` |

## Rejected / deferred

| ID | Finding | Disposition |
| --- | --- | --- |
| D1 | Overview does not render all `landscape-report.json` blocks | deferred — slice 5 delivered card + next_steps |
| D2 | `total_loc` always unknown | deferred — scanner follow-up |
| D3 | Loose landscape schemas + no CI artifact validation | deferred |
| D4 | Silent stub card on scan-landscape-card failure | accepted as minor |

## Merge readiness

**Merged** — squash merge to `main` at `d40fee2` (2026-06-11). User LGTM + explicit merge authorization in session.

See `merge-closeout-2026-06-11.md`.
