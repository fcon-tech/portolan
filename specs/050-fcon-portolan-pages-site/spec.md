# Feature Specification: FCON And Portolan GitHub Pages Site

**Feature Branch**: `codex/050-fcon-portolan-pages-site`

**Created**: 2026-05-30

**Status**: Ready-for-review PR; local implementation, PR review, merge state,
and GitHub checks verified; live GitHub Pages deployment, default Pages URL,
DNS, HTTPS, GitHub review approval, and merge approval remain `not_assessed`

**Input**: User description: "A site / GitHub Pages for FCON and Portolan is a
good idea."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Land On A Credible FCON OSS Entry Point (Priority: P1)

A visitor can open an FCON public site and understand that FCON maintains
practical AI engineering tools, with Portolan as a highlighted local-first
evidence tool.

**Why this priority**: A company-level entry point makes the project look
intentional without forcing Portolan's README to carry all brand context.

**Independent Test**: Open the FCON site and find what FCON does, what Portolan
is, and where to install or inspect the project in under one minute.

**Acceptance Scenarios**:

1. **Given** a visitor lands on the FCON site, **When** they scan the first
   screen, **Then** they see FCON and Portolan without generic AI-consulting
   fluff.
2. **Given** a visitor clicks into Portolan, **When** they arrive on the project
   site, **Then** they can reach install, demo, docs, GitHub, and product limits.

---

### User Story 2 - Inspect Portolan Without Reading The Whole Repository (Priority: P2)

A CTO, staff engineer, or agent-tooling evaluator can read a concise Portolan
project page that explains the product, shows the Apache Bigtop demo route, and
keeps claim boundaries visible.

**Why this priority**: Popularization benefits from a polished page, but the
page must not become a marketing layer that outruns repository evidence.

**Independent Test**: Compare the Portolan page with `docs/product-claims.md`
and confirm every positive claim is accepted or narrowed.

**Acceptance Scenarios**:

1. **Given** the page mentions Bigtop, **When** a reviewer checks the copy,
   **Then** it says fixed local Apache Bigtop demo/case study and does not claim
   broad benchmark proof.
2. **Given** the page mentions agents, **When** a reviewer checks the copy,
   **Then** it says Portolan prepares local evidence for agents and does not
   claim to replace Cursor, OpenCode, Codex, enterprise code intelligence,
   observability, or readiness tools.

---

### User Story 3 - Publish With Low Operational Risk (Priority: P3)

A maintainer can publish the site through GitHub Pages without adding a custom
runtime service, credentials, tracking scripts, or fragile build pipeline.

**Why this priority**: A static GitHub Pages site fits the local-first OSS
launch. A custom app or analytics-heavy site would add operational and privacy
risk before there is public adoption.

**Independent Test**: A reviewer can rebuild or inspect the site locally, verify
the configured Pages source, confirm custom-domain ownership state, and check
that no tracking, forms, or credentialed integrations were added.

**Acceptance Scenarios**:

1. **Given** the site is published through GitHub Pages, **When** a reviewer
   inspects configuration, **Then** the publishing source and custom-domain
   state are recorded as `verified`, `blocked`, or `not_assessed`.
2. **Given** a page includes visual polish, **When** it is reviewed, **Then**
   it uses real product/demo artifacts or restrained static visuals, not
   unsupported UI screenshots or decorative hype.

### Edge Cases

- FCON organization site and Portolan project site have different repositories,
  domains, or publishing sources.
- A custom domain is desired but DNS/domain verification is not configured.
- Site copy claims customer adoption, security certification, or broad agent
  performance without evidence.
- A static site generator adds unnecessary dependencies and maintenance burden.
- Analytics, contact forms, or third-party embeds introduce privacy or
  credential risk.
- The site falls out of sync with README, release notes, or product claims.
- Mobile visitors need a readable first screen and navigation without requiring
  a desktop-width viewport.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site plan MUST distinguish FCON organization site from
  Portolan project site.
- **FR-002**: The Portolan project page MUST link to canonical install, release,
  demo, product claims, GitHub repository, and contribution/security routes.
- **FR-003**: Site copy MUST derive Portolan capability claims from
  `docs/product-claims.md`.
- **FR-004**: The site MUST not include analytics, forms, tracking scripts,
  external embeds, credentials, or server-side behavior without explicit design
  approval.
- **FR-005**: GitHub Pages publishing source MUST be documented: repository,
  branch/path or GitHub Actions workflow, and environment/protection settings
  if any.
- **FR-006**: Custom domain policy MUST be documented, including whether FCON
  uses a root domain, `www`, `fcon.tech`, `portolan.fcon.tech`, or GitHub's
  default Pages URL.
- **FR-007**: Domain verification, DNS state, HTTPS state, and Pages deployment
  state MUST be recorded as `verified`, `blocked`, or `not_assessed`.
- **FR-008**: The first version SHOULD prefer a minimal static site over a
  generator unless a generator materially improves maintainability.
- **FR-009**: Visual assets MUST be product-relevant: demo artifacts, command
  snippets, evidence graph previews, or carefully generated static imagery.
- **FR-010**: The site MUST include a freshness note or release/version pointer
  so stale launch copy is not mistaken for current validation.
- **FR-011**: The site SHOULD use a responsive static layout that keeps primary
  navigation, install/demo links, and claim-boundary copy readable on mobile.

### Key Entities

- **Organization Site**: The FCON public entry point that introduces the company
  and routes to Portolan.
- **Project Site**: The Portolan-specific page or microsite.
- **Publishing Source**: GitHub Pages source repository, branch/path, or GitHub
  Actions workflow.
- **Domain Policy**: Default Pages URL or custom domain and verification state.
- **Site Claim**: Public copy that must map back to product claim status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can reach install, demo, product limits, and GitHub from
  the Portolan page in under one minute.
- **SC-002**: A reviewer can map every positive Portolan claim on the site to
  `docs/product-claims.md`.
- **SC-003**: Pages publishing source and domain/HTTPS state are recorded with
  evidence labels.
- **SC-004**: The site contains no analytics, forms, tracking scripts, or
  credentialed integrations unless separately approved.
- **SC-005**: The site can be previewed or checked locally with documented
  commands before publication.

## Assumptions

- GitHub Pages is the default publishing path because it is static, cheap, and
  close to the GitHub discovery surface.
- The first version should prioritize a clear FCON/Portolan narrative over a
  complex docs site.
- A custom domain is desirable later, but v1 uses the default GitHub Pages URL
  until domain verification and DNS are ready.
