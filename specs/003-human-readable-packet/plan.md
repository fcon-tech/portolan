# Implementation Plan: Human-Readable Evidence Packet

**Branch**: `003-human-readable-packet` | **Date**: 2026-05-20 | **Spec**: [spec.md](spec.md)
**Input**: Product backlog P0-003: generate a readable packet from the same
evidence graph without creating a second truth source.

## Summary

Add a Markdown packet renderer over an existing Portolan evidence graph. The CLI
reads a graph JSON file, computes node/edge/evidence-state summaries from the
graph, cites graph ids for non-aggregate statements, and writes an explicit
Markdown output file.

## Technical Context

**Language/Version**: Go 1.26 module, standard library first.
**Primary Dependencies**: Go standard library; `jq` for JSON syntax checks.
**Storage**: Local graph JSON input and explicit Markdown output.
**Testing**: `go test -count=1 ./...`; fixture packet command; `jq empty
schema/*.json`; `git diff --check`.
**Target Platform**: Local CLI on macOS/Linux first.
**Project Type**: Single Go CLI.
**Performance Goals**: Fixture graph packet renders in under 1 second.
**Constraints**: No network, no daemon, no credentials, no target repository
mutation, no graph fact invention.
**Scale/Scope**: Markdown packet from one existing graph file.

## Constitution Check

| Rule | Status | Evidence |
| --- | --- | --- |
| Local-first and read-only | Pass | Renderer reads graph input and writes only explicit packet output. |
| Evidence state honesty | Pass | Packet groups states separately and does not upgrade claim/unknown facts. |
| Complement existing tools | Pass | Markdown renderer uses existing graph substrate; no reporting engine dependency. |
| SpecKit before implementation | Pass | This plan and tasks make P0-003 implementable before code changes. |
| Test-first behavior | Pass | Tasks start with CLI and packet fixture tests. |

## Project Structure

```text
cmd/portolan/
└── main.go

internal/
├── app/
├── graph/
└── packet/

testdata/
└── human-readable-packet/
    ├── graph.json
    ├── claim-only-graph.json
    └── malformed-graph.json
```

## Design Decisions

| Decision | Rationale | Rejected alternative |
| --- | --- | --- |
| Markdown first | Simple, inspectable, diff-friendly, no dependency. | HTML/PDF would add rendering complexity before the packet contract is proven. |
| Render from graph only | Preserves one source of truth and avoids hidden rescans. | Re-reading selection or repositories would create a second truth surface. |
| Explicit `--graph` and `--out` | Clear local IO and deterministic tests. | Default output beside graph could surprise users and complicate safety. |
| Cite ids in fact lists | Makes non-aggregate statements auditable. | Narrative-only packet would be nicer to read but weaker for trust review. |

## Verification Plan

- Unit tests for packet rendering counts and state grouping.
- CLI tests for `packet render --graph <file> --out <file>`.
- Fixture test for claim-only graph not described as observed truth.
- Malformed graph test fails without writing output.
- `go test -count=1 ./...`.
- `jq empty schema/*.json`.
- `go run ./cmd/portolan packet render --graph testdata/human-readable-packet/graph.json --out /tmp/portolan-packet.md --force`.
- `git diff --check`.

## Risks

- A too-simple packet may read like a report. Mitigation: keep it as a graph
  packet with counts, ids, and evidence states, not recommendations.
- Output path policy could diverge from scan. Mitigation: use the same explicit
  output and `--force` behavior shape where practical.
