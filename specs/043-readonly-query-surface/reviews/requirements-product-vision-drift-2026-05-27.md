# Requirements And Product Vision Drift Review

Spec: `specs/043-readonly-query-surface/`
Date: 2026-05-27
Reviewer: Codex local repo-grounded lane

## Decision Gate

- Simpler/Faster: implement a CLI-only query surface over existing bundle artifacts; do not add MCP, daemon lifecycle, graph traversal, or new dependencies in this slice.
- Blocking Edge Cases: malformed bundle files, weak evidence states, missing findings, large JSONL lines, symlinked bundle artifacts, and agents treating `unknown` or `not_assessed` as success.
- Existing Open Source: no new OSS component is required for this slice. Existing `graph slice` and map bundle artifacts are sufficient; future MCP should reuse the CLI contract after it is stable.

## Status Reconstruction

- Backlog row P5-043 says `Ready for implementation`.
- `spec.md` says `Ready for implementation`.
- `plan.md`, `research.md`, `data-model.md`, `contracts/query-surface.md`, `quickstart.md`, and `tasks.md` exist.
- `tasks.md` is unchecked and no prior `reviews/` directory existed.
- No `internal/query/` implementation exists on the requested base.
- Existing related implementation is `portolan graph slice`, which writes bounded graph slices to a selected output file. Spec 043 needs a narrower query surface that writes JSON to stdout and avoids loading full graph artifacts for finding/gap questions.

Assessment: surfaces are coherent for implementation. No stale implementation was found.

## Requirements Drift

- FR-001 through FR-007 are represented in `tasks.md`.
- The contract limits the first command family to `query findings` and `query gaps`; arbitrary graph traversal and MCP are explicitly out of scope.
- The quickstart uses map bundle output as input and does not require network, credentials, daemon behavior, or target mutation.
- The only non-blocking ambiguity is whether `query gaps` should read only `coverage.json` or also weak findings. Conservative decision: include weak records from both `coverage.json` and `findings.jsonl`, because the user story asks for `unknown`, `cannot_verify`, and `not_assessed` records and `not_assessed` is commonly emitted in findings.

## Product Vision Drift

- Local-first/read-only: aligned. The query surface reads an existing local bundle and writes JSON to stdout only.
- Evidence honesty: aligned if weak states remain visible and reasons are not synthesized as success.
- Agent-facing toolbox: aligned. The feature lets agents ask bounded questions without loading `graph.json`.
- Harness independence: aligned. The output is plain CLI JSON and does not depend on Cursor, Codex, Claude, OpenCode, pi, or MCP.
- OSS composition posture: aligned. This slice does not reimplement an external scanner and does not add dependencies.

## SpecKit Pipeline Drift

- Clarify: skipped before this review because `spec.md` has no clarification markers and the remaining ambiguity is non-blocking.
- Plan: present.
- Tasks: present and concrete.
- Analyze: no generated analyze artifact existed at intake; manual analyze disposition will be recorded before coding.
- Review disposition: this file records the pre-implementation requirements/product-vision review.

## Findings

- accepted: `query gaps` should include weak findings as well as weak coverage records to preserve `not_assessed`.
- accepted: malformed required artifacts should fail the query rather than return partial success.
- rejected: implementing MCP now. It would add lifecycle/security surface outside the spec.

Implementation may proceed after the analyze disposition is recorded.
