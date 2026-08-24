## Context

See proposal.md — Why. The harbor queue, decision history, settings reader,
and chat renderer already exist (archived harbor-master). The opencode
adapter already demonstrates headless Cartographer runs (the Bigtop
expedition and repairs ran exactly this way, manually).

## Goals / Non-Goals

**Goals:**

- `watch` command: queue → night policy → launch (external launcher) →
  history → chat report. Bounded auto-repair via settings. A shipped
  opencode launcher. Cron/CI wiring docs.

**Non-Goals:**

- No daemon, no scheduler interpretation (cron owns cadence; the settings'
  `harbor.schedule` stays a validated descriptor, not an interpreter).
- No auto new-land or auto gap expeditions — ever, per the spec.
- No new MCP tools; the watch is an operator/scheduler surface.

## Decisions

1. **Policy lives entirely in `auto_repair_max_vessels` (int ≥ 0, absent =
   0 = report-only).** One number keeps the safety story trivial to audit;
   per-kind thresholds are YAGI until real use demands them.
2. **Launcher contract: argv template + JSON on stdin.** The watch spawns
   `--launcher "<cmd>"` (default none → report-only even with a bound
   set), passes `{ target, proposal }` as JSON on stdin, and takes
   `--launcher-timeout` (default 30m). Exit 0 = expedition completed;
   non-zero/timeout = failure path. The core never names a harness.
   Alternative (built-in opencode spawn) — rejected: violates the adapter
   boundary the harness spec pins.
3. **Auto-accept is written before launch; failure appends the outcome.**
   History appends `accepted (by night-watch)` then, on failure,
   `launch-failed` — append-only keeps the audit trail honest. Queue
   filtering keys on `declined` only (the standing rule), so a failed
   proposal remains queued and can be retried or declined by the Governor,
   exactly as the spec's "failure leaves the proposal pending" demands.
4. **The opencode launcher is a thin bash script** (`adapters/opencode/
   expedition-launcher`): reads the JSON brief, renders a repair prompt
   (proposal evidence + scope + skill path + perimeter), runs
   `opencode run --pure` with `PORTOLAN_MODEL` (default
   `zai-coding-plan/glm-5.3`), exits with opencode's status. No behavior
   beyond launching — same rule as the MCP shims.
5. **Report = existing chat renderer, extended** with ran/pending/failed
   sections; golden-tested for determinism.

## Risks / Trade-offs

- [A stuck launcher burns the timeout window] → `--launcher-timeout` cap;
  failure path is receipted and the report names it.
- [Auto-repair fights a live developer's checkout] → The watch is
  externally scheduled; cadence is the operator's choice, and repairs
  never mutate source (perimeter holds inside launched expeditions).
- [Double-run races (cron overlap)] → v1 accepts the risk; the second run
  finds the chart repaired and reports empty. A lockfile is a documented
  follow-up if cron overlaps ever occur in practice.

## Open Questions

- Lockfile for overlapping watch runs — deferrable; no spec impact.
