# Tasks — demo-from-real-scan

> Reconciled 2026-08-23 against the implementation (commits b77425a, 198b5b5,
> 772c645, 8a481ec). The deployed demo is `docs/site/bigtop/` +
> `docs/site/atlas/` (18 repos, real pipeline scan).

## Spec artifacts

- [x] proposal.md
- [x] design.md
- [x] specs/reading-experience/spec.md (ADDED: demo from real pipeline)
- [x] specs/engineering-standards/spec.md (ADDED: coherent unit IDs)

## Implementation slices

### Slice 1: Pipeline coherence (ID normalization)
- [x] Audit: trace unit-ID derivation through all stages — proven end-to-end by
      the deployed demo (nav-index + atlas links resolve across stages)
- [x] Fix: all stages use the same ID convention (b77425a "specs 1-4 complete")
- [x] Test: full pipeline on a small target, IDs match (CI smoke +
      harness-portolan-smoke.sh)

### Slice 2: Demo rebuild script
- [x] `scripts/rebuild-demo.sh --target <dir> --out <dir>`
- [x] Runs: portolan map → build-system-map → build-nav-index → build-SI → export
- [x] Deploy: copies atlas.html to docs/site/atlas/
- [ ] Idempotent: same input → same output — not proven (no recorded rerun)

### Slice 3: Bigtop demo from real scan
- [x] Depends on: multi-language-dependency-detection + jvm-source-references
- [x] Run rebuild-demo.sh against Bigtop landscape (198b5b5, 18-repo landscape)
- [x] Verify: connected graph (74 relationships in the deployed demo data)
- [x] Verify: all links resolve (8a481ec "clean atlas+SI demo with working links")
- [x] Deploy to GitHub Pages (docs/site/ deployed by pages.yml)

### Open questions
- [ ] Should the rebuild script run in CI (on every merge to main)?
- [ ] How to handle the SI fixture vs corpus-generated SI for the demo?
- [ ] Should the demo include the raw scan artifacts for transparency?
