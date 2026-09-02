# Task 1.1 report — docs/workflow.md

Change: process-fabric. Branch: change/process-fabric. Commit: c16c528.

## What was built

`docs/workflow.md` (new, 56 lines) — the assembled operating protocol for the
repo's two operating systems, rules and pointers only (design D8):

- **J1 — the unified session briefing.** Defers the harbor half to the
  installer-owned block between `<!-- portolan:harbor:begin -->` and
  `<!-- portolan:harbor:end -->` in AGENTS.md (short authority: proposals
  first, one chat message, one-phrase decision); adds the OpenSpec half —
  active-change state from `openspec list --json`, appended after the harbor
  queue; one decision round for the Governor, not two (design D5). Wiring:
  `expeditions.propose` / `expeditions.decide` primary; read-only fallback
  `bun core/src/harbor/cli.ts propose --target . --format chat`; recording a
  decision still requires the MCP server.
- **J4 — routing.** Product behavior changes → OpenSpec cycle (explore →
  propose → apply → verify → archive, `/opsx:*` stages, MR from a
  `change/<id>` branch, merge on green CI); Chart and archive state
  corrections → an Expedition. Worked example (the expedition→change
  hand-off): the Expedition never mutates sources, a product-code danger
  lands on the Chart with anchors, and the Governor's verdict opens
  `/opsx:explore`.
- **The merge-to-repair loop** — one line (merge as the trigger) plus
  cross-references: the loop is stated in docs/engineering.md §4.
- **The night watch** — one reference line to adapters/README.md, section
  "The night watch".
- **Roles** — the one new fact (the Cartographer is the main agent's stance,
  method in skill/SKILL.md, not a subagent) plus a pointer of the
  stage→executor assignments to the global agent contract (`~/.zcode/AGENTS.md`).

## Files touched

- `docs/workflow.md` (new)

## Test command and result

Docs-only task — the failing-first rule does not apply; no test can gate
prose. The task's verify line was executed as the checklist, mechanically:

- `scripts/leak-gate.sh` — clean (exit 0); `~/.zcode/AGENTS.md` carries no
  leak-gate signature (no `/home/`, `/Users/`, or user path segment).
- Every referenced path/command confirmed to exist verbatim: harbor markers
  in AGENTS.md; `openspec list --json` executed successfully; `propose` with
  `--target` / `--format chat` matches `core/src/harbor/cli.ts` usage and the
  AGENTS.md fallback paragraph; `.zcode/commands/opsx/` exists with the stage
  commands; skill/SKILL.md, docs/engineering.md (§4), adapters/README.md
  (heading "The night watch"), `~/.zcode/AGENTS.md` all present.
- Terminology scan: no "captain"/"admiral"; only MANIFEST-locked terms.
- Not run here (task 3.1's battery): `bun test`, `tsc --noEmit`, openspec
  validate, skill checks — no code or specs were touched.

## Decisions made

- **No J2/J3 labels.** The proposal, design (post-socratic D8), and tasks
  name only J1 and J4; the merge-to-repair loop and night watch sections are
  unnumbered rather than inventing a joint numbering the artifacts do not
  fix.
- **No enumerated stage→agent assignments.** The five role names appear as an
  index in one sentence, with zero assignments copied — D8 folded the role
  matrix into a pointer, and the task's "assignments you do mention must
  match ~/.zcode/AGENTS.md" is trivially satisfied by mentioning none.
- **Provenance line** ("Assembled 2026-09-02 by the process-fabric change")
  names the change id without a path, so it survives archive relocation.
- The merge-loop line states only the new fact (a merge is the drift
  trigger); the loop itself is pointed at docs/engineering.md §4.

## Concerns

- None blocking. One observation for task 2.1: AGENTS.md's merge-time rules
  (bump `@portolan/core`, CHANGELOG entry) are currently in the hand-written
  OpenSpec section; task 2.1 decides whether they stay as brief rules in
  AGENTS.md or move here — task 1.1's content list omitted them, so they are
  in neither slimmed form yet.
