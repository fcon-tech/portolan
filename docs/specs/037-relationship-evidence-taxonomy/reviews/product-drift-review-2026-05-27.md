# Product Drift Review: 037 Relationship Evidence Taxonomy

**Date**: 2026-05-27

## Product Surfaces

- `AGENTS.md`
- `.specify/memory/constitution.md`
- `docs/product-backlog.md`
- `docs/product-boundary.md`
- `docs/mvp.md`
- `docs/speckit-workflow.md`
- `docs/evidence-model.md`
- `docs/relationship-detection.md`

## Product Alignment

| Product Rule | Assessment | Disposition |
| --- | --- | --- |
| Local-first and read-only defaults | No network calls, daemons, credentials, or target mutation added. | aligned |
| Evidence-state honesty | `source-visible`, `metadata-visible`, `runtime-visible`, `claim-only`, `unknown`, `cannot_verify`, and `not_assessed` are preserved. | aligned |
| Complement, do not replace | OSS outputs remain imported evidence candidates; no native scanner was added. | aligned |
| Agent-facing toolbox | Generated `answer-contract.md` now carries the taxonomy where agents read before answering. | aligned |
| Product boundary | Portolan still prepares evidence-backed context; it does not become readiness gate or service-catalog replacement. | aligned |

## Product Drift Findings

No blocking product drift found after fixes. The slice narrows product language
and reduces overclaim risk without expanding Portolan's scanner or platform
scope.
