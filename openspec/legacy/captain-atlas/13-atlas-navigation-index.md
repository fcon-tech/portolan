# Product Specification: Atlas Navigation Index

> **Status:** implemented as a fixture-backed generated atlas contract.
> Standalone generation and validation are verified; product readiness remains
> under review in `14-atlas-navigation-index-acceptance-review.md`.
>
> **Authority:** `08-portolan-product-charter.md` governs product concepts.
> `07-portolan-core-product-spec.md` remains authority for the frozen
> `system-map` contract until migration. `10-agent-frontier-to-spec-roadmap.md`
> governs the evidence loop that selected this candidate.

## Reader And Goal

Reader: an implementation agent, reviewer, or product agent building the next
Portolan demo/product slice.

Post-read action: implement and verify a generated atlas navigation index that
turns Portolan from a component/repository map into a navigable system atlas:
regions, routes, coverage, findings, unknown probes, evidence, and receipt
validation across Bigtop and `portolan-self`.

This spec is intentionally detailed. The implementation agent is expected to
handle the breadth. Do not shrink this into a Bigtop-only route index, a
boundary-ledger feature, or a UI-only demo.

## Product Thesis

Portolan is not a repository map. It is a local-first navigation atlas of a code
landscape.

The current demo surface is visually coherent but product-poor: it gives a
component graph and surfaces, but it does not expose the routes, coverage,
findings, unknowns, and next probes that a raw agent can reconstruct manually.

The Atlas Navigation Index is the next bar:

> The admiral opens `/portolan:map`, sees the system as navigable routes and
> regions, drills into evidence-backed dossiers, sees what is covered, what is
> risky, what is unknown, and which safe probe should happen next.

The generated atlas should be useful to both humans and follow-up agents. If a
follow-up agent still has to rediscover the same route skeleton from raw files,
this slice has failed.

## Evidence Receipt

### Bigtop Evidence

Bigtop frontier evidence established that raw agents reconstruct
package/distribution routes better than the current demo shows:

- BOM -> package recipe -> deploy/provisioner -> smoke test -> runtime layout;
- same-name upstream repository/package version boundaries;
- package/build/runtime unknowns;
- coverage gaps across expected repositories/components.

Research artifacts:

- clean low/medium/high lanes under the June 2026
  `apache-bigtop-full-corpus/no_portolan` research package;
- shaped low/medium/high lanes under
  `apache-bigtop-full-corpus/portolan_shaped_artifact`;
- `bigtop-clean-baseline-analysis.md`;
- `bigtop-artifact-delta-analysis.md`;
- shaped pack provenance: `prototype_artifact`.

Degraded or unverified surfaces:

- package builds: `blocked` / `not_assessed`;
- Docker provisioner: `blocked` / `not_assessed`;
- Puppet catalog compilation: `blocked` / `not_assessed`;
- smoke tests: `blocked` / `not_assessed`;
- CI health: `blocked` / `not_assessed`;
- network/download validity: `blocked` / `not_assessed`;
- dependency resolution: `blocked` / `not_assessed`;
- dead code, cycles, duplication, and symbol topology: `not_assessed`.

### Portolan-Self Evidence

`portolan-self` frontier evidence established that the same product problem
appears in a single-repo implementation/toolchain corpus:

- Go CLI dispatch route;
- harness/script workflow route;
- bundle generation route;
- schema and validator route;
- viewer/API/source-snippet route;
- legacy/current overlap;
- duplicate validator and version-skew risks;
- blocked build/test/runtime/browser probes.

Research artifacts:

- clean low/medium/high lanes under `portolan-self-boundary-v2`;
- `portolan-self-boundary-v2-frontier-analysis.md`;
- boundary/control provenance: `prototype_artifact`.

Lane outcome:

- all agents self-marked `contaminated`;
- machine validation found low/high clean outside the copied ledger;
- machine validation found medium contaminated by its own artifact text;
- this proves that agent self-status is evidence, not authority.

Degraded or unverified surfaces:

- builds: `blocked` / `not_assessed`;
- tests: `blocked` / `not_assessed`;
- CI: `blocked` / `not_assessed`;
- package installs: `blocked` / `not_assessed`;
- Docker: `blocked` / `not_assessed`;
- network: `blocked` / `not_assessed`;
- runtime probes: `blocked` / `not_assessed`;
- browser rendering: `not_assessed`;
- generated atlas quality for `portolan-self`: `not_assessed`.

