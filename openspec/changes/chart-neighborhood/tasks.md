# Tasks — chart-neighborhood

## 1. Fairway relations in the ontology

- [ ] 1.1 `core/src/types.ts`, `core/schema/chart.schema.json`, and the
      validator: optional `relation` on fairways, closed enum
      `build | runtime | config`; out-of-enum values rejected naming the
      enum; untyped fairways stay valid.
- [ ] 1.2 Tests (from the spec scenarios): out-of-enum relation rejected;
      untyped fairway round-trips through the store untouched.
- [ ] 1.3 Verification: `bun test` green; `bunx tsc --noEmit` in `core/`.

## 2. The neighborhood engine

- [ ] 2.1 `core/src/tools/neighborhood.ts`: traversal over charted
      fairways (direction `in|out|both`, depth default 1 / cap 3,
      visited set against cycles), direct fan-in ranking, greedy packing
      under `maxEdges`/`maxBytes` (defaults 40 / 32768, caps 200 / 131072),
      loud `truncated` flag, stale flags, touched vessels with ports of
      entry; honest unsurveyed error for a vessel id not on the Chart;
      parameter validation naming the violated parameter.
- [ ] 2.2 The `verify` path: re-sound every returned edge's anchors via
      the existing `soundAnchor` machinery; refuted edges named with their
      failed anchors; the Chart never modified.
- [ ] 2.3 Tests (from the spec scenarios, fixture charts): one-hop both
      directions; unknown vessel errors honestly; direction/depth
      honored; cycle terminates; invalid request rejected; hub before
      leaf; tight budget truncates loudly; byte cap respected; verify
      catches a planted lie; default serves stored labels; stale vessel
      flagged; on unchanged signatures the Chart is byte-identical and
      the only write is the appended ship's-log receipt.
- [ ] 2.4 Verification: `bun test` green; `bunx tsc --noEmit` in `core/`.

## 3. Serve the tool

- [ ] 3.1 Register `chart.neighborhood` in `core/src/server/registry.ts`
      (fourteenth tool) with the input schema and the same error boundary
      as the other tools; the handler appends exactly one ship's-log
      receipt per call.
- [ ] 3.2 Wiring test through the server client; the registry lists
      fourteen tools.
- [ ] 3.3 Verification: `bun test` green.

## 4. Adoption analytics in trust.report

- [ ] 4.1 `core/src/tools/trust-report.ts`: an `adoption` block derived
      from the ship's log — per mandated query tool:
      `invocations`, `firstReceipt`, `lastReceipt`; zero reported as
      zero; no claim beyond invocation facts. Keep the module's
      determinism claim true (receipt ids, not timestamps) or amend the
      docstring honestly.
- [ ] 4.2 Tests: a logged `chart.neighborhood` call surfaces with count
      and last receipt; a log without calls reports zeros; existing
      trust.report scenarios stay green.
- [ ] 4.3 Verification: `bun test` green; `bunx tsc --noEmit` in `core/`.

## 5. The invocation contract in the skill

- [ ] 5.1 `skill/SKILL.md`: the session-start mandate (a task touching
      more than one file or vessel requires `chart.neighborhood` for each
      touched vessel before any edit); a tool-desk row with purpose and
      call shape; pass 2 records the relation when asserting a fairway.
- [ ] 5.2 `skill/verify/checks.ts`: structural checks that the mandate
      and the tool-desk row exist.
- [ ] 5.3 Verification: `bun run skill/verify/checks.ts` green;
      `bun test` green.

## 6. Bigtop corpus leg

- [ ] 6.1 A corpus-guarded integration test (skips when the Bigtop corpus
      is absent): neighborhood of `hive` is non-empty and matches the
      chart; fan-in order holds (`bigtop-utils`, `hadoop` above leaves);
      a tight budget truncates loudly; `verify: true` refutes a planted
      anchor.
- [ ] 6.2 Verification: with the corpus present the leg runs green;
      without it, the test skips; `bun test` green both ways.

## 7. Count sweep and docs

- [ ] 7.1 The thirteen→fourteen sweep, everywhere the old count lives:
      `docs/MANIFEST.md` (tool table, heading), `skill/SKILL.md`
      (tool-desk count), `skill/verify/checks.ts` (the `Thirteen tools:`
      regex), `README.md`, `adapters/README.md`, and the
      `core/src/server/registry.ts` comment; the `harness` living spec
      is repaired by the change's MODIFIED delta at archive time.
- [ ] 7.2 `docs/MANIFEST.md`: the Chart section notes the optional
      relation enum; the glossary stays locked (no new synonyms).
- [ ] 7.3 No machine-home paths in tracked files; corpus paths in tests
      resolve from an environment variable with a skip, never a hardcoded
      home path.
- [ ] 7.4 Verification: `./scripts/leak-gate.sh` clean;
      `openspec validate --specs --strict` green after merge-prep.
