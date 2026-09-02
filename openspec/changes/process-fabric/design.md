## Context

Two operating systems run this repo side by side: the OpenSpec cycle
(`openspec/`, `.zcode/commands/opsx/`, rules in `AGENTS.md`) and the
Portolan province (`.portolan/`, harbor CLI in `core/src/harbor/`, the
Cartographer's method in `skill/SKILL.md`). The crew is global
(`~/.zcode/agents/`, orchestrated by `~/.zcode/AGENTS.md`); the repo ships
no agent definitions of its own. The repair loop already works
mechanically: merge → source drift → resurvey → harbor proposals
(`adapters/opencode/expedition-launcher`, crontab template in
`adapters/scheduling/night-watch.cron`). What is missing is the process
layer that names the joints and routes the work. See proposal.md — Why.

## Goals / Non-Goals

**Goals:**

- One document (`docs/workflow.md`) that a fresh session can follow end to
  end: briefing, routing, joints J1–J4, role matrix.
- `AGENTS.md` returns to a thin contract: key rules + pointer, like
  `docs/engineering.md`.
- The night watch enters the process as a named, already-built loop —
  referenced, not rebuilt.

**Non-Goals:**

- No product code changes: nothing in `core/`, `adapters/`, `skill/`,
  `acceptance/`.
- No new agent definitions in the repo.
- No product-level openspec awareness (the Chart does not learn to read
  `openspec/` as anything more than ordinary docs/intent sources it may
  already cite as `reported`).
- No machine-local facts in tracked files (leak-gate holds: the installed
  crontab variant stays on the machine).

## Decisions

- **D1 — Process-level integration, not product.** The Governor decided
  (2026-09-02): assemble the integration in the repo's operating documents.
  Alternative rejected for now: teaching Portolan to model openspec
  projects (spec files as intent sources, change-linked Notices). That
  stays a deferred product idea with a trigger below; the MANIFEST
  non-goal ("no openspec-delta generation") is untouched either way.

- **D2 — The protocol lives in `docs/workflow.md`; `AGENTS.md` points.**
  Same pattern as `docs/engineering.md`: the workspace contract keeps the
  few rules that must survive every summary, the full protocol lives in
  docs. `skill/SKILL.md` is deliberately untouched: it serves any target
  province, and knowing about openspec is this repo's business, not a
  generic Cartographer's. Alternative rejected: extending SKILL.md §0 with
  openspec awareness — that would contaminate a target-generic skill.

- **D3 — No repo-level agent editions.** The global roster
  (`~/.zcode/agents/`) covers every stage; nothing in the cycle or the
  expedition needs repo-specific role text (chart edits are verified by
  soundings, not by code-reviewer). What breaks without repo editions:
  nothing observed. Revisit trigger: a role repeatedly missing a
  repo-specific rule (locked terminology, anchors, no-self-certification)
  in its findings.

- **D4 — The night watch is referenced, not rebuilt.** The launcher exists
  (`adapters/opencode/expedition-launcher`; contract and cron template
  already documented in `adapters/README.md`). The process doc names the
  loop and how to check which variant is installed on this machine
  (`crontab -l`); it does not pin paths — leak-gate forbids machine home
  paths in tracked files.

- **D5 — Briefing order: harbor first, then cycle status.** `AGENTS.md`
  already mandates the harbor watch "at session start, before other work";
  the assembled briefing keeps that order and appends the OpenSpec state
  (`openspec list --json`): active change(s), if any, in the same message.
  One decision round for the Governor, not two.

- **D6 — No spec deltas; `skip_specs: true`.** The change alters process
  documents only; served behavior is untouched. Specs describe behavior, so
  inventing a "workflow" capability would be spec theater.

- **D7 — The `AGENTS.md` harbor block is installer-owned; the protocol
  defers to it.** The block between `<!-- portolan:harbor:begin/end -->` is
  generated and idempotently rewritten by `adapters/opencode/install.ts`
  (tested in `core/src/server/adapters.test.ts`); hand edits there are
  silently reverted on the next install. So the unified briefing (J1) is
  written to defer to that block — the block stays the short authority,
  `docs/workflow.md` adds only what it lacks (the OpenSpec half of the
  briefing, one decision round). This change edits `AGENTS.md` strictly
  outside the markers, and task 3.1 verifies the block survives the diff
  byte-identical.

- **D8 — The protocol is rules and pointers only (socratic bound).** The
  socratic pass (2026-09-02, advisory) collapsed three planned elements:
  the expedition→change hand-off folded into J4 as its worked example (same
  fact stated twice); the role matrix folded into one sentence (every other
  assignment is already fixed by `~/.zcode/AGENTS.md`); the night-watch
  clause reduced to a reference line (`adapters/README.md` owns both
  variants and the cron wiring). The merge-to-repair loop is one line plus
  cross-references (`docs/engineering.md` §4 already states it; the harbor
  CLI enforces it). Nothing in `docs/workflow.md` may restate READMEs,
  `engineering.md`, or the global agent contract — a restatement is drift
  with two homes.

## Risks / Trade-offs

- [Procedure drifts between its homes (AGENTS.md, docs/workflow.md, the
  installer-owned block)] → each home owns a distinct layer: the installer
  block owns the harbor mandate, AGENTS.md owns rules, workflow.md owns the
  assembled protocol; nothing is stated twice (D8). Whenever routing
  changes, all three are reviewed in the same change.
- [A fresh agent never reads workflow.md] → the pointer in AGENTS.md is
  loaded every session; the doc is one click away and the briefing protocol
  is restated in AGENTS.md in one sentence.
- [Global crew edits could silently change repo behavior] → accepted risk
  of D3; the revisit trigger above is the countermeasure.

## Deferrals

- **Deferred: product-level openspec awareness** (intent-source modeling of
  `openspec/specs/`, change-linked Notices to Mariners). Why safe now: the
  resurvey queue already attributes drift by source paths; nothing in the
  Governor's current pain needs product logic. Trigger to revisit: the
  Governor regularly asks "which change drifted this vessel?" and the
  answer cannot be produced from git log alone.

- **Deferred (socratic): a fuller role matrix.** Only the one new fact
  (Cartographer = stance, not a subagent) ships; the stage→executor table
  stays in `~/.zcode/AGENTS.md`. Trigger to revisit: same as D3's trigger —
  a role repeatedly missing a repo-specific rule.

- **Deferred (socratic): machine-local operator procedure in tracked docs**
  (e.g., "check the installed variant with `crontab -l`"). Stays operator
  knowledge; `adapters/README.md` remains the single doc for variants and
  wiring. Trigger to revisit: the same question asked twice in sessions.

## Open Questions

- None. The Governor resolved the level (process), the home (docs/), the
  crew (global), and the night watch (reference) on 2026-09-02.
