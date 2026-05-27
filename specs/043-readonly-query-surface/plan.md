# Implementation Plan: Readonly Query Surface

**Branch**: `043-readonly-query-surface` | **Date**: 2026-05-27 | **Spec**: [spec.md](spec.md)

## Summary

Add a bounded read-only query command over existing map bundles so agents can ask for findings, gaps, and evidence references without loading full graph artifacts.

## Technical Context

**Language/Version**: Go 1.26.3

**Primary Dependencies**: Go stdlib; existing internal graph/map artifacts

**Storage**: Existing map bundle files only

**Testing**: Focused Go tests for query parsing/output plus baseline checks

**Target Platform**: Local CLI

**Project Type**: Go CLI

**Performance Goals**: Query reads bounded artifact sets and defaults to small output limits

**Constraints**: Read-only, no daemon, no network, no target mutation

**Scale/Scope**: Finding and gap queries first; arbitrary graph traversal is out of scope

## Constitution Check

- Local-first/read-only: pass.
- Evidence state honesty: pass.
- Complement, do not replace: pass.
- SpecKit before implementation: pass.
- Test-first for behavior: pass.

## Project Structure

```text
cmd/portolan/main.go
internal/query/
internal/app/
docs/agent/QUICKSTART.md
specs/043-readonly-query-surface/
```

## Complexity Tracking

No new dependencies or daemon behavior.

## Phase 0: Research

See [research.md](research.md).

## Phase 1: Design And Contracts

See [data-model.md](data-model.md), [contracts/query-surface.md](contracts/query-surface.md), and [quickstart.md](quickstart.md).
