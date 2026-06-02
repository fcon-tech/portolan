# Implementation Plan: Tool Acquisition Guidance

**Branch**: `codex/083-tool-acquisition-guidance`

**Date**: 2026-06-02

**Spec**: `docs/specs/083-tool-acquisition-guidance/spec.md`

## Summary

Clarify the producer-planning surface so Portolan stays stack-agnostic while
still telling agents which local tools to pull in for missing evidence families.
The slice adds generic acquisition/risk guidance around existing OSS tool plans;
it does not add a new scanner, install tools, run native producers, or create a
language-specific adapter.

## Decision Gate

- **Simpler/Faster**: Leave the existing `oss-plan.json` text as-is. Rejected
  because Cursor and operator discussion showed the guidance can be misread as
  incremental stack-specific adapter work.
- **Blocking Edge Cases**: External tools can install packages, hit networks,
  write caches, mutate targets, or expose private dependency coordinates.
  Therefore acquisition guidance is descriptive and approval-gated; no native
  command is run by Portolan.
- **Existing Open Source**: Continue composing mature OSS/native producer tools
  such as Syft, CycloneDX plugins, jscpd, and Semgrep. Portolan owns the
  evidence contract and normalization boundary, not their scanner logic.

## Technical Context

**Language/Version**: Go.

**Primary Dependencies**: Standard library only. No new dependency.

**Storage**: Local context artifacts and SpecKit docs.

**Testing**: Focused `internal/contextprep` test, then full baseline.

**Constraints**: Local-first/read-only defaults. No installs, network access,
producer execution, daemon behavior, credentials, or target mutation.

## Verification

```bash
go test ./internal/contextprep
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```

Fresh Bigtop smoke and Cursor Composer 2.5 stress must use a clean context path
and must not run native producers.
