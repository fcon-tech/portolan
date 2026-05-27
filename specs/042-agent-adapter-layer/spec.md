# Feature Specification: Agent Adapter Layer

**Feature Branch**: `042-agent-adapter-layer`

**Created**: 2026-05-27

**Status**: Ready-for-review PR #20; adapter-contract validation and GitHub CI verified; full OSS imports remain not_assessed

**Input**: Product direction: Portolan should avoid Not Invented Here and normalize outputs from tools such as Graphify, SCIP/Serena-style symbol indexes, and Repomix instead of rebuilding them.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Evaluate First-Wave OSS Inputs (Priority: P1)

A maintainer can see which first-wave OSS tools are accepted, narrowed, rejected, or not assessed for Portolan input.

**Why this priority**: Adapter work must include license, maintenance, privacy, local execution, and integration-cost review before dependencies are added.

**Independent Test**: Inspect the evaluation ledger and confirm each candidate has a state and reason.

**Acceptance Scenarios**:

1. **Given** Graphify output is proposed, **When** it is evaluated, **Then** inference confidence is mapped without upgrading it to observed evidence.
2. **Given** an adapter candidate needs network or credentials, **When** it is evaluated, **Then** it is rejected, blocked, or explicitly profile-gated.

---

### User Story 2 - Normalize A Graphify-Like Output (Priority: P1)

An agent can provide a local Graphify-style graph file and Portolan can validate or normalize the supported subset as metadata-visible evidence.

**Why this priority**: Graphify is the strongest near-term code-graph producer and competitor/reference; importing its output tests the adapter layer thesis.

**Independent Test**: Run `portolan adapter validate --in <fixture>` on a Graphify fixture and verify confidence-state mapping is preserved.

**Acceptance Scenarios**:

1. **Given** a local Graphify fixture with extracted facts, **When** the adapter validates it, **Then** supported facts become metadata-visible with provenance.
2. **Given** a fixture contains inferred or ambiguous facts, **When** the adapter validates it, **Then** those facts become `claim-only` or `cannot_verify` rather than `source-visible`.

---

### User Story 3 - Publish Adapter Profiles For Symbol And Context Tools (Priority: P2)

An agent can understand how SCIP/Serena-like symbol data and Repomix context packs should enter Portolan without new native scanners.

**Why this priority**: The next product leap is adapter interoperability, not rewriting code intelligence.

**Independent Test**: Inspect adapter profile docs and fixtures for supported/unsupported fields and local-first constraints.

**Acceptance Scenarios**:

1. **Given** a SCIP or symbol-index export is available, **When** the profile is read, **Then** supported symbol identity fields and unsupported semantic claims are clear.
2. **Given** a Repomix pack is available, **When** the profile is read, **Then** file inventory/token context is treated as context evidence, not architecture truth.

### Edge Cases

- Graphify schema changes.
- A producer includes LLM-derived inferred nodes.
- A path in producer output points outside the selected target.
- A context pack includes private source snippets.
- A producer output is too large for bounded context preparation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The feature MUST record an OSS candidate evaluation ledger for Graphify, SCIP/Serena-style symbol indexes, and Repomix.
- **FR-002**: The feature MUST define a supported Graphify adapter subset before accepting any import behavior.
- **FR-003**: Graphify `EXTRACTED`-style confidence MUST NOT be treated as `source-visible` unless Portolan inspected the source directly.
- **FR-004**: Inferred or ambiguous producer facts MUST remain `claim-only`, `cannot_verify`, or `not_assessed`.
- **FR-005**: Adapter fixtures MUST avoid committed private source snippets, credentials, and provider URLs.
- **FR-006**: The feature MUST prefer file import/validation over invoking external tools.
- **FR-007**: The feature MUST update `docs/oss-composition.md` and product claims only to the proven scope.

### Key Entities

- **Adapter Candidate**: OSS tool considered for normalized input.
- **Producer Fact**: One imported node, edge, symbol, file, or context record.
- **Adapter Profile**: Supported fields, evidence-state mapping, and privacy constraints.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Each first-wave candidate has an evaluation state and reason.
- **SC-002**: At least one Graphify fixture validates through the existing adapter contract or a documented extension.
- **SC-003**: Zero inferred or ambiguous producer facts are upgraded to observed evidence.
- **SC-004**: Product docs describe Portolan as an adapter layer, not a replacement for Graphify, Git Nexus, Serena, Repomix, or code intelligence tools.

## Assumptions

- First implementation may be validation/profile-only if full import would require a broader schema change.
- Network-backed producer execution remains out of scope.
