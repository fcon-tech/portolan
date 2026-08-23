/**
 * Through-the-server wiring tests. Where the unit suites pin the tool
 * implementations and the registry table, this file proves the MCP layer:
 * every call goes through the real stdio server entry point, and the result
 * that comes back is the tool's own structured result, unchanged.
 * (openspec/changes/mcp-delivery, specs/harness/spec.md)
 */
import { test, expect } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { makeProvince, withServer, structuredOf } from "./test-harness";
import { V1_TOOL_NAMES } from "./registry";
import { readChart } from "../chart-store";

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

/** A minimal, valid chart: two vessels and the fairway between them. */
function sampleEntries(): unknown[] {
  return [
    {
      kind: "vessel",
      id: "v-cart",
      name: "cart",
      behavior: "holds the shopping cart",
      paths: ["src"],
      anchors: [{ type: "file", path: "src/cart.ts", line: 4 }],
      trust: "measured",
    },
    {
      kind: "vessel",
      id: "v-checkout",
      name: "checkout",
      paths: ["src"],
      anchors: [{ type: "file", path: "src/checkout.ts", line: 1 }],
      trust: "measured",
    },
    {
      kind: "fairway",
      id: "f-checkout-cart",
      from: "v-checkout",
      to: "v-cart",
      anchors: [{ type: "file", path: "src/checkout.ts", line: 1 }],
      trust: "measured",
    },
  ];
}

test("chart.write through the server persists; chart.read reads it back verbatim", async () => {
  const target = makeProvince();
  await withServer({ targetRoot: target }, async (client) => {
    const write = await client.callTool({
      name: "chart.write",
      arguments: { entries: sampleEntries() },
    });
    expect(write.isError).toBeUndefined();
    const result = structuredOf(write) as { dir: string; notices: unknown[] };
    expect(result.dir).toBe(join(target, ".portolan", "chart"));
    expect(result.notices.length).toBe(3); // three additions

    // The write persisted on disk inside the province perimeter.
    expect(existsSync(join(target, ".portolan", "chart", "index.jsonl"))).toBe(true);

    // Reading back through the server returns exactly what the store holds.
    const read = await client.callTool({ name: "chart.read", arguments: {} });
    expect(read.isError).toBeUndefined();
    const { entries } = structuredOf(read) as { entries: unknown[] };
    expect(entries).toEqual(readChart(target));
    expect(entries.length).toBe(3);
  });
});

test("log.append through the server leaves a receipt; log.read resolves it by id and filter", async () => {
  const target = makeProvince();
  await withServer({ targetRoot: target }, async (client) => {
    const first = await client.callTool({
      name: "log.append",
      arguments: {
        command: "sweep pattern=CartService",
        scope: "src",
        outcome: "ok: 4 chunks",
      },
    });
    expect(first.isError).toBeUndefined();
    const receipt = structuredOf(first) as { id: string; command: string; outcome: string };
    expect(receipt.id).toBe("r1");
    expect(receipt.command).toBe("sweep pattern=CartService");

    const second = await client.callTool({
      name: "log.append",
      arguments: { command: "symbols name=CartService", outcome: "ok: 1 definition" },
    });
    expect((structuredOf(second) as { id: string }).id).toBe("r2");

    const byId = await client.callTool({ name: "log.read", arguments: { id: "r1" } });
    const idReceipts = (structuredOf(byId) as { receipts: Array<{ command: string; outcome: string }> }).receipts;
    expect(idReceipts.length).toBe(1);
    expect(idReceipts[0]!.command).toBe("sweep pattern=CartService");
    expect(idReceipts[0]!.outcome).toBe("ok: 4 chunks");

    const byFilter = await client.callTool({
      name: "log.read",
      arguments: { filter: { command: "symbols name=CartService" } },
    });
    expect((structuredOf(byFilter) as { receipts: unknown[] }).receipts.length).toBe(1);

    // A dead id is an honest empty read, not an error.
    const dead = await client.callTool({ name: "log.read", arguments: { id: "r404" } });
    expect((structuredOf(dead) as { receipts: unknown[] }).receipts).toEqual([]);
  });
});