### Current Demo Baseline

The current Bigtop demo data has useful objects, but not enough navigation
structure:

- components: 22;
- relationships: 24;
- surfaces: 75;
- repositories: 0;
- findings: 0;
- unknowns: 1 generic runtime-topology gap.

That baseline is below the raw-agent frontier. The next demo must show not just
more nodes, but a richer atlas.

## Decision Gate

**Simpler/Faster:** add generated JSONL artifacts beside the frozen
`system-map` bundle and render them through existing atlas/dossier surfaces.
Do not add a hosted service, daemon, database, graph database, live index, or
visual redesign for this slice.

**Blocking Edge Cases:** raw agents infer routes manually and inconsistently;
route evidence can cross source boundaries; source visibility is not runtime
proof; Bigtop routes are package/distribution-shaped while `portolan-self`
routes are implementation/toolchain-shaped; agent self-status can disagree with
machine validation; unknowns must remain visible without dominating the UI.

**Existing Open Source:** package managers, static analyzers, dependency graph
tools, SBOM tools, symbol indexers, duplication scanners, and language-specific
query tools can become producers. They do not replace this spec because the
Portolan product contract is the normalized atlas surface: routes, coverage,
findings, unknown probes, evidence, and validation across heterogeneous corpora.

Decision: build the normalized atlas contract now, using fixture-backed and
source-derived producers where necessary. Integrate mature scanners later as
producers when they improve coverage without weakening the local-first trust
contract.

## Product Questions The Atlas Must Answer

The admiral should be able to answer:

- What are the main regions of this system?
- What route moves from declared source to build/package/deploy/test/runtime?
- Which source regions are covered, missing, duplicated, stale, risky, or
  not-assessed?
- Which claims are source-visible, metadata-visible, blocked, or unknown?
- Which findings are structural risks rather than generic lint noise?
- Which unknowns have a concrete next probe?
- Where did agent self-status disagree with machine validation?
- Where should a follow-up agent start without rediscovering the corpus?

The follow-up agent should be able to answer:

- Which artifact should I query for routes?
- Which evidence refs prove this row?
- Which routes are source-visible but runtime-unverified?
- Which route/finding/unknown should I investigate next?
- Which generated rows are fixture-backed versus generic producer-backed?

## Scope

### Owned Product Surfaces

This slice owns:

- generated navigation-index artifact;
- generated coverage-matrix artifact;
- generated atlas-findings artifact;
- generated unknown-probes artifact;
- generated evidence artifact for the new rows;
- generated receipt-validation artifact;
- generated frontier-comparison artifact;
- schema validation for those artifacts;
- fixture-backed extraction for Bigtop and `portolan-self`;
- minimal viewer/dossier rendering for routes, coverage, findings, unknown
  probes, and receipt validation.

### Explicit Non-Goals

This slice does not own:

- visual-style redesign;
- Part 2 live fleet navigation;
- live indexing or drift detection;
- automatic runtime/build/test execution unless separately approved;
- full symbol graph;
- complete dead-code proof;
- complete duplication proof;
- complete cycle analysis;
- replacing the frozen `system-map` contract;
- integrating a new heavy scanner dependency as a requirement;
- turning Bigtop-specific rules into universal claims.

## Bundle Output Contract

The generated atlas bundle must include:

```text
system-map.json
navigation-index.jsonl
coverage-matrix.jsonl
atlas-findings.jsonl
unknown-probes.jsonl
evidence.jsonl
receipt-validation.json
frontier-comparison.md
```

The implementation may keep the existing frozen `system-map` shape. The new
artifacts are additive. They may later be folded into a 0.2.0 snapshot schema,
but this slice should not require that migration.

All new artifacts must be generated by a reproducible command. Fixture-backed
rules are allowed, but the output files must not be hand-written final state.

## Shared Terms

### Subject

A `subject` is the thing a route, coverage row, finding, or unknown is about.
It may be:

- a repository;
- a source region;
- a package/component;
- a generated artifact;
- a viewer/API route;
- a schema/contract;
- a deployment/provisioner surface;
- a runtime surface;
- an external boundary.

### Route

A `route` is an evidence-backed navigation path through the system. It is not
limited to graph edges. A route can describe package flow, command dispatch,
schema validation, viewer source-preview behavior, or a blocked runtime probe.

### Coverage

Coverage records whether an expected subject is represented in the atlas and
what states are known or unknown. Missing coverage is a visible result.

