# Product Specification: Atlas Drill-Down Decision Semantics

> **Status:** ready for implementation planning.
>
> **Authority:** `08-portolan-product-charter.md` governs product concepts.
> `13-atlas-navigation-index.md` governs the current route/coverage/finding/
> unknown/evidence bundle. `15-atlas-reading-experience.md` governs the
> walkthrough-first reading surface.

## Reader And Goal

Reader: an implementation agent or reviewer taking the next Portolan demo
slice after `15`.

Post-read action: implement a drill-down contract where every visible click
answers a decision question, shows evidence or an honest gap, and makes the
next useful action clear.

This is not a vocabulary-polish slice. If this work mostly renames tabs, it is
the wrong work.

## Product Failure Being Fixed

`15` moved the first screen from a repository map to a reading-first atlas.
That is real progress, but the next clicks still leak old behavior:

- navigation labels are still not self-explanatory to a cold user;
- `Fleet` can sound like an agent/ship concept while showing a repo/component
  graph;
- clicking a relationship can fall back to a generic component/repo view;
- clicking an unknown/probe can lose the route/stage context that made it
  important;
- evidence chips do not reliably open a source/evidence detail;
- C4 is not an explicit map with honest-empty states;
- `machine_status: verified` can sit beside missing source anchors and make weak
  evidence look stronger than it is.

The next slice is valuable only if it makes the atlas answer CTO/user questions:

- What am I looking at?
- Why is this object in the atlas?
- What does this relationship or route stage claim?
- What evidence supports it?
- What is not assessed?
- What should the next agent do?

## Decision Gate

**Simpler/Faster:** keep the existing clean-stack shell, route bundle, and
walkthrough. Add a drill-down semantics layer, bounded detail panels, evidence
usability status, and harness assertions. Do not add a graph engine, database,
daemon, hosted service, or broad producer rewrite.

**Blocking Edge Cases:** Bigtop is fixture/profile-backed; many anchors are
missing or ambiguous; runtime/build/test probes did not run; relationship data
may be inferred or weak; C4 Container must not be fabricated from repository
names; a cold user may not understand Portolan terms.

**Existing Open Source:** existing tools already do parts of this well:

- Backstage gives software-catalog entities clear semantics: components, APIs,
  resources, systems, domains, and typed relations.
- Structurizr/C4 uses multiple views from one model, including system context
  and container/component diagrams.
- GitHub, Sourcegraph/SCIP, and OpenGrok focus on source navigation,
  definitions, references, cross-repo navigation, and cross-reference search.
- CodeQL path queries show path explanations for analysis results.

Portolan should not become a worse Backstage, worse Sourcegraph, or worse
Structurizr. Its wedge is local-first expedition context for agents and humans:
routes, coverage, risks, unknowns, evidence states, and next probes in one
portable atlas.

## OSS Reality Check

This spec is justified only if Portolan stays complementary:

- **Backstage-like lesson:** typed entities and relations need stable meaning.
  Backstage explicitly models components, APIs, resources, systems, and domains;
  relations have source, target, direction, and type. Portolan relationships
  must be explainable, directional, and evidence-scoped, not anonymous graph
  edges.
- **Structurizr/C4 lesson:** a map is a view over a model. C4 is not a renamed
  repo graph; it is nested decomposition. If runtime/deploy evidence is absent,
  Portolan must show an honest-empty Container level rather than inventing one.
- **Sourcegraph/GitHub/OpenGrok lesson:** source navigation wins by precise
  anchors, definitions, references, and cross-references. Portolan should link
  to source evidence when it has it, and admit when it does not.
- **CodeQL lesson:** path explanations matter because they show why an alert
  exists. Portolan route/stage/finding/probe details should behave like
  explanations, not rows.

References used for this check:

- Backstage system model: https://backstage.io/docs/features/software-catalog/system-model/
- Backstage well-known relations: https://backstage.io/docs/features/software-catalog/well-known-relations/
- Structurizr/C4: https://structurizr.com/
- GitHub code navigation: https://docs.github.com/en/repositories/working-with-files/using-files/navigating-code-on-github
- Sourcegraph cross-repository navigation / SCIP: https://sourcegraph.com/blog/cross-repository-code-navigation
- OpenGrok source navigation: https://github.com/oracle/opengrok
- CodeQL path queries: https://codeql.github.com/docs/writing-codeql-queries/creating-path-queries/

## Self-Critique Findings

