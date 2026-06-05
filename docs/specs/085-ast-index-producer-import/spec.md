# Feature Specification: AST Index Producer Import

**Feature Branch**: `codex/084-tool-adoption-specs`

**Created**: 2026-06-04

**Status**: Draft; backlog-only. Requires `plan.md`, `research.md`, and
`tasks.md` before implementation because this touches external tool output
import and evidence semantics.

**Input**: The external tool review identified `defendend/Claude-ast-index-search`
(`ast-index`) as the strongest current fit for a Portolan symbol/reference
producer candidate, while CodeGraph remains useful but riskier because its
default workflow mutates the target repository and emphasizes MCP/watch
operation.

## User Scenarios & Testing

### User Story 1 - Import Explicit Local ast-index Output (Priority: P1)

An operator who has already run ast-index locally can point Portolan at selected
ast-index outputs and receive normalized symbol, reference, file, and module
evidence without Portolan executing or installing ast-index.

**Why this priority**: This directly addresses the current full
symbol/reference/call-graph gap while preserving Portolan's composition model.

**Independent Test**: A local fixture containing bounded ast-index JSON output
or a minimal SQLite database is imported into a Portolan map bundle with
producer metadata and evidence limitations.

**Acceptance Scenarios**:

1. **Given** a selected root and supplied ast-index output for that root,
   **When** Portolan imports the output, **Then** it records file, symbol,
   reference, module, and module-dependency records as producer-backed metadata
   with provenance.
2. **Given** no supplied ast-index output, **When** Portolan prepares context,
   **Then** it recommends ast-index only as an approval-gated acquisition step
   and keeps the symbol/reference family unobserved.

---

### User Story 2 - Preserve Reference Resolution Limits (Priority: P1)

An agent can use imported ast-index relationships without confusing
name/string-based references with a fully resolved call graph.

**Why this priority**: ast-index is valuable, but overclaiming semantic
resolution would undermine Portolan's evidence model.

**Independent Test**: Imported reference records include an explicit limitation
or resolution marker that prevents call-graph parity, runtime topology, or
complete architecture claims from being promoted.

**Acceptance Scenarios**:

1. **Given** ast-index `refs`, `callers`, or dependency-style output, **When**
   Portolan normalizes it, **Then** unresolved, string-based, or partial
   resolution status remains visible in the artifact and answer guidance.
2. **Given** an agent asks whether Portolan has a complete call graph, **When**
   only ast-index output is available, **Then** the answer remains bounded to
   imported reference and dependency evidence.

---

### User Story 3 - Reject Unsafe Or Mismatched Outputs (Priority: P2)

Portolan rejects, blocks, or marks unverifiable ast-index outputs when they do
not match the selected root, schema, or privacy boundary.

**Why this priority**: External outputs can be stale, oversized, generated for a
different root, or contain sensitive data.

**Independent Test**: Fixtures with out-of-root paths, root hash mismatches,
unsupported schema shape, malformed JSON, and oversized records are rejected or
classified without panics and without graph promotion.

**Acceptance Scenarios**:

1. **Given** an ast-index database for another repository, **When** Portolan
   imports it against the current selection, **Then** records are rejected or
   marked `cannot_verify` instead of silently attaching to the wrong files.
2. **Given** output contains source snippets or sensitive payload-like content,
   **When** fixtures or committed test data are generated, **Then** private
   content is excluded or redacted.

### Edge Cases

- ast-index output was generated for a different canonical root or an older
  revision.
- The operator supplies the ast-index cache database path, a JSON CLI export, or
  both, and their contents disagree.
- ast-index schema or CLI JSON changes after the reviewed release snapshot.
- Paths are absolute, symlinked, out-of-root, deleted, or no longer readable.
- The output is very large and needs budgets or sharding before import.
- Reference rows name a target symbol but do not prove semantic resolution.
- ast-index commands for watch, hooks, MCP install, or root registration exist
  but must not be run by Portolan in this slice.

## Requirements

### Functional Requirements

- **FR-001**: Portolan MUST import only explicit, local ast-index outputs selected
  by the operator; it MUST NOT execute ast-index, install ast-index, start
  watchers, install hooks, register MCP servers, or mutate target repositories.
- **FR-002**: The importer MUST record producer provenance, including tool name,
  tool version when available, output type, selected root, output path, import
  time, schema/version signal when available, and any supplied command metadata.
- **FR-003**: Imported file, symbol, reference, module, and module-dependency
  facts MUST default to `metadata-visible` producer evidence unless Portolan
  independently reads source under the selected root.
- **FR-004**: Imported ast-index references MUST expose their resolution limit,
  including when they are name-based, string-based, unresolved, partial, or not
  equivalent to a complete semantic call graph.
- **FR-005**: The importer MUST reject, block, or classify as `cannot_verify`
  outputs whose paths, roots, schema, or freshness cannot be reconciled with the
  selected Portolan input.
- **FR-006**: The importer MUST preserve Portolan's allowed evidence states and
  MUST NOT introduce ast-index-specific evidence states into the public graph
  schema without an explicit schema plan.
- **FR-007**: The importer MUST treat source snippets, prompts, credentials,
  provider URLs, and customer-sensitive payloads as privacy hazards and exclude
  them from committed fixtures.
- **FR-008**: Context guidance MUST keep CodeGraph as a separate candidate until
  a later plan resolves target mutation, output stability, and evidence-state
  mapping for CodeGraph output.
- **FR-009**: Baseline checks and focused importer tests MUST cover valid output,
  malformed output, mismatched root, out-of-root path, stale schema, and
  reference-limit preservation.

### Key Entities

- **ast-index Producer Output**: A local JSON export or SQLite database produced
  by ast-index outside Portolan's execution path.
- **Imported Symbol Record**: A normalized symbol or definition-like record with
  path, language/kind when available, producer provenance, and evidence state.
- **Imported Reference Record**: A normalized reference or caller/callee-like
  record with explicit resolution limits and provenance.
- **Producer Provenance**: The metadata that lets an agent distinguish local
  imported evidence from Portolan-native scanning and from unverified tool
  recommendations.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Focused tests import a valid bounded ast-index fixture and produce
  graph/context records with producer provenance.
- **SC-002**: Focused tests prove malformed, out-of-root, mismatched, and stale
  outputs do not become trusted graph facts.
- **SC-003**: Answer guidance generated from imported ast-index data still
  refuses complete call-graph or architecture-parity claims unless separately
  evidenced.
- **SC-004**: No external tool execution, install, hook, watcher, MCP
  registration, or target mutation occurs during Portolan tests.

## Assumptions

- ast-index is the first symbol/reference producer import candidate because it
  has a stronger read-only integration path than CodeGraph when output is
  supplied explicitly.
- CodeGraph adoption should remain profile-level until a separate plan proves
  its target mutation and output-format risks are acceptable.
- This slice does not require Portolan to acquire real Bigtop output; real
  producer execution remains a separate approval-gated validation step.
