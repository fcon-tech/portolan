# Brownfield Preflight Roadmap

This roadmap resets Portolan around one narrow product job:

> Before an AI agent works on a brownfield system, Portolan runs a local
> preflight that maps what is visible, selects the useful local
> code-understanding tools, records what is still blind, and hands a bounded
> context pack to the agent.

The point is not to build a new coding harness, governance platform, dashboard,
or enterprise code-intelligence replacement. The point is to make the first
ten minutes of AI work on legacy or multi-repo code safer and visibly better.

## Decision Gate

- Simpler/Faster: reuse the existing `context prepare`, `map`, query, tool
  registry, and OSS-plan artifacts before adding new scanners or UI.
- Blocking Edge Cases: tool acquisition can involve network access, licenses,
  target writes, global agent config, credentials, daemons, and stale outputs.
  The preflight must surface those risks before any execution or install.
- Existing Open Source: Portolan should choose, configure, and normalize mature
  local tools such as SBOM scanners, duplication scanners, static analyzers,
  symbol/reference producers, graph explorers, and agent skill/MCP surfaces
  instead of reimplementing their core logic.

## Product Promise

Portolan Brownfield Preflight answers four questions for an engineering leader
or agent operator:

1. What does the local system shape look like?
2. Which local tools should be used next, and why?
3. What can the AI agent safely know from current artifacts?
4. Where is it still blind or blocked?

Evidence states remain important, but they are an implementation quality. The
user-facing promise is orientation and toolchain readiness before AI changes or
answers about a brownfield system.

## Non-Goals

- No autonomous coding loop.
- No model routing or multi-agent orchestration.
- No default network access.
- No default external tool installation.
- No default target repository mutation.
- No daemon, watcher, or live dashboard.
- No complete architecture, runtime topology, call graph, or readiness claim.
- No enterprise governance platform.

## Current Spec Reinterpretation

The existing roadmap produced a useful evidence substrate, but the late P6 wave
over-optimized for proof closure and claim hygiene. That work should be treated
as reusable substrate, not as the product sequence.

| Existing slice | New interpretation |
| --- | --- |
| 001-005 | Core local evidence and black-box substrate. Keep. |
| 008, 014-018, 020, 022-027 | Agent handoff substrate. Keep as input to preflight. |
| 009-013, 024, 028-033 | Map, finding, query, and bounded graph substrate. Keep. |
| 034-039 | Product claim hygiene. Keep as guardrails, not roadmap driver. |
| 040-050 | Public/release/demo infrastructure. Keep, but do not extend until preflight works. |
| 051-083 | Tool/evidence expansion wave. Reuse specific pieces only when they improve preflight. |
| 084 | Park. Tool profiles alone are not a product slice. |
| 085 | Defer. ast-index import is useful only after preflight selects it for a target. |
| 086 | Park. UX navigation patterns must become preflight orientation, not another guide artifact. |

## Correct Roadmap

### Phase 1: Bigtop Brownfield Preflight

Create one Bigtop-centered preflight bundle from existing local Portolan
artifacts. It should show target shape, toolchain state, next useful tools,
blind spots, and agent handoff. It should not install or run external tools by
default.

Start slice: `docs/specs/087-bigtop-brownfield-preflight/`.

### Phase 2: Toolchain Doctor

Turn candidate guidance into a real local diagnostic surface:

- installed or missing tools;
- executable versions;
- license class;
- network/install requirement;
- target mutation risk;
- output compatibility;
- evidence family unlocked by each tool.

The doctor may recommend actions, but execution remains opt-in.

### Phase 3: Approved Acquisition Plan

Add a safe acquisition plan for selected tools. The output should provide exact
commands, expected outputs, risk boundaries, and rollback/cleanup notes. Portolan
still does not run network install commands without explicit approval.

### Phase 4: Run, Import, Refresh

After a user approves one selected producer path, Portolan can help run or ingest
the output, then refresh the preflight bundle. Success is a before/after delta:
which blind spots became visible and which remain unknown.

### Phase 5: Agent Usefulness Validation

Compare an AI agent with and without the preflight on the same Bigtop task. The
success measure is visible first-run usefulness:

- the agent knows where to start;
- it uses the right local artifacts and tools;
- it names blind spots without being prompted;
- the operator sees a product difference in minutes.

Unsupported claim reduction remains a quality metric, not the main product
story.

## Bigtop Start Contract

Bigtop is the first demonstration target because it is messy, multi-repo,
integration-heavy, and already has local Portolan evidence. It is not a special
product mode and must not require hidden scaffolding.

The first Bigtop preflight should produce:

- `preflight.md`: CTO/operator summary with target shape, top blind spots, and
  next probes.
- `toolchain.json`: normalized tool availability and recommendation records.
- `agent-handoff.md`: concise instructions for Cursor, Codex, OpenCode, or pi.
- `preflight-gaps.jsonl`: missing evidence families and why they are missing.
- links to existing `context`, `map`, `summary`, `findings`, `graph-index`,
  `oss-plan`, and `gaps` artifacts.

## Parking Lot

These may become separate products only after Brownfield Preflight proves the
first job:

- merge/release gates;
- full AI delivery traces;
- eval platform;
- management dashboards;
- procurement or license workflow;
- agent runtime policy engine;
- live service topology capture.
