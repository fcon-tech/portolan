# Requirements And Product-Vision Drift Review - 2026-05-27

Mode: REVIEW

## Status Reconstruction

- Backlog row: P5-042 `specs/042-agent-adapter-layer/` is `Ready for implementation`.
- Spec status: `Ready for implementation`.
- Plan/tasks: `plan.md`, `research.md`, `data-model.md`, `contracts/adapter-layer.md`, `quickstart.md`, and `tasks.md` exist and are concrete.
- Prior review artifacts: none existed before this review; `reviews/` was absent.
- Current implementation surface: `internal/adapter/adapter.go` validates generic OSS adapter contracts only. It has no producer-confidence mapping support yet.

## Decision Gate

- Simpler/Faster: extend the existing adapter contract with a bounded confidence mapping and add profiles/fixtures, instead of building a Graphify importer or native graph scanner.
- Blocking Edge Cases: external producers may emit inferred/ambiguous facts, source snippets, paths outside the selected target, remote/MCP behavior, or schemas that drift. These must stay weak evidence and must not become `source-visible`.
- Existing Open Source: Graphify, SCIP/Serena-style symbol surfaces, and Repomix are better treated as producers or profiles first. Portolan should import/validate local output contracts before invoking or vendoring any tool.

## Requirements Drift

- FR-001 through FR-006 align with the backlog and constitution.
- FR-007 mentions `docs/oss-composition.md`; the user ownership list does not explicitly include it, but the task also requires updating docs/product claims only if supported. Updating `docs/oss-composition.md` is strictly required by the active spec and will be kept narrow.
- US2 asks for a Graphify-like validation path. The existing adapter contract cannot validate actual full Graphify graph payloads safely without a broader schema/import design, but it can validate a Graphify adapter contract and confidence mapping. That is the smallest implementation consistent with the spec assumption: "validation/profile-only if full import would require a broader schema change."

## Product-Vision Drift

- The slice is aligned with Portolan's boundary: local-first, read-only, harness-independent, and complementary to existing code intelligence tools.
- The feature must not describe Portolan as replacing Graphify, Git Nexus, Serena, Repomix, Sourcegraph, or a harness.
- Graphify `EXTRACTED` is producer metadata, not Portolan direct source inspection. It may become `metadata-visible` with provenance, but not `source-visible`.
- Repomix packed content is agent context, not architecture truth.
- Symbol index exports can support symbol identity/navigation evidence; semantic correctness and architecture relationships remain unverified unless separately observed.

## SpecKit Pipeline Drift

- `/speckit-clarify`: skipped by the prepared spec; no `[NEEDS CLARIFICATION]` markers and assumptions bound full import as optional.
- `/speckit-plan`: satisfied by `plan.md`, `research.md`, `data-model.md`, contracts, and quickstart.
- `/speckit-tasks`: satisfied by concrete `tasks.md`.
- `/speckit-analyze`: absent before implementation; recorded manually in `analyze-disposition-2026-05-27.md`.
- `/speckit-review-disposition`: this review and subsequent model review dispositions are recorded under this spec's `reviews/` directory.

## Finding Disposition Before Coding

- No scope-blocking mismatch found.
- Accepted constraint: implement a minimal Graphify adapter-contract validation/profile extension, not a full graph importer.
- Accepted constraint: no new dependencies, no external producer execution, no network behavior in Portolan.
