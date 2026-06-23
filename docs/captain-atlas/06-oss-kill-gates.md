# BDD Work Package: OSS Kill Gates

## Agent Assignment

Attack Portolan from the market and OSS side. Find where existing tools already
solve the captain-atlas scenario, and decide whether Portolan should die, wrap,
or build.

## Product Question

Is Portolan actually needed, or should the captain use an existing tool or a
small pack around existing tools?

## Required Comparison Targets

- Understand Anything.
- CodeGraph or comparable local code graph tools.
- Repomix or repo packing tools.
- Serena or local semantic retrieval tools.
- Sourcegraph/Cody or comparable code intelligence products.
- Backstage or service catalog patterns.
- React Flow, Cytoscape, Sigma, ELK, or graph layout libraries for app shell.
- Semgrep, jscpd, Syft/CycloneDX, ctags, SCIP/LSIF/CodeQL/Kythe/Glean-style
  producers when locally usable.

## Implementation Slice

- Owned surfaces: tool scorecards, adapter shortlist, and kill / pack / build
  recommendation table.
- First vertical slice: evaluate one app-shell option, one code-graph/index
  option, one repo-pack option, and one producer option against the captain
  scorecard.
- Artifact: table with fit, maturity, maintenance, license, privacy, integration
  cost, local-first limits, and recommendation.
- Machine-readable artifact: `docs/captain-atlas/oss-kill-gates-scorecard.json`.
  It is intentionally allowed to contain `not_assessed` rows; the product gate
  requires those states to stay explicit instead of turning unrun alternatives
  into positive claims.
- Verify: run or inspect each candidate enough to defend the decision; mark
  unrun candidates as `not_assessed`.
- Out of scope: building an in-house capability before the relevant kill and
  pack options have failed.

## BDD

```gherkin
Feature: Portolan avoids rebuilding solved products

Scenario: Existing tool builds a better atlas
  Given an OSS or commercial tool can run locally on the target
  When the agent evaluates it against the captain-atlas scorecard
  Then the agent records whether it beats Portolan on first-run, map usefulness, drill-down, scale, and agent Q&A
  And Portolan's recommendation is kill or wrap for that capability

Scenario: Existing tool is useful but incomplete
  Given an existing tool produces useful graph, index, package, duplication, or SBOM output
  When Portolan can import or launch it safely
  Then the recommendation is pack
  And Portolan defines the adapter boundary instead of rebuilding the tool

Scenario: Existing tool cannot satisfy local-first captain use
  Given a tool requires hosted source export, credentials, daemon setup, or opaque LLM-authored claims
  When evaluating fit
  Then the limitation is recorded
  And Portolan may build only the missing local-first orchestration or viewer layer

Scenario: Build is justified only after kill and pack fail
  Given no existing tool or combination satisfies a required captain-atlas capability
  When the agent recommends build
  Then the report states the rejected alternatives, why they failed, and the smallest in-house scope
```

## Deliverables

- Tool scorecards using the captain-atlas acceptance dimensions.
- Recommendation per capability: kill, pack, or build.
- Adapter candidates with license, maintenance, privacy, and integration notes.
- Shortlist of tools to embed, wrap, import, or ignore.

## Acceptance

Pass when every major Portolan capability has a defended kill / pack / build
decision, and build is not chosen just because implementation is familiar.
