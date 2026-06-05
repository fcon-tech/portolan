# Feature Specification: Evidence Navigation UX Patterns

**Feature Branch**: `codex/084-tool-adoption-specs`

**Created**: 2026-06-04

**Status**: Draft; backlog-only. Requires `plan.md` and `tasks.md` before
implementation.

**Input**: The external review found that Understand-Anything, CodeGraph, and
ast-index contain useful navigation ideas, but Portolan must not adopt
LLM-authored architecture graphs, target-mutating workflows, or tool-specific
agent rules as truth.

## User Scenarios & Testing

### User Story 1 - Get A Guided Map From Existing Evidence (Priority: P1)

An agent or human can open a Portolan map bundle and receive a compact
navigation guide that points to important repositories, evidence families,
relationship slices, unknowns, and follow-up queries without inventing new
architecture facts.

**Why this priority**: Portolan's raw graph and context artifacts are useful but
can still be too broad for first-run orientation.

**Independent Test**: A fixture map bundle generates a navigation guide whose
claims all cite existing graph, summary, evidence-index, finding, or gap
records.

**Acceptance Scenarios**:

1. **Given** a map bundle with mixed source, metadata, runtime, claim, and unknown
   evidence, **When** the navigation guide is generated, **Then** it separates
   observed facts from gaps and shows where an agent should drill next.
2. **Given** missing symbol/reference or runtime evidence, **When** the guide
   mentions those areas, **Then** it presents them as unknown, blocked, or
   candidate acquisition steps rather than architecture conclusions.

---

### User Story 2 - Borrow Navigation Patterns Without Borrowing Truth Claims (Priority: P1)

Maintainers can adopt useful UX patterns from external projects, such as tours,
graph slices, impact views, and search entrypoints, while keeping Portolan's
evidence model as the only truth boundary.

**Why this priority**: Understand-Anything is attractive as a product
experience, but its LLM-authored graph is not acceptable evidence for Portolan.

**Independent Test**: The guide includes relationship, impact, and orientation
sections derived from Portolan artifacts only; no LLM-generated summaries are
required or accepted as facts.

**Acceptance Scenarios**:

1. **Given** a relationship-heavy map, **When** the guide creates a tour or
   impact-oriented entrypoint, **Then** every cited relation can be traced back
   to local Portolan evidence.
2. **Given** an external UX pattern that requires live dashboards, model calls,
   or target mutation, **When** it is considered for Portolan, **Then** the
   default adoption is rejected or deferred unless a later spec approves the
   boundary.

---

### User Story 3 - Support Different Reader Modes From One Evidence Base (Priority: P2)

The same map can expose a CTO-oriented overview, an agent query route, and a
maintainer follow-up list without creating separate truth sources.

**Why this priority**: Different readers need different entrypoints, but
duplicating facts across reports increases drift.

**Independent Test**: A single fixture graph produces multiple guide sections or
views that differ in ordering and emphasis but reference the same underlying
records.

**Acceptance Scenarios**:

1. **Given** a generated navigation guide, **When** the CTO overview and agent
   drill-down sections mention the same finding, **Then** they reference the
   same evidence record or finding ID.

### Edge Cases

- The graph is small enough that a guide should avoid noisy summaries.
- The graph is too large for a single page and needs budgets, top-N sections, or
  query routes.
- Important evidence is missing, stale, or claim-only.
- External UX examples imply confidence, ranking, or impact that Portolan cannot
  verify.
- A future dashboard or MCP surface is tempting but would introduce daemon,
  browser, or network behavior outside the current CLI-first boundary.

## Requirements

### Functional Requirements

- **FR-001**: Portolan MUST generate navigation content only from existing
  Portolan artifacts such as graph, summary, graph-index, evidence-index,
  findings, gaps, and tool-acquisition guidance.
- **FR-002**: Navigation output MUST preserve evidence states and MUST NOT
  rewrite `unknown`, `cannot_verify`, `claim-only`, or candidate tool guidance
  into observed architecture facts.
- **FR-003**: Navigation output MUST include traceable references to source
  artifacts, record IDs, finding IDs, or query routes for every substantive
  architecture, relationship, or gap claim.
- **FR-004**: The feature MUST borrow UX patterns only as presentation patterns,
  including guided tours, relationship slices, impact-style entrypoints,
  search/query suggestions, and reader modes.
- **FR-005**: The feature MUST NOT require LLM calls, live dashboards, browser
  sessions, daemons, network access, target mutation, or global agent
  configuration by default.
- **FR-006**: Understand-Anything-inspired graph tours MUST be constrained to
  evidence-backed Portolan records; LLM-authored nodes, summaries, or recovered
  defaults MUST NOT be accepted as Portolan facts.
- **FR-007**: CodeGraph-inspired caller/callee, impact, and search entrypoints
  MUST be represented as bounded query routes or graph slices, not as proof of a
  complete semantic call graph unless imported evidence supports that claim.
- **FR-008**: ast-index-inspired symbol/reference navigation MUST expose
  reference-limit and freshness boundaries inherited from imported producer
  metadata.
- **FR-009**: Output budgets MUST prevent navigation artifacts from becoming a
  second unbounded report that agents have to summarize again.

### Key Entities

- **Navigation Guide**: A compact human- and agent-readable orientation artifact
  derived from existing Portolan evidence.
- **Reader Mode**: A different ordering or emphasis over the same facts, such as
  CTO overview, agent drill-down, or maintainer follow-up.
- **Traceable Navigation Claim**: A guide statement that cites the artifact,
  record, finding, or query route that supports it.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A fixture map generates a navigation guide with no unsupported
  architecture claims.
- **SC-002**: Every non-trivial relationship or gap statement in the guide points
  to an existing Portolan artifact, record, finding, or query route.
- **SC-003**: Missing runtime, full call graph, and unresolved reference evidence
  remain visibly bounded rather than being converted into confident summaries.
- **SC-004**: The first version ships as local CLI/context output, not a live
  dashboard, daemon, MCP install, or LLM workflow.

## Assumptions

- This slice adopts product and UX ideas, not external runtime dependencies.
- A later UI or dashboard spec may exist, but it requires a separate approval
  boundary because Portolan is CLI-first today.
- Navigation quality should be judged by whether agents make fewer unsupported
  claims, not by visual richness alone.
