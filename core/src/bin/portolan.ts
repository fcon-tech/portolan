#!/usr/bin/env bun
/**
 * The `portolan` dispatcher — the single bin the published package exposes.
 * It routes to the existing entry points; it implements nothing itself:
 *
 *   portolan serve --target <province root>      → server/main.ts (MCP over stdio)
 *   portolan export [--target <province root>]   → tools/export.ts (chartExport)
 *   portolan chartroom <render|review> …        → chartroom/cli.ts
 *   portolan harbor <propose|watch|run> …       → harbor/cli.ts
 *
 * `serve` runs in-process (same parse, same server wiring as main.ts);
 * the CLIs are spawned with inherited stdio so their behavior — output,
 * exit codes — is indistinguishable from running them directly. `export`
 * also runs in-process, over the same core function the served chart.export
 * tool calls (design D6: MCP and CLI cannot diverge); it prints the
 * document pretty-printed (two spaces, trailing newline), the same shape
 * the harbor CLI prints its JSON in, and it appends no ship's-log receipt —
 * receipts are the served tools' discipline, never a CLI side effect.
 */
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const SUBCOMMANDS = ["serve", "export", "chartroom", "harbor"] as const;

const usage = `usage: portolan <command> [args]

commands:
  serve      run the Portolan MCP server (stdio)
  export     adjacency graph export of the Chart (JSON to stdout)
  chartroom  Chart Room CLI (render | review)
  harbor     harbor CLI (propose | watch | run)`;

function failUsage(): never {
  console.error(`${usage}\n\nvalid commands: ${SUBCOMMANDS.join(", ")}`);
  process.exit(1);
}

/** Path to a sibling source file of this dispatcher. */
function srcPath(relative: string): string {
  return fileURLToPath(new URL(relative, import.meta.url));
}

async function serve(rest: readonly string[]): Promise<void> {
  // Same parse and wiring as core/src/server/main.ts — behavior
  // indistinguishable from launching that file directly.
  const { parseArgs } = await import("node:util");
  const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
  const { createPortolanServer } = await import("../server/server");

  const { values } = parseArgs({
    // Same parse as main.ts, over the args after the `serve` subcommand.
    args: rest,
    allowPositionals: false,
    options: {
      target: { type: "string", default: process.cwd() },
    },
  });
  const targetRoot = resolve(values.target as string);
  const server = createPortolanServer({ targetRoot });
  await server.connect(new StdioServerTransport());
}

async function exportJson(rest: readonly string[]): Promise<void> {
  // Same parse shape as `serve`, over the args after the `export` subcommand;
  // the same chartExport the served chart.export tool calls (design D6).
  const { parseArgs } = await import("node:util");
  const { chartExport, ExportError } = await import("../tools/export");

  const { values } = parseArgs({
    args: rest,
    allowPositionals: false,
    options: {
      target: { type: "string", default: process.cwd() },
    },
  });
  try {
    const doc = chartExport(resolve(values.target as string));
    console.log(JSON.stringify(doc, null, 2));
  } catch (err) {
    // The honest errors (no Chart, fairways alone over budget): name them on
    // stderr, exit nonzero, never print a document. No receipt is appended —
    // this path never touches the ship's log, on success or rejection.
    if (err instanceof ExportError) {
      console.error(err.message);
      process.exit(1);
    }
    throw err;
  }
}

/** Run one of the existing CLI scripts with the remaining args, verbatim. */
function runCli(script: string, args: string[]): never {
  const child = spawn(process.execPath, [script, ...args], { stdio: "inherit" });
  child.on("exit", (code, signal) => {
    if (signal !== null) process.kill(process.pid, signal);
    else process.exit(code ?? 1);
  });
  // Never resolves in practice; keeps the dispatcher alive for the child.
  return new Promise<never>(() => {}) as never;
}

async function dispatch(argv: readonly string[]): Promise<void> {
  const [command, ...rest] = argv;
  switch (command) {
    case "serve":
      return serve(rest);
    case "export":
      return exportJson(rest);
    case "chartroom":
      return runCli(srcPath("../chartroom/cli.ts"), rest);
    case "harbor":
      return runCli(srcPath("../harbor/cli.ts"), rest);
    default:
      failUsage();
  }
}

if (import.meta.main) {
  await dispatch(Bun.argv.slice(2));
}
