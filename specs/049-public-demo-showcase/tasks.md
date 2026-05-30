# Tasks: Public Demo Showcase

**Input**: Design documents from `specs/049-public-demo-showcase/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/public-demo-showcase.md`, `quickstart.md`

**Readiness note**: `research.md`, `data-model.md`, `contracts/`, and
`quickstart.md` are SpecKit inputs for implementation, not outputs of the
unchecked task ledger. Phase 1 recorded the target and artifact-policy
decisions; Phase 2 starts implementation.

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

- [x] T006 Record Apache Bigtop acquisition options, Apache 2.0 license note, rejected Portolan self-map rationale, and network/disk behavior in `specs/049-public-demo-showcase/reviews/bigtop-demo-source-2026-05-30.md`
- [x] T007 Verify current `portolan context prepare`, `portolan map`, and bounded `portolan query` or `portolan graph slice` CLI forms; record the exact command evidence in `specs/049-public-demo-showcase/reviews/bigtop-demo-source-2026-05-30.md`
- [x] T008 Create or update `docs/demo.md` with demo source, output directory policy, and a warning that locally generated full outputs may contain absolute local paths and must not be shared without privacy review
- [x] T009 Add redaction rules for sample excerpts to top-level `examples/public-demo/README.md` and freshness/privacy review template to `specs/049-public-demo-showcase/reviews/demo-privacy-freshness-template.md`

**Checkpoint**: The demo has a public target, reproducible input setup, and an
artifact policy before any excerpts are committed.

---

## Phase 3: User Story 1 - Run A Public Apache Bigtop Demo (Priority: P1)

**Goal**: A public evaluator can run Portolan against Apache Bigtop and inspect
the expected artifact bundle.

**Independent Test**: Follow `docs/demo.md` from a fresh Portolan checkout,
prepare the documented Bigtop target, and verify required artifacts exist.

- [x] T010 [US1] Add copyable Bigtop setup commands to `docs/demo.md`
- [x] T011 [US1] Add `portolan context prepare` command for Bigtop to `docs/demo.md`
- [x] T012 [US1] Add `portolan map` command for Bigtop to `docs/demo.md`
- [x] T013 [US1] Add expected artifact list to `docs/demo.md`
- [x] T014 [US1] Add first-artifact reading order to `docs/demo.md`
- [x] T015 [US1] Add one bounded `portolan query gaps --bundle <run-dir> --limit 20` example or `portolan graph slice` example to `docs/demo.md`
- [x] T016 [US1] Record first-attempt fresh demo smoke result, elapsed time, or blocker in `specs/049-public-demo-showcase/reviews/bigtop-demo-smoke-2026-05-30.md`

**Checkpoint**: User Story 1 is independently useful when a reader can run the
Bigtop demo locally and know which artifact to inspect first.

---

## Phase 4: User Story 2 - Read A Claim-Bounded Case Study (Priority: P2)

**Goal**: Public readers understand why Portolan helps agents without broadening
validated claims.

**Independent Test**: Compare case-study text with `docs/product-claims.md`.

- [x] T017 [US2] Add fixed local Bigtop comparison summary to `docs/demo.md`
- [x] T018 [US2] Add headless Cursor Agent CLI / Composer scope wording to `docs/demo.md`
- [x] T019 [US2] Link limitations from `docs/demo.md` to `docs/product-claims.md`
- [x] T020 [US2] Record case-study claim scan in `specs/049-public-demo-showcase/reviews/demo-claim-scan-2026-05-30.md`

**Checkpoint**: User Story 2 is independently useful when a CTO reader can see
the value claim and its limits on one page.

---

## Phase 5: User Story 3 - Share Artifacts Without Leaking Private Context (Priority: P3)

**Goal**: Published excerpts are safe and freshness-labelled.

**Independent Test**: Run private-path/secret scans and inspect freshness notes
for every committed excerpt.

- [x] T021 [US3] Add redacted `summary.json` excerpt to `examples/public-demo/bigtop/summary-excerpt.json`
- [x] T022 [US3] Add redacted `map.md` excerpt to `examples/public-demo/bigtop/map-excerpt.md`
- [x] T023 [US3] Add redacted `evidence-index.jsonl` excerpt to `examples/public-demo/bigtop/evidence-index-excerpt.jsonl`
- [x] T024 [US3] Add redacted `answer-contract.md` excerpt to `examples/public-demo/bigtop/answer-contract-excerpt.md`
- [x] T025 [US3] Add redacted bounded query/gaps excerpt or explain why the query is only documented, not committed, in `examples/public-demo/bigtop/README.md`
- [x] T026 [US3] Add generation command and freshness notes to nested artifact index `examples/public-demo/bigtop/README.md`
- [x] T027 [US3] Record private-path and secret scan in `specs/049-public-demo-showcase/reviews/demo-privacy-freshness-2026-05-30.md`

---

## Final Phase: Verification And Closeout

**Purpose**: Align public demo state and evidence.

- [x] T028 Run final Apache Bigtop demo smoke or record blocker in `specs/049-public-demo-showcase/reviews/bigtop-demo-smoke-2026-05-30.md`
- [x] T029 Run `go test -count=1 ./...` and record result in `specs/049-public-demo-showcase/reviews/demo-closeout-2026-05-30.md`
- [x] T030 Run `jq empty .specify/feature.json schema/*.json examples/public-demo/bigtop/*.json` and record result in `specs/049-public-demo-showcase/reviews/demo-closeout-2026-05-30.md`
- [x] T031 Run `git diff --check` and record result in `specs/049-public-demo-showcase/reviews/demo-closeout-2026-05-30.md`
- [x] T032 After T019 and T026, run product-claim drift scan over `docs/demo.md`, `examples/public-demo/`, and `docs/product-claims.md`; record result in `specs/049-public-demo-showcase/reviews/demo-closeout-2026-05-30.md`
- [x] T033 Update README demo link in `README.md`
- [x] T034 Update `specs/049-public-demo-showcase/spec.md` status
- [x] T035 Update `specs/049-public-demo-showcase/tasks.md` completion ledger
- [x] T036 Update `docs/product-backlog.md` status row for P5-049

## Dependencies & Execution Order

- T006-T009 block public demo copy and excerpts.
- User Story 1 should complete before the case-study section is treated as
  public.
- User Story 3 and T032 must complete before committing excerpts as publishable.
- Full generated Bigtop outputs, screenshots, and recordings are out of scope
  unless separately approved.

## Parallel Opportunities

- T011 and T012 can be drafted in parallel after T010.
- T021, T022, T023, and T024 can be prepared in parallel after T016.
- T029, T030, and T031 can run after all edits land.

## Implementation Strategy

1. Document Bigtop acquisition and output paths.
2. Build a text-first reproducible demo.
3. Add claim-bounded Bigtop case-study wording.
4. Add small redacted excerpts with freshness notes.
5. Run privacy, claim, and baseline verification.
