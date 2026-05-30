# Implementation Plan: Canonical Public Install And Release

**Branch**: `codex/047-public-showcase-specs` | **Date**: 2026-05-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/047-canonical-public-install-release/spec.md`

## Summary

Make Portolan's first public install and release story internally consistent:
one canonical public identity, one primary install path, one source-checkout
fallback, release notes that stay inside `docs/product-claims.md`, and a
closeout that separates local readiness from GitHub publication and adoption.

## Technical Context

**Language/Version**: Go 1.26.3 as declared in `go.mod`; Markdown docs

**Primary Dependencies**: None required for the spec; implementation should
prefer the existing release checklist before adding release tooling

**Storage**: N/A

**Testing**: `go test ./...`; `jq empty schema/*.json`; `git diff --check`;
clean install/build smoke for the chosen public path

**Target Platform**: Public GitHub repository and local CLI install paths

**Project Type**: Go CLI with SpecKit documentation and release docs

**Performance Goals**: Public install route completes without requiring users to
debug module path history

**Constraints**: Local-first, read-only CLI behavior; no daemon, credentials, or
network behavior beyond explicit user package fetching; no package-manager
claims without verification

**Scale/Scope**: Docs, release checklist, module/release command consistency,
and focused install tests if the canonical identity changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --- | --- | --- |
| Local-first and read-only by default | Pass | Install/release docs do not change runtime product behavior. |
| Evidence state honesty | Pass | GitHub checks, release publication, and adoption stay separate. |
| Complement, do not replace | Pass | No enterprise-tool or harness replacement claim is introduced. |
| SpecKit before implementation | Pass | This spec blocks implementation on canonical identity. |
| Prefer existing OSS/tooling | Pass | Existing Go release flow is preferred; GoReleaser remains optional. |

## Project Structure

### Documentation (this feature)

```text
specs/047-canonical-public-install-release/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- checklists/
|   `-- requirements.md
|-- contracts/
|   `-- public-install-release.md
|-- reviews/
|   `-- spec-package-self-review-2026-05-30.md
`-- tasks.md
```

### Candidate implementation files

```text
README.md
docs/release.md
docs/onboarding.md
docs/product-claims.md
go.mod
internal/app/app_test.go
```

**Structure Decision**: Start with the existing release envelope and fix public
identity consistency before adding release automation. If a later maintainer
chooses GoReleaser, add that as a separate dependency-justified slice.

## Complexity Tracking

No constitution violations. The only blocker is the canonical public identity
decision.
