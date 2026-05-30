# Implementation Plan: GitHub Community Discovery

**Branch**: `codex/048-github-community-discovery` | **Date**: 2026-05-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/048-github-community-discovery/spec.md`

## Summary

Add the public GitHub community layer around Portolan: repository description
and topics, README routing, contribution guidance, security policy, conduct
guidance, issue/PR templates, and explicit OSS-health signal states. Keep actual
GitHub settings changes separate from repo-local docs until maintainers approve
them.

## Technical Context

**Language/Version**: Markdown and GitHub repository metadata

**Primary Dependencies**: None

**Storage**: GitHub community files under repository root and `.github/`

**Testing**: `git diff --check`; link/text inspection; optional GitHub metadata
inspection after authorization

**Target Platform**: Public GitHub repository

**Project Type**: Go CLI repository with OSS community files

**Performance Goals**: Visitor understands purpose, install route, and
contribution route in under one minute

**Constraints**: No broad support promises; no security certification claim; no
GitHub settings mutation without approval; no badges without verification

**Scale/Scope**: Community files, README route, GitHub metadata proposal, and
verification/disposition record

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --- | --- | --- |
| Local-first and read-only by default | Pass | Community docs do not change CLI behavior. |
| Evidence state honesty | Pass | Templates require evidence labels and keep missing checks visible. |
| Complement, do not replace | Pass | Topics avoid unsupported service-catalog/security-scanner claims. |
| SpecKit before implementation | Pass | This spec defines community scope before editing public files. |
| Prefer established OSS patterns | Pass | GitHub community files and lightweight templates are sufficient. |

## Project Structure

### Documentation (this feature)

```text
specs/048-github-community-discovery/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- checklists/
|   `-- requirements.md
|-- contracts/
|   `-- github-community-profile.md
|-- reviews/
|   `-- spec-package-self-review-2026-05-30.md
`-- tasks.md
```

### Candidate implementation files

```text
README.md
CONTRIBUTING.md
SECURITY.md
CODE_OF_CONDUCT.md
SUPPORT.md
.github/
|-- ISSUE_TEMPLATE/
|   |-- bug_report.yml
|   |-- feature_request.yml
|   `-- evidence_gap.yml
`-- pull_request_template.md
docs/
|-- onboarding.md
`-- product-claims.md
```

**Structure Decision**: Store community conventions in normal GitHub community
files. Store mutable GitHub metadata as a checked-in proposal/closeout before
applying settings externally.

## Complexity Tracking

No constitution violations. Security contact and conduct-policy choices remain
blocking maintainer decisions.
