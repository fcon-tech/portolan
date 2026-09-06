## 1. Format schemas — the contracts

- [x] 1.1 Test-first (RED): schema test suite that (a) validates every entry of the province's `.portolan/chart/index.jsonl` against the chart entry schema, (b) validates every line of `.portolan/log.jsonl` against the receipt schema, (c) pins the trust vocabulary to exactly the five closed labels. Verify: `bun test core/src/schema.test.ts` fails on the missing pieces only.
- [x] 1.2 Add `"version": "0.1.0"` to `core/schema/chart.schema.json`; keep `$id` unchanged. Verify: suite 1.1 still green; `$id` byte-identical to main.
- [x] 1.3 Create `core/schema/trust-vocabulary.schema.json` (closed enum + description); switch `chart.schema.json`'s trust label to a `$ref` by `$id`; register both schemas in `core/src/validate.ts`. Verify: suite 1.1 green; `chart.write` still rejects an invented label (existing tests pass).
- [x] 1.4 Create `core/schema/receipt.schema.json` from what `core/src/tools/log.ts` actually writes — if a historical line wouldn't validate, the schema follows the writer (design D3). Verify: full `log.jsonl` validates in suite 1.1.
- [x] 1.5 Create `core/schema/graph-export.schema.json`: `format` const `portolan-adjacency`, `version`, `nodes[]`, `edges[]`; no timestamp fields, no derived rollups (design D4). Verify: suite compiles the schema with ajv and rejects a document with a `generatedAt`.

## 2. Schema → code, one direction

- [x] 2.1 Checked-in `scripts/gen-types.ts` generates entry/anchor/receipt TS types whole from the schema files, doc comments carried by schema `description` fields; commit generated output; split hand-written runtime constants from generated types in `core/src/types.ts`. Verify: `bun run scripts/gen-types.ts` is idempotent; `bunx tsc --noEmit` in `core/` passes.
- [x] 2.2 Drift guard: pin runtime constants (`TRUST_LABELS`, `ENTRY_KINDS`) to the schemas by test, and run the generator in a test that fails on uncommitted drift. Verify: mutating a schema enum locally turns the suite red.

## 3. The adjacency export — core + tool

- [x] 3.1 Test-first (RED): export tests asserting charted-truth-only (design D4): nodes/edges carry anchors, trust, staleness from entries; `doubtful`/`unsurveyed` pass through un-upgraded; no invented nodes, no timestamps, no derived rollups. Verify: new tests red, nothing else broken.
- [x] 3.2 Implement the adjacency builder over the machine layer in `core/src/tools/` (export document only; no file writes). Verify: tests from 3.1 green.
- [x] 3.3 Register `chart.export` — read-only tool, byte budget with loud truncation naming omitted vessels+counts, honest error on absent Chart, exactly one ship's-log receipt per call (reuse neighborhood budget mechanics). Verify: tool tests for budget truncation, read-only (Chart byte-identical + one receipt), honest error; registry surface test sees fifteen tools.
- [x] 3.4 Sweep the "fourteen tools" counts: `docs/MANIFEST.md` tool table gains the `chart.export` row; skill and adapters docs updated where the number is stated. Verify: `grep -rn "fourteen" docs skill adapters` returns no stale count.

## 4. CLI verb

- [x] 4.1 `portolan export [--target <root>]` over the same core function: JSON to stdout, non-zero exit on the honest error. Verify: CLI test — stdout document validates against the graph export schema; absent-Chart exit code is non-zero.

## 5. Documentation of the formats

- [x] 5.1 `docs/formats.md` — the versioning policy up top (semver from 0.1.0; breaking=minor, additive=patch while 0.x; 1.0.0 is the Governor's call), then a section per format: purpose, schema path, current version, stability promise; one ajv validation snippet on the page. Verify: each section names its schema file and version; no section requires reading core source; `scripts/leak-gate.sh` stays clean.

## 6. Verification and wrap

- [ ] 6.1 Full suite: `bun test`, `bunx tsc --noEmit` in `core/` and `acceptance/`, `openspec validate --specs --strict`, `bun run skill/verify/checks.ts`, `scripts/leak-gate.sh`. Verify: all green, failures named if any.
- [ ] 6.2 External-consumer acceptance (the bet's proof): a script that imports nothing from `core/src` — schemas + docs only — obtains the CLI export and validates it against the schemas. Verify: script green from a clean directory outside the repo checkout of core.
- [ ] 6.3 Merge preparation: `@portolan/core` version bump and CHANGELOG entry drafted per standing rules. Verify: CHANGELOG names the four formats and the fifteenth tool; version bump matches standing rule.
