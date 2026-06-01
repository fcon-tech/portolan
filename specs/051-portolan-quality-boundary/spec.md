# Feature Specification: Portolan Quality Boundary

**Feature Branch**: `codex/051-portolan-quality-boundary`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Split the Portolan work into two specs: first,
quality of Portolan itself; second, quality of the user experience."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Know What Portolan Can Be Trusted For (Priority: P1)

A CTO, architect, or agent can read one maintained quality boundary and
understand which Portolan outputs are stable product surfaces, which are
experimental, what evidence states mean, and which claims must remain out of
scope.

**Why this priority**: A better first-report UX is dangerous if the product
quality boundary is weak. Portolan must prevent overclaiming before it optimizes
presentation.

**Independent Test**: Review the quality boundary and confirm every user-facing
surface has a maturity label, supported claim set, limitation set, and
verification path.

**Acceptance Scenarios**:

1. **Given** a user asks whether Portolan can assess architecture,
   duplication, technical debt, runtime topology, or security, **When** an
   agent consults the quality boundary, **Then** it can answer with exact
   supported, limited, and `not_assessed` areas.
2. **Given** a product doc or report makes a positive Portolan claim, **When**
   the claim is checked against the quality boundary, **Then** the claim is
   accepted, narrowed, rejected, or marked `not_assessed`.

---

### User Story 2 - Gate Report Quality Before UX Polish (Priority: P2)

A maintainer can verify that generated Portolan reports are accurate,
evidence-backed, and gap-aware before measuring whether they feel good to use.

**Why this priority**: The customer feedback exposed a UX failure, but the fix
must not convert thin evidence into a polished hallucination.

**Independent Test**: Run a report-quality gate against generated artifacts and
verify it fails on missing required sections, unsupported positive claims,
hidden weak evidence states, or missing evidence references.

**Acceptance Scenarios**:

1. **Given** a report states a positive finding, **When** the quality gate runs,
   **Then** the finding must include a local evidence reference.
2. **Given** Portolan evidence contains `unknown`, `cannot_verify`, or
   `not_assessed`, **When** the quality gate runs, **Then** those states must be
   visible in the report or machine summary.

---

### User Story 3 - Keep Product Maturity Honest (Priority: P3)

A maintainer can publish or update Portolan docs without mixing stable
first-run surfaces, tooling, local-only experiments, and future ideas.

**Why this priority**: Portolan has accumulated many useful surfaces. Without a
maturity map, docs and agent instructions can accidentally present all of them
as equally product-ready.

**Independent Test**: Inspect the maintained maturity matrix and verify it
separates stable, tooling, local-only, experimental, and future surfaces.

**Acceptance Scenarios**:

1. **Given** a surface appears in README, agent docs, or report output, **When**
   a reviewer checks the maturity matrix, **Then** the surface has a maturity
   label and product boundary.
2. **Given** a new surface such as MCP, LSP, or harness-specific adapters is
   discussed, **When** it is not implemented and verified, **Then** it remains
   future or experimental instead of a stable promise.

### Edge Cases

- A CLI command is implemented but not suitable for first-run users.
- A report is honest but too thin; it must pass quality only if thinness is
  explicit.
- Optional OSS producer output is absent.
- A harness adapter exists but runtime behavior is not verified.
- A public demo passes on one target but does not generalize.
- A product claim is true for exact duplication but false for near-clone or
  component duplication.
- A relationship is source-visible or metadata-visible but not runtime-visible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Portolan MUST maintain a product quality boundary document that
  states what Portolan guarantees, does not guarantee, and requires from users
  or agents.
- **FR-002**: The quality boundary MUST include canonical wording for local
  read-only behavior, evidence-labeled findings, explicit gaps, and unsupported
  claims.
- **FR-003**: The quality boundary MUST explicitly reject claims that Portolan
  proves complete architecture, complete runtime topology, security posture,
  modernization readiness, or codebase health certification unless separate
  evidence exists.
- **FR-004**: Portolan MUST maintain a maturity matrix for user-facing surfaces
  using at least these classes: stable first-run, tooling, local-only,
  experimental, and future.
- **FR-005**: The maturity matrix MUST distinguish static adapter parity from
  runtime harness readiness.
- **FR-006**: Portolan MUST define a report-quality contract that can validate
  generated report artifacts for required sections, evidence references, weak
  evidence states, and unsupported positive claims.
- **FR-007**: Positive report claims MUST be traceable to local Portolan
  artifacts, imported local tool outputs, or explicitly supplied local evidence.
- **FR-008**: Missing evidence MUST remain visible as `unknown`,
  `cannot_verify`, or `not_assessed`; quality checks MUST fail if weak states
  are hidden.
- **FR-009**: The report-quality contract MUST support an unsupported-claim
  budget of zero for acceptance lanes unless a spec explicitly narrows the
  lane.
- **FR-010**: The quality boundary MUST be referenced by later UX/report specs
  before they claim a report is product-ready.
- **FR-011**: The quality boundary MUST avoid adding network access, daemons,
  credentials, mutation, or target-repository writes.
- **FR-012**: The quality boundary MUST identify which checks are verified,
  failed, blocked, not assessed, or assumed.

### Key Entities

- **Quality Boundary**: Canonical document of guarantees, limitations, customer
  controls, evidence states, and rejected claims.
- **Maturity Matrix**: Classification of Portolan surfaces by readiness and
  release role.
- **Surface**: CLI command, artifact, adapter, documentation route, report
  section, or optional producer integration exposed to users or agents.
- **Report Quality Contract**: Machine-checkable expectations for generated
  reports.
- **Claim Verdict**: Accepted, narrowed, rejected, blocked, or `not_assessed`
  classification of a product/report claim.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every current user-facing Portolan surface has a maturity class
  and one-line product boundary.
- **SC-002**: A reviewer can classify any report claim as accepted, narrowed,
  rejected, blocked, or `not_assessed` using the quality boundary.
- **SC-003**: Report-quality validation fails on a fixture with an unsupported
  positive claim.
- **SC-004**: Report-quality validation fails on a fixture that hides
  `unknown`, `cannot_verify`, or `not_assessed` evidence present in the source
  bundle.
- **SC-005**: Later UX/report specs can cite this quality boundary instead of
  restating product guarantees.

## Assumptions

- This spec is about product quality, trust, maturity, and report correctness;
  it is not about making the first-run interaction pleasant.
- The UX/report workflow spec depends on this quality boundary.
- Existing Portolan evidence states remain authoritative.
- The first implementation may be docs plus validation fixtures before a full
  CLI quality-gate command is added.
