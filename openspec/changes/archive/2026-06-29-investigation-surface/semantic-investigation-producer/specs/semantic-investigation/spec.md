# Spec Delta — semantic-investigation

## ADDED Requirements

### Requirement: Semantic investigation pages are generated from the corpus
Semantic investigation pages SHALL be generated from the collected corpus
(units, surfaces, findings, and typed edges) as a sidecar over the snapshot, not
authored as fixture-backed demo content. Agent contributions to a page SHALL be
bounded, clearly labelled as claims, and confidence-tagged per the trust
contract; they MUST NOT override deterministic evidence.

#### Scenario: Pages reflect the scanned corpus
- GIVEN the deterministic core has collected a real corpus
- WHEN semantic investigation pages are produced
- THEN each page is generated from the corpus's units, surfaces, findings, and edges
- AND no live page is fixture-backed demo content

#### Scenario: Agent claims are bounded and labelled
- GIVEN an agent augments a semantic investigation page
- WHEN the page is produced
- THEN each agent contribution is labelled as a claim with a confidence tag
- AND agent text does not override deterministic evidence
