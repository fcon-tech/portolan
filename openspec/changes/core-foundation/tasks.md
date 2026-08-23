## 1. Scaffold

- [x] 1.1 Create `core/package.json` (name `@portolan/core`, type module,
      bun test script), `tsconfig.json` (strict), and verify `bun test` runs
      green with a placeholder test
- [x] 1.2 Add `ajv` dependency and verify `bun install` succeeds and
      `ajv` compiles a trivial schema in a test

## 2. Ontology + schema

- [ ] 2.1 Write `core/src/types.ts` (Vessel, Fairway, PortOfEntry, Beacon,
      Light, Danger, Anchor, TrustLabel, ChartEntry, Notice) and verify a
      type-check passes (`bunx tsc --noEmit`)
- [ ] 2.2 Write `core/schema/chart.schema.json` covering every entry kind
      with required `anchors` (min 1) and `trust` enum of exactly the five
      labels, and verify ajv validates good/bad fixtures in tests
- [ ] 2.3 Write `core/src/validate.ts` wrapping ajv with entry-locating
      errors (kind + id in every message) and verify tests show the
      offending entry name for anchor-less and label-less writes

## 3. Chart store

- [ ] 3.1 Implement `core/src/chart-store.ts` `writeChart` (creates
      `.portolan/chart/`, renders one markdown sheet per vessel from
      entries, writes `index.jsonl`, temp+rename atomicity) and verify a
      test reading back a written chart round-trips entries
- [ ] 3.2 Implement rejection paths (no anchors / no label / bad label /
      unknown kind) and verify each rejection leaves the directory
      byte-identical (snapshot-compare test)
- [ ] 3.3 Implement interrupted-write atomicity (inject a late validation
      failure mid-batch) and verify the old chart is untouched

## 4. Staleness + notices

- [ ] 4.1 Implement vessel source signatures (tree hash over the vessel's
      paths) stored in the index, and `refreshStaleness` marking only
      changed vessels `pending correction`; verify the flip-one-vessel and
      no-change scenarios as tests on a temp fixture tree
- [ ] 4.2 Implement Notices to Mariners generation (added / corrected /
      marked stale / retired, each with anchors) as plain text and verify
      test output names entries and anchors for a repair scenario

## 5. Wiring

- [ ] 5.1 Export the public surface from `core/src/index.ts` (types,
      validate, chart-store, staleness, notices) and verify a smoke test
      imports and runs write → edit file → refresh → notice end-to-end on a
      temp target
