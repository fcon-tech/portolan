# PR 22 Merge Closeout

**Date**: 2026-05-30

**PR**: https://github.com/fcon-tech/portolan/pull/22

**Merge commit**: `82412617c97990cf00fd9df548e254aab4f81a30`

**Merge approval**: `verified`; user approved merge in chat with
"Согласовано слияние".

## Merge State

| Surface | State | Evidence |
| --- | --- | --- |
| PR state | verified | PR #22 is `MERGED`. |
| GitHub CI before merge | verified | `Baseline` passed before merge. |
| Main checkout | verified | `/home/fall_out_bug/projects/sdp/portolan` fast-forwarded to `8241261`. |
| Remote feature branch cleanup | verified | `gh pr merge --squash --delete-branch` merged the PR; local branch cleanup was blocked because the feature branch is still attached to the delivery worktree. |

## Post-Merge Verification

| Check | State | Evidence |
| --- | --- | --- |
| `go test -count=1 ./...` | verified | Passed on `main` after merge. |
| `jq empty .specify/feature.json schema/*.json` | verified | Passed on `main` after merge. |
| `git diff --check` | verified | Passed on `main` after merge. |
| Fresh source checkout smoke | verified | Fresh clone from `https://github.com/fcon-tech/portolan.git` now has `module github.com/fcon-tech/portolan`; `scripts/bootstrap-portolan` wrote `.portolan/bin/portolan`; `--version` printed `portolan dev`. |

## Remaining External State

| Surface | State | Evidence |
| --- | --- | --- |
| Versioned public `go install ...@v0.1.0` | blocked | Still requires `v0.1.0` tag publication after merge. |
| GitHub release publication | not_assessed | Release has not been published in this closeout. |
| Adoption/popularity | not_assessed | No adoption, star, fork, customer, production, or popularity claim is made. |

## Decision

Spec 047 is merged and consolidated on `main`. The next release action is tag
and publish `v0.1.0`, then rerun the versioned public `go install` smoke and
release-commit checks.
