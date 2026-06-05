# Tasks: External Tool Evaluation Profiles

**Input**: `docs/specs/084-external-tool-evaluation-profiles/`

## Phase 1: Setup And Planning

- [x] T001 Verify dedicated branch/worktree and branch metadata in `docs/specs/084-external-tool-evaluation-profiles/spec.md`.
- [x] T002 Create concrete planning artifacts in `docs/specs/084-external-tool-evaluation-profiles/plan.md`, `research.md`, `data-model.md`, `quickstart.md`, and `contracts/external-tool-profile.md`.
- [x] T003 Update the SpecKit plan pointer in `AGENTS.md`.
- [x] T004 Record requirements, constitution, and product drift review in `docs/specs/084-external-tool-evaluation-profiles/reviews/requirements-product-vision-drift-2026-06-05.md`.
- [x] T005 Run three assessed non-GPT planning review lanes for `spec.md`, `plan.md`, and `tasks.md`, then record disposition in `docs/specs/084-external-tool-evaluation-profiles/reviews/planning-review-disposition-2026-06-05.md`.

## Phase 2: Foundational Profile Contract

- [x] T006 Add focused failing context/profile test in `internal/contextprep/contextprep_test.go` proving external tool profiles are guidance only and do not promote evidence.
- [x] T007 Create `docs/adapter-contracts/external-tool-evaluation-profiles.md` with required profile structure, candidate roles, approval boundaries, and stale-profile rules.

## Phase 3: User Story 1 - Compare External Tools Without Overclaiming

**Independent Test**: `docs/adapter-contracts/external-tool-evaluation-profiles.md` lists CodeGraph, Understand-Anything, and ast-index with role, fit, license, maintenance snapshot date, output surfaces, approval boundaries, and evidence limitations.

- [x] T008 [US1] Add CodeGraph profile section to `docs/adapter-contracts/external-tool-evaluation-profiles.md`.
- [x] T009 [US1] Add Understand-Anything profile section to `docs/adapter-contracts/external-tool-evaluation-profiles.md`.
- [x] T010 [US1] Add ast-index profile section to `docs/adapter-contracts/external-tool-evaluation-profiles.md`.
- [x] T011 [US1] Update profile summary guidance in `docs/adapter-contracts/external-tool-evaluation-profiles.md` so ast-index is strongest candidate, CodeGraph is lower-fit optional, and Understand-Anything is UX-only.
- [x] T012 [US1] Run focused profile text checks and `go test -count=1 ./internal/contextprep`, then record slice review disposition in `docs/specs/084-external-tool-evaluation-profiles/reviews/us1-review-disposition-2026-06-05.md`.

## Phase 4: User Story 2 - Preserve Tool Candidate State Separately From Evidence

**Independent Test**: Generated context guidance can mention profile candidates while graph facts and evidence families remain unobserved until local output is supplied.

- [x] T013 [US2] Add external profile pointer to context-pack guidance in `internal/contextprep/contextprep.go`.
- [x] T014 [US2] Ensure `internal/contextprep/contextprep_test.go` asserts candidate profiles remain `not_assessed` guidance and no external tool execution command is emitted.
- [x] T015 [US2] Run `go test -count=1 ./internal/contextprep` and a local context prepare smoke, then record slice review disposition in `docs/specs/084-external-tool-evaluation-profiles/reviews/us2-review-disposition-2026-06-05.md`.

## Phase 5: User Story 3 - Update Adoption Decisions Incrementally

**Independent Test**: A maintainer can refresh or change one profile classification without changing graph schemas or unrelated candidate profiles.

- [x] T016 [US3] Add refresh/change procedure to `docs/adapter-contracts/external-tool-evaluation-profiles.md`.
- [x] T017 [US3] Verify no schema changes are needed with `jq empty schema/*.json`.
- [x] T018 [US3] Record incremental-update review disposition in `docs/specs/084-external-tool-evaluation-profiles/reviews/us3-review-disposition-2026-06-05.md`.

## Phase 6: Final Verification And PR

- [x] T019 Run full baseline: `go test ./...`, `go vet ./...`, `jq empty schema/*.json`, and `git diff --check`.
- [x] T020 Update `docs/product-backlog.md`, `docs/specs/084-external-tool-evaluation-profiles/spec.md`, and this task ledger to implementation-ready or implemented state as appropriate.
- [x] T021 Commit, push, create PR, and run PR review cycle under `docs/specs/084-external-tool-evaluation-profiles/reviews/`.
- [x] T022 Run PR-quality review lenses for spec drift, constitution drift, product drift, CRAP, MI, CleanArch hex, CleanCode, SOLID, DRY, and YAGNI, then record disposition; classify each lens against the touched file set, record CRAP/MI/CleanArch as `not_applicable` for docs-only files with diff evidence, and apply code-quality lenses to the bounded `internal/contextprep` change.
- [x] T023 Prepare PR readiness closeout with local verification, review evidence, GitHub checks, merge readiness, and `merge_approval: not_assessed`.

## Dependencies

- Phase 1 must complete before implementation.
- Phase 2 blocks all user stories.
- User Story 1 is the MVP and should complete before User Story 2.
- User Story 2 must complete before User Story 3.
- Phase 6 runs after all user stories.

## Parallel Opportunities

- T008, T009, and T010 can be drafted in parallel after T007.
- Review artifact drafting can proceed in parallel with local verification once command evidence is available.

## Implementation Strategy

Deliver User Story 1 first as the minimum useful artifact. Then add context-pack
guidance for User Story 2 and the refresh procedure for User Story 3. Keep every
slice bounded to existing docs and `internal/contextprep`; do not add external
tool execution, dependencies, schema changes, or graph evidence facts.
