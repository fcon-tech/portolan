# Feature Specification: Product Claim Gate

**Feature Branch**: `038-product-claim-gate`

**Created**: 2026-05-26

**Status**: Implemented and merged via PR #18; GitHub checks not_assessed

**Input**: User description: "Prevent the project from claiming product
readiness before validation proves what Portolan does better than Cursor."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gate Public Claims With Evidence (Priority: P1)

A product owner reviews proposed claims and can accept, narrow, reject, or mark
each claim unassessed based on validation evidence.

**Why this priority**: The project previously mixed implementation progress
with product proof.

**Independent Test**: Review the product claim ledger and verify that every
claim maps to evidence, failure, or an explicit unassessed state.

**Acceptance Scenarios**:

1. **Given** a proposed product claim, **When** no validation evidence supports
   it, **Then** the claim is rejected or marked unassessed.
2. **Given** validation supports only part of a claim, **When** the claim is
   reviewed, **Then** it is narrowed to the proven scope.
3. **Given** validation proves a user-visible improvement, **When** the claim is
   accepted, **Then** it cites the evidence and target class.

### User Story 2 - Produce A Client-Safe Answer (Priority: P1)

A consultant can answer "Why Portolan if we already have Cursor?" using only
validated claims and explicit limitations.

**Why this priority**: This is the client-facing form of product readiness.

**Independent Test**: Generate the answer from the claim ledger and verify that
each sentence is backed by accepted evidence or marked as unproven.

**Acceptance Scenarios**:

1. **Given** the claim ledger, **When** the client-safe answer is generated,
   **Then** it explains Portolan's validated job relative to Cursor.
2. **Given** a limitation remains unassessed, **When** the answer is reviewed,
   **Then** the limitation is visible and not hidden in positive phrasing.

### Edge Cases

- A claim is true for a fixture but not for a real target.
- A claim is true for headless Cursor but untested in UI Cursor/Composer.
- A claim improves safety but not adoption value.
- A claim depends on OSS output that was planned but not actually generated.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project MUST maintain a product claim ledger.
- **FR-002**: Every claim MUST have status accepted, narrowed, rejected,
  not_assessed, blocked, or failed.
- **FR-003**: Every accepted or narrowed claim MUST cite validation evidence.
- **FR-004**: Claims based only on implementation, tests, or internal artifacts
  MUST NOT be accepted as product-ready.
- **FR-005**: The client-safe answer MUST be generated only from accepted or
  narrowed claims plus explicit limitations.
- **FR-006**: The backlog MUST be updated when claims are rejected, narrowed, or
  blocked by missing validation.

### Key Entities

- **Product Claim**: A statement about user value, readiness, adoption reason,
  or comparison with Cursor.
- **Claim Status**: The evidence-backed decision for a product claim.
- **Client-Safe Answer**: The external explanation of Portolan's value and
  limitations.
- **Evidence Link**: The validation record that supports or rejects a claim.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of current product claims are listed in the claim ledger.
- **SC-002**: 100% of accepted or narrowed claims cite validation evidence.
- **SC-003**: 0 public-ready claims depend only on implementation completion.
- **SC-004**: The final answer to "Why Portolan if I have Cursor?" contains
  only accepted or narrowed claims and explicit limitations.
- **SC-005**: Any claim without evidence is marked not_assessed, blocked,
  failed, or rejected.

## Assumptions

- Product claims can be narrowed without invalidating engineering work.
- The correct outcome may be a no-go or a much smaller product claim.
- Client-safe language must preserve uncertainty rather than hide it.

## Validation Result

Local implementation on 2026-05-27 produced a product claim ledger and
client-safe answer under `specs/038-product-claim-gate/reviews/`.

The current accepted/narrowed product claim is intentionally bounded:

- accepted: local context/map capability as a capability claim;
- narrowed: headless Cursor comparison on fixed local Bigtop, Syft/CycloneDX
  component identity evidence, exact duplicate clusters, and relationship
  claims only when evidence type is named;
- rejected: complete inherited-estate and replacement/readiness claims;
- not_assessed: UI Cursor/Composer behavior and runtime service topology.

Local verification passed and three assessed independent non-GPT review lanes
were dispositioned. PR #18 was merged on 2026-05-27. GitHub checks were
`not_assessed` because no checks were reported.
