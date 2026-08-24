#!/usr/bin/env bun
/**
 * The headless Harbor Master CLI — the scheduler's entry (Portolan ships no
 * daemon; the harbor schedule setting only documents an external cadence).
 *
 *   bun core/src/harbor/cli.ts propose [--target <province root>] [--format chat|json]
 *
 * `propose` computes the deterministic queue and prints it: `--format chat`
 * is the postable chat rendering (nothing at all on an empty queue),
 * `--format json` (the default) is the machine queue. Both are
 * deterministic — two runs over an unchanged province emit identical
 * output. Settings warnings print to stderr so stdout stays postable; any
 * failure (no chart, corrupt settings, bad arguments) exits 1 with the
 * error on stderr.
 * openspec/changes/harbor-master (harbor capability: scheduling is an
 * explicit setting, off by default)
 */
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { renderQueueChat } from "./chat-format";
import { computeProposals } from "./proposals";
import { readSettings } from "./settings";

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const USAGE = "usage: bun core/src/harbor/cli.ts propose [--target <province root>] [--format chat|json]";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    target: { type: "string", default: process.cwd() },
    format: { type: "string", default: "json" },
  },
});

if (positionals.length !== 1 || positionals[0] !== "propose") {
  fail(USAGE);
}
if (values.format !== "chat" && values.format !== "json") {
  fail(`--format must be "chat" or "json", got ${JSON.stringify(values.format)}`);
}

const targetRoot = resolve(values.target as string);

// The settings file is read for its warnings and its documented cadence;
// nothing is interpreted from harbor.schedule — the scheduler owns timing.
const { warnings } = readSettings(targetRoot);
for (const warning of warnings) console.error(warning);

const result = computeProposals(targetRoot);
process.stdout.write(values.format === "chat" ? renderQueueChat(result) : `${JSON.stringify(result, null, 2)}\n`);
