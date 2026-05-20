# Tasks: Agent Skill Pack

**Input**: Design documents from `specs/008-agent-skill-pack/`
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/agent-guide-contract.md`, `quickstart.md`
**Tests**: Documentation/content checks required.

## Phase 1: Guide And Rule Artifacts

- [x] T001 [US1] Add portable guide at `agent/AGENT_GUIDE.md`.
- [x] T002 [US2] Add Cursor rule at `.cursor/rules/portolan-map.mdc` that delegates to `agent/AGENT_GUIDE.md`.
- [x] T003 [US3] Add example evidence-backed report at `agent/examples/map-report.md`.

## Phase 2: Content Checks

- [x] T004 [US1] Verify `agent/AGENT_GUIDE.md` names `portolan doctor`, current-command fallback for the Bigtop smoke, target `portolan map --root . --out .portolan/run`, required artifacts, and evidence states.
- [x] T005 [US2] Verify `.cursor/rules/portolan-map.mdc` does not describe Portolan as Cursor-only.
- [x] T006 [US3] Verify `agent/examples/map-report.md` includes relationships, duplication, configuration, technical debt, unknown, and cannot-verify sections.

## Phase 3: Documentation And Status

- [x] T007 Update `README.md` and `docs/agent-toolbox/README.md` if implementation details differ from this spec.
- [x] T008 Update `docs/product-backlog.md` and `specs/008-agent-skill-pack/spec.md` status after implementation.
- [x] T009 Record review disposition under `specs/008-agent-skill-pack/reviews/`.
- [x] T010 Run `go test ./...`.
- [x] T011 Run `jq empty schema/*.json corpora/apache-bigtop/manifest.json`.
- [x] T012 Run `git diff --check`.

## Dependencies

- T001 precedes T002 because the Cursor rule must point to the guide.
- T003 can run in parallel with T001 after the report format is clear.

## Implementation Strategy

Deliver the cheapest acceptance pack first. Do not add MCP, LSP, package
installers, or extension code in this slice.
