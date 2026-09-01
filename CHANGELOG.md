# Changelog

## 0.3.0 — 2026-09-01

The neighborhood query — structural navigation as a served tool (OpenSpec
change `chart-neighborhood`): the question "what does X touch?" moves from
Chart Room browser JS (a passive surface) to the fourteenth MCP tool,
shipped only with its invocation contract because an uninvoked tool is
worth zero.

- **`chart.neighborhood`** — one vessel in, the anchored neighborhood out:
  fairways in the requested direction to the requested depth (≤ 3,
  cycle-safe), each edge with anchors, trust label, optional relation, and
  staleness; touched vessels with their ports of entry; ranked by direct
  fan-in and greedily packed into a records+bytes budget that states its
  cuts (`truncated`, `droppedEdges`, `droppedVessels`); the queried vessel
  is always present. Honest `unsurveyed` error for a vessel not on the
  Chart. Each call appends its own ship's-log receipt.
- **On-demand verification**: `verify: true` re-sounds every returned
  edge's anchors; unresolvable or anchorless edges are refuted by name,
  never confirmed on zero soundings.
- **Invocation contract** (new `invocation` capability): the skill
  mandates the call at session start — a task touching more than one file
  or vessel requires the neighborhood of each touched vessel before the
  first edit; `trust.report` gains an `adoption` block reporting per-tool
  invocation counts with first/last receipt ids — invocation facts, not a
  compliance measurement.
- **Typed fairways**: optional `relation` enum `build | runtime | config`
  on fairways, recorded when evidence shows it; untyped stays valid.
- **Bigtop leg**: a corpus-guarded integration test (`PORTOLAN_BIGTOP_
  CORPUS` env; skips in CI without it) proves hub ranking, loud
  truncation, and refutation of a planted anchor on the real chart.
  Evidence discipline: navigation direction `measured` (one controlled
  ablation, one corroborating preprint); magnitudes stay `doubtful`; the
  Bigtop-scale localization effect remains `unsurveyed`.
- Spec deltas applied to `tools`, `chart`, `invocation` (new), `harness`.

## 0.2.0 — 2026-08-31

Verification as the product spine (OpenSpec change `verification-spine`):
the properties Portolan always enforced — anchors, trust labels, receipts,
staleness — become the marketed, queryable product surface.

- **`trust.report`** — the thirteenth MCP tool: one call returns the
  province's verification summary — trust-label distribution, per-kind
  counts, staleness refreshed first, every chart anchor re-sounded
  deterministically with refuted ones named verbatim, ship's-log tail.
  Read-only; no input; deterministic on an unchanged province.
- **Sailing Directions** carry the verification summary; the skill mandates
  calling `trust.report` for the brief, and refuted anchors are reported,
  never smoothed over.
- **Positioning with receipts**: README and the landing page state the
  verification spine, every differentiation claim anchored to committed
  receipts — the self-chart report (`docs/demo/trust-report.md`) and the
  dated competitor trials (`docs/verification-trials.md`, Serena &
  Sourcegraph MCP: no surveyed tool markets the combination).
- **Security hardening**: anchor soundings and staleness walks now refuse
  to read past the target perimeter (realpath containment, symlink-safe);
  the receipt renderer is injection-safe and redacts inline secrets.
- Spec deltas applied to `tools`, `expedition`, `harness`; glossary gains
  the trust report (верификационная сводка).
