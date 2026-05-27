# Spec Drift Review: 037 Relationship Evidence Taxonomy

**Date**: 2026-05-27

## Compared Surfaces

- `docs/product-backlog.md`
- `specs/037-relationship-evidence-taxonomy/spec.md`
- `specs/037-relationship-evidence-taxonomy/plan.md`
- `specs/037-relationship-evidence-taxonomy/tasks.md`
- `specs/037-relationship-evidence-taxonomy/contracts/relationship-taxonomy.md`
- `internal/app/app_test.go`
- `internal/contextprep/contextprep.go`
- `docs/evidence-model.md`
- `docs/relationship-detection.md`

## Drift Findings

| ID | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| SD-001 | minor | Initial backlog status `Specified` and spec status `Draft` were stale relative to implementation. | accepted/fixed; both now point to ready-for-review PR #17 |
| SD-002 | major | Earlier task ledger referenced `TestRunContextPrepareDiscoversRepositoriesToolsAndGaps`, but the implemented focused test is `TestRunContextPrepareWritesCursorPack`. | accepted/fixed in `tasks.md` |
| SD-003 | minor | Contract required generated guidance to tell agents where to look first for relationship claims; generated taxonomy section relied on earlier generic artifact sections. | accepted/fixed in `internal/contextprep/contextprep.go` and test expectations |

## Requirements Mapping

- FR-001: taxonomy states and relationship meanings are in docs/generated
  output.
- FR-002: dependency, declared service/API, runtime communication, ownership,
  and lifecycle relationship kinds are explicit.
- FR-003: generated contract and docs prevent weaker evidence from being
  upgraded.
- FR-004: runtime service topology remains `not_assessed` without runtime
  observations.
- FR-005: generated answer contract maps relationship questions to artifacts
  and limitations.
- FR-006: service relationship claims must name relationship kind and evidence
  type.

## Result

Spec drift is verified aligned after fixes. Remaining PR approval and GitHub
checks are outside spec content and remain `not_assessed`.
