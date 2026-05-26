---
name: "speckit-pr-review-cycle"
description: "Run a Portolan PR review cycle for a SpecKit feature. Use when the user says create PR review, run PR review, review PR, fix PR comments, review-fix loop, or prepare independent reviewers."
compatibility: "Portolan repository with GitHub CLI or GitHub connector access"
metadata:
  author: "portolan"
  source: "repo-local"
---

# SpecKit PR Review Cycle

Run an independent review-fix loop for an existing or newly created PR. This
skill does not merge. It records review evidence and dispositions under the
active spec directory.

## User Input

```text
$ARGUMENTS
```

Use a PR number, branch name, or spec number from user input when provided.

## Goal

Reconstruct PR state, run independent review lanes, fix accepted findings, and
record a PR review-cycle disposition. Do not mark the PR ready-for-review until
`/speckit-pr-readiness-closeout` passes.

## Preconditions

1. Active feature has `spec.md`, `plan.md`, `tasks.md`, and implementation
   evidence.
2. Review/analyze findings have a disposition or are explicitly recorded as
   unresolved.
3. Branch diff scope is understood:

   ```bash
   git diff --name-status <base>...HEAD
   ```

4. If there is no PR yet, create one as draft unless the user explicitly asks
   for ready PR and readiness evidence already exists.

## State Reconstruction

Collect:

- current branch and HEAD commit;
- base branch;
- PR number and URL if present;
- draft/ready state;
- merge state;
- GitHub check state;
- existing review comments;
- spec-local review artifacts.

Use `gh pr view`, `gh pr diff`, and `gh pr checks` when available. If GitHub or
`gh` is unavailable, record PR/GitHub state as `not_assessed`.

## Review Lanes

For Portolan PRs touching evidence semantics, path/output safety, schemas, CLI
behavior, or product claims, use at least two independent lanes:

- repo-grounded local review;
- model lanes through `pi` when available.

Default PR model lanes:

- `openrouter/deepseek/deepseek-v4-pro`
- `openrouter/qwen/qwen3.6-plus`
- `openrouter/~google/gemini-pro-latest`

Before launching model lanes, inspect `~/.pi/agent/settings.json` for exact
enabled model IDs. If a model is absent, hung, empty, malformed, or off-topic,
mark that lane `not_assessed`. Do not silently substitute another Gemini model.

## Workflow

1. Build a bounded PR review packet:
   - spec/plan/tasks;
   - implementation disposition;
   - diff against base;
   - verification results;
   - product/evidence-state claims.
2. Run review lanes.
3. Record raw reviewer outputs under:

   ```text
   specs/<NNN-short-name>/reviews/pr-review-<lane>-YYYY-MM-DD.md
   ```

4. Verify each accepted finding locally.
5. Apply minimal fixes.
6. Re-run focused verification.
7. Write disposition:

   ```text
   specs/<NNN-short-name>/reviews/pr-review-disposition-YYYY-MM-DD.md
   ```

8. Commit fixes through `/speckit-git-commit` or the enabled auto-commit hook.

## Disposition Requirements

Disposition must include:

- PR number/URL or `not_assessed`;
- reviewer lanes and status;
- accepted/fixed findings;
- rejected findings with local evidence;
- unresolved findings;
- degraded lanes as `not_assessed`;
- verification commands;
- whether `/speckit-pr-readiness-closeout` can run.

## Output

Report:

- PR state;
- review lanes used;
- accepted/fixed findings;
- unresolved blockers;
- verification status;
- next command, normally `/speckit-pr-readiness-closeout`.
