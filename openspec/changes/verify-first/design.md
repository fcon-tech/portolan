## Context

During `process-fabric` (merged #87) the test-writer pass and the red step
were skipped for every task because the change carried no spec deltas; the
skip was recorded in task reports but no protocol text owned it — the
discipline existed only for code tasks with scenarios. The Governor named
the hole on 2026-09-02 (see proposal.md — Why). Related homes today:
`~/.zcode/AGENTS.md` dispatches test-writer before implementer (spec-driven,
silent when no deltas exist); `~/.zcode/agents/implementer.md` mandates the
red step for code; `docs/workflow.md` J4 owns cycle procedure and says
nothing about test-first.

## Goals / Non-Goals

**Goals:**

- One rule, two cases: spec-delta tasks get failing acceptance tests
  before implementation; no-delta tasks (docs, process) write their
  verification before the work — the verify line as checks, red where the
  work is absent.
- A test-first skip is a recorded decision in the task report (what, why,
  what covers it instead) — never a silent default.

**Non-Goals:**

- No executable doc-gate script in this change: the automated prose checks
  stay deferred with the trigger `process-fabric` set (first broken pointer
  or locked-term violation in a served doc after merge). This change fixes
  the discipline, not the tooling.
- No edits to global agent files (`~/.zcode/agents/`, `~/.zcode/AGENTS.md`)
  — outside the repo (design D3 of `process-fabric` stands).
- No product code, no spec deltas.

## Decisions

- **D1 — Verify-first stated as a rule with a recorded-skip escape, not as
  tooling.** The protocol names the discipline and the two task kinds;
  where a check cannot run red first (judgment checks: terminology, no
  restatement), the recorded skip names what covers it instead (manual
  checklist in the report, review). Alternatives rejected: building the
  doc-gate script now (deferral trigger not fired; YAGNI); leaving the
  rule only in global agent files (not every reader of this repo sees
  them, and the repo protocol is the assembled home).

- **D2 — Two homes, per the established layering:** the rule as a one-liner
  in `AGENTS.md` (rules live there), the procedure — the two cases and the
  skip-record shape — in `docs/workflow.md` J4. Same pattern as the
  MR/green-CI rule; `process-fabric`'s recorded dissent covers this
  dual-homing.

## Risks / Trade-offs

- ["Red first" for docs tasks can become theater — restating a checklist
  nobody runs] → the rule requires the checks be runnable where runnable
  (path existence, gates, command exit) and honestly recorded as manual
  where not; the verify-stage review reads the reports and calls out
  theater.

## Deferrals

- **Deferred: executable served-doc checks** (pointer existence, locked
  terminology, restatement scan). Why safe now: every task already runs
  its verify checklist manually and records it; leak-gate covers the worst
  class. Trigger to revisit: unchanged from `process-fabric` — the first
  broken pointer or locked-term violation found in a served doc after
  merge. This change does not pull that trigger; it makes the manual
  discipline explicit and first.

## Verify-stage record (task 2.2)

- **Whole-change review** (code-reviewer, 2026-09-02): Spec PASS, Quality
  APPROVED. Two Minors, both fixed: the `2.1` commit's scope renamed to
  `docs(verify-first)` (it touched only change artifacts), and the battery
  report now names the 5 environmental test skips.
- **Socratic pass** (Mode B, 2026-09-02): verdict SHIP. One delete
  candidate — the `not a default` tail on the AGENTS.md rule — considered
  and **kept** by the dispatcher: it is emphasis, not restatement, and it
  carries the Governor's own framing that spawned the change. The
  socratic's two "considered, kept" notes (the delta-case clause and
  `red where the work is absent` are load-bearing) stand as-is.
- **Deferrals adopted**: skip-record shape is enforced by verify-stage
  review until the doc-gate batch (trigger: a recorded skip with empty or
  circular "what covers it instead"); judgment checks have no standard red
  mechanism (trigger: a task report claiming a runnable check it cannot
  show red); the process-fabric doc-gate deferral is unchanged.

## Open Questions

- None. The Governor named the hole and the fix shape on 2026-09-02
  ("TDD was skipped — clearly a fix for the process").
