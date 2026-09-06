# Task 4.1–4.3 report — the wrap: end-to-end province trial, full verification, release bump

Commits:
- `chore(release): 0.6.0 — version bump and changelog (expedition-charter 4.3)` (4.3)
- `docs(openspec): expedition-charter task 4.1-4.3 wrap — province trial report and ticks` (4.1, 4.2)

## What was done

No production code in this wrap: 4.2 is the live end-to-end trial of the
shipped machinery on this repository's own province, 4.1 is the full
verification run, 4.3 is merge preparation. The trial drove the real core
functions (`appendReceipt`, `computeProposals`, `decide`,
`charterOverreach`, `flareClosed`, `trustReport`) from a scratch script in
`/tmp`, run once and deleted after — never committed. The receipts it
appended and the harbor-history row it recorded live in the (untracked)
`.portolan/` and are the trial's primary record; this report is the
committed transcript. Test-first does not apply to a verification/wrap task
(verify-first rule, recorded decision): the checks below are the task's own
verify lines, run against the completed change, and the trial itself is the
red→green-shaped live proof (each step's expectation is asserted in the
script and would have failed loudly).

## Task 4.2 — the province trial (2026-09-06)

Vessels standing on the Chart: `acceptance`, `adapters`, `core`, `skill`.
The trial promises a small real scope on vessel `docs` (as briefed) and
fires its flare against a different, charted vessel — `skill`.

### Receipts appended to the ship's log (receipt ids `r48`–`r50`)

`r48` — charter start (step 1):

```json
{"id":"r48","command":"expedition charter (task 4.2 trial: one-document expedition)","scope":"vessel docs","outcome":"ok: charter on record before the first chart write — vessels docs, 2 entries promised","recordedAt":"2026-09-06T22:47:29.940Z","meta":{"kind":"charter","vessels":["docs"],"entries":2}}
```

`r49` — flare against vessel `skill`, real drift-looking finding,
anchor-bearing evidence, entry left untouched (step 2):

```json
{"id":"r49","command":"flare filed (task 4.2 trial)","scope":"vessel skill","outcome":"ok: out-of-charter repair need filed as a flare; the entry left untouched","recordedAt":"2026-09-06T22:47:29.940Z","meta":{"kind":"flare","vessel":"skill","reason":"the harbor-watch queue enumeration names three inputs and omits the open-flare input that section 8 and the harbor spec teach","evidence":"skill/SKILL.md:25-28 — 'The queue is computed, never imagined: vessels marked pending correction, charted vessels with no recorded behavior or no charted light, and landscape present since the last survey snapshot' — no flares named"}}
```

(The finding is real: `skill/SKILL.md` lines 25–28 enumerate the queue's
inputs and omit the flares input that section 8 of the same document and
the harbor spec teach — the task-3.3 surface work added the method bullets
but not the section-0 enumeration.)

`r50` — charter outcome, naming the start (step 6):

```json
{"id":"r50","command":"expedition close-out (task 4.2 trial)","scope":"vessel docs","outcome":"ok: charter closed — the expedition kept it: no chart writes were made under it","recordedAt":"2026-09-06T22:47:29.955Z","meta":{"kind":"charter-outcome","charter":"r48"}}
```

### Harbor-history row recorded (the decline, step 4)

Appended by the real `decide` path — note the `evidence` keys it records
with the decision (design D1, amendment 2026-09-06); this is exactly what
every decide path now records:

```json
{"fingerprint":"a10e518727864cd238afa7db4d66766a0295bc6b2106c7eed0a86c6733ce9e8a","decision":"declined","decidedAt":"2026-09-06T22:47:29.950Z","evidence":["vessel/skill#6","the harbor-watch queue enumeration names three inputs and omits the open-flare input that section 8 and the harbor spec teach"]}
```

### The queue, before and after

