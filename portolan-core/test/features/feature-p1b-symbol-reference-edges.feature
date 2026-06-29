Feature: Symbol reference edges surface honestly in the atlas
  Part-1b: typed `references` edges (resolved from symbol-index role data) render
  in the atlas with bounded evidence. Their completeness stays not_assessed —
  never over-claimed as a complete call graph. Bound to openspec/specs/ontology.

  Scenario: A reference relationship renders as a typed edge
    Given a snapshot contains a `references` relationship between two components
    When the admiral opens the behaviour map
    Then the reference renders as a typed edge
    And its evidence is metadata-visible

  Scenario: A reference edge is explained honestly, not as a complete call graph
    Given a snapshot contains a `references` relationship
    When the admiral opens the relationship detail
    Then the type is `references`
    And the evidence is metadata-visible, not source-visible
    And the explanation states it is not a complete call graph
