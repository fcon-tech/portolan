## 1. Park the wiring

- [x] 1.1 Delete the tracked `.zcode/config.json`; rewrite the hooks section lead in `docs/workflow.md` to the parked state per design D2: the guards exist (`scripts/hooks/`, soft phase), the wiring is parked because the client's workspace hook trust review is broken for remote workspaces (items not actionable), and the restore path (recreate the wiring from the `process-hooks` archive; approve once the client works). Verify: the file is gone from the tree; the section claims match reality (nothing says hooks run); every referenced path exists; leak-gate clean; `bun test` green (the hook unit tests must survive).

## 2. Verification

- [x] 2.1 Run the verification battery and report with evidence labels: `bun test`, `bunx tsc --noEmit` in `core/` and `acceptance/`, `openspec validate --specs --strict`, `openspec validate --changes --strict`, `bun run skill/verify/checks.ts`, `scripts/leak-gate.sh`. Verify: all green, or every failure named in the change reports.

- [x] 2.2 Whole-change review (code-reviewer against this proposal) plus the socratic pass (advisory) — for this single-task change they also stand in for the per-task review. Verify: findings addressed or dissented in `design.md`; no silent drops.
