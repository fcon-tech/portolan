# Feature Specification: Map Command And Artifact Bundle

**Feature Branch**: `009-map-command-artifacts`
**Created**: 2026-05-20
**Status**: Prepared; gated by Bigtop smoke
**Input**: Product decision to prepare the one-command map contract, but start
implementation only after the immediate Bigtop smoke proves the gap.

## User Scenarios & Testing

### User Story 1 - One Command For Agents (Priority: P1)

An agent can run one local command against a repository root and receive a
stable output directory with the files it needs to report from evidence.

**Independent Test**: `portolan map --root testdata/map-command/repo --out
<dir> --force` writes `run.json`, `graph.json`, `findings.jsonl`, and `map.md`.

**Acceptance Scenarios**:

1. **Given** a readable local repo root, **When** `portolan map` runs, **Then**
   the output directory contains all required artifacts.
2. **Given** the output directory exists, **When** `--force` is omitted, **Then**
   the command refuses to overwrite it.
3. **Given** a repo root is missing, **When** map runs, **Then** it exits
   non-zero and writes no partial artifact bundle.

### User Story 2 - Findings Are Agent-Consumable (Priority: P1)

An agent can read `findings.jsonl` and report relationships, duplication,
configuration surfaces, technical debt, unknowns, and cannot-verify inputs
without scraping Markdown.

**Independent Test**: Fixture output contains JSONL findings with id, kind,
summary, severity, evidence state, source pointers, confidence, and
not_assessed/unknown/cannot_verify where applicable.

### User Story 3 - Run Metadata Is Auditable (Priority: P2)

A reviewer can inspect `run.json` and see what Portolan ran, skipped, and could
not assess.

**Independent Test**: `run.json` records command, version, root, output path,
artifact paths, enabled surfaces, skipped surfaces, and verification warnings.

## Edge Cases

- Output path is inside the mapped root: allowed only for `.portolan/` or an
  explicit output directory, and Portolan must avoid recursively mapping its own
  generated artifacts.
- Output path already exists: fail unless `--force` is passed.
- Root contains no recognized project files: still write `run.json`,
  `graph.json`, `findings.jsonl`, and `map.md` with `unknown` or `not_assessed`
  surfaces.
- Existing scan/import/packet code fails for one surface: map should preserve a
  `cannot_verify` or `not_assessed` finding rather than silently dropping it.
- Network, daemon behavior, credential reads, and target mutation remain out of
  scope.

## Requirements

- **FR-001**: System MUST add `portolan map --root <dir> --out <dir> [--force]`.
- **FR-002**: The command MUST read local filesystem inputs only.
- **FR-003**: The command MUST write `run.json`, `graph.json`,
  `findings.jsonl`, and `map.md`.
- **FR-004**: The command MUST write no partial bundle when startup validation
  fails.
- **FR-005**: `findings.jsonl` MUST be machine-readable JSON Lines.
- **FR-006**: Every finding MUST include id, kind, summary, evidence state,
  evidence source, confidence, and status.
- **FR-007**: `run.json` MUST record command, version, root, output path,
  artifact paths, enabled surfaces, skipped surfaces, and warnings.
- **FR-008**: `map.md` MUST be generated from graph/findings artifacts, not a
  separate rescan.
- **FR-009**: The command MUST avoid mapping generated `.portolan/run` artifacts
  as source inputs.
- **FR-010**: The first map implementation MAY produce basic inventory and
  placeholder `not_assessed` findings for detectors that are specified but not
  implemented yet.

## Success Criteria

- **SC-001**: Fixture map command exits 0 and writes all required artifacts.
- **SC-002**: `jq empty` succeeds for `run.json`, `graph.json`, and each JSONL
  finding.
- **SC-003**: `map.md` includes the same finding counts as `findings.jsonl`.
- **SC-004**: The command refuses to overwrite an existing output directory
  without `--force`.
- **SC-005**: The artifact bundle can be consumed by the agent skill pack from
  spec 008.

## Assumptions

- The first map command orchestrates existing scan/packet/import primitives and
  writes placeholder finding categories when deeper detectors are not yet
  implemented.
- Rich relationship, duplication, configuration, and technical-debt findings are
  implemented in later specs.
