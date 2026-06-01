# Implementation Plan: Portolan Quality Boundary

**Branch**: `codex/051-portolan-quality-boundary` | **Date**: 2026-06-01 |
**Spec**: [spec.md](spec.md)

**Input**: Feature specification from
`specs/051-portolan-quality-boundary/spec.md`

## Summary

Create the product-quality foundation that later user-experience work must
respect: a Portolan quality boundary, maturity matrix, canonical claim wording,
and report-quality contract for evidence-backed reports.

## Technical Context

**Language/Version**: Markdown and Go if/when validation tooling is added

**Primary Dependencies**: None approved for the planning slice

**Storage**: Repository docs, contracts, fixtures, and optional schema files

**Testing**: `jq empty schema/*.json`, `git diff --check`, focused contract
fixture checks when implemented, and baseline Go checks for code changes

**Target Platform**: Local repository and agent-facing docs

**Project Type**: Go CLI repository with SpecKit governance

**Performance Goals**: A reviewer can classify a product/report claim in under
two minutes from the quality boundary

**Constraints**: Preserve local-first/read-only defaults and evidence-state
honesty; do not broaden product claims

**Scale/Scope**: Current Portolan user-facing surfaces plus the pending
scan-report UX workflow

## Constitution Check

| Principle | Status | Notes |
| --- | --- | --- |
| Local-first and read-only by default | Pass | This slice is docs/contracts first and adds no runtime side effects. |
| Evidence state honesty | Pass | Weak evidence states become required quality signals. |
| Complement, do not replace | Pass | Optional OSS/tool producers remain evidence inputs, not core guarantees. |
| SpecKit before implementation | Pass | Spec, plan, tasks, research, and contracts are defined first. |
| Test-first for behavior | Pass | Any validation command must get failing fixture tests before implementation. |

## Project Structure

```text
specs/051-portolan-quality-boundary/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- quality-boundary.md
|-- checklists/
|   `-- requirements.md
|-- reviews/
|   `-- sdp-lab-quality-distillation-2026-06-01.md
`-- tasks.md
```

Candidate implementation files:

```text
docs/product-claims.md
docs/product-boundary.md
docs/product-maturity.md
docs/report-quality.md
schema/
internal/report/
internal/app/
README.md
docs/agent/
```

## Complexity Tracking

No constitution violations. If implementation adds a new validation command,
that must be justified in the task slice and kept additive.
