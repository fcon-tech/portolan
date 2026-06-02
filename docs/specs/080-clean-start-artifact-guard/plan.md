# Implementation Plan: Clean Start Artifact Guard

**Branch**: `codex/080-clean-start-artifact-guard` | **Date**: 2026-06-02 | **Spec**: `docs/specs/080-clean-start-artifact-guard/spec.md`

**Input**: Feature specification from
`docs/specs/080-clean-start-artifact-guard/spec.md`

## Summary

Add a small artifact-boundary guard to generated context guidance, producer-run
normalization, and the agent acceptance guide. The feature prevents stress lane
contamination by making the current context directory explicit, treating stale
`.portolan/stress/*`, root-level `run/`, and unrelated generated outputs as
forbidden unless the user or run ledger explicitly names them, and refusing to
promote stale sibling producer-run outputs as current verified evidence.

## Technical Context

**Language/Version**: Go, current repository toolchain.

**Primary Dependencies**: Go standard library only.

**Storage**: Local context files under the selected output directory.

**Testing**: `go test ./internal/contextprep`, full baseline checks before PR.

**Target Platform**: Local CLI on Linux/macOS-style filesystems.

**Project Type**: CLI and generated agent guidance.

**Performance Goals**: No additional filesystem scan beyond existing context
preparation.

**Constraints**: Preserve local-first/read-only defaults; do not delete target
files; do not run jscpd, Maven, Gradle, Docker, or runtime capture. Cursor
Composer 2.5 may be run as a read-only stress reviewer against the generated
context pack.

**Scale/Scope**: Applies to generated context packs for single-repo and
multi-repo landscapes.

## Constitution Check

- Local-first/read-only: Pass. The slice changes generated guidance and
  context metadata normalization only.
- Evidence honesty: Pass. Contaminated lanes are invalid evidence, not degraded
  success.
- Complement, do not replace: Pass. No new scanner or harness behavior.
- SpecKit before implementation: Pass. Spec, plan, and tasks are concrete.
- Test-first for behavior: Pass. Add focused contextprep test for generated
  guidance and stale producer-run scrubbing.

## Project Structure

### Documentation

```text
docs/specs/080-clean-start-artifact-guard/
├── spec.md
├── plan.md
├── research.md
├── quickstart.md
├── tasks.md
└── reviews/
```

### Source Code

```text
internal/contextprep/contextprep.go
internal/contextprep/contextprep_test.go
docs/agent/ACCEPTANCE.md
docs/product-backlog.md
AGENTS.md
.specify/feature.json
```

**Structure Decision**: Keep behavior in `internal/contextprep`; update docs in
the existing agent acceptance guide. No CLI surface or schema is added.

## Complexity Tracking

No constitution violations.
