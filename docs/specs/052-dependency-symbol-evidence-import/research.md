# Research: Dependency And Symbol Evidence Import

## Decision: Extend Existing Tool-Output Import Before New Surfaces

Use the existing `selection.tool_outputs` and context `tool-registry.json`
shape as the first integration point. This is the smallest path that turns
standard producer evidence into relationship records without adding a scanner
runtime.

Rejected alternatives:

- Build native Java, PHP, Scala, Ruby, or Python analyzers in Portolan.
- Add a new daemon, MCP server, or LSP process for this slice.
- Treat context-only producer detection as assessed relationship evidence.

Why now: the Bigtop stress test showed that root/selection inventory alone is
not enough for Java-heavy relationship claims.

Reversibility: high. Additional producer families can be added through the same
contract or rejected without changing the product boundary.

Risk if wrong: Portolan remains evidence hygiene only and does not help agents
navigate non-Go landscapes.

Confidence: high.

## Decision: Dependency Evidence Is Metadata-Visible Unless Source Is Inspected

Dependency manifests, lockfiles, SBOMs, and dependency-tree exports are
metadata evidence. They can support dependency relationships, component
identity, and package-level coupling, but not source-level call flow or runtime
topology.

Rejected alternatives:

- Upgrade dependency evidence to `source-visible`.
- Infer service topology or modernization readiness from package dependencies.

Why now: this keeps PHP, JVM, and mixed-language outputs comparable without
claiming language semantics that the producer did not prove.

Reversibility: medium. Future source-backed producers may add
`source-visible` records with stricter evidence refs.

Risk if wrong: users may over-trust package relationships as architecture
truth.

Confidence: high.

## Decision: Symbol Evidence Is Relationship Evidence, Not Complete Call Graph

Symbol-index outputs can support document, symbol, ownership, reference, and
code-navigation relationships when those fields exist. They do not automatically
prove call paths, data flow, runtime communication, or architecture layers.

Rejected alternatives:

- Treat every symbol occurrence as a call graph edge.
- Require a single canonical symbol format before any support lands.

Why now: the existing symbol-index importer already preserves bounded symbol
metadata. The gap is connecting this evidence into map/context relationship
coverage.

Reversibility: high. Producer-specific fields can remain unsupported until a
fixture proves their meaning.

Risk if wrong: symbol facts may be mistaken for semantic program behavior.

Confidence: medium-high.

## Decision: Baseline Contamination Is A Product Gap

No-Portolan stress lanes must exclude both `.portolan/` and legacy root-level
`run/` artifacts. A lane that reads stale artifacts is contaminated evidence,
not a valid comparison.

Rejected alternatives:

- Only forbid `.portolan/`.
- Trust prompt wording without checking accessed artifacts.

Why now: the latest OpenCode baseline read legacy `run/map.md` while claiming
no Portolan use.

Reversibility: high. The rule affects stress protocol and generated guidance,
not core graph semantics.

Risk if wrong: future Cursor/Composer comparisons can overstate Portolan's
benefit or hide product gaps.

Confidence: high.

## Existing Open Source / Standard Output Fit

| Evidence family | Candidate formats/producers | Fit | Boundary |
| --- | --- | --- | --- |
| Component/dependency | CycloneDX/Syft, dependency tree exports, lockfiles | Good first target; already partially normalized | Metadata-visible, not runtime topology |
| Symbol/reference | SCIP, SemanticDB, Serena-style JSON, ctags-like indexes | Good import target when converted to bounded JSON | Symbol/reference evidence, not full call graph |
| Static findings | SARIF, Semgrep JSON, CodeQL SARIF | Useful as structural/static evidence | Findings only; no security certification |
| Catalog/API surfaces | Backstage, OpenAPI, AsyncAPI, Structurizr | Already summarized as relationship candidates | Declared relationship surfaces only |
