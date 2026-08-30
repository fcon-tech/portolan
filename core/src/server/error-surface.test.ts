/**
 * The error surface (tasks.md 3.1, 3.2; specs/harness: "Tool rejections
 * surface as tool errors, not crashes"). Two proofs:
 *
 * 1. A rejected chart write comes back as an MCP tool error carrying the
 *    chart store's own message verbatim — including the offending entry's
 *    name — and a follow-up call on the same session succeeds.
 * 2. A whole sequence of rejected calls (malformed sweep pattern, missing
 *    binary, invalid entry) leaves the server alive and answering.
 */
import { test, expect } from "bun:test";
import { writeChart } from "../chart-store";
import { ChartValidationError } from "../validate";
import {
  envWithoutCtags,
  errorTextOf,
  makeProvince,
  structuredOf,
  withServer,
} from "./test-harness";
import { findBinary } from "../tools/shared";

const rgPresent = findBinary("rg") !== undefined;

/** An anchor-less fairway: valid shape, no anchors — the store must refuse. */
const anchorLessEntry = {
  kind: "fairway",
  id: "f-nowhere",
  from: "v-a",
  to: "v-b",
  trust: "measured",
};

test("a rejected chart.write is a tool error naming the entry, verbatim from the store", async () => {
  const target = makeProvince();

  // Ground truth: what does the store itself say about this entry?
  let storeMessage = "";
  try {
    writeChart(target, [anchorLessEntry] as never);
  } catch (err) {
    expect(err).toBeInstanceOf(ChartValidationError);
    storeMessage = (err as Error).message;
  }
  expect(storeMessage).toContain("fairway/f-nowhere");

  await withServer({ targetRoot: target }, async (client) => {
    const rejected = await client.callTool({
      name: "chart.write",
      arguments: { entries: [anchorLessEntry] },
    });
    expect(rejected.isError).toBe(true);

    // The tool error carries the store's message verbatim and names the
    // offending entry; nothing was persisted.
    expect(errorTextOf(rejected)).toBe(storeMessage);
    expect(errorTextOf(rejected)).toContain("fairway/f-nowhere");

    // A follow-up call to another tool succeeds on the same session, no restart.
    const followUp = await client.callTool({
      name: "manifests",
      arguments: { path: "package.json" },
    });
    expect(followUp.isError).toBeUndefined();
    expect(structuredOf(followUp)).toBeObject();

    // The rejected write persisted nothing: chart.read still refuses honestly.
    const noChart = await client.callTool({ name: "chart.read", arguments: {} });
    expect(noChart.isError).toBe(true);
    expect(errorTextOf(noChart)).toContain("no chart index");
  });
});

test.skipIf(!rgPresent || envWithoutCtags() === undefined)(
  "repeated rejections do not kill the server: malformed pattern, missing binary, invalid entry, then a valid call",
  async () => {
    const target = makeProvince();
    const noCtags = envWithoutCtags()!;

    await withServer({ targetRoot: target, env: noCtags }, async (client) => {
      // Rejection 1: a malformed sweep pattern, named by the tool.
      const badPattern = await client.callTool({
        name: "sweep",
        arguments: { pattern: "(" },
      });
      expect(badPattern.isError).toBe(true);
      expect(errorTextOf(badPattern)).toContain('"("');

      // Rejection 2: a missing binary path (ctags absent from PATH).
      const noBinary = await client.callTool({
        name: "symbols",
        arguments: { name: "CartService" },
      });
      expect(noBinary.isError).toBe(true);
      expect(errorTextOf(noBinary)).toContain("ctags");

      // Rejection 3: an invalid chart entry (trust label outside the vocabulary).
      const invalidEntry = await client.callTool({
        name: "chart.write",
        arguments: {
          entries: [
            {
              kind: "vessel",
              id: "v-bad",
              name: "bad",
              paths: ["src"],
              anchors: [{ type: "file", path: "src/cart.ts", line: 1 }],
              trust: "legendary",
            },
          ],
        },
      });
      expect(invalidEntry.isError).toBe(true);
      expect(errorTextOf(invalidEntry)).toContain("vessel/v-bad");
      expect(errorTextOf(invalidEntry)).toContain("measured, charted, reported, doubtful, unsurveyed");

      // The server never restarted: the next valid call answers on the
      // same session, and the served toolset is still listed in full.
      const valid = await client.callTool({
        name: "log.append",
        arguments: { command: "probe battery", outcome: "ok: server alive" },
      });
      expect(valid.isError).toBeUndefined();
      expect((structuredOf(valid) as { id: string }).id).toBe("r1");

      const listed = await client.listTools();
      expect(listed.tools.length).toBe(13);
    });
  },
);
