# Implementation Plan: FCON And Portolan GitHub Pages Site

**Branch**: `codex/050-fcon-portolan-pages-site` | **Date**: 2026-05-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/050-fcon-portolan-pages-site/spec.md`

## Summary

Create a low-risk public site plan for FCON and Portolan using GitHub Pages:
one FCON organization entry point, one Portolan project page, claim-bounded copy,
documented publishing source, and explicit domain/HTTPS state.

## Technical Context

**Language/Version**: Static HTML/CSS/Markdown or a minimal GitHub Pages setup

**Primary Dependencies**: Prefer none for v1; static files before a generator

**Storage**: v1 site files under `docs/site/` in this repository. A separate
organization Pages repository remains a future extraction option.

**Testing**: Local static preview or link check; product-claim scan; `git diff
--check`; baseline repo checks when changes land here

**Target Platform**: GitHub Pages

**Project Type**: Static public site

**Performance Goals**: Lightweight first paint; no runtime service; no
third-party tracking

**Constraints**: No server-side behavior, credentials, analytics, forms, or
unsupported claims without explicit approval

**Scale/Scope**: Site information architecture, static content, publishing
source, domain policy, and verification closeout

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --- | --- | --- |
| Local-first and read-only by default | Pass | Site is a static public wrapper; product runtime behavior does not change. |
| Evidence state honesty | Pass | Site claims map to `docs/product-claims.md`. |
| Complement, do not replace | Pass | Site says Portolan complements agents and enterprise tools. |
| SpecKit before implementation | Pass | Site architecture and domain choices are specified before building. |
| Prefer existing OSS/platforms | Pass | GitHub Pages is the default static host. |

## Project Structure

### Documentation (this feature)

```text
specs/050-fcon-portolan-pages-site/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- checklists/
|   `-- requirements.md
|-- contracts/
|   `-- pages-site.md
|-- reviews/
|   `-- site-options-2026-05-30.md
`-- tasks.md
```

### Candidate implementation files

```text
docs/
|-- site/
|   |-- index.html
|   |-- portolan/
|   |   `-- index.html
|   `-- assets/
README.md
docs/demo.md
docs/product-claims.md
.github/workflows/pages.yml
```

**Structure Decision**: Treat the site as a wrapper over canonical repository
docs, not a second documentation source of truth. For v1, publish from this
repository so the Portolan claim boundary, release notes, demo, contribution,
and security routes stay in one PR. If FCON later uses a separate organization
site repository, extract only stable wrapper copy and keep this repository as
the Portolan-side source.

## Complexity Tracking

No constitution violations. Domain, repository ownership, publishing source,
and first-screen direction are recorded under `reviews/` before implementation.
