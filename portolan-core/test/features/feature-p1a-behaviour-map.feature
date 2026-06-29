Feature: /portolan:map opens the atlas
  Part-1a: the entry point opens an annotated overview map, not an undifferentiated
  node-link graph, reconciling with the frozen 07 "Overview default" rule.

  Scenario: First screen is an annotated overview, not an undifferentiated graph
    Given a snapshot exists
    When the agent opens /portolan:map
    Then an annotated overview map renders
    And it shows target identity, unit count, and dominant groupings
    And it does not show an undifferentiated node-link graph as the first screen
    And a clear affordance opens the full behaviour map

  Scenario: Snapshot is collected when stale or absent
    Given a target with no snapshot or a stale snapshot
    When the agent runs /portolan:map
    Then the snapshot is collected via the deterministic Go core
    And the atlas opens with the fresh snapshot
    And the collected snapshot is non-empty (at least one component)

  Scenario: Snapshot is reused when fresh
    Given a target with a fresh snapshot (tree signature unchanged)
    When the agent runs /portolan:map
    Then the snapshot is reused without rebuilding
    And the atlas opens from the existing snapshot

  Scenario: The behaviour map shows units and typed edges
    Given the overview is visible
    When the admiral opens the behaviour map
    Then units and their typed edges render as an interactive graph
    And each unit carries its evidence.state
    And clicking a unit opens its dossier

  Scenario: Zoom controls detail without losing structure
    Given the behaviour map is visible
    When the admiral zooms out
    Then low-importance units are elided into groups and hubs remain
    And when the admiral zooms in all units, edges, and labels are shown
