# Status Reconstruction: 037 Relationship Evidence Taxonomy

**Date**: 2026-05-27

## Surfaces Checked

- Backlog row: `docs/product-backlog.md` lists
  `specs/037-relationship-evidence-taxonomy/` as `Specified`.
- Spec status: `specs/037-relationship-evidence-taxonomy/spec.md` was `Draft`
  before this delivery pass.
- Initial artifacts: only `spec.md` and `checklists/requirements.md` existed.
  `plan.md`, `tasks.md`, and design artifacts were missing.
- Current implementation: relationship graph edges already carry evidence
  state/source; map runs already emit relationship `not_assessed` findings for
  unsupported non-Go, runtime, lifecycle, and service-topology surfaces.
- Existing docs: `docs/evidence-model.md` defines evidence states;
  `docs/relationship-detection.md` defines supported and unsupported
  relationship detection families.

## Reconstruction

The backlog row was correct that the feature was specified, but it was not
ready for implementation because active SpecKit artifacts were missing. This
delivery pass created `plan.md`, `research.md`, `data-model.md`,
`contracts/relationship-taxonomy.md`, `quickstart.md`, and `tasks.md` before
implementation.

## Tooling Note

`.specify/scripts/bash/setup-plan.sh` and
`.specify/scripts/bash/check-prerequisites.sh` selected
`specs/034-cursor-comparison-validation/` from the stale `AGENTS.md` plan
marker unless `SPECIFY_FEATURE_DIRECTORY` was set explicitly. The accidental
template write to `034` was reverted before continuing.

## Implementation Target

Proceed with the smallest coherent behavior change for 037:

- docs: consolidate the relationship evidence taxonomy;
- generated context pack: include the taxonomy in `answer-contract.md`;
- tests: verify generated guidance preserves relationship kind/evidence
  boundaries.

No new scanner, network behavior, schema change, or dependency is needed.
