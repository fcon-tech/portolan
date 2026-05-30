# Tasks: Public Demo Showcase

**Input**: Design documents from `specs/049-public-demo-showcase/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/public-demo-showcase.md`, `quickstart.md`

**Tests**: Apache Bigtop demo smoke, artifact inspection, privacy scan,
product-claim scan, and baseline checks.

**Organization**: Tasks are grouped by demo runbook, claim-bounded case study,
and public-safety stories.

## Phase 1: Setup And Decisions

**Purpose**: Choose the demo target and artifact policy before generating
public material.

- [x] T001 Create SpecKit artifacts in `specs/049-public-demo-showcase/spec.md`
- [x] T002 Record package self-review in `specs/049-public-demo-showcase/reviews/spec-package-self-review-2026-05-30.md`
- [x] T003 Record Apache Bigtop demo target in `specs/049-public-demo-showcase/reviews/demo-artifact-policy-2026-05-30.md`
- [x] T004 Record approved runbook plus redacted excerpts policy in `specs/049-public-demo-showcase/reviews/demo-artifact-policy-2026-05-30.md`
- [x] T005 Defer full generated Bigtop outputs, screenshots, and recordings in `specs/049-public-demo-showcase/reviews/demo-artifact-policy-2026-05-30.md`

---

## Phase 2: Foundational Demo Inputs

**Purpose**: Make the Apache Bigtop target and output policy explicit before
public demo copy is written.

- [ ] T006 Record Apache Bigtop acquisition options in `specs/049-public-demo-showcase/reviews/bigtop-demo-source-2026-05-30.md`
- [ ] T007 Add demo source and output directory policy to `docs/demo.md`
- [ ] T008 Add redaction rules for sample excerpts to `examples/public-demo/README.md`
- [ ] T009 Add freshness and privacy review template to `specs/049-public-demo-showcase/reviews/demo-privacy-freshness-template.md`

**Checkpoint**: The demo has a public target, reproducible input setup, and an
artifact policy before any excerpts are committed.

---

## Phase 3: User Story 1 - Run A Public Apache Bigtop Demo (Priority: P1)

**Goal**: A public evaluator can run Portolan against Apache Bigtop and inspect
the expected artifact bundle.

**Independent Test**: Follow `docs/demo.md` from a fresh Portolan checkout,
prepare the documented Bigtop target, and verify required artifacts exist.

- [ ] T010 [US1] Add copyable Bigtop setup commands to `docs/demo.md`
- [ ] T011 [US1] Add `portolan context prepare` command for Bigtop to `docs/demo.md`
- [ ] T012 [US1] Add `portolan map` command for Bigtop to `docs/demo.md`
- [ ] T013 [US1] Add expected artifact list to `docs/demo.md`
- [ ] T014 [US1] Add first-artifact reading order to `docs/demo.md`
- [ ] T015 [US1] Add one bounded `query` or `graph slice` example to `docs/demo.md`
- [ ] T016 [US1] Record fresh demo smoke result or blocker in `specs/049-public-demo-showcase/reviews/bigtop-demo-smoke-2026-05-30.md`

**Checkpoint**: User Story 1 is independently useful when a reader can run the
Bigtop demo locally and know which artifact to inspect first.

---

## Phase 4: User Story 2 - Read A Claim-Bounded Case Study (Priority: P2)

**Goal**: Public readers understand why Portolan helps agents without broadening
validated claims.

**Independent Test**: Compare case-study text with `docs/product-claims.md`.

- [ ] T017 [US2] Add fixed local Bigtop comparison summary to `docs/demo.md`
- [ ] T018 [US2] Add headless Cursor Agent CLI / Composer scope wording to `docs/demo.md`
- [ ] T019 [US2] Link limitations from `docs/demo.md` to `docs/product-claims.md`
- [ ] T020 [US2] Record case-study claim scan in `specs/049-public-demo-showcase/reviews/demo-claim-scan-2026-05-30.md`

**Checkpoint**: User Story 2 is independently useful when a CTO reader can see
the value claim and its limits on one page.

---

## Phase 5: User Story 3 - Share Artifacts Without Leaking Private Context (Priority: P3)

**Goal**: Published excerpts are safe and freshness-labelled.

**Independent Test**: Run private-path/secret scans and inspect freshness notes
for every committed excerpt.

- [ ] T021 [US3] Add redacted `summary.json` excerpt to `examples/public-demo/bigtop/summary-excerpt.json`
- [ ] T022 [US3] Add redacted `map.md` excerpt to `examples/public-demo/bigtop/map-excerpt.md`
- [ ] T023 [US3] Add redacted `evidence-index.jsonl` excerpt to `examples/public-demo/bigtop/evidence-index-excerpt.jsonl`
- [ ] T024 [US3] Add redacted `answer-contract.md` excerpt to `examples/public-demo/bigtop/answer-contract-excerpt.md`
- [ ] T025 [US3] Add generation command and freshness notes to `examples/public-demo/bigtop/README.md`
- [ ] T026 [US3] Record private-path and secret scan in `specs/049-public-demo-showcase/reviews/demo-privacy-freshness-2026-05-30.md`

---

## Final Phase: Verification And Closeout

**Purpose**: Align public demo state and evidence.

- [ ] T027 Run Apache Bigtop demo smoke or record blocker in `specs/049-public-demo-showcase/reviews/bigtop-demo-smoke-2026-05-30.md`
- [ ] T028 Run `go test -count=1 ./...` and record result in `specs/049-public-demo-showcase/reviews/demo-closeout-2026-05-30.md`
- [ ] T029 Run `jq empty .specify/feature.json schema/*.json examples/public-demo/bigtop/*.json` and record result in `specs/049-public-demo-showcase/reviews/demo-closeout-2026-05-30.md`
- [ ] T030 Run `git diff --check` and record result in `specs/049-public-demo-showcase/reviews/demo-closeout-2026-05-30.md`
- [ ] T031 Run product-claim drift scan over `docs/demo.md`, `examples/public-demo/`, and `docs/product-claims.md`; record result in `specs/049-public-demo-showcase/reviews/demo-closeout-2026-05-30.md`
- [ ] T032 Update README demo link in `README.md`
- [ ] T033 Update `specs/049-public-demo-showcase/spec.md` status
- [ ] T034 Update `specs/049-public-demo-showcase/tasks.md` completion ledger
- [ ] T035 Update `docs/product-backlog.md` status row for P5-049

## Dependencies & Execution Order

- T006-T009 block public demo copy and excerpts.
- User Story 1 should complete before the case-study section is treated as
  public.
- User Story 3 must complete before committing excerpts as publishable.
- Full generated Bigtop outputs, screenshots, and recordings are out of scope
  unless separately approved.

## Parallel Opportunities

- T011 and T012 can be drafted in parallel after T010.
- T021, T022, T023, and T024 can be prepared in parallel after T016.
- T028, T029, and T030 can run after all edits land.

## Implementation Strategy

1. Document Bigtop acquisition and output paths.
2. Build a text-first reproducible demo.
3. Add claim-bounded Bigtop case-study wording.
4. Add small redacted excerpts with freshness notes.
5. Run privacy, claim, and baseline verification.
