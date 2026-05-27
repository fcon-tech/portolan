# Requirements And Product Vision Drift Review

## Scope

- Feature: `036-scope-completeness-validation`
- PR: https://github.com/fall-out-bug/portolan/pull/16
- Reviewed surfaces:
  - `AGENTS.md`
  - `.specify/memory/constitution.md`
  - `docs/product-backlog.md`
  - `docs/mvp.md`
  - `docs/product-boundary.md`
  - `docs/speckit-workflow.md`
  - `specs/036-scope-completeness-validation/{spec.md,plan.md,tasks.md}`
  - `specs/036-scope-completeness-validation/reviews/*.md`
  - implementation diff for PR #16

## Decision Gate

- Simpler/Faster: The implemented path reuses `selection.corpus_manifest` and
  `coverage.json`; no new inventory command, dependency, or scanner is needed.
- Blocking Edge Cases: Estate completeness cannot be inferred from repository
  counts; missing, extra, non-Git, symlinked, and unverifiable local paths must
  stay explicit evidence states.
- Existing Open Source: No OSS dependency fits this review. The drift question
  is a product contract and SpecKit-pipeline concern, not a scanner capability.

## Findings

| ID | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| DRIFT-001 | minor | PR #16 aligns with the current product vision: local-first, read-only, agent-facing evidence substrate; it does not turn Portolan into a readiness gate or source of truth for unverifiable claims. | verified by repo-local product docs and constitution |
| DRIFT-002 | minor | Requirements are aligned across backlog, spec, plan, tasks, contract, schema, tests, and docs after implementation. The earlier artifact drift was missing `plan.md` and `tasks.md`, already fixed before coding. | verified |
| DRIFT-003 | major | The manual delivery path did not require an explicit requirements/product-vision drift artifact before implementation or PR readiness. The review was performed, but the pipeline did not force it. | accepted/fixed by updating `.agents/skills/portolan-spec-delivery/SKILL.md` |
| DRIFT-004 | major | The manual delivery path did not explicitly require `/speckit-analyze` after `tasks.md`, despite `docs/speckit-workflow.md` naming `tasks -> analyze -> implement`. | accepted/fixed by updating `.agents/skills/portolan-spec-delivery/SKILL.md` |

## Drift Assessment

- Requirements drift: verified. No unresolved mismatch remains for PR #16.
- Product vision drift: verified against repo-local canon. No current product
  vision conflict found.
- External or off-repo product strategy: not_assessed.
- PR merge approval: not_assessed.
- GitHub checks: not_assessed because GitHub reports no checks.

## Required Pipeline Update

Add these stages to `portolan-spec-delivery`:

1. Run `/speckit-clarify` when spec ambiguity, product boundary, UX, privacy,
   evidence semantics, or acceptance criteria could materially change the slice.
2. Run `/speckit-analyze` after `tasks.md` and before implementation for every
   non-trivial active feature.
3. Record `/speckit-review-disposition` for analyze findings, drift findings,
   model lanes, and local review findings before implementation or PR work.
4. Require a requirements/product-vision drift review in the pre-implementation
   review packet and again before marking a PR ready-for-review.

## Verification

- verified: direct inspection of repo-local product docs, SpecKit workflow,
  feature artifacts, and PR #16 diff.
- not_assessed: independent model lane for this drift-only review.

## Remaining Risk

Future agents may still bypass the general SpecKit workflow if they do not use
the repo-local delivery skill. `AGENTS.md` already references the workflow, so
the smallest useful fix is to tighten this skill rather than add another global
rule.
