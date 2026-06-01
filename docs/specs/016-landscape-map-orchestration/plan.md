# Implementation Plan: Landscape Map Orchestration

**Branch**: `016-landscape-map-orchestration` | **Date**: 2026-05-21 |
**Spec**: `docs/specs/016-landscape-map-orchestration/spec.md`

## Summary

Add product-grade landscape mapping on top of the already implemented
selection, graph, packet, importer, black-box, map-bundle, relationship, and
agent-skill slices. The new command path is
`portolan map --selection <selection.json> --out <run-dir> [--force]`. It must
produce one complete artifact bundle for a multi-repo software landscape and
must enforce full Bigtop corpus coverage before the Bigtop acceptance scan is
allowed to start.

`map --root` remains a compatibility shortcut for single-repository smoke runs.
It is not the acceptance path for Bigtop or CTO-grade landscape mapping.

## Technical Context

**Language/Version**: Go, existing module `github.com/fall-out-bug/portolan`.

**Primary Dependencies**: Existing standard-library first approach. New runtime
dependencies require OSS fit review. External scanners are represented through
local file outputs and import adapters.

**Storage**: Local JSON and JSON Lines artifacts only.

**Testing**: `go test ./...`, fixture-driven CLI tests, JSON syntax checks with
`jq`, and `git diff --check`.

**Target Platform**: Local CLI on developer/operator workstations.

**Project Type**: Go CLI and agent-facing artifact bundle.

**Performance Goals**: The four-repository landscape fixture must complete in
under 10 seconds on a developer laptop. The full Bigtop run must stream or
process per input without requiring all repository contents to be held in memory
at once.

**Constraints**: No network, no daemon, no credentials, no selected-target
mutation during `map`. Bigtop corpus preparation is explicit setup outside the
blind map run.

**Scale/Scope**: Full Bigtop 3.5.0 corpus inventory as defined by
`internal/testfixtures/corpus-manifests/apache-bigtop/manifest.json`, including meta-repo, component
repositories, support packages, retired projects, and runtime/package metadata
surfaces.

## Constitution Check

- **Local-first/read-only**: `map --selection` reads declared local paths and
  writes only to the selected output directory.
- **Evidence state honesty**: Missing, unsupported, or malformed inputs remain
  `unknown`, `cannot_verify`, or `not_assessed`; Bigtop full-corpus omission
  blocks acceptance rather than becoming a soft pass.
- **OSS composition before reimplementation**: External scanner outputs are
  imported with attribution instead of building a broad scanner platform.
- **SpecKit before implementation**: This slice provides concrete spec, plan,
  data model, CLI contract, quickstart, and tasks before implementation.
- **Agent usefulness**: The output bundle is designed for another agent and CTO
  to inspect without relying on chat history.

## Project Structure

```text
cmd/portolan/main.go
internal/app/app.go
internal/maprun/
internal/selection/
internal/scan/
internal/packet/
internal/importer/
internal/coverage/
internal/tooloutput/
schema/
agent/
docs/agent/cursor-rules/
internal/testfixtures/corpus-manifests/apache-bigtop/
internal/testfixtures/landscape-map/
internal/testfixtures/apache-bigtop-landscape/
docs/specs/016-landscape-map-orchestration/
```

**Structure Decision**: Keep `cmd/portolan` thin. CLI parsing remains in
`internal/app`; orchestration belongs in `internal/maprun`; coverage and
tool-output normalization get focused internal packages if they grow beyond
simple helpers. Docs, guide, schema, and fixtures are updated in the same slice
because the acceptance contract depends on them.

## Deliverables

1. `portolan map --selection` CLI path.
2. Landscape artifact bundle with `coverage.json`.
3. Full-corpus Bigtop gate and fixture proving incomplete Bigtop coverage
   blocks acceptance.
4. Imported local OSS tool-output support for the minimum Bigtop-ready evidence
   families: SBOM/dependency, code-size/language inventory, duplication, and
   configuration/contract surfaces.
5. CTO packet sections derived from artifacts.
6. Agent guide and Cursor rule updates that document `map --selection` as the
   curated landscape path. This is not sufficient for blind operator acceptance;
   target-root discovery is deferred to spec 017.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Add `coverage.json` artifact | Full Bigtop acceptance needs machine-readable proof of 100% representation. | Hiding coverage inside Markdown would force agents to scrape prose and would not enforce the gate. |
| Add OSS tool-output import family | Bigtop-scale maps need existing scanner evidence for duplication, dependency, size, and config signals. | Reimplementing all scanners in Go would delay the product test and contradict the OSS composition rule. |
