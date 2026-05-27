# Implementation Plan: Release Envelope

**Branch**: `040-release-envelope` | **Date**: 2026-05-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/040-release-envelope/spec.md`

## Summary

Add the missing product release envelope: GitHub Actions baseline checks, clean-checkout install smoke documentation, and a release checklist that binds publication to the current product claim boundary.

## Technical Context

**Language/Version**: Go 1.26.3 as declared in `go.mod`

**Primary Dependencies**: Go toolchain, `jq`, GitHub Actions hosted runner; no new Go dependencies

**Storage**: Repository files and release artifacts only

**Testing**: `go test -count=1 ./...`, `jq empty schema/*.json`, `git diff --check`, CLI smoke commands

**Target Platform**: Local CLI source checkout and GitHub Actions Linux runner

**Project Type**: Go CLI

**Performance Goals**: CI should complete with existing unit-test scale; no large corpus run in default CI

**Constraints**: Local-first, no secrets, no target mutation, no hidden network behavior in Portolan runtime

**Scale/Scope**: Release and install proof for the Portolan repo; package-manager distribution is deferred

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Local-first/read-only: pass. CI runs repo checks only and does not inspect external targets.
- Evidence state honesty: pass. Release docs must preserve `not_assessed` claims.
- Complement, do not replace: pass. No scanner replacement is added.
- SpecKit before implementation: pass. This directory contains spec, plan, tasks, and contracts.
- Test-first for behavior: pass. Workflow and bootstrap smoke require local verification.

## Project Structure

### Documentation (this feature)

```text
specs/040-release-envelope/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── release-envelope.md
└── tasks.md
```

### Source Code (repository root)

```text
.github/workflows/ci.yml
docs/release.md
docs/agent/INSTALL.md
scripts/bootstrap-portolan
```

**Structure Decision**: Add workflow and release docs at conventional repository paths. Keep bootstrap changes scoped to the existing script if needed.

## Complexity Tracking

No constitution violations expected.

## Phase 0: Research

See [research.md](research.md).

## Phase 1: Design And Contracts

See [data-model.md](data-model.md), [contracts/release-envelope.md](contracts/release-envelope.md), and [quickstart.md](quickstart.md).

## Post-Design Constitution Check

- No network, daemon, or credential behavior is added to Portolan runtime.
- GitHub Actions dependency is CI-only and documented.
- Product limits remain sourced from `docs/product-claims.md`.
