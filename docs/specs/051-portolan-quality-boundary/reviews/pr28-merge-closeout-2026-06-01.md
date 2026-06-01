# PR 28 Merge Closeout

Date: 2026-06-01
PR: https://github.com/fcon-tech/portolan/pull/28
Merge commit: `6f13d2bbefe75fbc817442ba494d4e280b020f33`

## Merge State

- PR state: `MERGED`
- Merged at: `2026-06-01T14:06:52Z`
- Base branch: `main`
- Head branch: `codex/051-portolan-quality-boundary`
- Merge method: GitHub squash merge

## Verification At Merge

| Surface | State | Evidence |
| --- | --- | --- |
| Local baseline | verified | `go test -count=1 ./...`, `go vet ./...`, `jq empty schema/*.json internal/testfixtures/oss-adapter-contract/*.json`, `git diff --check` passed before push |
| GitHub CI Baseline | verified | `Baseline` check passed on PR head `a3e7bc093459cd0481625095fddb9130fe3cca05` |
| GitHub CodeQL jobs | verified | `Analyze (go)` and `Analyze (actions)` checks passed |
| GitHub aggregate CodeQL check | not_assessed | Aggregate `CodeQL` status remained queued after the underlying CodeQL jobs passed |
| Mergeability | verified | PR was mergeable and merged by GitHub |
| GitHub review approval | not_assessed | No separate review approval was recorded |
| User merge approval | verified | User requested to finish and merge branch 051 in this thread |

## Consolidated Status

- `docs/product-backlog.md`: updated after merge.
- `docs/specs/051-portolan-quality-boundary/tasks.md`: complete.
- `docs/specs/051-portolan-quality-boundary/reviews/pr28-readiness-closeout-2026-06-01.md`:
  recorded ready-for-review state and Bigtop harness stress evidence.
- `docs/specs/051-portolan-quality-boundary/reviews/bigtop-harness-stress-2026-06-01.md`:
  records the repeated Cursor Composer 2.5 and OpenCode stress lanes.

## Remaining Product Gaps

- Java/Scala/Maven relationship import remains `not_assessed`.
- Full-landscape duplication remains `failed` because native jscpd hit Node OOM
  on the Bigtop root.
- Cursor UI behavior remains `not_assessed`; Cursor Agent CLI / Composer 2.5
  headless stress was assessed.
- Aggregate CodeQL check remained queued even after underlying jobs passed.

## Closeout Decision

Spec 051 is merged. Follow-up product formulation should focus on what Portolan
still needs as a landscape-navigation harness rather than reopening this quality
boundary slice.
