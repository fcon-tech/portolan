# Tasks: Docs And Harness Onboarding

**Input**: Design documents from `specs/045-docs-harness-onboarding/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/docs-onboarding.md`, `quickstart.md`

**Tests**: Docs-only verification through link/text inspection and whitespace checks. No behavior tests required unless the slice expands beyond documentation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup And Review Baseline

**Purpose**: Record current documentation quality and route gaps before editing.

- [x] T001 Record current docs assessment in `specs/045-docs-harness-onboarding/reviews/current-docs-assessment-2026-05-29.md`
- [x] T002 Create SpecKit artifacts in `specs/045-docs-harness-onboarding/`

---

## Phase 2: Foundational Route

**Purpose**: Add the smallest maintained route that all stories can link to.

- [x] T003 [US1] Add the onboarding route in `docs/onboarding.md`
- [x] T004 [US1] Link the route from `README.md`
- [x] T005 [US1] Link the route from `docs/ru/README.md`

---

## Phase 3: User Story 1 - Choose The Right Starting Point (Priority: P1)

**Goal**: Humans and agents can choose the right starting doc without reading spec reviews.

**Independent Test**: Start at `README.md` and route to human overview, safe claims, agent run, install, Cursor, and OpenCode docs in under two minutes.

- [x] T006 [US1] Add route table entries in `docs/onboarding.md` for human, agent, install, release, Cursor, and OpenCode workflows
- [x] T007 [US1] Add maintained-docs entry in `docs/product-backlog.md`

**Checkpoint**: User Story 1 is independently useful when `README.md` and `docs/onboarding.md` route readers to the correct docs.

---

## Phase 4: User Story 2 - Run Installation Without Guessing (Priority: P2)

**Goal**: Agent operators can resolve Portolan and choose harness-compatible output paths.

**Independent Test**: Use only `docs/agent/INSTALL.md`, `docs/agent/INSTALL-PROMPT.md`, and `docs/onboarding.md` to select binary/source/bootstrap/fallback and OpenCode output behavior.

- [x] T008 [US2] Clarify repo-local output guidance in `docs/agent/INSTALL.md` and `docs/agent/INSTALL.ru.md`
- [x] T009 [US2] Clarify OpenCode default-permission guidance in `docs/agent/INSTALL-PROMPT.md` and `docs/agent/INSTALL-PROMPT.ru.md`
- [x] T010 [US2] Link harness boundary guidance from `docs/agent/QUICKSTART.md` and `docs/agent/QUICKSTART.ru.md`

**Checkpoint**: User Story 2 is independently useful when OpenCode default-permission output guidance is visible without review ledgers.

---

## Phase 5: User Story 3 - Keep Cursor And OpenCode Claims Honest (Priority: P3)

**Goal**: Docs preserve verified, failed, and not_assessed harness states.

**Independent Test**: Compare onboarding text against `docs/product-claims.md` and `docs/agent/ACCEPTANCE.md`; no UI Cursor or arbitrary OpenCode support is claimed.

- [x] T011 [US3] Include Cursor CLI versus UI boundary in `docs/onboarding.md`
- [x] T012 [US3] Include OpenCode verified, failed, and recommended path boundaries in `docs/onboarding.md`
- [x] T013 [US3] Update `AGENTS.md` SpecKit plan pointer to `specs/045-docs-harness-onboarding/plan.md`

**Checkpoint**: User Story 3 is independently useful when harness language preserves current claim boundaries.

---

## Final Phase: Verification And Closeout

**Purpose**: Align status and record verification.

- [x] T014 Run docs verification from `specs/045-docs-harness-onboarding/quickstart.md`
- [x] T015 Run baseline checks or record blockers in `specs/045-docs-harness-onboarding/reviews/implementation-disposition-2026-05-29.md`
- [x] T016 Update `specs/045-docs-harness-onboarding/spec.md` and `docs/product-backlog.md` status to match implementation state
- [x] T017 Record quality review in `specs/045-docs-harness-onboarding/reviews/code-quality-review-2026-05-30.md`
- [x] T018 Record requirements and product-claim drift review in `specs/045-docs-harness-onboarding/reviews/requirements-product-vision-drift-2026-05-30.md`
- [x] T019 Run requested `pi` review lanes and record disposition in `specs/045-docs-harness-onboarding/reviews/pi-review-disposition-2026-05-30.md`

## Dependencies & Execution Order

- Phase 1 must complete before docs edits.
- Phase 2 creates the shared route and blocks all user stories.
- User Story 1 should complete before User Stories 2 and 3 because it creates the shared navigation surface.
- User Stories 2 and 3 can proceed independently after User Story 1.
- Final verification depends on all selected story tasks.

## Parallel Opportunities

- T004 and T005 can be reviewed in parallel after T003.
- T008 and T009 can be drafted in parallel after T003.
- T011 and T012 can be reviewed in parallel because both edit the same new document but cover separate harness sections.

## Implementation Strategy

1. Deliver the route page first.
2. Link it from existing entrypoints.
3. Tighten install and prompt docs for OpenCode output behavior.
4. Verify that harness claims remain narrow and evidence-labelled.
