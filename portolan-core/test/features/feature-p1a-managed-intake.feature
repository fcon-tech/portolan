Feature: Managed intake records what the captain has
  Part-1a: the root Portolan skill runs a conversational intake, persists a typed
  intake result, and a rebuild reuses it without re-asking.

  Scenario: Captain names repositories only
    Given the captain drops a Portolan link to an agent
    When the agent runs managed intake
    Then the agent asks what anchors the captain has
    And the captain names one or more repository roots
    And a typed intake result is persisted under .portolan/
    And a deterministic rebuild reuses that intake result without re-asking

  Scenario: Captain names repos, docs, and a ticket source
    Given the captain names a repository root, a docs location, and a ticket API
    When intake completes
    Then the intake result records all three anchors with their access methods
    And the perimeter is the union of the named roots
