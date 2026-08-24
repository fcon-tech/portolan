#!/usr/bin/env bun
/**
 * The Portolan MCP server entry point. Launch with:
 *
 *   bun core/src/server/main.ts --target <province root>
 *
 * `--target` defaults to the working directory and is resolved once here;
 * every tool call is scoped to that root, and no call can redirect it —
 * changing provinces means launching a new server (design.md, decision 2).
 * The server speaks MCP over stdio and nothing else: no network, no daemon.
 * specs/harness/spec.md
 */
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createPortolanServer } from "./server";

const { values } = parseArgs({
  allowPositionals: false,
  options: {
    target: { type: "string", default: process.cwd() },
  },
});

const targetRoot = resolve(values.target as string);
const server = createPortolanServer({ targetRoot });
await server.connect(new StdioServerTransport());
