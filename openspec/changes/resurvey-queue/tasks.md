# Tasks — resurvey-queue

## 1. The shared fan-in rank

- [x] 1.1 A small pure helper (new leaf module under `core/src/`):
      `vesselFanIn(entries)` — per vessel, the count of charted fairways
      whose target vessel is that vessel and whose source vessel is a
      different one (fairway endpoints are vessel ids; no class, no
      options, two importers).
- [x] 1.2 Tests: cross-vessel fairways count; intra-vessel fairways do
      not; a vessel with no incoming fairways ranks 0.
- [x] 1.3 Verification: `bun test` green; `bunx tsc --noEmit` in `core/`.

## 2. Per-vessel repair proposals

- [x] 2.1 `core/src/harbor/proposals.ts`: replace the grouped
      `repairProposal` with one proposal per drifted vessel — evidence
      `vessel/<id>#<stale-entry-count>` (drift-sensitive, so a refusal
      reopens when the count changes), anchors under that vessel's
      charted paths (`soundableAnchorUnder` unchanged; an anchorless
      vessel is proposed with its anchor omitted), scope naming the
      stale entries charged to that vessel by the report's attribution
      rule (a stale fairway drags on both endpoints) and its soundings.
- [x] 2.2 Queue sort: repair rows order by the shared rank (fan-in
      desc, vessel id asc) before the kind rank resolves against
      new-land and gap (kind rank unchanged: repair > new-land > gap).
- [x] 2.3 Tests (from the spec scenarios): two drifted vessels produce
      two rows; the hub outranks the leaf; a detached vessel is
      proposed, ordered by id among ties; two runs return the same
      order; declining one vessel's fingerprint leaves the others
      queued; a declined vessel reopens when its stale-entry count
      changes; an anchorless vessel is proposed without a fabricated
      anchor; per-vessel scope matches the report's charged counts.
- [x] 2.4 Existing harbor tests updated where they assumed the grouped
      row; `decide`/`run` flows stay green on per-vessel fingerprints.
- [x] 2.5 Verification: `bun test` green; `bunx tsc --noEmit` in `core/`.

## 3. Cumulative night bound

- [x] 3.1 `core/src/harbor/night-policy.ts`: spend the bound down the
      queue order — launch repair rows until
      `harbor.auto_repair_max_vessels` vessels are committed, pending
      the rest; new-land and gap never launch.
- [x] 3.2 Tests: five drifted vessels, bound three — the three
      highest-ranked launch in order, two stay pending with evidence;
      bound absent/zero stays report-only; queue order preserved in
      both lists.
- [x] 3.3 `core/src/harbor/watch.test.ts` and `cli.test.ts` updated to
      the cumulative semantics; the watch report stays byte-identical
      over an unchanged province.
- [x] 3.4 Verification: `bun test` green.

## 4. Order trust.report pending vessels by the queue rank

- [x] 4.1 `core/src/tools/trust-report.ts`: order `pendingVessels` by
      the shared rank (fan-in desc, vessel id asc); membership unchanged
      (stale fairways still charge both endpoints).
- [x] 4.2 Tests: mixed fan-in pending vessels come back hub-first with
      id breaking ties; membership unchanged from today's attribution
      rules; existing trust.report scenarios stay green.
- [x] 4.3 Verification: `bun test` green; `bunx tsc --noEmit` in `core/`.

## 5. Docs and gates

- [x] 5.1 `docs/MANIFEST.md` harbor row and `README.md` harbor sentence
      checked against the ranked queue (both describe the harbor
      generically today; touch only if wording now lies).
- [x] 5.2 No machine-home paths in tracked files; no new synonyms
      (kinds stay `repair | gap | new-land`; "pending correction" stays
      the locked term).
- [x] 5.3 Verification: `bun test`; `bunx tsc --noEmit` in `core/`;
      `bun run skill/verify/checks.ts`; `./scripts/leak-gate.sh`;
      `openspec validate --specs --strict` green after archive-prep.
