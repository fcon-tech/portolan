# Implementation Review Disposition: 023 Relationship Surface Assembly

Date: 2026-05-26

## Scope Reviewed

- Backstage catalog candidate summary
- OpenAPI contract candidate summary
- AsyncAPI contract candidate summary
- Structurizr JSON/DSL candidate summary
- malformed JSON preservation as `cannot_verify`
- Cursor guide/skill wording

## Decision

Context preparation now records shallow local relationship-surface summaries for
standard OSS formats without adding parser dependencies or invoking external
tools. The summaries are evidence candidates only; they do not create runtime
topology or verified service-call claims.

## Review Findings

- `kimi-coding/kimi-for-coding`: `not_assessed`; returned tool-call text instead
  of review findings.
- `minimax/MiniMax-M2.7`: `not_assessed`; model endpoint returned `404`.
- `zai/glm-5.1`: `not_assessed`; returned off-task planning text instead of
  review findings.
- Local repo-grounded agent review: major findings accepted and fixed:
  - `catalog-info.json` is detected as Backstage catalog evidence.
  - Structurizr JSON now counts common model element arrays; parsed JSON with
    no shallow elements stays `candidate` instead of overstated `observed`.
  - Backstage JSON counts wrapped `items`/`entities` catalog shapes.
  - Success-path tests assert `metadata-visible` for observed relationship
    surface entries.

## Verification

- `go test -count=1 ./...`: passed
- `jq empty schema/*.json`: passed
- `git diff --check`: passed
- Fixture context smoke:
  - Backstage: 2 entities
  - OpenAPI: 2 paths
  - AsyncAPI: 2 channels
  - Structurizr: 2 architecture elements
- Focused regression:
  - AsyncAPI YAML direct channel counting ignores nested message/operation keys.
  - Structurizr JSON with no counted model elements remains `candidate` with
    `elements: 0`.
- Cursor assisted lane:
  - `/tmp/portolan-rel-cursor-plus.out` used the metrics and preserved
    `unknown`/`not_assessed` boundaries without inferring runtime topology.

## Not Assessed

- Deep schema validation for Backstage/OpenAPI/AsyncAPI/Structurizr.
- Remote `$ref` resolution.
- Malformed YAML validation; YAML summaries remain shallow filename/shape
  heuristics.
- Runtime topology, service mesh, traffic, SLOs, or environment-specific
  deployment relationships.
