# Example Portolan Map Report

## Run Status

| Item | Value |
| --- | --- |
| Root | `.` |
| Current command used | `portolan scan --selection selection.json --out /tmp/portolan-run/graph.json --force` |
| Current artifacts inspected | `/tmp/portolan-run/graph.json`, `/tmp/portolan-run/map.md` |
| Target contract status | `portolan map --root . --out .portolan/run` not available in current toolbox |
| Overall state | Partial evidence; missing product capabilities are recorded in the gap ledger. |

## Relationships

| Product Category | Finding | Evidence Reference | Evidence State | Confidence/Status | Source Type | Action / Likely Spec |
| --- | --- | --- | --- | --- | --- | --- |
| relationships | `service-a` reads `config/service-a.yaml`. | `graph.json#/edges/12` | `source-visible` | high | generated artifact | Confirm whether runtime uses the same path. |
| relationships | Queue relationship inference is not available from current artifacts. | `GAP-002` | `unknown` | open gap | missing capability | `010` |

## Duplication

| Product Category | Finding | Evidence Reference | Evidence State | Confidence/Status | Source Type | Action / Likely Spec |
| --- | --- | --- | --- | --- | --- | --- |
| duplication | Repeated deployment resource limits could not be clustered by Portolan. | `GAP-003` | `not_assessed` | open gap | missing capability | `011` |

## Configuration Surfaces

| Product Category | Finding | Evidence Reference | Evidence State | Confidence/Status | Source Type | Action / Likely Spec |
| --- | --- | --- | --- | --- | --- | --- |
| config | `PORTOLAN_OUTPUT_DIR` appears as a local configuration surface. | `graph.json#/nodes/3` | `source-visible` | medium | generated artifact | Verify whether it is user-facing CLI behavior. |
| config | Runtime port for `service-a` is not visible in local metadata. | `GAP-004` | `unknown` | open gap | missing capability | `012` |

## Technical Debt

| Product Category | Finding | Evidence Reference | Evidence State | Confidence/Status | Source Type | Action / Likely Spec |
| --- | --- | --- | --- | --- | --- | --- |
| tech debt | Current toolbox cannot generate technical-debt findings from graph evidence. | `GAP-005` | `not_assessed` | open gap | missing capability | `013` |

## Unknown And Cannot Verify

| Product Category | Claim Or Question | Evidence Reference | Evidence State | Confidence/Status | Source Type | Action / Likely Spec |
| --- | --- | --- | --- | --- | --- | --- |
| evidence | Which service owns production incident response? | `graph.json#/nodes/3` | `unknown` | no local owner evidence | generated artifact | Provide metadata or claim file. |
| evidence | `service-a` is deprecated. | `claims/deprecation.md#service-a` | `cannot_verify` | claim-only input lacks corroboration | file | Add source, metadata, or runtime evidence. |

## Gap Ledger

| Gap ID | Repo/Context | Attempted Task | Command/Artifact Used | Observed Limitation | Expected Capability | Affected Product Promise | Evidence State | User Impact | Priority | Likely Spec | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GAP-001 | example repo | Run one-command map | `portolan map --root . --out .portolan/run` | Command unavailable | One command emits run metadata, graph, findings, and packet | UX | `cannot_verify` | Agent cannot run the target workflow directly. | P1 | `009` | open |
| GAP-002 | example repo | Detect queue relationship | `/tmp/portolan-run/graph.json` | Current graph lacks relationship detector output for queues | Evidence-backed relationship finding | relationships | `unknown` | Agent cannot distinguish missing relation from missing detector. | P1 | `010` | open |
| GAP-003 | example repo | Cluster duplicated manifests | `/tmp/portolan-run/graph.json` | No duplication finding artifact exists | Evidence-backed duplication clusters | duplication | `not_assessed` | User gets no backlog-ready duplication evidence. | P2 | `011` | open |
| GAP-004 | example repo | Map runtime ports | local metadata only | No runtime export was supplied and no config detector exists | Config surface extraction with unknowns preserved | config | `unknown` | Runtime exposure remains unclear. | P2 | `012` | open |
| GAP-005 | example repo | Produce technical-debt findings | current graph and packet | No technical-debt finding generator exists | Findings derived from relationships, duplication, config, and importer evidence | tech debt | `not_assessed` | Agent can only report absence of product support. | P2 | `013` | open |

## Not Assessed

| Surface | State | Reason |
| --- | --- | --- |
| External dependency freshness | `not_assessed` | Network access was not approved. |
| Live runtime topology | `not_assessed` | No local runtime export was supplied. |
