#!/usr/bin/env bun
/**
 * The Chart Room CLI — human/scheduler entries (the MCP tool `chart.render`
 * is the single-province one; both call the same core functions).
 *
 *   bun core/src/chartroom/cli.ts render --target <province root>
 *       One-file Chart Room export for one province.
 *
 *   bun core/src/chartroom/cli.ts review --target <t1> [--target <t2> ...]
 *       Fleet review: a multi-province index page, written into the FIRST
 *       named target's .portolan/fleet-review.html ("the reviewing
 *       harbor"). Targets are read-only; nothing is discovered by scanning.
 *
 * Both commands are deterministic over unchanged inputs. Any failure (no
 * chart, bad arguments) exits 1 with the error on stderr.
 */
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { renderChartRoom } from "./render";
import { buildFleetReview } from "./review";

const usage = `usage:
  bun core/src/chartroom/cli.ts render --target <province root>
  bun core/src/chartroom/cli.ts review --target <t1> [--target <t2> ...]`;

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    target: { type: "string", multiple: true, default: [] },
  },
});

const command = positionals[0];
if (
  !command ||
  (command !== "render" && command !== "review") ||
  positionals.length > 1 ||
  values.target.length === 0
) {
  console.error(usage);
  process.exit(1);
}
// render takes exactly one province; silently ignoring the rest would
// pretend the extra targets were served.
if (command === "render" && values.target.length > 1) {
  console.error("render takes one --target; to assemble several provinces use review");
  process.exit(1);
}

try {
  if (command === "render") {
    const result = renderChartRoom(resolve(values.target[0]!));
    console.log(`chart-room.html written: ${result.path}`);
    console.log(`entries: ${result.entries} — ${JSON.stringify(result.counts)}`);
  } else {
    const result = buildFleetReview(values.target.map((t) => resolve(t)));
    console.log(`fleet-review.html written: ${result.path}`);
    console.log(`provinces: ${result.provinces}`);
  }
} catch (err) {
  console.error(String(err instanceof Error ? err.message : err));
  process.exit(1);
}
