# Status Reconstruction: Evidence Graph Diff

## Trigger

The user asked to take the nearest ready spec into implementation.

## Reconstructed State

- `docs/product-backlog.md` lists P1-006 as `future` with status `Idea`.
- `specs/006-evidence-diff/spec.md` exists and is marked `Backlog spec`.
- `specs/006-evidence-diff/plan.md` was absent at intake and has now been
  added to define the implementation contract.
- `specs/006-evidence-diff/tasks.md` was absent at intake and has now been
  added to define test-first implementation slices.
- No implementation review dispositions exist for this spec.

## Decision

P1-006 is the next roadmap slice after implemented P0/P1 work. It was not
implementation-ready at intake, but the missing plan and task ledger have now
been created. Implementation still requires pre-implementation review
disposition before code changes.

## Evidence Labels

- Backlog status: verified from `docs/product-backlog.md`.
- Spec status: verified from `specs/006-evidence-diff/spec.md`.
- Plan/tasks readiness at intake: failed; required files were absent.
- Plan/tasks readiness after reconstruction: verified; required files now
  exist.
- Runtime implementation readiness: not_assessed.

## Stop Point

Do not implement evidence diff until the pre-implementation review disposition
is recorded. After that, the next valid action is the test-first implementation
slice in `tasks.md`.
