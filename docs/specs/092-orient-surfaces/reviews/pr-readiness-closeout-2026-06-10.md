# PR readiness closeout: spec 092 (2026-06-10)

**PR**: https://github.com/fcon-tech/portolan/pull/65  
**Branch**: `codex/092-orient-surfaces`
**Head**: harness-only (`dee0e78` + gitignore cherry-pick); viewer UX commits moved to `codex/viewer-ux-followup`

## Readiness Matrix

| Surface | State | Evidence |
| --- | --- | --- |
| Local implementation | verified | tasks.md complete; slices 0–3 + 3.5 (gitignore) |
| Local verification | verified | go test/vet, jq schema, harness-orient-smoke, git diff --check |
| Review evidence | verified | 4 assessed lanes + local on review-fix head; post-gitignore harness-only diff — repo-grounded re-check only |
| PR state | ready-for-review | `gh pr view 65` isDraft=false |
| GitHub checks | pending re-verify | force-push harness-only head; expect Baseline + CodeQL green |
| Merge approval | user authorized | merge after green CI in delivery session |
| Merge readiness | ready-to-merge | after CI green on harness-only head |

## Implementation summary

- Config surfaces producer + bundle `kind=config`
- ctags symbol density + `kind=debt-candidate`
- PR #64 debt closure (repo_slug, smoke, CI wizard)
- Review-fix: gaps, multi-repo paths, stronger smoke/CI
- Slice 3.5: `.gitignore` across producers + bundle post-filter (`orient-ignore.sh`)

## Out of scope (follow-up)

- Viewer UX (views, 3-column layout, Portolan naming cleanup) → `codex/viewer-ux-followup` / spec 093

## Blockers

None after CI re-verify on harness-only head.

## Stop reason

Harness-only scope reconciled; ready-to-merge pending green CI on new PR head.
