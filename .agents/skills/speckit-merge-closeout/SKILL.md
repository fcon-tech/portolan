---
name: "speckit-merge-closeout"
description: "Perform post-approval merge and merge closeout for a Portolan SpecKit feature. Use when the user explicitly says merge, merge PR, close merge, post-merge closeout, or cleanup after merge."
compatibility: "Portolan repository with an approved GitHub PR"
metadata:
  author: "portolan"
  source: "repo-local"
---

# SpecKit Merge Closeout

Merge only after explicit user approval or separate human/GitHub approval. This
skill verifies merge readiness, performs the merge when authorized, and records
post-merge status consolidation.

## User Input

```text
$ARGUMENTS
```

Require explicit merge authorization in user input or verified PR approval. If
authorization is absent, stop after reporting readiness state.

## Goal

Avoid confusing ready-for-review with ready-to-merge. Merge only when approval
and checks are understood, then consolidate SpecKit/backlog/review surfaces.

## Pre-Merge Checks

1. Reconstruct PR state:
   - PR number/URL;
   - head and base;
   - draft state;
   - mergeability;
   - checks;
   - review approval.
2. Run local verification unless the user explicitly accepts a degraded merge:

   ```bash
   go test ./...
   jq empty schema/*.json
   git diff --check
   ```

3. Read the latest PR readiness closeout.
4. If checks are absent, record `not_assessed`, not green.
5. If review approval is absent, record `merge_approval: not_assessed`.
6. Merge only when the user explicitly accepts the current state.

## Merge Workflow

Use non-interactive commands. Prefer `gh pr merge` with the requested merge
method. If no method is requested, use the repo's established default or report
the available options before proceeding.

After merge:

1. Verify PR state is `MERGED`.
2. Verify merge commit exists on the base branch or remote base.
3. Verify whether the remote feature branch was deleted when requested or by
   the merge command.
4. Update spec/backlog/tasks/review surfaces if any stale state remains.
5. Write:

   ```text
   docs/specs/<NNN-short-name>/reviews/merge-closeout-YYYY-MM-DD.md
   ```

## Closeout Requirements

Closeout must include:

- merge authorization source;
- PR URL and merge commit;
- local verification status;
- GitHub checks status;
- review approval status;
- merge command used;
- branch cleanup state;
- backlog/spec/tasks/reviews consistency;
- any stale surfaces or blockers.

## Output

Report:

- merged/not merged;
- merge commit;
- branch cleanup;
- closeout path;
- verification status;
- remaining `not_assessed` surfaces.

If merge did not occur, report the exact blocker and do not imply completion.
