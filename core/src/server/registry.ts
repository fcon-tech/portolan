/**
 * The tool registry: Portolan name → handler + input schema. This table is
 * the single wiring point for every served tool (design.md, decision 3) —
 * the server loop, the error boundary, and the adapters never change per
 * tool, and v1.1 additions (`run`, `smells.scan`) are new table entries, not
 * redesigns. Handlers receive the bound target root implicitly, call the
 * real tool implementations, and return their results verbatim; the server
 * envelopes but never reinterprets them. A thrown rejection (the tool's own
 * error) becomes an MCP tool error at the handler boundary in server.ts.
 * (openspec/changes/mcp-delivery, specs/harness/spec.md)
 */
import type { Anchor, ChartEntry, FairwayEntry, VesselEntry } from "../types";
import { readChart, writeChart } from "../chart-store";
import { refreshStaleness } from "../staleness";
import { sweep } from "../tools/sweep";
import { symbols } from "../tools/symbols";
import { readManifest } from "../tools/manifests";
import { appendReceipt, readReceipt, readReceipts } from "../tools/log";
import { soundAnchor, soundEdge } from "../tools/sound";

/** Everything a handler knows about its world: one province, bound at launch. */
export interface ToolContext {
  /** The absolute target root this server was launched with (--target). */
  targetRoot: string;
}

/** A JSON Schema describing one tool's arguments. */
export type JsonSchema = Record<string, unknown>;

/**
 * One registry entry. `handler` receives the (already JSON-decoded) tool
 * arguments and returns the tool's structured result.
 */
export interface ToolSpec {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  handler: (args: Record<string, unknown>, ctx: ToolContext) => unknown;
}

/** A malformed tool call (missing/ill-typed argument), reported as a tool error. */
export class ToolInputError extends Error {
  constructor(tool: string, message: string) {
    super(`${tool}: ${message}`);
    this.name = "ToolInputError";
  }
}

// ---------------------------------------------------------------------------
// Argument readers: strict, tool-named, and loud. They never coerce.
// ---------------------------------------------------------------------------

function reqString(tool: string, args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new ToolInputError(tool, `argument "${key}" must be a non-empty string`);
  }
  return value;
}

function optString(
  tool: string,
  args: Record<string, unknown>,
  key: string,
): string | undefined {
  return args[key] === undefined ? undefined : reqString(tool, args, key);
}

function optInt(tool: string, args: Record<string, unknown>, key: string): number | undefined {
  const value = args[key];
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new ToolInputError(tool, `argument "${key}" must be a non-negative integer`);
  }
  return value;
}

function optBool(tool: string, args: Record<string, unknown>, key: string): boolean | undefined {
  const value = args[key];
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    throw new ToolInputError(tool, `argument "${key}" must be a boolean`);
  }
  return value;
}

function reqObject(
  tool: string,
  args: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const value = args[key];
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ToolInputError(tool, `argument "${key}" must be an object`);
  }
  return value as Record<string, unknown>;
}

function optObject(
  tool: string,
  args: Record<string, unknown>,
  key: string,
): Record<string, unknown> | undefined {
  return args[key] === undefined ? undefined : reqObject(tool, args, key);
}

