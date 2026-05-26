# Implementation Review Disposition: 022 OSS Tool Output Assembly

Date: 2026-05-26

## Scope Reviewed

- `internal/contextprep.ToolEntry` registry shape
- jscpd-style JSON summary
- CycloneDX/Syft-compatible JSON summary
- malformed JSON preservation as `cannot_verify`
- Cursor guide/skill wording for tool summaries

## Decision

Context preparation now summarizes local OSS/tool-output candidates but still
does not invoke external scanners. This preserves the local-first/read-only
boundary while making the context pack more useful to Cursor.

## Verification

- `go test ./...`: passed
- `jq empty schema/*.json`: passed
- `git diff --check`: passed
- Fixture context smoke:
  - `testdata/landscape-map` produced observed `cyclonedx` and `jscpd`
    registry entries with metrics.
- Bigtop context smoke:
  - 18 repositories discovered;
  - 0 tool-output candidates as an empty array;
  - 9 gaps.
- Cursor assisted lane:
  - `/tmp/portolan-oss-cursor-plus.out` used the jscpd and CycloneDX metrics
    while preserving unknown/not_assessed boundaries.

## Not Assessed

- Running jscpd, Syft, Semgrep, Backstage, OpenAPI, AsyncAPI, Structurizr, or
  code-index tools directly is not assessed and remains out of scope for this
  slice.
- Deep parsing of YAML/catalog/API/architecture files is not assessed.

## Follow-Up

- Add explicit importers or parsers for Backstage, OpenAPI, AsyncAPI, and
  Structurizr.
- Decide whether an approved profile may execute local OSS scanners, or whether
  Portolan should remain import-only by default.
