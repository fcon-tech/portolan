# Implementation Plan: Dependency And Symbol Evidence Import

**Branch**: `codex/052-dependency-symbol-evidence-import` | **Date**: 2026-06-01 | **Spec**: [spec.md](spec.md)

## Summary

Move Portolan relationship evidence beyond Go-only native detection by
normalizing standard local dependency and symbol producer outputs into map
artifacts, bounded summaries, and agent gap surfaces. Keep the implementation
format-oriented: PHP, JVM-heavy Bigtop, and mixed-language landscapes are
acceptance shapes, not separate Portolan-owned language scanners.
Clean baseline comparison also requires `context prepare` to surface bounded
source-visible build/deploy relationship candidates, such as build manifests,
distribution manifests, RPM specs, and deployment manifests, without parsing or
claiming runtime topology.

## Technical Context

**Language/Version**: Go 1.26.3, JSON/Markdown fixtures

**Primary Dependencies**: Existing stdlib JSON handling, selection
`tool_outputs`, map bundle artifacts, context preparation, importer profiles

**Storage**: Local map/context bundles, selection fixtures, spec-local review
and stress-test ledgers

**Testing**: Focused Go tests for selection schema, map normalization,
context/tool registry summaries, build/deploy relationship-candidate records,
query/gap visibility, and fixture commands

**Target Platform**: Local CLI

**Project Type**: Go CLI with JSON evidence graph and agent artifacts

**Performance Goals**: New summaries remain bounded; map/context flows must not
load full graph output into first-pass agent context

**Constraints**: Local-first, read-only, no network calls, no daemons, no
credentials, no target repository mutation, no per-language scanner ownership

**Scale/Scope**: Import and summarize standard local outputs. Producer
execution, full semantic language analysis, complete call graphs, complete
runtime topology, and UX/report polish are out of scope.

## Constitution Check

| Principle | Status | Notes |
| --- | --- | --- |
| Local-first and read-only | Pass | The feature consumes local files and writes selected Portolan artifacts only. |
| Evidence state honesty | Pass | Missing, malformed, partial, and off-scope producer outputs remain weak states. |
| Complement, do not replace | Pass | Import producer outputs instead of implementing language scanners. |
| SpecKit before implementation | Pass | This plan and tasks precede behavior changes. |
| Test-first for behavior | Pass | Map/context fixture tests come before implementation edits. |

## Project Structure

```text
docs/specs/052-dependency-symbol-evidence-import/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- relationship-evidence-import.md
|-- checklists/
|   `-- requirements.md
|-- reviews/
`-- tasks.md

docs/adapter-contracts/
internal/selection/
internal/maprun/
internal/contextprep/
internal/importer/
internal/query/
internal/testfixtures/
schema/
```

## Complexity Tracking

No dependency additions are approved. If implementation discovers that a new
parser, indexer, or scanner dependency is required, stop and record a design
review before adding it.

Existing standalone importer profiles and selected landscape-map
`tool_outputs` normalization intentionally coexist in this slice. The
standalone importers remain file-to-graph normalization commands for explicit
imports; the selected `tool_outputs` path makes local producer evidence visible
inside one map bundle. Unifying those code paths is a future refactor, not a
precondition for this feature.

Adding `symbol-index` to `selection.tool_outputs[].kind` is an additive schema
enum extension. Existing selections remain valid and no selection schema
version bump is required.

Direct selected-output normalization must remain bounded. Oversized artifacts
that cannot be safely read into the current map normalizer are degraded to
`cannot_verify`; larger streaming import or producer-specific summarization is
future work unless already available through an existing standalone importer.

## Phase 0: Research

See [research.md](research.md).

## Phase 1: Design And Contracts

See [data-model.md](data-model.md), [contracts/relationship-evidence-import.md](contracts/relationship-evidence-import.md), and [quickstart.md](quickstart.md).
