# PR 29 Review Packet

Date: 2026-06-01

PR: https://github.com/fcon-tech/portolan/pull/29

Branch: `codex/052-dependency-symbol-evidence-import`

Head: `f6418e195a1347c1ce83a3c501223e568d948719`

Base: `main` at `eb2602f363b64d44fe748b65caa5346ae6be78ce`

Review plane: PR-level correctness, requirements fit, evidence semantics,
path/output safety, tests, and readiness blockers.

## PR Scope

The PR implements spec 052 as a navigation-harness evidence import slice:

- Adds `symbol-index` as an additive selected `tool_outputs[].kind`.
- Normalizes selected CycloneDX/Syft dependency/SBOM outputs into
  metadata-visible relationship evidence.
- Normalizes selected symbol-index outputs into bounded document/symbol
  metadata and `owns` relationships, not a call graph.
- Preserves missing dependency/symbol producer families as `not_assessed`.
- Preserves malformed, empty, oversized, or unsupported producer output as
  `cannot_verify`.
- Adds `context prepare` relationship-candidate records for source-visible
  build/deploy surfaces.
- Updates generated answer/query guidance to avoid native PHP/JVM/Scala or
  runtime topology claims.
- Updates the Syft OSS-plan recipe to exclude `./.portolan/**` and `./run/**`
  so producer evidence does not include old stress artifacts.

## Changed Files

```text
M .specify/feature.json
M docs/product-backlog.md
M docs/specs/051-portolan-quality-boundary/tasks.md
A docs/specs/052-dependency-symbol-evidence-import/**
M internal/app/app_test.go
M internal/contextprep/contextprep.go
M internal/maprun/maprun.go
M internal/maprun/maprun_test.go
M internal/selection/selection.go
A internal/selection/selection_test.go
M schema/selection.schema.json
```

## Key Code Excerpts

Selected tool-output size and symbol bounds:

```go
var maxSelectedToolOutputBytes int64 = 64 * 1024 * 1024
var maxSelectedSymbolDocuments = 5000
var maxSelectedSymbols = 50000
```

Selected dependency/SBOM output:

```go
case "sbom", "dependency":
    // components become package nodes and producer edges
    // dependencies become depends-on edges
    // missing dependency refs become cannot_verify placeholders
```

Selected symbol-index output:

```go
case "symbol-index":
    // documents and symbols become metadata-visible unknown nodes
    // edges are owns only
    // edge reasons state "not a complete call graph"
```

Producer gap findings:

```go
No selected local dependency or SBOM producer output was available;
dependency relationships beyond native detectors remain not_assessed.

No selected local symbol-index producer output was available;
symbol/reference relationships remain not_assessed.
```

Context relationship candidates:

```go
kind: relationship-candidate
families: build-manifest, distribution-manifest, rpm-spec, deployment-manifest
evidence_state: source-visible
source_artifact: source-tree
reason: semantic parsing remains not_assessed
```

Syft OSS-plan excludes:

```go
Args: []string{
    root,
    "--exclude", "./.portolan/**",
    "--exclude", "./run/**",
    "-o", "cyclonedx-json=" + output,
}
```

## Verification

Local verification on current head:

- `go test -count=1 ./...`: passed
- `go vet ./...`: passed
- `jq empty schema/*.json internal/testfixtures/oss-adapter-contract/*.json .specify/feature.json`: passed
- `git diff --check`: passed
- `go run ./cmd/portolan context prepare --help`: passed
- `go run ./cmd/portolan map --help`: passed

Final clean stress run:

- Run: `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-154329`
- 18 repositories
- 30 relationship-candidate summaries:
  - 18 build-manifest summaries, 922 files
  - 10 deployment-manifest summaries, 65 files
  - 1 distribution-manifest, `bigtop.bom`
  - 1 rpm-spec summary, 19 files
- Syft/CycloneDX with clean exclusions:
  - 18,769 components
  - 5,357 dependency records
- Map:
  - 190,748 nodes
  - 200,203 edges
  - 274 findings
- Cursor + Composer 2.5 used final run only, surfaced candidate counts, and
  did not overclaim native language semantics or runtime topology.

## Live PR State At Creation

- PR: draft
- Merge state: `UNSTABLE`
- GitHub checks: pending
- Review approval: `not_assessed`
- Merge approval: `not_assessed`

## Current PR State Before Independent PR Review

- PR: draft
- Merge state: `CLEAN`
- GitHub checks: verified passing on head
  `f6418e195a1347c1ce83a3c501223e568d948719`
  - CI / Baseline: pass
  - CodeQL / Analyze (actions): pass
  - CodeQL / Analyze (go): pass
  - CodeQL / Analyze (python): pass
  - aggregate CodeQL status: pass
- Review approval: `not_assessed`
- Merge approval: `not_assessed`

## Constitution Constraints For This Review

- Local-first and read-only by default: no network calls, daemons, target
  mutation, credentials, or writes outside selected output directories unless
  explicitly approved.
- Evidence state honesty: preserve `source-visible`, `metadata-visible`,
  `runtime-visible`, `claim-only`, `unknown`, and `cannot_verify`; unknown and
  unverifiable facts are valid outputs.
- Complement, do not replace: import files and exported tool outputs before
  invoking or reimplementing scanners.
- Test-first behavior: CLI behavior, schema contracts, import normalization,
  graph derivation, and packet rendering need local tests.

## Review Questions

1. Does the PR preserve evidence-state honesty?
2. Does it accidentally claim native PHP/JVM/Scala semantics or runtime
   topology?
3. Are local-first/read-only and output-safety boundaries preserved?
4. Are tests and docs sufficient for this slice?
5. Are there blockers before moving the PR from draft to ready-for-review?

## Required Output

Return:

- findings ordered by severity: `critical`, `major`, `minor`
- verdict: `pass`, `pass_with_changes`, or `fail`
- `not_assessed`
- readiness recommendation: draft stays draft, ready-for-review PR, or blocker

Do not ask to read files. Treat this packet as the review input.
