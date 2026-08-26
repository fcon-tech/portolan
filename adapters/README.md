# Portolan harness adapters

How the one Portolan MCP server reaches a harness. Adapters are launch
configuration only: they configure how the server is launched and add no
behavior of their own — no tool filtering, no traffic parsing, no
per-harness code paths. Two harnesses connecting through different adapters
see the same eleven tools, the same results, and the same errors as a
direct launch (`specs/harness`: "The served tools are harness-agnostic").

The server itself lives at `core/src/server/main.ts`:

```
bun core/src/server/main.ts --target <province root>
```

## opencode (first adapter)

Register the server in an opencode config:

```
bun adapters/opencode/install.ts --target /path/to/province
```

Writes (or merges into) `~/.config/opencode/opencode.jsonc` — override with
`--config <path>`, e.g. a project-local `opencode.jsonc`. The block it
writes (shape verified against opencode's own `opencode mcp add`):

```json
{
  "mcp": {
    "portolan": {
      "type": "local",
      "command": ["<bun>", "<repo>/core/src/server/main.ts", "--target", "<province>"],
      "enabled": true
    }
  }
}
```

After installing, `opencode mcp list` shows `portolan connected`, and every
session can call all eleven served tools.

The opencode adapter also ships the night watch's expedition launcher
(`adapters/opencode/expedition-launcher`) — see "The night watch" below.

## pi / omp (thin launch shims)

pi and omp take their MCP client wiring from extension packages; these
shims are the launch line such an extension points at. They do nothing but
exec the server:

```
adapters/pi/portolan-mcp --target /path/to/province
adapters/omp/portolan-mcp --target /path/to/province
```

## Boundary

`adapters/` must import no tool logic — the check
(`core/src/server/adapter-boundary.ts`) fails the suite if an adapter
imports from `@portolan/core` or reaches into `core/src/`. Launching the
server is the adapter's whole job.

## Settings and external scheduling

Portolan ships no daemon. Harbor scheduling — having the expedition
proposal queue computed (and posted) on a cadence — is an explicit setting,
off by default, and the timing always belongs to an external scheduler.

The setting lives in the province at `<target>/.portolan/settings.json`:

```json
{ "harbor": { "schedule": "weekly on Monday 09:00" } }
```

`harbor.schedule` is a free-form descriptor (cron-ish or prose). Portolan
interprets nothing from it in v1 of the harbor-master change — it
documents the intended cadence for whoever wires the scheduler. The key is
absent by default; unknown keys are tolerated with a warning (printed to
stderr by the CLI below), never an error.

Any external scheduler (cron, CI) calls the headless propose CLI and posts
its chat-formatted output as-is:

```
bun core/src/harbor/cli.ts propose --target /path/to/province --format chat
```

- `--format chat` — the deterministic, postable chat rendering of the
  queue; an empty queue prints nothing, so a quiet run posts nothing.
- `--format json` (the default) — the machine queue.
- `--target` — the province root; defaults to the working directory.

Two runs over an unchanged province emit identical output, so a scheduler
may diff or deduplicate safely; a configured schedule changes nothing
about the queue's contents. Settings warnings print to stderr so stdout
stays postable. The Governor's reply — accepted or declined — is recorded
in session by the Cartographer through the `expeditions.decide` tool; the
CLI only proposes.

## The night watch (auto-repair on a scheduler)

The night watch turns the standing queue into action overnight, under an
explicit, bounded, off-by-default policy — still no daemon: it runs only
when an external scheduler (cron, CI) or a human invokes it. It computes
the queue, auto-launches only `repair` proposals whose affected vessels
are within the bound, records every auto-accept in the harbor history as
`by: night-watch`, and prints one chat-formatted watch report (what ran
with outcomes, what stayed pending with evidence, any launcher failures).

### The bound (the whole policy)

```json
{ "harbor": { "schedule": "nightly 02:00", "auto_repair_max_vessels": 3 } }
```

`harbor.auto_repair_max_vessels` is a non-negative integer in
`<target>/.portolan/settings.json`. Absent or zero means report-only:
nothing is ever auto-launched. `new-land` and `gap` proposals are never
auto-executed regardless of the bound — the night watch repairs known
coast, it does not explore. A malformed value fails loudly; it is never
silently treated as unbounded.

`harbor.schedule` remains the descriptor of the intended cadence for
whoever wires the scheduler (Portolan interprets nothing from it).

### The launcher (external and swappable)

The watch never names a harness: it spawns whatever command `--launcher`
points at, sends the brief — `{ "target": <province>, "proposal": {...} }`
— as JSON on stdin, and caps the run with `--launcher-timeout` (default
`30m`; `45s`, `30m`, `1h` style). Exit 0 means the expedition completed;
non-zero or timeout leaves the proposal queued, appends a `launch-failed`
record to the harbor history attributed to the night watch, and names the
failure in the report. Without `--launcher` the watch is report-only even
with a bound set.

The opencode adapter ships one launcher:

```
adapters/opencode/expedition-launcher
```

It reads the brief, renders the repair prompt for the Cartographer
(proposal evidence, scope, skill path, the `.portolan/` perimeter), and
runs `opencode run --pure -m "$PORTOLAN_MODEL"` (default
`zai-coding-plan/glm-5.3`) with the province as cwd, propagating
opencode's exit status. Any other harness gets the same treatment by
writing an equivalent thin script — the contract is just JSON on stdin
and an exit status.

### Cron wiring

A checked-in, drop-in crontab lives at
[`adapters/scheduling/night-watch.cron`](scheduling/night-watch.cron) —
set `PROVINCE`/`PORTOLAN` and paste. The manual form:

A nightly run that launches repairs through the opencode launcher and
mails the report (cron posts stdout automatically when there is output):

```
15 2 * * *  cd /path/to/portolan && bun core/src/harbor/cli.ts watch \
            --target /path/to/province \
            --launcher adapters/opencode/expedition-launcher \
            --launcher-timeout 45m
```

Report-only (watch without acting) is the same line minus `--launcher`;
the Governor reads the pending list in the morning and decides in session
through `expeditions.decide`.

### CI wiring

In a scheduled pipeline the report is the artifact; a launch failure is
receipted (history + report), not fatal — the command still exits 0 so
the report is always produced:

```
bun core/src/harbor/cli.ts watch \
  --target "$PROVINCE" \
  --launcher adapters/opencode/expedition-launcher \
  --launcher-timeout 45m \
  --format chat | post-to-chat -
```

`--format json` gives the machine report (`ran` with outcomes, `pending`,
`bound`, `reportOnly`) for gate tooling; `--format chat` (the watch's
default) is the postable one. Two runs over an unchanged province emit
identical output, so a pipeline may diff runs safely.

### The flags, verbatim

Documented here exactly as `bun core/src/harbor/cli.ts --help` prints them:

```
Portolan harbor CLI — the scheduler's entry (no daemon).

usage:
  bun core/src/harbor/cli.ts propose [--target <province root>] [--format chat|json]
  bun core/src/harbor/cli.ts watch [--target <province root>] [--format chat|json] \
                                    [--launcher "<command>"] [--launcher-timeout <duration>]

commands:
  propose  compute the deterministic expedition queue and print it
  watch    apply the night policy (harbor.auto_repair_max_vessels), launch
           what qualifies through the external launcher, record the history,
           and print the chat-formatted watch report

flags:
  --target <province root>    the province to operate on (default: working directory)
  --format <chat|json>        output format; propose defaults to json, watch to chat
  --launcher "<command>"      watch only: the external launcher to spawn; the
                              proposal brief arrives as JSON on stdin; absent means
                              report-only (nothing is launched)
  --launcher-timeout <duration>
                              watch only: how long one launch may run
                              (default: 30m); e.g. 45s, 30m, 1h
  --help                     print this help
```
