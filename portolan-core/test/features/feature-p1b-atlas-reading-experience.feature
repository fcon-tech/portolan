Feature: Atlas reading experience turns Bigtop from repo map into system atlas
  The first screen is a system walkthrough, the package journey is a route
  diagram plus a reading dossier, the graph becomes a secondary Fleet map.

  Scenario: The first screen is a system walkthrough
    Given the target is the Bigtop landscape
    And a navigation atlas bundle is present
    When the admiral opens /portolan:map
    Then the first screen shows named system journeys
    And the first screen explains what Bigtop appears to do as a system
    And the first screen shows top risks or unknowns
    And the Fleet map is available as a secondary map
    And the repository graph is not the primary first-screen content

  Scenario: Package journey reads as a system route
    Given the Bigtop package-distribution route exists
    When the admiral opens the package journey
    Then the route appears as an ordered diagram
    And the diagram shows BOM, recipe, provisioning, test or smoke, and runtime or unknown stages
    And each stage shows evidence state and runtime/build/test assessment
    And attached findings and unknown probes are visible on the route

  Scenario: Route dossier explains evidence and uncertainty
    Given a route stage has source evidence
    When the admiral opens the route dossier
    Then the dossier shows the route thesis
    And stage cards show source paths, anchors, and snippets when available
    And ambiguous or missing anchors are explained in plain language
    And source-visible stages do not imply runtime verification

  Scenario: Findings and probes guide the next expedition
    Given the package route has findings and unknown probes
    When the admiral reads the route dossier
    Then findings explain the system risk and evidence
    And unknown probes explain what is not assessed
    And each unknown probe names the required permission class
    And the next-expedition section gives a concrete next agent action

  Scenario: Coverage shows system scale
    Given the Bigtop corpus has multiple subjects
    When the admiral opens coverage
    Then covered, partial, missing, and route-less regions are visible
    And representative regions link to routes, findings, or unknown probes
    And coverage is not only a flat subject table

  Scenario: Human review can reject repo-map regressions
    Given the generated Bigtop HTML is opened by a reviewer
    When the reviewer clicks every primary screen
    Then the reviewer can answer the six UX acceptance questions
    And if the reviewer says "this is only a repo map with links" the scenario is failed