### Finding

A finding is a structural signal attached to one or more subjects or routes. It
must carry evidence and confidence. Findings are first-class atlas objects, not
paragraphs buried in a report.

### Unknown Probe

An unknown probe is a blocked or not-assessed surface plus the next safe check.
Unknowns are navigational affordances, not generic disclaimers.

### Receipt Validation

Receipt validation is the machine verdict over generated artifacts and
agent/run receipts. Agent self-status is one input, not authority.

## Artifact Schemas

These schemas are specified as JSON object contracts. Implementations may
create formal JSON Schema files, but the generated rows must follow these
fields.

### `navigation-index.jsonl`

Each line is one JSON object. Each object is one route stage.

Required fields:

```json
{
  "route_id": "route:viewer-source-snippet:request-to-file",
  "route_family": "viewer_api",
  "route_title": "Viewer source preview request reaches fail-closed file boundary",
  "stage": "source-boundary-check",
  "stage_index": 2,
  "subject_id": "region:viewer",
  "subject_type": "source_region",
  "source_path": "viewer/scripts/serve.js",
  "source_anchor": "realpath check before source preview",
  "line_start": 0,
  "line_end": 0,
  "path_role": "source_snippet_boundary",
  "lifecycle": "active",
  "source_evidence_state": "source-visible",
  "runtime_assessment": "not_assessed",
  "route_quality": "medium",
  "artifact_provenance": "generated_artifact",
  "producer_id": "atlas-navigation-index:fixture-v1",
  "evidence_refs": ["ev:viewer-source-boundary"],
  "finding_refs": ["finding:source-preview-security-boundary"],
  "unknown_probe_refs": ["unknown:viewer-runtime-smoke"],
  "next_raw_check": "Run the viewer source-preview smoke with a disposable bundle."
}
```

Required semantics:

- `route_id` is stable for the same target and route.
- `route_family` is one of the allowed families below.
- `stage_index` orders stages inside one route.
- `subject_id` resolves to a coverage row or a system-map object when
  available.
- `source_path` is target-relative.
- `line_start` and `line_end` may be `0` only when stable line anchors are not
  available; then `source_anchor` must be non-empty.
- `source_evidence_state` uses the evidence vocabulary from the existing
  product contract where possible: `source-visible`, `metadata-visible`,
  `runtime-visible`, `claim-only`, `unknown`, `cannot_verify`,
  `not_assessed`, `blocked`, or `failed`.
- `runtime_assessment` is separate from source visibility and uses
  `verified`, `not_assessed`, `blocked`, `failed`, or `cannot_verify`.
- `route_quality` is `high`, `medium`, or `low`; it is a local route
  completeness heuristic, not the `08` confidence enum.
- `artifact_provenance` is `generated_artifact`, `fixture_backed`, or
  `prototype_artifact`.
- `producer_id` names the generator.
- every `evidence_refs` item resolves to `evidence.jsonl`.
- every `finding_refs` item resolves to `atlas-findings.jsonl`.
- every `unknown_probe_refs` item resolves to `unknown-probes.jsonl`.

Allowed `route_family` values:

- `command`;
- `script_workflow`;
- `bundle_generation`;
- `schema_validation`;
- `viewer_api`;
- `package_flow`;
- `deploy_flow`;
- `test_flow`;
- `runtime_layout`;
- `version_boundary`;
- `dependency`;
- `docs_link`;
- `external_boundary`.

Allowed `path_role` values:

- `entrypoint`;
- `command_dispatch`;
- `workflow_script`;
- `bundle_builder`;
- `schema`;
- `validator`;
- `viewer_api`;
- `source_snippet_boundary`;
- `bom`;
- `package_recipe`;
- `package_spec`;
- `install_script`;
- `deploy_module`;
- `provisioner`;
- `smoke_test`;
- `runtime_layout`;
- `upstream_source`;
- `docs`;
- `patch`;
- `fixture`;
- `generated`;
- `unknown`.

### `coverage-matrix.jsonl`

Each line classifies one expected subject.

Required fields:

