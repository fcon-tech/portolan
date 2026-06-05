# Requirements And Product Vision Drift Review: Spec 084

Date: 2026-06-05

## Scope

- Backlog row: `docs/product-backlog.md` P6-084.
- SpecKit artifacts: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
  `quickstart.md`, `contracts/external-tool-profile.md`, and `tasks.md`.
- Product boundary: `docs/product-boundary.md`, `docs/product-claims.md`, and
  `.specify/memory/constitution.md`.

## Findings

| Area | Result | Evidence | Disposition |
| --- | --- | --- | --- |
| Requirements drift | verified: no blocking drift | FR-001 through FR-010 map to T006 through T018, with final verification in T019 through T023. | Accept |
| Product drift | verified: no blocking drift | The slice is documentation and bounded context guidance only; no external tool execution, installer, daemon, schema change, or graph evidence promotion is allowed. | Accept |
| Constitution drift | verified: no blocking drift | Local-first/read-only, evidence honesty, OSS composition, SpecKit-before-implementation, and test-first-for-behavior gates are explicitly covered in `plan.md`. | Accept |
| Status drift | verified: fixed | `spec.md`, `docs/product-backlog.md`, and `tasks.md` now agree that plan/tasks exist and implementation is not yet verified. | Fixed |
| Profile vocabulary drift | verified: fixed | `research.md`, `data-model.md`, `contracts/external-tool-profile.md`, and `plan.md` now state that profile roles are product-facing guidance and do not replace producer-family `Decision`/`SupportState` records. | Fixed |

## Decision

Spec 084 is ready for implementation. Implementation must stay limited to the
profile artifact and bounded context-pack guidance. Real CodeGraph,
Understand-Anything, and ast-index execution/output remains `not_assessed` and
out of scope.
