#!/usr/bin/env bun
/**
 * The opencode adapter — launch configuration only (design.md, decision 5).
 *
 * Registers the Portolan MCP server in an opencode config by writing the
 * `mcp.portolan` block opencode expects:
 *
 *   {
 *     "$schema": "https://opencode.ai/config.json",
 *     "mcp": {
 *       "portolan": {
 *         "type": "local",
 *         "command": ["<bun>", "<repo>/core/src/server/main.ts", "--target", "<province>"]
 *       }
 *     }
 *   }
 *
 * (Shape verified against opencode 1.18.21's own `opencode mcp add`.)
 * This adapter adds no behavior: it does not parse tool traffic, filter
 * tools, or interpret results — the server it launches is byte-for-byte the
 * one a direct launch gives you. Adapters must not import tool logic; the
 * boundary is checked by core/src/server/adapter-boundary.ts.
 *
 * Usage:
 *   bun adapters/opencode/install.ts --target /path/to/province
 *   bun adapters/opencode/install.ts --target . --config ~/proj/opencode.jsonc
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";

const REPO_ROOT = resolve(import.meta.dir, "..", "..");
const SERVER_ENTRY = join(REPO_ROOT, "core", "src", "server", "main.ts");

const { values } = parseArgs({
  allowPositionals: false,
  options: {
    target: { type: "string" },
    config: { type: "string" },
  },
});

if (values.target === undefined) {
  console.error("usage: bun adapters/opencode/install.ts --target <province root> [--config <opencode.jsonc>]");
  process.exit(1);
}

const province = resolve(values.target);
const configPath =
  values.config !== undefined
    ? resolve(values.config)
    : join(
        process.env.XDG_CONFIG_HOME ?? resolve(process.env.HOME ?? ".", ".config"),
        "opencode",
        "opencode.jsonc",
      );

// The launch line, with absolute paths: opencode spawns it verbatim.
const launchCommand = [process.execPath, SERVER_ENTRY, "--target", province];

type Config = Record<string, unknown> & { mcp?: Record<string, unknown> };
let config: Config = {};
if (existsSync(configPath)) {
  const text = readFileSync(configPath, "utf8");
  try {
    config = JSON.parse(text) as Config;
  } catch {
    console.error(
      `cannot merge into ${configPath}: it is not strict JSON (opencode allows comments).\n` +
        `Add this block by hand under "mcp":\n\n` +
        `  "portolan": {\n` +
        `    "type": "local",\n` +
        `    "command": ${JSON.stringify(launchCommand)}\n` +
        `  }\n`,
    );
    process.exit(1);
  }
}

config.$schema ??= "https://opencode.ai/config.json";
config.mcp ??= {};
(config.mcp as Record<string, unknown>).portolan = {
  type: "local",
  command: launchCommand,
  enabled: true,
};

mkdirSync(dirname(configPath), { recursive: true });
writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

console.log(`portolan MCP server registered in ${configPath}`);
console.log(`  province: ${province}`);
console.log(`  launch:   ${launchCommand.join(" ")}`);
