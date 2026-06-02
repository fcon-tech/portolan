# Implementation Plan: Maven Sharded Producer Plan

**Branch**: `codex/081-maven-sharded-producer-plan`

**Date**: 2026-06-02

**Spec**: `docs/specs/081-maven-sharded-producer-plan/spec.md`

## Summary

Change Maven/CycloneDX context planning from a single sample `pom.xml` command
to repository-sharded approval-gated commands. Portolan still does not execute
Maven and does not parse Maven semantics; it gives agents a bounded native
producer-output acquisition plan for JVM-heavy landscapes.

## Decision Gate

- **Simpler/Faster**: Keep one sample Maven command. Rejected because Cursor
  Composer 2.5 classified the next action as only partially specific for
  multi-repo Bigtop.
- **Blocking Edge Cases**: Maven may resolve plugins/dependencies, read
  settings/caches, and write target directories or caches. Therefore every
  command remains approval-required, mutation-risk-marked, and non-counting
  evidence until output is supplied.
- **Existing Open Source**: Continue using the CycloneDX Maven plugin from spec
  078. Building a Maven parser or JVM adapter in Portolan remains rejected.

## Technical Context

**Language/Version**: Go.

**Dependencies**: Standard library only.

**Testing**: Focused `internal/contextprep` tests, fresh Bigtop context smoke,
Cursor Composer 2.5 bounded stress, baseline checks.

**Constraints**: Local-first and read-only by default. No Maven/Gradle/jscpd
execution. Output only to selected context directories.

## Implementation

- Extend `buildToolSurface` with repository-scoped Maven manifest surfaces.
- Generate one Maven/CycloneDX command per retained Maven repository.
- Place declared outputs under `tool-outputs/maven-cyclonedx/`.
- Cap command count to keep `oss-plan.json` bounded.
- Preserve answer/query guidance from spec 078.

## Verification

```bash
go test ./internal/contextprep
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
go run ./cmd/portolan context prepare --root /home/fall_out_bug/projects/bigtop-landscape --out /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-081-maven-sharded-producer-plan/context --profile cursor --force
```
