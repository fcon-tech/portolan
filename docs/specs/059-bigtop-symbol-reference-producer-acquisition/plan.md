# Implementation Plan: Bigtop Symbol/Reference Producer Acquisition

**Branch**: `codex/059-bigtop-symbol-reference-producer-acquisition` | **Date**: 2026-06-02 | **Spec**: [spec.md](spec.md)

## Summary

Move beyond selected-file `gopls symbols` by selecting and attempting a mature
local symbol/reference producer for a bounded Bigtop scope. Prefer a producer
that can run locally, preserve target read-only posture, and emit a machine
readable output that distinguishes definitions from references.

## Technical Context

Known from Spec 058:

- `scip`, `ctags`, `universal-ctags`, `lsif-java`, `lsif-go`, and `src-cli` were
  not installed.
- `gopls`, `javap`, `mvn`, and `rg` were installed but do not by themselves
  prove full symbol/reference coverage.
- Bigtop runtime topology remains `not_assessed` and is not solved by this
  slice.

Candidate producer families:

- Universal Ctags: mature local definitions index, broad language coverage,
  definitions-focused rather than reference graph.
- SCIP/LSIF indexers: stronger def/ref semantics when language-specific indexers
  are available, but install/build complexity may be higher.
- Java/JVM analyzers such as `jdeps`, Maven dependency plugins, or language
  server/indexer exports: useful for bounded JVM scopes, but may be dependency
  graph rather than symbol/reference graph.

## Decision Gate

- Simpler/Faster: first try the lowest-risk mature local producer with broad
  language coverage and no target mutation.
- Blocking Edge Cases: definitions-only is not full references; JVM monorepos can
  require builds/dependency resolution; remote services or telemetry are not
  allowed; target repo mutation is not allowed.
- Existing Open Source: use an established OSS producer rather than writing a
  Portolan scanner.

## Verification

Run:

```bash
go test -count=1 ./...
go vet ./...
jq empty schema/*.json
git diff --check
```

Also validate any produced symbol/reference output with format-specific checks
and record external outputs under
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-059-symbol-reference-producer/`.
