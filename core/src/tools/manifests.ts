/**
 * `manifests`: cheap deterministic facts from the five supported manifest
 * kinds — go.mod, pom.xml, package.json, Cargo.toml, pubspec.yaml — and no
 * other file kind. Manifest files are the only structural parsing Portolan
 * performs. Every fact carries the manifest file path, its manifest key,
 * and the trust label `charted`. Unsupported kinds are reported, not
 * guessed; unparseable files fail loudly with zero partial facts.
 * (openspec/changes/probe-tools, specs/tools/spec.md)
 *
 * Reader note: design.md decision 3 sketched small third-party
 * XML/TOML/YAML parsers; this execution ships minimal in-tree readers
 * instead, honoring the change's no-new-runtime-dependencies constraint.
 * Manifest parsing stays the sanctioned exception to "no hand-written
 * parsers"; source-code parsing remains forbidden.
 */
import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import type { Anchor } from "../types";

export const MANIFEST_KINDS = [
  "go.mod",
  "pom.xml",
  "package.json",
  "Cargo.toml",
  "pubspec.yaml",
] as const;

export type ManifestKind = (typeof MANIFEST_KINDS)[number];

/** One deterministic fact read from a manifest, anchored to its key. */
export interface ManifestFact {
  trust: "charted";
  /** The manifest key the fact came from, e.g. "dependencies.left-pad". */
  key: string;
  /** The fact's value; "" marks a declared dependency with no version. */
  value: string;
  anchor: Anchor & { type: "manifest" };
}

export interface ManifestDependency {
  name: string;
  version?: string;
  fact: ManifestFact;
}

export interface ManifestReadResult {
  /** Path as given, relative to the target root. */
  path: string;
  kind: ManifestKind;
  name?: string;
  version?: string;
  dependencies: ManifestDependency[];
  facts: ManifestFact[];
}

/** A manifest file whose kind is not supported: reported, never guessed. */
export interface ManifestUnsupported {
  path: string;
  supported: false;
  reason: string;
}

export type ManifestOutcome = ManifestReadResult | ManifestUnsupported;

export class ManifestParseError extends Error {
  readonly path: string;
  constructor(path: string, message: string) {
    super(`manifests: ${message}`);
    this.name = "ManifestParseError";
    this.path = path;
  }
}

/** What every reader extracts; keys are per-format manifest keys. */
interface ParsedManifest {
  name?: string;
  version?: string;
  group?: string;
  dependencies: Array<{ section: string; name: string; version?: string }>;
}

/** The manifest key a format uses for the component's own name/version. */
const NAME_KEY: Record<ManifestKind, string> = {
  "go.mod": "module",
  "pom.xml": "project.artifactId",
  "package.json": "name",
  "Cargo.toml": "package.name",
  "pubspec.yaml": "name",
};

const VERSION_KEY: Record<ManifestKind, string | undefined> = {
  "go.mod": undefined, // a go.mod declares no component version
  "pom.xml": "project.version",
  "package.json": "version",
  "Cargo.toml": "package.version",
  "pubspec.yaml": "version",
};

const GROUP_KEY: Record<ManifestKind, string | undefined> = {
  "go.mod": undefined,
  "pom.xml": "project.groupId",
  "package.json": undefined,
  "Cargo.toml": undefined,
  "pubspec.yaml": undefined,
};

/** Classify a path by basename; undefined when not a supported kind. */
export function manifestKindOf(path: string): ManifestKind | undefined {
  const name = basename(path);
  return (MANIFEST_KINDS as readonly string[]).includes(name)
    ? (name as ManifestKind)
    : undefined;
}

/** Read one manifest file from the target; the only structural parsing. */
export function readManifest(targetRoot: string, path: string): ManifestOutcome {
  const kind = manifestKindOf(path);
  if (kind === undefined) {
    return {
      path,
      supported: false,
      reason:
        `unsupported manifest kind "${basename(path)}"; supported kinds are ` +
        MANIFEST_KINDS.join(", "),
    };
  }
  const text = readFileSync(join(targetRoot, path), "utf8");
  const parsed = parseManifest(kind, text, path);
  return assembleFacts(kind, path, parsed);
}

