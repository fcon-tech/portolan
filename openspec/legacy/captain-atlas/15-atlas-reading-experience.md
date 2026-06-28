# Product Specification: Atlas Reading Experience

> **Status:** ready for overnight implementation agent.
>
> **Authority:** `08-portolan-product-charter.md` governs product concepts.
> `13-atlas-navigation-index.md` remains the data-contract baseline for routes,
> coverage, findings, unknown probes, evidence, and receipt validation.
> `14-atlas-navigation-index-acceptance-review.md` is the immediate failure
> evidence that motivates this slice.

## Reader And Goal

Reader: an implementation agent taking the next one-day Portolan demo slice.

Post-read action: replace the current repository-map demo experience with a
reading experience that lets the admiral understand Bigtop as a system.

This is a UX/product slice, not a data-contract slice.

The implementation may keep the current fixture-backed navigation bundle, but
the generated HTML must stop behaving like "22 repositories with links". The
admiral must see routes, system journeys, dossiers, evidence, risks, unknowns,
and next probes as the primary geography.

## Product Failure Being Fixed

The current implementation of `13` added route, coverage, finding, unknown,
evidence, and receipt artifacts. Machine validation passes.

The demo still fails.

When the admiral opens and clicks through the generated HTML, the experience is
still effectively:

- a graph of repositories/components;
- weak metric cards;
- table-like route/finding/probe screens;
- dossiers that repeat JSONL fields;
- links out to GitHub/Jira-like surfaces;
- no meaningful system explanation.

That is not "understand the landscape". It is not close.

The admiral should not have to read raw Bigtop repositories to discover the
point of Portolan. Portolan must turn the corpus into an atlas.

## Decision Gate

**Simpler/Faster:** reuse the existing `navAtlas` bundle and clean-stack shell.
Change the atlas reading flow and view-model composition before building a new
producer. Do not add a database, daemon, hosted service, graph database, or new
heavy scanner dependency for this slice.

**Blocking Edge Cases:** Bigtop is a multi-repo ecosystem; current extraction is
fixture-backed; source anchors may be ambiguous; runtime/build/test probes are
not assessed; the existing graph is still useful as a fleet layer; the UI must
not fabricate runtime truth or imply that source-visible means verified.

**Existing Open Source:** graph/layout libraries do not solve this failure.
This is not a force-directed-layout problem. Existing OSS may later produce
symbol graphs, dependency graphs, SBOMs, duplication reports, dead-code reports,
or call graphs, but this slice is about turning already available atlas objects
into a readable product experience.

Decision: build a reading-first atlas experience now. Keep the repo/component
graph as a supporting Fleet map. Make system journeys, dossiers, route
diagrams, evidence snippets, findings, unknowns, and next probes the product.

## Product Thesis

Portolan is a navigation atlas of a system, not a repository map.

For Bigtop, the admiral must understand:

- how package definitions turn into deployable/runtime artifacts;
- where build/test/runtime confidence stops;
- which repositories are central, peripheral, legacy, missing, or unknown;
- where version boundaries and duplicated concepts matter;
- what a follow-up agent should inspect next.

If the first screen can be honestly summarized as "a pretty graph of repos",
the implementation failed.

## Scope

### Owned In This Slice

This slice owns the generated HTML reading experience:

- default `/portolan:map` landing surface;
- overview/walkthrough composition;
- route reading surface;
- route diagram rendering;
- route dossier content hierarchy;
- evidence snippet rendering from existing source anchors where available;
- finding and unknown-probe cards attached to routes;
- coverage/region reading surface;
- "Fleet" supporting map affordance for the existing graph;
- Bigtop review export used for human demo review;
- focused tests/harness proving the experience is not graph-first.

### Explicit Non-Goals

This slice does not own:

