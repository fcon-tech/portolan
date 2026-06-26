# BDD Work Package: Agent Frontier To Product Specs

> **Status:** governing next-step specification for the Portolan product
> discovery loop.
>
> **Authority:** `08-portolan-product-charter.md` governs the product concepts.
> `07-portolan-core-product-spec.md` remains authority for the frozen
> `system-map` schema, builder, and viewer contract until migration. Candidate
> one-day slices, including `11-bigtop-route-index-coverage-matrix.md`, are
> subordinate to this process.

## Reader And Goal

Reader: a Portolan product agent, implementation agent, or reviewer turning
agent frontier research into product specs.

Post-read action: run or review the evidence loop that converts repo-corpus
agent runs into a ranked roadmap of one-day Portolan specs without prematurely
narrowing Portolan to one demo feature.

## Problem Statement

Portolan is not a repository map. It is a local-first navigation atlas of a
code landscape.

The failure mode is now clear:

1. Agents can already inspect a corpus and explain more than a poor demo shows.
2. A demo that shows less than raw agents can explain is below the product bar.
3. A shaped artifact can help agents, but if it only becomes one hand-built
   Bigtop trick, Portolan has not become a product.

The product process must therefore start from agent frontier evidence and
produce a sequence of falsifiable one-day specs. Each spec should move Portolan
from heroic agent exploration toward repeatable expeditions.

## Decision Gate

**Simpler/Faster:** keep the process artifact-based. Use local target manifests,
agent run packs, claim/evidence ledgers, shaped artifacts, delta analyses, and
one-day candidate specs. Do not introduce a database, hosted service, or broad
workflow engine to manage product discovery.

**Blocking Edge Cases:** agent output is uneven; raw corpus exploration may
outperform the demo; shaped artifacts can accidentally become target-specific
hand curation; context windows cannot hold large corpora; runtime/build truth is
often unavailable; visual design can mask weak data contracts.

**Existing Open Source:** existing tools can produce local facts, indexes,
dependency graphs, symbol graphs, duplication reports, and package metadata.
They do not decide which Portolan product problem is worth solving next. The
process should evaluate whether to pack OSS outputs as producers, not replace
the atlas roadmap with tool shopping.

## Process Contract

The Portolan product loop has six stages.

### Stage 0: Experiment Boundary Control

Before any clean frontier agent touches a target, define the source boundary
for the experiment. This is a research-control requirement, not a product
roadmap decision by itself.

The ledger must record:

- allowed roots;
- forbidden roots and path patterns;
- generated artifacts;
- historical research;
- prior agent artifacts;
- dependency/vendor/build output directories;
- network/runtime/build permissions;
- the exact inventory command recipe agents should use.

Rules:

- clean frontier agents must use the boundary ledger before broad inventory;
- all scratch files must live under the run directory;
- forbidden file-content reads contaminate the run;
- forbidden path-name exposure also contaminates the run unless the boundary
  ledger explicitly declares that exposure acceptable for the mode.

This stage exists because `portolan-self` clean-v2 runs repeatedly contaminated
through path-name exposure before agents read any forbidden contents. The lesson
is that clean frontier evidence needs a controlled source boundary. It does not
mean the next product feature is automatically a boundary-ledger feature.

### Stage 1: Clean Agent Frontier

Run multiple agents against the raw local corpus without Portolan context.

Required lanes:

- low reasoning;
- medium reasoning;
- high reasoning.

Optional lanes:

- Cursor Composer;
- Cursor Agent CLI;
- OpenCode;
- Kimi/Zed-like harness;
- local model variants.

Rules:

- no prior Portolan research;
- no `.portolan`;
- no `.cursor`;
- no network unless the target manifest explicitly allows it;
- no target mutation;
- no runtime/build/test claims unless those probes actually run;
- every output must separate claims, evidence, commands, and manifest metadata.

Required output pack:

```text
frontier-report.md
claims.jsonl
evidence.jsonl
commands.md
manifest.json
boundary-ledger-used.json
```

### Stage 2: Demo Critique

Compare the current demo against the clean frontier.

Core rule:

> If raw agents can explain more from the corpus than the demo shows, the demo
> is not good enough.

The critique must identify:

- what raw agents extracted without Portolan;
- what they failed to verify;
- what they had to stitch manually;
- where they risked false joins or false confidence;
- what the demo hides or flattens;
- what minimum atlas surface would exceed the raw-agent frontier.

