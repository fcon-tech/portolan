## Context

See proposal.md — Why. The product loop is proven end-to-end (Bigtop sea
trial PASS); the missing face is initiative. Everything the Harbor Master
needs already exists in deterministic form: staleness signatures
(`pending correction`), the chart index (gaps computable from entries), and
a writable `.portolan/`. The trust spine forbids model-invented proposals,
so the engine is pure computation over chart + tree state.

## Goals / Non-Goals

**Goals:**

- Deterministic proposal queue with evidence and scope, decision history,
  snapshot-based new-land detection, chat surfacing via the skill, and a
  headless chat-formatted CLI for external schedulers.
- Settings file with the harbor schedule slot (unset by default).

**Non-Goals:**

- No daemon, no watcher, no auto-launch of expeditions (threshold-based
  auto-repair is a possible later change; the setting only wires external
  scheduling).
- No question-log trigger yet (what the Governor asked and the chart could
  not answer) — deferred until the queue earns it in real use.
- No multi-province registry; one province per invocation, as everywhere
  else in v3.

## Decisions

1. **Gaps are computed from index entries, not parsed sheets.** A vessel
   with no `behavior` and a vessel with zero charted lights are the two
   gap signals — both cheap and unambiguous from the index; parsing
   rendered markdown would couple the engine to presentation.
2. **Snapshot refresh rule = chart index hash.** The snapshot stores
   `{ indexHash, landscape[] }`; when the current index hash differs, the
   chart stood anew and the snapshot refreshes. This needs no hooks into
   the chart store and cannot misfire on unrelated writes. Alternative
   (store writes the snapshot) — rejected: couples store to harbor.
3. **Fingerprint = sha256(kind + sorted evidence keys).** Drift growth or
   a new repo changes the fingerprint; unchanged evidence keeps it stable,
   which is exactly the refusal-respect contract. Timestamps excluded on
   purpose.
4. **History is append-only JSONL with the fingerprint, decision, and
   timestamp**; dedupe reads the last decision per fingerprint. Same
   shape discipline as the ship's log.
5. **Settings: `<target>/.portolan/settings.json`, one key
   `harbor.schedule` (string cron-ish descriptor), absent by default.**
   The propose CLI is scheduler-agnostic: the schedule is documentation +
   a convention for external wiring; Portolan itself interprets nothing
   from it in v1 of this change.
6. **Ranking: repair > new-land > gap, then by evidence size.** Drift
   corrupts standing truth (worst); new land is unbounded unknown; gaps
   are known-missing depth. Simple, explainable, deterministic.

## Risks / Trade-offs

- [Index-hash refresh misses no-op chart writes] → A write that does not
  change the index bytes is not a new survey; acceptable by definition.
- [Gap proposals could nag on huge provinces with many dull vessels] →
  Refusals hold while evidence is unchanged, so one "no" per vessel-gap
  suffices; grouping stays v1-simple (one proposal per vessel).
- [Chat formatting drifts from skill wording] → The CLI format is a
  rendering function with a golden test; the skill references it, not
  copies.

## Open Questions

- Auto-repair thresholds under a configured schedule — deferrable without
  touching these specs (the setting exists; policy lands later if wanted).
