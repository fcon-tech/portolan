# Example Portolan Map Report

## Run Status

| Item | Value |
| --- | --- |
| Root | `.` |
| Command | `portolan map --root . --out .portolan/run` |
| Artifacts | `.portolan/run/run.json`, `.portolan/run/graph.json`, `.portolan/run/findings.jsonl`, `.portolan/run/map.md` |
| Overall state | Partial evidence; unsupported surfaces are listed below. |

## Relationships

| Finding | Evidence State | Source | Confidence | Next Check |
| --- | --- | --- | --- | --- |
| `service-a` reads `config/service-a.yaml`. | `source-visible` | `graph.json#/relationships/12` | high | Confirm whether runtime uses the same path. |
| `worker-b` depends on queue `jobs.ready`. | `metadata-visible` | `findings.jsonl:relationship:queue-jobs-ready` | medium | Add runtime export if queue bindings are dynamic. |

## Duplication

| Finding | Evidence State | Source | Confidence | Next Check |
| --- | --- | --- | --- | --- |
| Two deployment manifests repeat the same resource limits. | `metadata-visible` | `findings.jsonl:duplication:k8s-limits-01` | medium | Check whether the duplication is intentional per environment. |

## Configuration Surfaces

| Surface | Evidence State | Source | Confidence | Next Check |
| --- | --- | --- | --- | --- |
| `PORTOLAN_OUTPUT_DIR` controls output location. | `source-visible` | `graph.json#/nodes/env/PORTOLAN_OUTPUT_DIR` | high | Verify default in CLI help. |
| Runtime port for `service-a` is not visible in local metadata. | `unknown` | `run.json#/skipped/runtime` | low | Provide a local runtime export. |

## Technical Debt

| Finding | Evidence State | Source | Confidence | Next Check |
| --- | --- | --- | --- | --- |
| Import adapter emits graph nodes without a stable owner field. | `source-visible` | `findings.jsonl:debt:adapter-owner-field` | medium | Decide whether owner belongs in schema or packet only. |

## Unknown

| Question | Evidence State | Source | Reason |
| --- | --- | --- | --- |
| Which service owns production incident response? | `unknown` | `graph.json#/unknowns/oncall-owner` | No local metadata, runtime export, or claim file was provided. |

## Cannot Verify

| Claim | Evidence State | Source | Reason |
| --- | --- | --- | --- |
| `service-a` is deprecated. | `cannot_verify` | `claims/deprecation.md#service-a` | The claim exists, but no source, metadata, or runtime evidence confirms it. |

## Not Assessed

| Surface | State | Reason |
| --- | --- | --- |
| External dependency freshness | `not_assessed` | Network access was not approved. |
| Live runtime topology | `not_assessed` | No local runtime export was supplied. |