### Stage 3: Shaped Artifact Hypothesis

Build one or more Portolan-shaped artifacts that test product hypotheses.

Examples:

- source-boundary ledger;
- typed route index;
- coverage matrix;
- component dossier;
- path-role classifier;
- version-boundary guardrail;
- runtime probe planner;
- below-repo module zoom;
- claims/evidence ledger;
- query cookbook for agents.

Each shaped artifact must be labelled:

- `prototype_artifact` when manually shaped;
- `generated_artifact` only when current Portolan producers actually generate
  it.

### Stage 4: Agent Delta Pass

Run fresh agents against the shaped artifact.

The pass answers:

1. Did the artifact save orientation time?
2. Did it prevent false joins or false confidence?
3. Did it make any important path harder to discover?
4. What did agents still have to rediscover?
5. Which Portolan feature would most improve the next expedition?

The answer must be based on at least low, medium, and high lanes before it is
treated as a strong signal.

### Stage 5: Roadmap And One-Day Specs

Only after the delta pass, select candidate one-day specs.

Each candidate spec must state:

- hypothesis it tests;
- evidence that justifies it;
- expected product improvement;
- output artifacts;
- acceptance gates;
- explicit non-goals;
- risk if wrong;
- reversibility;
- next candidate if it fails.

One candidate may be selected for implementation, but selection does not shrink
Portolan's product scope. It is one step in the roadmap.

## Current Evidence: Bigtop

This section is a **provisional single-corpus evidence receipt**, not a
product-readiness claim. It supports candidate selection for the next Bigtop
slice. It does not prove that the Portolan roadmap is validated across
landscapes.

The Bigtop runs established a strong current hypothesis:

> Portolan must expose system routes and coverage, not merely repository nodes.

Clean agents found:

- Bigtop is a distribution and interoperability-test landscape.
- `apache-bigtop-repo` is the integration hub.
- Useful routes are BOM -> packages -> deploy/provisioner -> smoke tests ->
  runtime filesystem layout.
- Same-name upstream repositories must not be joined to Bigtop package versions
  without version evidence.
- Static findings need lifecycle and path-role classification.

Shaped artifact agents agreed:

- a shaped atlas saved orientation time;
- false version joins were easier to avoid;
- runtime/build/test status stayed honest;
- the artifact still lacked exact source anchors and a coverage matrix.

This evidence validated one Bigtop-specific candidate slice:

- `11-bigtop-route-index-coverage-matrix.md`

It does not prove that route-index is the only next slice or the whole roadmap.
The later `portolan-self` frontier run generalizes this into
`13-atlas-navigation-index.md`.

### Evidence Receipt

Clean frontier runs:

- low: `portolan-lab/research/agent-frontier-2026-06/runs/codex-low/apache-bigtop-full-corpus/no_portolan/`
- medium: `portolan-lab/research/agent-frontier-2026-06/runs/codex-medium/apache-bigtop-full-corpus/no_portolan/`
- high: `portolan-lab/research/agent-frontier-2026-06/runs/codex-high/apache-bigtop-full-corpus/no_portolan/`

Shaped artifact runs:

- low: `portolan-lab/research/agent-frontier-2026-06/runs/codex-low/apache-bigtop-full-corpus/portolan_shaped_artifact/`
- medium: `portolan-lab/research/agent-frontier-2026-06/runs/codex-medium/apache-bigtop-full-corpus/portolan_shaped_artifact/`
- high: `portolan-lab/research/agent-frontier-2026-06/runs/codex-high/apache-bigtop-full-corpus/portolan_shaped_artifact/`

Synthesis artifacts:

- clean baseline: `portolan-lab/research/agent-frontier-2026-06/synthesis/bigtop-clean-baseline-analysis.md`
- artifact delta: `portolan-lab/research/agent-frontier-2026-06/synthesis/bigtop-artifact-delta-analysis.md`
- shaped pack label: `prototype_artifact`

Unresolved degraded surfaces:

- package builds: `blocked` / `not_assessed`;
- Docker provisioner: `blocked` / `not_assessed`;
- Puppet catalog compilation: `blocked` / `not_assessed`;
- smoke tests: `blocked` / `not_assessed`;
- CI health: `blocked` / `not_assessed`;
- network/download validity: `blocked` / `not_assessed`;
- dependency resolution: `blocked` / `not_assessed`;
- dead code, cycles, duplication, and symbol topology: `not_assessed`.

