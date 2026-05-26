---
name: "speckit-delivery-orchestrator"
description: "Run the full Portolan SpecKit delivery lifecycle from a fresh worktree through specify, plan, tasks, implement, review-fix, PR review, PR cleanup, and merge only after explicit approval. Use when the user says start next spec, full speckit delivery, take closest spec to merge, run the whole SpecKit loop, or orchestrate SpecKit delivery."
compatibility: "Portolan repository with SpecKit, Git, GitHub workflow, and repo-local speckit-* skills"
metadata:
  author: "portolan"
  source: "repo-local"
---

# SpecKit Delivery Orchestrator

Use this meta-skill to drive a complete Portolan feature lifecycle. It composes
the smaller SpecKit and delivery skills; it does not replace them.

## User Input

```text
$ARGUMENTS
```

Honor explicit user constraints first: spec number, branch name, base branch,
worktree path, PR mode, review lanes, or merge approval. If no spec is named,
select the nearest open backlog item that is not already implemented or closed.

## Non-Negotiable Gates

- Work in a dedicated Git worktree and branch. Do not implement from a dirty
  main checkout.
- Do not skip `/speckit-specify`, `/speckit-plan`, `/speckit-tasks`,
  `/speckit-implement`, and `/speckit-analyze` unless the active spec already
  has current, coherent artifacts and the skip is recorded.
- Do not treat local verification as PR approval.
- Do not treat ready-for-review as ready-to-merge.
- Merge only after explicit user approval or separate verified human/GitHub
  approval.
- Preserve `unknown`, `cannot_verify`, `blocked`, and `not_assessed` instead of
  smoothing them into success.

## Phase 0: Intake And Worktree

1. Read `AGENTS.md`, `.specify/memory/constitution.md`, and
   `docs/product-backlog.md`.
2. Check current repo state:

   ```bash
   git status --short --branch
   git branch --show-current
   git remote -v
   ```

3. If no spec is named, choose the nearest open backlog row in roadmap order.
   Prefer rows marked `Specified`, `Ready`, `Draft`, or the first future item
   needing specification. Do not reimplement rows marked `Implemented` unless
   the user explicitly asks for review/improvement.
4. Create a dedicated worktree from the selected base. Default base:
   `origin/main` if available, otherwise current `main`.

   Suggested shape:

   ```text
   ../portolan-worktrees/<branch-name>/
   ```

5. In the new worktree, run `/speckit-git-feature` or create/switch to the
   branch matching the selected spec. If the spec already has a numeric branch
   name, use that exact name via `GIT_BRANCH_NAME`.
6. Verify worktree and branch provenance:

   ```bash
   git status --short --branch
   git merge-base --fork-point <base> HEAD || git merge-base <base> HEAD
   ```

## Phase 1: Specification With User

Run the user through:

1. `/speckit-specify` when the spec is absent, stale, or materially incomplete.
2. `/speckit-clarify` for blocking ambiguity, especially around UX, evidence
   semantics, privacy, local-first boundaries, or product claims.
3. `/speckit-git-commit` after specification/clarification when an explicit
   commit boundary is desired.

Stop for user answers when the skill asks clarification questions. Do not fake
answers to speed up the workflow.

## Phase 2: Plan, Tasks, Analyze, Implement

Run in order:

1. `/speckit-plan`
2. `/speckit-tasks`
3. `/speckit-analyze`
4. `/speckit-review-disposition` for accepted analyze findings
5. `/speckit-implement`

Rules:

- If `/speckit-analyze` reports HIGH or CRITICAL findings, fix or disposition
  them before implementation.
- If implementation reveals task/spec drift, update the spec-local artifacts
  and record why.
- After every implementation slice, run focused verification and record review
  evidence under `specs/<NNN-short-name>/reviews/`.
- Continue until `tasks.md` is complete or a blocker is recorded.

## Phase 3: Review-Fix Loop Before PR

Run:

1. `/speckit-review-disposition` for implementation review findings.
2. Focused local verification:

   ```bash
   go test ./...
   jq empty schema/*.json
   git diff --check
   ```

3. If code, schemas, CLI behavior, evidence semantics, or product claims changed,
   run independent review lanes:
   - repo-grounded local review;
   - pi/model lanes when available and appropriate.

Mark empty, hung, malformed, stale, or off-topic reviewer output as
`not_assessed`.

## Phase 4: PR, PR Review, Fix, Cleanup

1. Confirm diff scope before PR:

   ```bash
   git diff --name-status <base>...HEAD
   ```

2. Push the branch and create/update a PR as draft unless readiness evidence is
   already coherent.
3. Run `/speckit-pr-review-cycle`.
4. Fix accepted PR-review findings.
5. Re-run verification and review as needed.
6. Run `/speckit-pr-readiness-closeout`.
7. Only mark the PR ready-for-review when the closeout says:
   - local implementation: `verified`;
   - local verification: `verified`;
   - review evidence: `verified` or degraded lanes explicitly
     `not_assessed`;
   - PR state can be moved out of draft;
   - GitHub checks are `verified` or explicitly `not_assessed`;
   - no unresolved blockers remain.

If the PR remains draft, absent checks, missing review approval, or stale
SpecKit surfaces remain, report the blocker explicitly.

## Phase 5: Merge On User Command

Run `/speckit-merge-closeout` only when the user explicitly says to merge or a
separate human/GitHub approval is verified.

Before merge:

- re-check PR state and checks;
- report absent CI as `not_assessed`;
- report absent approval as `merge_approval: not_assessed`;
- ask for explicit acceptance if merging despite `not_assessed` surfaces.

After merge:

- verify PR is merged;
- verify merge commit;
- verify branch cleanup if requested or expected;
- record `merge-closeout-YYYY-MM-DD.md`;
- align backlog/spec/tasks/reviews with merged state.

## Required Status Report Shape

At every stop or handoff, report:

```text
Feature:
Worktree:
Branch:
Current phase:
Completed:
Blocked:
Verified:
Failed:
Not assessed:
Next command:
```

Use precise ready surfaces:

- local implementation;
- draft PR;
- ready-for-review PR;
- ready-to-merge PR.

## Composed Skills

Use these skills as the actual execution units:

- `/speckit-git-feature`
- `/speckit-specify`
- `/speckit-clarify`
- `/speckit-plan`
- `/speckit-tasks`
- `/speckit-analyze`
- `/speckit-review-disposition`
- `/speckit-implement`
- `/speckit-pr-review-cycle`
- `/speckit-pr-readiness-closeout`
- `/speckit-merge-closeout`
- `/speckit-git-commit`
