/**
 * The tool registry: Portolan name → handler + input schema. This table is
 * the single wiring point for every served tool (design.md, decision 3) —
 * the server loop, the error boundary, and the adapters never change per
 * tool, and v1.1 additions (`run`, `smells.scan`) are new table entries, not
 * redesigns. Handlers receive the bound target root implicitly; they never
 * see harness identity.
 * (openspec/changes/mcp-delivery, specs/harness/spec.md)
 */

/** Everything a handler knows about its world: one province, bound at launch. */
export interface ToolContext {
  /** The absolute target root this server was launched with (--target). */
  targetRoot: string;
}

/** A record<string, unknown> JSON Schema describing one tool's arguments. */
export type JsonSchema = Record<string, unknown>;

/**
 * One registry entry. `handler` receives the (already JSON-decoded) tool
 * arguments and returns the tool's structured result verbatim — the server
 * envelopes it, it never reinterprets or flattens it. Any thrown error is
 * converted at the handler boundary into an MCP tool error carrying the
 * message verbatim.
 */
export interface ToolSpec {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  handler: (args: Record<string, unknown>, ctx: ToolContext) => unknown;
}

/** The complete v1 toolset, in Portolan chart order. */
export const TOOL_TABLE: ToolSpec[] = [];
