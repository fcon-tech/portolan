# Cursor Plus Portolan Parity Rubric

Date: 2026-06-02

This rubric defines what "Portolan understands Bigtop architecture like a human
or enterprise code intelligence, in combination with Cursor" would require. It
is a measurement contract, not a claim that parity is already achieved.

## Criteria

| ID | Capability | Verified requires | Partial allows | Not enough |
| --- | --- | --- | --- | --- |
| C1 | Landscape scope and role map | Repo inventory, role evidence, and explicit unknowns for selected Bigtop scope | Correct hub/component roles for bounded repos | README-only claims without scope limits |
| C2 | Static dependency and relationship graph | Evidence-backed source/metadata relationships with queryable graph support | Selected relationship slices | Narrative dependency guesses |
| C3 | Deployment model | Rendered or parsed local deployment artifacts with evidence states | Static Compose/Helm model for selected services | Treating deployment model as runtime |
| C4 | Runtime topology | Runtime-visible process/service/container/orchestrator observation for bounded Bigtop runtime | None; if runtime export is absent this remains `not_assessed` | Compose/Helm/proto/static files |
| C5 | API/catalog/model surfaces | Real producer outputs such as protobuf descriptors, OpenAPI, schema/catalog exports, or generated model metadata with scope and validation | Bounded protobuf or chart-derived model surfaces | Unvalidated file mentions |
| C6 | Symbol/reference graph | Producer output with definitions and references for declared selected scope | File-symbol listing for selected files | `rg` snippets or definitions-only lists represented as references |
| C7 | Evidence-state discipline | Every claim carries verified/partial/not_assessed/cannot_verify boundary and cites producer/run IDs | Minor citation gaps without overclaim | Collapsing unknowns into success |
| C8 | Cursor augmentation value | Same-question Cursor-only and Cursor-plus-Portolan comparison shows improved correctness, evidence discipline, or gap attribution | Improvement on bounded packet only | Unpaired Cursor anecdotes |
| C9 | Enterprise parity threshold | C1-C8 verified for declared selected scope, with runtime and symbol/reference covered or explicitly excluded from a narrowed claim | Strong partial claim when C4 or C6 remain missing | Saying "enterprise code intelligence" while C4 or C6 are `not_assessed` |

## Claim Rules

- If C4 runtime topology is `not_assessed`, do not claim verified runtime
  topology.
- If C6 full symbol/reference graph is `not_assessed`, do not claim enterprise
  code-intelligence parity.
- If Cursor comparison is bounded, say "bounded Cursor + Portolan improvement",
  not complete architecture understanding.
- A safe public claim may mention improved evidence discipline only when C7 and
  C8 are verified for the specific stress packet.

## Current Assessment Before Cursor Stress

| Criterion | Current state | Reason |
| --- | --- | --- |
| C1 | partial | Prior Bigtop rubric and stress answered bounded role-map questions. |
| C2 | partial | Portolan graph/query evidence exists for selected maps, but full selected-landscape relationships remain incomplete. |
| C3 | partial | Static Compose/Helm evidence is verified as `metadata-visible`. |
| C4 | not_assessed | No runtime-visible Bigtop export exists. |
| C5 | partial | Expanded Alluxio protobuf descriptor and Helm templates are verified but not full catalog/model coverage. |
| C6 | not_assessed | Full symbol/reference producer output is absent. |
| C7 | partial | Specs 054-057 preserve evidence-state discipline in bounded packets, but 057/058 stress outputs are not all canonical producer-run records with run IDs. |
| C8 | partial | Prior Cursor + Portolan comparisons show bounded improvement, not unrestricted proof. |
| C9 | not_assessed | C4 and C6 are missing; enterprise parity cannot be claimed. |

## Full Versus Narrowed Parity

Full enterprise code-intelligence parity requires C1-C8 to be verified for the
declared selected scope, including runtime topology (C4) and symbol/reference
graph (C6).

A narrowed claim may exclude runtime or full symbol/reference only if the claim
name says so explicitly, for example "bounded static architecture evidence
discipline" or "metadata-visible deployment/API reasoning." A narrowed claim is
not enterprise code-intelligence parity.
