# Implementation Plan: Agent Acceptance Matrix

**Branch**: `041-agent-acceptance-matrix` | **Date**: 2026-05-27 | **Spec**: [spec.md](spec.md)

## Summary

Create a reusable acceptance matrix and ledger so Portolan product claims can be broadened only after multiple harnesses and target shapes are assessed.

## Technical Context

**Language/Version**: Markdown/JSON documentation and optional Go-free validation

**Primary Dependencies**: Existing Portolan CLI, agent harnesses available locally; no new runtime dependency

**Storage**: Spec-local ledgers under `specs/041-agent-acceptance-matrix/reviews/` and product docs

**Testing**: Baseline checks plus at least one documented lane run or blocker

**Target Platform**: Local developer machine and agent harness surfaces

**Project Type**: Documentation/validation workflow over Go CLI

**Performance Goals**: Acceptance runs should use bounded context/map commands, not unbounded corpus scans

**Constraints**: Harness-independent, no hidden prompts, no network by default

**Scale/Scope**: Matrix planning for at least three harnesses and three target shapes

## Constitution Check

- Local-first/read-only: pass.
- Evidence state honesty: pass; unrun lanes stay `not_assessed`.
- Complement, do not replace: pass; harnesses remain external.
- SpecKit before implementation: pass.
- Test-first for behavior: pass; acceptance prompt and ledger are manually verifiable.

## Project Structure

```text
docs/agent/ACCEPTANCE.md
docs/product-claims.md
specs/041-agent-acceptance-matrix/
├── contracts/acceptance-matrix.md
├── reviews/
└── tasks.md
```

## Complexity Tracking

No constitution violations expected.

## Phase 0: Research

See [research.md](research.md).

## Phase 1: Design And Contracts

See [data-model.md](data-model.md), [contracts/acceptance-matrix.md](contracts/acceptance-matrix.md), and [quickstart.md](quickstart.md).