function parseManifest(kind: ManifestKind, text: string, path: string): ParsedManifest {
  try {
    switch (kind) {
      case "package.json":
        return parsePackageJson(text);
      case "go.mod":
        return parseGoMod(text);
      case "pom.xml":
        return parsePom(text);
      case "Cargo.toml":
        return parseCargoToml(text);
      case "pubspec.yaml":
        return parsePubspec(text);
    }
  } catch (err) {
    if (err instanceof ManifestParseError) throw err;
    const reason = err instanceof Error ? err.message : String(err);
    throw new ManifestParseError(path, `failed to parse ${path}: ${reason}`);
  }
}

function assembleFacts(
  kind: ManifestKind,
  path: string,
  parsed: ParsedManifest,
): ManifestReadResult {
  const facts: ManifestFact[] = [];
  const fact = (key: string, value: string): ManifestFact => ({
    trust: "charted",
    key,
    value,
    anchor: { type: "manifest", path, key },
  });

  if (parsed.name !== undefined) facts.push(fact(NAME_KEY[kind], parsed.name));
  if (VERSION_KEY[kind] !== undefined && parsed.version !== undefined) {
    facts.push(fact(VERSION_KEY[kind]!, parsed.version));
  }
  if (GROUP_KEY[kind] !== undefined && parsed.group !== undefined) {
    facts.push(fact(GROUP_KEY[kind]!, parsed.group));
  }

  const dependencies: ManifestDependency[] = parsed.dependencies.map((dep) => {
    const depFact = fact(`${dep.section}.${dep.name}`, dep.version ?? "");
    facts.push(depFact);
    return {
      name: dep.name,
      ...(dep.version !== undefined ? { version: dep.version } : {}),
      fact: depFact,
    };
  });

  return {
    path,
    kind,
    ...(parsed.name !== undefined ? { name: parsed.name } : {}),
    ...(parsed.version !== undefined ? { version: parsed.version } : {}),
    dependencies,
    facts,
  };
}

// ---------------------------------------------------------------------------
// package.json
// ---------------------------------------------------------------------------

const NPM_SECTIONS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
] as const;

function parsePackageJson(text: string): ParsedManifest {
  let doc: unknown;
  try {
    doc = JSON.parse(text);
  } catch (err) {
    throw new Error(`not valid JSON (${(err as Error).message})`);
  }
  if (typeof doc !== "object" || doc === null || Array.isArray(doc)) {
    throw new Error("top level is not a JSON object");
  }
  const obj = doc as Record<string, unknown>;
  const dependencies: ParsedManifest["dependencies"] = [];
  for (const section of NPM_SECTIONS) {
    const table = obj[section];
    if (table === undefined) continue;
    if (typeof table !== "object" || table === null || Array.isArray(table)) {
      throw new Error(`"${section}" is not a dependency map`);
    }
    for (const [name, value] of Object.entries(table)) {
      dependencies.push({
        section,
        name,
        version: typeof value === "string" ? value : undefined,
      });
    }
  }
  return {
    name: typeof obj.name === "string" ? obj.name : undefined,
    version: typeof obj.version === "string" ? obj.version : undefined,
    dependencies,
  };
}

// ---------------------------------------------------------------------------
// go.mod (line-oriented; its grammar is line-shaped)
// ---------------------------------------------------------------------------

