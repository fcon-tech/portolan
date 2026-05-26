# Tasks: Blind Agent Acceptance

**Input**: `specs/015-blind-agent-acceptance/spec.md`
**Prerequisites**: `specs/015-blind-agent-acceptance/plan.md`

## Phase 1: Protocol Contract

- [x] T001 Add `docs/agent-toolbox/blind-acceptance.md` with the allowed blind
  prompt, forbidden hints, required artifacts, status taxonomy, and review
  procedure.
- [x] T002 Add `specs/015-blind-agent-acceptance/templates/run-ledger.md` for
  recording prompt, target, commands, artifacts, report, gap ledger, status, and
  stop reason.
- [x] T003 Add `specs/015-blind-agent-acceptance/reviews/.gitkeep` so run
  evidence has a spec-local home.

## Phase 2: Bigtop Smoke Correction

- [x] T004 Update `specs/007-apache-bigtop-corpus/acceptance-smoke.md` so the
  weak fixture prompt is no longer treated as the real operator scenario.
- [x] T005 Update `docs/test-corpora/apache-bigtop.md` to state that real Bigtop
  acceptance requires a local Bigtop checkout and the blind protocol.
- [x] T006 Update `specs/007-apache-bigtop-corpus/spec.md` status and acceptance
  wording so Bigtop remains the first realistic corpus, not a special operator
  packet.

## Phase 3: Control Target

- [x] T007 Define the first non-Bigtop control target or fixture for the same
  blind protocol.
- [x] T008 Document how the control target prevents Bigtop-specific product
  tuning.

## Phase 4: Preflight And Verification

- [x] T009 Run a local `portolan map` fixture preflight and record it as
  preflight only, not as passed blind acceptance.
- [x] T010 Run `go test ./...`.
- [x] T011 Run `jq empty schema/*.json`.
- [x] T012 Run `git diff --check`.
- [x] T013 Inspect the allowed prompt and verify it contains no Bigtop-specific
  file names, package names, or build instructions.

## Phase 5: First Blind Runs

- [ ] T014 After spec 014 is implemented, run Cursor + Composer 2.5 using only
  the blind prompt shape.
  - Status 2026-05-26: pending evidence. Cursor + Composer 2.5 availability is
    not the blocker; the run transcript has not been recorded in the repo.
- [ ] T015 Record the Bigtop run as `passed`, `failed`, `degraded`, or
  `not_assessed` with exact evidence.
  - Status 2026-05-26: pending the real Bigtop landscape operator run.
- [ ] T016 Run or schedule the same protocol against the non-Bigtop control
  target.
  - Status: not_assessed; no external blind operator control transcript was
    produced.
- [x] T017 Update `docs/product-backlog.md` only with generic product gaps
  proven by the blind runs.
  - No new detector backlog items were added because no real blind run produced
    generic product gaps in this implementation turn.
