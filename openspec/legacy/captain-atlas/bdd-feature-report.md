# Portolan 07-Spec BDD Feature Report

Generated for the implementation of `docs/captain-atlas/07-portolan-core-product-spec.md`.
Each feature carries an evidence label: `verified` | `not_assessed` | `assumed` |
`blocked` | `failed`.

## Acceptance Gates

| Gate | Command | Verdict | Evidence |
|------|---------|---------|----------|
| G1 scan produces valid system-map | `portolan-scan.sh ... && validate-system-map-schema.sh <bundle>/system-map.json` | verified | end-to-end scan writes system-map.json; validator exits 0 |
| G2 `--require-system-map` gate | `harness-bigtop-acceptance.sh <bundle> --require-system-map` | verified | gate prints "system map valid"; bundle without map fails |
| G3 non-Bigtop repeatability | scan polyglot-service-landscape → system-map | verified | 2 components, no Bigtop string dependency, validator passes |
| G4 read-only proof | source tree unchanged by scan | verified | scan writes only under `.portolan/` / bundle dir; no target mutation |
| G5 Cursor Agent CLI first-run | `cursor-agent --print ...` lane | blocked | see cursor-agent-cli-scorecard.json — binary installed, lane did not emit output within probe window |

## BDD Features

### Feature 1 — Cursor discovers Portolan and explains the landscape
- **verified**: install/scan path produces a system map + viewer; bounded-query
  `system-map` family returns overview/components/surfaces.
- **blocked**: the live Cursor Agent CLI lane did not complete an authenticated
  run within the probe window (exact blocker recorded in
  `docs/captain-atlas/cursor-agent-cli-scorecard.json`). This is recorded as
  blocked, not as "Cursor cannot run from the terminal".

### Feature 2 — Surfaces are not peer components
- **verified**: `harness-system-map-smoke.sh` asserts 0 surface-only targets
  (support-matrix, mailing-list, CI, binary-repo, docker-image) appear as
  components; `harness-viewer-system-map-smoke.sh` asserts the default map has
  0 leaked surface nodes (browser-level).
- **verified**: support matrix + mailing list + CI attach to the owning
  integrator, not themselves.

### Feature 3 — C4 lens
- **verified**: deterministic family grouping (same bundle → same families);
  Context/Families/Components levels render; every component has a component
  box; family boxes are clickable and open family dossiers.
- Data-level: 7 families on the Bigtop corpus; determinism re-checked across
  regeneration.

### Feature 4 — Dossiers, not empty stubs
- **verified**: every component dossier carries What/Why/C4/Repositories/
  Surfaces/Relationships/Findings/Unknowns/Next-actions/Producer sections
  (asserted in browser harness). Sqoop shows retired status + manifest-dep
  relationships + honest runtime-topology unknown. Partial evidence rendered
  honestly (unknown/cannot_verify states visible).

