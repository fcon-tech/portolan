# Tasks — migrate-viewer-to-portolan-core

Phased. Each phase ends green on: `openspec validate --specs`,
`node portolan-core/scripts/check-dependency-rule.js`, affected harness smokes,
and `portolan-core` unit tests. `/portolan:map` must never break between phases.

## Phase 0 — isolated teardown only

(NOTE: `serve.js`, `build-static.js`, and `openspec/legacy/captain-atlas/` are NOT
isolated — `portolan-scan.sh:1752,1756` opens the viewer; `portolan-install-core.sh`
installs a viewer wrapper; 4 harness smokes use serve.js for HTTP parity;
`portolan-product-acceptance.sh` + 12 living specs + `viewer/test/bdd-runner.js`
reference legacy captain-atlas. Their teardown moves to Phase 8a/8b AFTER the
depending paths are migrated.)

- [x] Delete `viewer/scripts/export-single-file.mjs` (superseded by `portolan-core/scripts/export-shell.mjs`; only referenced by its own package.json/README + a comment in export-shell.mjs).
- [x] Fix broken doc link: `docs/onboarding.md:20` captain-atlas ref -> `openspec/specs/`.
- [ ] Remove the legacy Go-route doc sections from README + onboarding that are already contradicted by the charter-08 narrative (non-behavior change). _(deferred to Phase 9 docs rewrite — avoid front-running the code migration.)_
- [x] Verify: `openspec validate --specs` green; existing harness smokes still green (nothing depending on deleted bits).

## Phase 1 — domain leaves (Tier 0) + revive orphaned tests

FINDING: the migration of `system-map/*` logic into `portolan-core/src/domain/`
was ALREADY performed in an earlier pass — `route.js`, `unit-classify.js`,
`family-lens.js`, `surface.js`, `atlas-validate.js` are byte-for-byte the
canonical versions, and the matching `portolan-core/test/unit/*.test.js` already
cover the same invariants as the orphaned `viewer/test/*.test.js` and run in CI.
So Phase 1 reduced to: turn the viewer copies into thin re-export shims (no
logic duplication, no test porting needed). The shims are deleted when
build-system-map.js (Phase 3) and bundle-query.js (Phase 4) migrate.

- [x] Confirm portolan-core has canonical domain modules for all 5 (route, unit-classify, family-lens, surface, atlas-validate).
- [x] Confirm CI already runs the matching unit tests (429 pass).
- [x] Convert `viewer/scripts/system-map/ids.js` -> shim of `src/domain/route.js`.
- [x] Convert `viewer/scripts/system-map/classify.js` -> shim of `src/domain/unit-classify.js`.
- [x] Convert `viewer/scripts/system-map/c4.js` -> shim of `src/domain/family-lens.js`.
- [x] Convert `viewer/scripts/system-map/surfaces.js` -> shim of `src/domain/surface.js`.
- [x] Convert `viewer/scripts/system-map/validate.js` -> shim of `src/domain/atlas-validate.js`.
- [x] Verify: `harness-system-map-smoke.sh` GREEN (22 components, 75 surfaces, 24 relationships); dependency-rule 0 violations; build-system-map.js loads through shims.

## Phase 2 — bundle-artifact-reader port + adapter

- [x] Add `ports/bundle-artifact-reader.js` (contract: readJson/readJsonl/readJsonlHead/exists/listProducerDirs + bundleDir).
- [x] Add `adapters/bundle-artifact-reader.js` (fs impl; read-only; tolerates absence/malformed).
- [x] Add `test/unit/bundle-artifact-reader.test.js` (port guard + adapter over tmpdir: JSON, JSONL, head+truncate, nested paths, producers, absence).
- [x] Verify: 439 unit tests pass (10 new); dependency-rule 0 violations; openspec validate green.

## Phase 3 — build-system-map (live-path)

