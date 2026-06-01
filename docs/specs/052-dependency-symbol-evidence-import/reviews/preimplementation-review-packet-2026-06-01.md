# Pre-Implementation Review Packet: 052 Dependency And Symbol Evidence Import

Date: 2026-06-01

Branch: `codex/052-dependency-symbol-evidence-import`

Review plane: requirements fit, evidence semantics, security/privacy,
schema compatibility, testability, and product-boundary drift.

## Decision Gate

- Simpler/Faster: extend existing `selection.tool_outputs`, map
  normalization, context summaries, and gap surfaces before adding any new
  scanner, daemon, MCP server, or dependency.
- Blocking Edge Cases: mixed-language estates, absent producer outputs,
  malformed/stale/oversized/off-scope artifacts, ambiguous package or symbol
  identity, and baseline contamination from old `.portolan/` or root `run/`
  artifacts.
- Existing Open Source: import existing local outputs from CycloneDX/Syft,
  dependency trees or lockfiles, SCIP/SemanticDB/symbol-index-style exports,
  and SARIF/static-analysis producers. Do not build PHP, JVM, or other
  language-specific analyzers inside Portolan in this slice.

## Product Boundary

Portolan is a local-first, read-only navigation harness. It normalizes source,
metadata, runtime, and claim evidence into machine-readable artifacts for
agents. It must not claim complete language, architecture, service, or runtime
topology coverage from imported dependency or symbol evidence alone.

Allowed evidence states include `source-visible`, `metadata-visible`,
`runtime-visible`, `claim-only`, `unknown`, and `cannot_verify`. The reporting
surface also uses `not_assessed` for surfaces not evaluated.

## Spec Intent

The Bigtop Cursor + Composer stress run showed that Portolan helped evidence
discipline but left Java/Scala/Maven relationships broadly `not_assessed`.
The desired fix is not a JVM adapter or PHP adapter. The spec must make
dependency and symbol evidence format-oriented so PHP, JVM-heavy, and
mixed-language landscapes are acceptance cases for the same producer-output
contract.

## Current Spec Artifacts

- `spec.md`: defines dependency and symbol evidence import requirements.
- `plan.md`: states no dependency additions and no per-language scanner
  ownership.
- `research.md`: records OSS composition over reimplementation.
- `data-model.md`: defines producer outputs, normalized relationship evidence,
  summaries, and gaps.
- `contracts/relationship-evidence-import.md`: examples for dependency and
  symbol-index `tool_outputs`.
- `quickstart.md`: includes clean-start stress protocol and verification.
- `tasks.md`: implementation is split into dependency evidence, symbol
  evidence, bounded summaries/gaps, stress hygiene, and closeout.

## Current Implementation Observations

- `internal/selection/selection.go` validates `tool_outputs` but does not yet
  accept a `symbol-index` kind.
- `schema/selection.schema.json` mirrors the same `tool_outputs[].kind` enum.
- `internal/importer/cyclonedx.go` already imports standalone CycloneDX JSON
  into package nodes and `depends-on` edges with degraded missing-ref handling.
- `internal/importer/symbol_index.go` already imports standalone
  symbol-index-style JSON into document and symbol nodes and `owns` edges,
  explicitly saying semantic correctness and call relationships are not
  assessed.
- `internal/maprun/maprun.go` already normalizes selected `sbom` and
  `dependency` tool outputs into package nodes and `depends-on` edges, but its
  selected tool-output path does not yet normalize `symbol-index` outputs.
- `internal/maprun/maprun.go` still emits broad non-Go/runtime/lifecycle/service
  relationship `not_assessed` findings. This is acceptable only if imported
  dependency/symbol evidence is reported as bounded evidence and not as complete
  architecture coverage.

## Proposed First Implementation Slice

1. Add failing tests before behavior changes.
2. Keep dependency evidence as `metadata-visible` and relationship finding
   evidence, not runtime topology.
3. Add `symbol-index` as a selection/schema tool-output kind.
4. Normalize selected symbol-index producer output into bounded relationship
   graph evidence using document and symbol `owns` relationships, without
   claiming a complete call graph.
5. Ensure malformed dependency or symbol producer output becomes
   `cannot_verify` and does not count as assessed relationship coverage.
6. Add or update bounded summary/gap surfaces only as needed for this first
   evidence slice.

## Review Questions

1. Is this slice aligned with Portolan's local-first, read-only, OSS-composition
   product boundary?
2. Does it avoid the per-language adapter trap while still addressing PHP,
   JVM-heavy, and mixed-language acceptance cases?
3. Are any evidence-state or security/privacy risks missing before code starts?
4. Are the proposed tests sufficient for a first implementation slice?
5. Should any requirement or task be changed before implementation begins?

Return concise findings with severity `critical`, `major`, or `minor`, plus a
verdict of `pass`, `pass_with_changes`, or `block`.
