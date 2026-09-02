## Context

The hook mechanics are documented in the harness guide (seven events;
workspace config at `.zcode/config.json` needs `hooks.enabled: true`;
matchers are case-sensitive regexes on tool names; exit 2 blocks;
`additionalContext` injects context; `type: process` runs an argv without a
shell). Plugin hooks (superpowers) already fire in this repo's sessions;
configuration hooks have never been used here. The three candidates and
their evidence are in proposal.md — Why. The Governor's decisions
(2026-09-02): all three, soft phase first, quiet briefing, spike first.

## Goals / Non-Goals

**Goals:**

- Deterministic guardrails at the moment of the event, each naming the
  protocol rule it serves (H1: leak-gate; H2: design D7 of `process-fabric`
  — the installer-owned block; H3: the J1 briefing mandate).
- Soft phase: hooks inform, they do not block. Escalation is a recorded
  later decision, not a default.
- Tracked, portable wiring: repo scripts + repo config, zero machine home
  paths.

**Non-Goals:**

- No deny/exit-2 anywhere in this phase; no PostToolUse validation runs
  (CI owns the done-bar); no Stop hooks; no doc-gate tooling (deferral
  triggers from `verify-first`/`process-fabric` have not fired).
- No hook logic beyond thin wrappers over existing tools — anything
  judgment-shaped (terminology, restatement, slop) stays with reviewers.

## Decisions

- **D1 — Soft first, escalation by recorded trigger.** All hooks warn;
  none deny. Escalation trigger (recorded now): H1 goes deny if a leaked
  literal reaches a commit despite the warning; H2 goes deny if a hand
  edit inside the markers survives to an install and is reverted. Until a
  trigger fires, softness stands — a guard that cries wolf gets disabled.

- **D2 — The briefing is quiet by design.** H3 runs the read-only queue
  read and the change list and injects context only when one of them is
  non-empty; an all-quiet province prints nothing. The agent still
  presents and asks — the hook implements the mandate, it does not replace
  the ritual (J1's decision round stays the agent's).

- **D3 — Tracked config, spike-gated.** The wiring lives in the tracked
  `.zcode/config.json` and `scripts/hooks/` so the province carries its
  own guards with no machine paths. If the spike shows workspace hooks do
  not load or the payload differs from the guide, the fallback is: scripts
  and docs still land (tracked), the wiring block is documented in the
  change report for manual machine-local install, and the change says so
  honestly.

- **D4 — Each hook script is a thin wrapper and names its rule.** H1 wraps
  the leak-gate signatures; H2 is a static reminder keyed on the target
  path; H3 wraps `openspec list --json` and
  `bun core/src/harbor/cli.ts propose --target . --format chat`. No new
  deterministic logic beyond glue (path extraction, emptiness check); what
  glue exists is cheap to test.

## Risks / Trade-offs

- [Hooks fire in every session, including ones that did not ask for
  process enforcement] → accepted; the config is tracked and public, and
  the soft phase means the worst case is a printed warning.
- [A hook script bug could spam or block sessions] → soft phase (no exit
  2 anywhere), small `timeoutMs` per hook, and the spike runs before the
  real wiring.
- [The hook layer drifts from the protocol text it serves] → every hook
  names its rule in `docs/workflow.md`'s hooks section; a rule change
  reviews its hooks in the same change (same pattern as D8 of
  `process-fabric`).

## Deferrals

- **Deferred: hard mode (deny)** for H1/H2 — triggers in D1.
- **Deferred: more hooks** (validation on change artifacts, Stop-time
  batteries, skip-record shape checks) — the existing deferral ledger
  stands; a hook gets built when its failure happens, not before.

## Verify-stage record (task 4.2)

- **Whole-change review** (code-reviewer, 2026-09-02): Spec PASS, Quality
  CHANGES_REQUESTED → fixed. Its Importants: the unticked 4.1 (bookkeeping
  drift — ticked), and commit d1a80f3 typed `docs(hooks)` while changing
  script behavior (message amended to `fix(hooks)`). Minors fixed: the
  proposal's unmet conditional now states the supersession; lib.sh's
  comment no longer oversells precedence; leak-gate.sh's signature
  assembly deduplicated (one `print_sigs`, two consumers — the socratic's
  stdout variant); workflow.md honesty note added and framing corrected;
  report wording fixed.
- **Socratic pass** (Mode B, 2026-09-02): verdict SIMPLIFY-FIRST — two
  one-line edits (the workflow.md claim must match FALLBACK PENDING; tick
  4.1), both applied, plus the `--print-patterns` stdout simplification.
  Its "not candidates" audit (lib.sh, config shape, buildBrief split) kept
  as-is.
- **Accepted debts, recorded**: leak-stamp's JSON escaping covers
  backslash and quote only — a control character in a path discards the
  warning (soft by consequence); the lib.sh grep fallback cannot parse
  escape sequences and returns payload-position precedence, not jq's —
  soft miss at worst; H1 warns on untracked scratch files too.
- **Deferral added**: H1 scratch-file noise — trigger: routine false
  warnings on scratch files → add a tracked-ness check before the grep.

## Open Questions

- None — the spike answers the mechanical unknowns (loading, cwd, payload)
  inside task 1 and records them in the change report.