- [x] Add pure `domain/system-map-compose.js`: `composeSystemMap(artifacts, opts) -> map` (byte-faithful extraction of the viewer pipeline, minus fs).
- [x] Add `use-cases/build-snapshot.js` (reader -> compose -> store), both unit-tested (11 new tests).
- [x] Add `portolan-core/scripts/build-system-map.mjs` thin driver (ESM + createRequire, like portolan-map.mjs).
- [x] Repoint `scripts/build-system-map.sh` -> portolan-core driver.
- [x] Delete `viewer/scripts/build-system-map.js`.
- [ ] Delete `viewer/system-map/{ids,classify,c4,surfaces}.js` shims — DEFERRED to Phase 8b: still required by orphaned `viewer/test/{ids,classify,c4}.test.js` (duplicates of CI's route/unit-classify/family-lens tests; removed with viewer/test in 8b).
- [x] Verify: `harness-system-map-smoke.sh` GREEN and byte-identical (22 components, 75 surfaces, 24 relationships, 7 families, sqoop=retired); 450 unit tests pass; dependency-rule 0 violations; `/portolan:map` live-path now resolves through portolan-core.

## Phase 4 — bundle-query engine (18 families)

- [x] Extend `BundleArtifactReader` port with `iterateJsonl` (true streaming, early-break) + `size(name)`.
- [x] Add `ports/source-file.js` + `adapters/source-file.js` (repo-root sandbox + realpath + target source reads).
- [x] Add `domain/query-envelope.js` (parseLimit/wrapResult/DEGRADED set) + `domain/query-records.js` (refs, path, hash, record shapers, relationship matchers, snippet window, stratum helpers).
- [x] Add `use-cases/query-bundle.js` (15 families + dispatch + handleHttpPath, all fs via ports; system-map family delegates to existing `query-atlas`).
- [x] Add `scripts/bundle-query-cli.mjs` driver; repoint `scripts/portolan-bundle-query.sh`.
- [x] Add `scripts/bundle-query-mcp.mjs` driver (TOOL_DEFS + runTool via ctx); repoint `scripts/portolan-bundle-query-mcp.sh`.
- [x] Move `@modelcontextprotocol/sdk` + `ajv` into `portolan-core/package.json`; `npm --prefix portolan-core install`.
- [ ] Delete `viewer/scripts/bundle-query.js`, `bundle-query-cli.js`, `bundle-query-mcp.js`, `system-map/query.js` — DEFERRED to Phase 8a: still required by `serve.js` (8a), `captain-handoff.js` + `query-eval.js` (Phase 5). Wrappers are already repointed so the canonical path is portolan-core.
- [x] Verify: `harness-bundle-query-smoke.sh` GREEN (all families, byte-faithful); `harness-bundle-query-mcp-smoke.sh` GREEN; 454 unit tests pass; dependency-rule 0 violations.

## Phase 5 — captain-handoff + query-eval

- [x] Add `use-cases/build-handoff.js` (buildHandoff(ctx) + renderMarkdown; namespace-require query-bundle so resilience monkeypatch works).
- [x] Add `use-cases/run-query-eval.js` (buildEval(ctx); streaming heads via reader.readJsonlHead).
- [x] Add `scripts/captain-handoff.mjs` + `scripts/query-eval.mjs` drivers.
- [x] Repoint `scripts/build-captain-handoff.sh` + `scripts/run-query-eval.sh`.
- [x] Rewrite the inline node resilience check in `portolan-product-acceptance.sh` to use portolan-core use-cases (monkeypatches query-bundle.dispatch).
- [ ] Delete `viewer/scripts/captain-handoff.js` + `query-eval.js` — DEFERRED to Phase 8a (orphaned now; wrappers repointed).
- [x] Verify: dependency-rule 0; 454 unit tests pass; `harness-bundle-query-smoke.sh` GREEN (exercises query-eval via the new driver).

## Phase 6 — evidence-promotion-atlas

- [x] Extend `BundleArtifactReader` port with `stat(name)`, `sha256(name)`, `listProducerFiles(dir,predicate)`.
- [x] Add `ports/source-inventory.js` + `adapters/source-inventory-fs.js` (git ls-files + conservative fs fallback).
- [x] Add `domain/promotion-atlas.js` (constants, roleForPath, query-index with injected sizeOf, shapers, validatePromotionAtlas).
- [x] Add `use-cases/build-promotion-atlas.js` (returns artifact set + queryIndex object; driver serializes after writing so size_bytes is real).
- [x] Add `use-cases/validate-promotion-atlas.js` (reads via port, delegates to domain validator).
- [x] Add `scripts/build-evidence-promotion-atlas.mjs` driver (build/validate, env limits read here); repoint `build-evidence-promotion-atlas.sh` + `validate-evidence-promotion-atlas.sh`.
- [ ] Delete `viewer/scripts/evidence-promotion-atlas.js` — DEFERRED to Phase 8a.
- [x] Verify: `harness-evidence-promotion-atlas-smoke.sh` GREEN (all 20 risk callouts: gitignored excluded, role classification, secret-reference, raw_available_only, query-index subset expansion, symbol BadState normalize, oversized artifact+family, catalog cannot_verify, stale+inventory_mismatch, truncation env limits, validate completion gates). Behavioural parity. NOTE: symbol-index parse-error count signal is lost (reader.iterateJsonl skips malformed silently) — accepted as low-value.

## Phase 7 — validators

- [x] Add `scripts/validate-system-map.mjs` (ajv layer 1 + domain `atlas-validate` layer 2); repoint `validate-system-map-schema.sh`.
- [x] Add `scripts/validate-atlas-schemas.mjs` (ajv over harness contracts); repoint `validate-atlas-schemas.sh`.
- [ ] Delete `viewer/scripts/validate-system-map.js` + `validate-atlas-schemas.js` + the `system-map/validate.js` shim — DEFERRED to Phase 8a (wrappers repointed).
- [x] Verify: `harness-system-map-smoke.sh` GREEN (exercises validate-system-map via the portolan-core driver); dependency-rule 0.

## Phase 8a — viewer HTTP UI teardown

- [x] Loosen `portolan-map.mjs`: intake optional (scripted/harness mode) + add `--bundle` mode (opens a scan-produced bundle as atlas.html directly).
- [x] Repoint `portolan-install-core.sh` viewer-wrapper to `portolan-map.mjs --bundle` (the wrapper name `portolan-viewer.sh` is preserved so captain-prompt/agent-runtime handoff contracts are unchanged).
- [x] Repoint `portolan-scan.sh` open path from serve.js to `portolan-map.mjs --bundle` (exports atlas.html, no HTTP server).
- [x] Rewrite HTTP-parity sections of `harness-bundle-query-smoke.sh` + `harness-portolan-smoke.sh` to assert atlas.html export instead of serve.js HTTP.
- [x] Delete viewer-only smokes: `harness-viewer-system-map-smoke.sh`, `harness-viewer-first-paint-smoke.sh`, `harness-viewer-corpus-smoke.sh`.
- [x] Delete `serve.js`, `build-static.js`, `viewer/src/`, `viewer/dist/`.
- [x] Delete orphaned viewer scripts (bundle-query*, captain-handoff, query-eval, evidence-promotion-atlas, validate-*, system-map/*); restore MCP smoke-client into `portolan-core/scripts/`.
- [x] Strip viewer refs from `portolan-product-acceptance.sh` (syntax checks → portolan-core; HTTP serve tests → atlas.html export; banned-word scan paths; viewer wrapper tests).
- [ ] Update `portolan-core/src/domain/atlas-navigation-profiles.js` portolan-self profile: drop the viewer region/routes/findings (stale demo data referencing deleted serve.js). DEFERRED — non-fatal (strings, not imports; portolan-core tests use inline fixtures).
- [x] Verify: `harness-portolan-smoke.sh` + `harness-agent-install-smoke.sh` GREEN; 454 unit tests; dependency-rule 0.

## Phase 8 — final viewer teardown

- [x] Delete `viewer/` entirely (README, package.json, package-lock.json + untracked dist/node_modules).
- [x] CI: `npm ci --prefix viewer` → `npm ci --prefix portolan-core`; cache-dependency-path → portolan-core/package-lock.json.
- [x] Verify: `viewer/` absent; system-map + evidence-promotion + portolan + agent-install smokes GREEN; openspec validate 12/12.

## Phase 8b — legacy captain-atlas teardown

- [x] Strip "Source authority: openspec/legacy/captain-atlas/..." attribution from all 12 living specs (text-only).
- [x] Rewrite `portolan-product-acceptance.sh`: removed `run_captain_atlas_checks` (package+scorecard+README structure validation) → `run_removed_machinery_checks` (kept the useful removed-planning-artifact + banned-pattern scans; dropped captain-atlas paths).
- [x] Fix attribution in `internal/testfixtures/apache-bigtop-smoke/claims/bigtop-gaps.json` → openspec/specs.
- [x] Clean captain-atlas refs in `run-query-eval.sh`, `portolan-scan.sh`, `build-portolan-bundle.sh`, `fs-atlas-nav-source.js`, `atlas-navigation-profiles.js` comments, `AGENTS.md`.
- [x] Delete `openspec/legacy/captain-atlas/`.
- [x] Verify: `openspec validate --specs` green; product-acceptance syntax OK; 454 unit tests; dep rule 0. NOTE: `captain-atlas-scorecard.json` (runtime bundle artifact, scenario "captain-atlas-first-run") is ACTIVE product output, unrelated to the deleted legacy spec — left intact.

## Phase 9 — CI + docs

- [x] CI: `npm ci --prefix viewer` → `npm ci --prefix portolan-core`; cache path updated.
- [x] `harness-portolan-smoke.sh` asserts atlas.html export via `/portolan:map`.
- [x] `docs/onboarding.md`: broken viewer ref → /portolan:map; "Open the atlas" row.
- [x] `README.md`: added charter-08 Quick Start (`/portolan:map` primary), renamed "Harness-First Quick Start" → "Harness-Install Flow", cleaned viewer/HTTP-server wording, Architecture section reflects portolan-core Clean Architecture + viewer removed.
- [x] Verify: openspec 12/12; smokes green; README/onboarding consistent with /portolan:map primary.

## Known remaining (separate concern, non-blocking)

- `portolan-core/src/domain/atlas-navigation-profiles.js` portolan-self profile still carries stale `viewer/scripts/serve.js` refs in the hand-authored fixture rules (serve.js deleted). Non-fatal: these are fixture-rule strings, not imports; portolan-core tests use inline fixtures. Cleanup = portolan-self demo redesign (out of scope for this code-migration change).
- The OpenSpec change can be archived once reviewed (apply the engineering-standards spec delta → living spec, move change to `openspec/changes/archive/`).
