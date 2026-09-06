## 1. Charter receipts and overreach

- [ ] 1.1 Test-first (RED): receipt markers for charter start and outcome inside `meta` (valid against the formats-pass receipt schema), and one overreach function — given a charter and the log, it lists out-of-charter chart writes by vessel and entry count. Verify: new tests red, nothing else broken.
- [ ] 1.2 Implement the markers and the overreach function; if chart-write receipts do not name their written vessels, add the marker in `meta` (design D2). Verify: tests from 1.1 green; receipt schema suite still validates the full `log.jsonl`.

## 2. Flares — the fourth queue input

- [ ] 2.1 Test-first (RED): flare receipt → repair proposal derivation; multiple flares on one vessel fold by filter-plus-concat into the per-vessel row carrying every reason (no join layer); drift+flare on one vessel yield the single per-vessel row with both evidences; closure rules — accepted or declined closes, undecided keeps proposing; province with no drift/gap/landscape/flare is empty. Verify: new tests red, nothing else broken.
- [ ] 2.2 Implement the fourth input in `core/src/harbor/proposals.ts` (design D1). Verify: tests from 2.1 green; existing queue tests (drift, gap, new-land, fan-in rank) stay green.

## 3. Surfaces — reports, brief, skill, glossary

- [x] 3.1 Watch report carries each launched expedition's charter and its overreach by vessel and count; two runs over an unchanged province stay byte-identical. Verify: watch report tests including the stability scenario.
- [x] 3.2 `trust.report` carries open flares (vessel, reason) and the last charter with any overreach; a kept charter reads as kept. Verify: trust-report tests for both sections and the kept-charter scenario.
- [x] 3.3 The launcher brief renders the charter line from the proposal scope; `skill/SKILL.md` gains the charter/flare method steps; `docs/MANIFEST.md` glossary gains Charter/Чартер and Flare/Ракета. Verify: launcher prompt test; grep shows the glossary rows; no stale wording ("do only what the proposal names" superseded by the charter line).

## 4. Verification and wrap

- [x] 4.1 Full suite: `bun test`, `bunx tsc --noEmit` in `core/` and `acceptance/`, `openspec validate --specs --strict`, `bun run skill/verify/checks.ts`, `scripts/leak-gate.sh`. Verify: all green, failures named if any.
- [x] 4.2 End-to-end province trial on this repository: record a charter, fire a flare against a neighboring vessel, see the proposal in the queue, decide it, see the flare close — every step receipted. Verify: trial log pasted into the task report with receipt ids.
- [x] 4.3 Merge preparation: `@portolan/core` version bump and CHANGELOG entry drafted per standing rules. Verify: CHANGELOG names charter, flares, and the fourth queue input.