function parseGoMod(text: string): ParsedManifest {
  const dependencies: ParsedManifest["dependencies"] = [];
  let name: string | undefined;
  let block: "require" | "skip" | undefined;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    let line = lines[i]!;
    const comment = line.indexOf("//");
    if (comment >= 0) line = line.slice(0, comment);
    line = line.trim();
    if (line.length === 0) continue;

    if (block !== undefined) {
      if (line === ")") {
        block = undefined;
        continue;
      }
      if (block === "skip") continue;
      const tokens = line.split(/\s+/);
      if (tokens.length !== 2) {
        throw new Error(
          `line ${i + 1}: expected "<module> <version>" inside require block, got "${line}"`,
        );
      }
      dependencies.push({ section: "require", name: tokens[0]!, version: tokens[1] });
      continue;
    }

    const tokens = line.split(/\s+/);
    const head = tokens[0]!;
    if (head === "module") {
      if (tokens.length !== 2) {
        throw new Error(`line ${i + 1}: module directive needs exactly one path`);
      }
      name = tokens[1];
      continue;
    }
    if (head === "require") {
      if (tokens.length === 2 && tokens[1] === "(") {
        block = "require";
        continue;
      }
      if (tokens.length === 3) {
        dependencies.push({ section: "require", name: tokens[1]!, version: tokens[2] });
        continue;
      }
      throw new Error(`line ${i + 1}: cannot parse require directive "${line}"`);
    }
    // go, toolchain, and any other directive carries no manifest fact;
    // parenthesized blocks (replace, exclude, retract, ...) are skipped.
    if (tokens.length === 2 && tokens[1] === "(") {
      block = "skip";
    }
  }
  if (block !== undefined) {
    throw new Error(`unterminated ${block} block at end of file`);
  }
  return { name, version: undefined, dependencies };
}

// ---------------------------------------------------------------------------
// pom.xml (minimal well-formedness-checking XML scanner)
// ---------------------------------------------------------------------------

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Dependency-bearing element paths inside a pom (keys stay source-faithful). */
const POM_DEP_PREFIXES = [
  "project/dependencies/dependency",
  "project/dependencyManagement/dependencies/dependency",
] as const;

function parsePom(text: string): ParsedManifest {
  let group: string | undefined;
  let name: string | undefined;
  let version: string | undefined;
  const dependencies: ParsedManifest["dependencies"] = [];

  const stack: string[] = [];
  let textBuf = "";
  let pendingDep: { name?: string; version?: string } = {};
  let i = 0;
  const n = text.length;

  const finalize = (path: string, content: string): void => {
    const value = decodeXmlEntities(content.trim());
    if (path === "project/groupId") group = value;
    else if (path === "project/artifactId") name = value;
    else if (path === "project/version") version = value;
    else {
      for (const prefix of POM_DEP_PREFIXES) {
        if (path === `${prefix}/artifactId`) pendingDep.name = value;
        else if (path === `${prefix}/version`) pendingDep.version = value;
      }
    }
  };

  while (i < n) {
    const lt = text.indexOf("<", i);
    if (lt < 0) break;
    textBuf += text.slice(i, lt);
    i = lt;

    if (text.startsWith("<!--", i)) {
      const end = text.indexOf("-->", i + 4);
      if (end < 0) throw new Error("unterminated XML comment");
      i = end + 3;
    } else if (text.startsWith("<![CDATA[", i)) {
      const end = text.indexOf("]]>", i + 9);
      if (end < 0) throw new Error("unterminated CDATA section");
      textBuf += text.slice(i + 9, end);
      i = end + 3;
    } else if (text.startsWith("<?", i)) {
      const end = text.indexOf("?>", i + 2);
      if (end < 0) throw new Error("unterminated processing instruction");
      i = end + 2;
    } else if (text.startsWith("<!", i)) {
      let depth = 0;
      let j = i + 2;
      while (j < n) {
        const c = text[j]!;
        if (c === "[") depth += 1;
        else if (c === "]") depth -= 1;
        else if (c === ">" && depth <= 0) break;
        j += 1;
      }
      if (j >= n) throw new Error("unterminated <! declaration (DOCTYPE?)");
      i = j + 1;
    } else if (text.startsWith("</", i)) {
      const end = text.indexOf(">", i);
      if (end < 0) throw new Error("unterminated closing tag");
      const tagName = text.slice(i + 2, end).trim();
      if (tagName.length === 0 || /[\s/<>=]/.test(tagName)) {
        throw new Error(`malformed closing tag "${tagName}"`);
      }
      const open = stack.pop();
      if (open !== tagName) {
        throw new Error(
          `mismatched closing tag </${tagName}> (open element: <${open ?? "none"}>)`,
        );
      }
      const path = stack.length === 0 ? tagName : `${stack.join("/")}/${tagName}`;
      finalize(path, textBuf);
      const depPrefix = POM_DEP_PREFIXES.find((p) => path === p);
      if (depPrefix !== undefined) {
        if (pendingDep.name === undefined) {
          throw new Error("dependency without an artifactId");
        }
        dependencies.push({
          section: depPrefix === "project/dependencies/dependency"
            ? "project.dependencies"
            : "project.dependencyManagement.dependencies",
          name: pendingDep.name,
          version: pendingDep.version,
        });
        pendingDep = {};
      }
      textBuf = "";
      i = end + 1;
    } else {
      // opening tag: read the name, skip attributes, detect self-closing
      let j = i + 1;
      const nameStart = j;
      while (j < n && !/[\s/>]/.test(text[j]!)) j += 1;
      const tagName = text.slice(nameStart, j);
      if (tagName.length === 0) throw new Error(`malformed tag at offset ${i}`);
      let quote: string | null = null;
      let selfClosing = false;
      while (j < n) {
        const c = text[j]!;
        if (quote !== null) {
          if (c === quote) quote = null;
        } else if (c === '"' || c === "'") quote = c;
        else if (c === "/" && text[j + 1] === ">") {
          selfClosing = true;
          break;
        } else if (c === ">") break;
        j += 1;
      }
      if (j >= n) throw new Error(`unterminated tag <${tagName}`);
      i = selfClosing ? j + 2 : j + 1;
      textBuf = "";
      if (selfClosing) {
        const path = stack.length === 0 ? tagName : `${stack.join("/")}/${tagName}`;
        finalize(path, "");
      } else {
        stack.push(tagName);
      }
    }
  }
  if (stack.length > 0) {
    throw new Error(`unexpected end of file: <${stack[stack.length - 1]}> is never closed`);
  }
  return { name, version, group, dependencies };
}

