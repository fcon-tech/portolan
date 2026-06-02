# Implementation Plan: Build Tool Dependency Producers

**Branch**: `codex/078-build-tool-dependency-producers`

**Date**: 2026-06-02

**Spec**: `docs/specs/078-build-tool-dependency-producers/spec.md`

## Summary

Improve the agent next-action surface for JVM-heavy and mixed-language
landscapes by adding Maven/Gradle dependency producer recommendations to
`context prepare` when build manifests are visible. The slice does not execute
external tools and does not add a Maven/Gradle parser; it routes agents toward
approval-gated native CycloneDX/build-tool output that Portolan can later
normalize as local dependency evidence.

## Decision Gate

- **Simpler/Faster**: Keep the current generic Syft plan only. Rejected because
  the fresh Bigtop context sees hundreds of Maven/Gradle manifests but gives no
  build-tool-specific dependency evidence action, leaving the Java/Scala/Maven
  graph gap too vague.
- **Blocking Edge Cases**: Maven/Gradle commands can download plugins, write
  caches, run build logic, or leak private artifact coordinates. Therefore this
  slice records plans only; Maven gets an approval-required output-bounded
  command because the CycloneDX Maven plugin supports `outputDirectory`, while
  Gradle stays `not_assessed` unless a project-local plugin/init-script can
  bound JSON output safely.
- **Existing Open Source**: Prefer CycloneDX Maven and Gradle plugins because
  they generate standard SBOM/dependency output that aligns with Portolan's
  existing CycloneDX normalization. Maven dependency-plugin JSON and Gradle
  dependency reports are kept as future parser candidates, not added now.

## Technical Context

**Language/Version**: Go.

**Primary Dependencies**: Standard library only. No new dependency.

**Storage**: Local files under context output directories and SpecKit docs.

**Testing**: Focused Go tests for `internal/contextprep`, then `go test ./...`,
`go vet ./...`, `jq empty schema/*.json`, and `git diff --check`.

**Target Platform**: Local Linux CLI.

**Project Type**: CLI evidence-preparation tool.

**Performance Goals**: Manifest detection remains bounded by existing
repository discovery and relationship-candidate scanning; no full dependency
resolution runs during context preparation.

**Constraints**: Local-first/read-only default; no network, build, install,
daemon, Docker, Maven, or Gradle execution by Portolan. Suggested Maven/Gradle
actions are not verification evidence until separately approved and run.

**Scale/Scope**: Bigtop-sized multi-repo landscapes with Maven/Gradle manifests.

## Constitution Check

- **Local-First And Read-Only By Default**: Pass. The feature only writes
  context artifacts and does not execute native producers.
- **Evidence State Honesty**: Pass. Recommendations remain `not_assessed`;
  dependency facts are not upgraded.
- **Complement, Do Not Replace**: Pass. The feature composes existing
  CycloneDX/build-tool output instead of implementing a Portolan scanner.
- **SpecKit Before Implementation**: Pass. This plan, spec, tasks, and review
  artifacts define the slice before code edits.
- **Test-First For Behavior**: Required. Add focused `contextprep` tests before
  changing behavior.

## Project Structure

```text
docs/specs/078-build-tool-dependency-producers/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── reviews/
│   └── requirements-product-vision-drift-2026-06-02.md
└── tasks.md

internal/contextprep/
├── contextprep.go
└── contextprep_test.go
```

## Research

Recorded in `research.md`.

## Data Model

Recorded in `data-model.md`.

## Contracts

No new public schema. The existing `oss-plan.json` shape is extended with new
tool plan entries.

## Quickstart

Recorded in `quickstart.md`.

## Verification

```bash
go test ./internal/contextprep
go test ./internal/app
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```

Fresh Bigtop smoke:

```bash
go run ./cmd/portolan context prepare --root /home/fall_out_bug/projects/bigtop-landscape --out /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/<run-id>/context --profile agent --force
jq '.tools[] | select(.id == "maven-cyclonedx" or .id == "gradle-cyclonedx")' /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/<run-id>/context/oss-plan.json
```
