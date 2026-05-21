# Tasks: Agent Bootstrap Discovery

**Input**: `specs/014-agent-bootstrap-discovery/spec.md`
**Prerequisites**: `specs/014-agent-bootstrap-discovery/plan.md`

## Phase 1: Contract Review

- [x] T001 Review `agent/AGENT_GUIDE.md`, `README.md`,
  `docs/agent-toolbox/README.md`, and `.cursor/rules/portolan-map.mdc` for
  hidden Cursor or Bigtop assumptions.
- [x] T002 Record pre-implementation findings under
  `specs/014-agent-bootstrap-discovery/reviews/`.

## Phase 2: Root-Discoverable Entrypoint

- [x] T003 Add `agent/START_HERE.md` as the stable, short entrypoint for agents.
- [x] T004 Update `README.md` so an agent starting at the repository root can
  find the entrypoint without being told a path in chat.
- [x] T005 Update `docs/agent-toolbox/README.md` to explain the bootstrap
  contract without making Cursor or Bigtop the product boundary.

## Phase 3: Portable Skill Surface

- [x] T006 Add a portable `agent/skills/portolan-map/SKILL.md` or equivalent
  reusable instruction artifact for harnesses that support skills.
- [x] T007 Ensure the portable skill defines the same minimum inputs, map
  command, artifact contract, report shape, gap ledger, and stop conditions as
  the root entrypoint.
- [x] T008 Update `.cursor/rules/portolan-map.mdc` so it delegates to the
  portable entrypoint and avoids duplicating the workflow.

## Phase 4: Non-Source Target Handling

- [x] T009 Update agent instructions to state that build/package/config/test
  repositories are valid targets and must not trigger implicit source-repo
  cloning.
- [x] T010 Update the example report to show how unsupported or absent detector
  surfaces remain `not_assessed`, `unknown`, or `cannot_verify`.

## Phase 5: Verification

- [x] T011 Run `go test ./...`.
- [x] T012 Run `jq empty schema/*.json`.
- [x] T013 Run `git diff --check`.
- [x] T014 Run `go run ./cmd/portolan map --help`.
- [x] T015 Run a local fixture map command and inspect `run.json`,
  `graph.json`, `findings.jsonl`, and `map.md`.
- [x] T016 Verify generic agent entrypoint and portable skill do not contain
  Bigtop-specific choreography.
- [x] T017 Record implementation disposition under
  `specs/014-agent-bootstrap-discovery/reviews/`.
