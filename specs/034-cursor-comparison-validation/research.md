# Research: Cursor Comparison Validation

## Decision: Use `/home/fall_out_bug/projects/bigtop-landscape` As The Fixed Target

**Rationale**: The clarified spec selects Apache Bigtop as the shared target.
Using one fixed local target keeps Cursor-alone and Cursor-plus-Portolan
comparable and prevents post-hoc target selection. Results must distinguish
local checkout scope from complete Apache Bigtop ecosystem coverage.

**Alternatives considered**:

- `/home/fall_out_bug/projects/vibe_coding`: real 30-repo local landscape, but
  not selected during clarification.
- `testdata/landscape-map`: more repeatable, but too fixture-like for the core
  product claim.
- Evaluator-provided target: flexible, but weakens comparability for the first
  validation slice.

## Decision: Use Existing Local Portolan Commands, Not A New Harness

**Rationale**: `portolan context prepare --root`, `portolan map --root`, and
`portolan graph slice` already provide the required local artifacts. A new
evaluation harness would add moving parts before the comparison has proven that
the workflow deserves automation.

**Alternatives considered**:

- Dedicated Go scoring command: premature; scoring rubric may change after the
  first ledger.
- External evaluation framework: not justified for a local, private,
  agent-output comparison and may increase privacy/process risk.
- Manual-only narrative review: too weak; the spec needs structured scores and
  unsupported-claim counts.

## Decision: Cursor-plus-Portolan Starts From Bounded Artifacts

**Rationale**: The assisted lane should receive the context pack,
`summary.json`, `graph-index.json`, and targeted slices only when needed. This
tests the agent-facing product path and avoids making full `graph.json` the
first-pass prompt input.

**Alternatives considered**:

- Context pack only: may under-test the map bundle value.
- Full map bundle including `graph.json` and `map.md`: risks testing prompt
  overload rather than useful bounded navigation.
- Human-curated brief: hides whether Portolan artifacts are usable by an agent.

## Decision: Classify Claims With Explicit Thresholds

**Rationale**: The clarified rule accepts the claim only when unsupported
claims drop by at least 50% and useful next actions are equal or better on at
least 75% of questions. Passing exactly one threshold narrows the claim;
passing neither rejects it; inability to run either lane blocks it.

**Alternatives considered**:

- Qualitative evaluator decision: too easy to rationalize after results.
- Safety-only acceptance: insufficient if the assisted lane is safer but not
  useful.
- All-dimension perfect win: too brittle for agent nondeterminism.

## Decision: Keep Raw Evidence Locally Auditable But Not Public-Ready

**Rationale**: The ledger must retain prompts, raw outputs, artifact paths or
checksums, per-question scores, unsupported-claim counts, `unknown` and
`not_assessed` notes, and final rationale. This is enough for review without
claiming that private prompts or target details are safe to publish.

**Alternatives considered**:

- Scores only: insufficient to audit unsupported claims.
- Full session recordings: stronger but too heavy for the first slice and may
  capture private details.
- Human summary only: not reproducible enough for product-claim gating.
