# Task 2.1 report — the three soft hooks and the tracked wiring

Change: `process-hooks`, task 2.1. Date: 2026-09-02. All evidence below is
hand-run transcripts (abridged to the decisive lines; the machine root is
written as `$ROOT`, the temp dir as `/tmp`). `$ROOT` is delivered to every
hook by the harness as `ZCODE_PROJECT_DIR` (env + template var), so no hook
relies on cwd and no committed file carries a machine path.

## What was built

- `scripts/hooks/lib.sh` — shared glue: `hook_file_path`, the defensive
  touched-file extraction from a tool-event payload (jq when present, then
  a grep/sed fallback; jq is absent on this machine, so the fallback is the
  exercised path). The task 1.1 spike left the live payload shape
  not_assessed, so the guide-documented keys (`tool_input.file_path`,
  `file_path`, `tool_input.path`) are probed in order.
- `scripts/hooks/leak-stamp.sh` — H1, PostToolUse `Edit|Write`. Scans the
  ONE touched file for the leak-gate signatures; on a hit prints one
  `additionalContext` warning naming file:line. Single source of truth:
  `scripts/leak-gate.sh` gained a backward-compatible
  `--print-patterns <file>` mode (writes the signature list, scans
  nothing); the hook greps the target with those patterns and never copies
  the list. Every non-hit/failure path is silent, exit 0.
- `scripts/hooks/harbor-markers.sh` — H2, PreToolUse `Edit|Write`. When the
  target ends with `/AGENTS.md` or equals it, prints one `additionalContext`
  reminder: the block between `portolan:harbor:begin` and
  `portolan:harbor:end` is installer-owned, rewritten wholesale by
  `adapters/opencode/install.ts` on every install; edits inside the markers
  are reverted. Else silent. Always exit 0.
- `scripts/hooks/session-brief.ts` — H3, SessionStart `startup|resume`. The
  quiet/emit decision (design D2) lives as the pure `buildBrief(openspecJson,
  harborChat)` — tested in `session-brief.test.ts`; `main` only runs the two
  read-only subcommands (`openspec list --json` with cwd anchored to
  `$ZCODE_PROJECT_DIR` — note: `openspec list` has no `--root` flag, the
  equivalent cwd-free form is cwd option — and
  `bun <root>/core/src/harbor/cli.ts propose --target <root> --format chat`,
  whose renderer returns `""` on an empty queue). Harbor queue first, active
  changes second, one block; any subcommand failure skips its part; both
  parts empty prints nothing. Always exit 0.
- `.zcode/config.json` (tracked) — the wiring: `hooks.enabled: true`, three
  `process` entries (`PostToolUse`/`PreToolUse` matcher `Edit|Write`, bash,
  `timeoutMs: 5000`; `SessionStart` matcher `startup|resume`, bun,
  `timeoutMs: 15000`), script paths via `${ZCODE_PROJECT_DIR}` — no shell
  interpolation, no machine paths.

## Hand-run evidence (exit codes in the transcripts are all 0)

H1 happy / garbage / missing file (silent each time):

```
$ printf '%s' '{"tool_name":"Write","tool_input":{"file_path":"README.md"}}' \
    | bash scripts/hooks/leak-stamp.sh; echo exit=$?
exit=0
$ printf '%s' 'garbage not json' | bash scripts/hooks/leak-stamp.sh; echo exit=$?
exit=0
$ printf '%s' '{"tool_name":"Write","tool_input":{"file_path":"/tmp/nope-does-not-exist.md"}}' \
    | bash scripts/hooks/leak-stamp.sh; echo exit=$?
exit=0
```

H1 hit path — fabricated temp file carrying an assembled signature
(the literal is assembled in the transcript exactly so this report stays
clean; the temp file was deleted after):

```
$ printf 'line one\n/%sme/fall/gone/x.txt is a leak\nmore\n' ho > "$tmp"
$ printf '{"tool_name":"Edit","tool_input":{"file_path":"%s"}}' "$tmp" \
    | bash scripts/hooks/leak-stamp.sh; echo exit=$?
{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"leak-gate hit: /tmp/h1-hit-....md (line(s) 2) carries a machine home path signature. ..."}} 
exit=0
```

