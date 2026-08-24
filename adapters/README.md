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
