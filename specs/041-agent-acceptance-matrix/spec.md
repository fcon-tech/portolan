# Feature Specification: Agent Acceptance Matrix

**Feature Branch**: `codex/041-agent-acceptance-matrix-delivery`

**Created**: 2026-05-27

**Status**: Ready-for-review PR #20; Codex single-repo self-target lane and GitHub CI verified; non-Codex/external lanes remain not_assessed

**Input**: Product-readiness gap: Portolan's value is validated narrowly on fixed local Bigtop with headless Cursor; broader agent and target acceptance remains `not_assessed`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Define A Reproducible Acceptance Matrix (Priority: P1)

A maintainer can see which agent harnesses and target shapes must be tested before product claims are broadened.

**Why this priority**: Without an explicit matrix, successful local specs can be mistaken for external product validation.

**Independent Test**: Inspect the matrix and confirm it names harness lanes, target fixtures, question sets, evidence to collect, and degraded-state handling.

**Acceptance Scenarios**:

1. **Given** a harness lane is unavailable, **When** acceptance is recorded, **Then** the lane is `not_assessed` with a reason.
2. **Given** a target lacks local inventory, **When** an agent answers scope questions, **Then** external completeness remains `unknown`.

---

### User Story 2 - Run Acceptance Without Hidden Prompt Scaffolding (Priority: P1)

An agent can run Portolan from documented instructions using only Portolan path, target path, output path, and the acceptance prompt.

**Why this priority**: Portolan must be self-serve and harness-independent, not a manually guided consulting packet.

**Independent Test**: Execute at least one local lane from the matrix and record the exact prompt, commands, outputs, and unsupported-claim counts.

**Acceptance Scenarios**:

1. **Given** an agent receives the documented acceptance prompt, **When** it runs the workflow, **Then** it creates a context pack or records a blocker.
2. **Given** the agent output includes unsupported claims, **When** the ledger is scored, **Then** those claims are counted and not rewritten away.

---

### User Story 3 - Keep Product Claims Narrow (Priority: P2)

A product owner can update `docs/product-claims.md` only when the matrix evidence supports broader wording.

**Why this priority**: Acceptance is useful only if it gates claims.

**Independent Test**: Compare the acceptance ledger with `docs/product-claims.md` and verify unsupported or unrun lanes remain limitations.

**Acceptance Scenarios**:

1. **Given** only one harness lane passes, **When** product claims are updated, **Then** the claim names that harness and target.
2. **Given** UI Cursor/Composer is not run, **When** claims are reviewed, **Then** UI Cursor/Composer remains `not_assessed`.

### Edge Cases

- A harness cannot run shell commands.
- An agent changes the question or target scope.
- A lane completes but omits Portolan artifacts.
- A model produces off-topic, empty, or unverifiable output.
- Acceptance fixtures pass but a real local target fails.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The feature MUST define a harness-by-target acceptance matrix.
- **FR-002**: The matrix MUST include at least Codex, Cursor UI/Composer, and one non-Cursor harness lane as planned lanes.
- **FR-003**: The matrix MUST include at least single-repo, multi-repo, and black-box/metadata-heavy target shapes.
- **FR-004**: Acceptance records MUST preserve `verified`, `failed`, `blocked`, `unknown`, and `not_assessed` states.
- **FR-005**: Acceptance scoring MUST count unsupported claims and useful next actions separately.
- **FR-006**: Product claims MUST remain scoped to assessed lanes only.
- **FR-007**: The feature MUST not require network access, credentials, or hidden prompt scaffolding.

### Key Entities

- **Acceptance Lane**: A harness, target, prompt, and run environment.
- **Question Set**: Reused CTO-level questions for comparing output quality.
- **Acceptance Ledger**: Evidence record with command, output path, scoring, and state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The matrix has at least nine planned cells across three harnesses and three target shapes.
- **SC-002**: At least one lane is executed or explicitly blocked with evidence.
- **SC-003**: Every unexecuted matrix cell is `not_assessed`, not omitted.
- **SC-004**: `docs/product-claims.md` agrees with the acceptance ledger after implementation.

## Assumptions

- Headless Cursor validation from spec 034 remains prior evidence but does not cover UI Cursor/Composer.
- Not every lane must pass in this slice; the product value is the matrix plus honest state accounting.
