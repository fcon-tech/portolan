# Tasks — symbol-reference-edges

Spec + implementation change. Depends on `agent-atlas-foundation`.

## Spec artifacts

- [x] `proposal.md`
- [x] `design.md`
- [x] `specs/ontology/spec.md` (ADDED: reference edges from symbol-index role
      data; reference-edge evidence bounded by import)

## Implementation

- [x] `internal/importer/symbol_index.go`: emit `references` edges from
      `role: reference` symbols toward their `role: definition` counterparts.
      Match on symbol `id` (SCIP-scoped) first, fall back to name within scope;
      ambiguous matches → `unknown`, never guessed. (Resolved → `references`;
      unresolved → `unknown`; definitions/other → `owns`. All `metadata-visible`.)
- [x] Test: extended `internal/app/app_test.go` `TestRunImportSymbolIndexWritesMetadataOnlyGraph`
      on the existing fixture (`internal/testfixtures/importer-normalization/symbol-index.json`):
      (a) `main` definition + `App` reference → `references` edge,
      `metadata-visible`; (b) `fmt.Println` reference (no definition in export) →
      `unknown` edge, not `owns`; (c) `App` definition node present. Added
      `"references"` to the `validEdgeKinds` allowlist in `assertSchemaShape`.
- [ ] Add a JVM-shaped SCIP fixture (small Java sample with an interface + impl
      + cross-package call) to prove the multi-language path headlessly and to
      feed the deep Bigtop demo.
- [x] Evidence: reference edges `metadata-visible`; completeness recorded as
      `not_assessed` in the bundle's producer coverage, not hidden. (Edge reason
      strings carry the not-a-complete-call-graph caveat.)

## BDD binding (lands with the implementation, per engineering-standards TDD)

- [x] `portolan-core/test/features/feature-p1b-symbol-reference-edges.feature`
      (2 reading-layer scenarios: reference relationship renders as a typed
      edge; reference edge explained honestly, not as a complete call graph).
- [x] `portolan-core/test/bdd-runner.js`: added
      `FEATURE_TO_OPENSPEC['symbol-reference-edges'] = 'specs/ontology'` and 2
      bindings → `bdd-scenarios.test.js` (openBehaviourMap renders the typed
      `references` edge; openRelationship reports `relationshipType=references`,
      `evidenceState=metadata-visible`, and the not-a-complete-call-graph
      caveat). 456 unit + 4 BDD self-tests green.

## Validation

- [ ] `openspec validate --specs` passes.
- [ ] `go test ./internal/importer` green.
- [ ] BDD runner self-tests green (feature file + spec + unit test exist).

## Out of scope (follow-on)

- Managed `scip-*` subprocess producer (Go core).
- `bigtop-deep-landscape-demo` rendering of structural edges.
- Reading-layer reference-edge drill-down/dossier.
