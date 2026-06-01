# Feature Specification: Bigtop Architecture Understanding

**Feature Branch**: `codex/054-bigtop-architecture-proof`

**Created**: 2026-06-01

**Status**: Draft; depends on specs 054 and 055 before any verified architecture
understanding claim

**Input**: User description: "Verify that Portolan understands Apache Bigtop
architecture like a human or enterprise code intelligence, necessarily in
combination with Cursor."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Define Architecture Questions And Rubric (Priority: P1)

A maintainer can evaluate Portolan + Cursor on concrete Bigtop architecture
questions using a rubric that separates correct evidence-backed answers from
unknowns and overclaims.

**Why this priority**: "Understands architecture" is too broad unless reduced
to answerable questions and evidence criteria.

**Independent Test**: Create a fixed question set and rubric covering component
roles, build/dependency structure, service/catalog relationships, ownership or
module boundaries, runtime topology, duplication/technical debt, and unknowns.

**Acceptance Scenarios**:

1. **Given** a Bigtop architecture question set, **When** it is reviewed,
   **Then** each question has required evidence families and an explicit pass,
   partial, fail, or `not_assessed` rubric.
2. **Given** a question requires unavailable runtime or symbol evidence,
   **When** the rubric is applied, **Then** it cannot pass on static inventory
   evidence alone.

---

### User Story 2 - Compare Cursor Alone And Cursor Plus Portolan (Priority: P2)

A reviewer can compare Cursor-only and Cursor-plus-Portolan answers on the same
Bigtop questions and see where Portolan improves correctness, coverage,
evidence discipline, or next-action quality.

**Why this priority**: The product proof is Cursor augmentation, not a standalone
report generator.

**Independent Test**: Run Cursor + Composer 2.5 with and without fresh Portolan
artifacts on the same question set, then score both with the rubric.

**Acceptance Scenarios**:

1. **Given** identical questions, **When** Cursor answers with and without
   Portolan context, **Then** the comparison records evidence quality,
   correctness, overclaims, unknown handling, and useful next actions.
2. **Given** Portolan does not improve an answer, **When** the comparison is
   recorded, **Then** the gap is preserved as failed or `not_assessed`, not
   hidden.

---

### User Story 3 - Accept Or Reject Architecture Understanding Claims (Priority: P3)

The project can decide which architecture-understanding claims are verified,
partial, failed, blocked, or still `not_assessed`.

**Why this priority**: A broad claim that Portolan understands Bigtop must be
earned claim by claim, not declared from a successful map run.

**Independent Test**: Produce an acceptance ledger that maps each question to
evidence, Cursor answer, reviewer verdict, and claim status.

**Acceptance Scenarios**:

1. **Given** answers cite local producer evidence and pass rubric checks,
   **When** the acceptance ledger is updated, **Then** those claims may be
   marked verified for the scoped question.
2. **Given** answers rely on unsupported inference, **When** the ledger is
   updated, **Then** claims are narrowed, failed, or `not_assessed`.

### Edge Cases

- Cursor gives a plausible answer with no local evidence.
- Portolan artifacts are too large and cause context truncation.
- The rubric expects evidence not supplied by specs 054 or 055.
- Human reviewer and Cursor disagree about a Bigtop component boundary.
- Bigtop architecture has ambiguous historical or packaging-driven structure.
- Runtime topology is unavailable or unsafe to collect.
- A verified answer for one subsystem is generalized to all Bigtop.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The feature MUST define a fixed Bigtop architecture question set
  before running acceptance stress.
- **FR-002**: Each question MUST name required evidence families and pass/fail
  criteria.
- **FR-003**: The comparison MUST include Cursor-only and Cursor-plus-Portolan
  lanes using the same questions.
- **FR-004**: Cursor-plus-Portolan answers MUST cite local Portolan artifacts
  for verified claims.
- **FR-005**: Unsupported answers MUST be marked failed, partial, blocked, or
  `not_assessed`; they MUST NOT be rounded into verified product proof.
- **FR-006**: The acceptance ledger MUST separate dependency/component,
  symbol/reference, API/catalog/model, runtime, duplication, technical debt,
  and unknown evidence.
- **FR-007**: The final claim wording MUST distinguish scoped architecture
  understanding from complete enterprise code-intelligence parity.

### Key Entities

- **Architecture Question**: A fixed Bigtop question with required evidence
  families and expected evaluation criteria.
- **Answer Lane**: A Cursor-only or Cursor-plus-Portolan response to the same
  question.
- **Acceptance Ledger**: A durable record of question, evidence, answer,
  reviewer verdict, and claim status.
- **Claim Status**: verified, partial, failed, blocked, `unknown`,
  `cannot_verify`, or `not_assessed`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least eight Bigtop architecture questions are scored with the
  rubric.
- **SC-002**: Cursor-plus-Portolan improves evidence discipline or correctness
  over Cursor-only on at least five questions, or failures are recorded.
- **SC-003**: Zero runtime topology questions pass without runtime-visible
  evidence.
- **SC-004**: The final acceptance ledger states exactly which architecture
  claims are verified and which remain partial, failed, blocked, or
  `not_assessed`.
- **SC-005**: Any public or product claim is updated only to the verified scope.

## Assumptions

- Specs 054 and 055 provide the producer/runtime evidence inputs for this
  acceptance spec.
- Cursor + Composer 2.5 is the mandatory first evaluation lane.
- Human or enterprise-code-intelligence comparison means a rubric-based
  evaluator, not a vague subjective impression.
- Full parity with enterprise code intelligence may remain unproven; scoped
  verified claims are acceptable if the ledger is honest.
