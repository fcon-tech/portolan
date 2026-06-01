# Post-Slice Review Packet: 052 Dependency And Symbol Evidence Import

Date: 2026-06-01

Branch: `codex/052-dependency-symbol-evidence-import`

Review plane: code correctness, requirements fit, evidence-state semantics,
schema compatibility, security/privacy, and test gaps.

## Implemented Slice

- `selection.tool_outputs[].kind` now accepts `symbol-index`.
- `schema/selection.schema.json` includes the additive `symbol-index` enum
  value.
- Selected map `tool_outputs` normalize `symbol-index` JSON into document and
  symbol nodes plus `owns` relationships.
- Selected dependency/SBOM outputs retain `metadata-visible` dependency
  relationships and now report repository scope in the finding summary when
  `repository` is set.
- Malformed or oversized selected tool output is `cannot_verify` with zero
  confidence and no assessed relationship edges.
- Map findings include explicit absent dependency/SBOM and absent symbol-index
  producer gaps as `not_assessed`.
- `context prepare` now detects `symbol-index`/`symbols`/SCIP/LSIF-style files
  as `symbol-index`, summarizes document and symbol counts in
  `tool-registry.json`, emits `symbol-index` evidence-index records, and removes
  the `symbol-index` gap when such evidence exists.
- Generated answer contracts now say dependency and symbol producer evidence
  does not mean Portolan has native PHP/JVM/Scala language semantics.

## Key Code Areas

- `internal/selection/selection.go`
- `schema/selection.schema.json`
- `internal/maprun/maprun.go`
- `internal/contextprep/contextprep.go`
- `internal/maprun/maprun_test.go`
- `internal/selection/selection_test.go`
- `internal/app/app_test.go`

## Evidence-State Rules To Check

- Missing producer family => `not_assessed`.
- Present but unreadable, malformed, oversized, unsupported, or unbounded
  producer output => `cannot_verify`.
- Dependency and symbol producer evidence => `metadata-visible`, not
  `runtime-visible`.
- Symbol-index records are document/symbol ownership only, not complete call
  graph or semantic correctness.
- No per-language scanner ownership claim.

## Verification Already Run

```text
go test -count=1 ./internal/selection ./internal/maprun ./internal/contextprep ./internal/app
go test -count=1 ./...
go vet ./...
jq empty schema/*.json internal/testfixtures/oss-adapter-contract/*.json .specify/feature.json
git diff --check
go run ./cmd/portolan map --help
go run ./cmd/portolan context prepare --help
```

All commands passed.

## Review Questions

1. Is the symbol-index selected-output normalization bounded and honest enough
   for this slice?
2. Does the `code-index` to `symbol-index` context gap rename create backward
   compatibility or product-language risk?
3. Are the `cannot_verify` and `not_assessed` transitions correct?
4. Are there security/privacy risks from symbol names, paths, registry URLs, or
   hashes that are not covered by local-only boundaries?
5. Are there test gaps that should block this implementation before stress
   testing?

Return concise findings with severity `critical`, `major`, or `minor`, plus a
verdict of `pass`, `pass_with_changes`, or `block`. Use only this packet.
