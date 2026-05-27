# Feature Specification: Readonly Query Surface

**Feature Branch**: `043-readonly-query-surface`

**Created**: 2026-05-27

**Status**: Ready-for-review PR #20; query smoke and GitHub CI verified; merge approval not_assessed

**Input**: Agent scenario gap: Portolan emits useful bundles, but agents still read files manually instead of asking bounded questions such as "what evidence supports this claim?" or "why is this unknown?"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Query Evidence For A Bundle (Priority: P1)

An agent can run a read-only query command against an existing map bundle and receive bounded records without opening the full `graph.json`.

**Why this priority**: Agent ergonomics improve when evidence is accessible by narrow query, not only by raw artifact reading.

**Independent Test**: Run the query command against a fixture map bundle and verify bounded JSON output.

**Acceptance Scenarios**:

1. **Given** a map bundle exists, **When** an agent queries findings by kind, **Then** Portolan returns bounded matching records and artifact references.
2. **Given** the query would exceed the default limit, **When** output is produced, **Then** it is truncated with a visible truncation indicator.

---

### User Story 2 - Ask Why A Surface Is Unknown (Priority: P1)

An agent can query gaps and weak evidence states to explain what is missing before answering.

**Why this priority**: The product value is preserving uncertainty, so uncertainty must be first-class in the query surface.

**Independent Test**: Query a bundle with `unknown`, `cannot_verify`, or `not_assessed` records and verify reasons are included.

**Acceptance Scenarios**:

1. **Given** coverage includes external completeness as `unknown`, **When** the agent queries gaps, **Then** the result includes the reason and source artifact.
2. **Given** runtime topology is not assessed, **When** relationship gaps are queried, **Then** the result says `not_assessed` rather than inferring topology.

---

### User Story 3 - Provide Stable Agent References (Priority: P2)

An agent can cite stable `portolan://`-style references in answers without requiring a daemon or network service.

**Why this priority**: Stable references let harnesses and future MCP surfaces interoperate with the same local bundle.

**Independent Test**: Inspect query output and verify each record includes stable local reference fields.

**Acceptance Scenarios**:

1. **Given** a finding is returned, **When** the agent cites it, **Then** the citation includes bundle path, artifact, and record ID.
2. **Given** future MCP is not implemented, **When** the CLI query runs, **Then** it remains local and read-only.

### Edge Cases

- Missing or malformed bundle files.
- Query limit is zero, negative, or too large.
- Query asks for a missing repo, edge kind, or finding kind.
- Artifact paths include symlinks or outside-bundle references.
- Output contains records with mixed evidence states.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The feature MUST add a read-only query surface over existing map bundles.
- **FR-002**: Query output MUST be bounded by a documented default limit and optional explicit limit.
- **FR-003**: Query output MUST include evidence state, reason when weak, source artifact, and stable record reference.
- **FR-004**: Query behavior MUST not require a daemon, network access, credentials, or target repository mutation.
- **FR-005**: Missing, malformed, or unsupported bundle input MUST return a clear error without partial success claims.
- **FR-006**: The feature MUST keep future MCP compatibility as a contract, not a daemon implementation in this slice.
- **FR-007**: Agent instructions MUST tell users when to prefer query commands over full graph loading.

### Key Entities

- **Query Request**: Bundle path, query family, filter, and limit.
- **Query Result**: Bounded record list with evidence and stable references.
- **Portolan Reference**: Local URI-like identifier for bundle artifact records.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Querying findings by kind returns bounded JSON without reading full `graph.json` manually.
- **SC-002**: Querying gaps returns `unknown`, `cannot_verify`, and `not_assessed` records with reasons.
- **SC-003**: Query output includes stable references for every returned record.
- **SC-004**: Baseline checks and focused query tests pass.

## Assumptions

- The first query surface can be CLI-only; MCP is deferred until the CLI contract is stable.
- Existing `graph-index.json`, `summary.json`, `coverage.json`, and `findings.jsonl` are sufficient for the first query families.
