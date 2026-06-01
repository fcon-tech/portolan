# Tasks: Language Agnostic Evidence Producers

**Input**: Design documents from
`docs/specs/053-language-agnostic-producers/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/producer-family-evaluation.md`, `quickstart.md`

**Tests**: Required for behavior changes before implementation edits.

## Phase 1: Setup And Reviews

- [x] T001 Create requirements/product-vision drift review in
  `docs/specs/053-language-agnostic-producers/reviews/`.
- [x] T002 Record analyze or manual cross-artifact consistency disposition in
  `docs/specs/053-language-agnostic-producers/reviews/`.
- [x] T003 Verify stacked branch/base status against PR #29 and record whether
  implementation may proceed before PR #29 merges.
- [x] T003A Refresh stacked implementation gate after PR #29 current-head
  navigation stress and status-only readiness closeout update.
- [x] T003B Refresh post-merge implementation gate after PR #29 merged and 053
  was rebased onto `main`.

## Phase 2: Foundational Contract

- [x] T004 [P] Add producer recommendation/evaluation fixture files under
  `internal/testfixtures/language-agnostic-producers/`.
- [x] T005 [P] Add `schema/producer-family.schema.json` or equivalent
  allow-listed contract validation for producer-recommendation,
  producer-evaluation, and producer-coverage records.
- [x] T006 Add answer-contract wording expectations that recommendations are
  not evidence and per-language scanner ownership is not implied.
- [x] T006A Add contract tests that reject plain-string `candidate_tools`,
  undeclared runtime-topology/native-language-semantics fields, and accepted or
  narrowed candidates without local evaluation evidence.

## Phase 3: User Story 1 - Choose Producer Families By Evidence Need (P1)

**Goal**: Agents see producer-family recommendations for blocked claims without
per-language adapter recommendations.

**Independent Test**: A mixed fixture context pack names missing producer
families and blocked claims while preserving `not_assessed`.

- [x] T007 [P] [US1] Add failing context-preparation test for producer-family
  recommendation records in `internal/app/app_test.go`.
- [x] T007A [P] [US1] Add fixture coverage proving weak states survive
  recommendation generation without upgrade to observed evidence.
- [x] T008 [US1] Implement bounded producer recommendation records in
  `internal/contextprep/`.
- [x] T009 [US1] Ensure recommendation records map blocked claims to evidence
  families rather than PHP/JVM/Scala adapter names, and represent candidates as
  objects with `verification_state` and `support_state`.
- [x] T010 [US1] Update `answer-contract.md` generation to state that producer
  recommendations are options, not observed evidence.

## Phase 4: User Story 2 - Compare OSS Producers Before Adoption (P2)

**Goal**: Candidate producers can be reviewed before Portolan presents them as
supported or default.

**Independent Test**: At least two producer-family candidates are represented
with fit, output contract, local execution, license, maintenance, privacy, and
integration-cost decisions.

- [x] T011 [P] [US2] Add failing fixture or unit test for accepted, narrowed,
  rejected, blocked, and `not_assessed` producer-evaluation states.
- [x] T012 [US2] Implement producer evaluation normalization or fixture loading
  in the smallest existing artifact path; do not score, rank, probe, install,
  or run producer tools.
- [x] T013 [US2] Ensure risky defaults with network, credentials, daemon,
  mutation, or source export are rejected, blocked, or narrowed.
- [x] T014 [US2] Record candidate evaluation examples for at least two
  producer families under the spec reviews or fixtures.

## Phase 5: User Story 3 - Keep Mixed-Language Coverage Honest (P3)

**Goal**: Agents can see assessed, partial, blocked, unknown,
`cannot_verify`, and `not_assessed` coverage by repository and producer family.

**Independent Test**: A mixed fixture emits a coverage matrix where dependency,
symbol, API/catalog/model, and runtime evidence states remain separate.

- [x] T015 [P] [US3] Add failing test for producer-family coverage matrix
  records by repository in `internal/app/app_test.go`.
- [x] T015A [P] [US3] Add mixed-language partial coverage fixture with
  repository, subdirectory/component, and `languages_in_scope` expectations.
- [x] T016 [US3] Implement coverage matrix record generation in the selected
  context or evidence-index artifact.
- [x] T017 [US3] Ensure partial subdirectory or single-family evidence does not
  become repository-wide or landscape-wide coverage.
- [x] T018 [US3] Update gaps/query guidance so agents inspect the coverage
  matrix before making mixed-language architecture claims.

## Final Phase: Verification And Closeout

- [x] T019 Run focused Go tests for changed packages.
- [x] T020 Run `go test -count=1 ./...`.
- [x] T021 Run `go vet ./...`.
- [x] T022 Run `jq empty schema/*.json internal/testfixtures/oss-adapter-contract/*.json internal/testfixtures/language-agnostic-producers/*.jsonl .specify/feature.json`.
- [x] T023 Run `git diff --check`.
- [x] T024 Run `go run ./cmd/portolan context prepare --help`.
- [x] T025 If a Cursor + Composer 2.5 stress lane is run, record clean-start
  artifact boundaries and remove contaminated run outputs. Not run for this
  local implementation slice; no Cursor stress artifacts were created.
- [x] T026 Update `docs/product-backlog.md`, `spec.md`, and this task ledger to
  match implementation state.
- [x] T027 Record implementation/review disposition before PR readiness.

## Dependencies

- This spec was stacked after PR #29/spec 052 during planning. PR #29 is now
  merged and this branch has been rebased onto `main`.
- Implementation should not update PR #29.
- Implementation may proceed from T004 after the post-merge gate refresh.
- UX/report polish remains downstream of evidence-family coverage and should
  not begin until this producer-family contract is either implemented or
  explicitly deferred.
