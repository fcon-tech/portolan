# Feature Specification: Blind Agent Acceptance

**Feature Branch**: `015-blind-agent-acceptance`
**Created**: 2026-05-21
**Status**: Protocol implemented; Cursor Agent blind runs degraded
**Input**: Product correction: Bigtop must test Portolan's generic agent
toolbox without receiving a Bigtop-specific operator packet or hidden prompt
scaffolding.

## User Scenarios & Testing

### User Story 1 - Run A Target-Agnostic Agent Trial (Priority: P1)

A product evaluator can run an agent acceptance trial by giving an agent only a
Portolan path, a target root, an output path, and the user's request: "map this
shit".

**Why this priority**: If the trial requires a target-specific runbook, it tests
the runbook, not Portolan.

**Independent Test**: Run the protocol with a fresh agent session. The prompt
contains no target-specific file list, no Bigtop-specific instructions, and no
manual directions to open `agent/AGENT_GUIDE.md`. The resulting transcript,
commands, artifacts, report, and gap ledger are recorded.

**Acceptance Scenarios**:

1. **Given** Portolan is available as a checkout or installed binary, **When**
   the evaluator starts a blind trial, **Then** the agent can discover the
   generic Portolan entrypoint or report a clear bootstrap blocker.
2. **Given** the target root is local, **When** the agent runs Portolan, **Then**
   it does not clone repositories, fetch upstream resources, mutate the target,
   or request credentials.
3. **Given** the agent produces a report, **When** the evaluator reviews it,
   **Then** every finding is backed by Portolan artifacts or marked as
   `unknown`, `cannot_verify`, or `not_assessed`.

### User Story 2 - Use Bigtop As A Corpus, Not A Custom Script (Priority: P1)

Apache Bigtop can be used as the first realistic target because it stresses
build, package, configuration, deploy, and smoke-test evidence. The protocol
must not give the agent Bigtop-specific instructions beyond the local target
path.

**Why this priority**: Portolan must learn from Bigtop without becoming tailored
to Bigtop.

**Independent Test**: Run the blind protocol against a local Apache Bigtop
checkout. The agent frames the target from local artifacts and Portolan output,
or records gaps, without being handed a Bigtop file map.

**Acceptance Scenarios**:

1. **Given** the Bigtop checkout contains build and package instructions,
   **When** the agent maps it, **Then** it treats those files as local evidence
   surfaces instead of assuming component source repositories are present.
2. **Given** Portolan cannot detect Bigtop package/config relationships yet,
   **When** the report is generated, **Then** the gap ledger records generic
   detector gaps rather than a Bigtop-only feature request.

### User Story 3 - Keep The Test Honest With A Non-Bigtop Control (Priority: P2)

The same blind acceptance protocol can run against at least one unrelated local
target so the team can see whether improvements generalize.

**Why this priority**: A single Bigtop trial can accidentally reward prompt
tuning or corpus-specific assumptions.

**Independent Test**: Run the same prompt shape against one non-Bigtop target
and compare whether the agent still discovers Portolan, runs the same workflow,
and produces artifact-backed output.

## Edge Cases

- The target checkout is absent locally.
- The target is a build/package/config repository, not a service source repo.
- The target has generated files, vendored dependencies, or nested repositories.
- The agent cannot execute shell commands.
- `portolan` is not on PATH but can be run from the source checkout.
- Existing run artifacts are stale.
- The evaluator accidentally provides target-specific hints.
- The agent reports plausible architecture facts that do not appear in Portolan
  artifacts.
- Cursor, Claude, Codex, OpenCode, or pi differ in how they load skills and
  execute commands.

## Requirements

### Functional Requirements

- **FR-001**: The protocol MUST define an allowed blind prompt containing only
  Portolan location, target root, output directory, local/no-mutation
  boundaries, and the mapping request.
- **FR-002**: The protocol MUST forbid target-specific runbooks, handpicked file
  lists, hidden Bigtop instructions, or manual directions to read a specific
  internal guide file.
- **FR-003**: The protocol MUST define required evidence artifacts: agent
  prompt, transcript or summary, commands attempted, Portolan run directory,
  report, gap ledger, and stop reason.
- **FR-004**: The protocol MUST classify each run as `passed`, `failed`,
  `degraded`, or `not_assessed`, with reasons.
- **FR-005**: The protocol MUST require artifact review: `run.json`,
  `summary.json`, `graph.json`, `findings.jsonl`, and `map.md` must be
  inspected before report claims are accepted.
- **FR-006**: The protocol MUST distinguish agent transcript claims from
  Portolan evidence.
- **FR-007**: The first target set MUST include Apache Bigtop and at least one
  non-Bigtop local target or fixture.
- **FR-008**: The Bigtop run MUST use a real local Bigtop checkout when
  available; if the checkout is absent, the run is blocked or `not_assessed`,
  not replaced by a special mock as proof.
- **FR-009**: The protocol MUST allow local fallback fixtures only as preflight
  checks for Portolan commands, not as evidence that the blind operator trial
  passed.
- **FR-010**: Product backlog changes after a run MUST be based on generic gaps
  proven by the run, not on Bigtop-specific tailoring.

### Key Entities

- **Blind Prompt**: The minimal target-agnostic instruction given to the agent.
- **Acceptance Run**: One execution of the protocol against one agent harness and
  one target root.
- **Run Evidence Bundle**: Transcript, commands, Portolan artifacts, report,
  gap ledger, status, and stop reason.
- **Control Target**: A non-Bigtop local target used to detect overfitting.
- **Gap Ledger**: The product backlog input produced by a run.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The protocol's allowed prompt contains no Bigtop-specific file
  names, package names, or build instructions.
- **SC-002**: A Bigtop run without a local Bigtop checkout is recorded as
  blocked or `not_assessed`, not passed via fixture substitution.
- **SC-003**: At least one blind run produces a complete evidence bundle or a
  clear degraded status with missing surfaces named.
  - Status 2026-05-26: verified as degraded for Cursor Agent on Bigtop.
- **SC-004**: A non-Bigtop control run uses the same prompt shape and records
  comparable evidence.
  - Status 2026-05-26: verified as degraded for Cursor Agent on
    `/home/fall_out_bug/projects/consensus_tg_bot`.
- **SC-005**: Backlog updates after blind runs cite generic gap IDs and do not
  introduce Bigtop-only product behavior.

## Assumptions

- This slice creates the acceptance protocol and evidence templates; it does not
  require cloning Apache Bigtop or running the first full trial inside the same
  implementation PR.
- The protocol may be executed manually in Cursor + Composer 2.5 first, but the
  artifacts must remain harness-independent.
- Local fixtures remain useful for command preflight, but they are not a
  substitute for the blind target run.
