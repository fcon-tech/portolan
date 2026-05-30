---
name: "portolan-spec-delivery"
description: "Use when implementing or reviewing Portolan SpecKit slices, taking the next ready spec, running review cycles with pi/Codex reviewers, improving a PR, marking it ready, or merging after explicit approval."
compatibility: "Portolan repository with SpecKit specs, docs/product-backlog.md, and AGENTS.md"
metadata:
  author: "portolan"
  source: "repo-local"
---

# Portolan Spec Delivery

Use this skill for requests such as:

- "бери ближайшую готовую спеку"
- "начинай с ревью через pi/codex subagents"
- "реализуй по слайсам"
- "сделай цикл ревью PR"
- "доведи PR до качественного результата"
- "сливай PR"

## Mode

Start in `REVIEW` unless the user only asks for status. Move to `IMPLEMENT`
only after the ready spec and review findings are understood. Move to `SHIP`
only when the PR state and evidence are coherent.

## Intake

1. Read `AGENTS.md`, `.specify/memory/constitution.md`, and
   `docs/product-backlog.md`.
2. Check `git status --short --branch` and existing worktrees.
3. If implementing a spec, choose the earliest ready backlog item that has
   concrete `spec.md`, `plan.md`, and `tasks.md`.
4. Reconstruct status consistency before coding: compare backlog status, spec
   status, task checkboxes, review dispositions, recent git history, and the
   current implementation files. If these surfaces disagree, record a
   spec-local status reconstruction under `specs/<NNN-short-name>/reviews/`,
   fix stale status metadata, and only then choose the next implementation
   target.
   Also verify branch metadata: `spec.md`, `plan.md`, the current git branch,
   and PR head branch must agree. A stale `plan.md` branch field is spec drift.
5. Work in a dedicated worktree from current `origin/main` or the requested base.
   Do not use a dirty main checkout for implementation.
6. Before committing or opening a PR, verify provenance and scope with
   `git diff --name-status <base>...HEAD`. If adjacent specs or backlog-only
   planning files appear in the diff, remove them from the PR scope before
   review. A local `HEAD` that already contains multiple prepared specs is not a
   clean feature base.
7. State the decision gate:
   - Simpler/Faster
   - Blocking Edge Cases
   - Existing Open Source

## SpecKit Pipeline Gates

Use the generated SpecKit skills as mandatory stage boundaries for non-trivial
feature work:

1. `/speckit-clarify`: run before planning when scope, UX, privacy, evidence
   semantics, product boundary, acceptance criteria, or completion signals are
   materially ambiguous. If skipped, record why the ambiguity is non-blocking.
2. `/speckit-plan`: ensure `plan.md`, `research.md`, `data-model.md`,
   `contracts/`, and `quickstart.md` exist when the slice changes behavior,
   schemas, CLI contracts, evidence semantics, or manual validation.
3. `/speckit-tasks`: ensure `tasks.md` is concrete and independently
   verifiable before implementation.
4. `/speckit-analyze`: run after `tasks.md` and before implementation. Treat
   missing analyze as a delivery blocker unless the slice is truly trivial and
   the reason is recorded in `reviews/`.
5. `/speckit-review-disposition`: record analyze findings, requirements drift,
   product-vision drift, local review findings, and model review findings under
   the active spec's `reviews/` directory before coding or PR work proceeds.
6. `/speckit-implement`: use only after the above gates are coherent, or
   perform equivalent manual implementation while preserving the same review and
   verification artifacts.
7. `/speckit-pr-review-cycle`, `/speckit-pr-readiness-closeout`, and
   `/speckit-merge-closeout`: use for PR review, ready-for-review closeout, and
   merge closeout respectively. Merge closeout is only allowed after explicit
   merge approval.

## Pre-Implementation Review

Build a bounded review packet from:

- repo rules and constitution;
- product vision surfaces: `docs/product-backlog.md`, `docs/mvp.md`,
  `docs/product-boundary.md`, `docs/speckit-workflow.md`, and any feature-local
  product/research notes;
- backlog row;
- spec, plan, tasks, data-model, quickstart, contracts when present;
- schemas and current implementation files relevant to the slice.

Before implementation, explicitly review and record:

- requirements drift: backlog row vs `spec.md` vs `plan.md` vs `tasks.md` vs
  contracts/schemas/tests;
