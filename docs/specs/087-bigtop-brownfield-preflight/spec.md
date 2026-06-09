# Feature Specification: Bigtop Brownfield Preflight

**Feature Branch**: `codex/087-bigtop-brownfield-preflight`

**Created**: 2026-06-09

**Status**: Draft; backlog-only. Requires `plan.md`, `tasks.md`, and
pre-implementation drift review before implementation.

**Input**: Product reset from "evidence substrate" toward one narrow job:
before an AI agent works on a brownfield system, Portolan should run a local
preflight that maps what is visible, selects useful local tools, records blind
spots, and hands a bounded context pack to the agent. Apache Bigtop is the first
demonstration target because prior evidence exists and it is messy enough to
test the job.

## User Scenarios & Testing

### User Story 1 - See The Brownfield Shape Before AI Work (Priority: P1)

An engineering leader or agent operator can run Portolan against a local Bigtop
landscape and receive a concise preflight bundle that says what is present,
where the main visible structure is, which evidence families are missing, and
what the AI agent should read first.

**Why this priority**: The product must create an immediate difference from
"just ask Cursor" before deeper evidence, gates, evals, or imports matter.

**Independent Test**: A Bigtop fixture or local Bigtop landscape produces a
preflight summary that references existing context/map artifacts and names
target shape, important visible surfaces, and blind spots without requiring
review ledgers.

**Acceptance Scenarios**:

1. **Given** a local Bigtop root and existing Portolan commands, **When** the
   preflight is generated, **Then** the operator sees a compact target-shape
   summary, top visible surfaces, top blind spots, and next local probes.
2. **Given** missing runtime, complete call-graph, or dependency evidence,
   **When** the preflight describes the system, **Then** those gaps remain
   explicit and are not rewritten into confident architecture claims.

---

### User Story 2 - Select The Right Local Toolchain (Priority: P1)

An operator can see which code-understanding tools are already available, which
are useful for this Bigtop shape, which are blocked or risky, and which one or
two tools should be tried next.

**Why this priority**: Portolan should not compete with tools like graph
explorers, SBOM scanners, static analyzers, or symbol/reference producers. It
should choose and wire the right tools for the current brownfield job.

**Independent Test**: The preflight includes a toolchain record that classifies
candidate tools by job, availability, license/privacy risk, target-mutation
risk, install/network requirements, evidence family unlocked, and recommended
next action.

**Acceptance Scenarios**:

1. **Given** current local tool availability, **When** preflight runs, **Then**
   installed tools and missing candidate tools are separated.
2. **Given** a candidate requires network install, target mutation, hooks, MCP
   registration, or daemon/watch behavior, **When** it appears in the preflight,
   **Then** the next action requires explicit approval and is not treated as
   default Portolan behavior.

---

### User Story 3 - Hand Off To An AI Agent Without Becoming A Harness
(Priority: P1)

An operator can pass the preflight handoff to Cursor, Codex, OpenCode, pi, or
another agent so the agent starts from the right artifacts and tool gaps without
Portolan orchestrating the agent's coding loop.

**Why this priority**: Portolan must improve agent context while staying out of
model routing, multi-agent execution, code editing, and delivery orchestration.

**Independent Test**: The generated handoff tells the agent which artifacts to
open first, which claims are allowed, which tool outputs are missing, and which
follow-up probes require approval.

**Acceptance Scenarios**:

1. **Given** a generated agent handoff, **When** an agent reads it, **Then** it
   can answer "where should I start?" and "what local evidence is missing?"
   without reading the full graph or review ledgers.
2. **Given** the agent asks for broad architecture, runtime, or call-graph
   conclusions, **When** only partial preflight evidence exists, **Then** the
   handoff requires bounded answers and next-probe recommendations.

---

### User Story 4 - Keep Future Importers Behind The Preflight Decision
(Priority: P2)

Maintainers can decide whether an importer such as ast-index is worth planning
only after the preflight shows that the target shape and missing evidence family
make that tool the best next move.

**Why this priority**: Importer-first specs risk returning to tool-specific
documentation or proof work that does not create first-run product value.

**Independent Test**: The preflight routes ast-index, Graphify,
Understand-Anything, Syft/CycloneDX, Semgrep, jscpd, ctags, jdeps, Compose, and
Helm style tools by target job and evidence gap without committing to importer
implementation.

## Edge Cases

- The Bigtop checkout is a single repository, a partial multi-repo landscape, or
  a broader prepared local landscape.
- A tool is installed but version output is missing, malformed, or not
  compatible with expected output.
