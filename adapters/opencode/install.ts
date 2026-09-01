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
 * opencode config files are JSONC (comments and trailing commas allowed), so
 * the merge is text surgery through a small JSONC scanner: the user's
 * comments, formatting, and every other key survive verbatim. Only the
 * `mcp.portolan` block is inserted or replaced. Adapters must not import
 * tool logic; the boundary is checked by core/src/server/adapter-boundary.ts.
 *
 * Usage:
 *   bun adapters/opencode/install.ts --target /path/to/province
 *   bun adapters/opencode/install.ts --target . --config ~/proj/opencode.jsonc
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
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
const portolanBlock = `{ "type": "local", "command": ${JSON.stringify(launchCommand)}, "enabled": true }`;

// ---------------------------------------------------------------------------
// A minimal JSONC scanner. It walks the text once, tracking strings,
// escapes, and both comment kinds, and produces two things:
//   - a cleaned copy (comments blanked) for JSON.parse validation with
//     trailing commas handled;
//   - structural spans ({ ... } pairs) so the merge can do exact text
//     surgery instead of a rewrite that would destroy user comments.
// ---------------------------------------------------------------------------

interface Span {
  open: number; // index of '{'
  close: number; // index of matching '}'
}

/** Blank out comments (keeping offsets stable) and return structural spans in order. */
function scanJsonc(text: string): { cleaned: string; spans: Span[] } {
  const chars = text.split("");
  const spans: Span[] = [];
  const openStack: number[] = [];
  let i = 0;
  let inString = false;
  while (i < text.length) {
    const c = text[i];
    if (inString) {
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (c === '"') inString = false;
      i++;
      continue;
    }
    if (c === '"') {
      inString = true;
      i++;
      continue;
    }
    if (c === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") {
        chars[i] = " ";
        i++;
      }
      continue;
    }
    if (c === "/" && text[i + 1] === "*") {
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) {
        chars[i] = text[i] === "\n" ? "\n" : " ";
        i++;
      }
      if (i < text.length) {
        chars[i] = " ";
        chars[i + 1] = " ";
        i += 2;
      }
      continue;
    }
    if (c === "{") {
      openStack.push(i);
      i++;
      continue;
    }
    if (c === "}") {
      const open = openStack.pop();
      if (open !== undefined) spans.push({ open, close: i });
      i++;
      continue;
    }
    i++;
  }
  if (openStack.length > 0) throw new Error("unbalanced braces in config");
  if (inString) throw new Error("unterminated string in config");
  return { cleaned: chars.join(""), spans };
}

/** Parse JSONC for validation: comments blanked, trailing commas dropped. */
function parseJsonc(text: string): unknown {
  const { cleaned } = scanJsonc(text);
  const noTrailing = cleaned.replace(/,(\s*[}\]])/g, "$1");
  return JSON.parse(noTrailing);
}

/** The innermost span whose '{' sits at cleaned[start]; expects text[start] === '{'. */
function spanStartingAt(spans: Span[], start: number): Span {
  const span = spans.find((s) => s.open === start);
  if (span === undefined) throw new Error("no object found where one was expected");
  return span;
}

/** Find a direct property key of the object `obj` whose name matches; return the index of its ':' or -1. */
function findPropertyColon(cleaned: string, obj: Span, spans: Span[], key: string): number {
  const search = `"${key}"`;
  for (let i = obj.open + 1; i < obj.close; i++) {
    if (!cleaned.startsWith(search, i)) continue;
    // The key must sit directly inside this object: its innermost enclosing
    // span (ignoring strings/comments via the cleaned copy) is obj itself.
    const enclosing = spans
      .filter((s) => s.open < i && s.close > i && s.open >= obj.open && s.close <= obj.close)
      .sort((a, b) => b.open - a.open)[0];
    if (enclosing === undefined || enclosing.open === obj.open) {
      const colon = cleaned.indexOf(":", i + search.length);
      if (colon !== -1 && colon < obj.close) return colon;
    }
  }
  return -1;
}

/**
 * Upsert `mcp.portolan` into JSONC text, preserving everything else verbatim.
 * Returns the merged text.
 */
