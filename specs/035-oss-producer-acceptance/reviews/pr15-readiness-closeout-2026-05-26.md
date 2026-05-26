# PR Readiness Closeout: OSS Producer Acceptance

Date: 2026-05-26

## Scope

- PR: https://github.com/fall-out-bug/portolan/pull/15
- Branch: `codex/035-oss-producer-acceptance`
- Base: `main`
- Head state: reconstructed with `gh pr view 15`; use GitHub PR #15 for the
  current head commit because this closeout file is committed after draft PR
  creation.

## Readiness Matrix

| Surface | State | Evidence |
| --- | --- | --- |
| Local implementation | `verified` | Spec 035 task ledger is complete for the Syft/CycloneDX producer acceptance slice; implementation and slice review dispositions exist. |
| Local verification | `verified` | `go test ./internal/app ./internal/contextprep`, `go test ./...`, `jq empty schema/*.json`, `git diff --check`, and `go run ./cmd/portolan context prepare --help` passed. |
| Producer evidence | `verified` with explicit gaps | Syft produced a CycloneDX 1.6 SBOM for `/home/fall_out_bug/projects/bigtop-landscape` with 18,769 components and 5,357 dependency records; `context prepare --force` preserved and normalized that output. |
| Review evidence | `not_assessed` for model lanes | Local review produced an accepted fix. Kimi, MiniMax, and GLM lanes were degraded or unavailable and are recorded as `not_assessed`, not clean evidence. |
| PR state | `draft` | PR #15 exists, head is pushed, draft state is true, merge state is `CLEAN`. |
| GitHub checks | `not_assessed` | `gh pr view 15 --json statusCheckRollup` reported no checks on the branch. |
| Merge approval | `not_assessed` | No human/GitHub approval was requested or verified. |
| Merge readiness | `not-ready` | Draft PR is not ready-to-merge; review evidence and approval remain absent/not assessed. |

## Decision

PR #15 is a draft PR with local implementation evidence. It must not be
described as ready-for-review or ready-to-merge until the degraded review lanes
and producer coverage boundary are resolved or explicitly accepted.

## Verified

- `git status --short --branch`
- `git diff --name-status origin/main...HEAD`
- `go test ./internal/app ./internal/contextprep`
- `go test ./...`
- `jq empty schema/*.json`
- `git diff --check`
- `go run ./cmd/portolan context prepare --help`
- `gh pr view 15 --json url,isDraft,state,mergeStateStatus,reviewDecision,statusCheckRollup,headRefName,baseRefName`

## Not Assessed

- GitHub CI checks, because none are reported.
- Merge approval.
- Ready-for-review PR state.
- Full Bigtop jscpd clone report: the generated full-landscape command was
  interrupted before JSON output and needs a separately approved bounded
  producer profile.
- Semgrep producer findings: Semgrep is installed, but no local config was
  approved.
- Kimi, MiniMax, and GLM substantive review evidence.

## Stop Reason

Stop at draft PR. The local implementation is committed and pushed, but PR
readiness is blocked by degraded independent review evidence and unresolved
producer coverage decisions. Merge requires an explicit user merge command or
separate verified approval, followed by merge closeout.
