# Tasks: Release Envelope

**Input**: Design documents from `specs/040-release-envelope/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/release-envelope.md

**Tests**: Required for CI workflow command parity and clean-checkout install smoke.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup

- [x] T001 Create pre-implementation review disposition in `specs/040-release-envelope/reviews/requirements-product-vision-drift-2026-05-27.md`
- [x] T002 Run SpecKit analyze or record equivalent analyze disposition in `specs/040-release-envelope/reviews/analyze-disposition-2026-05-27.md`

## Phase 2: Foundational

- [x] T003 Verify existing bootstrap behavior with `scripts/bootstrap-portolan --help` and record results in `specs/040-release-envelope/reviews/verification-2026-05-27.md`
- [x] T004 Inspect `docs/product-claims.md` and list release-visible `not_assessed` limitations in `specs/040-release-envelope/reviews/release-claim-boundary-2026-05-27.md`

## Phase 3: User Story 1 - Verify Every Pull Request (Priority: P1)

**Goal**: GitHub checks run the baseline and CLI smoke.

**Independent Test**: Run the workflow command set locally.

- [x] T005 [US1] Add CI workflow in `.github/workflows/ci.yml`
- [x] T006 [US1] Run `go test -count=1 ./...`
- [x] T007 [US1] Run `jq empty schema/*.json`
- [x] T008 [US1] Run `git diff --check`
- [x] T009 [US1] Run `go run ./cmd/portolan --help`

## Phase 4: User Story 2 - Install From A Clean Checkout (Priority: P1)

**Goal**: Source checkout bootstrap is externally followable.

**Independent Test**: Build and smoke the repo-local binary.

- [x] T010 [US2] Update install guidance in `docs/agent/INSTALL.md`
- [x] T011 [US2] Run `scripts/bootstrap-portolan`
- [x] T012 [US2] Run `.portolan/bin/portolan --version`
- [x] T013 [US2] Run `.portolan/bin/portolan context prepare --root . --out /tmp/portolan-context-smoke --profile cursor --force`
- [x] T014 [US2] Run `.portolan/bin/portolan map --root . --out /tmp/portolan-map-smoke --force`

## Phase 5: User Story 3 - Package A Release Candidate (Priority: P2)

**Goal**: Maintainers have a release checklist tied to product claims.

**Independent Test**: Read release docs and confirm every current product limitation remains visible.

- [x] T015 [US3] Add release checklist in `docs/release.md`
- [x] T016 [US3] Cross-link release docs from `README.md`
- [x] T017 [US3] Verify release docs mention current `not_assessed` limitations from `docs/product-claims.md`

## Phase 6: Review And Closeout

- [x] T018 Run independent review lanes and record disposition in `specs/040-release-envelope/reviews/slice-review-disposition-2026-05-27.md`
- [x] T019 Update `specs/040-release-envelope/spec.md` status and task checkboxes after implementation
- [x] T020 Update `docs/product-backlog.md` status for P5-040
- [x] T021 Run full baseline checks and record final implementation disposition
- [x] T022 Prepare PR readiness closeout before claiming ready-for-review PR state

## Dependencies & Execution Order

- Phase 1 and 2 block implementation.
- US1 and US2 may proceed in parallel after foundation.
- US3 depends on the product-claim limitation inventory from T004.

## Implementation Strategy

Deliver US1 and US2 first so future specs can rely on CI and bootstrap evidence. Add release checklist after those commands are proven.
