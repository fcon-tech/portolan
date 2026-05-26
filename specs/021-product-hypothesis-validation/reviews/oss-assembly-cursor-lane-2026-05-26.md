# Hypothesis Ledger: OSS Assembly Cursor Lane

Date: 2026-05-26

## Hypothesis

- ID: H2
- Claim: Cursor-plus-Portolan can answer "where are duplicated components or
  dependency evidence likely?" better when local jscpd/SBOM outputs are present
  in the context pack.
- Target user: CTO inspecting a local landscape.
- Target root: `testdata/landscape-map`
- Context pack: `/tmp/portolan-oss-context`
- Acceptance client: Cursor Agent CLI.

## Evidence

Portolan context preparation produced:

- `jscpd` registry entry:
  - status: `observed`
  - evidence state: `metadata-visible`
  - confidence: `0.6`
  - metrics: `duplicate_groups: 1`
- `cyclonedx` registry entry:
  - status: `observed`
  - evidence state: `metadata-visible`
  - confidence: `0.7`
  - metrics: `components: 2`, `dependency_records: 1`

Cursor-assisted output: `/tmp/portolan-oss-cursor-plus.out`

## Result

Cursor used the metrics and preserved the boundary:

- It reported one jscpd-style duplicate group as metadata-visible evidence.
- It reported two SBOM components and one dependency record as
  metadata-visible evidence.
- It did not claim complete dependency coverage, service topology, ownership,
  or production truth.
- It kept OpenAPI, AsyncAPI, Backstage, Structurizr, Semgrep, and code index as
  `not_assessed`.

## Classification

| Claim | Classification | Notes |
| --- | --- | --- |
| Local OSS summaries improve Cursor's duplicate/dependency answer. | `verified` for this fixture | The answer used registry metrics instead of generic speculation. |
| The pack proves complete duplication or dependency coverage. | `unknown` | Scope is only the local candidate files. |
| Service relationships are known from this pack. | `not_assessed` | Relationship OSS families are absent. |

