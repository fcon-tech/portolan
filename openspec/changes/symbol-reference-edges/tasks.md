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
      Match on symbol `id` (SCIP-scoped) or name presence in the definitions
      set. (Resolved → `references`; unresolved → `unknown`;
      definitions/other → `owns`. All `metadata-visible`.)
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

## End-to-end wiring — DONE (the feature is live)

The importer emits `references` edges into a standalone `graph.json`. The Go map
collector (`internal/maprun`) now discovers operator-supplied symbol-index JSON
exports under `<root>/.portolan/symbol-index/*.json`, imports each via
`importer.ParseSymbolIndex`, and lifts the resolved reference edges to repo-level
graph edges that reach the system-map as typed `references` relationships through
the existing `translateMapBundle` → `composeSystemMap` path.

### Design decisions (granularity reconciliation)

- **Lift to repo level.** Symbol/document-level edges are lifted to repo→repo
  edges by mapping document paths back to discovered repos (longest-prefix match
  with a basename fallback for exports whose paths are repo-relative). Only
  cross-repo and out-of-perimeter references produce edges; intra-repo references
  are within a single landscape unit and do not produce a cross-unit relationship.
- **Deduplication.** Multiple references between the same repo pair collapse to a
  single repo→repo `references` edge (the edge evidence carries the not-a-complete-
  call-graph caveat; per-symbol drill-down is a follow-on).
- **depends_on separation.** `references` edges do NOT populate `depends_on` on
  atlas targets — only `imports`/`depends-on` edges do. A code reference is not a
  declared manifest dependency.

### Implementation

- [x] `internal/importer/symbol_index.go`: extracted `ParseSymbolIndex(inputPath)`
      from `RunSymbolIndex` so the map collector can import in-process without an
      output-path side effect. `RunSymbolIndex` delegates after validating CLI args.
- [x] `internal/maprun/symbolrefs.go`: `importSymbolReferences(root, repos)` —
      discovers exports, imports each, lifts to repo-level edges, returns
      graph nodes/edges + findings + coverage records. Three outcomes per
      reference: cross-repo → `references` edge; out-of-perimeter → external node
      + `references` edge; unresolved → coverage `unknown` record (never guessed).
- [x] `internal/maprun/maprun.go` `Run()`: merged `symbolReferenceResult` into the
      map bundle's graph, findings, and coverage after root discovery.
- [x] `portolan-core/src/domain/map-bundle-translate.js`: `depends_on` now filters
      to `imports`/`depends-on`/`depends_on` kinds so `references` edges do not
      pollute the declared-dependency list.

### Tests

- [x] `internal/maprun/symbolrefs_test.go`: 10 tests — cross-repo,
      out-of-perimeter, unresolved, intra-repo skip, no-exports no-op, dedup,
      malformed export, unmapped source doc, E2E through `Run()` (cross-repo),
      and E2E out-of-perimeter through `Run()`.
- [x] `portolan-core/test/unit/map-bundle-translate.test.js`: added test proving
      `references` edges become typed relationships without populating `depends_on`.
- [x] Out-of-perimeter → external-node scenario implemented (external node flagged
      external, not crawled).

## Validation

- [x] `openspec validate --all` passes (20/20).
- [x] `go test ./...` green — all packages.
- [x] portolan-core: 471 unit + 4 BDD + 0 dep-rule violations.
- [x] **END-TO-END VERIFIED** — `TestRunMapSymbolReferencesReachGraph` proves a
      `references` edge reaches `graph.json`; `map-bundle-translate.test.js` proves
      it becomes a typed relationship in the system-map artifacts.

## Out of scope (follow-on)

- Managed `scip-*` subprocess producer (Go core).
- `bigtop-deep-landscape-demo` rendering of structural edges.
- Reading-layer reference-edge drill-down/dossier.
