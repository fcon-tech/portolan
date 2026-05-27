# Pre-Implementation Review Disposition

## Scope Reconstruction

- Backlog row: `P4-036` was `Specified`.
- Spec status before this review: `Draft`.
- Required implementation artifacts before this review: missing `plan.md` and
  `tasks.md`.
- Existing implementation evidence: root mapping already emits visible
  repository records, repo-like unknown records, non-repository not-assessed
  records, and `external-completeness` as `unknown`.

## Findings

| ID | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| PRE-001 | major | Immediate implementation was blocked because `plan.md` and `tasks.md` were absent. | accepted/fixed by adding plan, research, data model, contract, quickstart, and tasks before code changes |
| PRE-002 | major | The spec requires an `extra` classification, but `coverage.schema.json` does not allow `extra`. | accepted; tracked as T003 |
| PRE-003 | minor | A new command would duplicate the existing `coverage.json` contract. | rejected alternative; plan uses existing selection plus corpus manifest flow |

## Review Evidence

- Local repo-grounded review: verified by direct inspection of `internal/coverage`,
  `internal/maprun`, `schema/coverage.schema.json`, and app tests.
- Model review lanes: not_assessed before planning artifacts existed. They must
  run after the first implementation slice.

## Decision

Proceed to implementation after these planning artifacts are committed in the
working tree.
