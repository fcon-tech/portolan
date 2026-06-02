# Tasks: Bigtop Runtime Capture Execution

**Input**: Design documents from
`docs/specs/073-bigtop-runtime-capture-execution/`

## Setup

- [x] T001 Create dedicated branch/worktree.
- [x] T002 Update `.specify/feature.json` to point at spec 073.
- [x] T003 Update `AGENTS.md` SPECKIT pointer to spec 073 plan.
- [x] T004 Add P6-073 to `docs/product-backlog.md`.
- [x] T005 Create `spec.md`, `plan.md`, and `tasks.md`.

## Runtime Capture

- [x] T006 Record explicit user approval and approved command scope.
- [x] T007 Capture pre-create Docker and environment state.
- [x] T008 Execute approved single-node Bigtop Docker provisioner create.
- [x] T009 Capture Docker container/network/volume state and inspect output.
- [x] T010 Capture in-container Hadoop service and process status.
- [x] T011 Record runtime ledger and evidence boundary.
- [x] T012 Execute destroy cleanup and residue checks.

## Stress And Review

- [x] T013 Run Cursor Composer 2.5 claim-boundary stress.
- [x] T014 Run three assessed independent non-GPT review lanes.
- [x] T015 Record review disposition and fix accepted findings.

## Closeout

- [x] T016 Run baseline checks.
- [x] T017 Record PR readiness closeout and update status surfaces.
- [x] T018 Create PR and reconcile GitHub check state.
- [ ] T019 Record merge closeout and update post-merge status surfaces.
