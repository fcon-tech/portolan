# Feature Specification: Cursor Comparison Validation

**Feature Branch**: `034-cursor-comparison-validation`

**Created**: 2026-05-26

**Status**: Draft

**Input**: User description: "Prove or falsify the core product claim: if a
user already has Cursor, why do they need Portolan?"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compare Cursor Alone Against Cursor With Portolan (Priority: P1)

An evaluator runs Cursor alone and Cursor with Portolan on the same large local
software landscape, using the same stakeholder questions and the same scoring
rubric.

**Why this priority**: This is the core product question. Without this
comparison, Portolan cannot claim value over Cursor.

**Independent Test**: Run both lanes, score both outputs, and publish a
comparison ledger that shows whether Portolan improved the result.

**Acceptance Scenarios**:

1. **Given** the same local target and question set, **When** Cursor-alone and
   Cursor-plus-Portolan runs complete, **Then** both outputs are scored with the
   same rubric.
2. **Given** the scored outputs, **When** Portolan does not improve correctness,
   scope control, useful evidence, or next actions, **Then** the product claim
   is marked failed or inconclusive.
3. **Given** the scored outputs, **When** Portolan does improve the result,
   **Then** the accepted claim states exactly which user outcome improved.

### Edge Cases

- Both lanes fail or time out; the result is failed or inconclusive.
- Cursor-plus-Portolan is safer but not more useful; the result distinguishes
  evidence discipline from product value.
- The agent ignores Portolan artifacts; the run records this as a workflow or
  instruction failure.
- The target is too large for full-source reading; the comparison must evaluate
  bounded navigation rather than raw file loading.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The validation MUST use one fixed local target for both lanes.
- **FR-002**: The validation MUST use one fixed question set covering local
  scope, duplicate/component risk, implicit knowledge, service relationships,
  and next actions.
- **FR-003**: The validation MUST record prompts, outputs, constraints, and
  scoring notes for both lanes.
- **FR-004**: The validation MUST score both lanes for unsupported claims,
  correct scope, evidence use, unknown handling, and useful next actions.
- **FR-005**: The validation MUST classify the core product claim as accepted,
  narrowed, rejected, blocked, or inconclusive.
- **FR-006**: The validation MUST update the product hypothesis ledger with the
  comparison result.

### Key Entities

- **Comparison Target**: The local landscape used by both lanes.
- **Evaluation Lane**: Cursor-alone or Cursor-plus-Portolan run with prompt,
  output, constraints, and score.
- **Question Set**: The stakeholder questions shared by both lanes.
- **Comparison Ledger**: The record that compares lane outputs and product
  claim status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Both lanes complete or are recorded with exact failure reasons.
- **SC-002**: 100% of questions receive a score for both lanes.
- **SC-003**: Cursor-plus-Portolan reduces unsupported claims by at least 50%,
  or the value claim is not accepted.
- **SC-004**: Cursor-plus-Portolan produces equal or better useful next actions
  for at least 75% of questions, or the value claim is narrowed.
- **SC-005**: The final comparison ledger gives a clear go/no-go or narrowed
  claim for "Why Portolan if I have Cursor?"

## Assumptions

- The first comparison may use headless Cursor Agent if UI Cursor/Composer is
  unavailable, but UI status remains separate.
- Cursor-alone may inspect local files but receives no Portolan-generated
  context or map artifacts.
- Cursor-plus-Portolan receives Portolan artifacts before answering.