function reqArray(tool: string, args: Record<string, unknown>, key: string): unknown[] {
  const value = args[key];
  if (!Array.isArray(value)) {
    throw new ToolInputError(tool, `argument "${key}" must be an array`);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Input schemas. Plain JSON Schema on purpose: the table stays readable and
// harness-agnostic, and the server sends it to the client verbatim.
// ---------------------------------------------------------------------------

const anchorSchema = {
  type: "object",
  description: "A core-foundation anchor: file (path, optional line), manifest (path + key), or receipt (id).",
  oneOf: [
    {
      type: "object",
      properties: {
        type: { const: "file" },
        path: { type: "string" },
        line: { type: "integer", minimum: 1 },
      },
      required: ["type", "path"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        type: { const: "manifest" },
        path: { type: "string" },
        key: { type: "string" },
      },
      required: ["type", "path", "key"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        type: { const: "receipt" },
        id: { type: "string" },
      },
      required: ["type", "id"],
      additionalProperties: false,
    },
  ],
} as const;

const trustLabelSchema = {
  type: "string",
  enum: ["measured", "charted", "reported", "doubtful", "unsurveyed"],
  description: "Exactly one trust label per entry (closed vocabulary).",
} as const;

const entryBaseSchema = {
  type: "object",
  properties: {
    id: { type: "string", description: "Stable identifier, unique across the chart." },
    anchors: {
      type: "array",
      minItems: 1,
      items: anchorSchema,
      description: "At least one anchor is mandatory; the store rejects otherwise.",
    },
    trust: trustLabelSchema,
    note: { type: "string", description: "Free-form qualification; never a substitute for evidence." },
  },
  required: ["id", "anchors", "trust"],
} as const;

const vesselEntrySchema = {
  ...entryBaseSchema,
  properties: {
    ...entryBaseSchema.properties,
    kind: { const: "vessel" },
    name: { type: "string" },
    behavior: { type: "string", description: "What the vessel does at runtime; absent renders as unsurveyed." },
    paths: { type: "array", items: { type: "string" }, description: "Source paths covered by the tree signature." },
  },
  required: [...entryBaseSchema.required, "kind", "name", "paths"],
} as unknown as JsonSchema;

const fairwayEntrySchema = {
  ...entryBaseSchema,
  properties: {
    ...entryBaseSchema.properties,
    kind: { const: "fairway" },
    from: { type: "string", description: "Departing vessel id." },
    to: { type: "string", description: "Arriving vessel id." },
  },
  required: [...entryBaseSchema.required, "kind", "from", "to"],
} as unknown as JsonSchema;

const chartEntrySchema = {
  type: "object",
  description:
    "A chart entry (vessel, fairway, portOfEntry, beacon, light, or danger) as the chart capability defines it. " +
    "Every entry carries at least one anchor and exactly one trust label; the chart store validates the full " +
    "ontology and its rejection — naming the offending entry — is the product surface.",
  required: ["kind", "id", "anchors", "trust"],
} as const;

const receiptFilterSchema = {
  type: "object",
  properties: {
    command: { type: "string" },
    scope: { type: "string" },
    outcome: { type: "string" },
  },
  additionalProperties: false,
  description: "Every provided field must match exactly.",
} as const;

// ---------------------------------------------------------------------------
// The table: the complete v1 toolset under its Portolan names.
// ---------------------------------------------------------------------------

/** The complete v1 toolset, in the order the harness capability lists them. */
export const TOOL_TABLE: ToolSpec[] = [
  {
    name: "chart.read",
    description:
      "Read the Chart (Padrón) of the province: the machine index entries as stored under <target>/.portolan/chart/index.jsonl. " +
      "Refreshes staleness first — vessels whose sources changed since the last write come back marked pending correction.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: (_args, ctx) => {
      refreshStaleness(ctx.targetRoot);
      return { entries: readChart(ctx.targetRoot) };
    },
  },
  {
    name: "chart.write",
    description:
      "Write the Chart (full-replace semantics): validates every entry — anchors and a trust label are mandatory, " +
      "else the store rejects — then persists sheets + index atomically and returns the write result with Notices to Mariners.",
    inputSchema: {
      type: "object",
      properties: {
        entries: { type: "array", minItems: 1, items: chartEntrySchema },
      },
      required: ["entries"],
      additionalProperties: false,
    },
    handler: (args, ctx) =>
      writeChart(ctx.targetRoot, reqArray("chart.write", args, "entries") as ChartEntry[]),
  },
  {
    name: "sweep",
    description:
      "ripgrep-backed pattern search over the province. Returns one anchored chunk per match (path, line, matched text, " +
      "optional context), trust-labeled `measured`. No match is an honest empty list.",
    inputSchema: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "ripgrep regular expression." },
        context: { type: "integer", minimum: 0, description: "Surrounding context lines per match." },
        glob: { type: "string", description: "Glob filter, e.g. '*.ts'." },
      },
      required: ["pattern"],
      additionalProperties: false,
    },
    handler: (args, ctx) => {
      const context = optInt("sweep", args, "context");
      const glob = optString("sweep", args, "glob");
      return sweep(ctx.targetRoot, reqString("sweep", args, "pattern"), {
        ...(context !== undefined ? { context } : {}),
        ...(glob !== undefined ? { glob } : {}),
      });
    },
  },
  {
    name: "symbols",
    description:
      "ctags-backed symbol lookup: definitions (name, kind, path, line) and, when requested, references corroborated " +
      "by sweep — never guessed. Trust-labeled `measured`; an unknown symbol is an empty result.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Symbol name to look up." },
        references: { type: "boolean", description: "Also resolve references (corroborating sweep)." },
      },
      required: ["name"],
      additionalProperties: false,
    },
    handler: (args, ctx) => {
      const references = optBool("symbols", args, "references");
      return symbols(ctx.targetRoot, reqString("symbols", args, "name"), {
        ...(references !== undefined ? { references } : {}),
      });
    },
  },
  {
    name: "manifests",
    description:
      "Cheap deterministic facts from one manifest file (go.mod, pom.xml, package.json, Cargo.toml, pubspec.yaml): " +
      "name, version, declared dependencies — each anchored to its manifest key, trust-labeled `charted`.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Manifest path, relative to the province root." },
      },
      required: ["path"],
      additionalProperties: false,
    },
    handler: (args, ctx) => readManifest(ctx.targetRoot, reqString("manifests", args, "path")),
  },
  {
    name: "sound.edge",
    description:
      "Deterministic verification of an asserted fairway between two charted vessels: a manifest-declared dependency " +
      "and/or name-based references in the source's files. Returns `confirmed` (with evidence) or `unconfirmed` — never a refutation.",
    inputSchema: {
      type: "object",
      properties: {
        fairway: fairwayEntrySchema,
        source: { ...vesselEntrySchema, description: "The vessel the fairway departs from." },
        target: { ...vesselEntrySchema, description: "The vessel the fairway arrives at." },
      },
      required: ["fairway", "source", "target"],
      additionalProperties: false,
    },
    handler: (args, ctx) =>
      soundEdge(ctx.targetRoot, {
        fairway: reqObject("sound.edge", args, "fairway") as unknown as FairwayEntry,
        source: reqObject("sound.edge", args, "source") as unknown as VesselEntry,
        target: reqObject("sound.edge", args, "target") as unknown as VesselEntry,
      }),
  },
  {
    name: "sound.anchor",
    description:
      "Deterministic verification that an anchor cited by a chart entry resolves: file anchors (existence, range, " +
      "cited content), manifest keys, receipt ids. Returns `confirmed` or `refuted` with what was actually found.",
    inputSchema: {
      type: "object",
      properties: {
        anchor: anchorSchema,
        content: { type: "string", description: "For file anchors: the content the entry claims sits at the cited range." },
        endLine: { type: "integer", minimum: 1, description: "For file anchors: last line of the cited range." },
      },
      required: ["anchor"],
      additionalProperties: false,
    },
    handler: (args, ctx) => {
      const content = optString("sound.anchor", args, "content");
      const endLine = optInt("sound.anchor", args, "endLine");
      return soundAnchor(ctx.targetRoot, {
        anchor: reqObject("sound.anchor", args, "anchor") as unknown as Anchor,
        ...(content !== undefined ? { content } : {}),
        ...(endLine !== undefined ? { endLine } : {}),
      });
    },
  },
  {
    name: "log.append",
    description:
      "Append one receipt to the ship's log (<target>/.portolan/log.jsonl): command identity, scope, outcome. " +
      "Returns the receipt with its stable, citable id.",
    inputSchema: {
      type: "object",
      properties: {
        command: { type: "string", description: "Command identity, e.g. 'sweep pattern=UserService'." },
        scope: { type: "string", description: "What was surveyed." },
        outcome: { type: "string", description: "Outcome, e.g. 'ok: 3 chunks' or 'error: missing binary ctags'." },
        meta: { type: "object", description: "Free-form metadata.", additionalProperties: true },
      },
      required: ["command", "outcome"],
      additionalProperties: false,
    },
    handler: (args, ctx) => {
      const scope = optString("log.append", args, "scope");
      const meta = optObject("log.append", args, "meta");
      return appendReceipt(ctx.targetRoot, {
        command: reqString("log.append", args, "command"),
        outcome: reqString("log.append", args, "outcome"),
        ...(scope !== undefined ? { scope } : {}),
        ...(meta !== undefined ? { meta } : {}),
      });
    },
  },
  {
    name: "log.read",
    description:
      "Read the ship's log: one receipt by id, or all receipts matching a filter. Receipt ids are chart-anchorable.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Resolve exactly this receipt." },
        filter: receiptFilterSchema,
      },
      additionalProperties: false,
    },
    handler: (args, ctx) => {
      const id = optString("log.read", args, "id");
      if (id !== undefined) {
        const receipt = readReceipt(ctx.targetRoot, id);
        return { receipts: receipt === undefined ? [] : [receipt] };
      }
      const filter = optObject("log.read", args, "filter") ?? {};
      const command = optString("log.read", filter, "command");
      const scope = optString("log.read", filter, "scope");
      const outcome = optString("log.read", filter, "outcome");
      return {
        receipts: readReceipts(ctx.targetRoot, {
          ...(command !== undefined ? { command } : {}),
          ...(scope !== undefined ? { scope } : {}),
          ...(outcome !== undefined ? { outcome } : {}),
        }),
      };
    },
  },
];

/** The nine v1 Portolan tool names, in table order. */
export const V1_TOOL_NAMES = TOOL_TABLE.map((spec) => spec.name);

/**
 * Every tool accepts an optional `targetRoot` — an echo of the province root
 * the server was launched with, never a redirect. The server refuses any
 * value that is not the launched root (see server.ts); the property is
 * declared so clients see the binding instead of discovering it by
 * rejection. (Named `targetRoot`, not `target`: sound.edge's `target` is a
 * vessel, not a province.)
 */
const BOUND_TARGET_PROPERTY: JsonSchema = {
  type: "string",
  description:
    "The province root this server was launched with (--target). The server is bound to it: " +
    "a different value is refused — changing provinces means launching a new server.",
};

for (const spec of TOOL_TABLE) {
  const schema = spec.inputSchema as { properties?: Record<string, unknown> };
  schema.properties = { ...(schema.properties ?? {}), targetRoot: BOUND_TARGET_PROPERTY };
}
