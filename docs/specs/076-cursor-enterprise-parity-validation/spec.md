# Feature Specification: Cursor Enterprise Parity Validation

**Feature Branch**: TBD

**Created**: 2026-06-02

**Status**: Backlog-only

**Input**: The user objective asks whether Portolan plus Cursor understands
Bigtop architecture like a human or enterprise code intelligence system. Prior
rubrics kept this as `cannot_verify` because runtime topology, full
symbol/reference graph, call graph, and broad producer coverage were missing or
partial. This slice re-runs the C1-C9 parity validation only after runtime and
producer-output closure are current.

## Requirements

- **FR-001**: Reuse and update the existing C1-C9 architecture parity rubric.
- **FR-002**: Run paired Cursor-only and Cursor-plus-Portolan stress tests on
  the same Bigtop question set.
- **FR-003**: Include current evidence from specs 074 and 075.
- **FR-004**: Score each criterion independently as `verified`, `partial`,
  `failed`, `cannot_verify`, or `not_assessed`.
- **FR-005**: Require independent non-GPT review of every upgraded criterion.
- **FR-006**: Forbid a broad "human/enterprise parity" claim unless every
  required criterion is verified or explicitly excluded with reviewed rationale.

## Success Criteria

- **SC-001**: Paired Cursor stress outputs and scoring ledger exist.
- **SC-002**: Any promoted claim is backed by current runtime/producer evidence.
- **SC-003**: If any required criterion remains partial or `cannot_verify`, the
  broad parity claim remains rejected and only narrower verified claims are
  allowed.

## Dependencies

- Spec 074 runtime topology health capture.
- Spec 075 producer output coverage closure.
