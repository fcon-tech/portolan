# Task 3.1–3.3 report — surfaces: watch report, trust.report, launcher brief, skill, glossary

Commits:
- c4ed81e `feat(harbor): the watch report carries each expedition's charter and its overreach` (3.1)
- 3a30f3d `feat(tools): trust.report carries open flares and the last charter` (3.2)
- 00874e6 `feat(skill): the launcher renders the charter; the skill and glossary teach it` (3.3)

## What was built

### 3.1 — watch report (core/src/harbor/watch.ts, core/src/harbor/chat-format.ts)

- `WatchAction` gains `charter?: { vessels: string[]; entries: number }`
  and `overreach?: Overreach[]`, exactly the pinned shapes. After each
  launch (completed or failed — the receipts exist either way) the watch
  reads the ship's log and fills both fields via `latestCharter` +
  `charterOverreach` from ./charter — design D2's one shared function, so
  the watch report and `trust.report` cannot diverge. No charter receipt
  in the log leaves both fields absent (design D4).
- Attribution decision: the log is read cumulatively through the end of
  each launch, not sliced per launch. A retry that files nothing reports
  against the charter already on record — this is what makes the pinned
  "two watch runs over an unchanged province with a filed charter are
  byte-identical" scenario hold while two launches in one run still
  attribute charters in launch order.
- Chat renderer: a ran action with a charter gets one line after its
  outcome — `charter: vessels api · 3 entries — kept`, or
  `charter: vessels api · 3 entries — broken: lib · 4 entries written
  outside the charter` (overreach named by vessel and count, never
  summarized away). Actions without a charter render exactly as before;
  the two golden watch reports are unchanged.

### 3.2 — trust.report (core/src/tools/trust-report.ts)

- `TrustReport` gains `flares: { vessel, reason }[]` (open only, log
  order) and `charter: { vessels, entries, overreach } | null`.
- Flare openness reuses the queue's own arithmetic (`openFlares` +
  `flareClosed` from ../harbor/charter, `readDecisions` from
  ../harbor/history, the stale charge from the already-computed
  `chargeStaleEntries` map) — the same closure rule that decides
  proposing decides listing, so a decision on the vessel's repair row
  drops the flare from the report. Overreach goes through the one shared
  `charterOverreach`. No markers → `[]` and `null`, never an error (D4).
- No write added: the report still only refreshes staleness.

### 3.3 — launcher brief, skill, glossary

- `adapters/opencode/expedition-launcher`: the superseded steering line
  "Scope: do only what the proposal names — nothing else." is replaced by
  the charter line derived from the proposal's scope —
  `Charter: vessels api · 3 entries · 3 soundings — record it as your
  charter receipt (log.append, meta.kind "charter") before the first
  chart write, file a flare receipt (meta.kind "flare") for any
  out-of-charter need instead of fixing it, and close with an outcome
  receipt (meta.kind "charter-outcome") when the expedition ends.`
  The factual `Scope:` line inside the DATA block stays (the brief is
  data; the charter line is steering). Prompt lines steer, receipts
  measure.
- `skill/SKILL.md`: section 0 gains step 6 — an expedition launched from
  an accepted proposal records its charter from the proposal's scope
  before the first chart write (old step 6 renumbered to 7; the
  chart.neighborhood mandate text is untouched). Section 8 gains two
  bullets: keep the charter / file a flare for out-of-charter needs with
  the exact receipt markers and closure rule / broken charters surface
  as overreach but nothing is blocked; and close the charter with an
  outcome receipt naming the start. All three marker kinds are taught in
  the `meta: { "kind": ... }` form the checks pin.
- `docs/MANIFEST.md` glossary: `| An expedition's recorded promise of
  scope (vessels and entries) | Charter | Чартер |` and
  `| Out-of-charter repair need, filed as a receipt | Flare | Ракета |`.
- `openspec/changes/expedition-charter/tasks.md`: 3.1, 3.2, 3.3 ticked.

## Test update outside the new pins (declared, not silent)

`core/src/adapters.test.ts` (night-watch 3.1 golden prompt test) pinned
the superseded line "Scope: do only what the proposal names — nothing
else.", which directly contradicts the change's own 3.3 pin
(`not.toContain("do only what the proposal names")`). Its expectation now
pins the charter line, with a comment citing design D3. No other
pre-existing test was touched.

## Red → green accounting

Starting state (verified before editing): `bun test` 431 pass / 8 fail
(3 watch-charter, 4 trust-report-charter, 1 launcher-charter);
`bun run skill/verify/checks.ts` 2 fails (SKILL charter method,
glossary rows). End state:

- `bun test`: 439 pass, 0 fail, 6 env skips.
- `bunx tsc --noEmit` in core/ and acceptance/: clean.
- `openspec validate --specs --strict`: 12/12.
- `bun run skill/verify/checks.ts`: all pass.
- `scripts/leak-gate.sh`: clean.

## Decisions / deviations from D3/D4

- D3 says the old scope line "becomes the charter". Implemented as: the
  steering line is replaced by the Charter line; the DATA block keeps a
  factual `Scope:` line. This matches the pins' exact expected shape
  (charter line present, superseded wording absent everywhere).
- Watch attribution uses the cumulative log prefix through each launch
  (see above) — the only reading that satisfies both the per-expedition
  charter pin and the byte-identical rerun pin; it also means a
  launch-failed action whose launcher filed receipts before dying still
  reports the charter facts.
- Nothing read the `charter-outcome` marker for these surfaces
  (`latestCharter` intentionally ignores it), so outcome receipts do not
  affect either report; that is the task-1.2 design, unchanged.

## Concerns

- In a multi-launch watch run where expedition A files a charter and
  expedition B files none, B's action reports against A's charter (the
  latest on record). That is the honest cumulative reading and keeps
  reruns identical, but per-expedition attribution beyond launch order
  would need a linkage field in the charter receipt itself — not pinned
  by any scenario, so not built (YAGNI; note for the wrap task if the
  Governor wants tighter attribution).