```json
{
  "coverage_id": "coverage:portolan-self:viewer",
  "subject_id": "region:viewer",
  "subject_type": "source_region",
  "subject_label": "Viewer",
  "source_path": "viewer",
  "expected_by": "source-region-enumerator",
  "promotion_state": "promoted",
  "route_status": "partial",
  "finding_status": "has_findings",
  "runtime_status": "not_assessed",
  "test_status": "not_assessed",
  "coverage_quality": "medium",
  "route_refs": ["route:viewer-source-snippet:request-to-file"],
  "finding_refs": ["finding:source-preview-security-boundary"],
  "known_unknown_ids": ["unknown:viewer-runtime-smoke"],
  "top_evidence_refs": ["ev:viewer-package", "ev:viewer-source-boundary"]
}
```

Required semantics:

- `coverage_id` is stable.
- `subject_type` is `repository`, `source_region`, `component`, `package`,
  `generated_artifact`, `schema`, `viewer_surface`, `runtime_surface`, or
  `external_boundary`.
- `expected_by` records how the subject was enumerated.
- `promotion_state` is `promoted`, `candidate`, `missing`, `excluded`,
  `not_assessed`, or `cannot_verify`.
- `route_status` is `complete`, `partial`, `missing`, `not_assessed`, or
  `blocked`.
- `finding_status` is `none`, `has_findings`, `not_assessed`, or `blocked`.
- `runtime_status` and `test_status` preserve `not_assessed` and `blocked`.
- `coverage_quality` is `high`, `medium`, or `low`.
- refs must resolve when present.

Expected subject enumeration:

- Bigtop: immediate non-dot directories under the target `repos` root, plus
  promoted package/distribution components when discoverable from local source.
- `portolan-self`: top-level implementation regions from the allowed source
  inventory, at minimum Go CLI/internal, harness/scripts, viewer, JavaScript
  core, schemas/contracts, fixtures/tests, and docs-like public-facing files
  that are allowed by the boundary.

### `atlas-findings.jsonl`

Each line is a finding.

Required fields:

```json
{
  "finding_id": "finding:duplicate-system-map-validator",
  "finding_type": "duplicate_risk",
  "severity": "medium",
  "title": "System-map validation behavior appears duplicated",
  "summary": "Viewer and JavaScript core both validate system-map semantics, creating drift risk.",
  "subject_ids": ["region:viewer", "region:portolan-core"],
  "route_refs": ["route:system-map-validation:viewer", "route:system-map-validation:core"],
  "state": "verified",
  "confidence": "hypothesis-with-facts",
  "producer_family": "agent-producer",
  "artifact_provenance": "fixture_backed",
  "evidence_refs": ["ev:viewer-validator", "ev:core-validator"],
  "next_raw_check": "Compare validator behavior against the same fixture."
}
```

Allowed `finding_type` values for this slice:

- `duplicate_risk`;
- `version_skew`;
- `legacy_current_overlap`;
- `coverage_gap`;
- `runtime_unknown`;
- `boundary_risk`;
- `high_responsibility_script`;
- `false_join_risk`;
- `blocked_probe`;
- `not_assessed_surface`.

Allowed `severity` values:

- `critical`;
- `major`;
- `minor`;
- `info`.

Allowed `confidence` values follow `08`:

- `ironclad`;
- `hypothesis-with-facts`;
- `hypothesis`;
- `speculation`.

Rules:

- Deterministic producers may emit only `ironclad`.
- Agent or fixture-backed producers should usually emit
  `hypothesis-with-facts` when evidence refs resolve.
- Findings with no evidence refs cannot be `hypothesis-with-facts`.
- Findings must be visible in the viewer/dossier, not only in generated files.

### `unknown-probes.jsonl`

Each line is one unknown or blocked surface plus a next safe probe.

Required fields:

```json
{
  "unknown_id": "unknown:viewer-runtime-smoke",
  "subject_id": "region:viewer",
  "blocked_surface": "viewer runtime",
  "state": "not_assessed",
  "why_unknown": "The clean frontier lane did not run Node commands or browser checks.",
  "next_probe": "Run viewer schema validation and browser smoke against a generated disposable bundle.",
  "probe_risk": "low",
  "requires_permission": ["local browser runtime"],
  "route_refs": ["route:viewer-source-snippet:request-to-file"],
  "finding_refs": ["finding:source-preview-security-boundary"],
  "evidence_refs": ["ev:viewer-package"]
}
```

Allowed `state` values:

- `unknown`;
- `not_assessed`;
- `blocked`;
- `cannot_verify`;
- `failed`.

Allowed `probe_risk` values:

- `low`;
- `medium`;
- `high`.

Rules:

- Do not collapse all unknowns into one generic runtime gap.
- Every route with `runtime_assessment: not_assessed` should link to an
  unknown probe or explain why no safe probe exists.
- Probes requiring network, mutation, package installs, Docker, CI, or runtime
  services must say so explicitly.
- A probe is a plan, not proof. Do not mark a blocked surface verified because a
  probe exists.

### `evidence.jsonl`

Each line is one evidence item referenced by another artifact.

Required fields:

```json
{
  "evidence_id": "ev:viewer-source-boundary",
  "source_path": "viewer/scripts/serve.js",
  "source_anchor": "realpath check before source preview",
  "line_start": 0,
  "line_end": 0,
  "evidence_state": "source-visible",
  "observation": "Source preview resolves target files under known roots and rejects unsafe requests.",
  "producer_id": "atlas-navigation-index:fixture-v1",
  "artifact_provenance": "fixture_backed"
}
```

Rules:

- `evidence_id` must be unique.
- `source_path` is target-relative unless the evidence is about a generated
  artifact; generated artifact paths must be bundle-relative.
- A row may use `line_start: 0` and `line_end: 0` only with a stable
  `source_anchor`.
- `evidence_state` must not imply runtime proof unless the evidence is actually
  runtime-visible.

### `receipt-validation.json`

This is one JSON object per generated bundle.

Required fields:

```json
{
  "target_id": "portolan-self",
  "artifact_set": "atlas-navigation-index",
  "machine_status": "verified",
  "agent_self_status": "contaminated",
  "status_disagreements": [
    {
      "subject": "clean-frontier-low",
      "machine_status": "clean",
      "agent_self_status": "contaminated",
      "reason": "No forbidden target-relative refs outside copied ledger."
    }
  ],
  "validated_files": [
    "navigation-index.jsonl",
    "coverage-matrix.jsonl",
    "atlas-findings.jsonl",
    "unknown-probes.jsonl",
    "evidence.jsonl",
    "frontier-comparison.md"
  ],
  "row_counts": {
    "navigation-index.jsonl": 0,
    "coverage-matrix.jsonl": 0,
    "atlas-findings.jsonl": 0,
    "unknown-probes.jsonl": 0,
    "evidence.jsonl": 0
  },
  "validation_checks": [
    {
      "check_id": "jsonl-parse",
      "status": "verified",
      "summary": "All JSONL rows parse."
    }
  ]
}
```

Allowed `machine_status` values:

- `verified`;
- `failed`;
- `blocked`;
- `not_assessed`.

Required machine validation checks:

- required files exist;
- JSON files parse;
- JSONL files parse line by line;
- ids are unique within each artifact;
- evidence refs resolve;
- finding refs resolve;
- unknown probe refs resolve;
- route refs resolve;
- coverage subjects exist for required fixture targets;
- no artifact claims runtime/build/test/network verification unless a probe ran;
- generated artifacts are not manually shaped final state;
- frontier-comparison required rows exist;
- row counts are recorded.

### `frontier-comparison.md`

This is a human-readable receipt comparing generated output to raw-agent
frontier findings.

Required table columns:

```text
frontier_capability
raw_agent_evidence
generated_artifact
viewer_surface
status
gap_or_next_step
```

Allowed `status` values:

- `exceeds_frontier`;
- `matches_frontier`;
- `below_frontier`;
- `not_assessed`.

Required rows:

- Bigtop package/distribution route;
- Bigtop version-boundary or runtime unknown;
- Bigtop coverage gap;
- `portolan-self` implementation/toolchain route;
- `portolan-self` duplicate/drift/version-skew finding;
- `portolan-self` blocked runtime/build/test probe;
- receipt-validation disagreement between agent self-status and machine status.

Pass condition:

- at least one Bigtop row is `matches_frontier` or `exceeds_frontier`;
- at least one `portolan-self` row is `matches_frontier` or
  `exceeds_frontier`;
- no `below_frontier` row is hidden from the viewer/dossier surface;
- every `below_frontier` row has a concrete next step.

## Producer Requirements

The implementation may be fixture-backed first, but it must still behave like a
producer, not a hand-written report.

### Producer Inputs

Producer inputs:

- target root;
- existing `system-map` bundle when available;
- source inventory;
- fixture profiles for Bigtop and `portolan-self`;
- existing research receipts only for comparison and acceptance, not as source
  truth for generated target facts.

### Producer Outputs

Producer outputs:

