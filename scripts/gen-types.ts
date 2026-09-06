/**
 * Schema → TypeScript generator (formats-pass, design D7): renders the
 * entry, anchor, and receipt types whole from core/schema/*.schema.json
 * into core/src/types.generated.ts. The schemas win — hand-written code
 * never edits the generated file, and the drift guard in
 * core/src/formats.test.ts fails when the committed copy differs from what
 * the schemas produce today.
 *
 * Why a hand-rolled binder over json-schema-to-typescript: the cross-file
 * trust $ref is by $id (design D2), which library generators do not
 * resolve without input surgery, and the schemas are owned contracts over
 * a small fixed subset — so this dependency-free renderer stays
 * deterministic and idempotent.
 *
 * Supported subset: $schema/$id/version/title annotations, description,
 * $defs, $ref (internal "#/$defs/..." and the trust-vocabulary $id),
 * oneOf, const, enum, type (string|integer|boolean|object|array),
 * properties, required, additionalProperties: false, items, minItems,
 * minLength, minimum, pattern. Any other keyword fails the run loudly
 * (refuse, don't improvise) instead of silently mis-generating a type.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import chartSchema from "../core/schema/chart.schema.json";
import trustSchema from "../core/schema/trust-vocabulary.schema.json";
import receiptSchema from "../core/schema/receipt.schema.json";

/** The one generated file, always, wherever the script is invoked from. */
export const GENERATED_FILE = fileURLToPath(
  new URL("../core/src/types.generated.ts", import.meta.url),
);

export interface SchemaNode {
  $schema?: unknown;
  $id?: unknown;
  version?: unknown;
  title?: unknown;
  description?: unknown;
  $ref?: unknown;
  $defs?: Record<string, SchemaNode>;
  oneOf?: SchemaNode[];
  enum?: unknown[];
  const?: unknown;
  type?: unknown;
  properties?: Record<string, SchemaNode>;
  required?: unknown;
  items?: SchemaNode;
  additionalProperties?: unknown;
  minItems?: unknown;
  minLength?: unknown;
  minimum?: unknown;
  pattern?: unknown;
}

const ALLOWED_KEYS = new Set([
  "$schema",
  "$id",
  "version",
  "title",
  "description",
  "$ref",
  "$defs",
  "oneOf",
  "enum",
  "const",
  "type",
  "properties",
  "required",
  "items",
  "additionalProperties",
  "minItems",
  "minLength",
  "minimum",
  "pattern",
]);

const chart = chartSchema as unknown as SchemaNode;
const trust = trustSchema as unknown as SchemaNode;
const receipt = receiptSchema as unknown as SchemaNode;

/** Refuse to render a schema this binder does not fully understand. */
function checkSubset(node: SchemaNode, where: string): void {
  for (const key of Object.keys(node)) {
    if (!ALLOWED_KEYS.has(key)) {
      throw new Error(`gen-types: unsupported schema keyword "${key}" at ${where}`);
    }
  }
  const defs = node.$defs ?? {};
  for (const [name, def] of Object.entries(defs)) checkSubset(def, `${where}#$defs/${name}`);
  for (const [name, prop] of Object.entries(node.properties ?? {})) {
    checkSubset(prop, `${where}#properties/${name}`);
  }
  (node.oneOf ?? []).forEach((member, i) => checkSubset(member, `${where}#oneOf[${i}]`));
  if (node.items) checkSubset(node.items, `${where}#items`);
}

/**
 * Chart $defs rendered as named exports; everything else inlines. The
 * names match the pre-existing hand mirror so call sites keep their types.
 */
const EXPORTED_DEFS: Record<string, string> = {
  anchor: "Anchor",
  vessel: "VesselEntry",
  fairway: "FairwayEntry",
  portOfEntry: "PortOfEntryEntry",
  beacon: "BeaconEntry",
  light: "LightEntry",
  danger: "DangerEntry",
  chartEntry: "ChartEntry",
};

const TRUST_ALIAS = "TrustLabel";
const RELATION_DEF = "fairwayRelation";
const RELATION_ALIAS = "FairwayRelation";

function defsOf(node: SchemaNode): Record<string, SchemaNode> {
  if (!node.$defs) throw new Error("gen-types: schema has no $defs");
  return node.$defs;
}

function jsdoc(description: unknown, pad: string): string {
  return typeof description === "string" && description.length > 0
    ? `${pad}/** ${description} */\n`
    : "";
}

function propertyName(name: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : JSON.stringify(name);
}

