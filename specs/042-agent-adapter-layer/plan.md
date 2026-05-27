# Implementation Plan: Agent Adapter Layer

**Branch**: `042-agent-adapter-layer` | **Date**: 2026-05-27 | **Spec**: [spec.md](spec.md)

## Summary

Add first-wave adapter evaluation and a Graphify-style validation path so Portolan composes OSS context producers instead of rebuilding them.

## Technical Context

**Language/Version**: Go 1.26.3, Markdown/JSON fixtures

**Primary Dependencies**: Existing adapter validation code; no new dependency unless justified by research

**Storage**: Adapter fixtures, docs, spec-local evaluation ledgers

**Testing**: Adapter validation tests, baseline checks, fixture JSON checks

**Target Platform**: Local CLI

**Project Type**: Go CLI with JSON adapter contracts

**Performance Goals**: Fixtures remain small and bounded; no full Graphify run in baseline tests

**Constraints**: Import files before invoking external tools; preserve evidence states

**Scale/Scope**: First-wave profile and fixture support, not full code graph replacement

## Constitution Check

- Local-first/read-only: pass.
- Evidence state honesty: pass with explicit confidence mapping.
- Complement, do not replace: pass; this is adapter-first.
- SpecKit before implementation: pass.
- Test-first for behavior: pass; fixture validation comes before behavior changes.

## Project Structure

```text
docs/oss-composition.md
docs/adapter-contracts/
testdata/oss-adapter-contract/
internal/adapter/
specs/042-agent-adapter-layer/
```

## Complexity Tracking

No approved dependency addition at planning time.

## Phase 0: Research

See [research.md](research.md).

## Phase 1: Design And Contracts

See [data-model.md](data-model.md), [contracts/adapter-layer.md](contracts/adapter-layer.md), and [quickstart.md](quickstart.md).
