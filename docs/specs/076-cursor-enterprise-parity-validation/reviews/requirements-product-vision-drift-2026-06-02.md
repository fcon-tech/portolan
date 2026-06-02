# Requirements And Product Vision Drift Review

Spec: `docs/specs/076-cursor-enterprise-parity-validation/`

Date: 2026-06-02

## Decision Gate

- **Simpler/Faster**: Run another Cursor comparison immediately. Rejected for
  default execution because spec 074 runtime health is still `not_assessed` and
  spec 077 keeps full graph/callgraph `cannot_verify`.
- **Blocking Edge Cases**: Old artifact contamination, unequal prompts, missing
  runtime evidence, stale claim surfaces after specs 075 and 077, and broad
  human/enterprise parity language.
- **Existing Open Source**: No new OSS tool is needed for this planning slice;
  existing producer outputs and reviewed availability ledgers are the evidence
  inputs.

## Requirements Drift

verified:

- Backlog row P6-076 was backlog-only while `spec.md` had no `plan.md` or
  `tasks.md`.
- The original dependency list mentioned specs 074 and 075, but did not account
  for spec 077's merged graph/callgraph decision.
- Spec 074 runtime execution remains approval-gated; no service-health or smoke
  output exists for 076 to consume.

fixed in this branch:

- `spec.md` now names branch, planning status, user stories, explicit
  dependencies on 074, 075, and 077, and the execution gate.
- `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, and `tasks.md`
  now exist.
- `docs/product-backlog.md` now describes 076 as planning, not backlog-only.

not_assessed:

- Cursor Composer 2.5 paired stress output for 076 has not been run.
- Spec 074 runtime-health execution has not been run.

## Product Vision Drift

verified:

- The branch keeps Portolan inside the product boundary as a local-first
  navigation harness.
- The plan explicitly rejects using helpful agent prose as enterprise/human
  parity proof.
- The plan preserves `not_assessed` and `cannot_verify` rather than smoothing
  missing runtime and full graph evidence into success.

risk:

- If a current-evidence rejection run is executed without explicit approval, it
  could look like a default parity validation while still missing C4 runtime
  evidence.

mitigation:

- `reviews/execution-gate-2026-06-02.md` blocks the default run until spec 074
  runtime-health evidence exists, and tasks require explicit approval for the
  current-evidence fallback.

## Implementation Decision

decision: activate 076 as a planning-ready gated validation slice, not as an
executed parity proof.

rejected alternatives:

- Execute default paired Cursor stress now.
- Promote broad parity from prior 2026-06-01 stress report.
- Add a new native producer or adapter inside 076.

why now: PR #54 merged spec 077, so 076 can account for both producer coverage
and graph/callgraph closure state before the next stress attempt.

reversibility: high; once spec 074 evidence exists, the same tasks can proceed
without rewriting the planning surface.

risk if wrong: if spec 074 is deferred indefinitely, 076 remains blocked except
for an explicitly approved rejection run.

confidence: high