Future evidence receipts must include the same fields before a candidate spec is
promoted: clean run paths, shaped run paths, lane outcomes, artifact provenance,
synthesis path, selected candidate, and unresolved degraded states.

## Candidate Roadmap

### Candidate A: Source Boundary Ledger

Classification: `research-supporting`.

Hypothesis: clean frontier experiments need source boundaries before their
evidence can be trusted.

Expected improvement: prevents contamination from `.portolan`, `.cursor`, old
research, stale selections, generated artifacts, and unsupported network data.

Good first target: `portolan-self` as an experiment-control corpus, then Bigtop
if a generated bundle later needs this as a product surface.

Second-corpus evidence: `portolan-self` clean-v2 low, medium, and high lanes all
contaminated through forbidden path-name exposure. This proves that the
experiment harness needs boundary control before second-corpus evidence can be
trusted. It does not prove that Candidate A is the top product-scope feature.

Candidate spec:

- `12-source-boundary-ledger.md`

### Candidate B: Route Index And Coverage Matrix

Classification: `demo-supporting` for Bigtop; fixture profile for Candidate H.

Hypothesis: the atlas becomes meaningfully better than raw agents when it
provides source-anchored routes and repo coverage status.

Expected improvement: agents stop manually stitching BOM, packages, deploy,
smoke tests, upstream repos, version status, and unknowns.

Good first target: Bigtop.

Candidate spec:

- `11-bigtop-route-index-coverage-matrix.md`

### Candidate H: Atlas Navigation Index

Classification: `Part-1-path`.

Hypothesis: the atlas becomes product-relevant when it packages regions, routes,
coverage, findings, unknown probes, evidence, and receipt validation across
multiple corpus shapes.

Expected improvement: the admiral and follow-up agents stop reconstructing the
same navigation skeleton manually. Bigtop package/distribution routes and
Portolan-self implementation/toolchain routes become one atlas concept instead
of separate demos.

Good first targets: Bigtop and `portolan-self`.

Candidate spec:

- `13-atlas-navigation-index.md`

### Candidate C: Path-Role And Lifecycle Classifier

Hypothesis: static findings become useful only when each hit has path role and
lifecycle context.

Expected improvement: reduces false dead-code, drift, TODO, deprecated, fixture,
patch, and legacy claims.

Good first target: Bigtop package recipes, patches, tests, docs, and upstream
module families.

### Candidate D: Version-Boundary Guardrail

Hypothesis: same-name repo/package joins are one of the most dangerous atlas
errors in multi-repo landscapes.

Expected improvement: prevents treating local upstream heads as package-source
truth without evidence.

Good first target: Spark, Airflow, Hadoop, Ranger.

### Candidate E: Runtime Probe Planner

Hypothesis: `not_assessed` is useful only if the atlas proposes the next safe
probe.

Expected improvement: turns blocked runtime/build/test surfaces into a plan
without making green claims.

Good first target: Bigtop package build, Docker provisioner, Puppet catalog,
smoke tests, dependency resolution, CI import.

### Candidate F: Below-Repo Module Zoom

Hypothesis: the next useful scale after repository is not always symbol. It is
often package recipe, deploy role, smoke module, subsystem, plugin, or runtime
surface.

Expected improvement: moves Portolan toward a true atlas with zoom levels.

Good first target: Hadoop, Spark, Hive, Kafka, Ranger, Zeppelin.

### Candidate G: Agent Query Cookbook

Hypothesis: a machine-readable atlas is weaker if agents must guess query
shapes.

Expected improvement: follow-up agents can ask bounded questions without
rediscovering schema layout.

Good first target: system-map, route-index, coverage-matrix queries.

## Roadmap Selection Rules

Select the next one-day spec by scoring candidates against:

1. Does it exceed the raw-agent frontier?
2. Does it reduce manual stitching by follow-up agents?
3. Does it preserve local-first and read-only boundaries?
4. Does it expose unknowns instead of hiding them?
5. Does it generalize beyond Bigtop without pretending to be generic too early?
6. Can it be implemented and verified in one day?
7. Is it reversible if the hypothesis fails?
8. Does it materially advance the Part-1 first-run path: autonomous
   install/preparation, managed intake, `/portolan:map`, useful local UI,
   follow-up agent handoff, and repeatability?

