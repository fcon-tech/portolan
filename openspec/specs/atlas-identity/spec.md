# Atlas Identity Specification

## Purpose

Defines what Portolan IS: a local-first cartographic atlas of a code landscape,
produced as a one-shot snapshot by deterministic analyzers and agent producers.
This spec is the identity anchor; every other spec derives from it.

Source authority: `docs/captain-atlas/08-portolan-product-charter.md` § Product
Identity, Roles, Part 1 / Part 2 Boundary (migrated).

## Requirements

### Requirement: Local-first cartographic atlas
Portolan SHALL be a local-first cartographic atlas of a code landscape. It MUST
operate read-only against the target by default and MUST NOT require network
access, a daemon, or credentials unless explicitly approved.

#### Scenario: Read-only default
- GIVEN an admiral points Portolan at a target perimeter
- WHEN participants build the snapshot
- THEN the target is read-only throughout the expedition
- AND no network access is required for the default flow

### Requirement: One-shot snapshot artefact
The expedition SHALL produce a single one-shot artefact: a snapshot. Determinism
MUST apply to the ironclad-fact layer only — the same landscape rebuilt produces
the same deterministic core (units, edges, surfaces, manifest dependencies).

#### Scenario: Deterministic rebuild of ironclad facts
- GIVEN a snapshot was built for a perimeter
- WHEN the snapshot is rebuilt from the same perimeter with no source changes
- THEN the deterministic core (units, edges, surfaces, dependencies) is identical
- AND only the agent-producer layers may differ unless their raw output is cached

#### Scenario: Agent producer determinism via cached output
- GIVEN an agent producer uses an LLM during a snapshot build
- WHEN the snapshot is rebuilt
- THEN the producer replays its cached raw model output from the snapshot
- AND it does NOT re-query the model

### Requirement: Admiral role
The human SHALL be addressed as the admiral. UI copy, agent instructions, and
documentation MUST use admiral role language (not generic "user" or job titles).

#### Scenario: Role language in surfaces
- GIVEN any user-facing surface (UI, agent prompt, docs)
- WHEN the human is addressed
- THEN the surface uses "admiral" consistently

### Requirement: Two participant kinds in one snapshot
A Part-1 expedition SHALL have two participant kinds working in a single
snapshot build: a deterministic core (static analyzers producing ironclad facts)
and agent producers (skills producing hypotheses with evidence).

#### Scenario: Producers share one snapshot
- GIVEN a snapshot build is in progress
- WHEN deterministic and agent producers emit assertions
- THEN both write into the same normalised snapshot artefact
- AND each assertion is tagged with its producer family

### Requirement: Part 1 / Part 2 boundary
Part 1 (this charter) SHALL cover intake, the deterministic core, agent
producers of the snapshot, the behaviour map, triangulation, C4 projection,
confidence, dossiers, and UX-driven install. Live fleet indexing, drift
detection, and concurrent multi-agent navigation SHALL be Part 2 and out of
scope. Part-1 artefacts MUST NOT include fields whose only consumer is a
Part-2 feature.

#### Scenario: No drift scaffolding in Part 1
- GIVEN a Part-1 snapshot artefact
- WHEN it is inspected
- THEN it contains no drift-detection fields and no live-index hooks