The spec was challenged by separate reviewer lanes before being written.

### Critical: Vocabulary-Only Work Would Be Drift

`08`, `13`, and `15` already define many terms. Adding another naming layer
without changing user outcomes would make Portolan harder to implement and
review.

Decision: `16` is not a glossary. It is a click-and-decision contract.

### Major: Current UI Can Greenwash Weak Evidence

The generated Bigtop bundle can validate structurally while route anchors are
missing or ambiguous. `machine_status: verified` currently means artifact
validation, not that source evidence is usable.

Decision: introduce an explicit evidence-usability readout in the UI and
harness. Do not let artifact validation imply evidence depth.

### Major: Drill-Down Semantics Are Too Weak

Route cards lead to dossiers, but route-stage nodes, evidence chips,
relationship edges, and probe cards do not consistently open meaningful
details.

Decision: every clickable primary object must have a declared destination and a
declared question it answers.

### Major: Unknown/Probe Context Is Lost

Probe rows can appear without bidirectional route/finding/evidence refs. A top
level probe click must still explain which journey/stage made the unknown
matter.

Decision: probe details must show reverse context derived from route stages
even when the probe row itself lacks refs.

## Scope

### Owned In This Slice

- reader-facing navigation labels and section explanations;
- click/destination contract for primary atlas objects;
- bounded detail panels for relationship, finding/risk, unknown/probe, and
  evidence anchor;
- stronger route-stage drill-down from diagram/stage cards into focused stage
  detail;
- repository/component dossier contract for map nodes;
- C4 honest-empty map/view;
- evidence-usability status distinct from artifact validation;
- harness assertions that clicks deepen meaning instead of falling back to
  generic repo/component pages.

### Explicit Non-Goals

- broad visual redesign;
- broad schema migration;
- new source scanner integration;
- new graph/layout library;
- runtime/build/test execution;
- network probes;
- complete C4 extraction from runtime/deploy topology;
- Part 2 live Fleet/agent navigation;
- replacing Backstage, Sourcegraph, OpenGrok, CodeQL, or Structurizr.

## Navigation Labels

Top navigation must use reader-facing labels. Labels may change if the
implementation proves a better wording, but each label must be understandable
without knowing Portolan internals.

Default labels:

| Label | Purpose | Must Explain |
| --- | --- | --- |
| `Overview` | What this landscape appears to be and what matters first. | main system story, first risks, next checks |
| `System Routes` | How code/config moves through source, build, deploy, test, and runtime. | journeys/routes and confidence boundaries |
| `Structure Map` | Supporting repository/component/relationship chart. | what nodes and edges mean |
| `Mapped Areas` | What is covered, partial, route-less, missing, or not assessed. | survey state and gaps |
| `Hazards` | Structural risks and findings. | why the risk matters and what evidence supports it |
| `Next Checks` | Unknowns/probes an agent can run with permission. | what is unknown and what would reduce uncertainty |
| `Run Log` | What Portolan generated, validated, blocked, or could not assess. | artifact validation vs evidence usability |
| `C4` | Optional decomposition view. | context/container/component/code state, including honest-empty levels |

Do not use unexplained primary labels such as `Fleet`, `Probes`, or `Receipt`.
Maritime language can appear as secondary flavor only if it clarifies rather
than obscures. Example: `Run Log` may mention "logbook" in supporting copy.

Each section must start with a one-sentence explanation:

- what this section is;
- why the admiral would open it;
- what can be clicked here;
- what clicking should reveal.

## Drill-Down Contract

Every visible primary object must declare one of these navigation outcomes:

- **Dossier:** full explanation for a major atlas object.
- **Detail:** bounded explanation for a relation, risk, probe, stage, or
  evidence anchor.
- **External evidence:** explicit handoff into source code or repo, only after
  the atlas has explained what the user is leaving to inspect.
- **Disabled with reason:** visible object has no safe detail.

No click may silently fall back to a generic repository/component page.

### Repository Or Component

Click opens a dossier.

The dossier must answer:

- what it is;
- why it is present in the atlas;
- whether it participates in any system route;
- whether it is covered, partial, route-less, missing, or not assessed;
- relationships in and out;
- attached hazards;
- attached next checks;
- evidence anchors;
- C4 placement or honest absence;
- next useful action.

If the object has no routes, hazards, probes, or evidence, the dossier must say
that explicitly and explain why it still appears.

### Relationship

Click opens a relationship detail panel.

The detail must answer:

