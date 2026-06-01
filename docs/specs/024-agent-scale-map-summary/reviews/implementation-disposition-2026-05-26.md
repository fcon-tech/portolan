# Implementation Disposition: Agent-Scale Map Summary

Date: 2026-05-26

## Scope

Implemented `docs/specs/024-agent-scale-map-summary/` to address blind acceptance
gaps:

- `GAP-GRAPH-SCALE`: large `graph.json` is not a first-pass agent artifact.
- `GAP-GRAPH-TYPE`: inventory file nodes need surface classification.
- `GAP-DUP-FINDINGS`: repeated placeholder findings confuse reports.

## Changes

- Added `summary.json` to `portolan map` bundles.
- Added compact graph, finding, coverage, weak-record, repository, skipped
  surface, warning, and file-surface counts.
- Added exact-ID finding deduplication before `findings.jsonl` and `map.md`
  generation.
- Updated CLI help, agent guide, Cursor rule, blind acceptance docs, and the
  backlog row.

## Verification

| Check | Status | Evidence |
| --- | --- | --- |
| Unit tests | verified | `go test -count=1 ./...` passed. |
| Schema syntax | verified | `jq empty schema/*.json` passed. |
| Diff hygiene | verified | `git diff --check` passed. |
| CLI help | verified | `go run ./cmd/portolan map --help` includes `summary.json`. |
| Bigtop smoke | verified | `go run ./cmd/portolan map --root /home/fall_out_bug/projects/bigtop-landscape --out /tmp/portolan-024-bigtop-summary --force` passed. |
| Bigtop summary | verified | `summary.json` was 10,595 bytes while `graph.json` was 123,858,897 bytes; summary reported 148,102 nodes, 148,714 edges, 18 repositories, and 3 weak coverage records. |
| Bigtop JSON | verified | `jq empty /tmp/portolan-024-bigtop-summary/summary.json /tmp/portolan-024-bigtop-summary/run.json /tmp/portolan-024-bigtop-summary/coverage.json /tmp/portolan-024-bigtop-summary/graph.json` passed. |
| Control smoke | verified | `go run ./cmd/portolan map --root /home/fall_out_bug/projects/consensus_tg_bot --out /tmp/portolan-024-control-summary --force` passed. |
| Control dedupe | verified | duplicate finding ID check over `/tmp/portolan-024-control-summary/findings.jsonl` returned no duplicate IDs; total findings dropped from 14 to 10. |

## Review Findings

### Independent Lanes

| Lane | Status | Disposition |
| --- | --- | --- |
| local repo-grounded review | verified | No major correctness, evidence-state, path-safety, or schema blockers found. |
| `kimi-coding/kimi-for-coding` | not_assessed | Returned an attempted tool-use preamble instead of a review finding set. |
| `minimax/MiniMax-M2.7` | not_assessed | Provider returned `404 page not found`. |
| `zai/glm-5.1` | not_assessed | Response reviewed hallucinated root-level files that do not exist in this repository. Conceptual concerns were checked locally and rejected where covered by current code. |

### Dispositions

| Finding | Disposition |
| --- | --- |
| Summary must not become a new source of truth. | accepted; `summary.json` is derived from run, coverage, graph, and findings artifacts. |
| File-surface classification could overclaim semantic ownership. | accepted narrower; summary uses conservative buckets only and does not change graph node evidence. |
| Dedupe could hide per-repository findings. | accepted; dedupe key is exact finding ID, so repo-prefixed findings remain distinct. |
| Empty finding IDs could be silently collapsed. | rejected; `WriteFindings` validation still fails any remaining empty ID, so malformed findings do not produce a successful artifact bundle. |
| Non-atomic `summary.json` writes could leave partial output. | rejected; `summary.json` is written inside the temporary output bundle and only exposed after the existing bundle-level replace step succeeds. |
| Summary lacks a schema version. | rejected; `summary.json` includes `schema_version`. |

## Not Assessed

- PR state, GitHub checks, and merge readiness are not assessed.
