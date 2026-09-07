#!/usr/bin/env bun
/**
 * The `portolan` dispatcher — the single bin the published package exposes.
 * It routes to the existing entry points; it implements nothing itself:
 *
 *   portolan serve --target <province root>      → server/main.ts (MCP over stdio)
 *   portolan export [--target <province root>]   → tools/export.ts (chartExport)
 *   portolan chartroom <render|review> …        → chartroom/cli.ts
 *   portolan harbor <propose|watch|run> …       → harbor/cli.ts
 *   portolan pointer                             → pointer/index.ts (renderPointer)
 *   portolan install --target <province root>    → adapters/opencode/install.ts
 *
 * `serve` runs in-process (same parse, same server wiring as main.ts);
 * the CLIs are spawned with inherited stdio so their behavior — output,
 * exit codes — is indistinguishable from running them directly. `export`
 * also runs in-process, over the same core function the served chart.export
 * tool calls (design D6: MCP and CLI cannot diverge); it prints the
 * document pretty-printed (two spaces, trailing newline), the same shape
 * the harbor CLI prints its JSON in, and it appends no ship's-log receipt —
 * receipts are the served tools' discipline, never a CLI side effect.
 * `pointer` runs in-process on the same discipline: it prints the rendered
 * Pointer block — the same core render the installer places, the skill
 * name derived from the shipped SKILL.md frontmatter — takes no arguments
 * (the block is target-independent), and touches no ship's log. `install`
 * is spawned with the remaining args verbatim — the chartroom/harbor
 * pattern. The bin is the composition root: core spawning the adapter
 * installer there is wiring, not the core→adapters library dependency
 * engineering.md §1 forbids (that rule governs library layering; the entry
 * point composes, as the server wiring does — pointer-bridge design.md).
 */
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const SUBCOMMANDS = ["serve", "export", "chartroom", "harbor", "pointer", "install"] as const;

const usage = `usage: portolan <command> [args]

commands:
  serve      run the Portolan MCP server (stdio)
  export     adjacency graph export of the Chart (JSON to stdout)
  chartroom  Chart Room CLI (render | review)
  harbor     harbor CLI (propose | watch | run)
  pointer    print the Pointer block for AGENTS.md (to stdout)
  install    install server, skill, and Pointer into a province (--target)`;

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

async function printPointer(rest: readonly string[]): Promise<void> {
  // The block is target-independent: no arguments are accepted — any extra
  // argument is a usage error, never a block. The render is the same core
  // function the installer places (byte-identity is the delta's scenario),
  // and no ship's-log receipt is appended — the `export` CLI discipline.
  if (rest.length > 0) failUsage();
  const { renderPointer, shippedSkillName } = await import("../pointer/index");
  console.log(renderPointer(shippedSkillName()));
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
    case "pointer":
      return printPointer(rest);
    case "chartroom":
      return runCli(srcPath("../chartroom/cli.ts"), rest);
    case "harbor":
      return runCli(srcPath("../harbor/cli.ts"), rest);
    case "install":
      // The harness installer (opencode first) gets the remaining args
      // verbatim — e.g. `--target <province>` — so its behavior, output,
      // and exit codes are indistinguishable from running it directly.
      return runCli(srcPath("../../../adapters/opencode/install.ts"), rest);
    default:
      failUsage();
  }
}

if (import.meta.main) {
  await dispatch(Bun.argv.slice(2));
}
