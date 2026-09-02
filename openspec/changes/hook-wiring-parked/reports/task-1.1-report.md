# Task 1.1 report — hook-wiring-parked

## What was built

The hook wiring is parked; the guards are kept.

- Deleted the tracked `.zcode/config.json` via `git rm` — the single
  artifact the client's workspace hook trust gate evaluates.
- Rewrote the hooks section lead in `docs/workflow.md` to the parked state
  per design D2, pointers-only, house voice. Nothing else in the file
  changed (diff shows a single hunk); the guard bullets, all other
  sections, and `scripts/hooks/` with their tests are untouched.

### The parked-state wording installed (docs/workflow.md, hooks lead)

> Three soft guards live at `scripts/hooks/` — H1 after an Edit/Write, H2
> before one, H3 at session start; the rules they serve stay owned where this
> page says. This is the soft phase — a hook warns, it never blocks (no exit
> 2), and CI stays the final bar. The wiring is PARKED: the tracked
> `.zcode/config.json` is removed because the client's workspace hook trust
> review is broken for remote workspaces — its items render but are not
> actionable — so no hooks run. Restore path: recreate the wiring from the
> `process-hooks` change archive and approve it once the client ships a
> working review. Escalation happens only on a recorded trigger, never by
> default.

No trust mechanics, no payload shapes, no client bug forensics restated.
The referenced paths exist: `scripts/hooks/` (untouched) and the
`process-hooks` change archive at
`openspec/changes/archive/2026-09-02-process-hooks/`.

## Verify-first (restated checks, run before the work)

- (a) RED: `.zcode/config.json` present before the work — verified
  (`test -f` → PRESENT); the work makes it gone.
- (b) `git rm`-ready: `git ls-files --error-unmatch .zcode/config.json` →
  TRACKED.
- (c) Baseline: `bun test` → 373 pass, 5 skip, 0 fail (378 tests, 48 files).
- (d) `scripts/leak-gate.sh` → exit 0.

## Post-work checks

- (a) GREEN: `.zcode/config.json` gone from the tree and from the index
  (`git ls-files .zcode/` lists no config.json).
- (c) `bun test` → 0 fail (same totals: 378 tests across 48 files — the
  hook unit tests in `scripts/hooks/session-brief.test.ts` survive).
- (d) `scripts/leak-gate.sh` → exit 0.
- `git diff` review: exactly two changes — the deletion and the one-hunk
  lead rewrite; no machine home paths in the diff; all other workflow.md
  sections byte-identical.
- Section claims match reality: the lead states "so no hooks run"; nothing
  in the section claims hooks are wired or running.

Not run in this task (owned by task 2.1, the whole-change verification):
`tsc --noEmit`, `openspec validate`, `skill/verify/checks.ts`. No product
code changed here, so those are not_assessed at task level, not failed.

## Files touched

- `.zcode/config.json` — deleted (git rm).
- `docs/workflow.md` — hooks section lead rewritten to the parked state.
- `scripts/hooks/` — untouched, as required.

## Decisions

- Kept the soft-phase and escalation sentences from the old lead: the brief
  requires the parked lead to carry "soft phase, warn never block, CI stays
  the final bar", and escalation-on-recorded-trigger is part of that
  semantics.
- Did not touch tasks.md (ticking the checkbox is the apply-stage bookkeep,
  not listed in this task's edits).

## Concerns

- None blocking. Follow-up already recorded in design.md Deferrals:
  restore the wiring (recreate from the process-hooks archive, approve
  once) when the client ships a working workspace hook trust review.
