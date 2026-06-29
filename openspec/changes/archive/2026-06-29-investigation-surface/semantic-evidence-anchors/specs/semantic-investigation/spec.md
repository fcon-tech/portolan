# Spec Delta — semantic-investigation

## ADDED Requirements

### Requirement: Every semantic claim carries an evidence anchor or not_assessed
Every semantic claim SHALL carry an evidence anchor — a source card, a local
source anchor, or a command receipt — or be explicitly marked `not_assessed`. A
claim without any anchor MUST NOT be presented as verified, and the missing
anchor MUST be surfaced rather than hidden.

#### Scenario: Anchored claim renders as verified
- GIVEN a semantic claim has a local source anchor
- WHEN the page renders the claim
- THEN the anchor is attached and the claim is not marked not_assessed

#### Scenario: Unanchored claim is not_assessed, not verified
- GIVEN a semantic claim has no source card, local anchor, or command receipt
- WHEN the page renders the claim
- THEN it is explicitly marked not_assessed
- AND it is not presented as verified
