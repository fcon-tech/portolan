# Feature Specification: Clean Start Artifact Guard

**Feature Branch**: `codex/080-clean-start-artifact-guard`

**Created**: 2026-06-02

**Status**: Ready-for-review PR #58; post-Cursor local baseline, fresh Bigtop
context smoke, final Cursor Composer 2.5 clean-start stress, and three final
non-GPT review lanes verified; merge approval `not_assessed`

**Input**: The Bigtop stress report showed a contaminated no-Portolan lane that
read legacy `run/map.md`, and the active objective requires clean starts between
Cursor Composer 2.5 stress runs. Portolan should make the current artifact
boundary explicit for agents without deleting target files or turning Portolan
into a harness.

## User Scenarios & Testing

### User Story 1 - Current Context Boundary (Priority: P1)

As an agent using a Portolan context pack, I can see which context directory is
current and which nearby generated artifacts are stale unless explicitly named,
so my navigation answer does not mix old stress evidence with the current run.

**Why this priority**: The stress report's agent drift was caused by artifact
contamination, not missing source access. Preventing stale evidence reads is a
direct navigation-harness quality improvement.

**Independent Test**: Run `context prepare` into a fresh `.portolan/stress`
directory and inspect generated `agent-brief.md`, `answer-contract.md`, and
`query-plan.md` for current-output and stale-artifact guardrails.

**Acceptance Scenarios**:

1. **Given** a target root with previous `.portolan/stress/*` outputs, **When**
   `context prepare` writes a fresh context pack, **Then** the generated brief
   names the current context output and tells the agent not to use sibling
   stress roots unless the user explicitly named them.
2. **Given** a no-Portolan baseline lane, **When** the acceptance guide is read,
   **Then** `.portolan/`, root-level `run/`, and generated Portolan artifacts
   are listed as forbidden baseline inputs.

### User Story 2 - Honest Contamination Handling (Priority: P2)

As a reviewer of stress evidence, I can classify a lane as contaminated if it
read forbidden artifacts, so invalid baselines do not count as product evidence.

**Why this priority**: The clean-start rule needs an evidence disposition, not
just a prompt hint.

**Independent Test**: Inspect the acceptance guide and generated answer
contract; both must state that forbidden artifact reads make the lane
contaminated and non-counting.

**Acceptance Scenarios**:

1. **Given** a baseline lane that reads `.portolan/` or `run/`, **When** the
   lane is reviewed, **Then** the lane is marked contaminated and does not count
   as valid comparison evidence.

### Edge Cases

- Existing `.portolan/stress/*` outputs may be valuable prior evidence, but they
  must be explicitly named by the user or run ledger before an agent may rely on
  them.
- Portolan must not delete or move target files as part of this feature.
- A root-level `reports/` directory may contain user-owned evidence; agents may
  inspect it only when it is named as an allowed input.

## Requirements

### Functional Requirements

- **FR-001**: Generated `agent-brief.md` MUST name the current context output
  path and state that sibling `.portolan/stress/*`, root-level `run/`, and
  unrelated `reports/` outputs are stale or forbidden unless explicitly named.
- **FR-002**: Generated `answer-contract.md` MUST include a fresh artifact
  boundary that separates current Portolan evidence from prior stress outputs.
- **FR-003**: Generated `query-plan.md` MUST instruct agents to confirm the
  current context boundary before answering.
- **FR-004**: The agent acceptance guide MUST define clean-start rules for
  no-Portolan baseline lanes and with-Portolan lanes.
- **FR-005**: The acceptance guide MUST state that a lane that reads forbidden
  artifacts is contaminated and must not count as valid comparison evidence.
- **FR-006**: This feature MUST NOT introduce target deletion, network access,
  daemon behavior, or new dependencies.
- **FR-007**: In a fresh stress context, producer-run records whose verified
  output paths point to a sibling `.portolan/stress/*` run MUST NOT be promoted
  as current verified evidence; the generated evidence record MUST be
  `not_assessed` and MUST NOT expose the stale output path or stale command.

### Key Entities

- **Current Context Output**: The context pack directory generated for the
  current run.
- **Stale Artifact Root**: A prior `.portolan/stress/*`, root-level `run/`, or
  unrelated generated output not explicitly allowed for the current lane.
- **Contaminated Lane**: A stress lane that read forbidden artifacts.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Focused contextprep tests verify that generated context guidance
  includes the current output path and stale-artifact exclusions.
- **SC-002**: A fresh Bigtop context smoke shows the guardrails in generated
  artifacts without deleting existing stress evidence.
- **SC-003**: Local baseline checks pass and no evidence state is upgraded.
- **SC-004**: PR closeout separates ready-for-review from ready-to-merge state.
- **SC-005**: Cursor Composer 2.5 clean-start stress confirms that stale
  producer-run outputs are downgraded or scrubbed and that forbidden artifacts
  were not read.

## Assumptions

- Agents can follow explicit artifact-boundary instructions when the context
  pack and acceptance guide make them visible.
- This slice improves stress hygiene; it does not approve the blocked spec 074
  runtime-health run.
