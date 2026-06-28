# Portolan Core Product Specification

> **PARTIALLY SUPERSEDED — read `08-portolan-product-charter.md` first.**
>
> This file remains the **frozen contract authority** for the already-implemented
> `system-map` schema, builder, and viewer surfaces. Its **product concepts**
> (corpus manifest as mandatory start, C4 as the skeleton, role taxonomy as
> canonical grouping, "Containers/Families" as one level, retired-as-external
> context, manual CLI first-run) are **superseded** by
> `08-portolan-product-charter.md`. See the "Superseded Concepts" table at the
> end of `08` for the full mapping. Where `07` and `08` conflict on concepts,
> `08` wins; where `07` defines the implemented contract, `07` holds until a
> migration task reconciles it with `08`.

## Reader And Goal

Reader: an implementation agent working from a goal prompt.

Post-read action: rebuild the current Bigtop demo path into a Portolan product
slice that starts from an agent first run, produces a structured system map, and
lets a human drill into every meaningful object without hidden handholding.

This document is intentionally one large controlling specification. Do not split
it into smaller planning documents unless the user asks. Parallel agents may
take Task A-I sections as work packages, but this file remains the shared scope
and BDD authority.

Authority rule:

- This file supersedes `00-product-contract.md` through `06-oss-kill-gates.md`
  for the next implementation pass.
- Older work-package files may provide background, but they are not acceptance
  authority when they conflict with this file.
- In particular, any instruction that makes the graph or map the first product
  surface is stale for this pass.
- A green legacy bundle, atlas-map, or graph-first smoke test is not sufficient
  evidence that this specification passed.

Owned surfaces:

- normalized system-map contract;
- system-map generation/adaptation from current bundle artifacts;
- local UI behavior for overview, C4, map, components, risks, surfaces, and
  drill-down;
- Cursor Agent CLI first-run acceptance;
- BDD, browser, fixture, and cold-reader acceptance gates.

Out of scope:

- hosted services;
- remote SaaS ingestion;
- target mutation outside approved Portolan outputs;
- replacing Cursor/OpenCode/Codex as coding-agent harnesses;
- broad market research beyond the OSS delta check already required here.

First vertical slice:

- generate a normalized system map for the existing Bigtop fixture;
- render Overview, Components, one C4 family view, and component/surface
  dossiers;
- prove support matrix and mailing lists are surfaces, not default-map
  components;
- prove Cursor Agent CLI can run the first-run path or record the exact
  authentication/runtime blocker.

Minimum verify:

- `git diff --check`;
- `jq empty schema/*.json`;
- `(cd viewer && npm run build)`;
- schema and semantic validation for the generated system map;
- browser check for Overview, C4, component dossier, surface dossier, and route
  hooks;
- Cursor Agent CLI transcript or exact blocker.

Kill / pack / build posture:

- pack existing local producers, bundle scripts, and harnesses;
- build the missing normalized system-map contract and UI drill-down layer;
- kill any sub-feature that a local-first OSS tool already solves better after
  the existing OSS scorecard delta check.

## Problem Statement

The current public demo drifted into a graph-first dashboard. It is not the
target product.

The target product is:

```text
The user opens Cursor Composer, Cursor Agent CLI, or another shell-capable
coding agent.
The user gives the agent Portolan plus a local target root.
The agent installs or prepares Portolan.
The agent runs bounded local discovery.
Portolan produces a structured system map and local UI.
The user can understand what exists, why it exists, how parts relate, what is
known, what is unknown, and where to drill next.
```

Do not optimize for a pretty static page. Optimize for the user understanding a
real software estate through a repeatable Portolan run.

## Relationship To Existing Code

The repository is not a greenfield implementation. The implementation agent
must decide how each existing surface is migrated, adapted, or replaced before
writing UI code.

Current surfaces that must be accounted for:

- `schema/evidence-graph.schema.json` is the existing graph transport contract.
  Preserve it as an input/compatibility contract for this slice.
- The chosen migration strategy is: add `schema/system-map.schema.json` as the
  normalized output contract and add an adapter from current bundle/evidence
  artifacts into that system map. Do not replace `evidence-graph.schema.json`
  in this slice.
- `viewer/src/app.js` is the current graph-first viewer. It may be refactored
  or replaced, but a full viewer-framework replacement is a stop condition.
- Existing harness and bundle scripts are the plumbing base. They are not
  acceptance authority until they validate the normalized system map and the new
  UI/DOM contract. Prefer adapting them over adding unrelated runners.
- The existing OSS kill-gate scorecard is prior work. Future OSS checks are
  delta checks against that scorecard, not a fresh market-research loop.

Task B is blocked until the system-map schema and adapter contract are recorded
in code. UI work is not reviewable until Task B produces typed objects.

Task B is complete only when all of these exist:

- the normalized schema contract;
- a canonical generated system-map artifact at `.portolan/atlas/system-map.json`
  or another path explicitly recorded in the receipt and scorecard;
- an adapter or producer path from existing bundle artifacts to that system map;
- a validator command that checks both JSON Schema and semantic invariants such
  as object-id uniqueness, relationship endpoints, surface owners, route
  kind/object consistency, and component promotion signals;
- one Bigtop fixture or generated artifact that exercises component, repository,
  surface, relationship, finding, unknown, and C4 objects.

Until those exist, UI work may sketch layout, but it must not be reported as
passing product acceptance.

Permitted viewer work:

- reuse current bundle loading, local serving, and static build plumbing;
- replace the graph-first render topology;
- split `viewer/src/app.js` into modules if that reduces risk;
- add a small hash router and DOM test hooks.

Stop and ask before:

- replacing the viewer build system;
- adding a full SPA framework;
- replacing the local bundle/query substrate;
- requiring hosted runtime services.

## Mandatory Decision Gate

Before any implementation decision, answer these three questions in the work
log or PR description:

1. Simpler/Faster: can this product slice be solved with less code, fewer
   moving parts, fewer dependencies, or a smaller UI?
2. Blocking Edge Cases: what prevents the simpler solution on multi-repo,
   partly documented, partly black-box software estates?
3. Existing Open Source: should Portolan use, wrap, or export to an existing
   tool instead of building this part?

Do not turn this into broad market research. Check only enough to avoid
rebuilding obvious mature infrastructure.

## Non-Negotiable Lessons From The Failed Demo Spike

The failed spike is useful only as negative evidence. Do not continue it by
adding another panel or tooltip layer.

These are regressions unless explicitly accepted by the user:

- A graph where repositories, documentation, CI, support matrix, mailing lists,
  package modules, and runtime surfaces are all equal nodes.
- A map object that can be clicked but does not open a useful explanation.
- A table row or node such as Apache Sqoop that hides why it exists in the
  result.
- A documentation or community surface such as mailing lists floating as an
  unexplained component.
- A C4 view that is just a renamed graph.
- A UI control that does not change state or route to useful detail.
- A help icon layer that clutters labels or overlaps another panel.
- A public demo whose first screen depends on the maintainer explaining what to
  click.

## Plain Terms

Use these terms in implementation and UI copy. Avoid inventing new branded
words.

| Term | Meaning |
| --- | --- |
| Target root | Local directory the agent is asked to inspect. |
| System map | The generated Portolan result: components, relationships, facts, gaps, and UI data. |
| Component | A meaningful software or operational part that a human would name. Examples: Hadoop, Hive, Bigtop packaging, Sqoop. |
| Repository | A source repository. A repository can back one component, many components, or no independent component. |
| Surface | A related inspection surface: docs, wiki, issue tracker, CI, mailing list, support matrix, binary repo, Docker image, runtime endpoint. A surface is usually attached to a component or target, not shown as a peer component. |
| Relationship | A directed or undirected connection between components, repositories, packages, or surfaces. |
| Dossier | The detail view for one selected object. It explains what it is, why it exists, what facts support it, links, relationships, risks, and next drill-down steps. |
| C4 view | A lens over the same data: Context, Containers/Families, Components. It must not claim runtime truth that Portolan did not observe. |
| Finding | A concrete signal: duplication, dependency, config, missing surface, retired project, high fanout, unknown runtime, etc. |
| Unknown | A visible gap. Unknown is not failure; hiding unknowns is failure. |
| Approved output area | `<target-root>/.portolan/` plus generated agent instruction files explicitly installed by Portolan: `.cursor/rules/portolan-atlas.mdc`, `AGENTS.md`, and `CLAUDE.md`. Everything else in the target is read-only by default. |

## Bundle Input Contract

Portolan must not let the viewer infer product meaning directly from arbitrary
files or raw JSONL. The viewer consumes a normalized system map.

The current bundle may contain artifacts such as:

- repository inventory;
- repository profiles;
- relationships;
- hotspots and findings;
- gaps;
- surfaces;
- facts and surface content;
- search index;
- receipt, scorecard, Q&A evaluation, and handoff files.

Task B owns the normalization step from the current bundle into typed objects:
component, repository, surface, relationship, finding, and unknown. If a current
producer does not emit enough information for a required object, Task B must add
an adapter or record a visible gap. The viewer must not compensate by guessing
from display names alone.

The required normalized output is a generated system-map JSON instance that
validates against `schema/system-map.schema.json`. The canonical bundle path is
`.portolan/atlas/system-map.json` unless the receipt and scorecard record a
different path. It contains:

- stable object ids;
- object kind;
- display name;
- owner or parent when applicable;
- evidence state;
- source producer or artifact;
- created-by producer family;
- route target;
- short explanation for why the object is present.

The schema is necessary but not sufficient. The implementation must also provide
a semantic validator because JSON Schema alone cannot prove cross-object
integrity. The validator must fail when:

- object ids are duplicated across kinds;
- a relationship endpoint does not resolve to a known object;
- a surface owner does not resolve to a component, repository, target, or known
  external object;
- a route's kind segment contradicts the object kind;
- a promoted component has no local promotion signal;
- a component that required promotion from an ambiguous artifact has fewer than
  two independent promotion signals;
- a default-map object is a documentation, mailing-list, support-matrix, CI, or
  package/runtime surface rather than a meaningful component.

## Entity Model

The implementation must separate entity types before rendering.

### Component

Required fields:

- stable id;
- display name;
- type: application, library, platform, retired, package, deployment, runtime,
  external, unknown;
- role in plain language;
- lifecycle: active, external, retired, internal-support, unknown;
- parent component or target root when applicable;
- backing repositories;
- attached surfaces;
- relationships;
- findings;
- unknowns;
- primary C4 family and secondary C4 families when applicable;
- promotion signals used to justify the component;
- recommended next drill-down actions.

### Component Promotion Rule

The default map must show meaningful components. This is a deterministic data
rule, not a design preference.

A raw entity is promoted to a component only when at least one of these rules is
true:

- It is an explicit named software system, subsystem, library, package,
  deployment, runtime, or external project observed in local source, manifests,
  dependency metadata, configuration, repository metadata, or documentation.
- It is the target root or an integrator that owns multiple components or
  surfaces.
- It is a retired or legacy project referenced by dependencies, BOMs, docs,
  compatibility matrices, migration paths, or replacement analysis.
- It is an operational subsystem that has at least one backing repository,
  deployment/config surface, dependency relationship, or runtime/config signal.

A raw entity is not promoted to a default-map component when it is only:

- a documentation page, support matrix, release note, wiki page, mailing list,
  issue tracker, CI job, build artifact, binary repository, Docker image,
  runtime endpoint, file, directory, generated report, or search index entry;