// ---------------------------------------------------------------------------
// Cargo.toml (a small strict-subset TOML parser; scalars stay raw)
// ---------------------------------------------------------------------------

/** A TOML value we only ever carry around: numbers, booleans, dates. */
class TomlRaw {
  constructor(readonly raw: string) {}
}

interface TomlTable {
  [key: string]: TomlValue;
}

type TomlValue = string | TomlRaw | TomlValue[] | TomlTable;

const TOML_SIMPLE_ESCAPES: Record<string, string> = {
  n: "\n",
  t: "\t",
  r: "\r",
  '"': '"',
  "\\": "\\",
  b: "\b",
  f: "\f",
};

function parseCargoToml(text: string): ParsedManifest {
  const root: TomlTable = {};
  let current: TomlTable = root;
  let i = 0;
  const n = text.length;

  const skipWs = (includeNewlines: boolean): void => {
    for (;;) {
      const c = text[i];
      if (c === undefined) return;
      if (c === " " || c === "\t" || (includeNewlines && (c === "\n" || c === "\r"))) {
        i += 1;
        continue;
      }
      if (c === "#") {
        while (i < n && text[i] !== "\n") i += 1;
        continue;
      }
      return;
    }
  };

  const unescapeBasic = (body: string): string => {
    let out = "";
    for (let k = 0; k < body.length; k += 1) {
      const c = body[k]!;
      if (c !== "\\") {
        out += c;
        continue;
      }
      const esc = body[k + 1];
      if (esc === undefined) throw new Error("dangling escape in multiline string");
      if (esc === "\n" || esc === "\r" || esc === " " || esc === "\t") {
        // line-ending backslash: swallow the whitespace that follows
        while (k < body.length && /\s/.test(body[k]!)) k += 1;
        k -= 1;
        continue;
      }
      if (TOML_SIMPLE_ESCAPES[esc] !== undefined) {
        out += TOML_SIMPLE_ESCAPES[esc]!;
        k += 1;
        continue;
      }
      if (esc === "u" || esc === "U") {
        const digits = esc === "u" ? 4 : 8;
        const hex = body.slice(k + 2, k + 2 + digits);
        if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length < digits) {
          throw new Error(`invalid \\${esc} escape`);
        }
        out += String.fromCodePoint(parseInt(hex, 16));
        k += 1 + digits;
        continue;
      }
      throw new Error(`invalid escape sequence \\${esc}`);
    }
    return out;
  };

  const parseString = (): string => {
    const quote = text[i]!;
    const triple = quote.repeat(3);
    if (text.startsWith(triple, i)) {
      const close = text.indexOf(triple, i + 3);
      if (close < 0) throw new Error("unterminated multiline string");
      let body = text.slice(i + 3, close);
      if (body.startsWith("\r\n")) body = body.slice(2);
      else if (body.startsWith("\n")) body = body.slice(1);
      i = close + 3;
      return quote === '"' ? unescapeBasic(body) : body;
    }
    i += 1;
    let out = "";
    while (i < n) {
      const c = text[i]!;
      if (c === quote) {
        i += 1;
        return out;
      }
      if (c === "\n") throw new Error("unterminated string (newline before closing quote)");
      if (quote === '"' && c === "\\") {
        const esc = text[i + 1];
        if (esc === undefined) throw new Error("unterminated escape sequence");
        if (TOML_SIMPLE_ESCAPES[esc] !== undefined) {
          out += TOML_SIMPLE_ESCAPES[esc]!;
          i += 2;
          continue;
        }
        if (esc === "u" || esc === "U") {
          const digits = esc === "u" ? 4 : 8;
          const hex = text.slice(i + 2, i + 2 + digits);
          if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length < digits) {
            throw new Error(`invalid \\${esc} escape`);
          }
          out += String.fromCodePoint(parseInt(hex, 16));
          i += 2 + digits;
          continue;
        }
        throw new Error(`invalid escape sequence \\${esc}`);
      }
      out += c;
      i += 1;
    }
    throw new Error("unterminated string (end of file)");
  };

  const parseKeyPart = (): string => {
    const c = text[i];
    if (c === '"' || c === "'") return parseString();
    const start = i;
    while (i < n && /[A-Za-z0-9_-]/.test(text[i]!)) i += 1;
    if (i === start) throw new Error(`expected a key at offset ${i}`);
    return text.slice(start, i);
  };

  const parseArray = (): TomlValue[] => {
    i += 1; // consume [
    const items: TomlValue[] = [];
    for (;;) {
      skipWs(true);
      const c = text[i];
      if (c === undefined) throw new Error("unterminated array");
      if (c === "]") {
        i += 1;
        return items;
      }
      items.push(parseValue());
      skipWs(true);
      const after = text[i];
      if (after === ",") {
        i += 1;
        continue;
      }
      if (after === "]") {
        i += 1;
        return items;
      }
      throw new Error(`expected "," or "]" in array at offset ${i}`);
    }
  };

  const parseInlineTable = (): TomlTable => {
    i += 1; // consume {
    const table: TomlTable = {};
    skipWs(true);
    if (text[i] === "}") {
      i += 1;
      return table;
    }
    for (;;) {
      skipWs(true);
      assignKeyValue(table);
      skipWs(true);
      const c = text[i];
      if (c === ",") {
        i += 1;
        continue;
      }
      if (c === "}") {
        i += 1;
        return table;
      }
      throw new Error(`expected "," or "}" in inline table at offset ${i}`);
    }
  };

  const parseValue = (): TomlValue => {
    skipWs(false);
    const c = text[i];
    if (c === undefined) throw new Error("expected a value, found end of file");
    if (c === '"' || c === "'") return parseString();
    if (c === "[") return parseArray();
    if (c === "{") return parseInlineTable();
    const start = i;
    while (i < n && !",]}#\n\r".includes(text[i]!)) i += 1;
    const raw = text.slice(start, i).trim();
    if (raw.length === 0) throw new Error(`expected a value at offset ${start}`);
    return new TomlRaw(raw);
  };

  function setPath(table: TomlTable, parts: string[], value: TomlValue): void {
    let node: TomlTable = table;
    for (let k = 0; k < parts.length - 1; k += 1) {
      const part = parts[k]!;
      const existing = node[part];
      if (existing === undefined) {
        const next: TomlTable = {};
        node[part] = next;
        node = next;
      } else if (existing instanceof TomlRaw || Array.isArray(existing)) {
        throw new Error(`key conflict at "${parts.join(".")}"`);
      } else {
        node = existing as TomlTable;
      }
    }
    const last = parts[parts.length - 1]!;
    if (node[last] !== undefined) throw new Error(`duplicate key "${parts.join(".")}"`);
    node[last] = value;
  }

  function assignKeyValue(target: TomlTable): void {
    const parts = [parseKeyPart()];
    skipWs(false);
    while (text[i] === ".") {
      i += 1;
      skipWs(false);
      parts.push(parseKeyPart());
      skipWs(false);
    }
    if (text[i] !== "=") {
      throw new Error(`expected "=" after key "${parts.join(".")}" at offset ${i}`);
    }
    i += 1;
    setPath(target, parts, parseValue());
  }

  for (;;) {
    skipWs(true);
    if (i >= n) break;
    if (text[i] === "[") {
      const arrayTable = text.startsWith("[[", i);
      i += arrayTable ? 2 : 1;
      skipWs(false);
      const parts = [parseKeyPart()];
      skipWs(false);
      while (text[i] === ".") {
        i += 1;
        skipWs(false);
        parts.push(parseKeyPart());
        skipWs(false);
      }
      const closer = arrayTable ? "]]" : "]";
      if (!text.startsWith(closer, i)) {
        throw new Error(`expected "${closer}" after table name at offset ${i}`);
      }
      i += closer.length;
      let node: TomlTable = root;
      for (let k = 0; k < parts.length - 1; k += 1) {
        const part = parts[k]!;
        const existing = node[part];
        if (existing === undefined) {
          const next: TomlTable = {};
          node[part] = next;
          node = next;
        } else if (existing instanceof TomlRaw || Array.isArray(existing)) {
          throw new Error(`table "${parts.join(".")}" conflicts with an existing value`);
        } else {
          node = existing as TomlTable;
        }
      }
      const last = parts[parts.length - 1]!;
      if (arrayTable) {
        const list: TomlValue[] = Array.isArray(node[last]) ? (node[last] as TomlValue[]) : [];
        node[last] = list;
        const table: TomlTable = {};
        list.push(table);
        current = table;
      } else {
        const existing = node[last];
        if (existing === undefined || existing instanceof TomlRaw) {
          const table: TomlTable = {};
          node[last] = table;
          current = table;
        } else if (Array.isArray(existing)) {
          throw new Error(`table "${parts.join(".")}" conflicts with an array of tables`);
        } else {
          current = existing as TomlTable;
        }
      }
      continue;
    }
    assignKeyValue(current);
    skipWs(false);
    const c = text[i];
    if (c !== undefined && c !== "\n" && c !== "\r") {
      throw new Error(`unexpected trailing input at offset ${i}`);
    }
  }

  const asTable = (v: TomlValue | undefined): TomlTable | undefined =>
    v !== undefined && typeof v === "object" && !Array.isArray(v) && !(v instanceof TomlRaw)
      ? (v as TomlTable)
      : undefined;

  const pkg = asTable(root["package"]);
  const dependencies: ParsedManifest["dependencies"] = [];
  for (const section of ["dependencies", "dev-dependencies", "build-dependencies"] as const) {
    const table = asTable(root[section]);
    if (table === undefined) continue;
    for (const [depName, value] of Object.entries(table)) {
      let version: string | undefined;
      if (typeof value === "string") version = value;
      else {
        const inline = asTable(value);
        const v = inline?.["version"];
        if (typeof v === "string") version = v;
      }
      dependencies.push({ section, name: depName, version });
    }
  }
  return {
    name: typeof pkg?.["name"] === "string" ? pkg["name"] : undefined,
    version: typeof pkg?.["version"] === "string" ? pkg["version"] : undefined,
    dependencies,
  };
}

