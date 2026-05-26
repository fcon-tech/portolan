# Feature Specification: Agent-Scale Map Summary

**Feature Branch**: `024-agent-scale-map-summary`

**Created**: 2026-05-26

**Status**: Implemented

**Input**: Blind Cursor Agent acceptance runs showed that large `graph.json`
artifacts are impractical as first-pass agent context and that repeated
placeholder findings can confuse reports.

## Requirements

- **FR-001**: `portolan map` MUST emit `summary.json` alongside `run.json`,
  `coverage.json`, `graph.json`, `findings.jsonl`, and `map.md`.
- **FR-002**: `summary.json` MUST include bounded machine-readable counts for
  graph nodes/edges, evidence states, node kinds, findings, coverage, weak
  coverage records, repository records, skipped surfaces, and warnings.
- **FR-003**: `summary.json` MUST include conservative file surface counts for
  inventory nodes so agents can distinguish source, manifest, workflow,
  container, config, docs, tests, generated/lock, and unknown file surfaces
  without loading the full graph first.
- **FR-004**: `portolan map` MUST not emit duplicate finding IDs in
  `findings.jsonl` or the derived `map.md`.
- **FR-005**: Summary generation MUST preserve `unknown`, `cannot_verify`, and
  `not_assessed` states; it MUST NOT convert missing evidence into success.
- **FR-006**: The implementation MUST remain local-first and read-only and MUST
  NOT add network calls, daemons, credentials, or target repository mutation.

## Success Criteria

- **SC-001**: A map run writes parseable `summary.json`.
- **SC-002**: A map run with unsupported relationship sub-surfaces has unique
  finding IDs.
- **SC-003**: Agents can inspect `summary.json` first and avoid treating
  `graph.json` as the primary prompt-sized artifact.