### Feature 5 — Overview answers the first-screen questions
- **verified**: Overview is the default route (#/overview); first screen shows
  Main components, Important relationships, What is risky, What is missing/
  unknown, What to click next. Read-more stays in overview (no jump to a
  component).

### Feature 6 — Bounded Q&A
- **verified**: `system-map` bundle-query family (HTTP `/api/system-map` +
  CLI `portolan-bundle-query.sh system-map`) serves overview/components/
  repositories/surfaces/relationships/findings/unknowns/c4 with kind/id/text
  filters. Agents never touch raw JSONL directly for these.

### Feature 7 — Works on a second ecosystem
- **verified**: polyglot-service-landscape produces a valid 2-component map;
  no classification rule depends on the literal string "Bigtop" (the only
  `bigtop` references are example prose, not classification logic).

### Feature 8 — Read-only, local-first
- **verified**: the system-map adapter is a read-only normalizer (no scanners,
  no network, no mutation). Scan writes only under `.portolan/` and the bundle
  dir. No credentials, no daemon.

### Feature 9 — DOM/route contract
- **verified**: every visible object sets `data-portolan-id` +
  `data-portolan-kind`; clickable elements set `data-portolan-route` +
  `data-portolan-clickable`; routes follow `#/dossier/<kind>/<id>` and
  `#/detail/<kind>/<id>`. Browser harness asserts ≥1 of each.

## Open items

- **G5 / Feature 1 (live Cursor run)**: blocked on an authenticated Cursor
  Agent CLI session completing within the run window. Re-run with a logged-in
  session to convert to `verified`.
- **Intermediate review (Slice 3 UI)**: dispatched to
  `minimax/MiniMax-M3` (requirements) and `kimi-for-coding/k2p7` (code). Both
  `codex-subagent` wrapper invocations exited 0 but did not persist a review
  result file (the wrapper threw an unhandled rejection after the review
  completed). The UI implementation itself is covered by the browser + data
  harnesses above. Slice 1 review returned `pass` with findings F1–F11 resolved.
- **Slice 1 review result**: `minimax/MiniMax-M3` = pass;
  `kimi-for-coding/k2p7` = pass with 11 findings (F1–F11), all resolved (exec
  bits, `|| true` swallowing, ajv dependency declared, Bigtop-string rules
  removed, dangling surface_ids fixed, 2-signal validator, dead code removed,
  unknown_count populated, secondary families populated).

## Slice 3 UI review — results (persisted)

Both reviews persisted to `.codex-subagents/reviews/`:

- `slice3-ui-minimax-m3-20260624-000500.md` — **minimax/MiniMax-M3: VERDICT PASS** (0 critical, 0 major, 7 minor). Minor items (nav-link hook coverage, smoke-test regex heuristic, href-prefix inconsistency, query persistence, hard-cap on relationship list) accepted as non-blocking polish.
- `slice3-ui-kimi-k2p7-20260624-000456.md` — **kimi-for-coding/k2p7: VERDICT FAIL (0 critical, 9 major, 7 minor)**. All 9 majors addressed and re-verified by browser probe (0 pageerrors):

| # | Major finding | Fix | Re-verified |
|---|---------------|-----|-------------|
| 1 | Unknown items in Overview lacked DOM hooks | added data-portolan-id/kind/route to unknown items | browser smoke |
| 2 | replaceState broke browser Back navigation | switched to pushState | goBack() returns prior hash |
| 3 | Map had no way to reveal surfaces | added surface toggle (0->40 surfaces revealed) | browser probe |
| 4 | C4 Components showed all families at once | family selector + selected-family filter (only that family renders) | 1 heading + its members only |
| 5 | Component dossier missing Links/local-paths | added "Links and local paths" ref section | Sqoop dossier shows it |
| 6 | Repository dossier missing path/visibility | added Local path + Source visibility sections | rendered |
| 7 | Relationship detail missing weight | added Weight/count section when present | rendered |
| 8 | Missing fields shown as em-dash | honest "Not recorded" prose for empty roles | rendered |
| 9 | C4 box route had no dossier path | c4-box routes resolve to underlying object dossier via findById | smoke covers component dossiers |

After fixes the UI passes the minimax review (PASS) and all kimi majors are resolved and re-verified in-browser.

## TDD / BDD / SOLID engineering (added per the user's discipline requirement)

### TDD — red-green-refactor with node:test
- **Test runner**: Node's built-in `node:test` (zero new dependencies; Node v22).
- `viewer/package.json` exposes `npm test` (`node --test`).
- **53 unit tests, all green**, organized by module: `classify.test.js` (20),
  `query-system-map.test.js` (7), `c4.test.js` (11), `validator.test.js` (6),
  `ids.test.js` (8), `bdd-runner.js` self-test (1).
- Discipline followed: each module's tests were written **red first** (importing
  not-yet-extracted modules), confirmed failing for the right reason, then made
  green by extracting the module — no test was written retroactively against
  already-working code without first seeing it red.

### BDD — spec scenarios drive the test surface
- `viewer/test/features/` holds all 9 Feature `.feature` files, Gherkin copied
  **verbatim** from `docs/captain-atlas/07-portolan-core-product-spec.md`.
- `viewer/test/bdd-runner.js` binds every scenario to its concrete test (unit
  test file, shell harness, or evidence artifact) with a verdict. Run
  `node viewer/test/bdd-runner.js` for the full scenario→test traceability table.
- No scenario is reported `verified` from code inspection alone: each binds to
  either a unit test or an executable harness.

### SOLID — single-responsibility modules (no God objects in the system-map path)
The 1159-line `build-system-map.js` monolith was decomposed into
`viewer/scripts/system-map/` modules, each with one responsibility and a focused
unit test:

| Module | Responsibility | Lines | Tests |
|--------|----------------|-------|-------|
| `ids.js` | id → route fragment conversion (Feature 9 contract) | 26 | 8 |
| `classify.js` | component promotion rule + lifecycle/type mapping (Feature 2) | 70 | 20 |
| `surfaces.js` | surface-type mapping + state + why-it-matters (Feature 2) | 88 | (in classify.test) |
| `c4.js` | C4 family assignment + priority + metadata (Feature 3) | 136 | 11 |
| `validate.js` | semantic invariants (Bundle Input Contract) | 127 | 6 |
| `query.js` | bounded system-map query family (Feature 6) | 127 | 7 |

`build-system-map.js` now imports these (DRY/SSOT) — the classification logic
exists in exactly one place. Output is byte-identical to pre-refactor (verified
by baseline diff). `bundle-query.js` delegates `querySystemMap` to
`system-map/query.js`. `validate-system-map.js` is a thin CLI that delegates
semantic checks to `system-map/validate.js`.

**Behavior preservation proof**: after wiring, the generated `system-map.json`
diffed (ignoring the `generated_at` timestamp) as IDENTICAL to the pre-refactor
baseline, and the validator still passes.