- all bundle artifacts listed above;
- a command receipt showing the generator command;
- validation output.

### Producer Provenance

Every generated row must say whether it is:

- `generated_artifact`: produced by current deterministic logic;
- `fixture_backed`: produced by target-specific fixture extraction rules;
- `prototype_artifact`: manually shaped research support, not acceptable for
  final generated bundle unless explicitly marked degraded.

The first implementation may use `fixture_backed`. It must not label
fixture-backed output as generic deterministic extraction.

### Source Boundaries

For Bigtop:

- do not use `.portolan` under the target as evidence;
- do not use old research artifacts as target evidence;
- do not use network, remote tags, package downloads, or remote branches;
- do not mutate target files.

For `portolan-self`:

- do not use active product docs as source truth for implementation routes when
  running a clean frontier-style fixture;
- generated product specs may be used to guide implementation, but generated
  artifact facts must be grounded in allowed source or explicit fixture rules;
- do not use prior agent artifacts as target evidence except in
  `frontier-comparison.md`.

## Required Fixture Coverage

### Bigtop Minimum Route Set

The Bigtop bundle must include at least one complete package/distribution route
with stages for:

- BOM/package declaration;
- package recipe or package spec;
- deploy/provisioner or install module;
- smoke-test or test-surface reference;
- runtime layout or runtime unknown;
- upstream version boundary or false-join risk.

The Bigtop coverage matrix must include:

- one row per expected repository/component subject used by the fixture;
- a visible row for any expected subject with no generated route;
- at least one version-boundary or false-join finding;
- at least one blocked/not-assessed runtime/build/test probe.

### Portolan-Self Minimum Route Set

The `portolan-self` bundle must include routes for:

- command dispatch or entrypoint flow;
- harness/script workflow;
- bundle generation or generated artifact route;
- schema or validator route;
- viewer/API or source-snippet route;
- test/build/runtime unknown probe;
- duplicate, drift, or version-skew finding.

The `portolan-self` coverage matrix must include source-region rows for at
least:

- Go CLI/internal region;
- harness/scripts region;
- viewer region;
- JavaScript core region;
- schemas/contracts region;
- fixtures/tests region.

## Viewer And UX Requirements

This slice does not redesign visual style. It adds navigation substance to the
existing atlas.

### Overview Surface

The overview must show compact counts or affordances for:

- routes;
- coverage subjects;
- findings;
- unknown probes;
- receipt status.

These counts must link to a readable list or dossier. If the existing overview
cannot support all counts elegantly, prioritize routes, findings, and unknown
probes.

### Route List

The atlas must expose a route list grouped by `route_family`.

Each route row should show:

- title;
- family;
- subject;
- route quality;
- source evidence state;
- runtime assessment;
- attached findings count;
- attached unknown probes count.

### Route Dossier

Opening a route must show:

- route title and family;
- ordered stages;
- source path/anchor for each stage;
- evidence refs;
- attached findings;
- attached unknown probes;
- next raw check.

The route dossier must make source-visible but runtime-not-assessed states
obvious. It must not imply runtime proof from static source.

### Coverage Dossier

Opening a coverage subject must show:

- subject label and type;
- source path;
- promotion state;
- route status;
- finding status;
- runtime/test status;
- linked routes;
- linked findings;
- linked unknown probes.

### Finding Dossier

Opening a finding must show:

- finding type;
- severity;
- confidence;
- subject ids;
- route refs;
- evidence refs;
- next raw check.

Findings should be visible enough that the demo no longer reports zero
findings when frontier evidence clearly contains structural risks.

### Unknown Probe Dossier

Opening an unknown probe must show:

- blocked surface;
- current state;
- why it is unknown;
- next probe;
- probe risk;
- required permissions;
- linked route/finding/evidence.

Unknown probes should turn `not_assessed` into a plan without making green
claims.

### Receipt Validation Surface

The atlas must show receipt validation separately from product findings.

It should show:

- machine status;
- agent self-status if available;
- disagreements;
- row counts;
- failed checks;
- blocked checks.

The admiral should be able to tell whether an expedition receipt is clean,
failed, blocked, or disputed.

## Agent Handoff Requirements

The generated bundle should help follow-up agents. A follow-up agent must be
able to answer these questions from artifacts without raw corpus rediscovery:

