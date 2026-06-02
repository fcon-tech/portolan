# Feature Specification: Bigtop Callgraph And Symbol Closure

**Feature Branch**: TBD

**Created**: 2026-06-02

**Status**: Backlog-only

**Input**: Spec 075 confirmed that Universal Ctags and selected gopls outputs
provide bounded symbol/reference evidence for Bigtop, but they do not prove a
resolved full def/use graph or call graph. This slice owns the next closure
attempt so the gap is not hidden inside Cursor parity validation.

## Requirements

- **FR-001**: Identify mature local-first, read-only producers or build outputs
  that can emit resolved symbol, reference, dependency, or call edges for the
  relevant Bigtop languages.
- **FR-002**: Prefer importing and normalizing existing OSS/tool outputs over
  implementing graph extraction in Portolan.
- **FR-003**: Preserve per-language and per-root scope boundaries; do not infer
  full graph coverage from partial producer output.
- **FR-004**: Classify missing build prerequisites, unsupported languages,
  unresolved edges, and producer limits as `partial`, `cannot_verify`, or
  `not_assessed`.
- **FR-005**: Record a reviewed decision if full callgraph closure is not
  feasible within Portolan's local-first/read-only boundary.

## Success Criteria

- **SC-001**: A graph producer decision record compares existing OSS/tool
  outputs, integration cost, maintenance risk, and local-first/read-only fit.
- **SC-002**: Any produced graph output is tied to command evidence, schema or
  ledger paths, input roots, and known incompleteness.
- **SC-003**: Full C6/call-graph parity claims remain rejected unless resolved
  graph evidence exists and independent review accepts the claim upgrade.

## Dependencies

- Spec 075 producer output coverage closure.
