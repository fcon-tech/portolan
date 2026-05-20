# Feature Specification: Local Evidence Graph MVP

**Feature Branch**: `001-local-evidence-graph`
**Created**: 2026-05-20
**Status**: Implemented
**Input**: Product backlog P0-001: run a local read-only scan over a selection file and emit a JSON evidence graph.

## User Scenarios & Testing

### User Story 1 - Generate Graph From Local Selection (Priority: P1)

A platform lead points Portolan at a local selection file that lists repositories and optional evidence files. Portolan reads only those local paths and writes an evidence graph JSON file.

**Why this priority**: Without a runnable local graph, Portolan is only documentation.

**Independent Test**: Run Portolan against a fixture selection containing one repository and one claim file. The command exits 0 and writes a schema-valid graph with evidence states.

**Acceptance Scenarios**:

1. **Given** a selection file with one readable repository path, **When** `portolan scan --selection selection.json --out graph.json` runs, **Then** the output graph includes a repository node with `source-visible` evidence.
2. **Given** a selection file with a declared but missing metadata file, **When** the scan runs, **Then** the graph records an `unknown` or `cannot_verify` fact with a reason instead of failing the whole run.
3. **Given** no network permissions or credentials, **When** the scan runs, **Then** Portolan completes using only local filesystem reads.

### User Story 2 - Keep Claims Lower Authority Than Observations (Priority: P1)

A reviewer can distinguish observed facts from human or tool claims in the graph.

**Why this priority**: The product is only trustworthy if it preserves evidence strength.

**Independent Test**: A fixture with a claim file but no source evidence produces `claim-only` facts and does not label them `source-visible`.

**Acceptance Scenarios**:

1. **Given** a claim file says a service depends on another system, **When** no source or metadata evidence supports it, **Then** the relationship is recorded as `claim-only`.
2. **Given** source evidence later supports the same relationship, **When** the scan reruns, **Then** the relationship records observed evidence separately from the original claim.

### User Story 3 - Machine Output Is Stable Enough For Follow-Up Tools (Priority: P2)

A downstream tool can parse the output without scraping human text.

**Why this priority**: Portolan is a normalizer; the graph contract is the product substrate.

**Independent Test**: `jq empty graph.json` succeeds and the graph validates against the evidence graph schema.

**Acceptance Scenarios**:

1. **Given** a successful scan, **When** a parser reads `graph.json`, **Then** the top-level fields match the committed schema.
2. **Given** multiple nodes and edges, **When** each item is inspected, **Then** each has `id`, `kind`, `label` or relation fields, and evidence.

## Edge Cases

- Selection path does not exist: return usage/data error and no partial graph unless `--allow-partial` exists in a later spec.
- Repository path is readable but not Git: create a generic filesystem source node or `cannot_verify`, depending on selected target kind.
- Symlink points outside selected root: record `cannot_verify` unless explicitly
  allowed by selection policy; do not follow it for evidence discovery.
- Duplicate target IDs: fail with a clear validation error.
- Output path already exists: fail unless explicit `--force` is provided. The
  output path must not be a symlink, must not be a directory, and must not be
  inside a selected repository root.
- Claim file has malformed JSON: record `cannot_verify` for that claim source and continue if other sources are valid.

## Requirements

### Functional Requirements

- **FR-001**: System MUST accept a local JSON selection file.
- **FR-002**: System MUST read only paths named by the selection file or paths discovered under selected repository roots.
- **FR-003**: System MUST emit a JSON evidence graph using `schema/evidence-graph.schema.json`.
- **FR-004**: Every node and edge MUST carry an evidence state and source.
- **FR-005**: System MUST preserve `claim-only`, `unknown`, and `cannot_verify` without upgrading them to observed evidence.
- **FR-006**: System MUST not make network calls during the scan.
- **FR-007**: System MUST not modify target repositories.
- **FR-008**: CLI errors MUST go to stderr and use non-zero exit codes.
- **FR-009**: Successful output MUST be parseable by `jq`.
- **FR-010**: Fixtures MUST cover source-visible, claim-only, unknown, and cannot-verify outputs.

### Key Entities

- **Selection**: Local input document naming targets and optional evidence files.
- **Target**: Repository, metadata export, runtime export, or claim source selected for scanning.
- **Evidence Graph**: Output document containing nodes and edges with evidence.
- **Evidence State**: Authority level for a graph fact.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A fixture scan completes locally in under 2 seconds on a small repository fixture.
- **SC-002**: Output graph parses with `jq empty` and fixture tests assert the
  committed schema contract. Full JSON Schema runtime validation is deferred
  until a dependency is justified.
- **SC-003**: At least four evidence states appear in fixture coverage: `source-visible`, `claim-only`, `unknown`, `cannot_verify`.
- **SC-004**: Re-running the same scan over unchanged fixtures produces semantically identical graph content.

## Assumptions

- Initial selection files are JSON.
- Initial output is JSON only; human packets are handled by a later feature.
- Git repository inspection may use the local filesystem and Git metadata, but no remotes.
- Schema validation may start with syntax and fixture tests before adding a full JSON Schema validator dependency.
