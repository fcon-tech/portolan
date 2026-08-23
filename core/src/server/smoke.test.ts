/**
 * Smoke test for the server scaffold (tasks.md 1.1, 1.2): the entry point
 * launches under Bun, the SDK's stdio transport connects, and a full
 * initialize → tools/list handshake completes. The tool table is exercised
 * deeper in the wiring suites; here we prove the server is alive on MCP.
 */
import { test, expect } from "bun:test";
import { makeProvince, withServer } from "./test-harness";
import { SERVER_INFO } from "./server";

test("the server launches and completes an initialize/list-tools handshake", async () => {
  const target = makeProvince();
  await withServer({ targetRoot: target }, async (client) => {
    // client.connect() already performed the initialize handshake; assert
    // the server identified itself as Portolan.
    expect(client.getServerVersion()).toEqual(
      expect.objectContaining({ name: SERVER_INFO.name, version: SERVER_INFO.version }),
    );

    const listed = await client.listTools();
    expect(Array.isArray(listed.tools)).toBe(true);
    for (const tool of listed.tools) {
      expect(tool.inputSchema.type).toBe("object");
    }
  });
});

test("the server answers a second handshake-scoped request on the same connection", async () => {
  const target = makeProvince();
  await withServer({ targetRoot: target }, async (client) => {
    const first = await client.listTools();
    const second = await client.listTools();
    expect(second.tools).toEqual(first.tools);
  });
});
