# Requirements, Product, And Constitution Drift Review

Date: 2026-06-09

Spec: `docs/specs/087-bigtop-brownfield-preflight/`

Branch: `codex/087-bigtop-brownfield-preflight`

## Scope

Review of `spec.md`, `plan.md`, `research.md`, `data-model.md`, contracts,
`quickstart.md`, `tasks.md`, `docs/brownfield-preflight-roadmap.md`,
`docs/product-backlog.md`, `docs/mvp.md`, `docs/product-boundary.md`, and
`.specify/memory/constitution.md` before implementation.

## Requirements Drift

- `docs/product-backlog.md` P7-087 requires a local Bigtop preflight bundle with
  target shape, current evidence, candidate tools, blind spots, and agent
  handoff before external install/execution or AI coding work.
- `spec.md` mirrors that scope through US1-US4 and FR-001 through FR-010.
- `plan.md` narrows implementation to `portolan preflight`, `internal/preflight`,
  schema, and local artifacts.
- `tasks.md` is implementation-oriented, story-scoped, and names focused tests,
  verification, opencode reviews, and PR closeout.

Disposition: no blocking requirements drift found. The prior 084/085/086 draft
wave is intentionally parked/deferred by backlog and spec language.

## Product Drift

- The roadmap no longer treats evidence reduction, static HTML, external tool
  profiles, or importer work as the product sequence.
- The active product promise is Brownfield Preflight: orient the operator/agent,
  select useful local tools, preserve blind spots, and hand bounded context to
  the agent.
- The plan avoids competing with Graphify, Understand Anything, GitNexus, or
  enterprise code-intelligence tools. It uses them as possible toolchain
  recommendations or imported outputs.

Disposition: no blocking product drift found. The slice is intentionally narrow
and starts with Bigtop as a demonstration target, not a special product mode.

## Constitution Drift

- Local-first/read-only: preserved. The command writes only to selected output
  paths and must not run network/install/mutation/global config/MCP/daemon/watch
  behavior by default.
- Evidence honesty: preserved. Candidate tools and next actions remain
  recommendations, not graph evidence.
- Complement existing tools: preserved. Plan favors tool selection and
  normalization over scanner reimplementation.
- SpecKit before implementation: now satisfied for plan/tasks readiness once
  opencode review disposition is recorded.
- Test-first behavior: tasks require focused failing tests before behavior
  changes.

Disposition: no blocking constitution drift found.

## SpecKit Pipeline Drift

- `spec.md`: present.
- `plan.md`: present.
- `research.md`: present.
- `data-model.md`: present.
- `contracts/`: present.
- `quickstart.md`: present.
- `tasks.md`: present.
- Analyze/review disposition: this review is the manual cross-artifact check;
  opencode review disposition remains required before code.

Disposition: implementation remains blocked until plan/task opencode review
lanes are assessed and accepted findings are fixed.

## Status

`ready_for_plan_task_review`: verified

`ready_for_implementation`: not_assessed
