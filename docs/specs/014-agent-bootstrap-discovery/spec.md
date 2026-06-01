# Feature Specification: Agent Bootstrap Discovery

**Feature Branch**: `014-agent-bootstrap-discovery`
**Created**: 2026-05-21
**Status**: Implemented
**Input**: Product correction: Portolan must be usable as a generic agent
toolbox when a user gives an agent the Portolan repository or installed binary
and an arbitrary target repository, without a Bigtop-specific runbook.

## User Scenarios & Testing

### User Story 1 - Agent Discovers The Entry Point (Priority: P1)

A user gives an agent two local paths: Portolan and a target repository. The
agent can discover where to start, which command to run, and which artifacts to
read without being told to open a specific internal guide file.

**Why this priority**: If the user must say "read `agent/AGENT_GUIDE.md`" every
time, Portolan is still a prompt convention, not a productized agent toolbox.

**Independent Test**: A reviewer gives an agent only the Portolan root path, the
target root path, and "map this shit". The agent locates the Portolan agent
entrypoint from repository-root navigation, runs the documented workflow, and
produces an artifact-backed report or a clear blocker.

**Acceptance Scenarios**:

1. **Given** the agent can read the Portolan repository root, **When** the user
   asks it to map a separate target repository, **Then** it can find the
   stable agent entrypoint without being told the exact guide path.
2. **Given** the agent finds the entrypoint, **When** it runs Portolan, **Then**
   it uses `portolan map --root <target-root> --out <run-dir>` rather than
   starting with free-form manual repository exploration.
3. **Given** Portolan cannot run or required local inputs are missing, **When**
   the agent reports back, **Then** it names the blocker and does not replace
   Portolan evidence with unsupported prose.

### User Story 2 - Agent Uses A Portable Skill Surface (Priority: P1)

An agent harness that supports skills or reusable instructions can import a
Portolan mapping skill, while harnesses that do not support skills can still
follow the same root-discoverable instructions.

**Why this priority**: Cursor is only the first cheap acceptance client.
Portolan must remain usable from Claude, Codex, OpenCode, pi, and other
agentic tools without duplicating target-specific prompts.

**Independent Test**: Inspect the agent-facing files and verify that the core
workflow is defined once in portable instructions, with Cursor or other wrappers
delegating to that source instead of copying a divergent workflow.

**Acceptance Scenarios**:

1. **Given** a harness can load a skill file, **When** the Portolan skill is
   installed or referenced, **Then** it tells the agent the same mapping,
   artifact, report, and gap-ledger contract as the root entrypoint.
2. **Given** a Cursor project rule exists, **When** a Cursor agent is asked to
   map a target, **Then** the rule delegates to the portable entrypoint and
   does not contain Bigtop-specific choreography.
3. **Given** another agent harness lacks Cursor rules, **When** it reads the
   Portolan root, **Then** the generic workflow remains usable.

### User Story 3 - Agent Handles Non-Source Targets Honestly (Priority: P2)

An agent can map a target that is not a normal application source repository,
such as a build, packaging, configuration, or test-instruction repository,
without assuming it should fetch component source repositories.

**Why this priority**: Apache Bigtop is primarily an integration, packaging,
configuration, and smoke-test corpus. The product must support that class of
target generically, not through a Bigtop-only operator packet.

**Independent Test**: Run the bootstrap workflow against a local fixture whose
main evidence is build/package/config files. The agent reports observed
surfaces and `not_assessed` gaps instead of inventing component source facts.

**Acceptance Scenarios**:

1. **Given** the target root contains build or packaging instructions but not
   component source repositories, **When** `portolan map` runs, **Then** the
   agent treats observed local files as the evidence boundary.
2. **Given** component source repositories are referenced but not present
   locally, **When** the agent reports relationships, **Then** it marks the
   missing source as `unknown`, `cannot_verify`, or `not_assessed`.

## Edge Cases

