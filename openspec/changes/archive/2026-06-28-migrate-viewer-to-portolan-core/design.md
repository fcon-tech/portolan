# Design — migrate-viewer-to-portolan-core

## Architectural principle

The dependency-rule checker (`portolan-core/scripts/check-dependency-rule.js`)
scans ONLY `src/{domain,use-cases,ports,adapters}`. `portolan-core/scripts/` is
the composition root (outermost ring): it may depend inward and on node/npm.
So *placement* in `scripts/` never violates the rule — but relocating an
imperative monolith there would create a parallel stack and make the rule
meaningless. The test of correctness:

> If a module in `scripts/` contains logic that cannot be unit-tested without
> spinning up the whole pipeline, that logic is in the wrong layer.

The migration decomposes each viewer script along the **I-O-vs-logic seam**:
pure transformation -> `domain`; orchestration -> `use-cases`; fs I-O -> an
`adapter` behind a `port`; argv/stdio glue -> `scripts/`.

## Layer placement map

| viewer artifact | -> domain | -> ports / adapters | -> use-cases | -> scripts (driver) |
|---|---|---|---|---|
| `system-map/ids.js` | `route-ids.js` (merge into `route.js`) | — | — | — |
| `system-map/classify.js` | merge into `unit-classify.js` | — | — | — |
| `system-map/c4.js` | `c4-family.js` | — | — | — |
| `system-map/surfaces.js` | merge into `surface.js` | — | — | — |
| `system-map/validate.js` | merge into `atlas-validate.js` | — | — | — |
| `build-system-map.js` | `system-map-compose.js` | `ports/bundle-artifact-reader` + adapter | `build-snapshot.js` | `build-system-map.mjs` |
| `bundle-query.js` (18 families) | record-shapers | (uses `bundle-artifact-reader`) | extend `query-atlas` / per-family | `bundle-query-cli.mjs`, MCP adapter |
| `bundle-query-mcp.js` | — | `adapters/mcp/` | (delegates) | `bundle-query-mcp.mjs` |
| `captain-handoff.js` | `renderMarkdown` | — | `build-handoff.js` | `captain-handoff.mjs` |
| `query-eval.js` | `verdictFrom`/`answer` | — | `run-query-eval.js` | `query-eval.mjs` |
| `evidence-promotion-atlas.js` | `roleForPath`/`PROMOTION_MATRIX`/`createPromotionQueryIndex` | `bundle-artifact-reader` | `build-evidence-promotion.js` | `evidence-promotion-atlas.mjs` |
| `validate-system-map.js` | (uses `atlas-validate`) | — | — | `validate-system-map.mjs` (ajv) |
| `validate-atlas-schemas.js` | — | — | — | `validate-atlas-schemas.mjs` (ajv) |
| `serve.js`, `build-static.js`, `export-single-file.mjs` | — | — | — | **DELETED** (legacy viewer UI) |

## New port: bundle-artifact-reader

Contract: read named JSON / JSONL artifacts from a bundle directory, returning
parsed values (JSON) or arrays of records (JSONL), tolerating absence with a
documented sentinel. This is the single fs read-point for all migrated
normalizers/queries; use-cases depend on the port, never on `fs`.

```
ports/bundle-artifact-reader.js
  readJson(name): object | null
  readJsonl(name): object[]
  listProducerDirs(): string[]
adapters/bundle-artifact-reader.js
  fs implementation over <bundleDir>
```

## Migration tiers (dependency order)

The viewer inter-script require graph forces an order (leaves first):

- **Tier 0 — domain leaves** (no viewer-internal deps): `ids`, `classify`, `c4`,
  `validate`; then `surfaces` (->c4). Migrate + dedupe + port tests. (Phase 1)
- **Foundation** (Phase 2): `bundle-artifact-reader` port + adapter.
- **Tier 1 — normalizers** (depend on Tier 0 + foundation): `build-system-map`
  (Phase 3, live-path — highest priority), `evidence-promotion-atlas` (Phase 6),
  validators (Phase 7).
- **Tier 2 — query engine** (Phase 4): `bundle-query` (18 families) + its
  `system-map/query` leaf.
- **Tier 3 — engine consumers** (Phases 4-5): `bundle-query-cli`, MCP adapter,
  `captain-handoff`, `query-eval`.

Tiers 1/2/3 are orthogonal after the foundation lands — safe to advance in
parallel.

## TDD discipline per migrated module

1. **Port the test first** from `viewer/test/` (or write a new one for
   untested modules), pointing at the new `portolan-core` path. It is RED
   (module not migrated yet).
2. **Migrate the pure logic** into `domain/` (or `use-cases/`), with I-O
   injected. Test goes GREEN.
3. **Repoint the bash wrapper** to the new `scripts/*.mjs` driver. The
   corresponding `harness-*-smoke.sh` must stay GREEN (behavior unchanged).
4. Only then delete the old viewer source for that module.

## Live-path safety

`/portolan:map` depends on `build-system-map.sh` -> `viewer/scripts/build-system-map.js`.
Phase 3 swaps this to the new driver in one step (wrapper repointed, smoke
re-run), so the entry point never breaks. No phase leaves the repo in a state
where `/portolan:map` fails.

## Verification per phase

- `npx openspec validate --specs` — green.
- `node portolan-core/scripts/check-dependency-rule.js` — 0 violations.
- Affected `scripts/harness-*-smoke.sh` — green.
- `portolan-core` unit tests (`node --test --test-reporter=spec portolan-core/test/unit/*.test.js`) — green, count non-decreasing.

## Decisions recorded

- **serve.js / viewer HTTP UI: DELETED.** Charter-08 opens the atlas as an
  inlined `atlas.html` (`/portolan:map` -> `export-shell.mjs`); an HTTP viewer
  is not in the product contract.
- **bundle-query MCP: KEPT.** It is the agent-integration surface for
  Cursor/Codex; it becomes an `adapters/mcp/` module and `@modelcontextprotocol/sdk`
  moves into `portolan-core`.
- **Go CLI + `internal/`: NOT TOUCHED.** `portolan-scan.sh` runs
  `go run ./cmd/portolan map`; Go is the deterministic core, not legacy.
