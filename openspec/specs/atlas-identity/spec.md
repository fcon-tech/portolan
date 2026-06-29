# Atlas Identity Specification

## Purpose

Defines what Portolan IS: a local-first cartographic atlas of a code landscape,
produced as a one-shot snapshot by deterministic analyzers and agent producers.
This spec is the identity anchor; every other spec derives from it.

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

### Requirement: Agent-atlas is the base; human-atlas is an optional skin
Portolan SHALL be two products on a shared deterministic core. The agent-atlas
SHALL be the foundation: a local, read-only data and query substrate that the
coding agent consumes to navigate and edit the landscape. The human-atlas SHALL
be an optional presentation layer that renders the same snapshot for the
admiral; it MUST NOT be required for the agent-atlas to function and MUST be
selectable as an install-time option.

#### Scenario: Agent path works without the human skin
- GIVEN the agent-atlas is installed without the human-atlas skin
- WHEN the agent collects and queries the landscape
- THEN the agent receives the snapshot and query results
- AND no presentation layer, HTML atlas, or browser UI is required

#### Scenario: Human skin is an install-time option over the same snapshot
- GIVEN the agent-atlas has produced a snapshot
- WHEN the admiral opts into the human-atlas at install time
- THEN the JS reading layer renders the same snapshot
- AND the rendered atlas shows identical data to the agent's query results

### Requirement: Agent-atlas tentacles are smart, fast, and economical
The agent-atlas SHALL expose the landscape as a bounded, query-aware substrate,
not an undifferentiated data dump. Agent queries SHALL be token-economical: the
substrate MUST return bounded, query-relevant results (symbol, reference,
dependency, surface, finding) rather than whole-graph payloads, so the agent's
context budget is respected. A query for one symbol MUST NOT return the entire
graph as its default answer.

#### Scenario: Query returns bounded, relevant results
- GIVEN the agent asks the substrate for a symbol and its references
- WHEN the substrate answers
- THEN it returns the symbol, its definition, and its immediate references
- AND it does not return the whole-landscape graph

#### Scenario: Whole-graph dump is not the default agent surface
- GIVEN the agent begins navigating an unfamiliar landscape
- WHEN it opens the substrate without a specific query
- THEN it receives a bounded overview (units, dominant groupings, scale)
- AND a full graph is available only as an explicit, opt-in query

### Requirement: Language fit follows the consumer, not author preference
The deterministic collector and query substrate SHALL be implemented in Go and
SHALL run Node-free on the agent path (single binary plus native tools). The
human-atlas presentation layer SHALL be implemented in the JS reading layer over
the snapshot. Shell scripts SHALL be thin drivers only. Where behaviour lives
SHALL be governed by the consumer it serves and the language fit for the job,
not by author preference.

#### Scenario: Agent path runs Node-free
- GIVEN the agent-atlas is installed on a host with the Go binary and native
  tools (ripgrep, ctags) but no Node runtime
- WHEN the agent collects and queries
- THEN collection and querying succeed
- AND no Node runtime is invoked

#### Scenario: Collector behaviour is not implemented in the presentation layer
- GIVEN the portolan-core JS source tree is inspected
- WHEN its modules are classified
- THEN none of them scan repositories, execute OSS producers, or resolve symbol
  references
- AND all such behaviour is located under `internal/` (Go)
