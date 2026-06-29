# Design — symbol-reference-edges

## Decision

Add typed `references` edges derived from symbol-index role data, with bounded
evidence and honest unknowns. Fix the importer so it stops discarding
`role: reference` data. This is an **agent-atlas** feature: the coding agent
needs symbol/reference resolution to edit; the CTO atlas does not require it.

## The discarded-data finding

`internal/importer/symbol_index.go` already receives the data needed for a
reference graph and throws it away. Its input struct carries `Role` (line 30);
the fixture `internal/testfixtures/importer-normalization/symbol-index.json`
contains `role: reference` rows (e.g. `fmt.Println` at range `4:2-4:13`). But
the importer only ever emits `owns` edges (document → symbol); it never connects
a `reference` to its `definition`. The information is present at parse time and
dropped at emission. The fix is therefore small and localised: during emission,
group symbols by document, and for each `reference`-role symbol emit a
`references` edge toward the matching `definition`-role symbol (matched by symbol
identity / name within the resolved scope).

## SCIP as the interchange

SCIP (Sourcegraph) is the interchange: per-language indexers (`scip-java`,
`scip-python`, `scip-go`, `scip-typescript`, `lsif-php`, ...) emit a
language-agnostic format with definition/reference roles. The existing
symbol-index JSON contract is already SCIP-shaped (`producer`, `documents`,
`symbols[{id,name,kind,role,range}]`). The importer change is producer-agnostic:
any export conforming to the symbol-index shape yields reference edges.

## How references are produced (producer mechanics — out of scope, recorded)

Two viable producer paths, both consistent with the foundation:

1. **Managed subprocess (the ctags/jscpd precedent, now in Go).** The Go core
   detects the repo language, selects the matching `scip-*` indexer, runs it as
   a managed, timeout-bounded subprocess writing into the bundle, and records
   honest `cannot_verify`/`not_assessed` gaps on failure. `scip-java`/
   `scip-typescript` need a buildable project; that failure mode is handled by
   the existing gap machinery.
2. **Import-only (the current `import-ast-index.sh` path).** The operator
   pre-runs the indexer and supplies the export. This remains as an escape hatch
   for environments where the core cannot execute the indexer.

This change specifies edge **semantics**; selecting/adding the managed producer
is a follow-on slice.

## Evidence bounds

Per the adapter contract: local export identity/ranges are `metadata-visible`;
source-backed claims are `source-visible` only after the core reads the range;
diagnostics/correctness/completeness are `not_assessed`. The ontology delta
encodes exactly this: reference edges are `metadata-visible` at most, completeness
is `not_assessed` and surfaced, and references MUST NOT be presented as a
complete call graph.

## Cross-repo resolution (the Bigtop value)

A reference in repo A resolving to a definition in repo B is the edge that turns
"18 repos that share libraries" into a connected code landscape. The importer
emits edges whose `from`/`to` span repo boundaries; targets outside the
perimeter reuse the existing external-node rule. The deep Bigtop demo consumes
these edges (follow-on change).

## Reversibility

High. The change is additive: a new edge kind sourced from already-parsed data.
Reverting the importer emission returns to `owns`-only without data loss.

## Risk if wrong

Low–medium. Reference resolution has correctness subtleties (overloading,
generics, dynamic dispatch) — but the spec explicitly does NOT claim correctness
or completeness (`not_assessed`, `metadata-visible`), so over-claiming is the
guarded-against failure mode. The main risk is name-collision in resolution
producing a wrong-definition link; mitigated by matching on the symbol-index
`id` (SCIP schemes are globally scoped) rather than bare name, and by recording
ambiguous matches as `unknown` rather than guessing.

## Out of scope

- The managed `scip-*` subprocess producer.
- The deep Bigtop landscape demo (consumes these edges).
- Reading-layer rendering of reference edges (drill-down, dossier).
- Performance on very large exports (pagination/streaming) — follow-on.
