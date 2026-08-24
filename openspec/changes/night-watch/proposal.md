## Why

The harbor proposes expeditions when a session is present. The Governor
wants the province to heal itself overnight: drift accumulates after every
edit, and small repairs should not wait for a human to open a chat. The
night watch turns the standing queue into action under an explicit,
bounded, off-by-default policy — without shipping a daemon.

## What Changes

- Add a `watch` command to the harbor CLI: computes the queue, applies the
  night policy, launches what qualifies, and emits a chat-formatted watch
  report. Designed for external schedulers (cron/CI); Portolan still ships
  no daemon.
- Night policy (settings): auto-repair runs ONLY `repair` proposals whose
  affected vessels are within `harbor.auto_repair_max_vessels` (absent/0 =
  never launch — report-only). `new-land` and `gap` proposals are never
  auto-executed.
- Expedition launch is delegated to an external launcher command (swappable
  per harness); the opencode adapter ships one (`expedition-launcher`),
  which runs the Cartographer headlessly with the repair brief.
- Auto-accepted decisions and outcomes are recorded in the harbor history
  (`by: night-watch`); a failed launch leaves the proposal pending and the
  failure named in the report.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `harbor`: adds new requirements (delta uses ADDED — no standing harbor
  requirement changes text): the night-watch policy execution, the bounded
  auto-repair setting, the external swappable launcher, night history
  records, and the chat-formatted watch report.

## Impact

- New code: watch policy + report in `core/src/harbor/`, launcher spawn
  with timeout, settings extension (`auto_repair_max_vessels`).
- New adapter artifact: `adapters/opencode/expedition-launcher`.
- README wiring examples (cron/CI). No MCP surface change (still eleven
  tools); no chart, soundings, or sea-trial changes.
