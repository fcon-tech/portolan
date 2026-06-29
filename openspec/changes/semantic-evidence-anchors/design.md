# Design — semantic-evidence-anchors

## Decision

Make evidence anchoring mandatory for semantic claims: every claim carries a
source card, a local source anchor, a command receipt, or an explicit
`not_assessed` state. Unanchored claims never render as verified.

## Status

Recorded intent (spec-level). Anchor storage format and producer mechanics are
design-TBD. Composes with `semantic-investigation-producer` (generated pages
attach anchors).

## Reversibility

High. Additive evidence requirement; degrades gracefully to `not_assessed`.