/** Single-line type expression (union members, simple property types). */
function renderInline(node: SchemaNode, defs: Record<string, SchemaNode>, where: string): string {
  checkSubset(node, where);
  if (node.$ref !== undefined) return renderRef(node.$ref as string, defs, where);
  if (node.const !== undefined) return JSON.stringify(node.const);
  if (node.enum !== undefined) return (node.enum as unknown[]).map((v) => JSON.stringify(v)).join(" | ");
  if (node.oneOf !== undefined) {
    return (node.oneOf as SchemaNode[])
      .map((member, i) => renderInline(member, defs, `${where}#oneOf[${i}]`))
      .join(" | ");
  }
  if (node.type === "object") {
    const props = node.properties ?? {};
    if (Object.keys(props).length === 0) return "{ [key: string]: unknown }";
    const members = Object.entries(props).map(([name, prop]) => {
      const optional = (node.required as string[] | undefined)?.includes(name) ? "" : "?";
      return `${propertyName(name)}${optional}: ${renderInline(prop, defs, `${where}#properties/${name}`)}`;
    });
    return `{ ${members.join("; ")} }`;
  }
  if (node.type === "array" && node.items) {
    const inner = renderInline(node.items, defs, `${where}#items`);
    const needsParens = inner.includes(" | ") || inner.startsWith("{");
    return `${needsParens ? `(${inner})` : inner}[]`;
  }
  if (node.type === "string") return "string";
  if (node.type === "integer" || node.type === "number") return "number";
  if (node.type === "boolean") return "boolean";
  throw new Error(`gen-types: cannot render schema node at ${where}`);
}

/** Resolve a $ref to its named alias or inline rendering. */
function renderRef(ref: string, defs: Record<string, SchemaNode>, where: string): string {
  if (ref === trust.$id) return TRUST_ALIAS;
  if (!ref.startsWith("#/$defs/")) {
    throw new Error(`gen-types: unsupported $ref "${ref}" at ${where}`);
  }
  const name = ref.slice("#/$defs/".length);
  const target = defs[name];
  if (!target) throw new Error(`gen-types: $ref to missing $defs/${name} at ${where}`);
  if (name === RELATION_DEF) return RELATION_ALIAS;
  const exported = EXPORTED_DEFS[name];
  if (exported !== undefined) return exported;
  return renderInline(target, defs, `${where}->$defs/${name}`);
}

/** One property of a block-rendered object, with its doc comment. */
function renderProperty(
  name: string,
  node: SchemaNode,
  required: boolean,
  defs: Record<string, SchemaNode>,
  where: string,
  pad: string,
): string {
  checkSubset(node, where);
  return `${jsdoc(node.description, pad)}${pad}${propertyName(name)}${required ? "" : "?"}: ${renderInline(node, defs, where)};\n`;
}

/** A whole definition as a named export: interface for objects, union type otherwise. */
function renderDef(name: string, node: SchemaNode, defs: Record<string, SchemaNode>, where: string): string {
  checkSubset(node, where);
  const exported = EXPORTED_DEFS[name];
  if (exported === undefined) throw new Error(`gen-types: $defs/${name} is not a named export`);
  const doc = jsdoc(node.description, "");
  if (node.oneOf !== undefined) {
    const members = (node.oneOf as SchemaNode[])
      .map((member, i) => `  | ${renderInline(member, defs, `${where}#oneOf[${i}]`)}`)
      .join("\n");
    return `${doc}export type ${exported} =\n${members};\n`;
  }
  if (node.type === "object" && node.properties) {
    const required = (node.required as string[] | undefined) ?? [];
    const body = Object.entries(node.properties)
      .map(([key, prop]) => renderProperty(key, prop, required.includes(key), defs, `${where}#properties/${key}`, "  "))
      .join("");
    return `${doc}export interface ${exported} {\n${body}}\n`;
  }
  throw new Error(`gen-types: cannot render $defs/${name}`);
}

/** The full generated module text — a pure function of the schema files. */
export function generateTypesSource(): string {
  const defs = defsOf(chart);
  const parts: string[] = [];

  parts.push(`/**
 * Generated from the format schemas (core/schema/*.schema.json) by
 * scripts/gen-types.ts — do not edit by hand; schema wins (formats-pass,
 * design D7). Regenerate with \`bun run scripts/gen-types.ts\`; a committed
 * copy that differs from today's schemas fails the drift guard in
 * core/src/formats.test.ts.
 */

`);

  const trustEnum = trust.enum as unknown[];
  if (!Array.isArray(trustEnum) || trustEnum.length === 0) {
    throw new Error("gen-types: trust vocabulary carries no enum");
  }
  parts.push(`${jsdoc(trust.description, "")}type ${TRUST_ALIAS} = ${trustEnum.map((v) => JSON.stringify(v)).join(" | ")};\n\n`);
  parts.push(`${jsdoc(defs[RELATION_DEF]?.description, "")}type ${RELATION_ALIAS} = ${renderInline(defs[RELATION_DEF], defs, "chart#$defs/fairwayRelation")};\n\n`);

  for (const defName of Object.keys(EXPORTED_DEFS)) {
    parts.push(`${renderDef(defName, defs[defName], defs, `chart#$defs/${defName}`)}\n`);
  }

  const required = (receipt.required as string[] | undefined) ?? [];
  const receiptBody = Object.entries(receipt.properties ?? {})
    .map(([key, prop]) => renderProperty(key, prop, required.includes(key), {}, "receipt#properties", "  "))
    .join("");
  parts.push(`${jsdoc(receipt.description, "")}export interface Receipt {\n${receiptBody}}\n`);

  return parts.join("");
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  writeFileSync(GENERATED_FILE, generateTypesSource());
  console.log(`gen-types: wrote ${GENERATED_FILE}`);
}
