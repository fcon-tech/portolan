## Why

`viewer/` is the superseded 0.1.0 reading layer, yet it is load-bearing: the
charter-08 entry point `/portolan:map` transitively depends on
`viewer/scripts/build-system-map.js` via `scripts/build-system-map.sh`, and eight
bash wrappers delegate into viewer JS. This keeps a parallel imperative stack
alive inside what should be the single reading layer, splits the system-map
business rules across two trees, and means the viewer unit tests
(`viewer/test/*.test.js`) do not even run in CI. The migration collapses the
stack into `portolan-core` Clean Architecture layers and deletes `viewer/`.

## What Changes

- **Migrate** the load-bearing viewer JS into `portolan-core/src/{domain,use-cases,ports,adapters}` + thin CLI drivers in `portolan-core/scripts/`, decomposing imperative scripts along the I-O-vs-logic seam:
  - `system-map/{ids,classify,c4,surfaces,validate}.js` (pure) -> `domain/`, merged with existing duplicates (`unit-classify.js`, `surface.js`, `atlas-validate.js`).
  - `build-system-map.js` -> `domain` (compose) + `use-cases/build-snapshot` + `scripts` driver + new `ports/bundle-artifact-reader` + `adapters` impl.
  - `bundle-query.js` (18 families) -> `domain` (record-shapers) + `use-cases` + facade; CLI + MCP drivers.
  - `captain-handoff.js`, `query-eval.js`, `evidence-promotion-atlas.js` -> use-cases + thin drivers.
  - `validate-system-map.js`, `validate-atlas-schemas.js` -> thin drivers (logic already in `domain`).
- **Repoint** the eight bash wrappers (`scripts/*.sh`) from `viewer/scripts/*.js` to the new `portolan-core/scripts/*.mjs` drivers.
- **Port** the orphaned `viewer/test/*.test.js` into `portolan-core/test/unit/` so they run in CI.
- **Move** dependencies `@modelcontextprotocol/sdk` and `ajv` from `viewer/package.json` into `portolan-core/package.json`.
- **Delete** `viewer/` entirely; remove `npm ci --prefix viewer` from CI.
- **Delete** pure-legacy viewer UI: `serve.js`, `build-static.js`, `export-single-file.mjs`, `viewer/src`, `viewer/dist` (charter-08 opens the atlas via inlined `atlas.html`, not an HTTP viewer).
- **Delete** `openspec/legacy/captain-atlas/` and stale docs/links.
- **Rewrite** README/onboarding to a single `/portolan:map` narrative; add a `/portolan:map` headless smoke to CI replacing the viewer smokes.

## Capabilities

### New Capabilities

(none — this is an internal-architecture migration; no new product behavior is introduced.)

### Modified Capabilities

- `engineering-standards`: the dependency-rule scope expands. Today the rule guards `portolan-core/src/*`; after the migration, ALL system-map normalization, bundle query, evidence-promotion, and captain-handoff logic SHALL live inside those layers (no parallel imperative stack), and the wrappers SHALL be thin drivers over use-cases.

## Impact

- **Code**: `viewer/` removed (~6.7k lines of scripts relocated into `portolan-core` layers or deleted); 8 bash wrappers repointed; `portolan-core` gains ~1 unit-test-per-relocated-pure-module.
- **Dependencies**: `@modelcontextprotocol/sdk` and `ajv` move into `portolan-core/package.json`.
- **CI**: `npm ci --prefix viewer` step removed; viewer-only smokes removed; a `/portolan:map` smoke added.
- **Live path**: `/portolan:map` is preserved end-to-end at every phase (each migration repoints its wrapper before the old script is deleted).
- **Out of scope**: the Go CLI (`cmd/portolan`) and `internal/` are NOT touched — `portolan-scan.sh` calls `go run ./cmd/portolan map`, so Go is part of the deterministic core, not legacy.
