# Tasks: GitHub Community Discovery

**Input**: Design documents from `specs/048-github-community-discovery/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/github-community-profile.md`, `quickstart.md`

**Tests**: Community file inspection, public claim search, baseline checks, and
GitHub metadata verification after settings are applied.

**Organization**: Tasks are grouped by GitHub visitor, contributor, and
security/conduct stories.

## Phase 1: Setup And Decisions

**Purpose**: Lock community choices before publishing support or security
promises.

- [x] T001 Create SpecKit artifacts in `specs/048-github-community-discovery/spec.md`
- [x] T002 Record package self-review in `specs/048-github-community-discovery/reviews/spec-package-self-review-2026-05-30.md`
- [x] T003 Record approved GitHub private vulnerability reporting path in `specs/048-github-community-discovery/reviews/security-contact-options-2026-05-30.md`
- [x] T004 Decide fallback alias policy in `specs/048-github-community-discovery/reviews/security-contact-options-2026-05-30.md`
- [x] T005 Record repository description, topic set, and Pages homepage proposal in `specs/048-github-community-discovery/reviews/github-metadata-proposal-2026-05-30.md`
- [x] T006 Record conduct policy choice in `specs/048-github-community-discovery/reviews/conduct-policy-decision-2026-05-30.md`
- [x] T007 Record GitHub private vulnerability reporting setting state in `specs/048-github-community-discovery/reviews/github-security-settings-2026-05-30.md`

---

## Phase 2: Foundational Community File Shape

**Purpose**: Prepare shared public routes and templates before GitHub settings
are applied.

- [x] T008 Add contribution scope and SpecKit workflow to `CONTRIBUTING.md`
- [x] T009 Add support boundary and no-SLA wording to `SUPPORT.md`
- [x] T010 Add shared issue-template config to `.github/ISSUE_TEMPLATE/config.yml`
- [x] T011 [P] Add bug report template to `.github/ISSUE_TEMPLATE/bug_report.yml`
- [x] T012 [P] Add feature request template to `.github/ISSUE_TEMPLATE/feature_request.yml`
- [x] T013 [P] Add evidence gap template to `.github/ISSUE_TEMPLATE/evidence_gap.yml`
- [x] T014 Add PR evidence and product-claim checklist to `.github/pull_request_template.md`

**Checkpoint**: Contributors can file useful issues and PRs without private
context, even if GitHub metadata settings are still pending.

---

## Phase 3: User Story 1 - Understand The Repository From GitHub (Priority: P1)

**Goal**: GitHub visitors can understand Portolan and find install/demo routes.

**Independent Test**: Open the public repository page and README first screen;
find purpose, install, demo, claims, contribution, and security routes in under
one minute.

- [x] T015 [US1] Update first-screen public route links in `README.md`
- [x] T016 [US1] Link community and security routes from `docs/onboarding.md`
- [x] T017 [US1] Add GitHub metadata application instructions to `specs/048-github-community-discovery/reviews/github-metadata-proposal-2026-05-30.md`
- [x] T018 [US1] Record applied GitHub description/topics/homepage state in `specs/048-github-community-discovery/reviews/github-metadata-closeout-2026-05-30.md`

**Checkpoint**: User Story 1 is independently useful when public visitors can
route themselves from README even if GitHub settings are not yet applied.

---

## Phase 4: User Story 2 - Evaluate Whether Contribution Is Welcome (Priority: P2)

**Goal**: Contributors can report issues and PRs with evidence discipline.

**Independent Test**: Fill one bug report and one PR template; both request
evidence states, verification, and product-claim impact.

- [x] T019 [US2] Add evidence-state examples to `CONTRIBUTING.md`
- [x] T020 [US2] Add baseline command expectations to `.github/pull_request_template.md`
- [x] T021 [US2] Add product-claim impact field to `.github/pull_request_template.md`
- [x] T022 [US2] Record template dry-run review in `specs/048-github-community-discovery/reviews/community-template-dry-run-2026-05-30.md`

**Checkpoint**: User Story 2 is independently useful when a new contributor can
open an issue or PR with enough evidence for maintainers to triage it.

---

## Phase 5: User Story 3 - Expose Security And Conduct Boundaries (Priority: P3)

**Goal**: Public security and conduct expectations are clear and bounded.

**Independent Test**: Open security and conduct guidance; confirm supported
versions, GitHub private vulnerability reporting, response expectations, and
conduct policy.

- [x] T023 [US3] Add GitHub private vulnerability reporting policy to `SECURITY.md`
- [x] T024 [US3] Add supported versions and best-effort response wording to `SECURITY.md`
- [x] T025 [US3] Add conduct guidance to `CODE_OF_CONDUCT.md`
- [x] T026 [US3] Record security wording review against `docs/product-claims.md` in `specs/048-github-community-discovery/reviews/security-claim-review-2026-05-30.md`

---

## Final Phase: Verification And Closeout

**Purpose**: Align public community state and evidence.

- [x] T027 Run `git diff --check` and record result in `specs/048-github-community-discovery/reviews/community-closeout-2026-05-30.md`
- [x] T028 Run `go test -count=1 ./...` and record result in `specs/048-github-community-discovery/reviews/community-closeout-2026-05-30.md`
- [x] T029 Run `jq empty .specify/feature.json schema/*.json` and record result in `specs/048-github-community-discovery/reviews/community-closeout-2026-05-30.md`
- [x] T030 Run public-claim wording scan over `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `SUPPORT.md`, `.github/`, and record result in `specs/048-github-community-discovery/reviews/community-closeout-2026-05-30.md`
- [x] T031 Record current GitHub metadata, badge, Scorecard, and community profile states, including `blocked` and `not_assessed`, in `specs/048-github-community-discovery/reviews/github-metadata-closeout-2026-05-30.md`
- [x] T032 Update `specs/048-github-community-discovery/spec.md` status
- [x] T033 Update `specs/048-github-community-discovery/tasks.md` completion ledger
- [x] T034 Update `docs/product-backlog.md` status row for P5-048

## Dependencies & Execution Order

- T005 blocks GitHub metadata application.
- T006 blocks `CODE_OF_CONDUCT.md`.
- T007 blocks final `SECURITY.md` verification, but `SECURITY.md` can record
  the setting as blocked if admin access is unavailable.
- User Story 1 can ship before contribution templates if metadata is approved.
- User Story 2 can ship before security policy if T007 remains blocked.

## Parallel Opportunities

- T011, T012, and T013 can run in parallel after T010.
- T019, T020, and T021 can run in parallel after T014.
- T027, T028, and T029 can run after all edits land.

## Implementation Strategy

1. Record metadata and conduct decisions.
2. Add lightweight community files and templates.
3. Link public routes from README and onboarding docs.
4. Add bounded security and conduct guidance.
5. Record every external GitHub setting as `verified`, `blocked`, or
   `not_assessed`.

## Post-Merge Follow-Up Boundary

The default-branch community profile cannot be verified from this branch before
merge. Recheck it during merge closeout with:

```bash
gh api repos/fcon-tech/portolan/community/profile
```
