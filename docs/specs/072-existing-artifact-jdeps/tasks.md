# Tasks: Bigtop Existing Artifact Jdeps

**Input**: Design documents from
`docs/specs/072-existing-artifact-jdeps/`

## Setup

- [x] T001 Create dedicated branch/worktree.
- [x] T002 Update `.specify/feature.json` to point at spec 072.
- [x] T003 Update `AGENTS.md` SPECKIT pointer to spec 072 plan.
- [x] T004 Add P6-072 to `docs/product-backlog.md`.
- [x] T005 Create `spec.md`, `plan.md`, and `tasks.md`.

## Producer Run

- [x] T006 Discover existing `.jar` and `.class` artifacts under spec 059 selected roots.
- [x] T007 Verify installed `jdeps` version.
- [x] T008 Run `jdeps` read-only over existing artifacts.
- [x] T009 Record producer ledger and evidence boundary.

## Stress And Review

- [x] T010 Run Cursor Composer 2.5 claim-boundary stress.
- [x] T011 Run three assessed independent non-GPT review lanes.
- [x] T012 Record review disposition and fix accepted findings.

## Closeout

- [ ] T013 Run baseline checks.
- [ ] T014 Record PR readiness closeout and update status surfaces.
- [ ] T015 Create PR and reconcile GitHub check state.
- [ ] T016 Record merge closeout and update post-merge status surfaces.
