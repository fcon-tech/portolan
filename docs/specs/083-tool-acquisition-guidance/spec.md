# Feature Specification: Tool Acquisition Guidance

**Feature Branch**: `codex/083-tool-acquisition-guidance`

**Created**: 2026-06-02

**Status**: Merged via PR #61; local baseline, fresh Bigtop context smoke,
Cursor Composer 2.5 stress, integrated PR #57-#61 stack-agnostic stress, three
assessed non-GPT review lanes, GitHub checks, explicit user merge approval,
squash merge `847e84e`, post-merge Bigtop context smoke, and remote branch
cleanup verified; GitHub review approval remains `not_assessed`

**Input**: Integrated Cursor Composer 2.5 stress for PR #57-#60 judged the
context adequate as a pre-UX navigation harness, but the follow-up discussion
clarified the product boundary: Portolan must stay stack-agnostic while still
helping the operator pull in the right local producer tools.

## User Scenarios & Testing

### User Story 1 - Stack-Agnostic Tool Acquisition (Priority: P1)

An agent reading a context pack sees missing evidence families, candidate local
producer tools, availability, approval/risk boundaries, and next actions
without interpreting them as Portolan-owned language adapters.

**Independent Test**: A fixture with Maven/Gradle manifests and local tools
shows `oss-plan.json` acquisition guidance for native producer candidates while
the answer contract says candidate tools are not Portolan adapters.

### User Story 2 - Evidence Honesty (Priority: P1)

An agent can recommend installing or running a local tool only as a way to
produce future local evidence; it must keep the evidence family `not_assessed`
until output exists and is re-ingested.

**Independent Test**: Context guidance includes `not_assessed` boundaries for
candidate tools and explicitly requires context refresh after approved output.

## Requirements

- **FR-001**: `oss-plan.json` MUST describe producer candidates as tool
  acquisition guidance, not stack-specific Portolan adapters.
- **FR-002**: Candidate tools MUST expose availability and a next acquisition
  action such as run approved local command, install/evaluate locally, or supply
  local output.
- **FR-003**: Candidate tools MUST expose risk boundaries for network, target
  mutation, cache writes, and approval where relevant.
- **FR-004**: Guidance MUST preserve `not_assessed` evidence state until local
  output exists and `context prepare --force` re-ingests it.
- **FR-005**: Answer guidance MUST explicitly reject defaulting to
  Portolan-owned PHP/JVM/Scala/Gradle adapters for language coverage gaps.

## Success Criteria

- **SC-001**: Focused contextprep tests verify acquisition guidance in
  `oss-plan.json`, `answer-contract.md`, and `query-plan.md`.
- **SC-002**: Fresh Bigtop context shows tool acquisition guidance without
  running native producers.
- **SC-003**: Cursor Composer 2.5 confirms the context remains stack-agnostic
  while still surfacing useful local tools to pull in.
- **SC-004**: Baseline checks pass.
