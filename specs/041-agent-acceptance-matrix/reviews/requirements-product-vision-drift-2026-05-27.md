# Requirements And Product Vision Drift Review: Agent Acceptance Matrix

Date: 2026-05-27
Reviewer: Codex local review
Spec: `specs/041-agent-acceptance-matrix/`
Base: `codex/productization-specs` at `872968d47fa2640c19c7baa4f7aec0c0205760c0`

## Decision Gate

- Simpler/Faster: implement this slice as a documented acceptance matrix,
  blind prompt, and spec-local ledger. Do not add a harness runner, daemon,
  network dependency, or new scanner.
- Blocking Edge Cases: absent harness access, UI-only workflows, off-topic
  agent output, target mutation, unsupported claims, and incomplete local
  inventory must stay visible as `blocked`, `failed`, `unknown`, or
  `not_assessed`.
- Existing Open Source: use external harnesses as acceptance clients. Do not
  reimplement Cursor, Codex, OpenCode, pi, Graphify, Git Nexus, or any agent
  orchestrator inside Portolan.

## Requirements Drift

- Backlog row P5-041 says Portolan's product claim must be tested across
  multiple agent harnesses and target shapes, with degraded lanes explicit.
- `spec.md` requires at least Codex, Cursor UI/Composer, and one non-Cursor
  lane; single-repo, multi-repo, and black-box/metadata-heavy target shapes;
  unsupported-claim and useful-next-action scoring; and no hidden prompt
  scaffolding.
- `plan.md`, `data-model.md`, `contracts/acceptance-matrix.md`, and
  `quickstart.md` agree that this is a documentation and validation workflow,
  not a Go behavior change.
- `tasks.md` is concrete and independently checkable.

Finding: no blocking requirements drift found.

## Product Vision Drift

- The slice strengthens the current product boundary: Portolan remains a
  local-first, read-only evidence-preparation layer for agents.
- The acceptance matrix prevents headless Cursor evidence from being broadened
  to UI Cursor/Composer or other harnesses without assessment.
- The slice does not make Portolan a harness, review gate, or hosted service.
- Product claims must remain scoped to assessed lanes only.

Finding: no blocking product-vision drift found.

## SpecKit Pipeline Drift

- `/speckit-clarify`: not rerun. Scope is already clear in `spec.md`; no
  blocking ambiguity remains.
- `/speckit-plan`: equivalent artifacts exist: `plan.md`, `research.md`,
  `data-model.md`, `contracts/`, and `quickstart.md`.
- `/speckit-tasks`: `tasks.md` exists and names concrete artifacts.
- `/speckit-analyze`: manual analyze disposition is required before
  implementation and will be recorded in this review directory.
- `/speckit-review-disposition`: this review plus the analyze disposition
  satisfy the pre-implementation review-disposition requirement.

Finding: proceed to implementation after the analyze disposition is recorded.

## Scope Lock

Owned paths:

- `specs/041-agent-acceptance-matrix/`
- `docs/agent/ACCEPTANCE.md`
- narrow `docs/product-claims.md` updates if supported by evidence

Out of scope:

- specs 040, 042, 043, and 044
- new Go behavior
- PR merge or branch cleanup
