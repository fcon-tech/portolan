# Implementation Plan: Local Evidence Graph MVP

**Branch**: `001-local-evidence-graph` | **Date**: 2026-05-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `docs/specs/001-local-evidence-graph/spec.md`

## Summary

Add the first runnable Portolan scan path. The CLI accepts a local selection
file, reads selected repository and claim inputs without network or mutation,
and emits a schema-shaped evidence graph.

## Technical Context

**Language/Version**: Go 1.26 module, standard library first.
**Primary Dependencies**: Go standard library; `jq` for JSON syntax checks.
**Storage**: Local input files and an explicit output JSON file.
**Testing**: `go test -count=1 ./...`; fixture tests for scan output; `jq empty schema/*.json`; `git diff --check`.
**Target Platform**: Local CLI on macOS/Linux first.
**Project Type**: Single Go CLI.
**Performance Goals**: Small fixture scan completes in under 2 seconds.
**Constraints**: No network, no daemon, no repository mutation, no credentials.
**Scale/Scope**: One selection file, local repository targets, local claim files.

## Constitution Check

| Rule | Status | Evidence |
| --- | --- | --- |
| Local-first and read-only | Pass | Plan forbids network, daemon behavior, credentials, and target mutation. |
| Evidence state honesty | Pass | Spec requires evidence on every node and edge. |
| Complement existing tools | Pass | This slice only creates the graph substrate; importers come later. |
| SpecKit before implementation | Pass | This spec, plan, and tasks define the implementation slice. |
| Test-first behavior | Pass | Tasks start with CLI and graph fixture tests. |

## Project Structure

```text
cmd/portolan/
└── main.go

internal/
├── app/
├── selection/
├── graph/
└── scan/

schema/
└── evidence-graph.schema.json

internal/testfixtures/
└── local-evidence-graph/
    ├── selection.json
    ├── repo/
    └── claims.json
```

## Design Decisions

| Decision | Rationale | Rejected alternative |
| --- | --- | --- |
| JSON selection first | Simple, inspectable, no new parser dependency. | YAML would be nicer for humans but adds dependency and ambiguity now. |
| Standard library first | Keeps bootstrap small and auditable. | JSON Schema runtime validation dependency can wait until fixture needs prove it. |
| Explicit `--out` | Avoid surprising writes and make tests deterministic. | Default hidden output directory would obscure behavior. |
| Claim files are lower authority | Preserves product trust boundary. | Collapsing claims into facts would make black-box output misleading. |

## Verification Plan

- Unit tests for CLI parsing and selection validation.
- Fixture test that scans `internal/testfixtures/local-evidence-graph/selection.json`.
- `go test -count=1 ./...`.
- `jq empty schema/*.json`.
- `git diff --check`.

## Risks

- A too-small graph model may need migration after importer work. Mitigation:
  keep schema version explicit and fixtures narrow.
- JSON selection may be less ergonomic than YAML. Mitigation: add YAML only after
  users validate the selection shape.
