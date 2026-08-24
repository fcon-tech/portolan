/**
 * `symbols`: ctags-backed symbol lookup. Definitions (name, kind, path,
 * line) are authoritative ctags output; references are resolved only by a
 * corroborating sweep of the symbol name at definition-free sites — never
 * invented. An absent symbol is an honest empty result; a missing ctags is
 * an error naming the binary.
 * specs/tools/spec.md
 */
import { spawnSync } from "node:child_process";
import { statSync } from "node:fs";
import type { Anchor } from "../types";
import { escapeRegExp, findBinary, MissingBinaryError, type Env } from "./shared";
import { sweep } from "./sweep";

export interface SymbolOptions {
  /** Resolve references via a corroborating sweep of the symbol name. */
  references?: boolean;
  /** Environment override; tests restrict PATH to probe missing-binary paths. */
  env?: Env;
}

export interface SymbolDefinition {
  name: string;
  kind: string;
  path: string;
  line: number;
  anchor: Anchor;
}

export interface SymbolReference {
  path: string;
  line: number;
  text: string;
  anchor: Anchor;
}

/** References are either resolved occurrences or honestly absent. */
export type SymbolReferences =
  | { resolvable: true; items: SymbolReference[] }
  | { resolvable: false; reason: string };

export interface SymbolResult {
  trust: "measured";
  name: string;
  /** Empty (not an error) when the symbol is unknown to ctags. */
  definitions: SymbolDefinition[];
  /** Present only when references were requested. */
  references?: SymbolReferences;
}

export class SymbolsError extends Error {
  constructor(message: string) {
    super(`symbols: ${message}`);
    this.name = "SymbolsError";
  }
}

/** The subset of universal-ctags JSON output the tool consumes. */
interface TagRecord {
  _type?: string;
  name?: unknown;
  path?: unknown;
  line?: unknown;
  kind?: unknown;
}

/**
 * Names shorter than this cannot be corroborated by a text sweep without
 * guessing (design.md, decision 2): their references stay honestly absent.
 */
const MIN_REFERENCE_NAME_LENGTH = 4;

function relativeToTarget(path: string, targetRoot: string): string {
  if (path.startsWith("./")) return path.slice(2);
  const root = targetRoot.endsWith("/") ? targetRoot : `${targetRoot}/`;
  if (path.startsWith(root)) return path.slice(root.length);
  return path;
}

function firstLine(text: string): string {
  return (
    text
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? ""
  );
}

/** Run ctags over the target and return every usable tag record. */
function runCtags(targetRoot: string, env: Env): TagRecord[] {
  const ctags = findBinary("ctags", env);
  if (!ctags) throw new MissingBinaryError("ctags", "symbols");
  const run = spawnSync(
    ctags,
    ["--output-format=json", "--fields=+nK", "-f", "-", "--recurse", "."],
    { cwd: targetRoot, env, encoding: "utf8", maxBuffer: 512 * 1024 * 1024 },
  );
  if (run.error) throw new MissingBinaryError("ctags", "symbols");
  if (run.status !== 0) {
    const reason =
      firstLine(run.stderr ?? "") || `ctags exited with code ${run.status}`;
    throw new SymbolsError(`ctags failed: ${reason}`);
  }
  const records: TagRecord[] = [];
  for (const raw of (run.stdout ?? "").split("\n")) {
    if (raw.trim().length === 0) continue;
    let record: TagRecord;
    try {
      record = JSON.parse(raw) as TagRecord;
    } catch {
      throw new SymbolsError(
        `ctags emitted unparseable output: ${raw.slice(0, 120)}`,
      );
    }
    // Pseudo-tags and any non-tag records carry no symbol evidence.
    if (record._type !== undefined && record._type !== "tag") continue;
    if (typeof record.name !== "string" || typeof record.path !== "string") continue;
    records.push(record);
  }
  return records;
}

/** Look up `name` in `targetRoot` through ctags; results labeled `measured`. */
export function symbols(
  targetRoot: string,
  name: string,
  options: SymbolOptions = {},
): SymbolResult {
  const env: Env = options.env ?? process.env;
  let isDir = false;
  try {
    isDir = statSync(targetRoot).isDirectory();
  } catch {
    // fall through to the honest error below
  }
  if (!isDir) {
    throw new SymbolsError(`target root ${targetRoot} is not a directory`);
  }

  const all = runCtags(targetRoot, env);
  const definitions: SymbolDefinition[] = [];
  for (const record of all) {
    if (record.name !== name || typeof record.line !== "number") continue;
    const path = relativeToTarget(record.path as string, targetRoot);
    const line = record.line;
    definitions.push({
      name,
      kind: typeof record.kind === "string" ? record.kind : "unknown",
      path,
      line,
      anchor: { type: "file", path, line },
    });
  }
  definitions.sort((a, b) =>
    a.path === b.path ? a.line - b.line : a.path < b.path ? -1 : 1,
  );

  let references: SymbolReferences | undefined;
  if (options.references) {
    if (name.length < MIN_REFERENCE_NAME_LENGTH) {
      references = {
        resolvable: false,
        reason:
          `the name "${name}" is too short or too common to corroborate by ` +
          `sweep; references are reported as not resolvable rather than guessed`,
      };
    } else {
      // Corroborating sweep of the name; definition sites are excluded so
      // what remains are occurrences, never the definition itself.
      const swept = sweep(targetRoot, `\\b${escapeRegExp(name)}\\b`, { env });
      const definitionSites = new Set(
        definitions.map((d) => `${d.path}:${d.line}`),
      );
      const items = swept.chunks
        .filter((chunk) => !definitionSites.has(`${chunk.path}:${chunk.line}`))
        .map((chunk) => ({
          path: chunk.path,
          line: chunk.line,
          text: chunk.text,
          anchor: chunk.anchor,
        }));
      references = { resolvable: true, items };
    }
  }

  return {
    trust: "measured",
    name,
    definitions,
    ...(references !== undefined ? { references } : {}),
  };
}
