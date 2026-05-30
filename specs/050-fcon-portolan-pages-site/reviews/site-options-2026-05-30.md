# Site Options

**Date**: 2026-05-30

## Recommendation

Use GitHub Pages for v1 with two public surfaces:

- FCON organization entry point.
- Portolan project page with install, demo, release, product-claim, GitHub,
  contribution, and security links.

Start with static files or the simplest Pages-supported setup. Defer analytics,
forms, generated docs framework, and custom hosting.

## Options

### Option A - Organization Pages repo plus Portolan project page

- `fcon-tech.github.io` hosts FCON entry point.
- Portolan page links to `fcon-tech/portolan`.
- Best fit if FCON wants more projects later.

Risk: requires a separate repository and cross-repo coordination.

### Option B - Portolan repository publishes project site only

- `fcon-tech.github.io/portolan` or custom project URL.
- Fastest path for Portolan.

Risk: weaker FCON brand surface.

### Option C - Custom domain for both FCON and Portolan

- Example: `fcon.tech` and `portolan.fcon.tech`.
- Best public polish.

Risk: DNS, domain verification, HTTPS state, and ownership must be handled
before calling it verified.

## Current Recommendation

Plan for Option A plus optional custom domain later:

1. Make Portolan page content source-controlled in this repository.
2. Publish through GitHub Pages once release/demo are coherent.
3. Add custom domain only after DNS/domain ownership is verified.

## Evidence State

- `not_assessed`: GitHub Pages repository choice.
- `not_assessed`: Domain ownership and DNS.
- `not_assessed`: HTTPS deployment state.
- `not_assessed`: GitHub Pages publishing source.