// ---------------------------------------------------------------------------
// pubspec.yaml (restricted reader: flat keys plus dependency maps)
// ---------------------------------------------------------------------------

function stripYamlComment(line: string): string {
  let quote: string | null = null;
  for (let k = 0; k < line.length; k += 1) {
    const c = line[k]!;
    if (quote !== null) {
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === "#" && (k === 0 || line[k - 1] === " " || line[k - 1] === "\t")) {
      return line.slice(0, k);
    }
  }
  return line;
}

function stripYamlQuotes(value: string): string {
  const t = value.trim();
  if (
    t.length >= 2 &&
    ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

const YAML_KEY = /^(?:"([^"]+)"|'([^']+)'|([A-Za-z0-9_.-]+)):(?:[ \t]+(.*))?$/;

function parsePubspec(text: string): ParsedManifest {
  const dependencies: ParsedManifest["dependencies"] = [];
  let name: string | undefined;
  let version: string | undefined;

  const lines = text.split("\n").map(stripYamlComment);
  let k = 0;
  while (k < lines.length) {
    const line = lines[k]!;
    if (line.trim().length === 0) {
      k += 1;
      continue;
    }
    if (/^[ \t]/.test(line)) {
      throw new Error(`line ${k + 1}: unexpected indented line "${line.trim()}" outside any block`);
    }
    const keyLine = k + 1;
    const match = YAML_KEY.exec(line.replace(/\r$/, ""));
    if (match === null) {
      throw new Error(`line ${keyLine}: expected "<key>:", got "${line.trim()}"`);
    }
    const key = match[1] ?? match[2] ?? match[3]!;
    const inlineValue =
      match[4] !== undefined && match[4].length > 0 ? stripYamlQuotes(match[4]) : undefined;
    k += 1;

    // gather the block that belongs to this key (deeper-indented lines)
    const block: Array<{ indent: number; text: string; lineNo: number }> = [];
    while (k < lines.length) {
      const bl = lines[k]!;
      if (bl.trim().length === 0) {
        k += 1;
        continue;
      }
      const indent = bl.length - bl.trimStart().length;
      if (indent === 0) break;
      block.push({ indent, text: bl.replace(/\r$/, "").trimEnd(), lineNo: k + 1 });
      k += 1;
    }

    if (key === "name" || key === "version") {
      if (inlineValue === undefined) {
        throw new Error(`line ${keyLine}: "${key}" needs a scalar value`);
      }
      if (key === "name") name = inlineValue;
      else version = inlineValue;
      continue;
    }
    if (key !== "dependencies" && key !== "dev_dependencies") {
      continue; // environment, description, flutter, ... carry no v1 facts
    }
    if (inlineValue !== undefined) {
      throw new Error(`line ${keyLine}: "${key}" must be a mapping`);
    }
    const section = key;
    if (block.length === 0) continue;
    const baseIndent = Math.min(...block.map((b) => b.indent));
    let currentDep: { index: number; version?: string } | null = null;
    for (const entry of block) {
      if (entry.indent === baseIndent) {
        const m = YAML_KEY.exec(entry.text.trim());
        if (m === null) {
          throw new Error(
            `line ${entry.lineNo}: expected "<package>:" in ${section}, got "${entry.text.trim()}"`,
          );
        }
        dependencies.push({
          section,
          name: m[1] ?? m[2] ?? m[3]!,
          version: m[4] !== undefined && m[4].length > 0 ? stripYamlQuotes(m[4]) : undefined,
        });
        currentDep = { index: dependencies.length - 1, version: dependencies.at(-1)?.version };
      } else if (currentDep !== null) {
        // nested detail; only a direct `version:` refines the dependency fact
        const m = YAML_KEY.exec(entry.text.trim());
        const nestedKey = m !== null ? (m[1] ?? m[2] ?? m[3]!) : undefined;
        if (
          nestedKey === "version" &&
          m?.[4] !== undefined &&
          dependencies[currentDep.index]!.version === undefined
        ) {
          dependencies[currentDep.index]!.version = stripYamlQuotes(m[4]);
        }
      }
    }
  }
  return { name, version, dependencies };
}
