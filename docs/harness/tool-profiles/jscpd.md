# Tool Profile: jscpd

| Field | Value |
| --- | --- |
| Role | `producer_candidate` (required v1) |
| User job | Code duplication / near-clone clusters |
| License | MIT |
| Review date | 2026-06-10 |
| Portolan action | Import JSON output into `<bundle-dir>/hotspots.jsonl` (`kind: duplication`) |

## Output surface

- JSON reporter (`--reporters json`)
- Prefer repository-sharded runs on multi-repo landscapes (see spec 079)

## Risks

| Risk | Boundary |
| --- | --- |
| OOM on large roots | Shard by repository; failed shard = `not_assessed`, not metric |
| Cross-repo clones | `not_assessed` unless producer output explicitly covers both repos |
| Target mutation | Read-only scan; no writes to target |

## Approval gate

Operator approves local Node/jscpd install and scan scope before execution.

## Recipe

[`harness/recipes/duplication-jscpd.md`](../../../harness/recipes/duplication-jscpd.md)
