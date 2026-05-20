# Implementation Plan: Selection And Inventory Input

**Branch**: `002-selection-inventory` | **Date**: 2026-05-20 | **Spec**: [spec.md](spec.md)
**Input**: Product backlog P0-002: declare repositories, metadata files,
runtime exports, and claim files without editing code.

## Summary

Add a first-class selection validation path without changing Portolan's
local-first scan boundary. The CLI gains `portolan selection validate
--selection <file>`, the selection model documents repository targets plus
metadata, runtime, and claim input files, and scan keeps accepting the P0-001
fixture.

## Technical Context

**Language/Version**: Go 1.26 module, standard library first.
**Primary Dependencies**: Go standard library; `jq` for JSON syntax checks.
**Storage**: Local JSON selection files and committed fixtures.
**Testing**: `go test -count=1 ./...`; fixture validation commands; `jq empty
schema/*.json`; `git diff --check`.
**Target Platform**: Local CLI on macOS/Linux first.
**Project Type**: Single Go CLI.
**Performance Goals**: Selection validation over fixture files completes in
under 1 second.
**Constraints**: No network, no daemon, no credentials, no target repository
mutation, and validation must not read target contents.
**Scale/Scope**: JSON selection schema and validation for repository targets
plus metadata, runtime, and claim input files.

## Constitution Check

| Rule | Status | Evidence |
| --- | --- | --- |
| Local-first and read-only | Pass | Validation rejects URLs and does not read target contents. |
| Evidence state honesty | Pass | This slice validates selection inputs only; scan evidence semantics remain unchanged. |
| Complement existing tools | Pass | No scanner or importer dependency is added. |
| SpecKit before implementation | Pass | This plan and tasks make P0-002 implementable before code changes. |
| Test-first behavior | Pass | Tasks start with CLI and selection validation tests. |

## Project Structure

```text
cmd/portolan/
└── main.go

internal/
├── app/
├── selection/
└── scan/

schema/
├── evidence-graph.schema.json
└── selection.schema.json

testdata/
└── selection-inventory/
    ├── valid-selection.json
    ├── duplicate-ids.json
    ├── network-url.json
    └── missing-path.json
```

## Design Decisions

| Decision | Rationale | Rejected alternative |
| --- | --- | --- |
| Keep JSON selection first | Matches P0-001 and avoids a parser dependency. | YAML is more ergonomic but adds dependency and migration surface. |
| Add `selection validate` command | Lets users check inventory quality before scan. | Overloading `scan --dry-run` would mix validation with graph generation. |
| Validate strings and schema shape only | Preserves read-only, no-observation behavior for inventory validation. | Checking file existence would make validation environment-dependent and duplicate scan semantics. |
| Keep current `targets[]` and `claims[]` shape accepted | Avoids breaking the implemented P0-001 fixture while P0-002 expands inventory. | Immediate migration to a single `inputs[]` array would be cleaner but would churn existing scan code. |
| Model metadata/runtime as input collections, not target kinds | `metadata` is not an evidence graph node kind, and scan must not emit schema-invalid nodes. | Adding `metadata` to `targets[].kind` would make validation easy but would break graph schema compatibility when scan reads the same selection. |
| Add schema artifact without runtime schema dependency | Documents the contract and keeps stdlib implementation. | Adding a JSON Schema validator now is premature for a small local CLI. |

## Verification Plan

- Unit tests for `portolan selection validate --selection <file>`.
- Unit tests for duplicate IDs, missing paths, URL rejection, unsupported
  target kinds, and metadata/runtime input validation.
- Regression test that P0-001 `scan --selection` fixture still works.
- `go test -count=1 ./...`.
- `jq empty schema/*.json`.
- `go run ./cmd/portolan selection validate --selection testdata/selection-inventory/valid-selection.json`.
- `git diff --check`.

## Risks

- Keeping separate `claims[]`, `metadata[]`, and `runtime[]` collections can
  leave multiple selection surfaces. Mitigation: document compatibility now and
  defer a unified `inputs[]` migration until a later schema-versioned slice.
- Validation that does not inspect files may feel weak. Mitigation: keep this
  command as schema/inventory validation; scan remains the evidence-producing
  command.
