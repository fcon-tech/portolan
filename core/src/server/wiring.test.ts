/**
 * Through-the-server wiring tests. Where the unit suites pin the tool
 * implementations and the registry table, this file proves the MCP layer:
 * every call goes through the real stdio server entry point, and the result
 * that comes back is the tool's own structured result, unchanged.
 * (openspec/changes/mcp-delivery, specs/harness/spec.md)
 */
import { test, expect } from "bun:test";
import { makeProvince, withServer } from "./test-harness";
import { V1_TOOL_NAMES } from "./registry";

test("tools/list through the server returns all nine v1 tools under Portolan names", async () => {
  const target = makeProvince();
  await withServer({ targetRoot: target }, async (client) => {
    const listed = await client.listTools();
    expect(listed.tools.map((tool) => tool.name)).toEqual(V1_TOOL_NAMES);
    for (const tool of listed.tools) {
      expect((tool.description ?? "").length).toBeGreaterThan(0);
      expect((tool.inputSchema as { type?: string }).type).toBe("object");
    }
  });
});
