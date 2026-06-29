Feature: Semantic investigation pages are generated from the corpus
  Part-1b: semantic investigation pages are produced from the collected corpus
  (units, surfaces, findings, typed edges) as a generated sidecar, not fixture-
  backed demo content. Agent contributions are bounded, labelled as claims, and
  confidence-tagged; they MUST NOT override deterministic evidence.
  Bound to openspec/specs/semantic-investigation.

  Scenario: Pages reflect the scanned corpus
    Given the deterministic core has collected a real corpus
    When semantic investigation pages are produced
    Then each page is generated from the corpus's units, surfaces, findings, and edges
    And no live page is fixture-backed demo content

  Scenario: Agent claims are bounded and labelled
    Given an agent augments a semantic investigation page
    When the page is produced
    Then each agent contribution is labelled as a claim with a confidence tag
    And agent text does not override deterministic evidence