- new broad producer generalization;
- new visual identity or color-system redesign;
- full symbol graph extraction;
- full dead-code proof;
- full duplication proof;
- full cycle detection;
- runtime/build/test execution;
- network probes;
- replacing the `13` artifact schema unless a minimal additive field is needed;
- making Bigtop-specific fixture content look generic.

### Allowed Additions

The implementation may add small additive view-model fields derived from
existing artifacts, for example:

- `journey_summary`;
- `why_it_matters`;
- `stage_role`;
- `source_excerpt`;
- `system_question`;
- `next_probe_label`;
- `reading_priority`;
- `route_diagram_nodes`;
- `route_diagram_edges`.

If added, they must be generated, not hand-written into the final HTML.

Do not break existing artifact readers.

## Required Product Shape

### 1. First Screen: System Walkthrough, Not Graph

`/portolan:map` must open to a Bigtop system walkthrough when a nav atlas is
present.

The first viewport must show:

- target identity: Bigtop landscape;
- a one-paragraph "what this system is" summary;
- 3-5 named system journeys;
- the top risks/unknowns attached to those journeys;
- a clear next-expedition section;
- a secondary affordance to open the Fleet map.

The existing component/repository graph must not be the default hero or primary
body. It may appear as a secondary "Fleet" map.

Minimum Bigtop journeys:

1. **Package Definition To Runtime Candidate**
   - show BOM/package recipe/provisioner/test/runtime-unknown stages;
   - explain where static source visibility stops;
   - attach version-boundary finding and blocked runtime/build probes.
2. **Build And Smoke Confidence Boundary**
   - show where package/test confidence is not assessed;
   - expose why this cannot be called verified without running probes.
3. **Repository Fleet Coverage**
   - show central covered repositories, partial/missing regions, and peripheral
     repositories without meaningful routes.

Preferred additional journeys when available:

- release/version governance;
- legacy/retired/unknown zone;
- duplicated concept or same-name boundary.

### 2. Journey Cards Must Teach Something

Each journey card must answer:

- What is this journey?
- Why does it matter?
- What files/repos are involved?
- What is known?
- What is not assessed or blocked?
- What should an agent do next?

Bad card:

```text
route:bigtop:package-distribution
family package_distribution
6 stages
```

Good card:

```text
Package Definition To Runtime Candidate
Bigtop declares package versions in the BOM, maps them into package recipes,
then points deployment/provisioning at generated artifacts. Portolan can see the
static chain, but build, smoke, and runtime evidence are not verified.

Known: BOM and recipe anchors are source-visible.
Unknown: package build, smoke test, runtime layout.
Next probe: run the package build/smoke check in an approved sandbox.
```

### 3. Route Screen Must Be A Diagram, Not A Table

Opening a journey/route must show a route diagram before any table-like detail.

The route diagram must render:

- ordered stages;
- directional flow;
- stage type/role;
- evidence state;
- runtime/build/test assessment;
- attached finding badges;
- attached unknown-probe badges.

It can be implemented with HTML/CSS/SVG. It does not need a graph library.

The route diagram must not be a repo graph. It is a system path.

### 4. Route Dossier Must Be A Reading Surface

The route dossier must be organized as:

1. **Route thesis**: what this route explains.
2. **Diagram**: ordered system path.
3. **Stage cards**: one card per stage.
4. **Evidence**: source paths, anchors, and snippets when available.
5. **Risks**: attached findings.
6. **Unknowns**: attached probes and why they are blocked/not assessed.
7. **Next expedition**: concrete next agent action.

Stage cards must show:

- stage title;
- role in system;
- subject/repository;
- source path and anchor;
- line range when precise;
- visible snippet when safe and available;
- evidence state;
- runtime/build/test status;
- why the stage matters.

If a source anchor is ambiguous or missing, the dossier must say so in plain
language. Do not hide it in a badge.

### 5. Evidence Snippets

For each route stage with a resolvable source path and precise anchor, the
generated HTML must show a short excerpt.

Rules:

