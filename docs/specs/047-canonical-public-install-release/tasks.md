# Tasks: Canonical Public Install And Release

**Input**: Design documents from `docs/specs/047-canonical-public-install-release/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/public-install-release.md`, `quickstart.md`

**Tests**: Baseline checks, module identity regression check, module identity
scan, clean public install smoke, versioned source-first release smoke, and
product-claim scan.

**Organization**: Tasks are grouped by independently reviewable user story.

## Phase 1: Setup And Decisions

**Purpose**: Lock launch decisions before touching public install copy.

- [x] T001 Create SpecKit artifacts in `docs/specs/047-canonical-public-install-release/spec.md`
- [x] T002 Record package self-review in `docs/specs/047-canonical-public-install-release/reviews/spec-package-self-review-2026-05-30.md`
- [x] T003 Record canonical identity, version, and release-style decisions in `docs/specs/047-canonical-public-install-release/reviews/maintainer-decisions-2026-05-30.md`
- [x] T004 Record current `origin/main` sync evidence in `docs/specs/047-canonical-public-install-release/reviews/public-showcase-main-sync-2026-05-30.md`
- [x] T005 Set active SpecKit pointer to 047 in `.specify/feature.json`
- [x] T006 Set AGENTS SpecKit plan pointer to `docs/specs/047-canonical-public-install-release/plan.md` in `AGENTS.md`

---

## Phase 2: Foundational Identity Alignment

**Purpose**: Make public identity consistent before README or release copy is
treated as usable.

- [x] T007 Replace module identity in `go.mod` with `github.com/fcon-tech/portolan`
- [x] T008 Update Go internal import paths from `github.com/fall-out-bug/portolan/...` to `github.com/fcon-tech/portolan/...`
- [x] T009 Update release ldflags package path in `docs/release.md`
- [x] T010 Update release/version injection expectations in `internal/app/app_test.go`
- [x] T011 Add a canonical identity regression check covering `go.mod`, README install copy, release ldflags, and stale Go import paths
- [x] T012 Update canonical clone/install references in `README.md`
- [x] T013 [P] Update canonical clone/install references in `docs/ru/README.md`
- [x] T014 [P] Update agent install wording in `docs/agent/INSTALL.md`
- [x] T015 [P] Update Russian agent install wording in `docs/agent/INSTALL.ru.md`
- [x] T016 Execute `go test -count=1 ./...` after identity migration and record result in `docs/specs/047-canonical-public-install-release/reviews/identity-alignment-2026-05-30.md`
- [x] T017 Run public identity scan with pass criteria and record result in `docs/specs/047-canonical-public-install-release/reviews/identity-alignment-2026-05-30.md`

**Identity scan pass criteria**:

- `go.mod`, README install copy, source checkout copy, release ldflags, and
  release test expectations use `github.com/fcon-tech/portolan`.
- No `.go` file imports `github.com/fall-out-bug/portolan/...`.
- Any remaining `github.com/fall-out-bug/portolan` references are absent or
  explicitly marked as historical migration context, not public install copy.

**Checkpoint**: The repository no longer exposes `github.com/fall-out-bug/portolan`
as the public install identity, except explicitly documented migration history
if needed.

---

## Phase 3: User Story 1 - Install From The Public Repository (Priority: P1)

**Goal**: A first-time public evaluator can install or clone Portolan without
debugging module path history.

**Independent Test**: Run the documented primary public install route and
`portolan --version` in a clean environment.

- [x] T018 [US1] Add public install section with `go install github.com/fcon-tech/portolan/cmd/portolan@v0.1.0` to `README.md`
- [x] T019 [US1] Add source-checkout fallback using `git clone https://github.com/fcon-tech/portolan.git` to `README.md`
- [x] T020 [US1] Add clean install smoke instructions to `docs/specs/047-canonical-public-install-release/quickstart.md`
- [x] T021 [US1] Execute the documented install/source smoke or record an external blocker in `docs/specs/047-canonical-public-install-release/reviews/public-install-smoke-2026-05-30.md`

T021 handoff: source-checkout fallback is verified; versioned public
`go install ...@v0.1.0` is blocked until merge and tag publication, with
evidence recorded in `public-install-smoke-2026-05-30.md`.

