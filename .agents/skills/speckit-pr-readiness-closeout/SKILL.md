---
name: "speckit-pr-readiness-closeout"
description: "Create a PR readiness closeout for a Portolan SpecKit feature. Use when the user says PR readiness, ready for review, closeout PR, mark PR ready, or check if a PR is ready."
compatibility: "Portolan repository with SpecKit reviews and optional GitHub PR"
metadata:
  author: "portolan"
  source: "repo-local"
---

# SpecKit PR Readiness Closeout

Create the required closeout artifact before claiming a PR is ready for review.
This skill separates local implementation, ready-for-review PR state, and
ready-to-merge state.

## User Input

```text
$ARGUMENTS
```

Use a PR number, branch name, or spec number from user input when provided.

## Goal

Produce a spec-local readiness matrix that says exactly which surface is ready:

- local implementation;
- draft PR;
- ready-for-review PR;
- ready-to-merge PR.

Do not use unqualified "ready".

## Preconditions

1. `tasks.md` is complete or blockers are explicitly recorded.
2. Implementation disposition exists.
3. Analyze/review findings are dispositioned.
4. Local verification has run.
5. PR state is reconstructed if a PR exists.

## Workflow

1. Run or verify:

   ```bash
   git status --short --branch
   git diff --name-status <base>...HEAD
   go test ./...
   jq empty schema/*.json
   git diff --check
   ```

2. Reconstruct GitHub PR state if possible:
   - PR URL/number;
   - draft/ready state;
   - mergeability;
   - checks;
   - review approvals/comments.
3. Inspect spec-local artifacts:
   - `spec.md`;
   - `tasks.md`;
   - backlog row;
   - implementation disposition;
   - review/analyze dispositions;
   - PR review disposition.
4. Write:

   ```text
   docs/specs/<NNN-short-name>/reviews/pr-readiness-closeout-YYYY-MM-DD.md
   ```

## Required Matrix

```markdown
## Readiness Matrix

| Surface | State | Evidence |
| --- | --- | --- |
| Local implementation | verified/failed/blocked | ... |
| Local verification | verified/failed/not_assessed | ... |
| Review evidence | verified/not_assessed/unresolved | ... |
| PR state | draft/ready-for-review/not_assessed | ... |
| GitHub checks | verified/failed/not_assessed | ... |
| Merge approval | verified/not_assessed | ... |
| Merge readiness | ready-to-merge/not-ready/not_assessed | ... |
```

## Rules

- If no PR exists, PR state is `not_assessed`; local implementation may still be
  verified.
- If PR is draft, report draft PR, not ready-for-review PR.
- If GitHub checks are absent, report `not_assessed`, not green.
- If review approval is absent, merge approval is `not_assessed`.
- A ready-for-review PR is not ready-to-merge by itself.
- Merge only after explicit user approval or separate human/GitHub approval.

## Output

Report:

- closeout path;
- exact ready surface;
- blockers;
- `not_assessed` surfaces;
- whether the next step is PR creation, PR review fixes, marking ready for
  review, or waiting for merge approval.
