# Implementation Plan: Language Agnostic Evidence Producers

**Branch**: `codex/053-language-agnostic-producers` | **Date**:
2026-06-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from
`docs/specs/053-language-agnostic-producers/spec.md`

## Summary

Add a language-agnostic producer-family recommendation and evaluation layer so
Portolan can route mixed enterprise landscapes toward local evidence families
without implying JVM, PHP, Scala, TypeScript, or other per-language scanner
ownership. The first implementation should produce machine-readable evaluation
records, bounded context-pack recommendation records, and answer-contract
guardrails; it should not add new scanner dependencies or producer execution.

## Technical Context

**Language/Version**: Go 1.26.3, JSON/Markdown artifacts

**Primary Dependencies**: Existing stdlib JSON/Markdown handling, context
preparation, map summary/gap surfaces, adapter-contract validation patterns

**Storage**: Local context packs, map bundles, spec-local review records,
optional committed fixtures under `internal/testfixtures/`

**Testing**: Focused Go tests for context preparation, producer evaluation
fixtures, recommendation/gap records, answer-contract text, and schema/JSON
validation

**Target Platform**: Local CLI

**Project Type**: Go CLI with JSON evidence graph and agent-facing context
artifacts

**Performance Goals**: Recommendations remain bounded and readable from
`evidence-index.jsonl` or a dedicated small artifact without requiring agents to
load full `graph.json`

**Constraints**: Local-first, read-only, no network calls, no daemons, no
credentials, no target mutation, no source export, no per-language scanner
ownership, evidence states preserved

**Scale/Scope**: Mixed local landscapes with many repositories and multiple
languages; this slice covers recommendation/evaluation contracts, not complete
producer implementation for every family

## Constitution Check

| Principle | Status | Notes |
| --- | --- | --- |
| Local-first and read-only | Pass | The slice creates local recommendations/evaluations and consumes local records only. |
| Evidence state honesty | Pass | Missing producer outputs remain weak; recommendations are not evidence. |
| Complement, do not replace | Pass | Candidate producers are evaluated before adoption; no scanner is reimplemented. |
| SpecKit before implementation | Pass | Spec, plan, contracts, and tasks are prepared before code changes. |
| Test-first for behavior | Pass | Tasks require focused tests before implementation edits. |

## Project Structure

```text
docs/specs/053-language-agnostic-producers/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- producer-family-evaluation.md
|-- checklists/
|   `-- requirements.md
|-- reviews/
`-- tasks.md

internal/contextprep/
internal/app/
internal/testfixtures/
schema/
docs/
```

**Structure Decision**: Extend existing context-preparation and
machine-readable artifact patterns. Keep `cmd/portolan` thin and avoid new
runtime surfaces unless review shows an existing command cannot carry the
recommendation/evaluation artifacts.

## Complexity Tracking

No constitution violations are approved. If implementation requires a new
dependency, producer execution wrapper, network access, daemon behavior, or
credential handling, stop and record a design review before continuing.

## Phase 0: Research

See [research.md](research.md).

## Phase 1: Design And Contracts

See [data-model.md](data-model.md),
[contracts/producer-family-evaluation.md](contracts/producer-family-evaluation.md),
and [quickstart.md](quickstart.md).
