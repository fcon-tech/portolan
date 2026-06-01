# Implementation Plan: E2E Agent Scan Report

**Branch**: `codex/052-agent-scan-report-ux` | **Date**: 2026-06-01 |
**Spec**: [spec.md](spec.md)

**Input**: Feature specification from
`specs/052-agent-scan-report-ux/spec.md`

## Summary

Add a single agent-facing scan-report workflow that turns existing Portolan
context, map, finding, query, and optional local producer evidence into one
human-readable first report plus a machine-readable report summary. The feature
closes the E2E user story where a non-expert user opens a repository or
repository folder in a coding agent and asks for stack, relationships,
architecture diagram, duplication, and technical-debt assessment.

This UX workflow depends on `specs/051-portolan-quality-boundary/` for product
quality, maturity, trust, and report-quality gates.

## Technical Context

**Language/Version**: Go, using the version declared in `go.mod`

**Primary Dependencies**: Standard library and existing Portolan internal
packages; no new dependency approved in this plan

**Storage**: Local files under the selected output directory

**Testing**: Focused Go tests, E2E fixture command, `go test -count=1 ./...`,
`go vet ./...`, `jq empty schema/*.json`, and `git diff --check`

**Target Platform**: Local CLI used by generic coding-agent harnesses

**Project Type**: Go CLI repository

**Performance Goals**: Produce the first report on the synthetic multi-repo
fixture in under ten minutes including build/test overhead; avoid loading full
`graph.json` before bounded summaries where possible

**Constraints**: Local-first, read-only target behavior, no network access, no
daemon behavior, no credentials, no target mutation, explicit output paths only,
preserved evidence states

**Scale/Scope**: Single local repository and local multi-repo landscape roots;
curated selections remain available but are not required for the default E2E
story

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --- | --- | --- |
| Local-first and read-only by default | Pass | The workflow writes only under the selected Portolan output directory and reuses existing local commands. |
| Evidence state honesty | Pass | `unknown`, `cannot_verify`, and `not_assessed` are required report sections, not failures to hide. |
| Complement, do not replace | Pass | Optional OSS tools are evidence producers; no stack-specific scanner is introduced by default. |
| SpecKit before implementation | Pass | This spec package defines the product slice before code changes. |
| Test-first for behavior | Pass | Tasks require failing tests before CLI/report behavior changes. |
| Quality boundary dependency | Pass | UX readiness must satisfy or explicitly mark the 051 report-quality contract. |

## Project Structure

### Documentation (this feature)

```text
specs/052-agent-scan-report-ux/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- e2e-scan-report.md
|-- checklists/
|   `-- requirements.md
|-- reviews/
|   `-- prototype-current-behavior-2026-06-01.md
`-- tasks.md
```

### Candidate implementation files

```text
cmd/portolan/
internal/app/
internal/contextprep/
internal/maprun/
internal/query/
internal/report/
docs/agent/
docs/harness/
docs/ru/
README.md
```

**Structure Decision**: Keep `cmd/portolan` thin and add report orchestration
under internal packages. Reuse existing context/map/query surfaces instead of
duplicating graph or finding logic.

If multiple harness entrypoints are added, keep one canonical scan-report
workflow source and generate or check the harness-specific adapters from it.
Static adapter parity is not runtime readiness.

## Complexity Tracking

No constitution violations. The only new user-facing surface is an additive
report workflow over existing local artifacts.