- The Portolan path is a source checkout, but no binary is installed on PATH.
- The agent is operating inside the target repository and Portolan is adjacent
  rather than nested inside the target.
- The target is not a Git repository.
- The target is a build/package/config repository rather than application
  source code.
- Existing `.portolan/run` artifacts are stale or belong to a different target.
- The selected output directory already exists.
- The agent cannot execute shell commands and can only inspect files.
- The user has not approved network access, mutation, or credentials.
- A wrapper file, such as a Cursor rule, becomes stale relative to the portable
  entrypoint.

## Requirements

### Functional Requirements

- **FR-001**: The repository root MUST expose a stable agent entrypoint through
  obvious root navigation such as `README.md`, without requiring the user to
  name `agent/AGENT_GUIDE.md` directly.
- **FR-002**: The stable entrypoint MUST be target-agnostic and MUST NOT include
  Apache Bigtop-specific instructions, paths, file lists, or acceptance
  choreography.
- **FR-003**: The entrypoint MUST define the minimum inputs: Portolan checkout
  or installed binary, target root, and explicit output directory.
- **FR-004**: The entrypoint MUST define the primary command:
  `portolan map --root <target-root> --out <run-dir> [--force]`.
- **FR-005**: The entrypoint MUST define how to resolve the Portolan executable
  when only a source checkout is available, without assuming global
  installation.
- **FR-006**: The entrypoint MUST instruct agents to read `run.json`,
  `graph.json`, `findings.jsonl`, and `map.md` before reporting.
- **FR-007**: The entrypoint MUST preserve local-first and read-only boundaries:
  no network, no target mutation, no credentials, and writes only to the
  selected output directory unless explicitly approved.
- **FR-008**: The entrypoint MUST define a generic report contract with
  relationships, duplication, configuration surfaces, technical debt, unknowns,
  `cannot_verify`, `not_assessed`, and a gap ledger.
- **FR-009**: The entrypoint MUST state that non-source targets are valid and
  that build/package/config/test surfaces are evidence, not a reason to fetch
  upstream component repositories.
- **FR-010**: A portable skill file or equivalent reusable instruction artifact
  MUST exist for agent harnesses that support skill import.
- **FR-011**: Harness-specific wrappers MUST delegate to the portable entrypoint
  and MUST NOT duplicate the full workflow.
- **FR-012**: If Portolan cannot be run, the agent MUST stop with a blocker
  rather than performing unmarked manual analysis.

### Key Entities

- **Agent Entrypoint**: The stable root-discoverable file that tells an agent how
  to use Portolan on a target.
- **Portable Skill**: A reusable agent instruction bundle that mirrors the
  entrypoint for harnesses with skill support.
- **Target Root**: The local repository or directory being mapped.
- **Run Directory**: The explicit output directory for generated Portolan
  artifacts.
- **Wrapper**: A harness-specific file, such as a Cursor rule, that delegates to
  the portable entrypoint.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A reviewer can start from the Portolan root README and identify
  the agent entrypoint, primary map command, required artifacts, and stop
  conditions without reading chat history.
- **SC-002**: A blind agent trial using only Portolan path, target path, and
  "map this shit" can either produce a Portolan artifact-backed report or a
  clear blocker without target-specific guidance.
- **SC-003**: The portable entrypoint and portable skill contain no Bigtop-only
  instructions.
- **SC-004**: Harness-specific wrappers reference the portable entrypoint rather
  than copying the full workflow.
- **SC-005**: Local verification passes with `go test ./...`, `jq empty
  schema/*.json`, and `git diff --check`.

## Assumptions

- This slice can be implemented with documentation, portable skill packaging,
  and small CLI/help text adjustments; MCP and LSP surfaces remain out of scope.
- The first acceptance client remains Cursor + Composer 2.5, but this feature
  must not depend on Cursor.
- A later blind acceptance protocol will verify this feature against Apache
  Bigtop and at least one non-Bigtop target.
