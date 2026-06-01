# Tasks: Portolan Quality Boundary

**Input**: Design documents from `specs/051-portolan-quality-boundary/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/quality-boundary.md`, `quickstart.md`

## Phase 1: Quality Boundary Artifacts

- [x] T001 Create or update the product quality boundary document.
- [x] T002 Create or update the Portolan maturity matrix.
- [x] T003 Add canonical guarantee and non-guarantee wording.
- [x] T004 Record SDP Lab distillation in
  `specs/051-portolan-quality-boundary/reviews/`.
- [x] T005 Run requirements/product-vision drift review.

## Phase 2: Report Quality Contract

Phase 2 depends on the quality boundary and maturity matrix from T001-T002.

- [x] T006 Define required report-quality checks for sections, evidence refs,
  weak states, unsupported claims, and optional producer gaps in
  `docs/report-quality.md` and `schema/report-quality-summary.schema.json`.
- [x] T007 Add failing fixtures for unsupported positive claims.
- [x] T008 Add failing fixtures for hidden weak evidence states.
- [x] T009 Add passing fixture for a thin but honest report.
- [x] T010 Implement the smallest validation path that satisfies the contract.

## Phase 3: Product Surface Alignment

- [x] T011 Classify current user-facing CLI commands and artifacts.
- [x] T012 Classify harness/static adapter surfaces separately from runtime
  readiness.
- [x] T013 Align `docs/product-claims.md`, README wording, and agent docs with
  the quality boundary.
- [x] T014 Add explicit dependency from future UX/report work to this quality
  boundary.

## Final Phase: Verification And Closeout

- [x] T015 Run `go test -count=1 ./...` if code changes exist.
- [x] T016 Run `go vet ./...` if code changes exist.
- [x] T017 Run `jq empty schema/*.json`.
- [x] T018 Run `git diff --check`.
- [x] T019 Update `docs/product-backlog.md` and this task ledger.
- [x] T020 Record PR readiness closeout before claiming ready-for-review.

## Dependencies

- 051 is a prerequisite for treating 052 scan-report UX as product-ready.
- The CLI quality gate is included in this slice; UX/report work must use it
  or explicitly mark report quality as `not_assessed`.