- a repository with no independent product/subsystem identity;
- a producer artifact whose only purpose is to support analysis.

Local signal types:

- source file or source tree structure;
- manifest, lockfile, BOM, or dependency metadata;
- repository metadata;
- configuration or infrastructure file;
- docs metadata or structured documentation index;
- dependency or relationship edge;
- runtime, deployment, or endpoint evidence;
- producer output from an imported OSS tool.

Two signals are independent when they come from different producer families or
from different source files/artifacts. Two mentions in the same README count as
one signal.

Nearest owner means:

1. the component explicitly named by the source artifact;
2. otherwise the repository containing the source artifact;
3. otherwise the target root/integrator.

Tie-breaker: if classification is ambiguous, keep the object as a surface or
unknown attached to the nearest owner. Promote it only when two independent
local signals identify it as a named software or operational component.

Do not let Portolan producers call an LLM to decide promotion unless the user
explicitly enables an LLM-backed enrichment mode. The harness agent may reason
about the run and explain results, but the generated system map must remain
reproducible from local facts in the default acceptance path.

### Repository

Required fields:

- stable id;
- display name;
- local path or external URL when known;
- source visibility state;
- languages;
- file count;
- related component ids;
- producer coverage;
- top findings;
- gaps.

Repositories are not automatically top-level map components. A repository
becomes a top-level component only when it represents a meaningful product or
subsystem.

### Surface

Required fields:

- stable id;
- surface type: docs, wiki, issue-tracker, ci, mailing-list, release-matrix,
  binary-repo, docker-image, runtime-endpoint, vendor-config, other;
- label;
- owner component or target;
- URL or local path when known;
- state: available, missing, unknown, not-assessed;
- evidence state;
- created-by producer family;
- why it matters.

Surfaces must not float as peer components unless the user selected a dedicated
surface view.

### Surface Detection Rules

Surface classification must use project-independent signals:

- docs/wiki/release-matrix: documentation paths, site metadata, release/support
  tables, README-style sources, generated docs indexes;
- mailing-list/community: list archive URLs, mail aliases, community metadata,
  governance or contribution docs;
- issue tracker: issue URLs, tracker metadata, repository issue links;
- CI: workflow files, job metadata, build status files, CI URLs, test reports;
- binary-repo/package registry: package manager metadata, artifact repository
  URLs, release binary indexes;
- docker-image/runtime surface: Dockerfiles, compose files, image references,
  Kubernetes manifests, runtime endpoint config;
- vendor-config: third-party service config, SaaS deployment descriptors,
  infrastructure descriptors.

These rules must work on Bigtop and on at least one non-Bigtop fixture or
corpus. Bigtop examples are regression cases, not hardcoded naming rules.

### Relationship

Required fields:

- stable id;
- relationship type;
- from object;
- to object;
- direction when known;
- evidence state;
- summary;
- count or weight when relevant;
- source producer;
- created-by producer family;
- drill-down route.

### Dossier

Every component, repository, surface, and C4 box that is clickable must have a
full dossier or must be visibly disabled with a reason. Relationships and
findings may open a bounded detail panel instead of a full dossier, but the
route must still be stable and testable.

Empty generated stubs are failures. If Portolan does not know enough to explain
an object, the detail view must say what is known, what is unknown, which
producer created it, and what action would improve it.

Required dossier sections:

- What this is.
- Why it is present in the result.
- Where it sits in C4.
- Backing repos and surfaces.
- Relationships.
- Findings and risks.
- Unknowns and not assessed areas.
- Links or local paths.
- Next useful actions.

### Finding

Required fields:

- stable id;
- finding type;
- severity or priority when known;
- affected object ids;
- summary;
- evidence state;
- source producer;
- created-by producer family;
- count, weight, or sample when relevant;
- route target;
- next useful action or reason no action is known.

## Status And Evidence Vocabulary

BDD scenario verdicts and object evidence states are different concepts.

BDD verdicts:

- `verified`: directly tested and passed.
- `failed`: directly tested and failed.
- `blocked`: could not run because of a named blocker.
- `not_assessed`: not checked.
- `assumed`: inferred, but not directly tested.

Object evidence states use the existing evidence vocabulary unless a schema
migration is explicitly approved:

- `source-visible`: observed in local source or local files.
- `metadata-visible`: observed in manifests, lockfiles, BOMs, indexes, docs
  metadata, or repository metadata.
- `runtime-visible`: observed from local runtime/config/deployment evidence.
- `claim-only`: present as a claim without local corroborating evidence.
- `unknown`: expected or useful fact is unclear after available producers.
- `cannot_verify`: cannot be checked from the available local corpus,
  permissions, or runtime.

`not_assessed` is a scenario or coverage status, not an object evidence state.
If a producer did not run, render that as coverage/not-assessed metadata and
attach `unknown` or `cannot_verify` evidence to the affected objects with a
reason.

## Bigtop Ground Rules

Bigtop remains a stress corpus, not special product choreography.

The Bigtop result must handle these examples correctly:

- Apache Bigtop is a platform/integrator component backed by the Bigtop
  repository.
- Apache Bigtop support matrix is a release/documentation surface attached to
  Apache Bigtop, not an unexplained peer node.
- Apache Bigtop mailing lists are a community surface attached to Apache
  Bigtop, not an unexplained peer node.
- Bigtop CI and smoke-test jobs are verification/runtime surfaces attached to
  Apache Bigtop.
- Bigtop binary repositories and Docker images are package/runtime surfaces.
- Apache Sqoop is a retired or legacy component. Its dossier must say that it is
  retained because the corpus/BOM includes it or because it is useful for
  replacement and migration analysis. Its repository, site, tracker, wiki, and
  missing docs/release state must be visible.

## UX Contract

### First Screen

The first screen must answer these questions without external explanation:

