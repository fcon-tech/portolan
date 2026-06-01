# Tasks: E2E Agent Scan Report

**Input**: Design documents from `specs/052-agent-scan-report-ux/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/e2e-scan-report.md`, `quickstart.md`

**Tests**: Behavior changes require focused tests before implementation. This
slice needs CLI, report-rendering, output-contract, and E2E fixture tests.

**Organization**: Tasks are grouped by independently testable user stories.

**Dependency**: `specs/051-portolan-quality-boundary/` must be satisfied or
explicitly marked `not_assessed` before this UX slice claims product readiness.

## Phase 1: Setup And Contract Lock

**Purpose**: Lock the E2E user story before implementation.

- [ ] T001 Create or update `plan.md`, `research.md`, `data-model.md`,
  `contracts/e2e-scan-report.md`, and `quickstart.md` for the scan-report
  workflow.
- [ ] T002 Record current prototype evidence in
  `specs/052-agent-scan-report-ux/reviews/prototype-current-behavior-2026-06-01.md`.
- [ ] T003 Run requirements/product-vision drift review and record findings in
  `specs/052-agent-scan-report-ux/reviews/requirements-product-vision-drift-2026-06-01.md`.
- [ ] T004 Run `/speckit-analyze` or equivalent manual cross-artifact analysis
  before implementation and disposition findings under `reviews/`.
- [ ] T005 Verify the `specs/051-portolan-quality-boundary/` dependency state
  and record whether report-quality gates are `verified`, `blocked`, or
  `not_assessed`.

---

## Phase 2: Foundational Report Model

**Purpose**: Add the report artifact contract without changing target
repositories.

- [ ] T006 Add failing tests for report summary validation in
  `internal/report/...` or the existing nearest internal package.
- [ ] T007 Add failing tests for required report sections and evidence
  references.
- [ ] T008 Implement the internal report model, renderer, and summary writer.
- [ ] T009 Add output safety tests equivalent to existing map/context output
  boundaries.

**Checkpoint**: A report can be rendered from prepared evidence in tests.

---

## Phase 3: User Story 1 - Get A First Useful Report (Priority: P1)

**Goal**: One scan-report workflow produces a first useful report from a local
root.

**Independent Test**: Run the workflow on the synthetic multi-repo fixture and
verify `first-report.md` and `report-summary.json`.

- [ ] T010 [US1] Add a synthetic multi-repo E2E fixture with exact duplication,
  multiple manifests, workflow/config surfaces, and missing relationship
  families.
- [ ] T011 [US1] Add failing CLI test for the one-step scan-report command.
- [ ] T012 [US1] Implement the CLI entrypoint as a thin wrapper over internal
  orchestration.
- [ ] T013 [US1] Orchestrate existing context and map generation into the
  selected output directory.
- [ ] T014 [US1] Populate `first-report.md` with required sections from map,
  context, findings, and gaps.
- [ ] T015 [US1] Populate `report-summary.json` and reject unsupported positive
  claims in the acceptance test.

**Checkpoint**: User Story 1 is useful without stack-specific analyzers.

---

## Phase 4: User Story 2 - Understand Architecture And Relationships (Priority: P2)

**Goal**: The report orients the user through visible stack and architecture
evidence.

**Independent Test**: Verify the report includes visible stack, relationship
evidence, architecture diagram, and relationship gaps on the fixture.

- [ ] T016 [US2] Add tests for visible stack summarization from local source,
  manifests, workflows, contracts, and imported tool-output records.
- [ ] T017 [US2] Add tests that architecture diagrams label evidence states and
  do not claim complete runtime topology.
- [ ] T018 [US2] Implement stack summary extraction from existing evidence
  bundle fields.
- [ ] T019 [US2] Implement architecture diagram rendering, starting with a
  text diagram format and explicit legend.
- [ ] T020 [US2] Add bounded relationship query or graph-slice usage when the
  summary points to more relationship detail.

**Checkpoint**: A leader can orient from the report without opening raw JSON.

---

## Phase 5: User Story 3 - Reduce The Next Step To A Short Action Plan (Priority: P3)

**Goal**: The report ends with ranked local actions that reduce real unknowns.

**Independent Test**: Verify every next action is safe, local, ranked, and tied
to an observed gap or evidence family.

- [ ] T021 [US3] Add tests for next-action ranking across missing near-clone
  duplication, missing runtime topology, missing curated inventory, and missing
  semantic config evidence.
- [ ] T022 [US3] Implement next-action selection from gaps, `oss-plan.json`,
  query commands, and user-supplied evidence needs.
- [ ] T023 [US3] Ensure producer actions are marked as approval-required where
  existing policy requires approval.
- [ ] T024 [US3] Add report wording for thin-evidence cases where Portolan can
  explain why the first answer is limited.

**Checkpoint**: The user gets a next conversation, not just a static report.

---

## Phase 6: Harness And Acceptance Lanes

**Purpose**: Prove the E2E story through realistic harness-like runs.

- [ ] T025 Add a generic agent prompt/runbook in `docs/agent/` that asks for
  the E2E scan report without requiring internal artifact knowledge.
- [ ] T026 Add or update one canonical scan-report workflow source for
  harness-facing instructions.
- [ ] T027 Add a Cursor example only as a thin wrapper over the generic
  runbook; do not make Cursor the product boundary.
- [ ] T028 Add adapter drift/parity validation if more than one harness-specific
  scan-report surface is committed.
- [ ] T029 Add fallback-mode instructions for harnesses that cannot invoke the
  preferred command directly; fallback must still produce `first-report.md` and
  `report-summary.json`.
- [ ] T030 Run the synthetic multi-repo lane and record evidence under
  `specs/052-agent-scan-report-ux/reviews/`.
- [ ] T031 Run one public single-repo lane and record evidence under
  `specs/052-agent-scan-report-ux/reviews/`.
- [ ] T032 Run one public multi-repo or landscape lane and record evidence under
  `specs/052-agent-scan-report-ux/reviews/`.
- [ ] T033 Record any absent, degraded, failed, or `not_assessed` lane as such;
  do not count it as success.

---

## Final Phase: Verification And Closeout

- [ ] T034 Run `go test -count=1 ./...`.
- [ ] T035 Run `go vet ./...`.
- [ ] T036 Run `jq empty schema/*.json`.
- [ ] T037 Run `git diff --check`.
- [ ] T038 Run the E2E quickstart and record output paths plus report evidence.
- [ ] T039 Update `README.md`, `docs/agent/QUICKSTART.md`, and Russian docs
  only after the workflow exists.
- [ ] T040 Update `docs/product-backlog.md` and this task ledger to match
  implementation state.
- [ ] T041 Record PR readiness closeout before claiming ready-for-review.

## Dependencies & Execution Order

- T001-T005 block implementation.
- T006-T009 block all user stories.
- US1 must land before US2 and US3 are considered product-useful.
- Harness acceptance lanes must run after the scan-report workflow exists.
- Documentation updates must not claim the E2E story before the quickstart
  passes.

## Parallel Opportunities

- T006 and T007 can run in parallel after T005.
- T016 and T017 can run in parallel after US1 is complete.
- T030, T031, and T032 can run in parallel if separate local targets are ready.

## Implementation Strategy

1. Lock the report contract.
2. Add tests around report model and CLI behavior.
3. Implement one E2E command over existing artifacts.
4. Add diagram and next-action ranking.
5. Verify through synthetic and public acceptance lanes.
