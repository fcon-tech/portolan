# OpenSpec Changes — Roadmap Index

Single navigation surface for all proposed changes. Source of truth for the
living specs remains `openspec/specs/`; this index tracks proposed work and the
implementation order. Validated with `openspec validate --all` (21/21).

Last updated: 2026-06-29.

## Legend

- **Layer**: dependency tier (must land in roughly this order).
- **Target spec**: the living spec(s) a change deltas.
- **Status**: `spec-only` (design TBD) / `spec+partial-impl` / `spec+verified`.
- **Derived slice**: an implementation slice that implements a change's
  requirement but does not need its own spec (tracked here so it is not lost).

## The nine proposed changes

| # | Change | Layer | Target spec | Status | One-line intent |
|---|---|---|---|---|---|
| 1 | `agent-atlas-foundation` | 0 | atlas-identity, engineering-standards | **APPLIED + ARCHIVED** 2026-06-29 | Portolan = agent-atlas (base, Go, Node-free) + human-atlas (opt-in JS skin); language by consumer fit |
| 2 | `symbol-reference-edges` | 1 | ontology | spec+partial-impl | typed `references` edges from symbol-index role data |
| 3 | `bigtop-deep-landscape-demo` | 3 | reading-experience | **spec+partial-impl** | landscape reads as connected structure, not a repo list |
| 18 | `semantic-investigation-producer` | 2 | semantic-investigation | spec-only | generate semantic pages from corpus + bounded agent claims (not fixture-backed) |
| 19 | `semantic-evidence-anchors` | 2 | semantic-investigation | spec-only | every claim carries an anchor or `not_assessed` |
| 20 | `multiscale-system-drilldown` | 2 | navigation | spec-only | ecosystem → capability → component → module/concept |
| 21 | `overlap-duplication-and-alternatives` | 1 | ontology | spec-only | overlap/alternative/legacy-stale findings |
| 22 | `agent-expedition-context-packs` | 1 | atlas-identity | spec-only | compact query-bounded agent context packs |
| 23 | `second-corpus-generalization-gate` | cross | engineering-standards | spec-only | verify contracts on a 2nd corpus; Bigtop ≠ hand-staged |

## Layered dependency order

```
Layer 0 (foundation — what Portolan IS):
  1  agent-atlas-foundation
        └─ reverses AGENTS.md "keep Go thin"; collector in Go, reading in JS.

Layer 1 (core capabilities — depend on foundation):
  2  symbol-reference-edges      (depends 1)
  21 overlap-duplication-and-alternatives
  22 agent-expedition-context-packs  (concretizes 1's economical-tentacles)

Layer 2 (investigation surface — depend on layer 1):
  18 semantic-investigation-producer  (composes 2, 21)
  19 semantic-evidence-anchors        (composes 18)
  20 multiscale-system-drilldown      (composes 18, 21)

Layer 3 (presentation/showcase):
  3  bigtop-deep-landscape-demo  (depends 1, 2; benefits from 18, 21)

Cross-cutting (applies to all; run once a 2nd corpus exists):
  23 second-corpus-generalization-gate
```

## Living-spec collisions (all complementary — no contradictions)

Several changes delta the same living spec. Each pair is complementary, not
duplicate:

- **atlas-identity**: `1` (base/skin roles + economical-tentacles principle) +
  `22` (the pack mechanism). Principle vs mechanism — `22` concretizes `1`.
- **engineering-standards**: `1` (portolan-core is reading layer; collector in
  Go) + `23` (second-corpus gate). Different concerns.
- **ontology**: `2` (`references` edges) + `21` (overlap findings). Edges vs
  findings.
- **semantic-investigation**: `18` (corpus generation) + `19` (anchors).

## CRITICAL — overlaps with the EXISTING living specs

`openspec/specs/semantic-investigation/` is already rich. Several changes
**extend** it rather than introduce new concepts — implementation must read the
living spec first:

- `19` extends the living requirement "Source boundary labels every semantic
  assertion" (already requires source-boundary labels + resolvable source cards
  for curated claims). `19` ADDS: a command-receipt anchor type and the
  never-render-unanchored-as-verified enforcement.
- `21` adds overlap/alternative findings ON TOP of the living requirement
  "Overlap and alternatives are bidirectional", which already defines
  `overlaps_with` as a semantic relation. An overlap can be BOTH a relation and
  a finding; `21` does not replace the relation.
- `20` extends the living "Ecosystem placement map shows capability regions" +
  "Capability is the organizing unit" toward a full multiscale drill-down.
- `18` moves the surface from sample-proven (living "Sample is swappable") to
  corpus-generated in production. The swappable sample remains the contract
  proof; production pages are generated.

## Derived implementation slices (tracked here — do not lose)

Concrete slices that implement a change's requirement but need no new spec:

| Slice | Implements | Why it matters |
|---|---|---|
| `agent-base-collect-query` | `1` | Go collect→query→JSON substrate + tree-signature staleness; closes the `/portolan:map` initiation gap (`portolan-map.mjs` errors instead of collecting). **The first implementation slice.** |
| `importer-bundle-bridge` | `2` | Wire importer graph edges into `relationships.jsonl` (currently a dead end; `build-portolan-bundle.sh` never invokes `portolan import`). Reconcile symbol-level edges vs repo-level relationships. Without this `2` is not live. |
| `scip-producer` | `2` | Managed `scip-*` subprocess producer (Go core) so real Bigtop structural edges flow; feeds `3`. |

## Recommended implementation order (for a fresh session)

1. `agent-base-collect-query` (derived) — closes the live `/portolan:map` gap;
   unblocks everything.
2. `symbol-reference-edges` + `importer-bundle-bridge` — make reference edges
   reach the atlas end-to-end.
3. `bigtop-deep-landscape-demo` (dependency-only honesty first; full structural
   showcase after `scip-producer`).
4. `overlap-duplication-and-alternatives`, `semantic-investigation-producer`,
   `semantic-evidence-anchors`, `multiscale-system-drilldown` — the
   investigation surface.
5. `agent-expedition-context-packs`.
6. `second-corpus-generalization-gate` once a second corpus is chosen.

## Status honesty

- `agent-base-collect-query` (derived slice) is **implemented**: the Go
  `internal/staleness` package + `portolan map --if-stale` provide the
  collect→query→JSON substrate with tree-signature staleness, and
  `portolan-map.mjs` now collects via the Go core instead of erroring on a
  missing pre-built bundle (closes the `/portolan:map` initiation gap).
  `agent-atlas-foundation` is **applied + archived** (2026-06-29): its deltas
  are folded into the living atlas-identity and engineering-standards specs;
  the navigation spec gained "collect if stale" + "reuse when fresh" BDD
  scenarios bound to unit tests.
- `symbol-reference-edges` is **end-to-end done**: the importer emits
  `references` edges, the map collector bridges them into repo-level graph
  edges (`internal/maprun/symbolrefs.go`), and the reading layer renders them.
  See `importer-bundle-bridge` above.
- `bigtop-deep-landscape-demo` is **spec + partial-impl**. The dependency-only
  honesty slice is implemented and code+spec reviewed to LGTM (minimax +
  deepseek): the reading layer classifies edges into structural vs dependency,
  renders a plain-language limitation notice when only dependency edges exist,
  and renders structural edges distinctly with an edge legend when present
  (scenarios 1a + 1b bound to passing BDD tests). The full structural Bigtop
  showcase (regenerated demo with real structural edges + the hard "not a repo
  list" harness gate) is deferred to the `scip-producer` slice; scenarios 2a/2b
  are recorded as commented-out in the feature file.
- Everything else is `spec-only` unless an implementation slice above lands.
