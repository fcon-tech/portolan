# Research: Agent Acceptance Matrix

## Decision: Treat Harnesses As Acceptance Clients

Rationale: Portolan's boundary says it is not tied to Cursor, Claude, Codex, OpenCode, pi, or any harness. The acceptance matrix must test harness compatibility without making Portolan orchestrate them.

Alternatives considered:

- Build a harness runner. Rejected because that turns Portolan into orchestration infrastructure.
- Keep only Cursor evidence. Rejected because current product claims already identify UI Cursor/Composer and other harnesses as unassessed.

## Decision: Score Unsupported Claims And Next Actions Separately

Rationale: Spec 034 showed Portolan's value through fewer unsupported claims and equal or better next actions. Keeping the two axes separate avoids hiding worse UX behind evidence discipline.

Alternatives considered:

- Single pass/fail score. Rejected because it collapses product quality into one vague result.
