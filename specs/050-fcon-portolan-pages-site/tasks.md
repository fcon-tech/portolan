# Tasks: FCON And Portolan GitHub Pages Site

**Input**: Design documents from `specs/050-fcon-portolan-pages-site/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/pages-site.md`, `quickstart.md`

**Tests**: Static preview/link inspection, product-claim scan, third-party risk
scan, GitHub Pages deployment evidence, and baseline checks.

**Organization**: Tasks are grouped by FCON entry point, Portolan project page,
and publishing safety.

## Phase 1: Setup And Decisions

**Purpose**: Decide site topology before building files or Pages workflows.

- [x] T001 Create SpecKit artifacts in `specs/050-fcon-portolan-pages-site/spec.md`
- [x] T002 Record site options in `specs/050-fcon-portolan-pages-site/reviews/site-options-2026-05-30.md`
- [x] T003 Record site repository decision in `specs/050-fcon-portolan-pages-site/reviews/pages-topology-decision-2026-05-31.md`
- [x] T004 Record default Pages URL versus custom domain policy in `specs/050-fcon-portolan-pages-site/reviews/pages-domain-decision-2026-05-31.md`
- [x] T005 Record GitHub Actions publishing decision in `specs/050-fcon-portolan-pages-site/reviews/pages-publishing-decision-2026-05-31.md`
- [x] T006 Record first-screen copy and visual direction approval in `specs/050-fcon-portolan-pages-site/reviews/pages-copy-direction-2026-05-31.md`
- [x] T006A Verify 047 install/release and 049 demo routes exist before drafting Portolan page links; record in `specs/050-fcon-portolan-pages-site/reviews/pages-dependency-check-2026-05-31.md`

---

## Phase 2: Foundational Site Skeleton

**Purpose**: Add a static site shell without adding analytics, forms, or runtime
dependencies.

- [x] T007 Add site README and local preview command to `docs/site/README.md`
- [x] T008 Add shared stylesheet to `docs/site/assets/site.css`
- [x] T009 Add no-tracking/no-forms implementation note to `docs/site/README.md`
- [x] T010 Add claim-source mapping note to `docs/site/README.md`

**Checkpoint**: The site can be reviewed as static files before any Pages
publishing configuration is enabled.

---

## Phase 3: User Story 1 - Land On A Credible FCON OSS Entry Point (Priority: P1)

**Goal**: Visitors understand FCON and reach Portolan quickly.

**Independent Test**: Open the FCON page locally and reach Portolan install/demo
routes in under one minute.

- [x] T011 [US1] Add FCON organization entry page to `docs/site/index.html`
- [x] T012 [US1] Add navigation from FCON entry page to Portolan page in `docs/site/index.html`
- [x] T013 [US1] Add grounded FCON positioning copy to `docs/site/index.html`
- [x] T014 [US1] Record first-screen review in `specs/050-fcon-portolan-pages-site/reviews/fcon-entry-review-2026-05-31.md`

**Checkpoint**: User Story 1 is useful when FCON has a credible public entry
point even before multiple projects exist.

---

## Phase 4: User Story 2 - Inspect Portolan Without Reading The Whole Repository (Priority: P2)

**Goal**: Portolan page explains product, install, demo, and limits.

**Independent Test**: Compare Portolan page claims with `docs/product-claims.md`.

- [x] T015 [US2] Add Portolan project page to `docs/site/portolan/index.html`
- [x] T016 [US2] Add install and release links to `docs/site/portolan/index.html`
- [x] T017 [US2] Add Apache Bigtop demo link and summary to `docs/site/portolan/index.html`
- [x] T018 [US2] Add product limits section tied to `docs/product-claims.md` in `docs/site/portolan/index.html`
- [x] T019 [US2] Add GitHub, contribution, and security links to `docs/site/portolan/index.html`
- [x] T020 [US2] Record site claim scan in `specs/050-fcon-portolan-pages-site/reviews/portolan-page-claim-scan-2026-05-31.md`

**Checkpoint**: User Story 2 is useful when an evaluator can understand
Portolan's value and limits without reading the whole repository.

---

## Phase 5: User Story 3 - Publish With Low Operational Risk (Priority: P3)

**Goal**: Site deployment is static, inspectable, and evidence-labelled.

**Independent Test**: Inspect Pages source, deployment URL, domain/HTTPS state,
and absence of analytics/forms/tracking.

- [x] T021 [US3] Add Pages publishing configuration to `.github/workflows/pages.yml`
- [x] T022 [US3] Record domain, DNS, and HTTPS state in `specs/050-fcon-portolan-pages-site/reviews/pages-domain-closeout-2026-05-31.md`
- [x] T023 [US3] Record third-party script/form/analytics scan in `specs/050-fcon-portolan-pages-site/reviews/pages-risk-scan-2026-05-31.md`
- [x] T024 [US3] Record local preview or deployment smoke in `specs/050-fcon-portolan-pages-site/reviews/pages-preview-closeout-2026-05-31.md`

---

## Final Phase: Verification And Closeout

**Purpose**: Align site state and evidence.

- [x] T025 Run product-claim scan over `docs/site/`, `README.md`, and `docs/product-claims.md`; record result in `specs/050-fcon-portolan-pages-site/reviews/pages-closeout-2026-05-31.md`
- [x] T026 Run third-party risk scan over `docs/site/` and `.github/workflows/`; record result in `specs/050-fcon-portolan-pages-site/reviews/pages-closeout-2026-05-31.md`
- [x] T027 Run local static preview or record blocker in `specs/050-fcon-portolan-pages-site/reviews/pages-closeout-2026-05-31.md`
- [x] T028 Run `git diff --check` and record result in `specs/050-fcon-portolan-pages-site/reviews/pages-closeout-2026-05-31.md`
- [x] T029 Run baseline `go test -count=1 ./...` as a repository guard even though the feature is static-site only; record result in `specs/050-fcon-portolan-pages-site/reviews/pages-closeout-2026-05-31.md`
- [x] T030 Run baseline `jq empty schema/*.json` as a repository guard; record result in `specs/050-fcon-portolan-pages-site/reviews/pages-closeout-2026-05-31.md`
- [x] T031 Record Pages deployment and domain evidence in `specs/050-fcon-portolan-pages-site/reviews/pages-closeout-2026-05-31.md`
- [x] T032 Update `specs/050-fcon-portolan-pages-site/spec.md` status
- [x] T033 Update `specs/050-fcon-portolan-pages-site/tasks.md` completion ledger
- [x] T034 Update `docs/product-backlog.md` status row for P5-050

## Dependencies & Execution Order

- T003, T004, and T005 block Phase 2 and publishing implementation.
- T006 blocks Phase 3 first-screen copy.
- T006A blocks User Story 2 install, release, and demo links.
- User Story 2 depends on stable 047 install/release and 049 demo routes.
- User Story 3 must complete before claiming the site is published.

## Parallel Opportunities

- T011 and T015 can be drafted in parallel after T006.
- T025 and T026 can run together after site files exist.
- T028, T029, and T030 can run after all site edits land.

## Implementation Strategy

1. Choose topology, URL policy, and publishing source.
2. Build static FCON and Portolan pages.
3. Link only canonical repository docs and demo routes.
4. Publish through GitHub Pages or record the blocker.
5. Record deployment, domain, HTTPS, privacy, and claim evidence.
