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

- Where each dropped line now lives (nothing silently lost):
  - Stage-by-stage mechanics (what each stage does: `openspec new change`,
    validate before implementation, per-task dispatch, archive command) —
    owned by the opsx stage commands themselves (`.zcode/commands/opsx/*.md`
    with matching skills), which AGENTS.md already named as the stages' home;
    the cycle as protocol stays in docs/workflow.md J4.
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
