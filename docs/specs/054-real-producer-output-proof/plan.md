# Implementation Plan: Real Producer Output Proof

**Branch**: `codex/054-bigtop-architecture-proof` | **Date**: 2026-06-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `docs/specs/054-real-producer-output-proof/spec.md`

## Summary

Acquire or explicitly disposition real local producer outputs beyond
Syft/CycloneDX for Apache Bigtop, then surface those outputs through Portolan
without adding language-specific scanners or producer execution wrappers. The
first implementation slice should record externally generated producer-run
metadata and make bounded API/model outputs visible to agents while preserving
symbol/reference and runtime topology as `not_assessed` until real evidence
exists.

## Technical Context

**Language/Version**: Go 1.26.x

**Primary Dependencies**: Go standard library plus existing Portolan internal
packages; no new runtime dependency approved in this plan.

**Storage**: Local JSON/JSONL/YAML artifacts under selected output directories.
No database.

**Testing**: `go test -count=1 ./...`, focused app/map/context tests, `go vet
./...`, `jq empty schema/*.json`, `git diff --check`, and fixture-based CLI
smoke commands.

**Target Platform**: Local CLI on Linux/macOS workstations.

**Project Type**: Local-first CLI and agent artifact generator.

**Performance Goals**: Keep new metadata artifacts bounded enough for agent
first-read use; do not require loading full `graph.json` to understand producer
coverage.

**Constraints**: Read-only target handling, no network, no daemon behavior, no
credentials, no target repository mutation, no Portolan-owned scanner wrappers.

**Scale/Scope**: Apache Bigtop landscape with 18 repositories and large
multi-language source volume. Initial proof must handle bounded real outputs:
Docker Compose config, Helm template output, and protobuf descriptors.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
| --- | --- | --- |
| Local-first and read-only by default | Pass | Producer outputs are generated outside Portolan and written under `.portolan/stress/...`; implementation must only import or surface selected local artifacts. |
| Evidence state honesty | Pass | Missing symbol/reference and runtime topology remain `not_assessed`; static deployment/API outputs do not become runtime evidence. |
| Complement, do not replace | Pass | Use Docker Compose, Helm, protoc, Semgrep, jscpd, and future symbol tools as local producers; no native scanner implementation. |
| SpecKit before implementation | Pass | `spec.md`, `plan.md`, `research.md`, `data-model.md`, contracts, and `quickstart.md` exist before tasks/implementation. |
| Test-first for behavior | Pass | Planned implementation requires fixture tests before code changes. |

## Project Structure

### Documentation (this feature)

```text
docs/specs/054-real-producer-output-proof/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── producer-run-record.md
├── reviews/
│   └── initial-bigtop-producer-gap-reconstruction-2026-06-01.md
└── tasks.md
```

### Source Code (repository root)

```text
cmd/portolan/
internal/app/
internal/contextprep/
internal/maprun/
internal/producerfamily/
internal/selection/
schema/
internal/testfixtures/
```

**Structure Decision**: Keep `cmd/portolan` thin. If code changes are needed,
put producer-run validation, context surfacing, and map coverage behavior in
internal packages that already own context preparation, map runs, selection
validation, and producer-family records.

## Complexity Tracking

No constitution violations are approved. Any future need to run producer tools
from Portolan, add dependencies, or collect runtime data must return to design
review before implementation.
