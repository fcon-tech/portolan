# Feature Specification: Runtime Security Boundary

**Feature Branch**: `044-runtime-security-boundary`

**Created**: 2026-05-27

**Status**: Ready-for-review PR #20; runtime/security smoke and GitHub CI verified; merge approval not_assessed

**Input**: Product-readiness gap: runtime topology remains `not_assessed`, and external product use needs a clear untrusted-artifact security boundary before adding richer agent/query surfaces.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Supply Runtime Observations Safely (Priority: P1)

A user can provide local runtime observation files and Portolan can represent supported observations without claiming complete topology.

**Why this priority**: Black-box and runtime-visible evidence are part of the product boundary, but current runtime topology claims remain unassessed without a clearer input contract.

**Independent Test**: Validate a sample runtime observation file and inspect output states.

**Acceptance Scenarios**:

1. **Given** a valid local runtime observation file, **When** Portolan maps it, **Then** supported relationships are `runtime-visible` with source attribution.
2. **Given** runtime evidence is partial, **When** Portolan reports topology, **Then** completeness remains `unknown` or `not_assessed`.

---

### User Story 2 - Protect Against Untrusted Artifact Input (Priority: P1)

A maintainer can identify and test prompt-injection, path traversal, secret leakage, and unsafe output risks for Portolan artifacts.

**Why this priority**: Portolan reads codebase artifacts meant for agents; untrusted local files can influence agent answers.

**Independent Test**: Inspect threat model and run focused tests for path/output and secret-value handling.

**Acceptance Scenarios**:

1. **Given** an input artifact contains prompt-like instructions, **When** Portolan emits agent-facing output, **Then** it treats the text as evidence content, not operational instruction.
2. **Given** an input contains secret-like values, **When** Portolan reports configuration surfaces, **Then** secret values are not exposed.

---

### User Story 3 - Keep Product Claims In Sync (Priority: P2)

A product owner can update runtime/security claims only after runtime input and threat-model evidence exists.

**Why this priority**: Product copy must not imply runtime topology or safety hardening beyond tested scope.

**Independent Test**: Compare `docs/product-claims.md`, runtime contract docs, and verification evidence.

**Acceptance Scenarios**:

1. **Given** runtime input is documented but not executed on a target, **When** claims are reviewed, **Then** runtime topology remains `not_assessed`.
2. **Given** security tests cover only selected risks, **When** claims are updated, **Then** the claim names those risks and does not say "secure" broadly.

### Edge Cases

- Runtime files are malformed or from an unsupported schema.
- Runtime observations refer to services not visible in local source.
- Runtime files contain credentials or tokens.
- Agent-facing Markdown includes malicious instructions from target files.
- Symlinks or paths escape the selected output directory.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The feature MUST define a runtime observation input contract with supported and unsupported fields.
- **FR-002**: Runtime-derived facts MUST be marked `runtime-visible` only when the supplied local observation supports them.
- **FR-003**: Partial runtime observations MUST NOT be described as complete topology.
- **FR-004**: The feature MUST add a threat model for untrusted repo artifacts and agent-facing outputs.
- **FR-005**: The feature MUST verify secret values are not emitted in agent-facing config outputs.
- **FR-006**: The feature MUST verify path/output boundaries for runtime and security-related inputs.
- **FR-007**: Product claims MUST remain narrow and evidence-backed.

### Key Entities

- **Runtime Observation**: Local file describing observed communications or services.
- **Runtime Relationship**: Graph relationship supported by runtime observation.
- **Threat Record**: Risk, affected surface, mitigation, test evidence, and residual state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A sample runtime observation contract is documented and validated or explicitly blocked.
- **SC-002**: Runtime topology completeness remains `unknown` or `not_assessed` unless complete evidence is supplied.
- **SC-003**: Threat model covers prompt injection, path traversal, secret leakage, and future MCP/query exposure.
- **SC-004**: Focused verification demonstrates no secret values are emitted for supported config-surface paths.

## Assumptions

- This slice may document and validate a runtime input contract before broad runtime import behavior.
- The initial security boundary is product-specific, not a generic security certification.
