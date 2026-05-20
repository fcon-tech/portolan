# Feature Specification: Agent Skill Pack

**Feature Branch**: `008-agent-skill-pack`
**Created**: 2026-05-20
**Status**: Ready for implementation
**Input**: Product decision to make Portolan usable by any coding agent through
a portable guide first, with Cursor rules as the cheapest acceptance wrapper.

## User Scenarios & Testing

### User Story 1 - Agent Finds The Portolan Workflow (Priority: P1)

A user opens an arbitrary repository in an agentic IDE and points the agent at
Portolan. The agent can read one portable guide and know which commands to run,
which artifacts to inspect, and what it must not claim.

**Why this priority**: Without a reliable guide, Portolan remains a tool the
user must manually prompt around.

**Independent Test**: A reviewer can read the guide and identify the exact
doctor step, current-command fallback, target map command, artifact inspection,
and reporting steps without additional conversation.

**Acceptance Scenarios**:

1. **Given** an agent reads the guide, **When** the user says "map this repo",
   **Then** the agent knows to run `portolan doctor`, use current Portolan
   commands for the Bigtop smoke, and prefer `portolan map` once available.
2. **Given** Portolan artifacts exist, **When** the agent answers, **Then** it
   cites graph or finding evidence rather than repo-wide guesses.
3. **Given** a surface cannot be mapped, **When** the agent reports, **Then** it
   uses `unknown` or `cannot_verify` instead of "probably".

### User Story 2 - Cursor Acceptance Wrapper (Priority: P1)

A Cursor user can add a project rule that tells Composer to use Portolan without
making Portolan a Cursor-only product.

**Why this priority**: Cursor is the cheapest acceptance client for observing
whether agents can follow the workflow.

**Independent Test**: The Cursor rule delegates to the portable guide, avoids
Cursor-only product language, and tells the agent not to start with random file
reading.

**Acceptance Scenarios**:

1. **Given** `.cursor/rules/portolan-map.mdc` exists, **When** a Cursor agent is
   asked to map the repo, **Then** it is instructed to use the portable guide
   and Portolan commands first.
2. **Given** the same guide is read by another harness, **When** it lacks Cursor
   rules, **Then** the core workflow remains usable.

### User Story 3 - Report From Artifacts Only (Priority: P2)

An agent report separates relationships, duplication, configuration surfaces,
technical debt, unknowns, and cannot-verify inputs using only Portolan
artifacts.

**Why this priority**: The user needs a checked map, not another prose-only
agent summary.

**Independent Test**: Example output in the skill pack includes evidence-backed
finding rows and explicitly rejects unsupported claims.

## Edge Cases

- `portolan` is not installed or not on PATH: guide must tell the agent to run
  doctor/setup checks and stop with a clear blocker.
- `portolan map` is not implemented yet: guide must describe the intended
  command and provide a current-command fallback for the immediate Bigtop smoke.
- Cursor rules are present but stale: portable guide remains authoritative.
- Agent sees existing `.portolan/run` artifacts: guide tells it to inspect
  `run.json` freshness before trusting them.
- Agent wants to fetch network resources: guide rejects network unless an
  explicit later profile authorizes it.

## Requirements

- **FR-001**: The repository MUST include a portable agent guide that is not
  specific to Cursor.
- **FR-002**: The repository MUST include a Cursor project rule as the first
  cheap acceptance wrapper.
- **FR-003**: The guide MUST define trigger phrases such as "map this repo" and
  "map this shit".
- **FR-004**: The guide MUST define `portolan doctor`, the target
  `portolan map --root . --out .portolan/run` command, a current-command
  fallback for the immediate Bigtop smoke, artifact inspection, and
  evidence-backed reporting.
- **FR-005**: The guide MUST define target required artifacts:
  `run.json`, `graph.json`, `findings.jsonl`, and `map.md`.
- **FR-006**: The guide MUST prohibit unsupported architecture conclusions.
- **FR-007**: The guide MUST preserve evidence states and tell agents to report
  `unknown` and `cannot_verify`.
- **FR-008**: Cursor-specific rules MUST delegate to the portable guide rather
  than duplicating the full workflow.
- **FR-009**: The skill pack MUST include a concise example report format.

## Success Criteria

- **SC-001**: A reviewer can follow the portable guide without knowing Cursor.
- **SC-002**: The Cursor rule is under `.cursor/rules/` and references the
  portable guide.
- **SC-003**: The guide names all required artifacts and evidence states.
- **SC-004**: The example report contains no unsupported claim without an
  evidence state.
- **SC-005**: `git diff --check` and baseline JSON/Go checks pass.

## Assumptions

- The first implementation is documentation and agent-rule packaging only.
- MCP and LSP-style integrations are out of scope for this slice.
- `portolan map` is specified in `specs/009-map-command-artifacts/`; this slice
  may reference it before it is implemented, but the immediate Bigtop smoke must
  not wait for it.