- product-vision drift: feature direction vs Portolan boundary, roadmap order,
  local-first/read-only defaults, agent-facing toolbox positioning, OSS
  composition posture, and evidence-state honesty;
- SpecKit pipeline drift: whether `/speckit-clarify`, `/speckit-plan`,
  `/speckit-tasks`, `/speckit-analyze`, and `/speckit-review-disposition` have
  run or have an explicit recorded reason for omission.

Write this as a spec-local artifact, for example:

```text
specs/<NNN-short-name>/reviews/requirements-product-vision-drift-YYYY-MM-DD.md
```

If the drift review finds a mismatch that affects scope, safety, evidence
semantics, user-facing behavior, or testability, stop implementation and fix the
spec/task contract first.

Run independent review lanes. Prefer:

- one requirements/UX/DX lane;
- one security/evidence lane;
- model lanes through `pi` when useful, using enabled models from
  `~/.pi/agent/settings.json`.

Choose slice-review model lanes from the repo review roster in
`docs/review-harness-benchmark.md`. Use `pi` as the default review harness.
Start with subscription/provider-direct lanes where they are live, then use the
documented OpenRouter fallback for the same model family before replacing the
lane. If a lane is unavailable, empty, stale, or off-task, mark it
`not_assessed` and do not count it toward coverage.

Each review iteration must produce three assessed independent review lanes.
Failed, empty, hung, malformed, unavailable, stale, off-topic, or
`not_assessed` lanes do not count toward the three. If a roster lane cannot be
used, choose an explicit replacement from enabled non-GPT models, record the
original lane, failure reason, replacement lane, and why the replacement is
acceptable. Do not count GPT-family models as independent review evidence
because Codex itself is already GPT-family.

Write review dispositions under:

```text
specs/<NNN-short-name>/reviews/
```

Do not put review artifacts under a repo-root `reviews/` directory.

## Implementation Slices

For each slice:

1. Add or update focused tests before behavior changes unless the slice is
   docs-only.
2. Keep `cmd/portolan` thin; put behavior in `internal/...`.
3. Preserve evidence-state honesty. Never upgrade:
   - missing to success;
   - `claim-only` to observed evidence;
   - `unknown` or `cannot_verify` to green status.
4. Protect local-first/read-only boundaries:
   - no network calls;
   - no daemon behavior;
   - no credentials;
   - no target repository mutation;
   - output only to explicitly selected output paths.
5. Prefer stdlib and existing project patterns. Do not add dependencies without
   documenting OSS fit, license/maintenance risk, privacy posture, and
   integration cost.
6. Update docs, schema, fixtures, and task ledgers when behavior changes.
7. Continue until every task in the selected spec's active `tasks.md` is done or
   a blocker is explicitly recorded. A passing first slice is not a stopping
   point when the task ledger still has open work.

## Review Cycle After Each Slice

Run focused local verification first:

```bash
go test -count=1 ./...
jq empty schema/*.json
git diff --check
```

For CLI changes, also run the affected command and a fixture command.

Then run at least one independent review lane. Use more lanes when the slice
touches:

- evidence state semantics;
- graph identity or deterministic output;
- path traversal, symlinks, or output writes;
- schema compatibility;
- CLI user behavior.

For ordinary code slices, run the default slice-review model lanes through `pi`:

```bash
pi --no-tools --no-context-files --no-session --model openrouter/deepseek/deepseek-v4-pro -p "$PROMPT"
pi --no-tools --no-context-files --no-session --model openrouter/minimax/minimax-m2.7 -p "$PROMPT"
pi --no-tools --no-context-files --no-session --model zai/glm-5.1 -p "$PROMPT"
```

Review findings must be dispositioned:

- accepted/fixed;
- accepted narrower than stated;
- rejected with local evidence;
- unresolved;
- `not_assessed`.

After fixes, rerun verification and a focused re-review for the changed risk.

## Completion Before PR

Before creating or updating the PR:

1. Confirm every task in the active `tasks.md` is checked or explicitly marked
   blocked with evidence.
2. Confirm `/speckit-analyze` and requirements/product-vision drift findings
   are dispositioned, or record the exact blocker/omission.
3. Update the spec/backlog status to match the implementation state.
4. Record a final implementation or review disposition under the spec's
   `reviews/` directory.
5. Run the full local verification bundle.
6. Only then push the branch and start the PR review workflow.

