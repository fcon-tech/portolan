## Why

On a large landscape (hundreds of repositories), an agent cannot load everything
into its context window — it flails across repos and floods the budget. The
agent needs compact, query-bounded **expedition context packs** that carry just
what a specific investigation requires, so it navigates deliberately instead of
dumping the whole graph.

## What Changes

- The agent-atlas SHALL produce compact expedition context packs: bounded,
  query-relevant bundles (units, edges, surfaces, findings, anchors) scoped to a
  specific investigation/question.
- A pack SHALL be small enough to fit an agent context budget by default; a full
  landscape SHALL be opt-in, never the default agent surface.

## Capabilities

### Modified Capabilities

- `atlas-identity`: adds expedition context packs as the agent-facing delivery
  shape. This concretizes the economical-tentacles requirement already proposed
  in `agent-atlas-foundation` (which states the principle); this change makes
  the pack the concrete mechanism.

## Impact

- Depends on / concretizes `agent-atlas-foundation` (economical tentacles).
- Out of scope: the pack format and query language (design TBD).
