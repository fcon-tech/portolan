# PR 22 Review Disposition

**Date**: 2026-05-30

**PR**: https://github.com/fcon-tech/portolan/pull/22

**Branch**: `codex/047-canonical-public-install-release`

## Initial PR Review Lanes

| Lane | Status | Verdict | Main findings |
| --- | --- | --- | --- |
| `openrouter/deepseek/deepseek-v4-pro` | assessed | `CHANGES_REQUESTED` | Release notes/closeout state mismatch, spec status wording, T021 blocked handoff, test comment. |
| `openrouter/moonshotai/kimi-k2.6` | assessed | `CHANGES_REQUESTED` | Guarded install route before tag publication, task renumbering, version string sprawl, minor template/task wording concerns. |
| `zai/glm-5.1` | assessed | `CHANGES_REQUESTED` | README ahead-of-tag risk, DRY/version drift, review artifact retention, stale non-Go scan concern. |

## Accepted Fixes

- Added guard comments directly above every copyable
  `go install github.com/fcon-tech/portolan/cmd/portolan@v0.1.0` block.
- Split release notes state into local PR checks, release-commit checks,
  GitHub checks, GitHub release publication, and adoption/popularity.
- Added explicit T021 handoff: source-checkout smoke verified; versioned public
  `go install` remains blocked until merge and tag publication.
- Added a comment explaining why the banned old module path is split inside the
  regression test.
- Added review artifact retention policy to the release closeout.

## Rejected Or Deferred

- Internal Go import changes are required by the module path migration and are
  not unrelated architecture churn.
- Shared/generated docs snippets are deferred. README and agent docs remain
  copyable; version drift is controlled by the release checklist and regression
  tests for current public identity.
- Fully automated `go install ...@v0.1.0` is blocked until tag publication and
  remains an explicit post-merge release action.
- Broad all-text stale identity scanning is deferred; public install surfaces
  and Go import paths are covered by tests and recorded scans.

## Focused Re-Review

| Lane | Status | Verdict | Notes |
| --- | --- | --- | --- |
| `openrouter/deepseek/deepseek-v4-pro` | assessed | `PASS` | All five previous findings resolved. |
| `openrouter/moonshotai/kimi-k2.6` | assessed | `PASS` | All previous findings resolved; remaining external checks are correctly `not_assessed` or blocked. |
| `zai/glm-5.1` | assessed | `PASS` | Guarded install blocks, release state separation, T021 handoff, test comment, and review retention all resolved. |

## Remaining External State

- GitHub checks: `verified`; `Baseline` passed on PR #22.
- Versioned public `go install`: `blocked` until merge and `v0.1.0` tag
  publication.
- GitHub release publication: `not_assessed`.
- Adoption/popularity: `not_assessed`.
- Merge approval: `verified`; user approved merge in chat on 2026-05-30 with
  "Согласовано слияние".

## Decision

PR 22 is ready-to-merge after explicit user approval and fresh pre-merge
state/CI verification.
