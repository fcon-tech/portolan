## Why

The `process-fabric` cycle (merged in #87) skipped TDD without the protocol
noticing: no spec deltas meant the test-writer pass and the red step were
declared "N/A" and the skip lived only in task reports. The Governor named
it on 2026-09-02: that is a process hole. Test-first is the repo's
verification discipline, and the protocol owns when it applies and how a
skip is recorded — nowhere does it.

## What Changes

- `docs/workflow.md` J4 gains the verify-first rule, covering both task
  kinds: a task with spec deltas gets its failing acceptance tests from
  those deltas before implementation (test-writer, then implementer); a
  task without spec deltas (docs, process) writes its verification first —
  the task's verify line restated as checks run before the work, red where
  the work is absent — and any test-first skip is a recorded decision in
  the task report (what was skipped, why, what covers it instead), never a
  silent default.
- `AGENTS.md` rules gain the one-liner: verification is written before the
  work; a skipped test-first pass is a recorded decision, not a default.

## Capabilities

### New Capabilities

- (none — no served behavior changes)

### Modified Capabilities

- (none — process/docs only; `skip_specs: true` is set in `.openspec.yaml`)

## Impact

- `docs/workflow.md` (one clause in J4), `AGENTS.md` (one rule line in the
  collapsed OpenSpec workflow section). No product code, no specs, no
  tools, no adapters, no harness files.
