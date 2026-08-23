## 1. Server scaffold

- [x] 1.1 Create the MCP server entry point under `core/` (Bun, stdio
      transport) accepting `--target <root>` (default cwd) and verify a
      smoke test launches it and completes an initialize/list-tools
      handshake
- [x] 1.2 Add the `@modelcontextprotocol/sdk` dependency and verify
      `bun install` succeeds and the SDK's stdio transport connects in the
      smoke test

## 2. Tool registry and wiring

- [x] 2.1 Implement the tool registry (Portolan name → handler + input
      schema, target root injected at launch) and verify a test listing
      tools through the server returns all nine v1 names
- [x] 2.2 Wire `chart.read` / `chart.write` / `log.append` / `log.read`
      and verify round-trip tests through the server: a write that
      persists, then reads back by the server path
- [x] 2.3 Wire `sweep` / `symbols` / `manifests` / `sound.edge` /
      `sound.anchor` and verify per-tool tests call each through the server
      against a temp target and receive the structured, anchored,
      trust-labeled results unchanged
- [x] 2.4 Implement per-call target rejection and verify a test sending a
      foreign target root receives an error naming the launched target

## 3. Error surface

- [x] 3.1 Implement rejection-to-tool-error mapping at the handler boundary
      and verify a test submitting an anchor-less `chart.write` receives a
      tool error naming the entry with the message the chart store produced
- [x] 3.2 Add the crash-resistance test (a sequence of rejected calls —
      malformed pattern, missing binary path, invalid entry — followed by a
      valid call) and verify the server answers the valid call without
      restart

## 4. Adapters

- [x] 4.1 Implement the opencode adapter (launch configuration only) and
      verify installing it in an opencode sandbox lists all nine tools
- [x] 4.2 Implement the pi and omp launch shims (exec the server, no
      traffic handling) and verify a parity test comparing tool lists and
      one result per harness against a direct launch shows no differences
- [x] 4.3 Add an adapter-boundary check (static scan that `adapters/`
      imports no tool logic) and verify it fails when a tool module is
      imported from an adapter
