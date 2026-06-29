## Why

Slice 17 delivered the semantic-investigation contract
(`openspec/specs/semantic-investigation/`) against a fixture-backed demo. The
semantic pages are hand-shaped, not generated from the actual corpus, so they
cannot reflect a real target and cannot scale beyond the demo. To serve the
agent and the admiral on a real landscape, the semantic investigation must be
PRODUCED from the scanned corpus as a generated sidecar, with bounded agent
claims layered on top — not authored as static demo content.

## What Changes

- Generate semantic-investigation pages from the collected corpus (a producer
  pass over units, surfaces, findings, and typed edges), replacing the
  fixture-backed demo as the live source.
- Allow bounded agent claims to augment the generated pages; each claim SHALL be
  clearly labelled as a claim and confidence-tagged per the trust contract, and
  SHALL NOT override deterministic evidence.
- Retain the fixture-backed path only as a test/fixture, not as the live page
  source.

## Capabilities

### Modified Capabilities

- `semantic-investigation`: the investigation surface SHALL be corpus-generated,
  not fixture-backed; agent contributions SHALL be bounded and labelled.

## Impact

- Depends on: the deterministic core producing enough corpus signal (units,
  surfaces, findings, edges). Composes with `symbol-reference-edges` (structural
  edges feed pages) and `overlap-duplication-and-alternatives` (overlap findings
  feed pages).
- Out of scope: the generation algorithm specifics (design TBD at implementation
  time); where the producer process runs is governed by `agent-atlas-foundation`
  (Go core).
