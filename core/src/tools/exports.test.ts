import { test, expect } from "bun:test";
import * as portolan from "../index";

test("the public surface exports the probe-tool entry points", () => {
  for (const name of [
    "sweep",
    "symbols",
    "manifestKindOf",
    "readManifest",
    "appendReceipt",
    "readReceipt",
    "readReceipts",
    "receiptAnchor",
  ] as const) {
    expect(typeof (portolan as Record<string, unknown>)[name]).toBe("function");
  }
});
