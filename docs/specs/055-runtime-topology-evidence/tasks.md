# Tasks: Runtime Topology Evidence

**Input**: Design documents from `docs/specs/055-runtime-topology-evidence/`

**Prerequisites**: `spec.md`, `plan.md`, pre-implementation analyze

**Tests**: Required before behavior changes because this slice changes runtime
evidence semantics.

## Phase 1: Setup

- [x] T001 Confirm `.specify/feature.json` points to `docs/specs/055-runtime-topology-evidence`
- [x] T002 Update AGENTS.md SpecKit pointer to `docs/specs/055-runtime-topology-evidence/plan.md`
- [x] T003 Record pre-implementation analyze under `docs/specs/055-runtime-topology-evidence/reviews/`

## Phase 2: User Story 1 - Import Runtime-Visible Observations

- [x] T004 Add runtime observation fixtures under `internal/testfixtures/runtime-topology-evidence/`
- [x] T005 Add maprun tests proving top-level runtime observations emit `runtime-visible` edges
- [x] T006 Add negative tests for malformed, unsafe, or partial runtime observations
- [x] T007 Implement top-level runtime observation import in `internal/maprun/`

## Phase 3: User Story 2 - Preserve Static/Runtime Boundaries

- [x] T008 Add fixture map coverage that static tool outputs do not become runtime-visible
- [x] T009 Update docs/runtime-observations.md for top-level `selection.runtime`
- [x] T010 Run fixture map smoke and record evidence under reviews/

## Phase 4: User Story 3 - Cursor Runtime Stress

- [x] T011 Run Bigtop runtime-source reconstruction and record whether runtime evidence is verified, blocked, or `not_assessed`
- [x] T012 Run Cursor Composer 2.5 against a fresh runtime-aware bundle and record supported/unsupported claims
- [x] T013 Update spec/backlog status with verified, blocked, and `not_assessed` states

## Final Phase: PR Readiness

- [x] T014 Run full local verification: `go test -count=1 ./...`, `go vet ./...`, `jq empty schema/*.json`, `git diff --check`
- [x] T015 Run independent review lanes and record disposition
- [x] T016 Create or update PR and record PR readiness closeout

## Implementation Strategy

1. Implement top-level runtime observation import for map bundles.
2. Verify runtime/static evidence separation locally.
3. Reconstruct Bigtop runtime evidence availability honestly.
4. Run Cursor only after fresh runtime artifacts exist or the Bigtop gap is
   explicitly recorded.
