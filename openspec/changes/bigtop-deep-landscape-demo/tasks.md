# Tasks — bigtop-deep-landscape-demo

Spec + showcase change. Depends on `agent-atlas-foundation` and
`symbol-reference-edges`.

## Spec artifacts

- [x] `proposal.md`
- [x] `design.md`
- [x] `specs/reading-experience/spec.md` (ADDED: landscape shows connected
      structure, not a flat inventory; dependency-only honesty; Bigtop as the
      deep-landscape acceptance showcase)

## Implementation

- [x] JS reading layer (`portolan-core`): render typed structural `references`
      edges + shared-dependency clusters as connected groupings/hubs/flows in the
      landscape (Fleet) view. *(edges carry a `structural` flag, distinct
      `graph-edge--structural`/`--dependency` styling, and a structural-edge
      legend; the rendering capability is in place — full Bigtop depth unlocks
      with the structural-edge producer below.)*
- [x] Dependency-only honesty: when a snapshot has no structural edges, the
      landscape view states the limitation in plain language and does not dress
      dependency clusters as architecture. *(domain classifier + use-case +
      `renderMap` notice, bound to BDD scenario 1b.)*
- [ ] Regenerate `docs/site/bigtop/data/bigtop-demo.json` from a real Bigtop scan
      that includes structural edges (via `scripts/export-bigtop-gh-pages-demo.mjs`);
      commit the derived fixture so the showcase is reproducible without a full
      corpus scan in CI. *(blocked on the `scip-producer` slice.)*
- [~] `scripts/harness-bigtop-acceptance.sh`: add a "not a repo list" assertion —
      the showcase landscape contains cross-component structural edges, not only
      shared-dependency clusters. *(non-fatal structural-edge accounting is in
      place and emits a visible dependency-only warning; the hard fail-gate
      follows `scip-producer`.)*

## BDD binding (lands with the implementation, per engineering-standards TDD)

- [x] `portolan-core/test/features/feature-p1b-deep-landscape-demo.feature`
      (scenarios: connected groupings from structural+dependency edges;
      dependency-only admitted; Bigtop showcase reads as an ecosystem).
      *(scenarios 1a + 1b are bound; 2a/2b are recorded as commented-out /
      deferred pending the structural-edge producer.)*
- [x] `portolan-core/test/bdd-runner.js`: add
      `FEATURE_TO_OPENSPEC['deep-landscape-demo'] = 'specs/reading-experience'`
      and bindings → a portolan-core unit test consuming a fixture with
      structural edges.

## Validation

- [x] `openspec validate --specs` passes.
- [x] BDD runner self-tests green.
- [ ] `harness-bigtop-acceptance.sh` green with the "not a repo list" assertion.
      *(needs a real Bigtop bundle + the `scip-producer` slice.)*
- [ ] A reviewer opening `docs/site/bigtop/index.html` sees a connected
      ecosystem (manual/C-level sign-off). *(needs the regenerated showcase.)*

## Sequencing note

The dependency-only honesty rule can land before `symbol-reference-edges`
produces edges for Bigtop (it degrades gracefully). The full "connected
ecosystem" showcase unlocks once structural edges flow from
`symbol-reference-edges` running on the Bigtop corpus.
