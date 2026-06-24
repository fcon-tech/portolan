Feature: Region drill-down shows a statistical profile
  Part-1a: drilling into a group of units from the behaviour map opens a
  statistical portrait — the atlas's gazetteer entry next to a map region.

  Scenario: Drilling into a family cluster shows its statistical profile
    Given the behaviour map is visible
    When the admiral clicks a family cluster
    Then a region profile renders
    And it shows unit count, edge density, and surface count
    And it shows lifecycle and evidence distributions
    And it lists the top hubs by relationship count

  Scenario: A single-unit region is valid
    Given the behaviour map is visible
    When the admiral clicks a cluster containing one isolated unit
    Then a region profile renders with edge_density 0
    And it is a valid complete result
