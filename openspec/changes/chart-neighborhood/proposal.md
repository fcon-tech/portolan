## Why

On multi-file tasks, agents find architecturally distant files by luck:
hidden-dependency workloads are defined by lexical blindness (BM25 78.2%
vs vanilla 76.2% there — retrieval has no signal), and the failures sit at
system level while existing graph aids stop at file/symbol level
(`measured`, direction: the "Code Isn't Memory" controlled ablation,
arXiv 2606.22417 — a structural index beats agentic grep on multi-file
localization at lower $/solve; CodeCompass, arXiv 2602.20048 — a graph
tool reached 99.4% vs 76.2% on hidden-dependency tasks). Effect magnitudes
are `doubtful` — one self-evaluating preprint on a 71-node repo — and are
claimed nowhere in this change.

The Chart already holds the answer: fairways between vessels, each with
anchors and a trust label. But no served tool can ask "what does X
touch?" — the only traversal lives in Chart Room browser JS, a passive
surface, exactly the channel the design law forbids (passive surfaces fail
or rot; tool outputs and mandated instructions are the two channels agents
honor). And an uninvoked tool is worth zero: CodeCompass measured 42%
invocation, 99.5% accuracy when invoked vs 80.2% when skipped
(`charted`; single paper — the caveat travels with the design). So the
tool ships only together with its invocation contract.

docs/MANIFEST.md already promises "typed inter-unit dependencies
(fairways)"; today a fairway is typed only by being one. This change makes
the typing real, minimally.

## What Changes

- **`chart.neighborhood` tool** (the fourteenth served tool):
  `neighborhood(vessel, depth=1, direction="both", verify=false,
  maxEdges=40, maxBytes=32768)` — traverses the Chart's fairways from one
  vessel and returns anchored edges (endpoints, trust label, optional
  relation, staleness, anchors with line numbers) plus the touched vessels
  and their ports of entry, ranked by direct fan-in, greedily packed into
  a records+bytes budget, with loud truncation.
- **Optional fairway relations** (ontology): a closed enum
  `build | runtime | config` — what anchors can actually support. Untyped
  fairways stay valid; relations are recorded when an expedition asserts a
  fairway (skill pass 2), no backfill expedition.
- **Invocation contract** (new `invocation` capability): the skill
  mandates the call at a concrete trigger — a task touching more than one
  file or vessel requires `chart.neighborhood` for each touched vessel
  before edits — placed in the session-start region; the tool desk lists
  the tool; `trust.report` reports per-tool adoption (invocation count,
  first and last receipt) from the ship's log.
- **Manifest alignment**: the tool table grows to fourteen; the Chart
  section notes the optional relation.

## Capabilities

### New Capabilities

- `invocation` — the rule that a chart-query tool whose value depends on
  being called ships only with a mandated trigger, a tool-desk row, and a
  per-tool adoption counter in `trust.report`. `chart.neighborhood` is the
  first instance; the staleness re-survey queue (future change) reuses the
  same triple.

### Modified Capabilities

- `tools`: adds `chart.neighborhood` (ADDED delta) — traversal with
  direction/depth and cycle safety, fan-in ranking under a budget,
  on-demand verification that names refuted edges, read-only honesty with
  staleness flagged, and an honest unsurveyed error for unknown vessels.
- `chart`: adds optional typed relations on fairways (ADDED delta) —
  closed enum, rejection naming the enum, untyped stays valid.

## Impact

- Code: `core/src/tools/neighborhood.ts` (new; reuses `readChart`,
  `refreshStaleness`, `soundAnchor`), `core/src/server/registry.ts`
  (fourteenth tool), `core/src/types.ts` + `core/schema/chart.schema.json`
  + validation (relation enum), `core/src/tools/trust-report.ts` (adoption
  block), `skill/SKILL.md` (mandate, tool desk, pass-2 relation),
  `skill/verify/checks.ts` (mandate presence checks).
- Tests: fixture suites for every scenario; a corpus-guarded Bigtop
  integration test (non-empty hub neighborhood, fan-in order, loud budget
  truncation, `verify` refuting a planted anchor) that skips when the
  corpus is absent, so CI stays green without it.
- Evidence discipline: direction `measured`, magnitudes `doubtful` and
  never quoted; no agent-level ablation in this change — the localization
  effect on Bigtop-scale repos stays `unsurveyed`; adoption analytics
  report invocation counts, not mandate compliance.

## Non-goals honored

Not a grep replacement (lexical search stays the single-file baseline; the
claim is scoped to multi-file / hidden-dependency workloads); no
transitive closure (depth ≤ 3 instead); no dossier prose in the output
(the behavior text stays behind `chart.read`); no CLI; no Chart Room
changes; no HTML or rendered surface of any kind.
