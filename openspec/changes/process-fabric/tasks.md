## 1. The protocol document

- [x] 1.1 Write `docs/workflow.md` following design.md D2, D5, D7, D8 — rules and pointers only, never a manual: J1 unified session briefing (defers to the installer-owned harbor block: proposals first; appends `openspec list --json` state; one decision round; MCP primary, `bun core/src/harbor/cli.ts propose --target . --format chat` fallback), J4 routing rule (product behavior → OpenSpec cycle; chart/archive state → expedition) with the expedition→change hand-off as its worked example (danger found in product code → Governor's verdict → `/opsx:explore`), the merge-to-repair loop as one line with cross-references (`docs/engineering.md` §4, `adapters/README.md`), one role fact (the Cartographer is the main agent's stance per `skill/SKILL.md`, not a subagent), the night watch as one reference line. Verify: every referenced path/command exists verbatim in the repo; nothing restates `adapters/README.md`, `docs/engineering.md`, or `~/.zcode/AGENTS.md`; locked terminology only; no machine home paths.

## 2. The contract slims down

- [x] 2.1 In `AGENTS.md`, collapse the hand-written OpenSpec workflow section into brief rules plus a pointer to `docs/workflow.md` (the `docs/engineering.md` pattern). Do NOT touch the block between `<!-- portolan:harbor:begin -->` and `<!-- portolan:harbor:end -->` — it is installer-owned (`adapters/opencode/install.ts`) and any edit there is reverted on the next install. Verify: `AGENTS.md` states no procedure that `docs/workflow.md` does not own; the harbor block is byte-identical (`git diff` touches nothing between the markers); the rest of `AGENTS.md` is untouched.

## 3. Verification

- [x] 3.1 Run the verification battery and report results with evidence labels: `bun test`, `bunx tsc --noEmit` in `core/` and `acceptance/`, `openspec validate --specs --strict`, `openspec validate --changes --strict`, `bun run skill/verify/checks.ts`, `scripts/leak-gate.sh`. Verify: all green, or any failure named in the change reports — nothing silently skipped.

- [ ] 3.2 Whole-change review: code-reviewer over the full diff against this proposal; socratic-advisor pass on the assembled protocol (advisory). Verify: findings addressed or dissented in `design.md`; no silent drops.
