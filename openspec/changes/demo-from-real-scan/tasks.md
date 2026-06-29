# Tasks — demo-from-real-scan

## Spec artifacts

- [x] proposal.md
- [x] design.md
- [x] specs/reading-experience/spec.md (ADDED: demo from real pipeline)
- [x] specs/engineering-standards/spec.md (ADDED: coherent unit IDs)

## Implementation slices

### Slice 1: Pipeline coherence (ID normalization)
- [ ] Audit: trace unit-ID derivation through all stages (selection → graph →
      system-map → nav-bundle)
- [ ] Fix: ensure all stages use the same ID convention
- [ ] Test: run full pipeline on a small target, verify IDs match

### Slice 2: Demo rebuild script
- [ ] `scripts/rebuild-demo.sh --target <dir> --out <dir>`
- [ ] Runs: portolan map → build-system-map → build-nav-index → build-SI → export
- [ ] Deploy: copies atlas.html to docs/site/atlas/
- [ ] Idempotent: same input → same output

### Slice 3: Bigtop demo from real scan
- [ ] Depends on: multi-language-dependency-detection + jvm-source-references
- [ ] Run rebuild-demo.sh against Bigtop landscape
- [ ] Verify: connected graph (not isolated nodes)
- [ ] Verify: all links resolve
- [ ] Deploy to GitHub Pages

### Open questions
- [ ] Should the rebuild script run in CI (on every merge to main)?
- [ ] How to handle the SI fixture vs corpus-generated SI for the demo?
- [ ] Should the demo include the raw scan artifacts for transparency?