- max 12 lines per snippet;
- preserve line numbers;
- if the anchor is ambiguous, say "ambiguous anchor" and show no fake precise
  lines unless the generator has a precise match;
- if the file is missing, show the missing path and keep the stage visible;
- do not fetch remote URLs;
- do not require network.

The excerpt is not required to prove runtime behavior. It only proves source
visibility.

### 6. Findings Must Explain System Risk

Findings must appear where they matter:

- on first-screen journey cards;
- on route diagrams;
- in route dossiers;
- in a separate findings index.

Each finding card must answer:

- what is the risk?
- where does it attach?
- why should the admiral care?
- what evidence supports it?
- what next check would reduce uncertainty?

Do not render findings as a flat list of JSON fields.

### 7. Unknown Probes Must Become Expedition Steps

Unknown probes must appear as a plan, not as a passive list.

Each probe card must show:

- what is unknown;
- why Portolan cannot claim it;
- required permission class;
- exact next probe text;
- expected output/artifact if the probe runs;
- linked route/stage/finding.

The first screen must show the top 3 next probes.

### 8. Coverage Must Show Scale

Coverage must stop looking like a table of subjects.

The coverage/region surface must show:

- covered regions;
- partial regions;
- missing or route-less regions;
- central/peripheral distinction when derivable;
- counts by route status;
- the route(s), finding(s), and unknown(s) attached to each region.

This is where the admiral sees that Bigtop is a fleet, not only one route.

### 9. Fleet Map Is Supporting, Not Primary

The existing graph can remain, but it must be renamed/reframed as Fleet or
Component/Fleet map.

Rules:

- it is one click away from the walkthrough;
- it is not the default first screen when nav atlas exists;
- it links back to journeys/routes;
- empty or weak graph nodes should not pretend to be system understanding.

### 10. Follow-Up Agent Handoff

The generated HTML must include a visible "Agent handoff" or "Next expedition"
area with copyable command/query affordances for:

- list journeys/routes;
- open the package-distribution route;
- list unknown probes;
- list findings for the package route;
- show receipt validation;
- show coverage gaps.

This section is not for the admiral to run manually in the product future. It
is for the current demo to prove that Portolan has become a handoff artifact.

## Minimum Bigtop Content Bar

The Bigtop demo must contain at least these reading objects:

### Journey: Package Definition To Runtime Candidate

Required stages:

- BOM/version declaration;
- package recipe;
- deployment/provisioning reference;
- smoke/test or validation surface;
- runtime layout or runtime unknown.

Required attached objects:

- at least one version-boundary finding;
- at least one build/test/runtime unknown probe;
- at least three evidence/source cards.

### Journey: Build And Smoke Confidence Boundary

Required stages:

- build/package source stage;
- smoke/test source stage or missing-test signal;
- blocked/not-assessed runtime/build/test assessment.

Required attached objects:

- at least one explicit "cannot call this verified" explanation;
- at least one next probe with permission class.

### Journey: Repository Fleet Coverage

Required content:

- total covered subjects;
- subjects with routes;
- subjects without meaningful routes;
- missing/partial/not-assessed regions;
- links from representative regions into routes/findings/probes.

## UX Acceptance

Automated checks are necessary but not sufficient.

The demo passes only if a human can open the generated Bigtop HTML and, within
three minutes, answer:

1. What does Bigtop appear to do as a system?
2. What is the main package/deploy/test/runtime journey?
3. Where does Portolan's confidence stop?
4. What risk or boundary should I care about first?
5. What should the next agent probe?
6. Where is the repo/fleet map, and why is it secondary?

The demo fails if the honest human summary is:

> This is a pretty map of repositories with some links.

## Machine Acceptance

The implementation must add a project-local harness, for example:

```bash
bash scripts/harness-atlas-reading-experience.sh
```

The harness must:

- generate the Bigtop review HTML;
- generate the `portolan-self` review HTML if still supported by the current
  bundle flow;