**Checkpoint**: User Story 1 is independently useful when README install and
source fallback both point at `fcon-tech/portolan` and have verification status.

---

## Phase 4: User Story 2 - Publish A Bounded First Release (Priority: P2)

**Goal**: Maintainers can publish `v0.1.0` without overclaiming validation
evidence.

**Independent Test**: Follow release docs, verify `portolan v0.1.0`, inspect
release notes against `docs/product-claims.md`, and record publication state.

- [x] T022 [US2] Update source-first `v0.1.0` checklist in `docs/release.md`; prebuilt binaries remain out of scope unless a later spec adds platform smoke, checksums, and closeout coverage
- [x] T023 [US2] Draft canonical source-first release notes in `docs/releases/v0.1.0.md` for later paste into GitHub Releases
- [x] T024 [US2] Add claim-boundary review section to `docs/releases/v0.1.0.md`
- [x] T025 [US2] Verify the Apache Bigtop demo route referenced by release notes exists and stays within `docs/product-claims.md`
- [x] T026 [US2] Execute versioned build/checksum smoke and record result in `docs/specs/047-canonical-public-install-release/reviews/v0.1.0-build-smoke-2026-05-30.md`
- [x] T027 [US2] Execute product-claim and package-manager claim scans and record result in `docs/specs/047-canonical-public-install-release/reviews/v0.1.0-claim-scan-2026-05-30.md`

**Checkpoint**: User Story 2 is independently useful when release notes can be
published without adding prebuilt-binary or adoption claims.

---

## Phase 5: User Story 3 - Keep Release Readiness Separate From Popularity (Priority: P3)

**Goal**: Release readiness does not imply popularity, adoption, GitHub checks,
or merge approval.

**Independent Test**: Inspect the closeout and confirm local readiness, GitHub
checks, publication, and adoption are separate fields.

- [x] T028 [US3] Add release closeout template in `docs/specs/047-canonical-public-install-release/reviews/v0.1.0-release-closeout-template.md` with separate fields for local checks, GitHub checks, release publication, adoption/popularity, merge approval, and stop reason
- [x] T029 [US3] Add README wording that avoids adoption claims in `README.md`
- [x] T030 [US3] Update backlog status after implementation in `docs/product-backlog.md`

---

## Final Phase: Verification And Closeout

**Purpose**: Align status and record evidence.

- [x] T031 Run `go test -count=1 ./...` and record result in `docs/specs/047-canonical-public-install-release/reviews/v0.1.0-release-closeout-2026-05-30.md`
- [x] T032 Run `jq empty .specify/feature.json schema/*.json` and record result in `docs/specs/047-canonical-public-install-release/reviews/v0.1.0-release-closeout-2026-05-30.md`
- [x] T033 Run `git diff --check` and record result in `docs/specs/047-canonical-public-install-release/reviews/v0.1.0-release-closeout-2026-05-30.md`
- [x] T034 Run public identity scan and record result in `docs/specs/047-canonical-public-install-release/reviews/v0.1.0-release-closeout-2026-05-30.md`
- [x] T035 Run release-note claim-contract scan and record result in `docs/specs/047-canonical-public-install-release/reviews/v0.1.0-release-closeout-2026-05-30.md`
- [x] T036 Update `docs/specs/047-canonical-public-install-release/spec.md` status
- [x] T037 Update `docs/specs/047-canonical-public-install-release/tasks.md` completion ledger

## Dependencies & Execution Order

- T007-T017 block all public install and release copy.
- User Story 1 should complete before User Story 2.
- User Story 2 should complete before GitHub release publication.
- User Story 3 must complete before claiming public-release readiness.
- Prebuilt binaries are out of scope unless tasks are expanded with platform
  smoke, checksum, and closeout coverage.

## Parallel Opportunities

- T011, T012, and T013 can run in parallel after T010.
- T020 and T021 can be drafted in parallel after T019.
- T027, T028, and T029 can run after all docs/code edits land.

## Implementation Strategy

1. Align module identity and public install references.
2. Verify install from a clean environment.
3. Draft source-first `v0.1.0` release notes.
4. Keep claim boundaries and publication state separate.
5. Record final release closeout evidence.