- list route families;
- list routes for a subject;
- open route evidence;
- list findings attached to a route;
- list unknown probes attached to a route;
- identify not-assessed runtime/build/test surfaces;
- identify machine-vs-agent receipt disagreements;
- identify fixture-backed rows.

The implementation should add or update a query/handoff surface if the current
bundle query tooling cannot answer these questions.

## Validation Commands

The implementation must provide a small command set that proves the slice.

Minimum validation:

```bash
git diff --check
```

```bash
jq empty <bundle>/receipt-validation.json
```

```bash
while read -r line; do test -z "$line" || jq -e . >/dev/null <<<"$line"; done < <bundle>/navigation-index.jsonl
while read -r line; do test -z "$line" || jq -e . >/dev/null <<<"$line"; done < <bundle>/coverage-matrix.jsonl
while read -r line; do test -z "$line" || jq -e . >/dev/null <<<"$line"; done < <bundle>/atlas-findings.jsonl
while read -r line; do test -z "$line" || jq -e . >/dev/null <<<"$line"; done < <bundle>/unknown-probes.jsonl
while read -r line; do test -z "$line" || jq -e . >/dev/null <<<"$line"; done < <bundle>/evidence.jsonl
```

The implementation should also provide one project-local validator command that
wraps these checks and verifies refs, counts, required fixture rows, and
frontier-comparison rows.

## BDD

```gherkin
Feature: Atlas navigation index turns a component map into a system atlas

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
```

## Acceptance

Pass when all of the following are true:

1. The generated bundle includes every required artifact.
2. New artifacts are generated by a reproducible command.
3. JSON and JSONL artifacts parse.
4. Required ids are unique.
5. Evidence, finding, unknown-probe, route, and coverage refs resolve.
6. Bigtop has a package/distribution route with required stages.
7. Bigtop has coverage rows and at least one version-boundary or runtime/build
   unknown signal.
8. `portolan-self` has implementation/toolchain routes covering command or
   script, bundle or schema, viewer or API, and blocked test/runtime surfaces.
9. `portolan-self` has coverage rows for required source regions.
10. Findings are visible as first-class rows and in the viewer/dossier.
11. Unknown probes are route-attached and specific.
12. Runtime/build/test/network claims remain `blocked` or `not_assessed` unless
    probes actually ran.
13. Receipt validation separates agent self-status from machine status.
14. `frontier-comparison.md` applies the comparison gate.
15. The viewer lets the admiral open a route, coverage subject, finding,
    unknown probe, and receipt validation detail.
16. A follow-up agent can use generated artifacts to navigate without raw
    rediscovery for the required Bigtop and `portolan-self` routes.

Fail when any of the following are true:

- the UI remains only a component/repository graph with no route stages;
- repositories or components are the only meaningful atlas scale;
- findings remain zero despite frontier evidence of structural risks;
- unknowns remain one generic runtime gap;
- Bigtop-specific logic cannot express `portolan-self` implementation routes;
- source-visible routes imply runtime proof;
- blocked probes are hidden or converted to green claims;
- agent self-status is treated as authoritative without machine validation;
- generated artifacts are manually hand-written final state;
- no comparison is made against raw-agent frontier reports;
- fixture-backed output is labelled as generic deterministic extraction.

## Handoff Prompt

```text
Implement docs/captain-atlas/13-atlas-navigation-index.md.

Work from:
- docs/captain-atlas/08-portolan-product-charter.md
- docs/captain-atlas/10-agent-frontier-to-spec-roadmap.md
- docs/captain-atlas/13-atlas-navigation-index.md

Do not redesign visual style. Do not narrow the task to repositories, Bigtop, or
boundary ledgers.

Build generated additive atlas artifacts:
- navigation-index.jsonl
- coverage-matrix.jsonl
- atlas-findings.jsonl
- unknown-probes.jsonl
- evidence.jsonl
- receipt-validation.json
- frontier-comparison.md

Support both:
- /home/fall_out_bug/work/datasets/bigtop-landscape
- /home/fall_out_bug/projects/sdp/portolan

Fixture-backed extraction is allowed, but outputs must be generated by a
reproducible command and labelled with artifact_provenance.

Add validation for parse, refs, required rows, row counts, blocked/runtime truth,
and frontier comparison.

Add minimal viewer/dossier rendering for routes, coverage, findings, unknown
probes, and receipt validation.

The implementation passes only when generated artifacts plus viewer surfaces
show more navigable system structure than the current component/surface demo
and preserve blocked/not_assessed truth.
```
