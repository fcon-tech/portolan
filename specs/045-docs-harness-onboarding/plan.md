# Implementation Plan: Docs And Harness Onboarding

**Branch**: `codex/045-docs-harness-onboarding` | **Date**: 2026-05-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/045-docs-harness-onboarding/spec.md`

## Summary

Add a small documentation onboarding route that helps humans and agents choose the right Portolan docs for overview, install/build, Cursor, and OpenCode workflows. Keep the change docs-only, preserve current product-claim boundaries, and surface the OpenCode default-permission output nuance without requiring readers to inspect review ledgers.

## Technical Context

**Language/Version**: Markdown documentation in a Go CLI repository

**Primary Dependencies**: None

**Storage**: N/A

**Testing**: `git diff --check`; targeted link/text inspection; baseline checks if no environment blocker appears

**Target Platform**: Local CLI documentation consumed by humans and agent harnesses

**Project Type**: CLI documentation and SpecKit artifacts

**Performance Goals**: A reviewer can route to the correct first document in under two minutes

**Constraints**: No network behavior, no daemon behavior, no target mutation, no new dependencies, no product-claim broadening

**Scale/Scope**: One docs-only SpecKit slice covering top-level docs, agent install/run docs, Cursor/OpenCode guidance, and backlog status

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --- | --- | --- |
| Local-first and read-only by default | Pass | Docs preserve local execution and explicit output directories. |
| Evidence state honesty | Pass | Harness support is described as verified, failed, or not_assessed. |
| Complement, do not replace | Pass | No new scanner or harness integration is added. |
| SpecKit before implementation | Pass | This plan follows `spec.md`; tasks and review artifacts are included before docs edits are considered complete. |
| Test-first for behavior | Pass | No behavior change. Verification is doc/link/whitespace focused. |

## Project Structure

### Documentation (this feature)

```text
specs/045-docs-harness-onboarding/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- checklists/
|   `-- requirements.md
|-- contracts/
|   `-- docs-onboarding.md
|-- reviews/
|   |-- current-docs-assessment-2026-05-29.md
|   |-- analyze-disposition-2026-05-29.md
|   |-- implementation-disposition-2026-05-29.md
|   |-- code-quality-review-2026-05-30.md
|   `-- requirements-product-vision-drift-2026-05-30.md
`-- tasks.md
```

### Source Code (repository root)

```text
README.md
AGENTS.md
docs/
|-- onboarding.md
|-- product-backlog.md
|-- ru/
|   `-- README.md
`-- agent/
    |-- QUICKSTART.md
    |-- INSTALL.md
    `-- INSTALL-PROMPT.md
```

**Structure Decision**: Implement as documentation only. Add one maintained route page at `docs/onboarding.md` and link it from existing entrypoints instead of splitting the first improvement across multiple harness-specific pages.

## Complexity Tracking

No constitution violations.
