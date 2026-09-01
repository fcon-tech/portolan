# Design — chart-neighborhood

## The design law applied

Insight 3 of the backlog research: passive surfaces fail or rot; the two
channels agents demonstrably honor are instructions that mandate tool
calls and tool outputs. The Chart Room already traverses the fairway
graph — in browser JS, a passive surface, the exact channel the law
forbids. This change moves traversal into a served tool output and leaves
the Chart Room untouched. The corpse field (CodeSee, Sourcetrail,
Structurizr Cloud) is the standing warning against the alternative.

## Why the invocation contract is part of the change, not a follow-up

CodeCompass measured 42% invocation; accuracy 99.5% when invoked vs 80.2%
when skipped; zero graph-tool calls in 30 trials of the task class the
tool was built for, fixed to 31/31 by prompt re-engineering. All
`charted` — single paper, single small repo, effect likely to shrink on
transfer — but the direction is what matters: a differentiated tool that
agents ignore is worth zero and can add prompt overhead. So the tool
ships only with (a) a skill mandate at a concrete trigger, (b) a tool-desk
row, (c) per-tool adoption counters in `trust.report` (the receipts
channel already exists). The contract is spec'd as its own capability so
the future staleness re-survey queue rides it without a new shape.

The mandate sits in the session-start region — the skill's analog of the
CodeCompass checklist-at-END lesson: the trigger must be read before work
begins.

## Deliberately small mechanics

- **Direct fan-in, not PageRank, not transitive.** Fan-in ranking is an
  Aider-lineage engineering choice with a production precedent and no
  rigorous published eval (`reported`); it is used because it is
  deterministic, cheap, and recomputable from charted bytes alone — not
  because it is a proven effect. Transitive fan-in would add cost and
  instability for no spec'd behavior.
- **Budget in records + bytes, not tokens.** Token counts vary by harness
  tokenizer; edges and bytes are deterministic and verify-able in tests.
  Defaults are conservative (40 edges / 32 KiB); caps exist so a caller
  cannot inflate the surface arbitrarily.
- **Depth ≤ 3, no transitive closure.** Iterative-friendly output with
  follow-up queries encouraged (the ACI lesson): the agent deepens by
  calling again on a neighbor rather than receiving an unbounded closure.
- **`verify` is opt-in.** The default serves chart truth with its trust
  labels — the honesty lives in the labels, and `trust.report` remains
  the standing full-verification surface. Re-sounding every edge on a hot
  navigation path by default would make the common case pay for the
  paranoid case. With `verify: true` the machinery is `soundAnchor`,
  already deterministic and evidenced (negative and positive probes
  verified against the Bigtop corpus before this change was proposed).
- **Vessel-only entry.** Symbol-level adjacency belongs to `symbols`;
  file-level to `sweep`. A second entry granularity would double the
  schema for no spec'd scenario; a file resolves through `chart.read`
  (`vessel.paths`), a symbol through `symbols`.

## Why the relation enum is `build | runtime | config`

The proposal's evidence speaks of typed edges (CodeCompass:
IMPORTS/INHERITS/INSTANTIATES) — symbol-level senses our vessel-level
fairways do not carry. What our anchors do support today are build-time
dependence (poms, BOM, specs, control), runtime association (launch
scripts, service wiring), and config/data reading (beacon-like links).
Three values, closed, optional; untyped stays valid so existing charts
need no migration and no backfill expedition — relations accrue as
expeditions touch fairways (skill pass 2 records them). If a future
expedition proves the enum too coarse, extending a closed enum is a small
delta; unwinding a mandatory taxonomy is not.

## Honest evidence bookkeeping

- Direction (`measured`): structural navigation beats lexical baselines on
  multi-file/hidden-dependency localization — one controlled ablation,
  one corroborating preprint.
- Magnitudes (`doubtful`): 99.4% and friends are never quoted as expected
  effects; they come from one self-evaluating preprint on a 71-node repo.
- The localization effect at Bigtop scale: `unsurveyed`. No agent-level
  ablation is in this change (Governor's decision, 2026-09-01); what is
  proven deterministically is that the tool returns the correct subgraph,
  ranked, budgeted, and verification-honest.
- Adoption analytics count invocations from receipts — facts, not a
  compliance measurement of the mandate.

## Alternatives considered and rejected

- **`chart.read` filters** (by vessel, staleness): still a document dump;
  no ranking, no budget, no edges-first shape. Rejected by the design law.
- **CLI command**: no harness honors CLIs as a navigation channel; the
  MCP tool is the served surface.
- **Chart Room neighborhood highlighting**: a UI surface; corpse-field
  suspicion; not requested by any scenario.
- **Symbol-level neighborhood**: doubles the ontology for unproven need;
  revisit only with a real workload that vessel-level cannot serve.

## Deferrals

(recorded from the socratic-advisor pass; see below)
