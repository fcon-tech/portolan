# Feature Specification: GitHub Community Discovery

**Feature Branch**: `codex/048-github-community-discovery`

**Created**: 2026-05-30

**Status**: Ready-for-review PR #24; GitHub metadata, private vulnerability
reporting, local verification, three non-GPT review lanes, and GitHub checks
verified; not ready-to-merge until merge approval, review approval, and
post-merge community profile recheck

**Input**: User description: "Specs for a public showcase/popularization path."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand The Repository From GitHub (Priority: P1)

A GitHub visitor can understand in under one minute what Portolan is, who it is
for, how it is bounded, and where to start.

**Why this priority**: Public discovery starts on GitHub before a user reads
deep docs. Empty description, missing topics, or unclear community files reduce
trust even when the codebase is strong.

**Independent Test**: A reviewer opens the public GitHub repository page and
finds description, topics, README route, license, and first install/demo links
without reading SpecKit internals.

**Acceptance Scenarios**:

1. **Given** a visitor lands on GitHub, **When** they scan the repository
   header and README first screen, **Then** they can identify Portolan as a
   local-first evidence-preparation CLI for agents.
2. **Given** a visitor searches GitHub by topic, **When** Portolan appears,
   **Then** topics reflect real capabilities and do not imply unsupported
   service-catalog, security-scanner, or observability scope. The approved topic
   set is recorded in
   `specs/048-github-community-discovery/reviews/github-metadata-proposal-2026-05-30.md`.

---

### User Story 2 - Evaluate Whether Contribution Is Welcome (Priority: P2)

A potential contributor can find how to report issues, propose improvements,
and contribute without relying on private context.

**Why this priority**: Public popularity is helped by low-friction contribution
paths, but Portolan must not imply broad support commitments the maintainers do
not intend to honor.

**Independent Test**: A reviewer can open `CONTRIBUTING.md`, issue templates,
PR template, and support guidance, then identify acceptable contribution types
and required evidence labels.

**Acceptance Scenarios**:

1. **Given** a contributor wants to report a bug, **When** they open the issue
   template, **Then** it asks for local command evidence and preserves
   `not_assessed`, `unknown`, and `cannot_verify`.
2. **Given** a contributor opens a PR, **When** they fill the PR template,
   **Then** it asks for baseline checks, product-claim impact, and evidence
   state changes.

---

### User Story 3 - Expose Security And Conduct Boundaries (Priority: P3)

A public user can understand how to report security issues and what behavior is
expected without Portolan claiming broad security certification.

**Why this priority**: Security and conduct files are expected OSS hygiene, but
they must match actual maintainer capacity and product boundaries.

**Independent Test**: A reviewer can find `SECURITY.md` and
`CODE_OF_CONDUCT.md` or an approved alternative, and confirm security wording
does not exceed `docs/product-claims.md`.

**Acceptance Scenarios**:

1. **Given** a user finds a suspected vulnerability, **When** they read the
   security policy, **Then** it names a reporting channel, supported versions,
   and response expectations.
2. **Given** a user reads security wording, **When** they compare it with
   product claims, **Then** it does not imply audit, certification, sandbox, or
   broad hardening beyond verified local CLI boundaries.

### Edge Cases

- The repository has a public GitHub page but the GitHub Pages homepage from
  `specs/050-fcon-portolan-pages-site/` is not published yet.
- Maintainers do not want a public email address in `SECURITY.md`.
- GitHub topics include unsupported categories such as `observability`,
  `service-catalog`, or `security-scanner`.
- Contributor docs accidentally invite large architecture rewrites without
  SpecKit.
- Scorecard or OpenSSF badges are added before they are configured and checked.
- A Code of Conduct is copied without maintainer acceptance.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST have a concise public description that names
  Portolan as a local-first evidence-preparation CLI/toolbox for AI agents.
- **FR-002**: The repository MUST define an approved topic set that matches
  actual capabilities and avoids unsupported product categories.
- **FR-003**: The README first screen MUST route to install, demo, product
  claims, contribution, and security guidance.
- **FR-004**: `CONTRIBUTING.md` MUST explain SpecKit workflow, baseline checks,
  evidence-state discipline, and accepted contribution types.
- **FR-005**: Issue templates MUST request reproduction evidence and allow
  `not_assessed`, `unknown`, `cannot_verify`, `blocked`, and `failed`.
- **FR-006**: The PR template MUST ask for scope, verification, product-claim
  impact, evidence-state impact, and GitHub check state.
- **FR-007**: `SECURITY.md` MUST name supported versions, reporting channel,
  response expectations, and current security-claim limits.
- **FR-007a**: The recommended primary vulnerability channel is GitHub private
  vulnerability reporting on `fcon-tech/portolan`. If the GitHub setting cannot
  be enabled before publication, `SECURITY.md` MUST record that as blocked and
  avoid inventing an unverified fallback alias.
- **FR-008**: Conduct guidance MUST be present through `CODE_OF_CONDUCT.md` or
  an explicitly documented maintainer-approved alternative.
- **FR-009**: GitHub settings changes such as description, homepage, topics,
  default issue templates, and badges MUST be documented and applied only after
  explicit maintainer approval.
- **FR-010**: OpenSSF Scorecard or Best Practices badge claims MUST be absent
  until configured and verified.

### Key Entities

- **GitHub Metadata**: Description, homepage, topics, repository social preview,
  and badges.
- **Community File**: `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`,
  issue templates, PR template, support guidance.
- **Contribution Path**: The public route from idea/bug/report to SpecKit task,
  review, verification, and PR.
- **OSS Health Signal**: A public indicator such as community profile,
  Scorecard, Best Practices, or CI badge with explicit verification state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A GitHub visitor can identify what Portolan does, install route,
  and demo route in under one minute from the repository page and README.
- **SC-002**: A contributor can find bug-report and PR instructions without
  reading `AGENTS.md`.
- **SC-003**: The issue and PR templates include evidence-state fields.
- **SC-004**: Security policy exists and does not claim broad security
  certification.
- **SC-005**: GitHub description, topic, homepage, badge, and Scorecard states
  are recorded as `verified`, `not_assessed`, or `blocked`.

## Assumptions

- Public GitHub metadata may require manual maintainer action or GitHub CLI
  authorization; this spec does not assume those changes are already applied.
- GitHub private vulnerability reporting is the approved primary
  security-contact path because it avoids publishing a personal email and keeps
  sensitive details off public issues, but repository admin access is needed to
  enable and verify it.
- No fallback email alias should be documented until `fcon-tech` confirms the
  alias exists and is monitored.
- The first topic set should be conservative and capability-based, not SEO-only.
- Community files should be lightweight enough for a small consulting-company
  maintained OSS project.
