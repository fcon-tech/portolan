# Workflow — the operating protocol

This target runs two operating systems side by side: the OpenSpec cycle
(product behavior changes) and the Portolan province (the Chart, the harbor,
expeditions). This page is the assembled protocol that routes between them —
rules and pointers only, never a manual. Each home named here owns its layer:
the installer-owned block in AGENTS.md owns the harbor mandate, AGENTS.md owns
the rules, this page owns the joints between the two systems.

## J1 — the unified session briefing

- The harbor half is owned by the installer-generated block in AGENTS.md
  (between `<!-- portolan:harbor:begin -->` and `<!-- portolan:harbor:end -->`):
  run it as written at session start; the OpenSpec half follows.
- The OpenSpec half, added here: the same briefing appends the active-change
  state, if any, from `openspec list --json` — harbor queue first, then
  change state. One decision round for the Governor, not two.
- Wiring: the MCP tools `expeditions.propose` / `expeditions.decide` are
  primary. In a harness without the portolan MCP wiring, the queue runs
  read-only: `bun core/src/harbor/cli.ts propose --target . --format chat`;
  recording a decision still requires the MCP server.

## J4 — routing the work

- Product behavior changes → an OpenSpec cycle: explore → propose → apply →
  verify → archive (the `/opsx:*` stages under `.zcode/commands/opsx/`; in a
  harness without them, the same stages run by hand under the same rules),
  shipped through a merge request from a `change/<id>` branch, merged only on
  green CI.
- The cycle's procedure, owned here: `openspec validate --strict` passes
  before implementation and keeps passing; `bun test` stays green through
  apply; verify is the whole-change review plus the socratic pass — a pass
  skipped earlier still runs before the cycle is declared closed, and
  findings on an already-archived change become follow-ups, never silent
  drops.
- The cycle's test-first discipline, owned as a rule in AGENTS.md: a task
  with spec deltas gets its failing acceptance tests from those deltas
  before implementation (test-writer, then implementer); a task without
  spec deltas (docs, process) restates its verify line as checks run before
  the work — red where the work is absent — and a skipped test-first pass
  is recorded in the task report: what was skipped, why, what covers it
  instead.
- Chart and archive state corrections → an Expedition, by the Cartographer's
  method (skill/SKILL.md).
- The hand-off, expedition → change (the worked example): an Expedition never
  mutates sources — Portolan is a reader — so a danger found in product code
  lands on the Chart with anchors, and the Governor's verdict on it is what
  opens `/opsx:explore`.

## The merge-to-repair loop

A merge is a survey event; docs/engineering.md §4 owns the loop, and the
night watch acts on it overnight.

## The night watch

The loop's scheduled variant — the night watch, which auto-repairs within the
configured bound — is specified in adapters/README.md, section "The night
watch (auto-repair on a scheduler)".

## Hooks — guards at the moment of writing

Three soft hooks remind at the moment of writing; the rules they serve stay
owned where this page says. Wiring: the tracked `.zcode/config.json`;
scripts: `scripts/hooks/`. This is the soft phase — a hook warns, it never
blocks (no exit 2), and CI stays the done-bar. Escalation happens only on a
recorded trigger, never by default.

- `scripts/hooks/leak-stamp.sh` serves the leak-gate rule (Verification):
  after an Edit/Write it flags the touched file when it carries a machine
  home path signature. It goes deny only if a leaked literal reaches a
  commit despite the warning.
- `scripts/hooks/harbor-markers.sh` serves the installer-owned harbor block
  in AGENTS.md (the harbor half of J1): before an Edit/Write targeting
  AGENTS.md it reminds that the block between the harbor markers is
  rewritten wholesale on install. It goes deny only if a hand edit inside
  the markers survives to an install and is reverted.
- `scripts/hooks/session-brief.ts` implements the J1 briefing mandate,
  quietly (at session start): it speaks only when the harbor queue or the
  change list is non-empty — an all-quiet province prints nothing. The
  decision round stays the Governor's.

## Roles

The Cartographer is the main agent's stance while it surveys a province — the
method is skill/SKILL.md — not a subagent role. The cycle's stage→executor
assignments live in the global agent contract (`~/.zcode/AGENTS.md`).
