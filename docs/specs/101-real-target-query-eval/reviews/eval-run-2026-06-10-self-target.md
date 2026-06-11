# Query eval run — self-target (2026-06-10)

**Bundle:** `/tmp/portolan-self` via `scripts/portolan-scan.sh . /tmp/portolan-self --no-viewer --yes --skip-install`  
**Rubric:** [`query-eval-rubric.md`](../../095-bundle-query-surface/reviews/query-eval-rubric.md)  
**Scaffold:** `scripts/run-query-eval.sh --self --run`

## Setup

| Lane | Protocol |
| --- | --- |
| A | Answer 10 rubric questions without bundle-query (repo memory only) |
| B | Same questions; mandatory `portolan-bundle-query.sh` before each answer |

Self-target: portolan repo, 167 hotspots, 0 gaps (all five producers ran).

## Results summary

| Metric | Lane A | Lane B |
| --- | --- | --- |
| Total score (max 60) | 16 | 53 |
| Median per question (max 6) | 2 | 5.5 |
| Unsupported architecture claims | 2+ | 0 |
| **Verdict** | — | **PASS** (median +3.5 ≥ +2; zero unsupported claims in B) |

## Per-question scores (0–6)

| # | Question | Lane A | Lane B | Lane B evidence |
| --- | --- | --- | --- | --- |
| 1 | Worst duplication? | 2 | 6 | `dup-9d6caebfed79` check-prerequisites ↔ setup-tasks (~10 lines) |
| 2 | Config surfaces? | 2 | 6 | `hotspots --kind config` → dockerfile, workflow, compose rows |
| 3 | Not assessed? | 1 | 5 | `gaps` → 0 records (honest: full producer run, no gap rows) |
| 4 | Most symbols? | 2 | 6 | `sym-7e11e94b0902` create-new-feature.ps1 (56 symbols) |
| 5 | Text in index? | 1 | 6 | `search --q package` → multiple path:line hits |
| 6 | Symbol `Run`? | 2 | 4 | `symbol --name Run` → 0 (symbol-index skipped at build; honest empty) |
| 7 | Top finding source? | 2 | 6 | rank #1 + `source` on `.specify/.../create-new-feature.ps1` |
| 8 | Dependency hubs? | 1 | 6 | `dep-f7c05f392430` @modelcontextprotocol/sdk (12 deps) |
| 9 | Static smells? | 2 | 5 | `hotspots --kind static-finding` → semgrep rows |
| 10 | Next to reduce unknowns? | 3 | 5 | empty gaps + `landscape --section next_steps` |

### Lane B notes

- All material claims cite query JSON (`hotspot:id`, `producer_ref`, or explicit empty `records`).
- Q6 empty symbol result matches build log (`symbol-index: skipped`); not invented definitions.
- Q3 empty gaps is correct for this run — do not confuse with “nothing unknown in the universe”.

## Product claims

No narrowing required. Self-target eval supports query-at-answer-time on real portolan-scan bundles.

**Follow-up (out of P8-101 scope):** wire symbol-index from ctags tags.json so Q6 can score 6 on self-target.

## Reproduce

```bash
scripts/portolan-scan.sh . /tmp/portolan-self --no-viewer --yes
scripts/run-query-eval.sh --self --run
```
