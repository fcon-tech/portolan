Feature: Deep landscape demo — connected structure, not a flat inventory
  Part-1b: the landscape view renders typed structural edges and shared-dependency
  clusters as connected structure; when only dependency edges exist it admits the
  limitation in plain language rather than disguising it as code-level architecture.
  Apache Bigtop is the named deep-landscape acceptance showcase. Bound to
  openspec/specs/reading-experience.

  Scenario: Landscape shows connected groupings and cross-component edges
    Given a snapshot contains structural reference edges and shared-dependency clusters across multiple components
    When the admiral opens the landscape view
    Then components are connected by typed edges into groupings and hubs
    And the system shape is legible at a glance
    And the view is not a flat list of repositories

  Scenario: Dependency-only landscape is admitted, not disguised
    Given a snapshot contains only shared-dependency edges and no structural edges
    When the admiral opens the landscape view
    Then the atlas states in plain language that only dependency-level structure is available
    And it does not present shared dependencies as code-level architecture

  # The two scenarios below are the full "connected ecosystem" showcase. They
  # require structural edges produced for the Bigtop corpus (the scip-producer
  # slice). They are tracked here so the showcase work is not lost; binding them
  # to a passing unit test is the gate that marks the showcase slice done.
  #
  # Scenario: The showcase reads as a connected ecosystem
  #   Given the Bigtop showcase is generated from a scan that includes structural edges
  #   When a reviewer opens it
  #   Then the landscape shows cross-component structural relationships and groupings
  #   And it does not read as a list of repositories that share libraries
  #
  # Scenario: The showcase is regenerable from a scan
  #   Given the Bigtop corpus is scanned
  #   When the showcase is regenerated
  #   Then the landscape view, journeys, findings, and coverage are produced from the scan output
  #   And the showcase is not hand-shaped data disconnected from a real scan
