/**
 * The Portolan MCP server: one stdio server exposing the whole v1 toolset
 * through the registry table. Two rules live here and nowhere else
 * (design.md, decisions 1 and 4):
 *
 * 1. Pass-through. A tool's result is returned verbatim — structured
 *    (`structuredContent`) plus the same value as JSON text for older
 *    clients. The server never renames, reinterprets, or flattens.
 * 2. The not-crash/not-swallow split. A rejection from an underlying tool
 *    becomes an MCP tool error (`isError: true`) carrying the tool's own
 *    message verbatim; the process keeps serving. Only transport-level
 *    failures may terminate the server. A global catch-and-log is
 *    deliberately absent: rejections must stay loud.
 *
 * specs/harness/spec.md
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import { resolve } from "node:path";
import pkg from "../../package.json";
import { TOOL_TABLE, type ToolContext } from "./registry";

export const SERVER_INFO = { name: "portolan", version: pkg.version } as const;

export interface PortolanServerOptions {
  /** The one province this server serves; every tool is scoped to it. */
  targetRoot: string;
}

/**
 * Raised when a tool call tries to carry its own target root. The spec's
 * words: the server is bound to one province, and changing provinces means
 * launching a new server.
 */
export class TargetRedirectError extends Error {
  constructor(launchedRoot: string, requested: string) {
    super(
      `this server is bound to the province at ${launchedRoot} and cannot be redirected ` +
        `to ${requested}; changing provinces means launching a new server`,
    );
    this.name = "TargetRedirectError";
  }
}

/**
 * The province binding, enforced once at the handler boundary: a call that
 * echoes the launched root passes; a call naming any other root is refused
 * with an error naming the launched target.
 */
export function guardTarget(
  args: Record<string, unknown>,
  ctx: ToolContext,
): void {
  if (args.targetRoot === undefined) return;
  if (typeof args.targetRoot !== "string") {
    throw new TargetRedirectError(ctx.targetRoot, JSON.stringify(args.targetRoot));
  }
  const requested = resolve(args.targetRoot);
  if (requested !== ctx.targetRoot) {
    throw new TargetRedirectError(ctx.targetRoot, requested);
  }
}

/** A successful tool call: the tool's result, enveloped for MCP. */
export function toolSuccess(result: unknown): CallToolResult {
  const value = result as Record<string, unknown>;
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    ...(value !== null && typeof value === "object" ? { structuredContent: value } : {}),
  };
}

/** A rejected tool call: the rejection's message, verbatim, as a tool error. */
export function toolError(err: unknown): CallToolResult {
  const message = err instanceof Error ? err.message : String(err);
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

/** Build the server bound to one province. Connect it to a transport. */
export function createPortolanServer(options: PortolanServerOptions): Server {
  const ctx: ToolContext = { targetRoot: options.targetRoot };
  const server = new Server(SERVER_INFO, {
    capabilities: { tools: {} },
    instructions:
      `Portolan — the Cartographer's tools for the province at ${options.targetRoot}. ` +
      `Every result is anchored and trust-labeled; every write lands under ` +
      `.portolan/ inside the province. Tool errors carry the underlying ` +
      `tool's message; they never mean the server died.`,
  });

  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: TOOL_TABLE.map((spec) => ({
      name: spec.name,
      description: spec.description,
      inputSchema: spec.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const spec = TOOL_TABLE.find((tool) => tool.name === name);
    if (spec === undefined) {
      // An unknown tool is a malformed call, not a tool rejection: report it
      // as a protocol error while the server keeps serving.
      throw new Error(`unknown tool ${JSON.stringify(name)}; call tools/list for the v1 toolset`);
    }
    try {
      guardTarget(args ?? {}, ctx);
      return toolSuccess(await spec.handler(args ?? {}, ctx));
    } catch (err) {
      return toolError(err);
    }
  });

  return server;
}
