## 1. Settings + policy

- [ ] 1.1 Extend the settings reader with `harbor.auto_repair_max_vessels`
      (non-negative integer, absent = 0; malformed values fail loudly) and
      verify defaults, parse, and rejection tests
- [ ] 1.2 Implement the night policy (repair-only; vessel count within the
      bound; new-land/gap never) as a pure function and verify scenario
      tests: within-bound runs, beyond-bound pends, new-land pends despite
      a high bound, absent bound = report-only

## 2. Watch command

- [ ] 2.1 Implement the launcher spawn (argv template, proposal JSON on
      stdin, timeout) with the failure path (non-zero/timeout → history
      `launch-failed`, proposal stays queued, report names the failure)
      and verify with fake launchers (ok/fail/hang) in tests
- [ ] 2.2 Implement `watch` end-to-end in the CLI (queue → policy →
      launch → history accept `by night-watch` → report) and verify: a
      fake-launcher repair completes, history attributes the night watch,
      the fingerprint leaves the queue; a second watch run over the
      unchanged province is report-identical and launches nothing
- [ ] 2.3 Extend the chat renderer with ran/pending/failed sections and
      verify a golden test for deterministic output

## 3. Adapter launcher

- [ ] 3.1 Write `adapters/opencode/expedition-launcher` (stdin JSON brief
      → rendered repair prompt → `opencode run --pure -m $PORTOLAN_MODEL`
      → exit status; zero behavior beyond launching) and verify with an
      echo-fake opencode on PATH plus an adapter-boundary check pass
- [ ] 3.2 Document cron/CI wiring in the adapters README (schedule
      descriptor, watch invocation, launcher flag, chat posting) and
      verify the documented flags match the implemented CLI (`--help`
      diff)

## 4. Live proof

- [ ] 4.1 Live night-watch run on a real drifted province with the real
      opencode launcher: bound set, one vessel drifted, watch launched the
      repair, chart healed (`pending correction` cleared), history
      attributes the night watch — record the watch report as evidence
