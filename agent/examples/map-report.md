# Example Portolan Map Report

## Run Status

| Item | Value |
| --- | --- |
| Target root | `/local/target` |
| Current command used | `portolan map --root /local/target --out /tmp/portolan-run --force` |
| Current artifacts inspected | `/tmp/portolan-run/run.json`, `/tmp/portolan-run/summary.json`, `/tmp/portolan-run/graph.json`, `/tmp/portolan-run/findings.jsonl`, `/tmp/portolan-run/map.md` |
| Target contract status | One-command map bundle produced. |
| Overall state | Partial evidence; unsupported detector surfaces are recorded in findings and the gap ledger. |

## Relationships

| Product Category | Finding | Evidence Reference | Evidence State | Confidence/Status | Source Type | Action / Likely Spec |
| --- | --- | --- | --- | --- | --- | --- |
| relationships | `service-a` reads `config/service-a.yaml`. | `graph.json#/edges/12` | `source-visible` | high | generated artifact | Confirm whether runtime uses the same path. |
| relationships | Queue relationship inference is not available from current artifacts. | `GAP-002` | `unknown` | open gap | missing capability | `010` |
| relationships | Component source repository referenced by package metadata is not present locally. | `GAP-006` | `cannot_verify` | open gap | missing local source | Ask user for local source path if source-backed mapping is required. |

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
| GAP-001 | example repo | Verify existing run freshness | `/tmp/portolan-run/run.json` | Previous run was for a different target root | Clear stale-run handling before reporting | UX | `cannot_verify` | Agent must regenerate or stop instead of reading stale artifacts. | P1 | `014` | open |
| GAP-002 | example repo | Detect queue relationship | `/tmp/portolan-run/graph.json` | Current graph lacks relationship detector output for queues | Evidence-backed relationship finding | relationships | `unknown` | Agent cannot distinguish missing relation from missing detector. | P1 | `010` | open |
| GAP-003 | example repo | Cluster duplicated manifests | `/tmp/portolan-run/graph.json` | No duplication finding artifact exists | Evidence-backed duplication clusters | duplication | `not_assessed` | User gets no backlog-ready duplication evidence. | P2 | `011` | open |
| GAP-004 | example repo | Map runtime ports | local metadata only | No runtime export was supplied and no config detector exists | Config surface extraction with unknowns preserved | config | `unknown` | Runtime exposure remains unclear. | P2 | `012` | open |
| GAP-005 | example repo | Produce technical-debt findings | current graph and packet | No technical-debt finding generator exists | Findings derived from relationships, duplication, config, and importer evidence | tech debt | `not_assessed` | Agent can only report absence of product support. | P2 | `013` | open |
| GAP-006 | package repo | Inspect referenced component source | local package metadata | Referenced source repository is not present locally and network access was not approved | Optional local component source path or metadata-backed relationship only | evidence | `cannot_verify` | Agent cannot make source-visible claims about absent components. | P1 | `014` | open |

## Not Assessed

| Surface | State | Reason |
| --- | --- | --- |
| External dependency freshness | `not_assessed` | Network access was not approved. |
| Live runtime topology | `not_assessed` | No local runtime export was supplied. |
