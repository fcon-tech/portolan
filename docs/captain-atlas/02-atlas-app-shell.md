# Supporting BDD Work Package: Local UI Shell

> Supporting note only. For the next implementation pass,
> `07-portolan-core-product-spec.md` is the controlling specification. If this
> file conflicts with `07`, follow `07`.

## Agent Assignment

Design and validate the generated local Portolan UI. This package is a
supporting note for product UI work; the controlling scope for the next
implementation pass is `07-portolan-core-product-spec.md`.

The reference bar is Understand Anything style exploration: polished,
relationship-aware, drill-down everywhere, with reports close to the objects
they explain. Do not interpret this as permission to make the first screen an
undifferentiated graph.

## Product Question

Can Portolan generate a local app that feels like a real atlas rather than a
static report or a list of findings?

## Scope

- Local app shell generated from a Portolan bundle and normalized system map.
- Desktop-first UX.
- Overview, C4, map, repo/component pages, relationship exploration, risk
  panels, surfaces, and report drill-down.
- No hosted service requirement.

## Out Of Scope

- Mobile optimization.
- Asking Cursor to write a new UI per target.
- Remote collaboration or accounts.
- Decorative graph without useful navigation.

## Implementation Slice

- Owned surfaces: local UI information architecture, required bundle fields,
  screenshot checklist, and app acceptance notes.
- First vertical slice: one bundle-backed overview screen with target identity,
  repo/component counts, coverage gaps, top risks, and map entry point. The map
  is an exploration surface, not the whole product.
- Artifact: screenshot set and checklist result for Bigtop or another large
  local target plus one smaller non-JVM target when available.
- Verify: cold-reader five-minute test against the generated app; do not count
  raw JSON or static reports as app success.
- Out of scope: hosted collaboration, accounts, and decorative graph work that
  does not improve navigation.

## BDD

```gherkin
Feature: Captain opens a useful local Portolan UI

Scenario: First screen orients the captain
  Given a Portolan bundle and normalized system map exist
  When the captain opens the local UI
  Then the first screen shows target name, repo count, component count, coverage, and top risks
  And the captain can reach a graph or map without opening a separate report
  And the first screen does not require reading documentation to understand where to start

Scenario: Map supports drill-down
  Given the graph contains repositories, components, and relationships
  When the captain selects a node or edge
  Then the app shows linked facts, files, reports, risks, and gaps
  And the captain can navigate back to the map without losing context

Scenario: Reports are attached to map objects
  Given the bundle contains repo profiles, relationships, findings, and claims
  When the captain opens a repo, component, edge, or risk
  Then the app shows the relevant report section beside or below the selected object
  And the report links back to the graph object

Scenario: Large graphs remain legible
  Given a target with dozens or hundreds of repos
  When the local UI loads
  Then the app groups, filters, searches, and zooms without collapsing into unreadable clutter
  And the captain can switch between overview, repo cluster, and detail views

Scenario: Weak or missing data is visible but not dominant
  Given some facts are partial or unknown
  When the captain explores the local UI
  Then gaps are shown near the affected objects
  And gaps do not drown out the landscape overview
```

## Deliverables

- UX acceptance checklist.
- Graph information architecture.
- Drill-down navigation contract.
- Required bundle fields for app rendering.
- Screenshot set for Bigtop and one non-JVM ecosystem.

## Acceptance

The app passes when a cold reader can answer within five minutes:

- what is in the landscape;
- what the main components are;
- how the important parts relate;
- where the most serious risks or smells are;
- what to click next for proof or detail.
