# Task 2.1 report — AGENTS.md OpenSpec section collapses

Change: process-fabric. Branch: change/process-fabric. Commit: 66612d8.

## What was built

The hand-written `## OpenSpec workflow` section of AGENTS.md collapsed from
28 lines of procedure to 19 lines of rules plus a pointer (the
docs/engineering.md pattern):

- Kept as compact one-liner rules, per the dispatch: the five stages
  (explore → propose → apply → verify → archive) as openspec's own commands
  under `.zcode/commands/opsx/` (with the `/opsx:*`-or-by-hand note); the
  nothing-ships-without-a-cycle / nothing-stays-unarchived rule; MR from a
  `change/<id>` branch, never straight to `main`; merge only on green CI; at
  merge time bump the `@portolan/core` version and add the change's
  `CHANGELOG.md` entry (the reviewer concern from 1.1 — preserved).
- The end-of-file fallback paragraph (harness without the portolan MCP
  wiring) folded into the collapsed rules as its one sanctioned line:
  read-only queue via `bun core/src/harbor/cli.ts propose --target .
  --format chat`; recording a decision still requires the MCP server.
- Pointer added: the assembled protocol (briefing, routing, joints) is fixed
  in docs/workflow.md; it owns the procedure.

## Files touched

- `AGENTS.md` — the section plus the one sanctioned fold; nothing else.

## Verification done

- `git diff AGENTS.md` inspected: one hunk rewrites only the section; the
  second removes only the fallback paragraph. `grep -cE "^[+-].*portolan:harbor"`
  over the diff: 0 — the installer-owned block is byte-identical (the marker
  line appears only as diff context).
- Everything outside the section is byte-identical: title, key rules,
  working principles, Verification, and the harbor block (checked in the
  diff hunks' context lines).
- `scripts/leak-gate.sh` — exit 0.
- `bun test` — 372 tests across 47 files, 0 fail (docs-only change; run to
  keep the green claim honest, not because the diff could affect it).

## Decisions made

- Where each dropped line now lives (review-corrected: the first version of
  this report mapped one clause falsely):
  - Stage-by-stage mechanics (`openspec new change`, per-task dispatch,
    archive command) — owned by the opsx stage commands themselves
    (`.zcode/commands/opsx/*.md` with matching skills), which AGENTS.md
    already named as the stages' home; the cycle as protocol stays in
    docs/workflow.md J4.
  - CORRECTION (review finding 1): the earlier version of this report also
    claimed the opsx stage commands own "validate --strict before
    implementation" — false. Grep over `.zcode/commands/opsx/` and the
    openspec skills finds no such line, and docs/workflow.md had no
    "validate" at all. The clause now has its standing home in
    docs/workflow.md J4's cycle-procedure line: `openspec validate --strict`
    passes before implementation and keeps passing.
  - "Keep `bun test` green" and the verify-stage clauses (a pass skipped
    earlier runs before the cycle is declared closed; findings on an
    already-archived change become follow-ups, never silent drops) — home:
    docs/workflow.md J4's cycle-procedure line (review finding 2). Judged
    genuine procedure, not redundant: the AGENTS.md "Verification" block is
    the final done-bar, not the apply-stage discipline.
  - "Otherwise run the same stages by hand" — mirrored in docs/workflow.md
    J4 (in a harness without the opsx stages, the same stages run by hand
    under the same rules); AGENTS.md keeps the rule as committed (review
    finding 3).
  - Whole-change review, socratic pass advisory, deferrals recorded in the
    change's design.md, implementer/test-writer non-parallelism — the global
    agent contract already states all of it.
  - "Living specs are the source of truth; repair drift on sight" —
    docs/engineering.md (precedence paragraph) already states it.
- The tasks.md verify line "AGENTS.md states no procedure that
  docs/workflow.md does not own" is read with design D2's split: rules stay
  in the contract, procedure lives in docs. The merge-time one-liners are
  rules; the dispatched scope explicitly kept them in AGENTS.md, so they are
  not duplicated into docs/workflow.md.
- The fallback fold keeps the information reachable in AGENTS.md in one line
  (inside the collapsed rules), per the dispatch; docs/workflow.md J1 owns
  the full briefing procedure.

## Concerns

- None.
