# Design — semantic-investigation-producer

## Decision

Promote the semantic-investigation surface from fixture-backed demo pages to a
generated sidecar produced from the scanned corpus, with bounded, labelled agent
claims layered on top.

## Status

Recorded intent (spec-level). The generation algorithm, bounding policy, and
producer placement are design-TBD at implementation time. Placement follows the
`agent-atlas-foundation` direction (producer logic in the Go core).

## Relationships

- Builds on the existing `semantic-investigation` living spec (slice 17 contract).
- Consumes structural edges from `symbol-reference-edges` and overlap findings
  from `overlap-duplication-and-alternatives` once those land.

## Reversibility

High. The change is additive to the semantic-investigation surface; the
fixture-backed path is retained for tests.
