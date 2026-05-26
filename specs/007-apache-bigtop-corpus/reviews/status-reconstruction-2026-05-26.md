# Bigtop Acceptance Status Reconstruction - 2026-05-26

## Reason

After PR #13 merged, several backlog and task surfaces still described Bigtop
acceptance as blocked on landscape map orchestration or as generally
`not_assessed`. That was stale.

## Current State

- P1-016 is implemented and merged via PR #13.
- `portolan map --selection` is the product-grade landscape workflow.
- `portolan selection generate-bigtop` exists and was delivered by spec 016.
- The full Bigtop corpus selection and local Portolan map run were verified
  during spec 016 closeout.
- The real Cursor + Composer 2.5 blind operator run remains open because the
  current product path still depends on a generated selection file for
  multi-repository landscapes. That is not a realistic blind-acceptance input.

## Correction

Cursor + Composer 2.5 availability is not the blocker. The blocker is product
shape: a generated `selection.json` is a Portolan-specific preflight artifact,
not something a real operator should have to provide in a blind prompt.

The remaining evidence needed for P1-007/P1-015 is an operator run that starts
from a normal target root:

- exact blind prompt;
- Bigtop landscape target root;
- output run directory;
- transcript or concise transcript summary;
- generated Portolan artifact inventory;
- artifact-backed report and generic gap ledger.

Do not downgrade this acceptance lane to `not_assessed` merely because a Codex
status review did not operate Cursor. Also do not pass `Landscape:
<selection.json>` to make the run look green; that is a degraded/non-blind run.

## Next Action

Plan and implement `specs/017-landscape-root-discovery/`, then run Cursor +
Composer 2.5 with only the Portolan path, target root, output path, and
boundaries from `docs/agent-toolbox/blind-acceptance.md`. Record the ledger
under `specs/015-blind-agent-acceptance/reviews/` or this spec's `reviews/`
directory with cross-links.
