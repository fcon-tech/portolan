# PR 13 Merge Review Disposition - 2026-05-26

## Scope

Reviewed the two remaining local branches before merge:

- `codex/016-landscape-orchestration`
- `backup/main-before-origin-sync-20260526`

## Branch Disposition

- `codex/016-landscape-orchestration`: merge candidate after local verification
  and one accepted evidence-state fix.
- `backup/main-before-origin-sync-20260526`: not a merge candidate. This branch
  preserves the old local `main` before syncing with `origin/main`; its useful
  content is superseded by the merged blind-acceptance squash commit on
  `origin/main`.

## Review Finding

### accepted/fixed: repository symlink coverage could overstate source visibility

`graphForTarget` already used `os.Lstat` and represented repository symlinks as
`unknown`, but `coverage.pathRecord` and the full-corpus gate used `os.Stat`.
That meant a selected repository symlink could appear source-visible in
`coverage.json`, and a full-corpus source requirement could pass through a
symlink.

Fixed by making directory coverage records and full-corpus source checks reject
symlinks as `cannot_verify`. The existing symlink graph test now also checks the
coverage record.

## Verification

- verified: `go test ./...`
- verified: `jq empty schema/*.json`
- verified: fixture JSON syntax checks for the new landscape fixtures
- verified: `git diff --check`
- verified: `portolan map --selection testdata/landscape-map/selection.json`
  writes `run.json`, `coverage.json`, `graph.json`, `findings.jsonl`, and
  `map.md`
- verified: incomplete Bigtop selection exits non-zero and writes no output
  directory
- not_assessed: GitHub checks; GitHub reports no checks for the PR branch

## Merge Readiness

- local implementation: ready after the symlink coverage fix
- PR state before merge: open, not draft, clean merge state
- GitHub checks: not_assessed
- merge approval: user requested review of both branches and merge of the ready
  one on 2026-05-26