- source object;
- target object;
- relationship type;
- direction;
- whether it is deterministic, fixture-backed, inferred, or unknown;
- evidence state and evidence refs;
- route/stage context if any;
- hazards or probes attached to the relationship;
- what the relationship proves;
- what it does not prove.

If the current data cannot support relationship details, the click must be
disabled or routed to a detail panel saying `not_assessed`, not to a generic
Bigtop/component dossier.

### System Route

Click opens a route dossier, as in `15`, but the dossier must additionally let
the admiral focus individual stages.

The route dossier must answer:

- what system question this route answers;
- ordered route diagram;
- source/build/deploy/test/runtime confidence boundary;
- stage details;
- attached hazards;
- attached next checks;
- evidence usability status for the route;
- next expedition.

### Route Stage

Clicking a diagram node or stage card opens/focuses a stage detail.

The stage detail must answer:

- role in the journey;
- subject repo/component;
- source path and anchor;
- line range if precise;
- source excerpt if safe and available;
- missing/ambiguous explanation if not precise;
- evidence state;
- runtime/build/test status;
- attached hazards and probes;
- what this stage proves;
- what it does not prove.

### Hazard / Finding

Click opens a risk detail panel.

The detail must answer:

- what the hazard is;
- where it attaches;
- why it matters for navigation or CTO decision-making;
- severity;
- confidence;
- evidence refs;
- related route/stage/component;
- next check to reduce uncertainty.

Do not render findings as a flat JSON field dump.

### Next Check / Unknown Probe

Click opens a probe detail panel.

The detail must answer:

- what is unknown;
- why Portolan cannot claim it;
- status: `blocked`, `not_assessed`, `cannot_verify`, or `failed`;
- required permission class;
- exact next probe text;
- expected output/artifact if the probe runs;
- linked route/stage/finding/evidence, derived in reverse if the probe row
  lacks direct refs;
- whether the probe is safe by default.

Unknowns are navigation steps, not passive warnings.

### Evidence Anchor

Click opens an evidence detail panel or source excerpt focus.

The detail must answer:

- local path;
- anchor type;
- line range when precise;
- excerpt, max 12 lines;
- evidence state;
- anchor quality: `precise`, `ambiguous`, `missing`, `missing-file`, or
  `unresolved`;
- what this evidence proves;
- what it does not prove;
- linked route/stage/finding/probe.

Source-visible evidence must never imply runtime/build/test verification.

## C4 Contract

C4 is an optional map, not a renamed graph.

Required behavior:

- Context level is always present: target system and true external systems if
  known.
- Container level appears only with observed runtime/deploy evidence.
- If runtime/deploy evidence is absent, Container is shown as honest-empty with
  a plain explanation.
- Component level uses promoted units only.
- Code level is out of scope; the next action is into source evidence.
- C4 boxes click to dossiers or are disabled with an explanation.
- C4 must not infer containers from repository names, family colors, or visual
  grouping.

For the current Bigtop demo, honest-empty Container is acceptable and expected
unless runtime/deploy evidence is actually generated.

## Evidence Usability Status

Add a UI/readout distinct from `machine_status`.

Definitions:

- `artifact_validated`: JSON/JSONL files parse, refs resolve, and validators
  pass.
- `evidence_anchored`: at least one route has precise source anchors and
  snippets for key stages.
- `evidence_partial`: some stages have precise anchors/snippets, while others
  are missing/ambiguous/unresolved.
- `evidence_weak`: the route exists but key stages have no precise source
  anchors.
- `runtime_not_assessed`: build/test/runtime claims were not executed.

The Run Log must show both artifact validation and evidence usability.

Hard rule: `artifact_validated` must not be displayed as if the atlas is
evidence-rich.

## CTO Decision Bar

This slice is worth doing only if it helps a CTO or technical lead make a
decision faster.

The generated Bigtop HTML must let a cold reviewer answer:

1. What part of the system am I inspecting?
2. Why does this object/relationship/stage matter?
3. What exact evidence backs the claim?
4. What is missing, ambiguous, or not assessed?
5. What would I ask an agent to inspect next?
6. Where does the atlas stop and source code become the ground truth?

If the answer is still "click around until you land on Apache Bigtop", the
slice failed.

## Machine Acceptance

Add a local harness:

```bash
bash scripts/harness-atlas-drilldown-semantics.sh
```

It must:

