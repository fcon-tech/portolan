# Pages Topology Decision

**Date**: 2026-05-31

## Decision

Implement v1 in the Portolan repository under `docs/site/` with:

- FCON organization entry page at `docs/site/index.html`;
- Portolan project page at `docs/site/portolan/index.html`;
- shared static assets under `docs/site/assets/`.

## Rejected Alternatives

- Separate `fcon-tech.github.io` repository for v1: better organization-site purity, but adds cross-repo coordination before the Portolan claim boundary is stable.
- Portolan-only project page with no FCON entry: fastest, but misses the requested FCON public entry point.
- Static site generator: unnecessary for two pages and adds dependency/build maintenance.

## Why Now

The site copy must stay close to README, release, demo, product claims, contribution, and security files. Keeping v1 in this repository makes review and claim scanning cheaper.

## Reversibility

High. Static HTML/CSS can later move to an organization Pages repository if FCON needs a broader site.

## Risk If Wrong

The public URL may be less ideal than a dedicated organization site. The content remains portable.

## Confidence

high