- What target did Portolan inspect?
- What are the main components?
- What is the role of the target root or integrator?
- What relationships matter first?
- What is risky or suspicious?
- What is missing or unknown?
- What should I click next?

The first screen must not start with an undifferentiated graph.

### Main Navigation

Required views:

- Overview: target summary, main components, important relationships, gaps, and
  next actions.
- C4: Context, Containers/Families, Components. Families are data systems,
  compute/processing, platform/governance, packaging/runtime,
  coordination/community, integration/services, and unknown.
- Map: meaningful components and important relationships only.
- Components: searchable list of component dossiers.
- Risks: findings grouped by component and relationship.
- Surfaces: docs, CI, mailing lists, support matrix, package/runtime surfaces.

Navigation labels can change, but the capabilities must exist.

### Map Rules

- The default map shows meaningful components, not every raw bundle entity.
- Surface nodes are hidden by default and shown only through filters or attached
  surface strips.
- Every visible node click opens or focuses a dossier.
- Every visible edge click opens relationship detail.
- A selected node changes the map, side panel, and dossier consistently.
- Filters must visibly change the result or be removed.
- Search must find components, repositories, surfaces, findings, and
  relationships.

### C4 Rules

C4 is a lens over the same system map:

- Context: target root/integrator, external projects, users/operators when
  known, external surfaces.
- Containers/Families: data systems, compute/processing, platform/governance,
  packaging/runtime, coordination/community.
- Components: selected family broken into meaningful components and attached
  surfaces.
- Code level is optional and must appear only when local evidence supports it.

C4 boxes must be clickable and open dossiers.

System-map enum slugs use hyphens where prose labels use spaces or slashes:

- data systems -> `data-systems`;
- compute/processing -> `compute-processing`;
- platform/governance -> `platform-governance`;
- packaging/runtime -> `packaging-runtime`;
- coordination/community -> `coordination-community`;
- integration/services -> `integration-services`.

C4 grouping must be deterministic:

- data systems: storage, database, warehouse, filesystem, metastore, indexing,
  query, or data-serving roles;
- compute/processing: batch, stream, workflow, scheduler, engine, execution,
  transformation, or job roles;
- platform/governance: security, policy, release, governance, observability,
  compatibility, or enterprise-control roles;
- packaging/runtime: package build, distribution, image, deploy, runtime,
  installer, or environment roles;
- coordination/community: coordination services, registries, community,
  mailing-list, contribution, or project-governance surfaces;
- integration/services: connectors, plugins, adapters, clients, APIs, and
  cross-system integration roles;
- unknown: insufficient local evidence.

When a component fits more than one family, choose one primary family and list
secondary roles in the dossier. Use this priority order when local evidence
supports multiple families:

1. data systems;
2. compute/processing;
3. platform/governance;
4. packaging/runtime;
5. coordination/community;
6. integration/services;
7. unknown.

Do not invent runtime topology from naming alone.

### Dossier Rules

The dossier is the primary drill-down surface, not an afterthought.

Every component/repository/surface dossier must provide:

- direct explanation in plain language;
- C4 placement;
- parent and children;
- related components;
- backing repositories;
- attached surfaces;
- top findings;
- unknown/not assessed areas;
- next actions.

If a component has no relationships, the dossier must say why that is expected
or suspicious.

Family-level C4 boxes use a family dossier, not a component dossier. A family
dossier must show family purpose, members, grouping reason, surface counts,
finding counts, unknowns, and next drill-down actions.

### Help And Copy Rules

- Help must reduce confusion, not add visual noise.
- Do not place question marks inline in every label.
- Prefer one contextual help area per panel or a small info button in the panel
  header.
- Tooltips must stay inside the viewport and must not render under another
  panel.
- Read more in Overview must expand or route to overview detail, not to the
  currently selected component.

## Agent And Cursor Workflow

Cursor is the first acceptance client. For automated acceptance, Cursor means
the terminal/headless Cursor Agent lane (`cursor-agent` or `cursor agent`) using
the same instructions a Cursor Composer user receives. GUI Cursor UI behavior is
confirmatory evidence, not the primary gate.

Cursor must not be treated as "not runnable from terminal" without a current
probe. The terminal lane supports `--print` and `--output-format stream-json`;
when a Composer model is available, use it or record the exact model fallback in
the scorecard.

The implementation must support this user prompt:

```text
Here is Portolan: <url-or-local-path>
Here is my target root: <local-target-root>
Install Portolan into the target, build the system map, open or hand off the
local UI, and explain what I should inspect first.
```

Cursor must:

- discover the Portolan instructions without private maintainer hints;
- ask only necessary clarifying questions;
- keep the target local and read-only by default;
- install target-local Portolan commands or wrappers;
- run doctor/preflight before long work;
- build the system map bundle;
- launch or hand off the local UI;
- answer from bounded Portolan queries, not from raw multi-gigabyte files;
- report unknown/cannot verify/not assessed states honestly.

The required terminal acceptance shape for isolated acceptance fixtures is:

```text
cursor-agent --print --output-format stream-json --force --trust \
  --workspace <target-root> "<first-run prompt>"
```

or the equivalent:

```text
cursor agent --print --output-format stream-json --force --trust \
  --workspace <target-root> "<first-run prompt>"
```

If Cursor Agent CLI is installed and authenticated, this lane must be run and
treated as gating evidence. If it is unavailable or unauthenticated on the
current machine, record the exact blocker. Do not claim that Cursor cannot be
tested from the terminal.

For real client targets, do not use `--force` unless the user explicitly
approves command execution. For automated fixtures, `--force --trust` is allowed
only because the run is followed by read-only and output-boundary checks.

The Portolan scan itself must stay local-first and read-only by default. Cursor
may use its normal model transport unless the user requires a fully offline
agent runtime. Target mutation, dependency installation, external network
fetches for the target, or credential access still require explicit approval.

