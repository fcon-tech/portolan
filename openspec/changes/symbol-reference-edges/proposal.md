## Why

The deterministic core today emits **no structural code edges** across languages.
`internal/relationships/relationships.go` is Go-only and imports-only (it parses
`go.mod` + Go files with `parser.ImportsOnly`, emitting `imports`/`depends-on`
edges). The symbol-index importer (`internal/importer/symbol_index.go`) receives
`role: reference` data from symbol-index/SCIP exports but **discards it** — it
emits only `owns` edges (document → symbol), never connecting a reference to its
definition. The adapter contract (`docs/adapter-contracts/symbol-index-profile.md`)
even forbids "treating symbol references as complete call graphs."

Consequence, visible on the Bigtop demo: all 74 demo relationships are
`shared-dependency` (SBOM/syft, `metadata-visible`). The landscape reads as "18
repos that share libraries," not a connected code landscape. For the **agent**
consumer — who needs symbol/reference resolution to make edits — this is the
single highest-value gap.

## What Changes

- **Ontology delta.** Add typed `references` edges derived from symbol-index
  role data: a `role: reference` symbol SHALL produce a `references` edge toward
  its `role: definition` counterpart. References resolving outside the perimeter
  SHALL become external nodes (per the existing out-of-perimeter rule);
  unresolved references SHALL become `unknowns`, never guessed edges.
- **Evidence honesty.** A reference edge derived from an import SHALL be
  `metadata-visible` at most, SHALL NOT be promoted to `source-visible` unless
  the core independently reads the range, and its completeness SHALL be
  `not_assessed` and surfaced (it is not a complete call graph).
- **Importer fix (Go).** `internal/importer/symbol_index.go` SHALL emit
  `references` edges from `role: reference` rows (it currently emits only
  `owns`). Bound by a unit test on the existing fixture
  `internal/testfixtures/importer-normalization/symbol-index.json`, which already
  contains a `main` definition and a `fmt.Println` reference.
- **Producer-agnostic.** The edges come from a symbol-index/SCIP-shaped export.
  Whether that export is produced by a managed `scip-*` subprocess in the Go core
  or supplied by the operator is a producer-mechanics decision, not an
  edge-semantics one; this change specifies only the semantics.

## Capabilities

### New Capabilities

- **Symbol reference edges.** Typed `references` edges resolved from
  symbol-index role data, with bounded evidence and honest unknowns.

### Modified Capabilities

- `ontology`: adds how `references` edges are sourced from symbol-index role
  data, and the evidence bounds on import-derived reference edges. Reuses the
  existing typed-edge and external-node requirements; adds the derivation rule.

## Impact

- **Code**: `internal/importer/symbol_index.go` gains reference-edge emission;
  new `internal/importer/symbol_index_test.go` proves it on the existing fixture
  (definition + reference + unresolved cases). No new runtime or dependency.
- **Depends on**: `agent-atlas-foundation` (producers/collector live in Go;
  this is an agent-atlas feature).
- **Bigtop**: a JVM-shaped SCIP fixture is added so the structural-edge path can
  be proven headlessly (the real Bigtop corpus is JVM-heavy: Hadoop/Spark/Hive/
  HBase/Kafka/Flink). The deep landscape demo (`bigtop-deep-landscape-demo`)
  consumes these edges to stop reading as a repo list.
- **Out of scope**: the managed `scip-*` subprocess producer; the deep demo; the
  reading-layer rendering of reference edges. Each is its own follow-on.
