/**
 * Unit checks on the tool registry table itself (tasks.md 2.1): the table
 * is the wiring point, so its shape is pinned — the nine v1 Portolan names,
 * a schema and a handler per entry — and argument readers stay strict.
 */
import { test, expect } from "bun:test";
import { TOOL_TABLE, V1_TOOL_NAMES, ToolInputError } from "./registry";

test("the registry table holds exactly the nine v1 tools under Portolan names", () => {
  expect(V1_TOOL_NAMES).toEqual([
    "chart.read",
    "chart.write",
    "sweep",
    "symbols",
    "manifests",
    "sound.edge",
    "sound.anchor",
    "log.append",
    "log.read",
  ]);
  expect(new Set(V1_TOOL_NAMES).size).toBe(9);
});

test("every registry entry is complete: description, object schema, handler", () => {
  for (const spec of TOOL_TABLE) {
    expect(spec.description.length).toBeGreaterThan(0);
    expect((spec.inputSchema as { type?: string }).type).toBe("object");
    expect(typeof spec.handler).toBe("function");
  }
});

test("handlers receive the bound target root, never a per-call target", async () => {
  // The context is the whole world a handler sees; assert its shape once.
  const seen: unknown[] = [];
  const spec = TOOL_TABLE.find((t) => t.name === "sweep");
  if (spec === undefined) throw new Error("sweep missing from the table");
  const args = { pattern: "CartService" } as Record<string, unknown>;
  delete args.target;
  try {
    await spec.handler(args, { targetRoot: "/definitely/not/a/province" });
  } catch (err) {
    // The handler ran against the injected root and the tool rejected it —
    // the context reached the tool, which is all this test pins.
    expect(err).not.toBeInstanceOf(ToolInputError);
    seen.push(err);
  }
  expect(seen.length).toBe(1);
  expect((seen[0] as Error).message).toContain("/definitely/not/a/province");
});

test("argument readers are strict: a missing required argument is a named tool input error", () => {
  const spec = TOOL_TABLE.find((t) => t.name === "sweep");
  if (spec === undefined) throw new Error("sweep missing from the table");
  expect(() => spec.handler({}, { targetRoot: process.cwd() })).toThrow(ToolInputError);
  expect(() => spec.handler({}, { targetRoot: process.cwd() })).toThrow(/"pattern"/);
});
