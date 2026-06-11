# Implementation review disposition — specs 094–097 — 2026-06-10

**Branch**: `codex/094-097-queryable-map-substrate`  
**Base**: `main` @ `d32fa64`

## Verification (local)

| Check | Status |
| --- | --- |
| `go test ./...` | verified |
| `go vet ./...` | verified |
| `jq empty schema/*.json` | verified |
| `jq empty harness/contracts/*.json` | verified |
| `scripts/harness-portolan-smoke.sh` | verified |
| `scripts/harness-bundle-query-smoke.sh` | verified |
| `git diff --check` | verified |
| GitHub Baseline | verified (PR #67 push) |
| CodeQL Analyze (go/js/py/actions) | verified |
| CodeQL aggregate | skipping (repo policy) |

## Review lanes (iteration 2 — post blocker fixes)

| Lane | Harness | Status | Verdict |
| --- | --- | --- | --- |
| Repo-grounded | cavecrew-reviewer | assessed | LGTM |
| Correctness | ce-correctness-reviewer | assessed | LGTM (3 low residual risks) |
| Security | ce-security-reviewer | assessed | LGTM (iteration 1) |
| OpenCode glm/kimi/minimax | — | not_assessed | — |

## Fixed (was blocking)

| ID | Finding | Fix |
| --- | --- | --- |
| B1 | `build-search-index.sh` rg second pass wiped partial index | Removed rg wipe branch; git ls-files + head only |
| B2 | `build-symbol-index.sh` ast-index path exited early, dropped ctags | Rebuild ctags first, append ast-index rows |
| B3 | `import-ast-index.sh` counted jq rows not written rows | Count lines written to OUT; fail if zero |
| B4 | Search hit click raced two `/source` fetches | Single `loadSourcePreview` with line override |
| B5 | Stale `/api/search` responses overwrote newer query | `searchFetchGen` guard on fetch + render |
| B6 | `bundle-query.js` repos.json parse could throw | try/catch + filter invalid repo roots |

## Accepted residuals (non-blocking)

| ID | Finding | Disposition |
| --- | --- | --- |
| Y1 | Search catch path may clear hits briefly before debounce bumps gen | accepted — low UX flicker |
| Y2 | Prior hits visible while new query debouncing | accepted — gen prevents stale writes |
| Y3 | Invalid `hit.line` falls back to line 1 | accepted — graceful degradation |

## Scope

- **094** map-bridge sidecar + `evidence-index` query family
- **095** bundle query CLI + `/api/*` + schema + guardrails + smoke
- **096** search/symbol indexes at build + viewer unified search
- **097** ast-index import-only producer path

## Next

Push branch, open PR, run PR review cycle until GitHub checks green and ready-for-review LGTM.
