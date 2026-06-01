# Implementation Plan: Runtime Topology Evidence

**Branch**: `codex/055-runtime-topology-evidence` | **Date**: 2026-06-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `docs/specs/055-runtime-topology-evidence/spec.md`

## Summary

Extend the existing local runtime observation contract so top-level
`selection.runtime` inputs can produce `runtime-visible` map relationships. Keep
static dependency, catalog, deployment, and producer-run metadata separate from
runtime topology. For Bigtop, record runtime topology as blocked or
`not_assessed` unless a safe local runtime observation export is supplied.

## Technical Context

**Language/Version**: Go 1.26.x

**Primary Dependencies**: Go standard library and existing internal packages.
No new dependency is approved.

**Storage**: Local JSON selection and runtime observation files.

**Testing**: Focused map/app tests, `go test -count=1 ./...`, `go vet ./...`,
`jq empty schema/*.json`, `git diff --check`, Bigtop context/map/Cursor stress
where runtime evidence is present or explicitly absent.

**Target Platform**: Local CLI on Linux/macOS workstations.

**Constraints**: Read-only target handling, no network, no daemon behavior, no
credentials, no service startup, no live telemetry scraping.

## Constitution Check

| Principle | Status | Evidence |
| --- | --- | --- |
| Local-first/read-only | Pass | Runtime inputs are local files selected by the operator. |
| Evidence-state honesty | Pass | Runtime-visible edges require explicit runtime observation records. |
| Complement, do not replace | Pass | Portolan imports runtime exports; it does not collect telemetry. |
| SpecKit before implementation | Pass | `spec.md` exists; this plan and tasks precede code changes. |
| Test-first for behavior | Pass | Runtime import tests are required before implementation. |

## Project Structure

```text
internal/maprun/
internal/app/
internal/testfixtures/runtime-topology-evidence/
docs/runtime-observations.md
docs/specs/055-runtime-topology-evidence/
```

**Structure Decision**: Implement top-level runtime observation import in
`internal/maprun` first because map bundles are the runtime-topology evidence
surface. Avoid new CLI commands and do not modify `cmd/portolan`.

## Complexity Tracking

No approved constitution violations. If a future slice needs live Bigtop
collection, service startup, credentials, daemon behavior, or network access, it
must return to design review.