- A tool is useful but has commercial, non-OSI, or unclear license posture.
- A tool can generate useful outputs only by mutating the target repository,
  installing hooks, registering MCP servers, writing caches, or starting a
  watcher.
- A prior Portolan output exists but is stale or generated from a different
  root.
- The artifact directory is missing, empty, unreadable, or contains malformed
  JSON/JSONL.
- The preflight bundle is large enough that an agent would need to summarize it
  again.
- Target-derived names, paths, manifest keys, or finding text contain prompt
  injection text or secret-like values.

## Requirements

### Functional Requirements

- **FR-001**: Portolan MUST produce a Bigtop preflight bundle from local inputs
  and existing Portolan artifacts before any external tool install or execution.
- **FR-002**: The preflight MUST include target-shape information: discovered
  repositories, language/ecosystem signals, available manifests/configuration
  surfaces, and whether the run is single-repo, partial multi-repo, or curated
  landscape scope.
- **FR-003**: The preflight MUST include a toolchain inventory that separates
  installed tools, missing candidate tools, supplied tool outputs, and rejected
  or parked candidates.
- **FR-004**: Each toolchain recommendation MUST name the job it serves, the
  evidence family it may unlock, why it is or is not recommended for the current
  target, and the required approval boundary.
- **FR-005**: The preflight MUST NOT install tools, run network commands, mutate
  target repositories, write global agent configuration, register MCP servers,
  start daemons, or start watchers by default.
- **FR-006**: The preflight MUST preserve existing evidence states and status
  labels. Candidate tools and next actions are not evidence until local output is
  produced and imported.
- **FR-007**: The preflight MUST include a human-readable `preflight.md`, a
  machine-readable `toolchain.json`, an `agent-handoff.md`, and a
  `preflight-gaps.jsonl` or equivalent gap record.
- **FR-008**: The preflight MUST link back to existing context/map artifacts
  instead of creating a second truth source for graph facts, findings, or
  coverage.
- **FR-009**: The preflight MUST keep Apache Bigtop as a named demonstration
  target and MUST NOT generalize Bigtop results into arbitrary brownfield or
  complete enterprise-estate claims.
- **FR-010**: The feature MUST classify current draft specs 084, 085, and 086 as
  parked or dependent follow-ups unless the preflight shows they improve the
  first-run Bigtop job.
- **FR-011**: The preflight MUST treat all target-derived strings as untrusted
  display data and MUST escape or bound them before rendering Markdown handoff
  artifacts.
- **FR-012**: The preflight MUST avoid emitting raw source snippets, prompt text,
  credentials, or secret-like values. Existing finding identifiers and artifact
  paths may be linked, but sensitive payloads remain in the source artifact.
- **FR-013**: The preflight MUST resolve CLI directory arguments and write only
  inside the selected output directory. Unsafe output paths, symlink escapes, and
  unreadable input paths MUST fail with explicit errors.

### Key Entities

- **Preflight Bundle**: A local artifact set that summarizes target shape,
  current evidence, recommended tools, blind spots, and agent handoff.
- **Toolchain Recommendation**: A candidate or installed tool record with job,
  availability, approval boundary, evidence family, and risk classification.
- **Preflight Gap**: A missing or blocked evidence family with a reason and a
  next safe probe.
- **Agent Handoff**: Concise instructions that route an AI agent through the
  preflight artifacts without turning Portolan into the coding harness.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A Bigtop preflight run produces a bounded artifact bundle that an
  operator can read before opening full `graph.json` or review ledgers.
- **SC-002**: The toolchain inventory names at least five tool jobs relevant to
  Bigtop and marks each as installed, missing, supplied-output, parked, or
  approval-required.
- **SC-003**: The generated agent handoff includes testable Start Here,
  Blind Spots, Safe Probes, and Approval Required sections without
  Bigtop-specific hidden instructions.
- **SC-004**: Focused tests prove that missing or candidate tool outputs do not
  become graph evidence.
- **SC-005**: No default preflight command performs network access, tool
  installation, target mutation, global config writes, daemon startup, or watcher
  startup.

## Assumptions

- Bigtop is the first demonstration target, not a special product mode.
- Existing context, map, tool-registry, OSS-plan, summary, findings, and gap
  artifacts are reusable inputs.
- Future importers such as ast-index should be planned only after preflight
  demonstrates target-specific usefulness.
- `not_assessed` remains a status label; graph evidence states remain
  `source-visible`, `metadata-visible`, `runtime-visible`, `claim-only`,
  `unknown`, and `cannot_verify`.
