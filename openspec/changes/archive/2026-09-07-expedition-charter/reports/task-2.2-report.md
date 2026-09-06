# Task 2.2 report — flares as the fourth queue input

Commit: 209711b `feat(core): open flares propose as repair rows — the fourth queue input`

## What was built

`core/src/harbor/proposals.ts` — the queue is now computed from exactly
four inputs (module header updated):

- `computeProposals` reads the ship's log (`openFlares`) and the harbor
  history (`readDecisions`), groups flares per vessel, and keeps the open
  ones (`stillOpenFlares` → `flareClosed`).
- The fold is filter-plus-concat with no join layer, inside
  `repairProposals`: an open flare's reasons (deduplicated, log order) are
  concatenated onto the vessel's single repair row — the row's evidence
  becomes `["vessel/<id>#<count>", ...reasons]`, its fingerprint is
  re-minted from the merged evidence, its summary gains
  `; open flare: <reasons>`. A vessel with open flares and no drift gets a
  flare-only row: evidence `[<reasons>]`, anchors from its charted paths
  (omitted, never faked), scope entries/soundings = the drift charge
  (zero on a still vessel). A flare naming an uncharted vessel still
  proposes, anchors omitted.
- Flare rows are repair rows for every purpose: they rank by the shared
  fan-in rank, take Governor/night-watch decisions, and count against the
  night bound — no new policy, no new tool.
- Refusal filtering extended for flare vessels: `repairRowRefused`
  (./charter) filters not only the exact declined fingerprint but any
  shape of that vessel's row at the SAME stale count — the Governor who
  declined the drift-plus-flare row refused that drift too — but only
  forward in time: a decline predating a flare never filters a row
  carrying that flare's reason (that flare is evidence the Governor had
  not seen). With no flares ever filed on a vessel this reduces exactly
  to the previous exact-fingerprint rule, so all resurvey/night-watch
  behavior is untouched.

## Red → green accounting (tasks 1.2 + 2.2 together)

- RED at start: 16 fails + 1 load error. Mine: charter.test.ts (5 tests,
  behind the load error) and flares.test.ts (7 tests) — all 12 green.
- Deliberately left red — task 3.x surfaces, renderer/field work this
  task does not own (8 fails):
  - `core/src/adapters.test.ts` — 1: "the brief renders the charter from
    the proposal scope" (task 3.3, launcher brief).
  - `core/src/tools/trust-report.test.ts` — 4: open flares / last charter
    with overreach / kept charter / empty sections (task 3.2; its
    `charter`/`flares` fields on `TrustReport` also account for 6 of the
    10 core tsc errors, which are byte-identical on HEAD).
  - `core/src/harbor/watch.test.ts` — 3: launched charter + overreach,
    kept charter, byte-identical watch reports (task 3.1; the other 4 tsc
    errors).

## Deviation — pinned fixture fix (flares.test.ts)

The "declined decision closes the flare" test's reopen phase pinned
`["vessel/api#4"]` after a second `drift(target, dirs.api)`, but
staleness is a per-vessel mark and the charge counts stale ENTRIES (3:
api vessel + api light + shared fairway), so a second edit of the same
file cannot raise the count — empirically verified (`includeDeclined`
queue still computed `vessel/api#3`). Worse, the test's two phases were
mutually unsatisfiable at count 3: phase 1 requires the `#3` shape
filtered (`proposals` equal `[]` after the decline) while phase 2
requires the same `#3` shape present. The only coherent reading is the
resurvey suite's own reopen pattern, which grows the count by charting a
fourth entry (`writeChart([...base, dangerEntry])` + re-drift). I fixed
the fixture to that pattern (added the local `dangerEntry` helper and the
one `writeChart` line, with a comment saying why); every assertion is
unchanged and now passes. The pin's intent — "a fresh repair row
computes; the closed flare contributes nothing to it" — is preserved
exactly. Flagging for the code-reviewer since the file belongs to task
2.1's committed RED suite.

## Verification

- `bun test` (full): 431 pass / 8 fail (all 3.x, listed above) / 6 skip.
- `bunx tsc --noEmit`: acceptance/ clean; core/ shows the same 10
  pre-existing 3.x test-file errors as HEAD, zero new.
- `openspec validate --specs --strict`: 12/12. `scripts/leak-gate.sh`:
  clean.

## Concerns for later tasks

- `repairRowRefused`'s subset enumeration shares flareClosed's 16-distinct-
  -reasons cap per vessel; beyond it a flare may stay open (loud, never
  silent).
- Night-watch accepts (watch.ts → appendDecision) close flares through the
  same fingerprint arithmetic; task 3.1 touches watch.ts anyway and may
  want to assert that path end to end.
- The `expeditions.propose` registry description now names the fourth
  input (one sentence, registry.ts) — flagging since registry.ts is
  otherwise 3.x-adjacent surface.
