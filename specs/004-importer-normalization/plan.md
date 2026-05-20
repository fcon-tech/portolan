# Implementation Plan: Importer Normalization

**Branch**: `004-importer-normalization` | **Date**: 2026-05-20 | **Spec**: [spec.md](spec.md)
**Input**: Product backlog P1-004: import existing OSS/tool outputs through
reviewed adapters.

## Summary

Add the first file-based importer for local CycloneDX JSON SBOM exports. The
CLI reads one existing BOM file, normalizes components and dependency
relationships into the Portolan evidence graph, preserves source attribution,
and writes graph JSON to an explicit output path.

## Technical Context

**Language/Version**: Go 1.26 module, standard library first.
**Primary Dependencies**: Go standard library; `jq` for JSON syntax checks.
**Source Format**: CycloneDX JSON 1.5-compatible fixture subset.
**Storage**: Local importer JSON input and explicit graph JSON output.
**Testing**: `go test -count=1 ./...`; fixture importer command; `jq empty
schema/*.json`; `git diff --check`.
**Target Platform**: Local CLI on macOS/Linux first.
**Project Type**: Single Go CLI.
**Performance Goals**: Fixture import completes in under 1 second.
**Constraints**: No network, no daemon, no credentials, no mutation of source
tool output, no target repository reads, no generated facts without attribution.
**Scale/Scope**: One CycloneDX JSON input file per command invocation.

## Decision Gate

| Question | Answer |
| --- | --- |
| Simpler/Faster | Import a committed local CycloneDX JSON fixture using `encoding/json`; no external binary execution, no schema validator dependency, no live APIs. |
| Blocking Edge Cases | Malformed JSON must emit a `cannot_verify` graph rather than partial success; unknown component refs must stay `cannot_verify`; every node/edge must cite the input file; output path must be explicit and overwrite-protected. |
| Existing Open Source | CycloneDX and SPDX are mature SBOM standards. CycloneDX is chosen first because its JSON component/dependency model maps cleanly to Portolan package nodes and `depends-on` edges while keeping source tools external. |

## OSS Fit Review

| Candidate | Fit | Maturity | License Risk | Integration Cost | Decision |
| --- | --- | --- | --- | --- | --- |
| CycloneDX JSON | Good first importer; standard BOM with components and dependencies. | Mature OWASP/Ecma-backed standard with many OSS producers. | Low for the format; no library dependency in this slice. | Low fixture subset with stdlib JSON. | Accept for first adapter. |
| SPDX JSON | Strong SBOM standard and ISO-backed, but relationship mapping is broader and noisier for the first slice. | Mature. | Low for the format. | Medium because package/document/reference semantics need more design. | Defer. |
| Syft native JSON | Useful OSS generator output but tool-specific. | Mature OSS tool. | Manageable, but native schema couples Portolan to one producer. | Medium. | Defer behind standard formats. |
| cdxgen invocation | Generates CycloneDX, but running tools crosses the current file-import boundary. | Mature OWASP project. | Manageable. | Higher because invocation, environment, and privacy boundaries need approval. | Defer; import its output only. |

## Constitution Check

| Rule | Status | Evidence |
| --- | --- | --- |
| Local-first and read-only | Pass | Importer reads one local file and writes only the selected output. |
| Evidence state honesty | Pass | Parsed facts are `metadata-visible`; malformed or unresolved refs become `cannot_verify`. |
| Complement existing tools | Pass | Portolan normalizes CycloneDX output instead of becoming an SBOM generator. |
| SpecKit before implementation | Pass | This plan and tasks make P1-004 implementable before behavior changes. |
| Test-first behavior | Pass | Tasks start with fixtures and CLI/importer tests. |

## Project Structure

```text
cmd/portolan/
└── main.go

internal/
├── app/
├── graph/
└── importer/

testdata/importer-normalization/
├── cyclonedx.json
├── cyclonedx-unknown-ref.json
└── malformed-cyclonedx.json
```

## Design Decisions

| Decision | Rationale | Rejected Alternative | Reversibility | Risk If Wrong | Confidence |
| --- | --- | --- | --- | --- | --- |
| Start with CycloneDX JSON | Best fit for component and dependency graph normalization with broad OSS support. | Start with a tool-native format such as Syft JSON. | Medium; adapter package can add other formats. | First importer may underrepresent non-SBOM metadata. | High |
| Implement a fixture subset with stdlib JSON | Keeps dependency surface zero while proving the adapter contract. | Add a CycloneDX Go library now. | High; can swap parser behind adapter later. | Manual parser may lag full spec if scope expands. | Medium |
| Add `portolan import cyclonedx --in --out [--force]` | Clear local file IO and mirrors scan/packet command shape. | Hide import behind `scan`. | High. | Command taxonomy may need adjustment when more importers arrive. | Medium |
| Emit a graph directly | Reuses current product contract and packet renderer. | Emit an intermediate adapter file. | Medium. | Multi-import merge needs a later graph composition slice. | High |
| Treat unresolved dependency refs as `cannot_verify` nodes | Preserves uncertainty without dropping useful edge evidence. | Drop unknown refs silently. | High. | Graph may include extra package placeholder nodes. | High |

## Verification Plan

- Unit tests for importer normalization from CycloneDX fixture.
- CLI tests for `import cyclonedx --in <file> --out <file>`.
- Malformed input test proving output is still a valid graph with
  `cannot_verify`, not partial parsed facts.
- Unknown dependency ref test proving unresolved refs are represented honestly.
- `go test -count=1 ./...`.
- `jq empty schema/*.json`.
- `go run ./cmd/portolan import cyclonedx --in testdata/importer-normalization/cyclonedx.json --out /tmp/portolan-import-graph.json --force`.
- `git diff --check`.

## Risks

- CycloneDX has many fields that this slice will not import. Mitigation: name
  the supported subset in help/docs and preserve the input file as source.
- Malformed input cannot create component facts. Mitigation: emit a minimal
  graph with a `cannot_verify` importer node and reason.
- Future graph merge semantics are out of scope. Mitigation: this command emits
  one graph per input and leaves composition for a later slice.