function upsertPortolan(text: string): string {
  const { cleaned, spans } = scanJsonc(text);
  const root = spanStartingAt(spans, cleaned.indexOf("{"));
  const mcpColon = findPropertyColon(cleaned, root, spans, "mcp");
  const block = `"portolan": ${portolanBlock}`;

  if (mcpColon !== -1) {
    // The mcp object starts at the first '{' after its colon.
    const mcpOpen = cleaned.indexOf("{", mcpColon);
    const mcpSpan = spanStartingAt(spans, mcpOpen);
    const portolanColon = findPropertyColon(cleaned, mcpSpan, spans, "portolan");
    if (portolanColon !== -1) {
      // Replace the existing value: from the value start to its end (the
      // innermost span starting after the colon, else up to ',' or '}').
      const nextBrace = cleaned.indexOf("{", portolanColon);
      let valueEnd: number;
      if (nextBrace !== -1 && nextBrace < mcpSpan.close && spans.some((s) => s.open === nextBrace)) {
        valueEnd = spanStartingAt(spans, nextBrace).close + 1;
      } else {
        // Non-object value: up to the next ',' or the mcp closing brace.
        const comma = cleaned.indexOf(",", portolanColon);
        valueEnd = comma !== -1 && comma < mcpSpan.close ? comma : mcpSpan.close;
      }
      return text.slice(0, portolanColon + 1) + " " + portolanBlock + text.slice(valueEnd);
    }
    // Insert as the first property of mcp, right after its opening brace.
    return text.slice(0, mcpSpan.open + 1) + `\n    ${block},` + text.slice(mcpSpan.open + 1);
  }

  // No mcp key: insert one before the root's closing brace.
  const before = text.slice(0, root.close);
  const hasKeys = cleaned.slice(root.open + 1, root.close).trim().length > 0;
  const insert = `${hasKeys ? "," : ""}\n  "mcp": { ${block} }`;
  return before + insert + text.slice(root.close);
}

let finalText: string;
if (existsSync(configPath)) {
  const text = readFileSync(configPath, "utf8");
  let parsed: unknown;
  try {
    parsed = parseJsonc(text);
  } catch (err) {
    console.error(
      `cannot merge into ${configPath}: not a JSON/JSONC document (${err instanceof Error ? err.message : String(err)}).\n` +
        `Add this block by hand under "mcp":\n\n` +
        `  "portolan": {\n` +
        `    "type": "local",\n` +
        `    "command": ${JSON.stringify(launchCommand)}\n` +
        `  }\n`,
    );
    process.exit(1);
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    console.error(`cannot merge into ${configPath}: top level is not an object.`);
    process.exit(1);
  }
  finalText = upsertPortolan(text);
} else {
  finalText =
    `{\n` +
    `  "$schema": "https://opencode.ai/config.json",\n` +
    `  "mcp": { "portolan": ${portolanBlock} }\n` +
    `}\n`;
}

mkdirSync(dirname(configPath), { recursive: true });
// Stage-and-rename: the file we promised to merge into verbatim is replaced
// atomically, so a crash mid-write truncates the temp file, never the
// operator's config.
const configTmp = `${configPath}.tmp-${Date.now()}`;
writeFileSync(configTmp, finalText);
renameSync(configTmp, configPath);

// The province's AGENTS.md carries the harbor protocol so every harness
// that reads agent instructions (opencode first) knows to propose
// expeditions at session start — no prompt injection needed.
const agentsPath = join(province, "AGENTS.md");
const BLOCK_BEGIN = "<!-- portolan:harbor:begin -->";
const BLOCK_END = "<!-- portolan:harbor:end -->";
// The skill pointer is relative for a province inside the checkout (the
// repo charting itself) so a published AGENTS.md carries no machine paths;
// for an outside target the pointer must survive being read from anywhere,
// so the absolute checkout path is used.
const skillFile = join(REPO_ROOT, "skill", "SKILL.md");
const insideRepo = !relative(REPO_ROOT, province).startsWith("..");
const skillPath = insideRepo ? relative(province, skillFile) : skillFile;
const block =
  `${BLOCK_BEGIN}\n` +
  `## Portolan province\n\n` +
  `This target is a charted Portolan province (Chart at \`.portolan/chart/\`, ship's log at \`.portolan/log.jsonl\`).\n\n` +
  `At session start, before other work: call the \`expeditions.propose\` tool from the \`portolan\` MCP server; ` +
  `if the queue is non-empty, present the top proposals in ONE chat message (kind, evidence summary, scope) ` +
  `and ask for a one-phrase decision; record it with \`expeditions.decide\`. ` +
  `Answer landscape questions from the Chart, citing anchors and trust labels. ` +
  `The full Cartographer's method: ${skillPath}. ` +
  `Never modify anything outside \`.portolan/\`.\n` +
  BLOCK_END;
let agentsText = existsSync(agentsPath) ? readFileSync(agentsPath, "utf8") : "";
const beginIdx = agentsText.indexOf(BLOCK_BEGIN);
const endIdx = agentsText.indexOf(BLOCK_END);
if (beginIdx !== -1 && endIdx !== -1 && endIdx > beginIdx) {
  agentsText = agentsText.slice(0, beginIdx) + block + agentsText.slice(endIdx + BLOCK_END.length);
} else if (beginIdx === -1) {
  agentsText = agentsText.length > 0 ? `${agentsText.replace(/\s*$/, "\n")}\n${block}\n` : `${block}\n`;
}
mkdirSync(province, { recursive: true });
writeFileSync(agentsPath, agentsText);

console.log(`portolan MCP server registered in ${configPath}`);
console.log(`  province: ${province}`);
console.log(`  launch:   ${launchCommand.join(" ")}`);
console.log(`  harbor protocol: ${agentsPath}`);
