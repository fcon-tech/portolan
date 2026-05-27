# Implementation Plan: Bounded jscpd Profile

**Branch**: `039-bounded-jscpd-profile` | **Date**: 2026-05-27 |
**Spec**: `specs/039-bounded-jscpd-profile/spec.md`

**Input**: Feature specification from
`specs/039-bounded-jscpd-profile/spec.md`

## Summary

Define and implement a bounded local `jscpd` producer profile so near-clone
duplication evidence can be accepted only when a safe, reproducible local run
produces usable output. The implementation should reuse existing context/tool
output conventions and update claim surfaces only to the proven scope.

## Technical Context

**Language/Version**: Go 1.24.2

**Primary Dependencies**: Go standard library; existing repository packages;
external `jscpd` binary as an optional local producer, not a Go dependency

**Storage**: Local files under selected output directories

**Testing**: `go test -count=1 ./...`, focused package tests, `jq empty
schema/*.json`, `git diff --check`, and documented fixture or Bigtop producer
commands

**Target Platform**: Local CLI on developer/agent machines

**Project Type**: Go CLI

**Performance Goals**: Avoid unbounded clone output on generated-heavy
landscapes; timeout or bound large runs instead of hanging indefinitely

**Constraints**: Local-first; read-only target repositories; no network access;
no credentials; no daemon behavior; no output outside selected output paths

**Scale/Scope**: Fixed local Bigtop target or representative fixture first;
no claim of universal near-clone coverage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Local-first and read-only: PASS. The producer profile uses local inputs and
  writes only to selected output directories.
- Evidence state honesty: PASS. Missing, partial, malformed, timed-out, or
  failed output remains failed, blocked, or not_assessed.
- Complement, do not replace: PASS. The feature composes `jscpd` instead of
  implementing a native near-clone scanner.
- SpecKit before implementation: PASS. This plan is backed by spec and tasks.
- Test-first for behavior: PASS. Behavior tasks include focused tests before
  implementation.

## Project Structure

### Documentation (this feature)

```text
specs/039-bounded-jscpd-profile/
├── checklists/
│   └── requirements.md
├── contracts/
│   └── bounded-jscpd-profile.md
├── data-model.md
├── plan.md
├── quickstart.md
├── research.md
├── reviews/
└── tasks.md
```

### Source Code (repository root)

```text
cmd/portolan/                 # Thin CLI wiring if command/help changes
internal/context/             # Existing context preparation/tool output logic
internal/importer/            # Existing importer normalization, if JSON ingest changes
internal/maprun/              # Existing map bundle surfaces, if producer metadata is emitted there
schema/                       # JSON schema updates only if output contracts change
testdata/                     # Small fixtures for bounded producer/import behavior
docs/product-claims.md        # Claim boundary update after evidence is known
docs/product-backlog.md       # Backlog status alignment
```

**Structure Decision**: Keep behavior in existing internal packages and keep
`cmd/portolan` thin. Do not add dependencies unless implementation proves the
stdlib plus local `jscpd` command is insufficient.

## Complexity Tracking

No constitution violations are planned.
