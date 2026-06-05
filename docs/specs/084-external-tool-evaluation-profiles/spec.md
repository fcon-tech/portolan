# Feature Specification: External Tool Evaluation Profiles

**Feature Branch**: `codex/084-external-tool-evaluation-profiles`

**Created**: 2026-06-04

**Status**: Implemented locally; PR review pending.

**Input**: User asked to turn the external review of `colbymchenry/codegraph`,
`Lum1104/Understand-Anything`, and `defendend/Claude-ast-index-search` into
Portolan adoption specifications for useful ideas and tools.

## User Scenarios & Testing

### User Story 1 - Compare External Tools Without Overclaiming (Priority: P1)

An operator or agent can inspect Portolan's context guidance and understand
which external projects are producer candidates, which are UX inspiration only,
and which risks block direct adoption.

**Why this priority**: Portolan needs to compose existing local tools, but a
candidate tool is not evidence until its local output is supplied and
normalized.

**Independent Test**: A generated guidance artifact or documented profile set
lists CodeGraph, Understand-Anything, and ast-index with role, fit, license,
maintenance snapshot date, output surfaces, approval boundaries, and evidence
limitations.

**Acceptance Scenarios**:

1. **Given** the three evaluated projects, **When** an agent reads the tool
   profiles, **Then** ast-index is visible as the strongest symbol/reference
   producer candidate, CodeGraph is visible as a lower-fit optional candidate,
   and Understand-Anything is visible as UX inspiration rather than a verified
   evidence producer.
2. **Given** a candidate profile, **When** the profile names target mutation,
   watcher/daemon behavior, hooks, MCP installs, network install, or LLM-authored
   claims, **Then** the guidance presents those as approval or adoption blockers,
   not as normal Portolan behavior.

---

### User Story 2 - Preserve Tool Candidate State Separately From Evidence (Priority: P1)

An agent can recommend a local tool as a next evidence-acquisition step without
adding graph facts, promoting unknowns, or implying Portolan has already run the
tool.

**Why this priority**: This protects the existing evidence-state model and keeps
tool acquisition guidance from becoming an accidental claim source.

**Independent Test**: A context pack can mention a candidate tool while the
corresponding evidence family remains `unknown`, `cannot_verify`, or outside the
graph until local output is explicitly imported.

**Acceptance Scenarios**:

1. **Given** no supplied ast-index or CodeGraph output, **When** Portolan emits
   tool guidance, **Then** symbol/reference/call evidence remains unobserved and
   the candidate is not represented as a graph fact.
2. **Given** a profile based on a dated external review, **When** the tool has
   not been refreshed locally, **Then** the profile records that its upstream
   health and schema claims may be stale.

---

### User Story 3 - Update Adoption Decisions Incrementally (Priority: P2)

Maintainers can refresh or narrow a tool profile without rewriting importer
contracts or UX features.

**Why this priority**: These projects may move quickly; Portolan should be able
to keep an honest candidate ledger without coupling itself to unstable tool
behavior.

**Independent Test**: A single tool profile can change classification from
`producer_candidate` to `blocked`, `rejected`, or `ready_for_import_planning`
without changing graph schemas.

**Acceptance Scenarios**:

1. **Given** an upstream release changes output format or license posture,
   **When** the profile is refreshed, **Then** the changed risk and decision are
   visible without modifying unrelated candidate profiles.

### Edge Cases

- The upstream repository changes license, default behavior, output schema, or
  maintenance health after the profile snapshot.
- A candidate writes inside the target repository by default, writes global
  agent configuration, installs hooks, starts a watcher, or runs a daemon.
- A candidate stores source snippets, prompts, credentials, absolute paths, or
  customer-sensitive payloads in outputs.
- A candidate relies on LLM-authored architecture summaries that cannot be
  traced back to local source, metadata, runtime, or claim inputs.
- A candidate works for single repositories but does not scale to multi-repo
  landscapes without sharding or output budgets.

## Requirements

### Functional Requirements

- **FR-001**: Portolan MUST maintain explicit evaluation profiles for the
  reviewed projects: CodeGraph, Understand-Anything, and ast-index.
- **FR-002**: Each profile MUST classify the project role using product-facing
  categories such as `producer_candidate`, `ux_pattern_source`,
  `ready_for_import_planning`, `blocked`, or `rejected`.
- **FR-003**: Each profile MUST record at least: canonical project identity,
  license, review date, relevant output surfaces, local execution posture,
  target mutation risk, network/install risk, daemon/watch risk, privacy risk,
  integration cost, and recommended Portolan action.
- **FR-004**: Candidate profiles MUST NOT create evidence graph facts and MUST
  NOT promote any evidence family to `source-visible`, `metadata-visible`, or
  `runtime-visible`.
- **FR-005**: Candidate profiles MUST state the approval gate required before
  any tool execution, install, target mutation, hook install, MCP install, or
  watcher/daemon behavior.
- **FR-006**: Candidate profiles MUST distinguish deterministic local outputs
  from LLM-authored summaries, heuristics, dashboards, and agent instructions.
- **FR-007**: The profile for ast-index MUST identify it as the strongest
  current symbol/reference producer candidate and record its important limits:
  SQLite/cache output, JSON CLI surface, name/string-based references, optional
  watcher/hooks/MCP installation commands, and lack of Portolan evidence states.
- **FR-008**: The profile for CodeGraph MUST identify it as useful but lower-fit
  for direct adoption because its default workflow writes `.codegraph/` in the
  target, supports watch/MCP/install behavior, and does not carry Portolan
  evidence-state semantics.
- **FR-009**: The profile for Understand-Anything MUST identify UX patterns worth
  borrowing while rejecting its LLM-authored graph as Portolan evidence unless a
  future spec proves a deterministic, locally supplied, evidence-bounded output
  path.
- **FR-010**: Generated guidance MUST make stale-profile risk visible and require
  a fresh upstream/local verification step before implementation depends on a
  candidate's current behavior.

### Key Entities

- **Tool Evaluation Profile**: A dated product decision record for an external
  project, including role classification, fit rationale, risk boundaries, and
  recommended next action.
- **Candidate Role**: A normalized classification that separates producer
  candidates, UX pattern sources, blocked tools, and rejected evidence sources.
- **Approval Boundary**: A required human or spec-level decision before Portolan
  or an operator executes a tool, installs a dependency, mutates a target,
  writes global configuration, starts a watcher, or contacts a network service.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A maintainer can read one artifact and see the adoption status of
  all three reviewed projects without reading the original external repositories.
- **SC-002**: No generated graph fact, claim, or context answer treats a candidate
  profile as observed evidence.
- **SC-003**: ast-index, CodeGraph, and Understand-Anything have distinct
  recommendations that match Portolan's local-first, read-only, evidence-honest
  boundary.
- **SC-004**: Placeholder and clarification scans find no unresolved template
  markers in the specification.

## Assumptions

- This slice is documentation and guidance first; it does not add an importer,
  execute external tools, install dependencies, or change schemas.
- Bounded context-pack guidance may add a small pointer in
  `internal/contextprep`; this is not an importer, schema change, or graph
  evidence fact.
- External project metadata must be refreshed during implementation planning
  because upstream repositories can change after the 2026-06-04 review snapshot.
- `not_assessed` remains a verification/status label, not a graph evidence state.

## Related Future Slices

- `docs/specs/085-ast-index-producer-import/` remains backlog-only and owns any
  future import of explicitly supplied ast-index output.
- `docs/specs/086-evidence-navigation-ux-patterns/` remains backlog-only and
  owns any future adoption of navigation UX patterns from CodeGraph,
  Understand-Anything, or ast-index.
