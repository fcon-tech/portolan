# Task 1.1 report — the verify-first rule and its procedure

Change: verify-first, task 1.1. Branch: `change/verify-first`.
Commit: `2963738` (`docs(workflow): install the verify-first rule and its procedure`).

## What was built

Two homes, per design D2:

- `AGENTS.md`, "The rules:" list of the OpenSpec workflow section — one
  rule line: verification is written before the work, and a skipped
  test-first pass is a recorded decision in the task report, not a default.
- `docs/workflow.md`, J4 — one procedure bullet, placed after the
  cycle-procedure bullet: a task with spec deltas gets its failing
  acceptance tests from those deltas before implementation (test-writer,
  then implementer); a task without spec deltas (docs, process) restates
  its verify line as checks run before the work — red where the work is
  absent — and a skipped test-first pass is recorded in the task report
  (what was skipped, why, what covers it instead). The bullet points at
  AGENTS.md as the rule's owner, keeping the layering (AGENTS.md owns the
  rules, workflow.md owns the procedure).

Nothing else in either file. The harbor block was not touched.

## Files touched

- `AGENTS.md` (+2 lines: one rule, wrapped)
- `docs/workflow.md` (+7 lines: one bullet, wrapped)

## Verification (task's verify line, restated as runnable checks — run pre-work, per design D1)

### Pre-work run (baseline; the edit is additive, so the wording check starts red)

1. Harbor block byte-identical to main:
   `diff <(git show main:AGENTS.md | sed -n '/portolan:harbor:begin/,/portolan:harbor:end/p') <(sed -n '/portolan:harbor:begin/,/portolan:harbor:end/p' AGENTS.md)`
   → empty, `HARBOR-BLOCK-IDENTICAL`. **verified**
2. No `verify-first`/`test-first` wording in either file:
   `grep -n -i -E 'verify-first|test-first' AGENTS.md docs/workflow.md`
   → exit 1 (absent). This is the red state where the work is absent.
   **failed (expected — red)**
3. `scripts/leak-gate.sh` → exit 0. **verified**

### Post-work run (green)

1. Harbor block diff vs main → empty again. **verified**
2. `grep -n -i -E 'verify-first|test-first' AGENTS.md docs/workflow.md`
   → exactly the installed lines: `AGENTS.md:56`, `docs/workflow.md:36`,
   `docs/workflow.md:40`. **verified**
3. `scripts/leak-gate.sh` → exit 0. **verified**
4. Full `git diff` review of both files → only the two scoped additions;
   no other lines touched in either file. **verified**

### Manual checks (judgment checks; no executable gate exists — see recorded skip)

- Both homes consistent (rule vs procedure split): the AGENTS.md line states
  the rule only; the J4 bullet owns the two cases and the skip-record shape
  and names AGENTS.md as the rule's owner. Matches the D2 pattern (rule in
  AGENTS.md, procedure in workflow.md, like the MR/green-CI rule).
  **verified (manual)**
- Locked terminology: no synonyms introduced; the new text reuses the
  established vocabulary (task, spec deltas, test-writer, implementer,
  cycle, task report). No "captain"/"admiral". **verified (manual)**
- House voice: both additions are rules/pointers, no manual prose — the J4
  bullet mirrors the existing "The cycle's procedure, owned here:" shape.
  **verified (manual)**

### Recorded skip (per the rule this task installs)

What was skipped: a failing executable test written before the edit. Why:
the change carries no spec deltas (`skip_specs: true` in `.openspec.yaml`)
and no doc-gate script exists — the executable served-doc checks are
deferred by design.md (trigger: first broken pointer or locked-term
violation in a served doc after merge). What covers it instead: the verify
line was restated as the runnable checks above and run before the edit
(red on the wording check, baseline green on harbor/leak-gate), plus the
manual checklist and the verify-stage whole-change review.

## Scope guard

No product code, specs, tools, adapters, or harness files touched. No
machine home paths in the added text or this report.

## Concerns

None.
