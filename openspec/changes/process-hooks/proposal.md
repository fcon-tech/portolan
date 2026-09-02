## Why

Every discipline this repo runs on is advisory (AGENTS.md, skills) or
end-of-pipe (CI at merge, reviews). The last three cycles produced real
failures a hook would have caught at the moment of writing: a leaked
machine-path literal landed in a tracked report and only the task review
caught it; the installer-owned harbor block is guarded only by prose; the
J1 briefing fires only when the agent remembers it. The Governor approved
(2026-09-02) building the three evidence-backed hooks, soft first, quiet
briefing, spike before wiring.

## What Changes

- A tracked `.zcode/config.json` enabling workspace hooks (`hooks.enabled:
  true`) — the spike could not confirm loading from inside one session, so
  this lands under design D3's pending posture: inert if the harness never
  loads it, live confirmation is the spike's next-session checklist.
- **H1 leak-stamp** (`PostToolUse`, matcher `Edit|Write`, soft): scans the
  touched file for leak-gate signatures, warns with the file and line —
  the same check that caught nothing until review in `process-fabric`.
- **H2 harbor-marker reminder** (`PreToolUse`, matcher `Edit|Write`, soft):
  when the tool targets `AGENTS.md`, reminds that the block between
  `portolan:harbor:begin/end` is installer-owned and hand edits there are
  reverted on the next install.
- **H3 quiet session brief** (`SessionStart`): runs `openspec list` and the
  harbor watch; injects their output as context **only when there is
  something to say** (non-empty queue or active changes) — silence is the
  no-news case.
- All three soft (never exit 2 in this phase); scripts live in
  `scripts/hooks/`, thin wrappers over existing deterministic tools.
- `docs/workflow.md` gains a hooks section: pointers only — what each hook
  enforces, which protocol rule stands behind it, the soft phase, and the
  escalation trigger.

## Capabilities

### New Capabilities

- (none — development-process tooling, no served behavior)

### Modified Capabilities

- (none; `skip_specs: true` is set in `.openspec.yaml`)

## Impact

- `.zcode/config.json` (new, tracked), `scripts/hooks/` (new, thin
  wrappers), `docs/workflow.md` (one section). No product code, no specs,
  no adapters. CI stays the final bar; hooks are early signals, never the
  done-bar.
