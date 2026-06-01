# Post-Navigation-Index Review Disposition

Date: 2026-06-01
Branch: `codex/post-merge-navigation-guidance`
PR: #31

## Review Lanes

| Lane | Model | Artifact | Assessed |
| --- | --- | --- | --- |
| Kimi | `kimi-coding/kimi-for-coding` | `post-navigation-index-review-kimi-2026-06-01.md` | yes |
| GLM | `zai/glm-5.1` | `post-navigation-index-review-glm-2026-06-01.md` | yes |
| MiMo | `openrouter/xiaomi/mimo-v2.5-pro` | `post-navigation-index-review-mimo-2026-06-01.md` | yes |

## Findings Disposition

| Finding | Source | Disposition | Evidence |
| --- | --- | --- | --- |
| `unknown_nodes.surface_buckets` might be read as all-file inventory rather than an unknown-node breakdown. | MiMo; Kimi framed a stricter variant | accepted and fixed | `unknown_nodes.reason` now states that `surface_buckets` classify only nodes where `kind == "unknown"`, not all graph nodes. `TestRunMapWritesAgentScaleSummary` asserts the wording. |
| Bucket totals could be unclear or fail to reconcile with `unknown_nodes.total`. | MiMo | accepted and fixed | `TestRunMapWritesAgentScaleSummary` now asserts the sum of `surface_buckets` equals `unknown_nodes.total`. |
| `surface_buckets` incorrectly counts all file surfaces, not only unknown nodes. | Kimi | rejected with local evidence | `summarizeFileSurfaces` filters `node.Kind != "unknown"` before classifying the node label or ID. The new bucket-sum assertion also verifies the unknown-only contract. |
| Missing strict schemas for `summary.json` and `graph-index.json`. | GLM, MiMo | rejected for PR #31; follow-up candidate | No strict schema files exist for these artifacts today, so this PR is not breaking an existing schema contract. Go structs plus app-level tests remain the current contract. Adding schemas is useful future hardening but out of scope for this post-merge navigation correction. |
| Duplicate `high_degree_nodes` and `navigation.high_degree_hubs` create redundancy. | GLM, MiMo | rejected for this slice | Duplication is intentional for agent convenience: `graph-index.json` keeps the raw top-level index and `navigation` mirrors the bounded read path in both `summary.json` and `graph-index.json`. No contradictory values are produced because both use `graphIndexHighDegreeNodes`. |
| `buildNavigationIndex` recomputes high-degree nodes / surface buckets. | Kimi, GLM | rejected for this slice | Stress verified the 190k-node Bigtop run. This is a small efficiency concern, not a correctness or evidence-state blocker. |
| SBOM warning only names the first high-degree SBOM node. | Kimi, GLM | accepted as follow-up, not blocker | Current stress has a single Syft/CycloneDX SBOM fan-out node. The warning preserves the key boundary that package fan-out is inventory, not service topology. Multi-SBOM warning fan-out can be improved if future stress shows confusion. |
| `read_order` omits `coverage.json` and `map.md`. | GLM | accepted as optional follow-up, not blocker | Cursor + Composer 2.5 accepted the current navigation-index run as conditionally adequate. The stress record already names this as optional hardening, not a blocker. |
| Warnings should be structured with category/severity fields. | MiMo | accepted as follow-up, not blocker | Current artifact style uses string warnings across map/query outputs. Structured warning records should be designed as a separate contract change, not inserted into this post-merge correction. |
| Merge-approval evidence is not contained in the review packet. | GLM, MiMo | unresolved for final merge decision | PR #31 can be updated and marked ready-for-review from local evidence. Before merge, live PR state and explicit user approval must be rechecked and recorded; stale or missing approval remains a merge blocker. |

## Verification After Accepted Fixes

- `go test -count=1 ./internal/app -run 'TestRunMapWritesAgentScaleSummary|TestRunMapWritesBoundedGraphIndex|TestRunMapNavigationIndexFlagsSBOMFanOut'`: verified passing.
- `go run ./cmd/portolan map --selection internal/testfixtures/landscape-map/selection.json --out /tmp/portolan-nav-smoke-*/run --force`: verified passing.
- `jq -e '.navigation.read_order and .navigation.unknown_nodes' /tmp/portolan-nav-smoke-*/run/summary.json`: verified passing.
- `jq -e '.navigation.next_drill_down and .navigation.high_degree_hubs' /tmp/portolan-nav-smoke-*/run/graph-index.json`: verified passing.

## Remaining Not Assessed

- GitHub checks on the final pushed PR #31 head: not_assessed until push and refresh.
- GitHub review approval: not_assessed.
- Live Cursor UI behavior outside headless Cursor Agent: not_assessed.
- External producer outputs beyond the Syft/CycloneDX stress lane: not_assessed.
