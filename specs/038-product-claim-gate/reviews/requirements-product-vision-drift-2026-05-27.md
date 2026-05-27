# Requirements And Product Vision Drift: Product Claim Gate

Date: 2026-05-27

## Inputs

- `AGENTS.md`
- `.specify/memory/constitution.md`
- `docs/product-backlog.md`
- `docs/mvp.md`
- `docs/product-boundary.md`
- `specs/038-product-claim-gate/spec.md`
- `specs/038-product-claim-gate/plan.md`
- `specs/038-product-claim-gate/tasks.md`

## Decision Gate

- Simpler/Faster: Use spec-local ledger and answer files. No new command,
  dependency, service, or evaluator.
- Blocking Edge Cases: Claim scope can differ across headless Cursor, UI
  Cursor/Composer, fixed Bigtop, local repository roots, full ecosystem
  completeness, runtime topology, and OSS producer families.
- Existing Open Source: Evaluation frameworks and product analytics tools are
  unnecessary for this first local evidence gate; markdown/jsonl records match
  the existing SpecKit review workflow.

## Requirements Drift

| Area | Assessment | Disposition |
| --- | --- | --- |
| FR-001 product claim ledger | Covered by T009-T012 and contract. | aligned |
| FR-002 allowed statuses | Covered by plan, data model, contract, and T009-T012. | aligned |
| FR-003 evidence for accepted/narrowed claims | Covered by data model, contract, and US1 independent test. | aligned |
| FR-004 implementation alone is not product proof | Covered by plan, research, contract, and ledger rules. | aligned |
| FR-005 client-safe answer from accepted/narrowed claims | Covered by T013-T015. | aligned |
| FR-006 backlog updates when claims change scope | Covered by T012 and T018. | aligned |

No blocking requirements drift found.

## Product Vision Drift

| Product Rule | Assessment | Disposition |
| --- | --- | --- |
| Local-first/read-only | The slice reads local repo artifacts and writes under the spec directory. | aligned |
| Evidence-state honesty | The ledger preserves `not_assessed`, `blocked`, `failed`, `unknown`, and narrowed states. | aligned |
| Complement, do not replace | The answer positions Portolan as an agent context/evidence aid, not a Cursor or enterprise-tool replacement. | aligned |
| Not a readiness gate | The client-safe answer must not claim readiness or merge/procurement authority. | aligned |
| OSS composition posture | Syft/CycloneDX may be claimed only for component identity evidence; jscpd and Semgrep remain limited. | aligned |

## SpecKit Pipeline Drift

- `/speckit-clarify`: skipped; ambiguity is non-blocking because the spec
  already defines statuses, user stories, edge cases, and success criteria.
- `/speckit-plan`: manually executed because branch-prefix script drift selected
  the wrong feature directory.
- `/speckit-tasks`: manually executed for the same branch-prefix reason.
- `/speckit-analyze`: manually performed and recorded in
  `analyze-disposition-2026-05-27.md`.
- `/speckit-review-disposition`: represented by this file and the
  implementation/review dispositions in this spec-local `reviews/` directory.

## Not Assessed

- External client interviews or product-market claims beyond repo evidence.
- UI Cursor/Composer behavior after the current validation cycle.
- Whether the client-safe answer is persuasive to a real buyer.
