# Implementation Plan: Black-Box Profile

**Branch**: `005-black-box-profile` | **Date**: 2026-05-20 | **Spec**: [spec.md](spec.md)
**Input**: Product backlog P1-005: represent black-box systems through
metadata, runtime observations, and claims.

## Summary

Extend local scan to represent systems without source code. A selection file can
declare black-box service or runtime targets plus local metadata, runtime, and
claim files. Scan emits graph facts with honest evidence states, records
expected missing evidence as `unknown`, records malformed selected inputs as
`cannot_verify`, and never emits `source-visible` for black-box-derived facts.

## Technical Context

**Language/Version**: Go 1.26 module, standard library first.
**Primary Dependencies**: Go standard library; `jq` for JSON syntax checks.
**Input Formats**: Local JSON selection extension, metadata fixture JSON,
runtime observation fixture JSON, existing claim JSON subset.
**Storage**: Local input files and explicit graph output file.
**Testing**: `go test -count=1 ./...`; fixture scan and packet commands;
`jq empty schema/*.json`; `git diff --check`.
**Target Platform**: Local CLI on macOS/Linux first.
**Project Type**: Single Go CLI.
**Performance Goals**: Fixture black-box scan completes in under 1 second.
**Constraints**: No network, no daemon, no credentials, no live telemetry, no
target mutation, no `source-visible` evidence for black-box-derived facts.
**Scale/Scope**: One selection file with black-box services and local input
files.

## Decision Gate

| Question | Answer |
| --- | --- |
| Simpler/Faster | Extend existing `scan --selection --out` instead of adding a new command. Use local JSON fixtures and stdlib parsing. |
| Blocking Edge Cases | Black-box evidence can be weak or malformed; the graph must preserve `claim-only`, `unknown`, and `cannot_verify` rather than omitting or upgrading them. Runtime evidence must be local exports, not live queries. |
| Existing Open Source | Service catalogs and observability systems already produce useful exports. This slice models local exported data and defers Backstage, OpenTelemetry, CMDB, or vendor-specific adapters until importer review. |

## OSS Fit Review

| Candidate | Fit | Maturity | License Risk | Integration Cost | Decision |
| --- | --- | --- | --- | --- | --- |
| Local service catalog JSON fixture | Good for proving metadata-visible service facts. | Fixture only; models common catalog concepts. | None. | Low. | Accept for first slice. |
| Backstage catalog export | Strong future metadata source. | Mature OSS. | Manageable but plugin/schema details need review. | Medium. | Defer to importer adapter. |
| OpenTelemetry-derived local export | Good future runtime evidence source. | Mature ecosystem. | Low for spec, but exporter formats vary. | Medium. | Defer to importer adapter. |
| Live observability API calls | Useful but crosses network and credential boundaries. | Vendor-dependent. | Higher privacy/security risk. | High. | Reject for this slice. |

## Constitution Check

| Rule | Status | Evidence |
| --- | --- | --- |
| Local-first and read-only | Pass | Black-box inputs are local files; no live telemetry, network, daemon, credentials, or mutation. |
| Evidence state honesty | Pass | Black-box facts preserve metadata, runtime, claim, unknown, and cannot-verify states. |
| Complement existing tools | Pass | Portolan normalizes local exports instead of replacing catalogs or observability platforms. |
| SpecKit before implementation | Pass | This spec, plan, data model, contract, quickstart, and tasks make P1-005 implementable before code changes. |
| Test-first behavior | Pass | Tasks start with fixtures and failing CLI/graph/packet tests. |

## Project Structure

```text
cmd/portolan/
└── main.go

internal/
├── app/
├── blackbox/
├── graph/
├── packet/
├── scan/
└── selection/

testdata/
└── black-box-profile/
    ├── selection.json
    ├── missing-dependency-selection.json
    ├── malformed-runtime-selection.json
    ├── metadata/payments.json
    ├── runtime/payments.json
    ├── runtime/malformed.json
    └── claims/payments.json
```

## Design Decisions

| Decision | Rationale | Rejected Alternative | Reversibility | Risk If Wrong | Confidence |
| --- | --- | --- | --- | --- | --- |
| Extend `scan` for black-box targets | Black-box profiling is evidence graph generation, not a separate product mode. | Add `portolan blackbox` command. | Medium; command wrapper can be added later. | Scan selection shape may grow too broad. | Medium |
| Use existing graph node kinds | Avoids schema migration before consumer need is proven. | Add `black-box` graph node kind. | Medium; schema can add a kind later. | Consumers may want direct target classification. | Medium |
| Emit missing expected fields as `unknown` | Makes black-box gaps explicit. | Skip absent fields. | High. | Graphs may feel noisier until packet grouping improves. | High |
| Treat malformed local inputs as `cannot_verify` | Preserves partial visibility without fake success. | Fail the whole scan. | High. | Users may miss hard failures if packet does not call them out. | High |
| Keep runtime observations file-based | Preserves default no-network and no-credential boundary. | Query observability systems directly. | High. | Runtime profile is less automated initially. | High |

## Verification Plan

- Unit tests for black-box selection parsing and validation.
- Fixture tests for metadata-visible, runtime-visible, claim-only, unknown, and
  cannot_verify output.
- CLI test for `scan --selection testdata/black-box-profile/selection.json
  --out <file> --force`.
- Regression test that no black-box-derived graph fact uses `source-visible`.
- Packet rendering test that black-box-only facts are not described as source
  analysis.
- `go test -count=1 ./...`.
- `jq empty schema/*.json`.
- `go run ./cmd/portolan scan --selection
  testdata/black-box-profile/selection.json --out
  /tmp/portolan-black-box-graph.json --force`.
- `jq empty /tmp/portolan-black-box-graph.json`.
- `git diff --check`.

## Risks

- The first local JSON fixture may not match any real catalog export. Mitigation:
  keep it as a profile contract and defer real adapters to importer-normalization
  slices with OSS fit review.
- The graph schema lacks multi-evidence arrays. Mitigation: emit deterministic
  facts and avoid destructive evidence upgrades until graph merge semantics are
  designed.
- Packet wording may lag graph semantics. Mitigation: include packet tests in
  this slice to prevent source-analysis language for black-box-only facts.