The implementation must preserve compatibility with OpenCode, Codex, Kimi/Zed
style harnesses, and direct shell use. Cursor is first, not exclusive.

## BDD Principles

Every implementation task must map to at least one BDD scenario.

Rules:

- Write or update the scenario before changing behavior.
- Keep scenarios user-visible.
- A passing unit test is not enough if the browser or Cursor flow fails.
- If a scenario cannot be tested, mark it `not_assessed` with a reason.
- Do not report a scenario as passed from code inspection alone.
- Keep failed and partial states visible.

Use this status vocabulary:

- `verified`: directly tested and passed.
- `failed`: directly tested and failed.
- `blocked`: could not run because of a named blocker.
- `not_assessed`: not checked.
- `assumed`: inferred, but not directly tested.

These verdicts do not replace object evidence states. Use the Status And
Evidence Vocabulary section for object-level evidence.

## BDD Feature Set

### Feature 1: Cursor First Run

```gherkin
Feature: Cursor builds a Portolan result from a clean prompt

Scenario: Cursor discovers Portolan without hidden hints
  Given a local target root
  And a Portolan URL or local checkout path
  When the user asks Cursor Agent CLI or Cursor Composer to build the Portolan result
  Then Cursor finds the installed instructions
  And Cursor identifies the target root and output location
  And Cursor asks only necessary clarifying questions
  And the terminal transcript is captured when Cursor Agent CLI is available
  And the prompt contains only Portolan location, target root, and the user goal

Scenario: Cursor keeps the target read-only by default
  Given the target root contains source repositories
  When Cursor installs and runs Portolan
  Then source files are not modified
  And generated Portolan files stay under the approved output area
  And target network fetches or tool installation actions require explicit approval

Scenario: Cursor produces a usable handoff
  Given Portolan completes or partially completes
  When Cursor reports back
  Then the answer includes the local UI launch route
  And the answer includes the main components, relationships, risks, gaps, and next actions
  And unsupported claims are marked unknown, cannot verify, or not assessed
```

### Feature 2: Entity Stratification

```gherkin
Feature: Portolan separates components, repositories, and surfaces

Scenario: Documentation surface is attached, not floated
  Given the bundle contains a support matrix
  When the system map is generated
  Then the support matrix is modeled as a documentation surface
  And it is attached to its owning component or target
  And it is not shown as a peer component in the default map

Scenario: Support objects are not promoted by name alone
  Given the bundle contains a support matrix, CI jobs, mailing lists, and binary repositories
  When component promotion runs
  Then none of those objects become default-map components
  And each object is attached as a surface or recorded as an unknown with owner context

Scenario: Community surface is attached, not floated
  Given the bundle contains mailing lists
  When the system map is generated
  Then mailing lists are modeled as community surfaces
  And they are attached to their owning component or target
  And their dossier explains why they matter

Scenario: Component promotion is deterministic
  Given the same bundle is processed twice
  When the normalized system map is generated
  Then the same raw objects are promoted to components
  And ambiguous objects remain surfaces or unknowns unless two local signals support promotion
  And the promotion report records which local signals caused promotion

Scenario: Retired component remains meaningful
  Given the bundle contains Apache Sqoop
  When the user opens its dossier
  Then the dossier identifies it as retired or legacy
  And the dossier explains why it is present
  And repository, site, tracker, wiki, missing docs, relationships, and findings are visible
```

### Feature 3: C4 View

```gherkin
Feature: C4 explains the same Portolan result

Scenario: Context view names the target and external systems
  Given a system map exists
  When the user opens C4 Context
  Then the view shows the target root or integrator
  And it shows external projects and major external surfaces
  And every box opens a dossier

Scenario: Container view groups components by role
  Given components have roles and groups
  When the user opens C4 Containers/Families
  Then components are grouped into meaningful families
  And surface counts and unknowns are summarized per family
  And the user can drill into a family
  And the grouping reason is visible in the family or component dossier
  And repeated generation assigns the same primary family for the same component evidence

Scenario: Component view explains selected family
  Given the user selected a family or component
  When the component C4 level is shown
  Then meaningful components and their important relationships are visible
  And repositories and surfaces are attached as detail, not equal peer boxes
```

### Feature 4: Component Dossier

```gherkin
Feature: Every meaningful object has a dossier

Scenario: User clicks a component on the map
  Given the default map is visible
  When the user clicks a component
  Then the dossier opens for that component
  And it explains what the component is, why it exists, where it sits in C4, and what to inspect next

Scenario: User clicks a relationship
  Given a relationship is visible
  When the user clicks the relationship
  Then the relationship detail opens
  And it shows connected components, evidence, producer, weight, unknowns, and next drill-down commands

Scenario: User clicks a surface
  Given a component has attached surfaces
  When the user opens a surface
  Then the surface dossier shows type, owner, link/path, evidence state, why it matters, and missing/unknown status

Scenario: No empty dossier stubs
  Given a visible object has weak or missing evidence
  When the user opens its dossier or detail panel
  Then the view names the known facts
  And it names unknown or not-assessed areas
  And it names the producer or gap that created the object
  And it does not pretend unsupported fields are known

Scenario: Partial evidence is rendered honestly
  Given a component has a name, one backing repository, and unknown lifecycle or relationships
  When the user opens its dossier
  Then known fields render normally
  And unknown fields render as unknown, cannot verify, or not assessed with a reason
  And the dossier does not fabricate a lifecycle, relationship, or risk explanation
```

### Feature 5: Overview And Help

