## 1. Spike

- [x] 1.1 Spike the hook mechanics: create a temporary minimal `.zcode/config.json` with `hooks.enabled: true` and one echo hook on `PostToolUse` (`Edit|Write`), confirm the workspace config actually loads (hook fires and is recorded in the client log), confirm the working directory the hook command runs in, and capture the real stdin payload shape for `PreToolUse`/`PostToolUse`/`SessionStart` (matcher values, `file_path`/`tool_input` fields). Verify: findings recorded in `openspec/changes/process-hooks/reports/task-1-spike-report.md` with the observed evidence; the temporary echo hook removed afterwards; design D3's go/fallback decided from what was observed, not from the guide alone.

## 2. The hooks

- [x] 2.1 Implement the three soft hooks per design D2–D4: `scripts/hooks/` scripts (leak-stamp wrapper over the leak-gate signatures; AGENTS.md marker reminder; quiet session brief over `openspec list --json` + the harbor CLI that prints `additionalContext` JSON only when the queue or the change list is non-empty) plus the tracked `.zcode/config.json` wiring them (`process` type, small `timeoutMs`, matchers per design). Verify: each script fed a sample payload by hand produces the expected output (warn with file/line; reminder; quiet case prints nothing), H3 confirmed quiet on an all-quiet run, no exit 2 anywhere, leak-gate clean, hook commands contain no machine home paths.

## 3. The protocol pointer

- [x] 3.1 Add the hooks section to `docs/workflow.md` — pointers only: the three hooks, the protocol rule each serves (leak-gate; the installer-owned block; J1), the soft phase, and the escalation triggers from design D1. Verify: nothing restated from the hook scripts or the harness guide; consistent with the rest of the page; no machine home paths; locked terminology.

## 4. Verification

- [x] 4.1 Run the verification battery and report with evidence labels: `bun test`, `bunx tsc --noEmit` in `core/` and `acceptance/`, `openspec validate --specs --strict`, `openspec validate --changes --strict`, `bun run skill/verify/checks.ts`, `scripts/leak-gate.sh`. Verify: all green, or every failure named in the change reports.

- [x] 4.2 Whole-change review (code-reviewer against this proposal) plus the socratic pass (advisory). Verify: findings addressed or dissented in `design.md`; no silent drops.