Two hits report both lines (`line(s) 2,4`). Relative payload paths resolve
against `ZCODE_PROJECT_DIR` — proven with an untracked scratch file inside
the repo (hit fired with the resolved absolute path; file deleted after).

H2 target checks:

```
$ printf '%s' '{"tool_name":"Edit","tool_input":{"file_path":"AGENTS.md"}}' \
    | bash scripts/hooks/harbor-markers.sh; echo exit=$?
{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"AGENTS.md edit: the block between portolan:harbor:begin and portolan:harbor:end is installer-owned - adapters/opencode/install.ts rewrites it wholesale on install. ..."}}
exit=0
$ ... '"file_path":"docs/workflow.md"' ... ; echo exit=$?
exit=0            # silent — not the installer-owned file
```

H3 on this province (1 pending repair proposal + 1 active change — the
brief speaks, queue first), then the quiet branch:

```
$ bun scripts/hooks/session-brief.ts; echo exit=$?
{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"Harbor queue (decide with expeditions.decide):\nPortolan harbor — 1 expedition proposal for this province.\n\n1. repair — vessel core ... \n\nActive changes (openspec):\n- process-hooks — in-progress, 0/5 tasks"}}
exit=0
$ ZCODE_PROJECT_DIR=/tmp/empty-prov bun scripts/hooks/session-brief.ts; echo exit=$?
exit=0            # silent — both subcommands fail on an empty dir, both parts null
$ env -u ZCODE_PROJECT_DIR bun scripts/hooks/session-brief.ts; echo exit=$?
exit=0            # silent — no province known
```

The all-quiet-with-succeeding-commands case (openspec returns an empty
change list, harbor returns "") is covered by the decision-logic unit
tests: `buildBrief('{"changes":[]}', "")` and whitespace-only variants all
return null (task brief allows this in place of a live empty province).

## Verification battery

- `bun test scripts/hooks/session-brief.test.ts` — 6 pass, 0 fail.
- `bun test` (repo root) — 373 pass, 5 skip, 0 fail (1944 expect calls).
- `bunx tsc --noEmit` in `core/` and `acceptance/` — both clean.
- `scripts/leak-gate.sh` — exit 0 (including the new hook scripts and the
  leak-gate edit itself).
- `openspec validate --changes --strict` — 1 passed, 0 failed.
- `bash -n` on the three shell scripts — syntax ok. `grep "exit 2"` across
  `scripts/hooks/` — no matches (soft phase holds; note `leak-gate.sh`
  itself keeps its pre-existing exit 1 for the standalone gate (the usage
  exit 64 is new with this diff, from the `--print-patterns` flag); the
  hooks never propagate it).

## Decisions and evidence labels

- verified: all hand-run transcripts above; the full battery green.
- assumed: the output envelope `{"hookSpecificOutput":{"hookEventName":...,
  "additionalContext":...}}` — the harness skill documents `additionalContext`
  injection and a strict output schema, but the accepted key layout was not
  observed live (spike: not_assessed). Per the skill's pitfall 8, a wrong
  layout means the run is marked failed and the output discarded — soft and
  harmless; the spike's next-session checklist (H3 briefing at SessionStart)
  will confirm the envelope in a real session.
- assumed: payload key layout (`tool_input.file_path` et al.) — same source;
  the extraction is defensive by design.
- D1 respected: no exit 2 anywhere in the hooks; warnings only.
- D4 respected: wrappers only; the one shared glue function is
  `hook_file_path`; the signature list kept its single home in
  `leak-gate.sh` (new `--print-patterns` mode, gate behavior unchanged).

## Follow-ups for the next session

- Run the spike's next-session checklist from
  `task-1-spike-report.md` (bootstrap `hookCount`, H3 briefing observed,
  probe firing) — it now also validates the envelope assumption above.
- If the envelope or payload keys differ in a live firing, fix
  `lib.sh`/`renderHookOutput` in a small follow-up — the decision logic and
  the wiring are unaffected.