```gherkin
Feature: Overview guides the first five minutes

Scenario: Overview read more stays in overview
  Given the overview is visible
  When the user clicks Read more
  Then additional overview explanation appears or the page scrolls to overview detail
  And the selected component does not unexpectedly change

Scenario: Help does not obscure content
  Given the user hovers or focuses help
  When the help text appears
  Then it remains inside the viewport
  And it does not render under the map, table, or side panel
  And labels do not shift or wrap badly

Scenario: Fake controls are rejected
  Given a control is visible
  When the user activates the control
  Then it changes the UI state, changes the route, starts a visible export, or is disabled with a reason

Scenario: Overview is the default route
  Given the local UI opens
  When no object route is selected
  Then Overview is shown first
  And Map requires an explicit user action
  And the first screen is not an undifferentiated node-link graph
```

### Feature 6: Agent Q&A And Selected Code

```gherkin
Feature: The coding agent uses Portolan during follow-up work

Scenario: Agent answers a landscape question from bounded queries
  Given a system map bundle exists
  When the user asks what is going on in the target
  Then the agent queries overview, components, relationships, findings, and gaps
  And the answer cites Portolan objects or local paths
  And the answer avoids unsupported architecture claims

Scenario: Agent explains selected code
  Given the user gives the agent a file path and optional line
  When the agent queries Portolan for selected code
  Then the answer maps the file to repository, component, C4 placement, related components, findings, and unknowns
  And the answer gives a UI route to inspect the same object
```

### Feature 7: Repeatability Beyond Bigtop

```gherkin
Feature: Portolan repeats on a second ecosystem

Scenario: Non-Bigtop target uses the same first-run path
  Given the polyglot service landscape fixture or another named second OSS target
  When Cursor or a shell agent runs the same Portolan first-run path
  Then Portolan produces a system map and UI without Bigtop-specific choreography
  And component, surface, relationship, dossier, C4, and Q&A checks still run
  And the result contains at least two components and two repositories
  And no promotion rule depends on the literal string "Bigtop"
```

### Feature 8: Read-Only And Local-First Proof

```gherkin
Feature: Portolan does not mutate the inspected estate by default

Scenario: Source tree remains unchanged
  Given a target root with git repositories or hashable files
  When Portolan runs through Cursor Agent CLI or shell
  Then source files outside the approved output area are unchanged
  And generated files stay under the approved output area

Scenario: Target network and installation actions are explicit
  Given the Portolan run needs a target network fetch, dependency install, credential, or external service
  When the agent reaches that step
  Then it stops or asks for approval
  And the final report records whether the action was approved, skipped, or not assessed
```

### Feature 9: UI Route And DOM Contract

```gherkin
Feature: Browser tests can verify Portolan objects without implementation-specific guesses

Scenario: Visible objects expose stable test hooks
  Given the UI is loaded
  When a component, repository, surface, C4 box, relationship, or finding is visible
  Then the element exposes `data-portolan-id`
  And the element exposes `data-portolan-kind`
  And clickable elements expose `data-portolan-route`

Scenario: Object routes are stable
  Given a normalized object exists
  When the user opens its route
  Then the UI shows the matching dossier or detail panel
  And the selected object id and kind are visible to browser automation
```

Route and DOM contract:

- visible object elements must set `data-portolan-id`;
- visible object elements must set `data-portolan-kind` with one of:
  component, repository, surface, c4-box, c4-family, relationship, finding,
  unknown;
- clickable visible object elements must set `data-portolan-route`;
- dossier routes use `#/dossier/<kind>/<id>`;
- relationship/finding detail routes use `#/detail/<kind>/<id>`;
- C4 family boxes use `data-portolan-kind="c4-family"` and
  `#/dossier/c4-family/<family-id>`;
- C4 component/context boxes use `data-portolan-kind="c4-box"` and
  `#/dossier/c4-box/<box-id>` unless they intentionally route to the underlying
  component dossier;
- `#/c4/...` is not a valid route family in this pass unless this section and
  `schema/system-map.schema.json` are both updated together;
- disabled visible objects set `data-portolan-clickable="false"` and include a
  visible or accessible reason;
- actionable visible objects set `data-portolan-clickable="true"`.

## Implementation Tasks

Agents may work in parallel, but each task must return BDD verdicts and
verification evidence.

BDD scenarios are the acceptance authority. The task checklist exists only to
organize work. If a task appears complete but its BDD scenario fails, the task
is not complete.

### Task A: Orchestrator And Scope Guard

Goal: prevent another dashboard-first drift.

Tasks:

- Mark the existing public graph dashboard as a failed spike in implementation
  notes or release/handoff text.
- Create a task checklist that maps every code change to this specification.
- Reject PRs that only add visual polish without passing a dossier, C4, or
  Cursor scenario.
- Keep the work in one branch unless the user asks for parallel branches.
- Record migrate/adapt/replace decisions for existing schema, viewer, scripts,
  and OSS scorecard before UI work starts.
- Treat `schema/system-map.schema.json` plus adapter from existing bundle
  artifacts as the chosen schema direction unless the user explicitly changes
  it.

Deliverable: implementation checklist with scenario mapping.

### Task B: Entity Stratification And Normalization

Goal: build a typed system map before rendering.

Tasks:

- Add or update `schema/system-map.schema.json`.
- Add an adapter from the current Portolan bundle/evidence artifacts into the
  system-map schema.
- Define normalized object types: component, repository, surface, relationship,
  finding, unknown.
- Classify current bundle objects into those types.
- Implement the Component Promotion Rule.
- Implement Surface Detection Rules.
- Attach surfaces to owning components or target root.
- Prevent documentation/community/runtime/package surfaces from appearing as
  default peer components.
- Add explicit lifecycle and role handling for retired or legacy components.
- Add Bigtop-specific validation examples for support matrix, mailing lists,
  CI, binary repos, Docker images, and Sqoop without hardcoding the whole UI to
  Bigtop.

Deliverable: normalized system map data, schema, adapter, and checker.

### Task C: C4 Builder

Goal: generate a C4 lens from normalized objects.

Tasks:

