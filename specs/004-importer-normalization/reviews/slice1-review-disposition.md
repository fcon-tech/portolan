# Slice 1 Review Disposition

Date: 2026-05-20

## Scope Reviewed

- `internal/app/app.go`
- `internal/app/app_test.go`
- `internal/importer/cyclonedx.go`
- `testdata/importer-normalization/`
- `README.md`
- `docs/product-backlog.md`
- `specs/004-importer-normalization/`
- `AGENTS.md` merge closeout rule update

## Local Review Findings

### accepted/fixed

- `major`: Extra standard CycloneDX fields were initially rejected because the
  importer used `DisallowUnknownFields`. Fixed by allowing unknown fields and
  adding an extra fixture field.
- `major`: A dependency edge whose source ref was missing from components could
  remain `metadata-visible` when its target was known. Fixed by marking such
  edges `cannot_verify` and adding test coverage.

### rejected

- None.

## Pi Review Lanes

### `minimax/MiniMax-M2.7`

Result: assessed with degraded usefulness.

- Claimed a major partial-write risk. Rejected: importer writes through
  `scan.Write`, which uses a temporary file and rename after output checks.
- Minor help/schema/test concerns were either already covered or superseded by
  the GLM findings below.

### `zai/glm-5.1`

Result: assessed.

Accepted and fixed:

- `major`: Add output-safety coverage for existing file, `--force`, and symlink
  output.
- `minor`: Add guidance for unknown import subcommands.
- `minor`: Add missing-input coverage proving a valid `cannot_verify` graph.

Rejected:

- `major`: Missing `--in`/`--out` validation. Rejected as already handled by
  `RunCycloneDX`; added tests to pin the behavior.
- `major`: `Options` containing output fields is misleading. Rejected for this
  slice because `RunCycloneDX` intentionally preflights output before parsing so
  malformed input does not produce an output file when the destination is unsafe.
- `minor`: Test should assert node kind `source`. Rejected because
  `schema/evidence-graph.schema.json` has no `source` node kind; `unknown` is
  the schema-compatible source/import node.
- `minor`: Relative `evidence.source` should be absolute or documented.
  Rejected for now to preserve the user-provided local path, matching existing
  scan behavior.

### `kimi-coding/kimi-for-coding`

Result: `not_assessed`.

The lane produced no output within the working window. It is recorded as
degraded evidence and is not counted as a clean review.

## Verification

- verified: `go test -count=1 ./...` passed.
- verified: `jq empty schema/*.json` plus valid importer fixtures passed.
- verified: `go run ./cmd/portolan import cyclonedx --in testdata/importer-normalization/cyclonedx.json --out /tmp/portolan-import-graph.json --force` wrote a graph.
- verified: `jq empty /tmp/portolan-import-graph.json` passed.
- verified: `git diff --check` passed.
- not_assessed: GitHub PR state and checks; no PR existed at this review point.

## Residual Risks

- The importer intentionally supports a first CycloneDX subset, not every BOM
  field.
- Graph merge/composition across multiple imported files is out of scope.
- SPDX and tool-native importers remain deferred.