- assert that the Bigtop HTML contains first-screen journey content;
- assert that Fleet/graph is not the default primary route when nav atlas
  exists;
- assert that route diagrams are present;
- assert that route dossiers contain evidence snippets or explicit
  missing/ambiguous-anchor explanations;
- assert that top findings and unknown probes appear on the first screen or
  route cards;
- assert that next-expedition/handoff queries are visible;
- preserve the existing `13` validation harness.

The harness should not claim human UX acceptance. It should prove only that the
HTML contains the required reading surfaces.

## BDD

```gherkin
Feature: Atlas reading experience turns Bigtop from repo map into system atlas

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
```

## Acceptance Checklist

Pass when all are true:

1. `/portolan:map` defaults to a system walkthrough when `navAtlas` exists.
2. The first screen shows 3-5 named journeys and top risks/unknowns.
3. The existing graph is reframed as Fleet and is secondary.
4. The package journey opens to a diagram, not a table.
5. The route dossier contains thesis, diagram, stage cards, evidence, risks,
   unknowns, and next expedition.
6. Evidence snippets or explicit missing/ambiguous explanations are visible.
7. Findings explain system risk, not just fields.
8. Unknown probes explain what cannot be claimed and what to probe next.
9. Coverage shows system scale and route-less/partial regions.
10. Agent handoff queries/actions are visible.
11. Existing `13` bundle validation still passes.
12. The reading-experience harness passes.
13. A human can answer the six UX acceptance questions from the Bigtop HTML.

Fail when any are true:

- first screen is still primarily the repository/component graph;
- route pages are mainly JSONL/table field dumps;
- findings/probes are only separate flat lists;
- no route diagram exists;
- no evidence snippets or anchor-quality explanations exist;
- source-visible content is presented as runtime/build/test proof;
- graph/fleet nodes remain the only meaningful scale;
- Bigtop-specific fixture content is relabelled as generic extraction;
- human reviewer clicks all screens and still sees no product insight.

## Verification Commands

The implementation agent must run:

```bash
cd portolan-core && npm test && npm run test:deps
```

```bash
bash scripts/harness-atlas-navigation-index.sh
```

```bash
bash scripts/harness-atlas-reading-experience.sh
```

The agent must also export review HTML and report the paths:

```text
/tmp/portolan-review-nav-bigtop/atlas.html
/tmp/portolan-review-nav-self/atlas.html
```

If a local service is needed for review from another machine, serve the same
generated files without changing the committed artifacts.

## Handoff Prompt

```text
Implement docs/captain-atlas/15-atlas-reading-experience.md.

Work from:
- docs/captain-atlas/08-portolan-product-charter.md
- docs/captain-atlas/13-atlas-navigation-index.md
- docs/captain-atlas/14-atlas-navigation-index-acceptance-review.md
- docs/captain-atlas/15-atlas-reading-experience.md

Do not build another repository map.
Do not treat passing JSONL validation as product acceptance.
Do not redesign the visual identity.
Do not add a daemon, database, hosted service, or new heavy scanner dependency.

Goal:
The Bigtop generated HTML must read as a system atlas. The first screen is a
system walkthrough with named journeys, risks, unknowns, and next probes. The
existing graph becomes a secondary Fleet map. Opening the package journey shows
a route diagram and a dossier with evidence snippets, findings, unknowns, and
next-expedition steps.

Hard fail:
If a reviewer can click every primary screen and honestly say "this is just 22
repositories with links", the implementation failed even if all validators pass.

Required verification:
- cd portolan-core && npm test && npm run test:deps
- bash scripts/harness-atlas-navigation-index.sh
- bash scripts/harness-atlas-reading-experience.sh

Return:
- files changed;
- generated Bigtop and portolan-self HTML paths;
- exact commands run and statuses;
- which UX acceptance questions are verified by machine checks;
- which UX acceptance questions remain human-review only;
- any blocked or not_assessed surfaces.
```