STEP 0 — before the trial (3 rows; the province's own drift since 0.4.6):

```
[repair] c007961be75d08ea5274b55141fbfa2cd913c46f1c1fb4587746bc62ea078980  evidence ["vessel/core#28"]
[repair] c804df50bc85ea96d9df5380df91d5c90337a8c1a6096d024dbb69587790f4f0  evidence ["vessel/adapters#10"]
[repair] 7120eea2aa0d5e9294aceee5bc4b20be90ec010b005e634a58fee93a5adbcd71  evidence ["vessel/skill#6"]
```

STEP 3 — with flare `r49` open (step 3): the skill drift row folds the
flare's reason in — one row, both evidences, no join layer; same rank
position:

```
[repair] c007961be75d08ea5274b55141fbfa2cd913c46f1c1fb4587746bc62ea078980  evidence ["vessel/core#28"]
[repair] c804df50bc85ea96d9df5380df91d5c90337a8c1a6096d024dbb69587790f4f0  evidence ["vessel/adapters#10"]
[repair] a10e518727864cd238afa7db4d66766a0295bc6b2106c7eed0a86c6733ce9e8a  evidence ["vessel/skill#6","the harbor-watch queue enumeration names three inputs and omits the open-flare input that section 8 and the harbor spec teach"]
    summary: vessel skill marked pending correction (sources changed under skill); open flare: the harbor-watch queue enumeration names three inputs and omits the open-flare input that section 8 and the harbor spec teach
```

STEP 5 — after the decline (step 5): the skill row is gone and the flare
proposes nothing further; core and adapters are untouched (vessel scoping
held):

```
[repair] c007961be75d08ea5274b55141fbfa2cd913c46f1c1fb4587746bc62ea078980  evidence ["vessel/core#28"]
[repair] c804df50bc85ea96d9df5380df91d5c90337a8c1a6096d024dbb69587790f4f0  evidence ["vessel/adapters#10"]
```

STEP 7 — final consistency check: identical to step 5; no row anywhere
carries the flare's reason; `flareClosed(r49)` re-derived `closed=true`.

### Overreach and the served surfaces (step 6)

- `latestCharter` reads `r48` back: `{"id":"r48","vessels":["docs"],"entries":2}`.
- `charterOverreach(log, r48)` = `[]` — **the charter was KEPT** (zero
  chart writes under it; kept-or-broken as facts, not claimed).
- Corroboration from the served surface: `trustReport` returns
  `flares: []` (the decline closed `r49`), `charter:
  {"vessels":["docs"],"entries":2,"overreach":[]}`, log tail `50 receipts,
  last r50`.

### Province state after the trial

Consistent: flare `r49` closed (stays closed — the recorded evidence is
monotonic), no residue rows, receipts `r48`–`r50` and one declined history
row on record, all inside `.portolan/`.

## Task 4.1 — full verification (all green, none skipped)

| Check | Result |
| --- | --- |
| `bun test` | **445 pass, 6 skip, 0 fail**, 2272 expect calls, 451 tests across 57 files, 13.4s — matches the change baseline; the 6 skips are the env skips (real-PATH ctags-absent, bigtop corpus). The formats suite validated the province's ship's log **including the trial receipts `r48`–`r50`** against the receipt schema. |
| `bunx tsc --noEmit` (core/) | clean, exit 0 |
| `bunx tsc --noEmit` (acceptance/) | clean, exit 0 |
| `openspec validate --specs --strict` | 12 passed, 0 failed (12 items; INFO notes on long requirement texts only, pre-existing) |
| `bun run skill/verify/checks.ts` | all checks PASS, exit 0 — includes `task charter 3.3` checks (charter method taught; glossary rows Charter/Чартер, Flare/Ракета present) |
| `scripts/leak-gate.sh` | clean, exit 0 |

## Task 4.3 — merge preparation

- `package.json` 0.5.0 → **0.6.0**; `core/package.json` (`@portolan/core`)
  0.5.0 → **0.6.0**; `server.json` both version fields 0.5.0 → **0.6.0**.
- `bun scripts/manifest-check.ts`: `ok: server.json valid, versions in
  sync: 0.6.0` (the `unknown format "uri"` lines are ajv's standing schema
  warnings, present before the bump too).
- `CHANGELOG.md` gains `## 0.6.0 — 2026-09-06` in the house voice: charters
  as a receipt pair answered at the end; loud, delta-attributed overreach
  (`chart.write` receipts naming the write's delta; watch report +
  `trust.report`); flares as the fourth deterministic queue input with
  evidence-based, vessel-scoped closure; the launcher charter line; the
  skill method steps and glossary rows. Honest limits stated in the entry:
  receipts are agent-written facts, the spec claims visibility not
  compliance, and the 4.2 trial above is the live proof. Minor bump
  (fourth queue input, new receipt markers, new report sections).

## Decisions / deviations

- The flare targets `skill` (charted, really drifted) rather than the
  charter's `docs` — a different vessel, as the brief requires; `docs` is
  uncharted, which the charter arithmetic treats as a pure promise
  (`charterOverreach` reads only chart-write receipts, of which the trial
  makes none, so "kept" is the honest verdict).
- The decline was recorded through `decide` (the served path) rather than a
  bare `appendDecision`, so the trial exercises exactly what the decide
  paths record — fingerprint, decision, and the row's evidence keys.
- The trial's queue computations refreshed the province's staleness in the
  normal `chart.read` manner; the drift counts on record (core#28,
  adapters#10, skill#6) are the province's own, unchanged by the trial
  apart from that refresh.
- Recorded consequence: declining the skill row also refused that vessel's
  drift at stale count 6 (the documented `repairRowRefused` semantics — the
  Governor who declined the drift-plus-flare row refused that drift too).
  The skill row reopens when its stale-entry count changes; core and
  adapters still stand.

## Concerns

- The trial decline leaves a real fact in the province's history: vessel
  `skill`'s repair row (with the flare reason folded in) is declined at
  count 6, so the next session's queue will not propose it until skill's
  drift changes. The declined flare's finding itself — `skill/SKILL.md`
  lines 25–28 omitting the flares input — remains real and unfixed (the
  flare discipline: filed, not silently fixed; declined in trial). Both are
  visible in `.portolan/` and in this report; the next skill edit reopens
  the row.
- Receipts `r48`–`r50` carry the trial attribution in their `command`
  strings, but the harbor history has no note field — the declined row
  reads as any Governor decline. Accepted: the history's shape is
  append-only and pinned; the trial context is documented here and in the
  log receipts.
