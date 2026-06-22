# Review Blocker Disposition: Spec 109 PR #73

Date: 2026-06-22
Branch: `codex/109-evidence-promotion-stratified-atlas`
Base: `origin/portolan-next`

## Accepted And Fixed

- `viewer/scripts/evidence-promotion-atlas.js` used direct filesystem walking
  for target source classification. Fixed by using `git ls-files -co
  --exclude-standard` for Git worktrees, with conservative filesystem fallback
  recorded as `non_exhaustive` health. Classification truncation is also
  recorded as `non_exhaustive`.
- `scripts/build-portolan-bundle.sh` swallowed
  `build-evidence-promotion-atlas.sh` failures in core and full bundle paths.
  Fixed by making spec 109 atlas build failures fail the bundle build.
- `validate-evidence-promotion-atlas` did not enforce the new JSONL contract.
  Fixed by strict JSONL parsing plus required-field, enum, family, stratum,
  evidence-layer, evidence-state, source-role, raw expansion-mode, and
  promotion-matrix checks.
- Source classification and promoted fact caps were silent. Fixed by emitting
  deterministic `non_exhaustive` health and summary counts when source
  inventory or promoted rows are capped.
- `oversized_family_bytes` was declared but not computed. Fixed by summing raw
  artifact bytes by family and emitting `oversized` health at 500 MiB or more.
- `package.json` could be classified as `configuration`, and
  `secret_reference_surface` was unreachable. Fixed source-role rule ordering
  and manifest/secret-reference path rules.
- Families with representative raw input but no promoted fact route were
  overreported as `ok`. Fixed by emitting `raw_available_only` for those
  families while preserving route proof.

## Regression Coverage Added

- Ignored target files are not classified or promoted.
- Invalid `promotion_health.status` values are rejected.
- Family-total oversized raw artifacts emit `oversized`.
- Source-inventory and promoted-fact caps emit `non_exhaustive`.
- `package.json` is `build_metadata`.
- Secret-reference files are `secret_reference_surface`.
- `raw_available_only` appears for raw/queryable families without a promoted
  fact route.
- The smoke fails if `build-evidence-promotion-atlas.sh ... || true` is
  reintroduced in `build-portolan-bundle.sh`.

## Current Boundaries

- Separate GitHub/human code-review approval is waived by the project owner for
  PR #73. GitHub `reviewDecision` may remain empty and is not treated as a
  blocker.
- Current-head GitHub Baseline is checked in the PR readiness closeout.
- The historical 3,019,203-row Bigtop symbol-index corpus was not rerun because
  the reusable full input bundle is not present in this worktree. This is not a
  hidden PR readiness gate; the behavior is covered by the available lab bundle
  and focused smoke fixtures.

## Merge Readiness

Merge is not executed by this pass. PR #73 still requires an explicit merge
command.
