# Implementation Plan: Map Command And Artifact Bundle

**Branch**: `009-map-command-artifacts` | **Date**: 2026-05-20 | **Spec**: [spec.md](spec.md)
**Input**: Product decision to give agents one local command that produces the
artifacts needed for evidence-backed codebase mapping.

## Summary

Add `portolan map --root <dir> --out <dir> [--force]`. The command validates
local input/output paths, orchestrates existing graph and packet behavior where
possible, writes `run.json`, `graph.json`, `findings.jsonl`, and `map.md`, and
records not-yet-implemented detector surfaces as `not_assessed` rather than
inventing findings.

## Technical Context

**Language/Version**: Go 1.26 module, standard library first.
**Primary Dependencies**: Go standard library; `jq` for JSON checks.
**Storage**: Local repository root and explicit output directory.
**Testing**: `go test ./...`; fixture map command; JSON/JSONL checks;
`git diff --check`.
**Target Platform**: Local CLI on macOS/Linux first.
**Project Type**: Single Go CLI.
**Constraints**: No network, no daemon, no credentials, no mutation, no hidden
writes outside `--out`.

## Decision Gate

| Question | Answer |
| --- | --- |
| Simpler/Faster | Add one CLI command and artifact bundle; avoid MCP/LSP until this contract works. |
| Blocking Edge Cases | Existing output directories, recursive `.portolan` artifacts, partially failed detectors, and missing repo roots must be handled deterministically. |
| Existing Open Source | Existing scanners can be imported later; this slice defines orchestration and artifact contracts using stdlib. |

## Constitution Check

| Rule | Status | Evidence |
| --- | --- | --- |
| Local-first and read-only | Pass | Map reads local root and writes explicit output only. |
| Evidence state honesty | Pass | Missing detectors are `not_assessed`; weak evidence states are preserved. |
| Complement existing tools | Pass | Map can later import OSS outputs rather than reimplement mature scanners. |
| SpecKit before implementation | Pass | This spec, plan, and tasks define the slice. |
| Test-first behavior | Pass | Tasks start with CLI and artifact tests. |

## Project Structure

```text
internal/
├── app/
├── maprun/
├── graph/
└── packet/

testdata/
└── map-command/
    └── repo/
```

## Verification Plan

- CLI tests for `map --root --out --force`.
- Tests for overwrite protection and missing root.
- Tests for all required artifacts.
- JSONL parse test for findings.
- `go test ./...`.
- `jq empty schema/*.json corpora/apache-bigtop/manifest.json`.
- `git diff --check`.

## Risks

- The first map output may be mostly inventory and `not_assessed`. Mitigation:
  make that explicit and use later detector specs to add value.
- Agents may overtrust stale `.portolan/run` artifacts. Mitigation: `run.json`
  records command, root, output, and generation metadata.
