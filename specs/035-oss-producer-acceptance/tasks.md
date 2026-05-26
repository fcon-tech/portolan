# Tasks: OSS Producer Acceptance

**Input**: Design documents from `specs/035-oss-producer-acceptance/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/producer-acceptance-ledger.md`, `quickstart.md`

**Tests**: This slice is validation/evidence work, not a runtime behavior
change. Tasks use local command verification and ledger checks instead of new Go
tests unless a CLI defect is found.

## Phase 1: Setup

- [x] T001 Create `specs/035-oss-producer-acceptance/reviews/` for evidence and dispositions.
- [x] T002 Record fixed-target preconditions for `/home/fall_out_bug/projects/bigtop-landscape`.
- [x] T003 Record local producer discovery for `jscpd`, `syft`, and `semgrep`.

## Phase 2: Contract And Safety

- [x] T004 Create the producer acceptance ledger contract.
- [x] T005 Record safety decision: no installation, no network-backed configs, no target mutation, output only under `/tmp/portolan-035-bigtop-context`.

## Phase 3: User Story 1 - Prove Local OSS Evidence Changes Answers

- [x] T006 Generate a Bigtop context pack at `/tmp/portolan-035-bigtop-context`.
- [x] T007 Validate `oss-plan.json` syntax.
- [x] T008 Install approved local producer tools: `jscpd`, `syft`, and `semgrep`.
- [x] T009 Classify evidence impact for duplicate/component/config answer families.
- [x] T010 Update product backlog and spec status with the partial producer acceptance result.
- [x] T014 Run Syft against Bigtop and record CycloneDX output summary.
- [x] T015 Fix `context prepare --force` so context-local producer outputs are preserved and detected on rerun.
- [x] T016 Record interrupted full `jscpd` run as unbounded default invocation, not verified output.

## Phase 4: Review And Verification

- [x] T011 Record implementation disposition and local review evidence.
- [x] T012 Run baseline checks: `go test ./...`, `jq empty schema/*.json`, and `git diff --check`.
- [x] T013 Record PR readiness boundary: local Syft/CycloneDX validation evidence exists, near-clone/Semgrep value remains unproven, and merge approval is `not_assessed`.
