# Implementation Plan: Relationship Detection

**Branch**: `010-relationship-detection` | **Date**: 2026-05-21 | **Spec**: [spec.md](spec.md)
**Input**: Product backlog P2-010 and Bigtop smoke `GAP-007-003`.

## Summary

Add first-pass relationship detection to `portolan map --root --out` by reading
local Go source imports and conservative `go.mod` dependencies. Emit explicit
`imports` and `depends-on` graph edges with honest evidence states, replace the
relationship placeholder finding when observed relationships exist, preserve
existing claim/metadata/unknown relationship behavior in `scan`, and keep
unsupported relationship families out of scope.

## Technical Context

**Language/Version**: Go 1.26 module, standard library first.
**Primary Dependencies**: Go standard library plus `golang.org/x/mod/modfile`
for local `go.mod` parsing.
**Input Formats**: Local `*.go` source files and `go.mod` module/require
entries parsed from local bytes.
**Storage**: Local repository root and explicit map output directory.
**Testing**: `go test -count=1 ./...`; fixture `portolan map`; JSON/JSONL
checks; `jq empty schema/*.json`; `git diff --check`.
**Target Platform**: Local CLI on macOS/Linux first.
**Project Type**: Single Go CLI.
**Performance Goals**: Fixture relationship map completes in under 1 second.
**Constraints**: No network, no daemon, no credentials, no target mutation, no
name-only inference, no schema-breaking edge kinds.
**Scale/Scope**: One mapped root with Go source files and one `go.mod`.

## Decision Gate

| Question | Answer |
| --- | --- |
| Simpler/Faster | Add deterministic local relationship detection to existing `map` output; do not add new commands or schema versions. |
| Blocking Edge Cases | Must preserve evidence states, avoid name-only inference, tolerate unreadable or unparsable files as `cannot_verify`, and keep unsupported languages as `not_assessed`. |
| Existing Open Source | Use `golang.org/x/mod/modfile` for Go manifests; defer tree-sitter, Semgrep, Sourcegraph/LSIF, and language-server indexes until broader language coverage is proven. |

## Constitution Check

| Rule | Status | Evidence |
| --- | --- | --- |
| Local-first and read-only | Pass | Detector reads local files under `--root` and writes only selected `--out`. |
| Evidence state honesty | Pass | Source imports are `source-visible`; manifest dependencies are `metadata-visible`; parse failures are `cannot_verify`; unsupported families remain `not_assessed`. |
| Complement existing tools | Pass | v1 avoids replacing code intelligence tools; richer scanners can be imported later. |
| SpecKit before implementation | Pass | This spec, plan, research, data model, quickstart, and tasks define the slice. |
| Test-first behavior | Pass | Tasks start with fixtures and failing map artifact tests. |

## Project Structure

```text
internal/
├── app/
├── graph/
├── maprun/
└── relationships/

testdata/
└── relationship-detection/
    └── repo/
        ├── go.mod
        ├── cmd/example/main.go
        └── internal/worker/worker.go
```

## Design Decisions

| Decision | Rationale | Rejected Alternative | Reversibility | Risk If Wrong | Confidence |
| --- | --- | --- | --- | --- | --- |
| Integrate into `portolan map` first | Map is the agent artifact bundle and already exposes relationship findings. | Add a separate `relationships` command. | Medium; a command wrapper can be added later. | Map could grow too broad if detectors are not modular. | High |
| Use a new `internal/relationships` package | Keeps `cmd/portolan` thin and prevents `internal/maprun` from owning parser logic. | Put parser logic directly in `maprun`. | High. | Extra package may be unnecessary for tiny v1. | Medium |
| Use stdlib parsing for Go imports | Explicit relationships can be read without new dependencies. | Add tree-sitter or language server tooling. | High. | Parser scope is Go-only at first. | High |
| Parse `go.mod` with `golang.org/x/mod/modfile` | Reuses the maintained Go manifest parser and avoids fragile custom text scanning. | Hand-parse `require` lines. | High. | Adds one dependency, but only for local byte parsing. | High |
| Emit parse failures as findings | Preserves partial maps without hiding relationship gaps. | Fail the whole map run. | High. | Users may miss parse failures if packet wording is weak. | Medium |

## Verification Plan

- Focused map tests for relationship graph edges and findings.
- Regression tests proving existing `scan` claim-only, metadata-visible, and
  unknown relationship evidence remains intact.
- Invariant test proving every relationship edge has non-empty
  `evidence.state` and `evidence.source`.
- Fixture command:
  `go run ./cmd/portolan map --root testdata/relationship-detection/repo --out /tmp/portolan-relationships-run --force`.
- `jq empty /tmp/portolan-relationships-run/run.json /tmp/portolan-relationships-run/graph.json`.
- JSONL parse check over `/tmp/portolan-relationships-run/findings.jsonl`.
- `jq` check that relationship edges contain `from`, `to`, `kind`,
  `evidence.state`, and `evidence.source`.
- `jq empty schema/*.json corpora/apache-bigtop/manifest.json`.
- `go test -count=1 ./...`.
- `git diff --check`.

## Risks

- Go-only v1 may not satisfy all Bigtop relationship gaps. Mitigation: document
  supported relationship families and leave other languages not assessed.
- The new `golang.org/x/mod` dependency may be unnecessary if relationship
  scope stays tiny. Mitigation: keep it isolated in `internal/relationships`
  and document the OSS fit; remove it if it does not materially improve DX and
  correctness.
- Relationship findings may be overread as complete topology. Mitigation:
  preserve not-assessed language for unsupported relationship families.
