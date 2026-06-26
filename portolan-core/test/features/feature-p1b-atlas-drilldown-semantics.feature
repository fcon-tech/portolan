Feature: Atlas drill-down semantics turn clicks into decisions
  Every primary click answers what it is, why it matters, what evidence
  supports it, what is unknown, and the next useful action. No click lands on a
  generic repository/component dossier.

  Scenario: Navigation labels are reader-facing
    Given a navigation atlas bundle is present
    When the admiral opens /portolan:map
    Then the top navigation uses reader-facing labels
    And each section explains what it is, why to open it, and what can be clicked
    And unexplained internal labels such as Fleet, Probes, and Receipt are not the primary labels

  Scenario: Relationship clicks explain the edge
    Given the Structure Map shows a relationship
    When the admiral clicks the relationship
    Then a relationship detail opens or the click is disabled with a reason
    And the detail shows source, target, type, direction, evidence state, and what the relationship does not prove

  Scenario: Route stages drill into evidence
    Given a route diagram is visible
    When the admiral clicks a route stage
    Then the route dossier focuses a stage detail
    And the stage detail shows role, source anchor, evidence state, runtime/build/test state, and attached hazards/probes
    And missing or ambiguous anchors are explained in plain language

  Scenario: Unknown probes keep route context
    Given a next check is visible
    When the admiral opens the probe detail
    Then the detail explains what is unknown and why Portolan cannot claim it
    And it shows required permissions, expected output, and linked route/stage/finding context

  Scenario: Evidence anchors state what they prove
    Given an evidence chip or source anchor is visible
    When the admiral opens it
    Then evidence detail shows path, anchor quality, snippet or missing explanation, and what the evidence proves
    And source-visible evidence is not presented as runtime/build/test proof

  Scenario: C4 is honest-empty when runtime/deploy evidence is absent
    Given no runtime/deploy evidence is present
    When the admiral opens C4
    Then Context is present
    And Container is shown as honest-empty with explanation
    And Component uses promoted units only
    And Code is out of scope with a source-evidence handoff

  Scenario: Run Log separates artifact validation from evidence usability
    Given the bundle validates structurally
    And key route anchors are missing or ambiguous
    When the admiral opens Run Log
    Then artifact validation is shown separately from evidence usability
    And the atlas does not imply that verified artifacts mean evidence-rich routes
