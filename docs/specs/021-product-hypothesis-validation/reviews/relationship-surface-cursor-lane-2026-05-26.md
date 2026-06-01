# Hypothesis Ledger: Relationship Surface Cursor Lane

Date: 2026-05-26

## Hypothesis

- ID: H3
- Claim: Cursor-plus-Portolan can describe service/API relationship surfaces
  more honestly when Backstage/OpenAPI/AsyncAPI/Structurizr files are indexed.
- Context pack: `/tmp/portolan-rel-context`
- Cursor output: `/tmp/portolan-rel-cursor-plus.out`

## Evidence

`tool-registry.json` contained observed metadata-visible entries:

- Backstage: `entities: 2`
- OpenAPI: `paths: 2`
- AsyncAPI: `channels: 2`
- Structurizr: `elements: 2`

## Result

Cursor used the metrics to produce a CTO-safe answer:

- It described the files as local relationship-surface evidence candidates.
- It did not infer runtime topology, service mesh, call graphs, SLOs, or
  production wiring.
- It preserved missing code index, CycloneDX, jscpd, and Semgrep as
  `not_assessed`.

## Classification

| Claim | Classification | Notes |
| --- | --- | --- |
| Relationship surface summaries improve Cursor's answer. | `verified` for this fixture | Cursor cited metrics and stayed within metadata-visible evidence. |
| Runtime service relationships are known from these summaries. | `unknown` | Correctly not claimed. |
| Deep schema validity is proven. | `not_assessed` | This slice is shallow summary only. |
