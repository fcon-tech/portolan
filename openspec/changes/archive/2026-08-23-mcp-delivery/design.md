## Context

See proposal.md — Why. By the time this change is implemented, core-foundation
supplies the chart store, probe-tools the probes and log, soundings the
verification operations; this change only delivers them to a harness. The
harness order (opencode first, pi/omp by portability), the "zero
harness-specific code in the core" rule, and the `adapters/` layout are
settled in docs/MANIFEST.md — not re-argued here.

## Goals / Non-Goals

**Goals:**

- One stdio MCP server whose tool table is the single wiring point for every
  Portolan tool.
- Tool rejections mapped to MCP tool errors with the server process
  surviving any sequence of them.
- An opencode adapter plus pi/omp launch shims that contain configuration
  only.

**Non-Goals:**

- Changing any tool contract (each tool's inputs/outputs/errors belong to
  its own capability; this layer passes them through).
- v1.1 tools (`run`, `smells.scan`) — the tool table is built to accept
  them later without redesign.
- transports other than stdio (SSE/HTTP), auth, or multi-target serving.

## Decisions

1. **Official MCP TypeScript SDK (`@modelcontextprotocol/sdk`) on Bun.**
   It owns wire compatibility, tool input schemas, and the error taxonomy.
   Alternative: hand-rolled JSON-RPC over stdio — rejected: protocol drift
   against every harness for zero product value; the SDK is the protocol's
   reference implementation and the only new dependency.
2. **Target root is a launch argument (`--target <root>`, defaulting to
   cwd), stored once at startup.** Every tool handler receives the bound
   root implicitly; calls that carry their own target are rejected as the
   spec requires. Alternative: per-call target arguments — rejected: invites
   cross-province accidents and makes receipts ambiguous.
3. **One tool registry table: Portolan name → handler + input schema.**
   Wiring a tool is a table entry; the server loop, error mapping, and
   adapters never change per tool. This is the mechanical enforcement of
   "zero harness-specific code in core tools" and the cheap path for v1.1
   additions.
4. **Error mapping at the handler boundary.** Each handler wraps its tool
   call and converts any rejection into an MCP tool error carrying the
   tool's message verbatim (the chart store's entry-naming errors are
   product surface, per the chart capability). Process-level exceptions are
   reserved for transport failures only. Alternative: a global
   catch-and-log — rejected: it turns rejections into silent nulls and
   violates the not-crash/not-swallow split the spec draws.
5. **Adapters are launch configuration, not code paths.** The opencode
   adapter registers the server's launch line; pi/omp shims are thin
   launcher scripts with the same line. No adapter parses tool traffic.
   Alternative: per-harness feature flags in the server — rejected: the
   spec's two-harnesss parity scenario would be untestable by
   construction.
6. **Bun as runtime for the server binary** (one language across core,
   tools, adapters per docs/MANIFEST.md); the shims do nothing but exec it.

## Risks / Trade-offs

- [MCP SDK major-version churn] → The registry table isolates handlers
  from server plumbing; an SDK bump touches one module plus the
  integration test.
- [Large sweep results stall stdio] → Chunks are bounded per result at the
  tools layer; if a Bigtop-scale sweep still overflows, cap and page in the
  handler — contract unchanged.
- [Harness MCP dialect differences (opencode quirks)] → Confined to the
  adapter's launch configuration; the parity scenario pins the core to
  identical behavior.

## Migration Plan

Greenfield: server under `core/`, adapters under `adapters/`. Rollback =
remove both; tool implementations are unaffected.
