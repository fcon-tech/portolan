# Review Disposition: Repo-Like Context Gap Fix

Date: 2026-05-26

## Trigger

The non-Bigtop hypothesis lane showed that `context prepare` reported 0
repositories for `internal/testfixtures/landscape-map` because the fixture uses repo-like
directories and `selection.json`, but the child directories are not Git
checkouts.

## Change

- `repos.json` now encodes an empty repository list as `[]`, not `null`.
- `tool-registry.json` now encodes an empty tool list as `[]`, not `null`.
- When no Git repositories are discovered but `selection.json` or `repos/*`
  child directories exist, `gaps.jsonl` includes
  `gap-repo-like-structure-without-git`.

## Verification

- Focused context tests passed.
- `internal/testfixtures/landscape-map` context run produced:
  - 0 source-visible Git repositories;
  - 2 tool-output candidates;
  - `gap-repo-like-structure-without-git`.
- Bigtop context run produced:
  - 18 source-visible Git repositories;
  - 0 tool-output candidates as an empty array;
  - 9 gap records.

