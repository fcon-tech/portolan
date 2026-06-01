# Feature Specification: Cursor Comparison Validation

**Feature Branch**: `034-cursor-comparison-validation`

**Created**: 2026-05-26

**Status**: Implemented

**Input**: User description: "Prove or falsify the core product claim: if a
user already has Cursor, why do they need Portolan?"

## Clarifications

### Session 2026-05-26

- Q: What fixed comparison target should spec 034 require for both Cursor-alone and Cursor-plus-Portolan lanes? → A: `/home/fall_out_bug/projects/bigtop-landscape`
- Q: What should be the fixed question set for comparing Cursor-alone vs Cursor-plus-Portolan? → A: Five fixed CTO questions covering scope/completeness, duplicate/component risk, implicit knowledge, service relationships, and next actions.
- Q: What rule should classify the final product claim after scoring? → A: Accept only if unsupported claims drop by >=50% and next actions are equal or better on >=75% of questions; narrow if only one passes; reject if neither passes; block if a lane cannot run.
- Q: What should the Cursor-plus-Portolan lane receive before answering? → A: The context pack plus bounded map artifacts: `summary.json`, `graph-index.json`, and slices only when needed.
- Q: What evidence must the comparison ledger retain for auditability? → A: Prompts, raw outputs, artifact paths/checksums, per-question scores, unsupported-claim counts, unknown/not_assessed notes, and final decision rationale.

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
   is marked narrowed, rejected, blocked, or inconclusive according to the
   explicit scoring rule.
3. **Given** the scored outputs, **When** Portolan does improve the result,
   **Then** the accepted claim states exactly which user outcome improved.

### Edge Cases

- Both lanes fail or time out; the result is blocked or inconclusive.
- Cursor-plus-Portolan is safer but not more useful; the result distinguishes
  evidence discipline from product value.
- The agent ignores Portolan artifacts; the run records this as a workflow or
  instruction failure.
- The target is too large for full-source reading; the comparison must evaluate
  bounded navigation rather than raw file loading.
- Cursor-plus-Portolan loads the full `graph.json` before bounded artifacts;
  the run records this as a workflow failure for agent usability.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The validation MUST use one fixed local target for both lanes.
- **FR-007**: The fixed comparison target MUST be
  `/home/fall_out_bug/projects/bigtop-landscape`; results MUST distinguish
  local checkout scope from complete Apache Bigtop ecosystem coverage.
- **FR-002**: The validation MUST use five fixed CTO questions covering local
  scope and completeness, duplicate or component risk, implicit knowledge,
  service relationships, and next actions.
- **FR-003**: The validation MUST record prompts, outputs, constraints, and
  scoring notes for both lanes.
- **FR-004**: The validation MUST score both lanes for unsupported claims,
  correct scope, evidence use, unknown handling, and useful next actions.
- **FR-005**: The validation MUST classify the core product claim as accepted,
  narrowed, rejected, blocked, or inconclusive.
- **FR-006**: The validation MUST update the product hypothesis ledger with the
  comparison result.
- **FR-008**: The validation MUST classify the claim as accepted only when
  Cursor-plus-Portolan reduces unsupported claims by at least 50% and produces
  equal or better useful next actions for at least 75% of questions; narrowed
  when exactly one threshold passes; rejected when neither threshold passes;
  and blocked when either lane cannot run.
- **FR-009**: The Cursor-plus-Portolan lane MUST receive the generated context
  pack plus bounded map artifacts, including `summary.json`,
  `graph-index.json`, and targeted graph slices only when needed; the lane MUST
  NOT be seeded with a human-curated brief or require first-pass loading of the
  full `graph.json`.
- **FR-010**: The comparison ledger MUST retain prompts, raw outputs, artifact
  paths or checksums, per-question scores, unsupported-claim counts,
  `unknown` and `not_assessed` notes, and the final decision rationale.

### Key Entities

- **Comparison Target**: The local landscape used by both lanes.
- **Evaluation Lane**: Cursor-alone or Cursor-plus-Portolan run with prompt,
  output, constraints, score, and recorded input artifacts. The
  Cursor-plus-Portolan lane starts from the context pack, `summary.json`,
  `graph-index.json`, and targeted slices only when needed.
- **Question Set**: The five stakeholder questions shared by both lanes:
  local scope and completeness, duplicate or component risk, implicit
  knowledge, service relationships, and next actions.
- **Comparison Ledger**: The record that compares lane outputs and product
  claim status. It retains prompts, raw outputs, artifact paths or checksums,
  per-question scores, unsupported-claim counts, `unknown` and `not_assessed`
  notes, and the final decision rationale.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Both lanes complete or are recorded with exact failure reasons.
- **SC-002**: 100% of questions receive a score for both lanes.
- **SC-003**: Cursor-plus-Portolan reduces unsupported claims by at least 50%,
  or the value claim is not accepted.
- **SC-004**: Cursor-plus-Portolan produces equal or better useful next actions
  for at least 75% of questions, or the value claim is narrowed.
- **SC-005**: The final comparison ledger applies the explicit
  accepted/narrowed/rejected/blocked rule for "Why Portolan if I have Cursor?"

## Assumptions

- The first comparison may use headless Cursor Agent if UI Cursor/Composer is
  unavailable, but UI status remains separate.
- Cursor-alone may inspect local files but receives no Portolan-generated
  context or map artifacts.
- Cursor-plus-Portolan receives Portolan artifacts before answering.
