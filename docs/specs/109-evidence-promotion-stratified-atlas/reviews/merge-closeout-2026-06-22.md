# Merge closeout — PR #73 / spec 109 — 2026-06-22

## Authorization

- Source: explicit user approval: "согласую слияние с portolan-next".
- Code-review approval: separate GitHub/human code-review approval waived by the
  project owner on 2026-06-22.
- Merge command used: `gh pr merge 73 --squash --delete-branch`.

## Merge Evidence

| Field | Value |
| --- | --- |
| PR | https://github.com/fcon-tech/portolan/pull/73 |
| Base | `portolan-next` |
| Head branch | `codex/109-evidence-promotion-stratified-atlas` |
| Head SHA | `d30b1a3595d48ad51156e97aab841756e7e67648` |
| Merge commit | `8ec8f61d10ba651e41ca63866a42283300f0ae22` |
| Merge method | squash |
| Merged at | 2026-06-22T14:12:29Z |
| Remote feature branch | deleted after merge |

`gh pr merge` completed the GitHub merge but exited non-zero locally because the
PR worktree could not switch to `portolan-next`; that base branch was already
checked out at `/home/fall_out_bug/projects/sdp/portolan`. The merge state was
therefore verified through `gh pr view 73`, followed by a local fast-forward of
the base checkout.

## Pre-Merge Verification

| Check | Status |
| --- | --- |
| `gh pr checks 73` | verified: Baseline pass |
| `go test ./...` | verified |
| `jq empty schema/*.json harness/contracts/*.json` | verified |
| `git diff --check` | verified |
| `scripts/build-evidence-promotion-atlas.sh /tmp/portolan-bigtop-20260621-193430` | verified before merge |
| `scripts/harness-bigtop-acceptance.sh /tmp/portolan-bigtop-20260621-193430` | verified before merge |

## Bigtop Regression Evidence

- Bundle: `/tmp/portolan-bigtop-20260621-193430`, 1.8G, 18 repos.
- Symbol index: 3,019,203 rows.
- `promotion-health-symbol-index-pollution`: `polluted_by_non_source`,
  observed 2,012,865 / 3,019,203 rows.
- `promotion-health-symbol-index-fixtures`: `dominated_by_fixture_data`,
  observed 1,214,223 / 3,019,203 test/fixture rows.
- `promotion-health-symbol-index-promoted-facts-truncated`: `non_exhaustive`,
  observed 200 / 3,019,203 promoted symbol facts.
- `promotion-health-oversized-family-symbol_index`: `oversized`,
  observed 895,795,098 bytes.

## Review Evidence

- PR readiness closeout:
  `docs/specs/109-evidence-promotion-stratified-atlas/reviews/pr-readiness-closeout-2026-06-22.md`.
- Review blocker disposition:
  `docs/specs/109-evidence-promotion-stratified-atlas/reviews/review-blocker-disposition-2026-06-22.md`.
- Assessed independent review lanes:
  `minimax/MiniMax-M2.7`, `opencode-go/deepseek-v4-flash`, and
  `openrouter/~anthropic/claude-haiku-latest`.
- Degraded replacement attempts are recorded in the PR readiness closeout.

## Status Consolidation

- `docs/product-backlog.md`: P10-109 updated to merged via PR #73.
- `docs/specs/109-evidence-promotion-stratified-atlas/spec.md`: status updated
  to merged and points to this closeout.
- `docs/specs/109-evidence-promotion-stratified-atlas/tasks.md`: no open task
  checkboxes at merge.
- Historical readiness/disposition files remain as pre-merge evidence; this
  closeout supersedes their "not merged" stop reason.

## Remaining Not Assessed

- GitHub `reviewDecision` remains empty by design because code-review approval
  was waived by the project owner.
- Post-closeout GitHub checks for this documentation-only closeout commit are
  separate from PR #73 and must be verified after this commit is pushed.
