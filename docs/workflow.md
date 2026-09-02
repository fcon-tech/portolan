# Workflow — the operating protocol

This target runs two operating systems side by side: the OpenSpec cycle
(product behavior changes) and the Portolan province (the Chart, the harbor,
expeditions). This page is the assembled protocol that routes between them —
rules and pointers only, never a manual. Each home named here owns its layer:
the installer-owned block in AGENTS.md owns the harbor mandate, AGENTS.md owns
the rules, this page owns the joints between the two systems. Assembled 2026-09-02
by the process-fabric change.

## J1 — the unified session briefing

- The harbor half is owned by the installer-generated block in AGENTS.md
  (between `<!-- portolan:harbor:begin -->` and `<!-- portolan:harbor:end -->`):
  at session start, before other work — proposals first, in one chat message,
  one one-phrase decision. That block stays the short authority.
- The OpenSpec half, added here: the same briefing appends the active-change
  state, if any, from `openspec list --json` — harbor queue first, then
  change state. One decision round for the Governor, not two.
- Wiring: the MCP tools `expeditions.propose` / `expeditions.decide` are
  primary. In a harness without the portolan MCP wiring, the queue runs
  read-only: `bun core/src/harbor/cli.ts propose --target . --format chat`;
  recording a decision still requires the MCP server.

## J4 — routing the work

- Product behavior changes → an OpenSpec cycle: explore → propose → apply →
  verify → archive (the `/opsx:*` stages under `.zcode/commands/opsx/`),
  shipped through a merge request from a `change/<id>` branch, merged only on
  green CI.
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
watch (auto-repair on a scheduler)"; this page adds nothing to it.

## Roles

The Cartographer is the main agent's stance while it surveys a province — the
method is skill/SKILL.md — not a subagent role. The cycle's stage→executor
assignments (test-writer, implementer, code-reviewer, socratic-advisor,
security-auditor) live in the global agent contract (`~/.zcode/AGENTS.md`);
this page defers to it and copies nothing.
