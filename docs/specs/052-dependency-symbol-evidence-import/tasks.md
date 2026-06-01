# Tasks: Dependency And Symbol Evidence Import

**Input**: Design documents from
`docs/specs/052-dependency-symbol-evidence-import/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/relationship-evidence-import.md`, `quickstart.md`

**Tests**: Required for behavior changes before implementation edits.

## Phase 1: Setup And Reviews

- [x] T001 Create requirements/product-vision drift review in
  `docs/specs/052-dependency-symbol-evidence-import/reviews/`.
- [x] T002 Record analyze or manual cross-artifact consistency disposition in
  `docs/specs/052-dependency-symbol-evidence-import/reviews/`.
- [x] T003 Verify branch/spec/backlog metadata agree before code edits.

## Phase 2: Dependency Evidence Import (P1)

- [x] T004 [P1] Add focused failing test showing selection dependency/CycloneDX
  producer output becomes relationship evidence with source refs, repository
  scope, and no runtime-topology claim.
- [x] T005 [P1] Ensure dependency evidence findings are relationship findings
  with repository scope, evidence family, and no runtime-topology claim.
- [x] T006 [P1] Ensure malformed or oversized dependency producer output is
  `cannot_verify` and does not count as assessed relationship evidence.

## Phase 3: Symbol Evidence Import (P1)

- [x] T007 [P1] Add selection schema and validation support for a
  symbol-index-style tool output kind if needed.
- [x] T008 [P1] Add focused failing test showing symbol-index producer output
  contributes bounded relationship evidence, including a mixed-language
  PHP/JVM-style fixture.
- [x] T009 [P1] Implement symbol-index tool-output normalization without
  claiming a complete call graph.
- [x] T010 [P1] Ensure absent symbol producer output remains visible as
  `not_assessed` in findings or gaps, while present malformed symbol evidence
  becomes `cannot_verify`.

## Phase 4: Agent Gap And Bounded Summary Surface (P2)

- [x] T011 [P2] Add or update bounded relationship-evidence summary records for
  map/context consumers.
- [x] T012 [P2] Update `evidence-index.jsonl` and `gaps.jsonl` expectations so
  dependency/symbol gaps point to local producer evidence families.
- [x] T013 [P2] Update answer-contract or agent guidance to forbid
  per-language scanner ownership claims.

## Phase 5: Clean Stress Protocol (P2)

- [x] T014 [P2] Add stress-ledger guidance that no-Portolan lanes must exclude
  `.portolan/` and root-level `run/`; this slice treats baseline
  contamination as runbook/test hygiene, not an implicit maprun mutation of the
  target tree.
- [x] T015 [P2] Record a clean-start Cursor + Composer 2.5 stress prompt or
  runbook under the spec reviews directory.
- [x] T016 [P2] If a Cursor lane is run, record accessed-artifact boundaries
  and mark contaminated lanes explicitly.

## Phase 6: Clean Baseline Comparison Correction (P2)

- [x] T024 [P2] Record the contaminated no-Portolan baseline and clean
  no-Portolan rerun boundary under `reviews/`.
- [x] T025 [P2] Add a failing context-pack test for source-visible
  build/deploy relationship-candidate records.
- [x] T026 [P2] Implement bounded build/deploy relationship-candidate records
  in `evidence-index.jsonl` without parsing or claiming service topology.
- [x] T027 [P2] Update answer-contract/query-plan guidance so agents inspect
  build/deploy candidates before raw source and preserve semantic gaps.
- [x] T028 [P2] Run focused tests for the context-pack correction.

## Phase 7: Clean Producer Output Exclusion (P2)

- [x] T029 [P2] Detect and record that root-level Syft runs can include
  stale `.portolan/stress` artifacts unless producer commands exclude them.
- [x] T030 [P2] Update the generated Syft OSS plan command to exclude
  `./.portolan/**` and `./run/**`.
- [x] T031 [P2] Add focused OSS-plan test coverage for Syft clean-start
  exclusions.
- [x] T032 [P2] Remove the failed absolute-exclude stress run and rerun Bigtop
  stress from a clean start with Syft exclusions.
- [x] T033 [P2] Rerun Cursor + Composer 2.5 against the final clean stress run.

## Final Phase: Verification And Closeout

- [x] T017 Run focused Go tests for changed packages.
- [x] T018 Run `go test -count=1 ./...`.
- [x] T019 Run `go vet ./...`.
- [x] T020 Run `jq empty schema/*.json internal/testfixtures/oss-adapter-contract/*.json`.
- [x] T021 Run `git diff --check`.
- [x] T022 Update `docs/product-backlog.md`, `spec.md`, and this task ledger to
  match implementation state.
- [x] T023 Record implementation/review disposition before PR readiness.

## Dependencies

- 051 quality boundary remains the gate for positive relationship claims.
- UX/report polish must wait until this slice either improves relationship
  evidence or records the remaining evidence gap. Current stress improved
  dependency evidence through local CycloneDX/Syft producer output; symbol,
  service, and runtime relationship gaps remain evidence-production gaps.
