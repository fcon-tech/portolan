## 1. The rule and its procedure

- [x] 1.1 Add the verify-first rule: in `AGENTS.md`'s OpenSpec workflow rules, one line — verification is written before the work, and a skipped test-first pass is a recorded decision, not a default; in `docs/workflow.md` J4, the procedure clause — spec-delta tasks get failing acceptance tests from those deltas before implementation (test-writer, then implementer); no-delta tasks (docs, process) restate their verify line as checks run before the work, red where the work is absent, and any test-first skip is recorded in the task report (what was skipped, why, what covers it instead). Verify: harbor block in `AGENTS.md` still byte-identical to main; both homes consistent (rule vs procedure split); nothing else in either file changed; no machine home paths; locked terminology.

## 2. Verification

- [x] 2.1 Run the verification battery and report with evidence labels: `bun test`, `bunx tsc --noEmit` in `core/` and `acceptance/`, `openspec validate --specs --strict`, `openspec validate --changes --strict`, `bun run skill/verify/checks.ts`, `scripts/leak-gate.sh`. Verify: all green, or every failure named in the change reports.

- [ ] 2.2 Whole-change review (code-reviewer against this proposal) plus the socratic pass (advisory). Verify: findings addressed or dissented in `design.md`; no silent drops.
