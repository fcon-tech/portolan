# Tasks: Blind Agent Acceptance

**Input**: `specs/015-blind-agent-acceptance/spec.md`
**Prerequisites**: `specs/015-blind-agent-acceptance/plan.md`

## Phase 1: Protocol Contract

- [ ] T001 Add `docs/agent-toolbox/blind-acceptance.md` with the allowed blind
  prompt, forbidden hints, required artifacts, status taxonomy, and review
  procedure.
- [ ] T002 Add `specs/015-blind-agent-acceptance/templates/run-ledger.md` for
  recording prompt, target, commands, artifacts, report, gap ledger, status, and
  stop reason.
- [ ] T003 Add `specs/015-blind-agent-acceptance/reviews/.gitkeep` so run
  evidence has a spec-local home.

## Phase 2: Bigtop Smoke Correction

- [ ] T004 Update `specs/007-apache-bigtop-corpus/acceptance-smoke.md` so the
  weak fixture prompt is no longer treated as the real operator scenario.
- [ ] T005 Update `docs/test-corpora/apache-bigtop.md` to state that real Bigtop
  acceptance requires a local Bigtop checkout and the blind protocol.
- [ ] T006 Update `specs/007-apache-bigtop-corpus/spec.md` status and acceptance
  wording so Bigtop remains the first realistic corpus, not a special operator
  packet.

## Phase 3: Control Target

- [ ] T007 Define the first non-Bigtop control target or fixture for the same
  blind protocol.
- [ ] T008 Document how the control target prevents Bigtop-specific product
  tuning.

## Phase 4: Preflight And Verification

- [ ] T009 Run a local `portolan map` fixture preflight and record it as
  preflight only, not as passed blind acceptance.
- [ ] T010 Run `go test ./...`.
- [ ] T011 Run `jq empty schema/*.json`.
- [ ] T012 Run `git diff --check`.
- [ ] T013 Inspect the allowed prompt and verify it contains no Bigtop-specific
  file names, package names, or build instructions.

## Phase 5: First Blind Runs

- [ ] T014 After spec 014 is implemented, run Cursor + Composer 2.5 using only
  the blind prompt shape.
- [ ] T015 Record the Bigtop run as `passed`, `failed`, `degraded`, or
  `not_assessed` with exact evidence.
- [ ] T016 Run or schedule the same protocol against the non-Bigtop control
  target.
- [ ] T017 Update `docs/product-backlog.md` only with generic product gaps
  proven by the blind runs.
