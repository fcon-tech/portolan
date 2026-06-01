# Spec Package Self-Review: Public Demo Showcase

**Date**: 2026-05-30

## Assessment

- `verified`: The repository has existing CLI artifacts that can support a demo
  route: context preparation, map output, evidence index, answer contract, query
  and graph slice surfaces.
- `verified`: `docs/product-claims.md` provides the public claim boundary for a
  case study.
- `not_assessed`: Public-safe demo target selection.
- `not_assessed`: Whether sample artifacts should be committed.
- `not_assessed`: Screenshots, terminal recordings, or GitHub Pages.

## Findings

1. **major - Demo target must be approved before artifacts**
   - A self-map is simplest, but it may not show cross-repo value. An external
     OSS target may tell a better story but adds license/network/freshness risk.

2. **major - Case study can drift into benchmark marketing**
   - The spec correctly requires fixed local Bigtop and headless Cursor wording
     when using the existing comparison evidence.

3. **minor - Visual assets are optional**
   - Reproducible commands and artifacts should lead. Screenshots or recordings
     can follow once the text demo is stable.

## Open Questions

- Should the first demo target be Portolan itself, a tiny fixture, or an
  approved external OSS project?
- Should generated sample artifacts be committed, generated on demand, or both?
- Should the first public showcase include a terminal recording, or stay
  text-first?
