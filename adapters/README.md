# Portolan harness adapters

How the one Portolan MCP server reaches a harness. Adapters are launch
configuration only: they configure how the server is launched and add no
behavior of their own — no tool filtering, no traffic parsing, no
per-harness code paths. Two harnesses connecting through different adapters
see the same nine tools, the same results, and the same errors as a direct
launch (`specs/harness`: "The served tools are harness-agnostic").

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
session can call all nine v1 tools.

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
