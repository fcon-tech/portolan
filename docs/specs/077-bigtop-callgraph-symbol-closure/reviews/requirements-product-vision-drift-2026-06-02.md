# Requirements And Product-Vision Drift Review

Spec: `docs/specs/077-bigtop-callgraph-symbol-closure/`

Date: 2026-06-02

## Inputs Reviewed

- `docs/product-backlog.md` P6-075 through P6-077.
- `docs/specs/077-bigtop-callgraph-symbol-closure/spec.md`.
- `docs/specs/077-bigtop-callgraph-symbol-closure/plan.md`.
- `docs/specs/077-bigtop-callgraph-symbol-closure/tasks.md`.
- `docs/specs/064-bigtop-def-ref-producer-probe/reviews/def-ref-probe-ledger-2026-06-02.md`.
- `docs/specs/070-bigtop-ctags-import-references/reviews/ctags-import-reference-ledger-2026-06-02.md`.
- `docs/specs/071-bigtop-ctags-cross-language-imports/reviews/ctags-cross-language-ledger-2026-06-02.md`.
- `docs/specs/075-bigtop-producer-output-coverage-closure/reviews/producer-coverage-matrix-2026-06-02.md`.

## Requirements Fit

verified:

- P6-077 owns the full symbol/reference/call graph gap explicitly created by
  spec 075.
- The spec keeps the broad C6/callgraph claim at `cannot_verify` unless
  resolved graph evidence exists and review accepts the upgrade.
- The plan starts with mature OSS/tool outputs and avoids native Portolan graph
  extraction.

not_assessed:

- Actual graph producer output; this requires availability and safe execution
  checks.

## Product Boundary Fit

verified:

- The slice preserves local-first and read-only defaults.
- The slice does not start services, fetch dependencies, install indexers,
  mutate target repositories, or use credentials.
- The slice treats missing indexers/build prerequisites as valid
  `cannot_verify` evidence rather than forcing a claim upgrade.

## Drift Findings

| Finding | Severity | Disposition |
| --- | --- | --- |
| Running Cursor parity before this slice would preserve the wrong uncertainty: C6/callgraph would remain `cannot_verify` for known reasons. | major | addressed by starting 077 before 076 |
| Prior Ctags/gopls/jdeps outputs are useful but bounded; they cannot be relabeled as full graph evidence. | major | preserved in plan and tasks |
| A full graph producer may require installation, build execution, or target mutation. | major | out of scope unless separately approved |

## Decision

Proceed with read-only producer availability and decision-record work. Do not
implement Portolan graph extraction in this slice.
