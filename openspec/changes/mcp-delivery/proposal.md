## Why

The tool contracts exist on paper (chart, probes, soundings, ship's log) but
no harness can call them yet. The first-run contract in docs/MANIFEST.md
requires the Cartographer's harness to see Portolan as native tools served
over one Model Context Protocol server — without that delivery layer there
is no expedition at all.

## What Changes

- Add capability `harness`: a single MCP server over stdio exposing the
  complete v1 toolset — `chart.read`, `chart.write`, `sweep`, `symbols`,
  `manifests`, `sound.edge`, `sound.anchor`, `log.append`, `log.read` —
  under their Portolan names.
- Define the error surface: rejections from the underlying tools (for
  example the chart store refusing an anchor-less entry) surface as MCP
  tool errors; the server keeps serving.
- Bind the server to one province (target root) at launch.
- Mandate zero harness-specific code in the served tools: opencode adapter
  first, pi/omp as thin launch shims, identical behavior everywhere.

## Capabilities

### New Capabilities

- `harness`: how Portolan reaches the Cartographer's harness — one MCP
  stdio server for all tools, tool errors instead of crashes, and
  harness-agnostic delivery with opencode as the first adapter.

### Modified Capabilities

(none)

## Impact

- Implementation lands later as the MCP server under `core/` plus harness
  adapters under `adapters/` (opencode first, pi/omp shims).
- Depends on the tool implementations from core-foundation, probe-tools, and
  soundings; does not change their contracts.
- New dependency: the official MCP TypeScript SDK (recorded in design.md).
