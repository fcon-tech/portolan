# OpenSpec Changes — Roadmap Index

Single navigation surface for all proposed changes. Source of truth for the
living specs remains `openspec/specs/`; this index tracks proposed work and the
implementation order. Validate with `openspec validate --specs`.

Last reconciled: 2026-08-23 (checkbox states re-verified against code and git
history; stale statuses corrected).

## Legend

- **Layer**: dependency tier.
- **Target spec**: the living spec(s) a change deltas.
- **Status**: `spec-only` (design TBD) / `spec+partial-impl` / `spec+implemented`.
- **Derived slice**: an implementation slice that implements a change's
  requirement but does not need its own spec (tracked here so it is not lost).

## Active changes

| # | Change | Layer | Target spec | Status | One-line intent |
|---|---|---|---|---|---|
| 1 | `multi-language-dependency-detection` | 1 | ontology | **spec+implemented** (PHP composer + registry open questions remain) | manifest-detected dependencies across languages |
| 2 | `jvm-source-references` | 1 | ontology | **spec+implemented** (slice 1 complete, tested) | typed `references` edges from JVM import resolution |
| 3 | `mobile-framework-detection` | 1 | ontology | **spec+partial-impl** (manifests done; Android confirmation + swift/dart source refs open) | Swift/Flutter/RN manifest dependency detection |
| 4 | `demo-from-real-scan` | 3 | reading-experience, engineering-standards | **spec+implemented** (demo deployed to `docs/site/`; idempotency unproven) | the public demo comes from a real pipeline scan, not a fixture |
| 5 | `bigtop-deep-landscape-demo` | 3 | reading-experience | **spec+partial-impl** (honesty slice done; structural showcase deferred to `scip-producer`) | landscape reads as connected structure, not a repo list |
| 6 | `agent-expedition-context-packs` | 1 | atlas-identity | spec-only (design TBD) | compact query-bounded agent context packs |
| 7 | `second-corpus-generalization-gate` | cross | engineering-standards | spec-only (design TBD) | verify contracts on a 2nd corpus; Bigtop ≠ hand-staged |

Changes 1–4 were proposed together (8fae92f) and implemented together; their
implementation landed 2026-06-29/30 but their tasks.md files were reconciled
only on 2026-08-23 — see each change's `tasks.md` header for the evidence trail.

## Archived changes

- `archive/2026-06-28-migrate-viewer-to-portolan-core/` — viewer → portolan-core
  migration (the `viewer/` app is deleted from the tree).
- `archive/2026-06-29-agent-atlas-foundation/` — Portolan = agent-atlas base +
  human-atlas reading layer; folded into the living atlas-identity and
  engineering-standards specs.
- `archive/2026-06-29-investigation-surface/` — four sub-changes:
  semantic-investigation-producer, semantic-evidence-anchors,
  multiscale-system-drilldown, overlap-duplication-and-alternatives.
- `archive/2026-06-30-symbol-reference-edges/` — typed `references` edges from
  symbol-index role data; end-to-end verified (graph.json + typed relationship
  in system-map artifacts), all 20 tasks done.

## Derived implementation slices

| Slice | Implements | Status |
|---|---|---|
| `agent-base-collect-query` | agent-atlas-foundation (archived) | **implemented** — Go `internal/staleness` + `portolan map --if-stale`; `/portolan:map` collects via the Go core when stale |
| `importer-bundle-bridge` | symbol-reference-edges (archived) | **implemented** — importer edges bridged into repo-level graph edges (`internal/maprun/symbolrefs.go`) |
| `scip-producer` | feeds `bigtop-deep-landscape-demo` | **pending** — managed `scip-*` subprocess producer so real Bigtop structural edges flow; blocks the full structural showcase (scenarios 2a/2b, currently commented out in the feature file) |

## Recommended implementation order (for a fresh session)

1. `scip-producer` (derived slice) — unblocks the full `bigtop-deep-landscape-demo` showcase.
2. `bigtop-deep-landscape-demo` remaining scenarios (2a/2b).
3. `agent-expedition-context-packs` — needs design first.
4. `second-corpus-generalization-gate` once a second corpus is chosen.
5. Residuals of changes 1–3 (PHP composer registry, Android Gradle confirmation,
   swift/dart source-reference resolvers) — only if a corpus needs them.
