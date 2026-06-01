# Public Showcase Main Sync

**Date**: 2026-05-30

## Base

- `verified`: `origin/main` was fetched before this review.
- `verified`: `origin/main` commit is
  `2984d3089a98a087365fe115817f693a036ca0cd`.
- `verified`: Branch `codex/047-public-showcase-specs` worktree HEAD is based
  on the same commit.
- `verified`: No upstream commits exist in `HEAD..origin/main` after fetch.

## Public Showcase Spec Order

1. `docs/specs/047-canonical-public-install-release/`
   - Governs canonical identity, `v0.1.0`, source-first release, and public
     install consistency.
   - Active SpecKit pointer.
2. `docs/specs/049-public-demo-showcase/`
   - Depends on canonical install/release wording.
   - Supplies Apache Bigtop demo route and redacted public excerpts.
3. `docs/specs/048-github-community-discovery/`
   - Depends on canonical public links and security/contact choices.
   - Supplies community files and GitHub metadata.
4. `docs/specs/050-fcon-portolan-pages-site/`
   - Depends on stable install, demo, product-claim, contribution, and security
     routes.
   - Supplies the FCON/Portolan GitHub Pages wrapper.

## Integration Notes

- `.specify/feature.json` points to
  `docs/specs/047-canonical-public-install-release` because canonical public
  identity is the first blocking implementation dependency.
- `AGENTS.md` SpecKit pointer points to the 047 plan for the same reason.
- Backlog rows P5-047 through P5-050 are ordered by dependency, not by public
  visual impact.
- Local `main` checkout may remain behind `origin/main`; this branch is tied to
  fetched `origin/main`, which is the relevant integration base.

## Evidence State

- `verified`: Current branch is connected to fetched `origin/main`.
- `not_assessed`: Remote feature branch publication.
- `not_assessed`: GitHub PR state.
