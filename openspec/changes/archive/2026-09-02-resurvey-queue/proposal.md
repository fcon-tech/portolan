## Why

Backlog candidate C3 ("staleness as first-class state") promised two
things: pending correction as a queryable property, and a fan-in-ranked
re-survey queue. The first half already shipped — the `stale` flag is
stored on every index entry, refreshed on every read (`chart.read`,
`trust.report`, `chart.neighborhood`), reported by `trust.report`
(v0.2.0/v0.3.0; chart spec: "Staleness is pending correction"). This
change builds only the missing half.

What the Chart cannot answer today is "what do I re-survey first?". All
drifted vessels fold into one grouped repair proposal: a single queue row
with no priorities. On wide drift the Governor decides about a blob, the
night bound is all-or-nothing on the group, and the structural signal the
Chart already holds — which drifted vessel the others hang from — is
used nowhere. The research behind C3 (`measured` gap, `charted` grade:
every artifact class rots silently, nobody marks claims stale) makes the
re-survey queue the lifecycle primitive's missing half; the fan-in rank
is the same one `chart.neighborhood` serves, arithmetic over charted
bytes.

Decisions settled with the Governor in grilling (2026-09-01/02): the
queue lives in the harbor (no new tool), repair splits per vessel,
ranking is direct cross-vessel fan-in with ties by vessel id, the night
bound becomes cumulative top-N, and `trust.report` speaks with the
queue's voice.

## What Changes

- **Per-vessel repair proposals**: the grouped repair row becomes one
  proposal per pending-correction vessel — evidence
  `vessel/<id>#<stale-entry-count>`, an anchor under that vessel's
  charted paths, a scope naming the stale entries charged to it and its
  soundings. Declining one vessel no longer hides the others, and the
  refusal holds only while that vessel's drift is unchanged: the count
  in the evidence reopens the proposal when the drift grows or shrinks.
- **Fan-in-ranked repairs**: repair rows order by direct charted
  fan-in — charted fairways landing on the vessel from a different
  vessel — highest first, ties by vessel id. Deterministic over charted
  bytes; no timestamps, no judgment.
- **Cumulative night bound**: the watch auto-executes repair rows in
  queue order until `harbor.auto_repair_max_vessels` is spent; the rest
  stay pending with their evidence. (Today the bound is all-or-nothing
  on the single grouped row.)
- **`trust.report` adopts the queue's order**: the pending-vessel
  list is ranked by the same rule.

## Capabilities

### Modified Capabilities

- `harbor`: MODIFIED "Proposals are computed, not imagined" (drift
  proposes per vessel), ADDED "The repair queue is fan-in ranked"
  (the ordering rule and its determinism), MODIFIED "Auto-repair is
  bounded and never curious" (cumulative bound, highest-ranked first).
- `tools`: MODIFIED "trust.report aggregates the province's verification
  state" (the pending-vessel list carries the repair rank's order).

## Impact

- Code: `core/src/harbor/proposals.ts` (per-vessel repair, rank-aware
  queue sort), `core/src/harbor/night-policy.ts` (cumulative bound),
  `core/src/tools/trust-report.ts` (pending-list ordering), and a small
  fan-in helper as a leaf module with exactly two importers (the harbor
  queue and `trust.report`; `chart.neighborhood` keeps its own inclusive
  count — see design).
- Tests: `harbor.test.ts` (per-vessel rows, ranking, refusal and reopen
  per vessel), `night-policy.test.ts` (top-N), `watch.test.ts`,
  `cli.test.ts` (golden chat, unchanged shape),
  `trust-report.test.ts` (ordering); determinism scenarios throughout.
- No skill changes (no new tool, no new mandate — the harbor watch is
  already the mandated session-start surface), no tool-count sweep
  (fourteen tools unchanged), no schema changes, no migration (harbor
  history is append-only; new fingerprints simply do not collide with
  old grouped ones).
- Evidence discipline: the fan-in rank is a `reported`-grade heuristic
  (Aider lineage, no rigorous published eval — the same standing as
  `chart.neighborhood`'s ranking). No claim in this change presents
  fan-in order as a proven repair priority; the Governor decides on
  each proposal.

## Non-goals honored

Not a fifteenth tool and no new invocation mandate; no granularity
change (the per-vessel tree signature stands — no content hashing, per
the harbor-master design); no new vocabulary (kinds stay
`repair | gap | new-land`); no HTML or rendered surface of any kind.
