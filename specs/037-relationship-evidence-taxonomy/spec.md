# Feature Specification: Relationship Evidence Taxonomy

**Feature Branch**: `037-relationship-evidence-taxonomy`

**Created**: 2026-05-26

**Status**: Ready-for-review PR #17; merge approval not_assessed

**Input**: User description: "The project needs a clear product-level taxonomy
for relationships so phrases like runtime service topology are understandable
and not confused with static or declared relationships."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explain Relationship Claims By Evidence Type (Priority: P1)

A CTO or evaluator can distinguish source-visible dependencies,
metadata-declared service relationships, runtime-observed communication, and
human claims.

**Why this priority**: Relationship claims are central to understanding large
systems, and vague labels create false confidence.

**Independent Test**: Review a relationship report and verify that every
relationship claim is labeled by evidence type and forbidden from implying a
stronger type.

**Acceptance Scenarios**:

1. **Given** a source dependency, **When** it is reported, **Then** it is not
   described as runtime communication.
2. **Given** a service catalog or API description, **When** it is reported,
   **Then** it is treated as declared or metadata evidence, not runtime proof.
3. **Given** runtime observations are absent, **When** a service topology
   question is answered, **Then** runtime topology remains `not_assessed`.

### Edge Cases

- A relationship appears in multiple evidence types with different strength.
- A human-maintained architecture file is stale.
- Runtime evidence exists for only part of the estate.
- Generated clients imply possible coupling but not actual production traffic.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The taxonomy MUST define source-visible, metadata-visible,
  runtime-visible, claim-only, unknown, cannot_verify, and not_assessed
  relationship meanings in plain language.
- **FR-002**: The taxonomy MUST distinguish dependency relationships, declared
  service/API relationships, runtime communication, ownership, and lifecycle
  relationships.
- **FR-003**: Reports MUST not upgrade a weaker evidence type to a stronger one
  without explicit evidence.
- **FR-004**: Reports MUST state when runtime service topology is unassessed
  because no local runtime observations were supplied.
- **FR-005**: The taxonomy MUST define which stakeholder questions each
  relationship type can and cannot answer.
- **FR-006**: Product claims about "service relationships" MUST name the
  evidence type they rely on.

### Key Entities

- **Relationship Claim**: A statement that one system, service, repository, or
  component is connected to another.
- **Evidence Type**: The strength and source of the relationship claim.
- **Runtime Observation**: Local evidence that shows communication actually
  happened during execution.
- **Declared Relationship**: Metadata or documentation stating intended
  architecture or API boundaries.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of relationship claims in validation reports include an
  evidence type.
- **SC-002**: 0 relationship claims describe runtime communication unless
  runtime evidence is present.
- **SC-003**: The validation report includes a plain-language explanation of
  what is known, what is declared, what is observed at runtime, and what is
  unassessed.
- **SC-004**: A reviewer can determine from the report whether service/API
  relationship claims are source, metadata, runtime, claim-only, or unknown.

## Assumptions

- Runtime evidence is optional and may be absent in the first validation cycle.
- Declared architecture is useful but must not be treated as production
  behavior.
- Static dependencies can guide investigation but do not prove service calls.
