# Tasks: Bigtop Runtime Capture Preflight

## Phase 1: Setup

- [x] T001 Create feature branch `codex/062-bigtop-runtime-capture-preflight`.
- [x] T002 Add P6-062 backlog row and active SpecKit pointer.

## Phase 2: Preflight

- [x] T003 Run read-only Docker version preflight.
- [x] T004 Run read-only Docker Compose version preflight.
- [x] T005 Run read-only Ruby version preflight.
- [x] T006 Run read-only Docker cgroup preflight.
- [x] T007 Run Bigtop `--docker-compose-plugin --env-check` preflight.
- [x] T008 Record hashes and sizes for external preflight outputs.

## Phase 3: Evidence

- [x] T009 Write preflight ledger.
- [x] T010 Record explicit approval gate and next blocked command.
- [x] T011 Run Cursor boundary stress on preflight result.
- [x] T012 Run independent review lanes and disposition findings.

## Phase 4: Closeout

- [x] T013 Run baseline checks.
- [x] T014 Update task ledger/spec/backlog status.
- [x] T015 Create PR readiness closeout.
