# Tasks: Portolan Quality Boundary

**Input**: Design documents from `specs/051-portolan-quality-boundary/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/quality-boundary.md`, `quickstart.md`

## Phase 1: Quality Boundary Artifacts

- [ ] T001 Create or update the product quality boundary document.
- [ ] T002 Create or update the Portolan maturity matrix.
- [ ] T003 Add canonical guarantee and non-guarantee wording.
- [ ] T004 Record SDP Lab distillation in
  `specs/051-portolan-quality-boundary/reviews/`.
- [ ] T005 Run requirements/product-vision drift review.

## Phase 2: Report Quality Contract

- [ ] T006 Define required report-quality checks for sections, evidence refs,
  weak states, unsupported claims, and optional producer gaps.
- [ ] T007 Add failing fixtures for unsupported positive claims.
- [ ] T008 Add failing fixtures for hidden weak evidence states.
- [ ] T009 Add passing fixture for a thin but honest report.
- [ ] T010 Implement the smallest validation path that satisfies the contract,
  or record why this slice remains docs/fixtures only.

## Phase 3: Product Surface Alignment

- [ ] T011 Classify current user-facing CLI commands and artifacts.
- [ ] T012 Classify harness/static adapter surfaces separately from runtime
  readiness.
- [ ] T013 Align `docs/product-claims.md`, README wording, and agent docs with
  the quality boundary.
- [ ] T014 Add explicit dependency from UX/report spec 052 to this quality
  boundary.

## Final Phase: Verification And Closeout

- [ ] T015 Run `go test -count=1 ./...` if code changes exist.
- [ ] T016 Run `go vet ./...` if code changes exist.
- [ ] T017 Run `jq empty schema/*.json`.
- [ ] T018 Run `git diff --check`.
- [ ] T019 Update `docs/product-backlog.md` and this task ledger.
- [ ] T020 Record PR readiness closeout before claiming ready-for-review.

## Dependencies

- 051 is a prerequisite for treating 052 scan-report UX as product-ready.
- Docs-only quality boundaries may land before a CLI quality gate, but the gap
  must be explicit.
