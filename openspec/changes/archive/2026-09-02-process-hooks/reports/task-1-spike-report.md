# Task 1.1 report — hook mechanics spike

Change: `process-hooks`, task 1.1. Date: 2026-09-02. Method: a silent
temporary probe script (repo `scripts/hooks/spike-probe.sh`, appending pwd,
argv, and full stdin to a temp probe log) wired by a temporary minimal
`.zcode/config.json` (`hooks.enabled: true`, one `PostToolUse` hook,
matcher `Edit|Write`, `type: process`, `timeoutMs: 5000`), then one trigger
Write and a log hunt. Everything temporary was removed afterwards; the
branch carries only this report.

## Observed evidence

- **verified — probe works by hand.** Invoked directly, the probe wrote
  pwd (= repo root, when run from there), argv, and stdin as expected, and
  printed nothing (exit 0, silent).
- **verified — the workspace config did not take effect mid-session.**
  After the config existed, two tool calls matching `Edit|Write` occurred
  (one `Edit` in the hosting session, one `Write` in this subagent
  session). The probe file gained no entry in either case.
- **verified — the only hook record in the client log is at startup.**
  Across seven days of client logs (`~/.zcode/cli/log/zcode-*.jsonl`),
  there is no per-run hook event of any kind (no fired/skipped/failed
  records, also none for the already-installed plugin hooks). The single
  hook trace is `bootstrap.app.startup.plugins.completed` carrying
  `hookCount` (4 today — plugin hooks only). No bootstrap has run since
  the config was written, so `hookCount` never reflected it, and no
  session has ever loaded the workspace config.
- **not_assessed — the real hook stdin payload.** The hook never fired,
  so the actual payload shape (tool name, `tool_input`, file path, session
  id keys) was never observed. The harness's own `diagnosing-hooks` skill
  documents the config schema but not the stdin payload; nothing about the
  payload is confirmed from observation.
- **not_assessed — hook-invoked cwd.** Only the hand-run cwd (repo root)
  is verified. The config's repo-relative script path assumes repo-root
  cwd; that assumption is unconfirmed for hook-invoked runs.

## Config-load verdict

Mid-session configs are not loaded (or at least were not re-read by the
running app): registration traces exist only on the startup bootstrap
line, and no bootstrap ran after the config appeared. Absence of firing in
this session therefore does **not** mean the config is broken — it was
never given the chance to load. Loading-at-startup is plausible (the shape
matches the harness skill's documented schema exactly) but unconfirmed.

## D3 decision: FALLBACK PENDING

The task's GO rule is "firing observed or log shows the config
registered". Neither is observable from inside one session where the
config is added mid-session: firing needs a loaded config, and the
registration record exists only on the next startup. No GO is claimed.
D3's fallback is *pending*, not executed: the tracked wiring in task 2.1
still lands (it is inert if hooks never load), and the change must say
honestly, until proven, that workspace-hook loading is unconfirmed.

## Next-session checklist (decides GO vs fallback)

1. **Registration**: at session start, read the day's
   `~/.zcode/cli/log/` bootstrap line for this workspace's session;
   `hookCount` above the plugin-only baseline (4 on 2026-09-02) means the
   workspace config registered. 
2. **Firing on tools**: on the first `Edit`/`Write`, a temporary probe (as
   in this spike, one session only) must append a probe entry; capture its
   full stdin once to record the real payload keys and the hook-invoked
   cwd.
3. **H3 behavior**: `SessionStart` briefing appears only when the harbor
   queue or the change list is non-empty; an all-quiet session sees
   nothing.
4. **Decision rule**: any of 1–3 observed = GO for D3 (keep the tracked
   wiring, note payload/cwd findings in this report). All silent *and*
   `hookCount` unchanged = the fallback executes: keep tracked scripts and
   docs, mark the wiring block as requiring manual machine-local install,
   and say so in the change verification.
5. If 1 fails but the config is present and schema-correct, check the
   harness `diagnosing-hooks` skill pitfalls 1 and 7 (enabled flag;
   `process` accepts only `command`, `args`, `timeoutMs`) before declaring
   the wiring broken.

## Cleanup

Probe script and `scripts/hooks/` removed; temporary `.zcode/config.json`
removed (task 2.1 writes the real one); temp probe log and scratch file
removed. `git status` clean before the report commit.
