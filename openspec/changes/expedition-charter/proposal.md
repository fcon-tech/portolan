## Why

A repair expedition in this province (2026-09-06) was launched with an
explicit scope — one vessel, 27 entries — and corrected 42 entries across
other vessels as a side effect. The scope line existed in its instructions
and was ignored, and nothing recorded the overreach: an agent-writable
prompt is not a control. The Governor set the rule instead (grilling,
2026-09-06): an expedition must make its promise explicit and answer for
it — work it promises is its charter; a need outside the charter is not
fixed silently but fired as a flare into the harbor queue, where the usual
decision flow handles it. Overreach that does happen must be visible as
arithmetic over receipts, not as an invisible sin.

## What Changes

- **Charter**: every expedition records its promised scope in the ship's
  log when it starts — the vessels and entries it will touch — and closes
  it with an outcome receipt when it ends. The charter rides the launch
  brief when an expedition starts from a harbor proposal.
- **Overreach is computed, shown, never silent**: writes outside the
  charter are derived from the log's receipts (every chart write already
  receipts) and surface in the night watch report and in `trust.report`.
  No write is blocked — a violated charter is a loud, recorded fact, not a
  hidden one. Honest limit: receipts are agent-written facts, not a
  compliance guarantee.
- **Flares**: an expedition that finds a need outside its charter fires a
  flare — a structured ship's-log receipt naming the vessel, the reason,
  and the finding's evidence. Open flares become repair proposals in the
  harbor queue: the queue gains a fourth deterministic input. A flare
  stays open until a decision on its proposal is recorded (accepted and
  executed, or declined). Flare-driven rows are repair rows: they ride the
  existing night-watch bound — no separate policy, no new tool.
- **Terminology** (Governor's pick, added to the MANIFEST glossary at
  implementation): **Charter / Чартер** — the promised scope of an
  expedition; **Flare / Ракета** — a filed signal about trouble outside
  the charter.

## Capabilities

### Modified Capabilities

- `harbor`: MODIFIED "Proposals are computed, not imagined" — the queue is
  computed from four inputs, the fourth being open flares; ADDED "A flare
  is filed, honored, and closed" — the flare-to-proposal lifecycle;
  MODIFIED "The watch report is chat-formatted and deterministic" — the
  report names each run expedition's charter and any overreach.
- `expedition`: ADDED "An expedition declares a charter and keeps it" —
  the charter receipt at start, the outcome receipt at end, flares as the
  only route to out-of-charter fixes.
- `tools`: MODIFIED "trust.report aggregates the province's verification
  state" — the summary carries open flares and the last expedition's
  charter overreach.

## Impact

- `core/src/harbor/` — proposals.ts gains the fourth input (open flares
  read from the ship's log); watch report gains the charter section.
- `core/src/tools/log.ts` — structured receipt markers for charter and
  flare (inside `meta`, so the formats-pass receipt schema stays valid —
  its `meta` is free-form).
- `core/src/tools/trust-report.ts` — open flares and last-charter
  overreach.
- `adapters/opencode/expedition-launcher` — the brief renders the
  expedition's charter line.
- `skill/SKILL.md`, `docs/MANIFEST.md` — charter/flare method and
  glossary rows; the "fourteen/fifteen tools" counts are untouched (no new
  tool).
- At merge: `@portolan/core` version bump + CHANGELOG entry (standing
  rule).