- generate fresh Bigtop and `portolan-self` review HTML;
- preserve `13` navigation-index harness;
- preserve `15` reading-experience harness;
- assert reader-facing top nav labels and section explanations;
- assert `Fleet` is not used as an unexplained primary top-nav label;
- assert relationship clicks route to relationship detail or are disabled with
  reason;
- assert route diagram nodes/stage cards route to stage detail or focused stage
  sections;
- assert hazard/finding cards route to risk detail;
- assert next-check/probe cards route to probe detail;
- assert evidence chips route to evidence detail or source excerpt focus;
- assert C4 exists as a map/section with honest-empty Container when no
  runtime/deploy evidence exists;
- assert Run Log separates artifact validation from evidence usability;
- assert no click target falls back to a generic component/repo dossier without
  explanation.

The harness must not claim human acceptance.

## BDD

```gherkin
Feature: Atlas drill-down semantics turn clicks into decisions

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
```

## Acceptance Checklist

Pass when all are true:

1. Top nav labels are reader-facing and explained.
2. `Fleet` is removed from primary top nav or explicitly explained as a
   secondary Structure Map concept.
3. Every visible primary clickable object has a declared dossier/detail target
   or disabled-with-reason state.
4. Relationship clicks no longer fall through to generic repo/component pages.
5. Route diagram nodes and stage cards open/focus stage details.
6. Hazard/finding clicks open risk details.
7. Next-check/probe clicks open probe details with route/stage context.
8. Evidence chips/anchors open evidence detail or source focus.
9. C4 exists as an optional map with honest-empty Container when appropriate.
10. Run Log separates artifact validation from evidence usability.
11. Existing `13` and `15` harnesses still pass.
12. The drill-down semantics harness passes.
13. A human reviewer can answer the CTO decision bar questions from the Bigtop
    HTML.

Fail when any are true:

- work is mostly renaming labels;
- a relationship/probe/evidence click lands on a generic Apache Bigtop dossier;
- top nav requires Portolan-internal knowledge to understand;
- C4 is a renamed repo graph;
- missing/ambiguous anchors are hidden;
- `machine_status: verified` is used as evidence-depth proof;
- source-visible evidence is treated as runtime/build/test proof;
- the reviewer still has to read raw Bigtop repos to know why an object was
  clickable.

## Implementation Notes

Prefer additive view-model/use-case changes:

- derive reverse refs from navigation-index rows where probe/finding/evidence
  rows lack direct refs;
- add bounded detail renderers before adding new persisted schema fields;
- add evidence-usability calculation in domain/view-model;
- rename labels in shell copy without broad visual redesign;
- keep C4 honest-empty if runtime/deploy evidence is absent.

Persisted JSONL/schema changes are allowed only if bounded detail cannot be
derived safely from existing artifacts. If changed, update `13` validators and
harnesses explicitly.

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

```bash
bash scripts/harness-atlas-drilldown-semantics.sh
```

The agent must export review HTML:

```text
/tmp/portolan-review-nav-bigtop/atlas.html
/tmp/portolan-review-nav-self/atlas.html
```

## Handoff Prompt

```text
Implement docs/captain-atlas/16-atlas-drilldown-decision-semantics.md.

Work from:
- docs/captain-atlas/08-portolan-product-charter.md
- docs/captain-atlas/13-atlas-navigation-index.md
- docs/captain-atlas/15-atlas-reading-experience.md
- docs/captain-atlas/16-atlas-drilldown-decision-semantics.md

Do not do a vocabulary-only pass.
Do not redesign the visual identity.
Do not add a daemon, database, hosted service, graph engine, or new scanner.
Do not claim C4 Container evidence unless runtime/deploy evidence exists.
Do not let artifact validation imply evidence depth.

Goal:
Every primary click in the generated Bigtop HTML must answer a decision question:
what this thing is, why it matters, what evidence supports it, what is unknown,
and what the next useful action is.

Hard fail:
If clicking a relationship, probe, evidence chip, route stage, or map object
lands on a generic Apache Bigtop/repository dossier without explaining the
clicked object, the implementation failed.

Required verification:
- cd portolan-core && npm test && npm run test:deps
- bash scripts/harness-atlas-navigation-index.sh
- bash scripts/harness-atlas-reading-experience.sh
- bash scripts/harness-atlas-drilldown-semantics.sh

Return:
- files changed;
- generated Bigtop and portolan-self HTML paths;
- exact commands run and statuses;
- what is machine-verified;
- what remains human-review only;
- any blocked or not_assessed surfaces.
```

