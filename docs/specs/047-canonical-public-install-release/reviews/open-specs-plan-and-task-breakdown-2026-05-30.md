# Open Specs Plan And Task Breakdown

**Date**: 2026-05-30

## Scope

Open public-showcase specs in this branch:

- P5-047: `docs/specs/047-canonical-public-install-release/`
- P5-048: `docs/specs/048-github-community-discovery/`
- P5-049: `docs/specs/049-public-demo-showcase/`
- P5-050: `docs/specs/050-fcon-portolan-pages-site/`

P5-046 is intentionally outside this branch because it belongs to the separate
OpenCode PR review gate worktree.

## Implementation Order

1. **047 Canonical Public Install And Release**
   - Reason: public identity must be stable before README, release, demo,
     community, and site links are credible.
   - First implementation checkpoint: module path, release ldflags, README, and
     source-first `v0.1.0` docs use `github.com/fcon-tech/portolan`.

2. **049 Public Demo Showcase**
   - Reason: the demo and case study need the canonical install/release route.
   - First implementation checkpoint: `docs/demo.md` can run or explicitly
     block the Apache Bigtop demo and points to redacted excerpts only.

3. **048 GitHub Community Discovery**
   - Reason: community metadata should link to stable install, demo, security,
     and contribution surfaces.
   - First implementation checkpoint: community files and templates exist;
     GitHub private vulnerability reporting is enabled or recorded as blocked.

4. **050 FCON And Portolan GitHub Pages Site**
   - Reason: the site should wrap stable product surfaces rather than become a
     second source of truth.
   - First implementation checkpoint: static FCON and Portolan pages preview
     locally and contain no unsupported claims, forms, analytics, or tracking.

## Task Readiness

- `verified`: Each open spec has `spec.md`, `plan.md`, `research.md`,
  `data-model.md`, `contracts/`, `quickstart.md`, `checklists/`, `reviews/`,
  and concrete `tasks.md`.
- `verified`: Tasks are organized by user story and include file paths.
- `verified`: Backlog rows P5-047 through P5-050 describe plan/task state.
- `verified`: `.specify/feature.json` points to 047 as the first implementation
  dependency.

## Remaining Blockers

- P5-048: GitHub private vulnerability reporting must be enabled or explicitly
  recorded as blocked by repository admin access.
- P5-048: conduct policy must be approved before `CODE_OF_CONDUCT.md`.
- P5-048: repository description, topics, and homepage policy must be approved
  before applying GitHub metadata.
- P5-050: site repository, domain policy, publishing source, and first-screen
  visual direction must be chosen before publication.

## Verification Boundary

This breakdown is planning work only. No public install path, release,
community file, demo run, or Pages site has been implemented in this slice.
