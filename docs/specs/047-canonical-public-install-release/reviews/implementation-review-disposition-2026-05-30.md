# Implementation Review Disposition

**Date**: 2026-05-30

**Scope**: Post-implementation review for US1 install, US2 bounded release, and
US3 readiness/adoption separation.

## Review Lanes

| Lane | Status | Verdict | Notes |
| --- | --- | --- | --- |
| `kimi-coding/kimi-for-coding` | assessed | `CHANGES_REQUESTED` | Raised README ahead-of-tag risk, checksum ambiguity, release state wording, DRY/version sprawl, test structure, and broad-packet `not_assessed` items. |
| `zai/glm-5.1` | assessed | `CHANGES_REQUESTED` | Confirmed core implementation shape; raised version string sprawl and missing task packet evidence. |
| `openrouter/minimax/minimax-m2.7` | assessed | `CHANGES_REQUESTED` | Raised release safety evidence, identity scan breadth, automated user-story coverage, and scope-control concerns. |

## Accepted And Fixed

- README and Russian README now say the `go install ...@v0.1.0` route works
  after the `v0.1.0` tag is published; source checkout remains the immediate
  fallback before tag publication.
- Release notes now use `not_assessed` for local checks until release closeout,
  instead of the ambiguous word "pending".
- `docs/release.md` now clarifies version-update surfaces to reduce `v0.1.0`
  string drift.
- `docs/release.md` now clarifies that checksums apply only to artifacts
  explicitly built during release closeout; `go install` is source-built and is
  not a prebuilt binary route.
- The canonical identity test was split into presence and stale Go import
  absence checks.

## Rejected Or Narrowed

- Internal package import changes are not out-of-scope churn. They are required
  by the module path migration from `github.com/fall-out-bug/portolan` to
  `github.com/fcon-tech/portolan`.
- A generated shared docs snippet was rejected for v0.1.0. README and agent
  install docs intentionally duplicate the install command for copyability; the
  regression test and release checklist now control drift.
- Deferring Russian docs was rejected. Russian README and agent install docs
  are an existing maintained surface and were already listed in the task
  contract.
- A fully automated `go install ...@v0.1.0` test is blocked until the branch is
  merged and the tag is published. This is recorded as `blocked` in
  `public-install-smoke-2026-05-30.md`, not claimed as verified.
- Broad all-text old-identity scanning was narrowed. The stale public identity
  scan is recorded in review evidence, while the automated regression test
  blocks stale Go import paths and verifies user-facing install surfaces. The
  release guide intentionally contains the old identity inside an operator scan
  command, not as public install copy.

## Remaining Not Assessed

- GitHub checks are `not_assessed` until a PR exists.
- GitHub release publication is `not_assessed` until a maintainer publishes
  `v0.1.0`.
- Adoption/popularity is `not_assessed`; no adoption claim is implied.

## Decision

Accepted findings are fixed or explicitly narrowed. Proceed to final local
verification and PR review workflow.
