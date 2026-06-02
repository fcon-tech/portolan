# Tasks: Bigtop Runtime Topology Health Capture

**Input**: Design documents from
`docs/specs/074-bigtop-runtime-topology-health-capture/`

## Setup

- [x] T001 Create dedicated branch/worktree.
- [x] T002 Update `.specify/feature.json` to point at spec 074.
- [x] T003 Update `AGENTS.md` SPECKIT pointer to spec 074 plan.
- [x] T004 Add P6-074, P6-075, and P6-076 to `docs/product-backlog.md`.
- [x] T005 Create `spec.md`, `plan.md`, and `tasks.md`.

## Pre-Implementation Review

- [x] T006 Reconstruct requirements/product-vision drift from specs 073 and 074.
- [x] T007 Run pre-execution review of the approved command sequence and health criteria.
- [x] T008 Record approval state. If approval is absent for the new runtime command sequence, stop with `blocked`/`not_assessed` runtime execution state.

## Runtime Health Capture

- [ ] T009 Capture pre-run Docker/environment/target-repo state.
- [ ] T010 Execute the approved bounded runtime create/provision sequence.
- [ ] T011 Capture Docker inspect, service state, process state, listening ports, and daemon logs.
- [ ] T012 Run bounded HDFS/YARN/MapReduce smoke probes when service health allows.
- [ ] T013 Execute destroy cleanup and residue checks.
- [ ] T014 Record runtime topology health ledger and classify topology as `verified`, `failed`, or `cannot_verify`.

## Stress And Review

- [ ] T015 Run Cursor Composer 2.5 topology claim-boundary stress.
- [ ] T016 Run three assessed independent non-GPT review lanes.
- [ ] T017 Record review disposition and fix accepted findings.

## Closeout

- [ ] T018 Run baseline checks.
- [ ] T019 Record PR readiness closeout and update status surfaces.
- [ ] T020 Create PR and reconcile GitHub check state.
- [ ] T021 Record merge closeout and update post-merge status surfaces.