## PR Review And Shipping

After creating or updating a PR, do not stop immediately. Run a PR readiness
closeout first, even when local verification already passed.

Use the repo-local delivery skills for atomic stages:

- `/speckit-review-disposition` for analyze/local/model review findings before
  PR work;
- `/speckit-pr-review-cycle` for independent PR review lanes and fix
  disposition;
- `/speckit-pr-readiness-closeout` before claiming any PR is ready for review;
- `/speckit-merge-closeout` only after explicit merge approval.

Before marking a PR ready:

1. Reconstruct PR head, diff, draft state, merge state, checks, and review
   artifacts with `gh pr view`, `gh pr diff`, and `gh pr checks`.
2. Run local verification.
3. Re-check requirements drift and product-vision drift against the actual PR
   diff. Record the result in the PR review disposition or readiness closeout;
   do not rely only on pre-implementation review.
4. If the review request includes quality lenses such as CRAP,
   Maintainability Index, CleanArch/hexagonal architecture, CleanCode, SOLID,
   DRY, or YAGNI, classify changed file types before reviewing. For docs/config
   only diffs, record CRAP/MI/code-architecture lenses as `not_applicable` with
   `git diff --name-status <base>...HEAD` evidence; do not fabricate code
   metrics for prose or YAML.
5. Run independent review lanes from `docs/review-harness-benchmark.md`, plus
   one repo-grounded local reviewer. Serious or risky PRs need three assessed
   independent non-GPT model lanes.

   If the PR touches `specs/`, `.specify/`, `.agents/skills/`, backlog rows,
   review workflow, or governance docs, include `.specify/memory/constitution.md`
   in the review packet. Do not let constitution drift become `not_assessed`
   merely because the prompt omitted the constitution. For docs/public-artifact
   slices, also include the claim boundary, privacy/freshness evidence, and
   any smoke evidence that supports public wording.

   Before launch, inspect `~/.pi/agent/settings.json` for exact enabled IDs. If
   a requested model is absent, record that lane as `not_assessed`; do not
   silently substitute another model. If any roster lane fails or is
   unavailable, run explicit enabled non-GPT replacement lanes until the PR
   review has the required assessed coverage, or keep the PR draft and record
   the blocker.
6. Fix accepted findings and record a PR review-cycle disposition under the
   spec's `reviews/` directory.
7. Push, refresh PR state, and mark ready-for-review only when blockers are
   fixed and the PR is no longer draft. If blockers remain, keep the PR draft
   and record the exact blocker.

After any rebase, amend, merge-base update, or force-push, treat previous PR
checks, merge state, and readiness closeout as stale. Re-run or refresh:

- `gh pr view`;
- `gh pr checks`;
- local verification affected by the changed head;
- PR description if it names check or blocker states;
- spec/backlog/readiness closeout if state changed.

For public demo, public docs, screenshots, recordings, or public artifact
excerpts, the PR review disposition must check:

- cold-start setup smoke is separated from reused existing-landscape smoke;
- public artifacts have a freshness trace such as version, commit, or explicit
  staleness note;
- redaction verification covers paths, directory names for private targets,
  hostnames/URLs, credentials, customer/private names, and weak evidence states;
- full local outputs are not treated as public-safe without a separate privacy
  review.

If GitHub has no checks configured, report CI as `not_assessed`, not green.

Final status after PR work must use this matrix:

- Implementation:
- Local verification:
- Review evidence:
- Requirements drift:
- Product vision drift:
- PR state:
- GitHub checks:
- Merge readiness:
- Stop reason:

Do not stop at draft PR for implementation delivery unless a blocker is
recorded. Do not say the PR is ready-for-review unless the PR is not draft,
review evidence is dispositioned, checks are either passing or explicitly absent
as `not_assessed`, and SpecKit/backlog/task/review surfaces agree. Do not say
ready-to-merge when GitHub checks or human review approval are absent; record
those as `not_assessed` and merge only if the user explicitly accepts that
state.

When task completion means "record current state", the task may be checked only
if the artifact explicitly preserves any `blocked` or `not_assessed` states. Do
not let a checked task imply that blocked external state is verified.

Merge only after explicit user approval. After merge, verify:

- PR state is `MERGED`;
- merge commit exists on `origin/main`;
- intended remote feature branch cleanup happened or is handled separately.
