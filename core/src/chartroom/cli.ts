#!/usr/bin/env bun
/**
 * The Chart Room CLI — the human/scheduler entry (the MCP tool `chart.render`
 * is the other one; both call the same core function).
 *
 *   bun core/src/chartroom/cli.ts render [--target <province root>]
 *
 * Prints the written artifact path and the rendered entry counts. Any
 * failure (no chart, unreadable index) exits 1 with the error on stderr.
 * Deterministic: two runs over an unchanged province write identical bytes.
 */
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { renderChartRoom } from "./render";

const usage = `usage: bun core/src/chartroom/cli.ts render [--target <province root>]`;

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    target: { type: "string", default: process.cwd() },
  },
});

if (positionals[0] !== "render" || positionals.length > 1) {
  console.error(usage);
  process.exit(1);
}

try {
  const result = renderChartRoom(resolve(values.target as string));
  console.log(`chart-room.html written: ${result.path}`);
  console.log(`entries: ${result.entries} — ${JSON.stringify(result.counts)}`);
} catch (err) {
  console.error(String(err instanceof Error ? err.message : err));
  process.exit(1);
}
