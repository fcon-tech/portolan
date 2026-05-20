# Pre-Implementation Review Disposition: Evidence Graph Diff

## Scope Reviewed

- `.specify/memory/constitution.md`
- `docs/product-backlog.md`
- `specs/006-evidence-diff/spec.md`
- `specs/006-evidence-diff/plan.md`
- `specs/006-evidence-diff/tasks.md`
- Current CLI and graph package shape in `internal/app` and `internal/graph`

## Status Reconstruction

- Backlog row: P3-006 is the next roadmap gap after implemented P0/P1-005, but
  was still marked as `future` / `Idea`.
- Spec status: `Backlog spec`.
- Plan/tasks: created during this intake because they were missing.
- Existing implementation: not_assessed beyond current command and graph shape.

## Findings

### major: P3-006 was not ready at intake

The spec existed, but the required `plan.md` and `tasks.md` were absent.

Disposition: accepted and fixed before implementation. The plan and task ledger
now define a bounded, test-first slice.

### major: Diff must not become readiness scoring

Evidence-state transitions can be tempting to label as improvement or
degradation, but the product boundary forbids readiness gates and unverified
interpretation.

Disposition: accepted. The plan and tasks require machine-readable transition
data only and regression tests against readiness/pass/fail/degradation fields.

### minor: Edge identity is intentionally narrow

The current graph edge shape has no explicit edge id. Comparing by `from`,
`to`, and `kind` is the smallest coherent implementation, but duplicate
same-kind edges may need richer identity later.

Disposition: accepted as a documented risk. No schema migration in this slice.

## External Review Lanes

- `kimi-coding/kimi-for-coding`: not_assessed before first implementation
  slice.
- `minimax/MiniMax-M2.7`: not_assessed before first implementation slice.
- `zai/glm-5.1`: not_assessed before first implementation slice.

These lanes remain required after the implementation slice unless the slice is
reclassified as documentation-only. This slice is code-bearing.

## Ready For Implementation

P3-006 is ready to enter the first implementation slice after this review
because:

- spec, plan, and tasks now exist;
- the slice keeps local-first/read-only defaults;
- no new dependency is required;
- tests precede behavior changes;
- readiness/verdict language is explicitly out of scope.