- Generate Context boxes.
- Generate Containers/Families from component roles.
- Implement deterministic C4 grouping rules.
- Implement the family priority order.
- Generate Component level for selected family/component.
- Attach counts for repositories, surfaces, findings, and unknowns.
- Mark inferred or incomplete C4 placement.
- Add click routes from every C4 box to a dossier.

Deliverable: C4 data structure plus renderer or UI view.

### Task D: Component Dossier

Goal: make every click meaningful.

Tasks:

- Build a dossier renderer for component, repository, surface, relationship,
  C4 box, and bounded relationship/finding detail.
- Include what/why/C4/backing repos/surfaces/relationships/findings/unknowns/
  next actions.
- Add a fixture-backed retired-component dossier; Apache Sqoop is the Bigtop
  regression example, not a product-specific code path.
- Add fixture-backed surface dossiers for release/support matrix and mailing
  list surfaces.
- Add tests that fail if a visible map object has no dossier or detail route.

Deliverable: dossier UI and route contract.

### Task E: UI Rebuild

Goal: replace the graph-first dashboard with a meaning-first product UI.

Tasks:

- Rework first screen around overview, main components, important
  relationships, risks, gaps, and next actions.
- Add C4 view.
- Add component list and surface list.
- Keep default map focused on meaningful components.
- Move raw or secondary objects behind filters and dossiers.
- Remove or disable controls that do not change meaningful state.
- Fix Read more behavior.
- Replace noisy inline question marks with controlled contextual help.
- Ensure desktop-first layout; mobile is not a priority.

Deliverable: local UI that passes browser and cold-reader checks.

### Task F: Cursor First-Run Path

Goal: prove Cursor can run Portolan from a simple prompt through the terminal
Cursor Agent lane.

Tasks:

- Update install/first-run instructions to match this specification.
- Ensure Cursor reads installed instructions after setup.
- Ensure Cursor uses target-local Portolan commands after install.
- Add a Cursor run scorecard template.
- Run `cursor-agent` or `cursor agent` in `--print --output-format stream-json`
  mode when installed and authenticated.
- Prefer the current Cursor Composer model when the CLI exposes one; otherwise
  record the exact model used.
- Treat GUI Cursor Composer as confirmatory only.
- Record manual interventions honestly.

Deliverable: Cursor Agent CLI first-run transcript, scorecard, and exact
blocker for any missing precondition.

### Task G: Agent Q&A And Selected Code

Goal: make Portolan useful inside the coding-agent conversation.

Tasks:

- Ensure bounded queries can retrieve overview, components, surfaces,
  relationships, dossiers, findings, gaps, and selected-code context.
- Add Q&A prompts that an agent must answer from Portolan.
- Add selected-code test cases.
- Add answer rubric: useful, grounded, concise, navigable.
- Prohibit answers that cite raw large JSONL as the primary interaction.

Deliverable: query commands or MCP tools plus Q&A evaluation results.

### Task H: Testing And QA

Goal: verify product behavior, not only code health.

Tasks:

- Add schema/unit tests for normalized object types.
- Add `scripts/validate-system-map-schema.sh` or equivalent validation command
  for `schema/system-map.schema.json`.
- The validation command must validate an instance system map, not only parse
  schema files.
- The validation command must include semantic checks that JSON Schema cannot
  express: object identity, references, route/object-kind consistency,
  promotion-signal sufficiency, and default-map eligibility.
- Add fixture tests for Bigtop examples listed above.
- Add a non-Bigtop fixture or real OSS target test.
- Add browser tests for overview, C4, map, dossier, surfaces, search, filters,
  and help.
- Add route/DOM contract tests for visible objects.
- Add read-only checks for target source files and generated output location.
- Verify that generated files stay under `<target-root>/.portolan/` plus the
  explicit agent instruction files installed by Portolan.
- Add explicit target-network/install approval checks or mark them not assessed
  with a reason.
- Add visual screenshots for wide desktop.
- Add negative regression tests for dangling nodes, fake controls, noisy help,
  and unsupported C4 claims.
- Run product acceptance with strict inputs when available.

Deliverable: test report with `verified`, `failed`, `blocked`, and
`not_assessed` scenario statuses.

### Task I: OSS Fit Check

Goal: avoid rebuilding mature parts badly.

Tasks:

- Check whether D3, Cytoscape, Sigma, React Flow, Mermaid, Structurizr,
  C4-PlantUML, or another local renderer should be used for graph/C4 rendering.
- Check whether existing local code graph or documentation tools should be
  imported instead of rebuilt.
- Start from the existing OSS kill-gate scorecard and record only deltas needed
  for this implementation.
- Complete the renderer/C4 delta check before adding any new rendering
  dependency or replacing viewer framework pieces.
- Record license, maturity, integration cost, local-first fit, and why build or
  wrap was chosen.

Deliverable: short fit table and implementation decision.

## Testing Matrix

### Minimum Verification Command Set

The implementation agent must report the exact commands used. Start from these
repo-native checks and adapt only when the code shape changes:

```text
git diff --check
jq empty schema/*.json
bash -n scripts/*.sh scripts/lib/*.sh
(cd viewer && npm run build)
scripts/validate-system-map-schema.sh <system-map.json>
scripts/validate-atlas-schemas.sh <bundle-dir>
scripts/portolan-product-acceptance.sh --bigtop-bundle <bundle-dir> --require-system-map
scripts/portolan-product-acceptance.sh --second-oss-bundle <bundle-dir> --require-system-map
scripts/harness-agent-runtime-acceptance.sh --harness cursor --require cursor --require-system-map
scripts/harness-bigtop-acceptance.sh <bundle-dir> --require-system-map
```

If the existing scripts do not support the `--require-system-map` behavior yet,
Task H must add it or provide an equivalent named command. A legacy acceptance
run that only checks `manifest.json`, `repo-profiles.json`, old atlas facts, or
`data-testid="atlas-map"` is not a product pass for this specification.

