#!/usr/bin/env bun
/**
 * The headless Harbor Master CLI — the scheduler's entry (Portolan ships no
 * daemon; the harbor schedule setting only documents an external cadence).
 *
 *   bun core/src/harbor/cli.ts propose [--target <province root>] [--format chat|json]
 *   bun core/src/harbor/cli.ts watch [--target <province root>] [--format chat|json]
 *                                      [--launcher "<command>"] [--launcher-timeout <duration>]
 *
 * `propose` computes the deterministic queue and prints it: `--format chat`
 * is the postable chat rendering (nothing at all on an empty queue),
 * `--format json` (the default) is the machine queue.
 *
 * `watch` (openspec/changes/night-watch) applies the night policy to the
 * queue, launches what qualifies through the external launcher, records the
 * auto-accepts (`by night-watch`) and any launch failures in the harbor
 * history, and prints one chat-formatted watch report (`--format chat` is
 * the default; `--format json` is the machine report). A launch failure is
 * receipted, not fatal: the exit stays 0 so the scheduler always gets the
 * report; the failure is named in it and appended to the history.
 *
 * Both commands are deterministic — two runs over an unchanged province
 * emit identical output. Settings warnings print to stderr so stdout stays
 * postable; any failure (no chart, corrupt settings, bad arguments) exits 1
 * with the error on stderr.
 * openspec/changes/harbor-master + openspec/changes/night-watch (harbor
 * capability: scheduling is an explicit setting, off by default / the
 * night watch acts only on invocation)
 */
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { renderQueueChat, renderWatchChat } from "./chat-format";
import { computeProposals } from "./proposals";
import { readSettings } from "./settings";
import { runWatch } from "./watch";
import { DEFAULT_LAUNCHER_TIMEOUT_MS, formatDuration, parseDurationMs } from "./launcher";

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const USAGE = "usage: bun core/src/harbor/cli.ts <propose|watch> [flags] — try --help";

const HELP = `Portolan harbor CLI — the scheduler's entry (no daemon).

usage:
  bun core/src/harbor/cli.ts propose [--target <province root>] [--format chat|json]
  bun core/src/harbor/cli.ts watch [--target <province root>] [--format chat|json] \\
                                    [--launcher "<command>"] [--launcher-timeout <duration>]

commands:
  propose  compute the deterministic expedition queue and print it
  watch    apply the night policy (harbor.auto_repair_max_vessels), launch
           what qualifies through the external launcher, record the history,
           and print the chat-formatted watch report

flags:
  --target <province root>    the province to operate on (default: working directory)
  --format <chat|json>        output format; propose defaults to json, watch to chat
  --launcher "<command>"      watch only: the external launcher to spawn; the
                              proposal brief arrives as JSON on stdin; absent means
                              report-only (nothing is launched)
  --launcher-timeout <duration>
                              watch only: how long one launch may run
                              (default: ${formatDuration(DEFAULT_LAUNCHER_TIMEOUT_MS)}); e.g. 45s, 30m, 1h
  --help                     print this help`;

let parsed;
try {
  parsed = parseArgs({
    allowPositionals: true,
    options: {
      target: { type: "string", default: process.cwd() },
      format: { type: "string" },
      launcher: { type: "string" },
      "launcher-timeout": { type: "string" },
      help: { type: "boolean", default: false },
    },
  });
} catch (err) {
  fail((err as Error).message);
}
const { values, positionals } = parsed;

if (values.help) {
  console.log(HELP);
  process.exit(0);
}

if (positionals.length !== 1 || (positionals[0] !== "propose" && positionals[0] !== "watch")) {
  fail(USAGE);
}
const command = positionals[0];

// The launcher flags belong to the watch alone; accepting them silently
// elsewhere would be a false promise.
if (command === "propose" && (values.launcher !== undefined || values["launcher-timeout"] !== undefined)) {
  fail("--launcher and --launcher-timeout belong to the watch command");
}

const format = values.format ?? (command === "watch" ? "chat" : "json");
if (format !== "chat" && format !== "json") {
  fail(`--format must be "chat" or "json", got ${JSON.stringify(format)}`);
}

const targetRoot = resolve(values.target as string);

// The settings file is read for its warnings and the watch's auto-repair
// bound; nothing is interpreted from harbor.schedule — the scheduler owns
// timing. (runWatch reads the settings again for the bound itself.)
const { warnings } = readSettings(targetRoot);
for (const warning of warnings) console.error(warning);

if (command === "propose") {
  const result = computeProposals(targetRoot);
  process.stdout.write(
    format === "chat" ? renderQueueChat(result) : `${JSON.stringify(result, null, 2)}\n`,
  );
} else {
  let timeoutMs = DEFAULT_LAUNCHER_TIMEOUT_MS;
  if (values["launcher-timeout"] !== undefined) {
    try {
      timeoutMs = parseDurationMs(values["launcher-timeout"]);
    } catch (err) {
      fail((err as Error).message);
    }
  }

  const report = await runWatch(targetRoot, {
    launcher: values.launcher,
    launcherTimeoutMs: timeoutMs,
  });
  process.stdout.write(
    format === "chat" ? renderWatchChat(report) : `${JSON.stringify(report, null, 2)}\n`,
  );
}
