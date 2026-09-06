# Task 1.2 report — charter/flare receipt markers and overreach arithmetic

Commit: 7e08240 `feat(core): charter and flare receipt markers with overreach arithmetic`

## What was built

- `core/src/harbor/charter.ts` (new): the charter ledger — pure arithmetic
  over ship's-log receipts, nothing writes.
  - `Flare` / `Charter` / `Overreach` types exactly as pinned in
    charter.test.ts's header.
  - `openFlares(log)` — every `meta.kind: "flare"` receipt in log order
    (closure is applied by the queue, not here); a marker without a vessel
    or reason is skipped.
  - `latestCharter(log)` — the most recent `meta.kind: "charter"` start
    receipt; the `"charter-outcome"` marker never shadows it.
  - `charterOverreach(log, charter)` — post-charter `chart.write` receipts
    only (monotonic receipt-id ordering), aggregated per out-of-charter
    vessel from `meta.vessels`, sorted by vessel id; non-chart-write
    receipts contribute nothing even when their meta names vessels.
  - `flareClosed` / `repairRowRefused` (consumed by task 2.2): the
    closure/refusal arithmetic over harbor-history fingerprints — see the
    task 2.2 report for the semantics the flares tests pinned.
- `core/src/chart-store.ts`: `vesselsTouched(entries)` — the write path's
  own attribution: a vessel entry names itself, a fairway both endpoints,
  every other entry its vessel; counts entries per touched vessel.
- `core/src/server/registry.ts`: the served `chart.write` tool now appends
  exactly one ship's-log receipt per successful write —
  `command: "chart.write"`, `scope: "chart"`, `outcome: "ok: N entries"`,
  `meta: { vessels: vesselsTouched(index) }` — through the same append
  path `log.append` serves, mirroring the chart.neighborhood/chart.export
  pattern. A rejected write throws before the append and leaves no
  receipt. The `expeditions.propose` description names the fourth input.

## Deviations from the brief / design

1. **Receipt placement — registry handler, not `writeChart`.** The brief
   said "find the write path in chart-store.ts and add the marker". Fact
   on the ground: no production code receipted `chart.write` at all — the
   store is library-level and silent. Receipting inside `writeChart` would
   (a) mint receipts for every internal/library write, and (b) mint
   duplicate receipt ids in the pinned flares fixtures, which hand-assign
   `r1`/`r2` via raw appends immediately after library `writeChart` calls
   — the fixtures therefore pin "writeChart does not receipt". The
   receipt-per-tool-call responsibility already lives in the registry
   (chart.neighborhood, chart.export); `chart.write` now follows it, and
   the marker semantics live in the write path's `vesselsTouched`.
2. **Extra export `repairRowRefused`** (with `flareClosed`) lives in
   charter.ts although the queue consumes it in task 2.2 — the closure
   arithmetic is one module's subject; the pinned `flareClosed(flare,
   history, ...)` header left the signature loose and its proof is at the
   queue level (flares.test.ts), as the header itself states.

## Decisions made

- Overreach uses receipt-id monotonicity, not timestamps, to decide
  "after the charter start" (the header pins id ordering).
- `flareClosed` decides "a repair proposal for the flare's vessel" over
  opaque fingerprints by re-minting the candidate fingerprints the engine
  can produce for that vessel: its drift key at any count up to the
  current charge, unioned with any subset of the reasons ever filed there
  (flare-only shapes included). A decision postdating the flare whose
  fingerprint is in that set closes it. Subset enumeration is capped at
  the 16 most recent distinct reasons per vessel — beyond the cap the
  failure mode is a flare that stays open and proposes again (loud), never
  a silent close.

## Verification

- `bun test` (full): 431 pass / 8 fail / 6 skip — the 5 charter.test.ts
  tests went red (module load error) → green; the 8 remaining fails are
  all task 3.x surfaces (see task 2.2 report for the split).
- `bunx tsc --noEmit` core/: the same 10 pre-existing errors as HEAD, all
  in watch.test.ts / trust-report.test.ts (task 3.x type pins); zero new.
  acceptance/: clean.
- `openspec validate --specs --strict`: 12/12. `scripts/leak-gate.sh`:
  clean.
