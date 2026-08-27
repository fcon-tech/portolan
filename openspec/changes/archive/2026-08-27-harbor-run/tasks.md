# harbor-run Tasks

## 1. Core

- [x] 1.1 Implement `runProposal` in `core/src/harbor/run.ts` (queue lookup,
      any-kind launch via `launchExpedition`, accept `by: governor` then
      append-failure semantics; `GOVERNOR` constant; `appendLaunchFailure`
      attribution option) and verify with fake launchers: a gap proposal
      launches end-to-end, an unknown fingerprint throws naming it, a
      failing launcher records `launch-failed by: governor` and the
      proposal stays queued, a missing launcher is rejected before any
      history write

## 2. Rendering + CLI

- [x] 2.1 Add `renderRunChat` (proposal lines + outcome; deterministic
      bytes) with a golden test
- [x] 2.2 Add the `run` CLI subcommand (required `--fingerprint` +
      `--launcher`; `--launcher-timeout`; `--format` defaults to chat) and
      verify flag discipline: missing flags → usage error exit 1, launcher
      flags rejected on propose

## 3. Live proof + archive

- [x] 3.1 Live-run one standing gap proposal on the dogfood province
      through the opencode launcher; verify the history attribution and the
      healed gap; full suite green; archive