If a candidate does not advance the Part-1 first-run path, label it
`demo-supporting`, `producer-supporting`, or `research-supporting`; do not call
it the top product roadmap item.

Current recommendation from Bigtop plus `portolan-self` frontier evidence:

1. Use Candidate A as research-control scaffolding so the second-corpus clean
   frontier can be validated; do not treat it as the product winner.
2. Select Candidate H (`13-atlas-navigation-index.md`) as the current
   product-scope candidate because it generalizes the Bigtop route/coverage
   finding to a second corpus.
3. Treat Candidate B (`11`) as the Bigtop fixture profile inside Candidate H,
   not as the whole roadmap.
4. Keep Candidates C-G as follow-up refinements once the navigation-index
   surface exists.

This recommendation is not permanent. A new target corpus or agent delta pass
may reorder the roadmap.

## BDD

```gherkin
Feature: Agent frontier evidence becomes product specs

Scenario: Raw agents set the demo bar
  Given a source-boundary ledger has been generated
  And low, medium, and high clean frontier lanes have completed without contamination
  When the current demo is evaluated
  Then any capability raw agents explain but the demo hides is recorded as a demo gap
  And the demo is not called ready if it remains below the raw-agent frontier

Scenario: Shaped artifacts test hypotheses
  Given a product hypothesis about agent navigation pain
  When a Portolan-shaped artifact is created
  Then the artifact states whether it is manually shaped or generated by current Portolan
  And fresh low, medium, and high agents evaluate whether it saves orientation time
  And they evaluate whether it prevents false joins or false confidence
  And they evaluate whether it makes any important path harder to discover
  And they record what they still had to rediscover
  And they name the Portolan feature that would most improve the next expedition

Scenario: One-day specs are selected without shrinking the product
  Given a candidate spec is selected for implementation
  When the roadmap is updated
  Then the selected spec is marked as one candidate slice
  And broader Portolan scope remains visible through the candidate roadmap

Scenario: Runtime gaps remain honest
  Given runtime, build, Docker, Puppet, smoke-test, CI, or network probes were not run
  When the synthesis or spec is written
  Then those surfaces are marked blocked or not_assessed
  And the next safe probe is recorded instead of a green claim
```

## Deliverables

Each research-to-spec cycle must produce:

- target manifest;
- clean frontier run packs;
- clean frontier synthesis;
- shaped artifact pack;
- shaped agent run packs;
- delta analysis;
- ranked candidate roadmap;
- one selected one-day spec, if evidence is strong enough;
- handoff prompt for the implementation agent.

## Acceptance

Pass for a **single-corpus provisional roadmap** when:

1. At least one corpus has a source-boundary ledger.
2. At least one corpus has clean low/medium/high frontier runs.
3. At least one shaped artifact hypothesis has low/medium/high delta runs.
4. The delta analysis identifies what raw agents can do, what shaped artifacts
   improve, and what agents still have to rediscover.
5. The active docs contain a ranked candidate roadmap, not just one narrowed
   implementation task.
6. Any selected one-day spec is explicitly labelled as a candidate slice.
7. Runtime/build/test/network claims remain `blocked` or `not_assessed` unless
   the probes actually ran.
8. The selected candidate is labelled as `demo-supporting`,
   `producer-supporting`, `research-supporting`, or `Part-1-path`.

Pass for a **product-scope roadmap** only when:

1. The loop has run on at least two meaningfully different corpora.
2. The second corpus either confirms the candidate ordering or produces an
   updated ranking with evidence.
3. The roadmap explicitly maps candidate slices to the Part-1 first-run path.

Fail when:

- the process jumps from one agent report to implementation without delta
  comparison;
- a candidate slice is presented as the whole Portolan scope;
- demo critique is based on taste instead of raw-agent frontier evidence;
- shaped manual artifacts are presented as current generated product output;
- UI work starts before the data contract being tested is named.

## Current Next Action

Use the Bigtop evidence and the failed `portolan-self` clean-v2 attempt to run a
clean second-corpus frontier with explicit experiment boundary control. Then
compare those frontier findings against the current demo and re-rank the
candidate roadmap. That comparison now selects
`13-atlas-navigation-index.md` as the current product-scope candidate. `11` is
retained as the Bigtop fixture profile and first package/distribution target
inside the broader atlas-navigation slice.
