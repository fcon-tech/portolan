---
name: "speckit-review-disposition"
description: "Record and resolve review or analyze findings for a Portolan SpecKit feature before PR work. Use when the user says review disposition, analyze disposition, fix analyze findings, close review findings, or resolve SpecKit review issues."
compatibility: "Portolan repository with specs/<NNN-short-name>/ and reviews/ artifacts"
metadata:
  author: "portolan"
  source: "repo-local"
---

# SpecKit Review Disposition

Record a spec-local disposition for findings from `/speckit-analyze`, local
review, model review lanes, or PR review feedback. Use this skill after a review
surface exists and before claiming a feature is ready for PR review.

## User Input

```text
$ARGUMENTS
```

Consider user input before proceeding. If the user names a finding ID, PR
comment, review file, or spec number, use that as the active scope.

## Goal

Turn review feedback into an auditable status ledger:

- accepted and fixed;
- accepted but narrowed;
- rejected with local evidence;
- unresolved;
- `not_assessed`.

Do not treat review text as truth by itself. Verify each accepted finding
against local files, commands, or artifacts before editing.

## Pre-Execution Checks

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks`.
2. Parse `FEATURE_DIR`; derive:
   - `spec.md`
   - `plan.md`
   - `tasks.md`
   - `reviews/`
3. Read `AGENTS.md`, `.specify/memory/constitution.md`, and the relevant review
   artifact(s).
4. If the finding touches PR state, GitHub checks, or merge approval, stop and
   use `/speckit-pr-readiness-closeout` or `/speckit-merge-closeout` instead.

## Decision Gate

State:

- Simpler/Faster: Can the finding be resolved by narrowing claim language or
  correcting evidence state rather than changing implementation?
- Blocking Edge Cases: Does the finding affect evidence semantics, path/output
  safety, privacy, CLI behavior, or product claims?
- Existing Open Source: Is this about a missing OSS/tool-output producer or
  adapter? If yes, preserve `not_assessed` unless the producer was actually
  run/imported.

## Workflow

1. Build a finding inventory:
   - ID and source;
   - severity;
   - affected file(s);
   - claim being reviewed;
   - local evidence needed.
2. For each finding, inspect local evidence before deciding.
3. Apply the smallest safe fix when the finding is accepted:
   - update `spec.md`, `tasks.md`, backlog, or review ledger;
   - update code only when the finding is a real implementation bug;
   - preserve `unknown`, `cannot_verify`, and `not_assessed` when evidence is
     absent.
4. Write a disposition under:

   ```text
   specs/<NNN-short-name>/reviews/review-disposition-YYYY-MM-DD.md
   ```

   Use a more specific name when useful, for example
   `analyze-disposition-YYYY-MM-DD.md`.
5. Re-run focused verification:
   - `git diff --check`
   - plus the command(s) relevant to edited surfaces.
6. Update `tasks.md` only if a review-disposition task exists or the active
   spec status needs alignment.

## Disposition File Shape

```markdown
# Review Disposition: <feature>

Date: YYYY-MM-DD

## Scope

- Review source:
- Feature:
- Commit/branch:

## Findings

| ID | Source | Decision | Evidence | Action |
| --- | --- | --- | --- | --- |
| I1 | speckit-analyze | accepted/fixed | file:line or command | summary |

## Verification

- `verified`:
- `failed`:
- `not_assessed`:

## Remaining Risk

- ...
```

## Output

Report:

- disposition path;
- accepted/fixed findings;
- rejected findings with evidence;
- unresolved or `not_assessed` surfaces;
- verification commands and results;
- whether the feature may proceed to `/speckit-pr-review-cycle` or still needs
  fixes.
