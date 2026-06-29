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
- [x] Cross-repo reference fixture: `internal/testfixtures/importer-bigtop-references/symbol-index.json`
      models the real Bigtop landscape gap (`apache-bigtop-repo/src/package-plan.js`
      references `hdfsEndpoint` defined in `apache-hadoop/src/hdfs.js`).
      `TestRunImportSymbolIndexResolvesCrossRepoReferences` proves the importer
      emits the cross-repo `references` edge that no shared-dependency producer
      can. (A JVM-shaped fixture remains a follow-on to feed the deep demo.)
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

## End-to-end wiring — NOT YET DONE (the feature is NOT live)

The importer emits `references` edges into a standalone `graph.json`, but that
output is a dead end in the current pipeline. `build-portolan-bundle.sh` never
invokes `portolan import`; `relationships.jsonl` is built only by
`scripts/scan-cross-repo.sh`, which emits `shared-dependency` and
`cross-repo-duplication` only. So reference edges never reach the bundle, the
system-map, or the atlas. The reading-layer BDD test is hand-fed (it proves the
reading layer CAN render a `references` relationship, not that the pipeline
DELIVERS one).

Open tasks before this change is genuinely done:

- [ ] Bridge importer graph edges into the bundle's relationships stream (or have
      the Go scan ingest symbol-index and emit relationships directly). This is
      the missing slice that makes the feature live end-to-end.
- [ ] Reconcile granularity: importer edges are symbol/document-level
      (`symbol-index:symbol:...`, `symbol-index:document:...`); `relationships.jsonl`
      is repo-level (`from_repo`/`to_repo`). Decide and document how a
      symbol-reference edge is carried as a relationship (e.g. lift to the owning
      repo/document, keep a symbol-level relationship kind, or both).
- [ ] End-to-end test: run the importer on a fixture, build the bundle, compose
      the system-map, assert a `references` relationship is present and rendered.
- [ ] Implement the out-of-perimeter → external-node scenario (currently only
      resolved → `references` and unresolved → `unknown` are handled).

## Validation

- [x] `openspec validate --specs` passes (15/15).
- [x] `go test ./internal/app` green — importer unit behaviour: resolved →
      `references`, unresolved → `unknown`, cross-repo resolve on the Bigtop
      fixture.
- [x] BDD runner self-tests green; 2 reading-layer scenarios bound to
      `specs/ontology`.
- [ ] **END-TO-END NOT VERIFIED** — see "End-to-end wiring" above. The importer
      unit tests and the reading-layer BDD tests do NOT together prove a
      `references` edge reaches an atlas. That remains open.

## Out of scope (follow-on)

- Managed `scip-*` subprocess producer (Go core).
- `bigtop-deep-landscape-demo` rendering of structural edges.
- Reading-layer reference-edge drill-down/dossier.
