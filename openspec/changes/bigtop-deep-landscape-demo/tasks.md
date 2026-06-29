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

- [ ] JS reading layer (`portolan-core`): render typed structural `references`
      edges + shared-dependency clusters as connected groupings/hubs/flows in the
      landscape (Fleet) view.
- [ ] Dependency-only honesty: when a snapshot has no structural edges, the
      landscape view states the limitation in plain language and does not dress
      dependency clusters as architecture.
- [ ] Regenerate `docs/site/bigtop/data/bigtop-demo.json` from a real Bigtop scan
      that includes structural edges (via `scripts/export-bigtop-gh-pages-demo.mjs`);
      commit the derived fixture so the showcase is reproducible without a full
      corpus scan in CI.
- [ ] `scripts/harness-bigtop-acceptance.sh`: add a "not a repo list" assertion —
      the showcase landscape contains cross-component structural edges, not only
      shared-dependency clusters.

## BDD binding (lands with the implementation, per engineering-standards TDD)

- [ ] `portolan-core/test/features/feature-p1b-deep-landscape-demo.feature`
      (scenarios: connected groupings from structural+dependency edges;
      dependency-only admitted; Bigtop showcase reads as an ecosystem).
- [ ] `portolan-core/test/bdd-runner.js`: add
      `FEATURE_TO_OPENSPEC['deep-landscape-demo'] = 'specs/reading-experience'`
      and bindings → a portolan-core unit test consuming a fixture with
      structural edges.

## Validation

- [ ] `openspec validate --specs` passes.
- [ ] BDD runner self-tests green.
- [ ] `harness-bigtop-acceptance.sh` green with the "not a repo list" assertion.
- [ ] A reviewer opening `docs/site/bigtop/index.html` sees a connected
      ecosystem (manual/C-level sign-off).

## Sequencing note

The dependency-only honesty rule can land before `symbol-reference-edges`
produces edges for Bigtop (it degrades gracefully). The full "connected
ecosystem" showcase unlocks once structural edges flow from
`symbol-reference-edges` running on the Bigtop corpus.