If a required bundle or authenticated Cursor Agent CLI is unavailable, mark
only that lane `not_assessed` or `blocked` with the exact precondition. Do not
replace the Cursor lane with a generic shell replay when Cursor is available.

The strict product gate should include:

```text
product acceptance with Bigtop bundle
product acceptance with second non-Bigtop bundle
fresh first run on a second non-Bigtop target
Cursor Agent CLI lane with the same prompt a Cursor Composer user receives
optional GUI Cursor Composer confirmation when available
browser screenshot and interaction proof
```

If any strict input or live harness is unavailable, mark that lane
`not_assessed` with the missing precondition. Do not convert it to success.

### Required Automated Checks

- Shell/script syntax for changed scripts.
- JS/TS syntax for changed viewer code.
- Schema validation for generated system map data.
- Unit tests for type classification.
- Fixture tests for Bigtop support matrix, mailing lists, CI, binary repos,
  Docker images, and Sqoop.
- Browser tests for desktop UI.
- No whitespace errors.

### Required Browser Checks

Use Playwright or the in-app browser when available.

Test at a wide desktop viewport. Mobile is optional.

Required browser assertions:

- first screen has target identity and main components;
- default map does not show support matrix or mailing lists as peer components;
- C4 view exists and boxes open dossiers;
- every visible map node opens a dossier;
- every visible relationship opens detail or is visibly non-clickable;
- every visible object exposes stable object id, object kind, and route target
  for browser automation;
- Sqoop opens a retired/legacy dossier with links and explanation;
- Read more stays in overview;
- help text does not overlap under the map or table;
- search finds components and surfaces;
- filters visibly change state or are absent;
- the browser console has no uncaught JavaScript errors and no failed local
  asset requests.
- default route is Overview, not Map.

### Required Cursor Checks

At minimum, provide a scorecard for Cursor Agent CLI:

- prompt used;
- model/harness version if visible;
- target root;
- output location;
- questions Cursor asked;
- commands Cursor ran;
- manual interventions;
- whether target source files were modified;
- whether UI opened or handoff path was produced;
- first useful explanation;
- failed or weak steps.

If Cursor Agent CLI cannot be run in the current environment, mark it
`not_assessed` or `blocked` and give the exact missing precondition, such as
missing binary, missing login/API key, network unavailable for the agent model,
or workspace trust failure. Do not state that Cursor cannot run from the
terminal.

GUI Cursor Composer screenshots or transcripts may be added, but they do not
replace the terminal Cursor acceptance lane.

### Required Cold-Reader Check

A reviewer who did not build the UI gets five minutes with the generated result.

They must be able to answer:

- What is the target?
- What are the main components?
- Why is Apache Sqoop present?
- Where are support matrix and mailing lists?
- What is risky or suspicious?
- What is unknown?
- What should be clicked next?

If they cannot answer, the UI fails even if automated tests pass.

## Product Acceptance Gates

Gate 1: Data model

- components, repositories, surfaces, relationships, findings, and unknowns are
  distinct;
- generated system map validates against `schema/system-map.schema.json`;
- Bigtop examples classify correctly;
- no default peer surface nodes.

Gate 2: UI

- overview, C4, map, components, risks, and surfaces exist;
- every visible component, repository, surface, and C4 box has a dossier route;
- every visible relationship or finding has a bounded detail route or is
  visibly non-clickable with a reason;
- failed spike regressions are absent.

Gate 3: Agent first run

- Cursor Agent CLI first-run path is verified on at least one maintainer or CI
  environment before demo-ready is claimed;
- target source remains read-only by default;
- result includes launch or handoff path.

Gate 4: Repeatability

- same path runs on Bigtop and at least one non-Bigtop target or fixture;
- differences are recorded as coverage/gaps, not hidden.

Gate 5: Client demo readiness

- cold-reader check passes;
- live or local browser screenshot set exists;
- known limitations are short and concrete;
- no maintainer narration is required to understand the first screen.

## Implementation Prompt For Goal Agent

Use this prompt when handing the work to an agent:

```text
Goal: implement docs/captain-atlas/07-portolan-core-product-spec.md.

Do not continue the existing graph-first demo as the product direction.
Rebuild the Bigtop demo path around typed entities, C4, component dossiers,
surface attachment, Cursor first-run, and BDD acceptance.

Work in the Portolan repository.
Follow AGENTS.md and the active product contract.
Keep the implementation local-first and read-only by default.
Do not add hosted services, accounts, credentials, target mutation, or network
actions without explicit approval.

Required result:
- normalized system map data;
- C4 lens;
- dossier or bounded detail route for every visible object;
- UI where default map shows meaningful components only;
- support matrix and mailing lists attached as surfaces, not peer nodes;
- retired/legacy components shown with explanation and links; Apache Sqoop is
  the Bigtop regression example;
- Cursor first-run instructions and scorecard;
- BDD/browser/schema/fixture tests;
- live or local demo evidence.

Before coding, map planned changes to BDD scenarios in the spec.
After coding, report verified/failed/blocked/not_assessed for every scenario.
```

## Stop Conditions

Stop and ask the user before proceeding if:

- the implementation would require replacing the whole viewer framework;
- a new major dependency is needed for graph/C4 rendering;
- Bigtop data must be regenerated from scratch;
- Cursor Agent CLI is unavailable or unauthenticated in every available
  maintainer/test environment;
- the only available path is to polish the current dashboard without changing
  entity stratification and dossiers.

## Final Deliverable Format

The implementation agent must return:

- changed files;
- BDD scenario verdict table;
- commands run;
- browser screenshots or paths;
- Cursor Agent CLI scorecard or not-assessed reason;
- Bigtop example verdicts;
- non-Bigtop repeatability verdict;
- remaining risks;
- recommended next slice.
