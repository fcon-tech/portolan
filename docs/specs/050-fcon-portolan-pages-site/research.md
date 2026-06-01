# Research: FCON And Portolan GitHub Pages Site

## Decision Gate

### Simpler/Faster

Use a static GitHub Pages site. Start with a FCON index page and a Portolan
project page that point back to README, release notes, product claims, and demo
docs. Do not add a full docs framework, analytics, forms, or custom backend.

### Blocking Edge Cases

- Organization site and project site may need different repositories or URLs.
- Custom domain setup requires ownership/DNS/HTTPS verification.
- Site copy can drift faster than repo docs.
- Site visuals can accidentally show unsupported UI or private demo context.

### Existing Open Source

- GitHub Pages is the default platform because it is already attached to GitHub
  discovery and supports static publishing.
- Plain static files are enough for v1. Jekyll, Hugo, Astro, or MkDocs should
  be considered only if repeated content maintenance becomes painful.

## Decisions

### D-001 - GitHub Pages before custom hosting

**Decision**: Use GitHub Pages for the first public site.

**Rejected Alternatives**: Custom hosting, Vercel/Netlify, self-hosted server,
or docs framework as the first move.

**Why Now**: GitHub Pages is low-operational-risk and close to the repository
surface.

**Reversibility**: High. Static content can move later.

**Risk If Wrong**: Limited design flexibility or build constraints.

**Confidence**: high

### D-002 - Two-level site model

**Decision**: Separate FCON organization entry point from Portolan project page.

**Rejected Alternatives**: Put all brand context into Portolan README; make a
Portolan-only site with no company context; make a generic FCON consulting site
that hides Portolan.

**Why Now**: The user explicitly wants both FCON and Portolan represented.

**Reversibility**: Medium. URL and navigation choices can become public links.

**Risk If Wrong**: The public story either lacks credibility or becomes too
generic.

**Confidence**: high

### D-003 - No analytics or forms in v1

**Decision**: Exclude analytics, forms, and third-party embeds from the first
site version.

**Rejected Alternatives**: Add Plausible/GA immediately; add contact forms; add
embedded demos.

**Why Now**: Privacy and operational risk are not needed to validate the launch
surface.

**Reversibility**: High.

**Risk If Wrong**: Less visitor telemetry after launch.

**Confidence**: high
