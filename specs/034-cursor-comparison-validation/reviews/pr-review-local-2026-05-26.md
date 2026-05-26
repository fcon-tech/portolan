# PR Review: Local Lane

Date: 2026-05-26

## Scope

- PR: https://github.com/fall-out-bug/portolan/pull/14
- Branch: `034-cursor-comparison-validation`
- Base: `origin/main`
- Review type: repo-grounded local review

## Findings

### L1 - Major - Fixed

Auto-commit hooks were enabled by default in the committed git extension
configuration. That creates an unwanted workflow side effect for SpecKit
commands and conflicts with the delivery rule that commits should be explicit
review boundaries, not hidden process effects.

Evidence:

- `.specify/extensions/git/git-config.yml` had `auto_commit.default: true`
  before this review fix.
- `.specify/extensions/git/config-template.yml` had the same default.
- `docs/speckit-workflow.md` described auto-commit hooks as enabled.

Fix:

- Changed both git extension config files to `auto_commit.default: false`.
- Changed each per-hook `enabled` value to `false`.
- Updated `docs/speckit-workflow.md` to say auto-commit is opt-in.
- Updated the delivery orchestrator to call `/speckit-git-commit` only when an
  explicit commit boundary is desired.

### L2 - Minor - Fixed

The comparison ledger scored zero unsupported claims in the assisted lane but
did not explicitly say that this includes bounded abstention on unsupported
surfaces.

Evidence:

- `cursor-plus-portolan-output.md` marks runtime topology, non-Go
  relationships, near-clone/SBOM duplication, OSS producers, and ecosystem
  completeness as `not_assessed` or `unknown`.
- `comparison-ledger-2026-05-26.md` correctly scores unsupported claims as zero
  but needed clearer interpretation to prevent overclaiming coverage.

Fix:

- Added a coverage interpretation section to the comparison ledger.
- Added an explicit final-decision limitation that zero unsupported claims does
  not mean complete relationship, runtime, SBOM, or ecosystem coverage.

## Verification

- `verified`: local inspection of git extension config, workflow docs, delivery
  orchestrator, comparison ledger, and assisted lane output.
- `not_assessed`: line-by-line review of all generated extension shell and
  PowerShell scripts.

## Residual Risk

- PR scope remains broad because it includes both spec 034 validation and
  repo-local SpecKit delivery skill/extension work requested in the same
  conversation. This is visible in the PR body and disposition rather than
  hidden as unrelated diff.
