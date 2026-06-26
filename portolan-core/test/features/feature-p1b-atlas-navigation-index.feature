Feature: Atlas navigation index turns a component map into a system atlas
  Part-1b (captain-atlas 13): the atlas exposes routes, coverage, findings,
  unknown probes, evidence, and receipt validation across Bigtop and
  portolan-self. Blocked/not-assessed truth is preserved; agent self-status is
  evidence, not authority.

  Scenario: Bigtop package route is navigable
    Given the target is the Bigtop landscape
    When Portolan generates the atlas navigation index
    Then navigation-index.jsonl contains a package/distribution route
    And the route has package, deploy or provisioner, test or smoke, runtime or unknown, and version-boundary stages
    And every verified source-visible stage resolves to evidence
    And runtime/build/test states remain blocked or not_assessed unless probes actually ran

  Scenario: Portolan-self implementation route is navigable
    Given the target is the Portolan repository
    When Portolan generates the atlas navigation index
    Then navigation-index.jsonl contains an implementation/toolchain route
    And the route covers command or script flow, bundle or schema flow, viewer or API flow, and a blocked runtime/test probe
    And the route links to at least one finding and one unknown probe

  Scenario: Coverage exposes missing and partial regions
    Given expected subjects were enumerated for the target
    When coverage-matrix.jsonl is generated
    Then every expected subject has a coverage row
    And missing or partial coverage is visible
    And no missing subject is silently omitted

  Scenario: Findings are first-class atlas objects
    Given frontier evidence contains structural risks
    When atlas-findings.jsonl is generated
    Then findings exist as rows with severity, confidence, subjects, evidence, and next checks
    And the viewer can open a finding dossier

  Scenario: Unknown probes preserve not-assessed truth
    Given runtime, build, CI, network, Docker, or package install probes did not run
    When unknown-probes.jsonl is generated
    Then blocked or not_assessed surfaces remain visible
    And each probe records the next safe check and required permissions
    And no blocked surface is marked verified because a probe exists

  Scenario: Receipt validation does not trust agent self-status blindly
    Given an agent self-status disagrees with machine validation
    When receipt-validation.json is generated
    Then both statuses are recorded
    And the disagreement is visible in the atlas
    And machine validation remains separate from the agent's manifest

  Scenario: Generated atlas is compared to raw-agent frontier
    Given raw-agent frontier findings exist for Bigtop and Portolan-self
    When frontier-comparison.md is generated
    Then required comparison rows exist
    And each row is labelled exceeds_frontier, matches_frontier, below_frontier, or not_assessed
    And any below_frontier row has a concrete next step
