# Tasks: Cursor Enterprise Parity Validation

**Input**: Design documents from
`docs/specs/076-cursor-enterprise-parity-validation/`

## Phase 1: Setup And Planning Surface

- [x] T001 Create dedicated branch/worktree for spec 076.
- [x] T002 Update `.specify/feature.json` to point at spec 076.
- [x] T003 Update `AGENTS.md` SPECKIT pointer to spec 076 plan.
- [x] T004 Update `docs/product-backlog.md` and `docs/specs/076-cursor-enterprise-parity-validation/spec.md` from backlog-only to gated planning state.
- [x] T005 Create concrete `docs/specs/076-cursor-enterprise-parity-validation/plan.md`, `research.md`, `data-model.md`, `quickstart.md`, and `tasks.md`.
- [x] T006 Create spec-local execution gate, drift review, analyze disposition, planning review disposition, and shared Cursor prompt artifacts.
- [x] T028 Record PR #55 planning-gate review, merge authorization, squash merge, and remote branch cleanup in `docs/specs/076-cursor-enterprise-parity-validation/reviews/merge-closeout-2026-06-02.md`.

## Phase 2: Foundational Evidence Gate

- [x] T007 Reconstruct current state from `docs/specs/074-bigtop-runtime-topology-health-capture/reviews/approval-state-2026-06-02.md`, `docs/specs/075-bigtop-producer-output-coverage-closure/reviews/producer-coverage-matrix-2026-06-02.md`, `docs/specs/077-bigtop-callgraph-symbol-closure/reviews/graph-producer-decision-record-2026-06-02.md`, and the prior Bigtop stress report; classify each input evidence state in the 076 review ledger.
- [x] T008 Record whether spec 074 runtime-health evidence is present in `docs/specs/076-cursor-enterprise-parity-validation/reviews/execution-gate-2026-06-02.md`.
- [x] T009 If spec 074 remains blocked, stop default parity execution unless the user explicitly approves a current-evidence rejection run.
- [x] T010 Verify clean-start artifact rules and forbidden legacy paths in `docs/specs/076-cursor-enterprise-parity-validation/reviews/artifact-hygiene-ledger-2026-06-02.md`.
- [ ] T011 After any executed stress run, record transient artifact cleanup and residue state in `docs/specs/076-cursor-enterprise-parity-validation/reviews/artifact-hygiene-ledger-2026-06-02.md`.

## Phase 3: US1 - Fair Paired Cursor Stress (Priority: P1)

**Goal**: Produce comparable Cursor Composer 2.5 baseline and with-Portolan outputs over the same Bigtop prompt.

**Independent Test**: Both lane outputs exist, name the same prompt path, and the lane ledger records whether Portolan artifacts were allowed or forbidden.

- [ ] T012 [US1] Create fresh Bigtop artifact root under `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/<timestamp>-076-cursor-enterprise-parity/`.
- [ ] T013 [US1] Refresh Portolan context/map artifacts for the with-Portolan lane and validate generated JSON with `jq empty`.
- [ ] T014 [US1] Run Cursor Composer 2.5 baseline with Portolan artifacts forbidden and save output to `docs/specs/076-cursor-enterprise-parity-validation/stress/cursor-baseline-output-2026-06-02.md`.
- [ ] T015 [US1] Run Cursor Composer 2.5 with only fresh Portolan artifacts allowed and save output to `docs/specs/076-cursor-enterprise-parity-validation/stress/cursor-with-portolan-output-2026-06-02.md`.
- [ ] T016 [US1] Record lane validity, prompt parity, forbidden-path audit, and lane attestation in `docs/specs/076-cursor-enterprise-parity-validation/reviews/cursor-lane-ledger-2026-06-02.md`.

## Phase 4: US2 - Evidence-Gated C1-C9 Scoring (Priority: P1)

**Goal**: Score every parity criterion without upgrading agent prose beyond current evidence.

**Independent Test**: The scoring ledger has one row per C1-C9 criterion with evidence paths, score, blocker, and claim decision.

- [ ] T017 [US2] Freeze the C1-C9 rubric in `docs/specs/076-cursor-enterprise-parity-validation/reviews/parity-scoring-ledger-2026-06-02.md`.
- [ ] T018 [US2] Score Cursor baseline output against C1-C9 in `docs/specs/076-cursor-enterprise-parity-validation/reviews/parity-scoring-ledger-2026-06-02.md`.
- [ ] T019 [US2] Score Cursor-plus-Portolan output against C1-C9 in `docs/specs/076-cursor-enterprise-parity-validation/reviews/parity-scoring-ledger-2026-06-02.md`.
- [ ] T020 [US2] Record allowed, narrowed, rejected, `cannot_verify`, and `not_assessed` claim decisions in `docs/specs/076-cursor-enterprise-parity-validation/reviews/parity-scoring-ledger-2026-06-02.md`.

## Phase 5: US3 - Product Claim Closeout (Priority: P2)

**Goal**: Convert the result into reviewed claim boundaries, not unqualified parity language.

**Independent Test**: Review disposition and closeout separate local implementation, ready-for-review PR, ready-to-merge PR, and merge states.

- [ ] T021 [US3] Run three assessed independent non-GPT review lanes over claim upgrades or broad parity rejection.
- [ ] T022 [US3] Record accepted, rejected, fixed, `not_assessed`, and unresolved findings in `docs/specs/076-cursor-enterprise-parity-validation/reviews/review-disposition-2026-06-02.md`.
- [ ] T023 [US3] Update `docs/product-backlog.md`, `docs/specs/076-cursor-enterprise-parity-validation/spec.md`, and any product-claim surfaces touched by the scoring outcome.
- [ ] T024 [US3] Run baseline checks: `go test ./...`, `go vet ./...`, `jq empty schema/*.json`, and `git diff --check`.
- [ ] T025 [US3] Record PR readiness closeout in `docs/specs/076-cursor-enterprise-parity-validation/reviews/pr-readiness-closeout-2026-06-02.md`.
- [ ] T026 [US3] Create or update the PR and reconcile GitHub check state.
- [ ] T027 [US3] After explicit merge approval only, record merge closeout in `docs/specs/076-cursor-enterprise-parity-validation/reviews/merge-closeout-2026-06-02.md`.

## Dependencies & Execution Order

- Phase 1 is complete in this planning branch.
- PR #55 merged the planning gate on 2026-06-02; remaining open tasks are the
  execution/scoring/claim-closeout path, not PR #55 cleanup.
- The `2026-06-02` suffixes are planning-branch artifact names; if execution
  happens later, update or map output paths to the actual run id in the lane and
  scoring ledgers.
- Phase 2 blocks all Cursor stress execution.
- US1 depends on Phase 2 gate satisfaction.
- US2 depends on US1 outputs unless an explicitly approved current-evidence rejection run records that lane outputs are intentionally absent.
- US3 depends on US2 scoring or an explicit gate-blocked closeout.

## Parallel Opportunities

- T007 and T010 can be prepared in parallel because they read different evidence surfaces.
- T014 and T015 must not be run in parallel unless the operator can keep Cursor lane context isolated.
- Review lanes in T021 should run sequentially if using `pi`, per repo harness guidance.

## Implementation Strategy

1. Finish the gate and artifact-hygiene ledgers.
2. Stop if spec 074 runtime-health evidence remains absent and no current-evidence rejection approval exists.
3. If the gate is satisfied, run US1 paired lanes, then US2 scoring, then US3 review and PR closeout.
