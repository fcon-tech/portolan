# Feature Specification: Context Evidence Index

**Feature Branch**: `032-context-evidence-index`

**Created**: 2026-05-26

**Status**: Implemented

**Input**: Product validation showed that Cursor should not assemble the context
pack from disconnected files before it can answer CTO-level questions. Portolan
needs one bounded context entrypoint that points at repositories, OSS/tool
outputs, and gaps without copying private source.

## Requirements

- **FR-001**: `portolan context prepare` MUST emit `evidence-index.jsonl`.
- **FR-002**: Each evidence-index record MUST include kind, family, status,
  evidence state, source artifact, source id, and summary.
- **FR-003**: Repository records MUST link back to `repos.json`.
- **FR-004**: OSS/tool-output records MUST link back to `tool-registry.json`.
- **FR-005**: Gap records MUST link back to `gaps.jsonl` and preserve
  `unknown`, `cannot_verify`, or `not_assessed`.
- **FR-006**: The index MUST NOT include raw source snippets, secret values, or
  network-derived content.
- **FR-007**: Agent docs and Cursor rules MUST list `evidence-index.jsonl` as a
  required context artifact.

## Success Criteria

- A context-preparation run over the existing multi-repo fixture writes an
  evidence index with repository, tool-output, and gap records.
- The generated answer contract and agent brief tell Cursor to read the bounded
  evidence index before making claims.
- Existing context pack behavior, map behavior, and OSS plan behavior remain
  compatible.
