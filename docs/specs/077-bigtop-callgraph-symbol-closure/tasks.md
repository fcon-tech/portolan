# Tasks: Bigtop Callgraph And Symbol Closure

**Input**: Design documents from
`docs/specs/077-bigtop-callgraph-symbol-closure/`

## Setup

- [x] T001 Create dedicated branch/worktree.
- [x] T002 Update `.specify/feature.json` to point at spec 077.
- [x] T003 Update `AGENTS.md` SPECKIT pointer to spec 077 plan.
- [x] T004 Update P6-077 backlog status.
- [x] T005 Create concrete `plan.md` and `tasks.md`.

## Review And Producer Decision

- [x] T006 Reconstruct requirements/product-vision drift from prior specs.
- [x] T007 Build graph producer decision record comparing mature local-first
  producers and rejecting native graph extraction unless justified.
- [x] T008 Probe installed producer availability without installing tools,
  network access, target mutation, or runtime service startup.
- [x] T009 Decide whether any available producer can emit bounded resolved
  symbol/reference/call graph evidence safely.

## Evidence Or Cannot Verify

- [x] T010 Confirm no safe resolved-graph producer is available; do not run a
  surrogate producer as full graph evidence.
- [x] T011 If no safe producer is available, record exact `cannot_verify`
  blockers and next approved action.
- [x] T012 Score C6/callgraph impact and update claim boundaries.

## Stress And Review

- [x] T013 Run Cursor Composer 2.5 callgraph/symbol claim-boundary stress.
- [x] T014 Run three assessed independent non-GPT review lanes.
- [x] T015 Record review disposition and fix accepted findings.

## Closeout

- [x] T016 Run baseline checks.
- [x] T017 Record PR readiness closeout and update status surfaces.
- [x] T018 Create PR and reconcile GitHub check state.
- [ ] T019 Record merge closeout and update post-merge status surfaces.
