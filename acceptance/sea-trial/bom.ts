/**
 * The narrow `bigtop.bom` reader — the acceptance-side oracle for the
 * machine-checked questions (sea-trial design.md, decision 2).
 *
 * `bigtop.bom` is a Groovy DSL build file, which sits outside the five
 * manifest kinds the product's `manifests` tool supports. The sea trial
 * needs its facts (component name/version pins, the stack dependency
 * order), so the oracle gets a reader of its own. This does not breach the
 * no-parser rule — that rule governs the product's probe layer; this reader
 * is acceptance tooling that reads one known file shape and fails loudly
 * on anything it does not recognize (never guesses, never half-parses).
 */
import { readFileSync } from "node:fs";

export class BomError extends Error {
  constructor(message: string) {
    super(`bigtop.bom: ${message}`);
    this.name = "BomError";
  }
}

/** One component as pinned by the BOM's `components` section. */
export interface BomComponent {
  /** The quoted label keying the component block, e.g. 'zookeeper'. */
  label: string;
  /** The component's `name =` value. */
  name: string;
  /** The resolved `version.base` (literals, or `bigtop.version` refs). */
  versionBase: string;
  /** 1-based line of the component block's opening label. */
  line: number;
}

/** What the reader extracts from one `bigtop.bom`. */
export interface Bom {
  path: string;
  /** `bigtop.version` if declared (resolves `version.base = bigtop.version`). */
  bigtopVersion?: string;
  components: BomComponent[];
  /**
   * The `dependencies` map verbatim: key → the list of components that
   * depend on it (the DSL's `dependsOn := [list of dependents]`).
   */
  dependencyMap: Array<{ dependency: string; dependents: string[]; line: number }>;
}

/** Fairway pairs derived from the BOM dependency map: dependent → dependency. */
export interface BomFairwayPair {
  dependent: string;
  dependency: string;
}

export function bomDependencyPairs(bom: Bom): BomFairwayPair[] {
  const pairs: BomFairwayPair[] = [];
  for (const { dependency, dependents } of bom.dependencyMap) {
    for (const dependent of dependents) pairs.push({ dependent, dependency });
  }
  return pairs.sort((a, b) =>
    a.dependent === b.dependent
      ? a.dependency < b.dependency
        ? -1
        : 1
      : a.dependent < b.dependent
        ? -1
        : 1,
  );
}

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

type Punct = "{" | "}" | "[" | "]" | "=" | "," | ":" | ";";

type Token =
  | { t: "str"; v: string; line: number }
  | { t: "word"; v: string; line: number }
  | { t: "punct"; v: Punct; line: number }
  | { t: "nl"; line: number }
  /** Any character the structure does not read (parens, operators, ...). */
  | { t: "other"; v: string; line: number };

const PUNCT = new Set(["{", "}", "[", "]", "=", ",", ":", ";"]);

/**
 * Tokenize with full string/comment awareness: URLs inside strings (`//`)
 * stay string content, the DSL documentation block comment vanishes whole.
 */
function tokenize(text: string, path: string): Token[] {
  const tokens: Token[] = [];
  let line = 1;
  let i = 0;
  const n = text.length;
  const push = (t: Token) => tokens.push(t);

  while (i < n) {
    const c = text[i]!;
    if (c === "\n") {
      push({ t: "nl", line });
      line += 1;
      i += 1;
      continue;
    }
    if (c === " " || c === "\t" || c === "\r") {
      i += 1;
      continue;
    }
    if (c === "/" && text[i + 1] === "/") {
      while (i < n && text[i] !== "\n") i += 1;
      continue;
    }
    if (c === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      if (end < 0) throw new BomError(`unterminated block comment starting at line ${line}`);
      for (let k = i; k < end + 2; k += 1) if (text[k] === "\n") line += 1;
      i = end + 2;
      continue;
    }
    if (c === "'" || c === '"') {
      const quote = c;
      const startLine = line;
      let v = "";
      i += 1;
      for (;;) {
        if (i >= n) throw new BomError(`unterminated string starting at line ${startLine}`);
        const s = text[i]!;
        if (s === "\n") throw new BomError(`unterminated string starting at line ${startLine}`);
        if (s === "\\" && quote === '"') {
          const esc = text[i + 1];
          if (esc === undefined) {
            throw new BomError(`unterminated escape in string at line ${line}`);
          }
          v += s + esc;
          i += 2;
          continue;
        }
        if (s === quote) {
          i += 1;
          break;
        }
        v += s;
        i += 1;
      }
      push({ t: "str", v, line: startLine });
      continue;
    }
    if (PUNCT.has(c)) {
      push({ t: "punct", v: c as Punct, line });
      i += 1;
      continue;
    }
    // A word: identifiers, dotted refs (bigtop.version), numbers.
    if (/[A-Za-z0-9_$.\-]/.test(c)) {
      const start = i;
      while (i < n && /[A-Za-z0-9_$.\-]/.test(text[i]!)) i += 1;
      push({ t: "word", v: text.slice(start, i), line });
      continue;
    }
    // Parentheses, operators, elvis marks, ... — the structure we read never
    // needs them; skipped statements consume them, structural positions
    // reject them by name.
    push({ t: "other", v: c, line });
    i += 1;
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

class Cursor {
  private i = 0;
  constructor(private readonly toks: Token[]) {}

  peek(): Token | undefined {
    return this.toks[this.i];
  }
  next(): Token | undefined {
    return this.toks[this.i++];
  }
  atEnd(): boolean {
    return this.i >= this.toks.length;
  }
  /** Skip newline tokens. */
  skipNl(): void {
    while (this.peek()?.t === "nl") this.i += 1;
  }
  /** True when the next token is the given punctuation. */
  atPunct(v: Punct): boolean {
    const tok = this.peek();
    return tok !== undefined && tok.t === "punct" && tok.v === v;
  }
  expectPunct(v: Punct, context: string): void {
    const tok = this.next();
    if (tok === undefined || tok.t !== "punct" || tok.v !== v) {
      throw new BomError(`expected ${JSON.stringify(v)} ${context}, got ${describe(tok)}`);
    }
  }
  /** A scalar: quoted string or bare word (labels, names, list items). */
  scalar(context: string): { v: string; line: number } {
    const tok = this.next();
    if (tok === undefined || (tok.t !== "str" && tok.t !== "word")) {
      throw new BomError(`expected a name or string ${context}, got ${describe(tok)}`);
    }
    return { v: tok.v, line: tok.line };
  }
  /**
   * Consume a statement terminator: `;` or newline (consumed). A closing
   * `}`/`]` (or end of file) also ends the statement — the block it closes
   * stays in place for the structural parser (`version { base = '3.0.0' }`).
   * Anything else is unrecognized structure and fails loudly.
   */
  endStatement(context: string): void {
    const tok = this.peek();
    if (tok === undefined) return;
    if (tok.t === "punct" && (tok.v === "}" || tok.v === "]")) return;
    if (tok.t === "punct" && tok.v === ";") {
      this.i += 1;
      return;
    }
    if (tok.t === "nl") {
      this.i += 1;
      return;
    }
    throw new BomError(`expected end of statement ${context}, got ${describe(tok)}`);
  }
  /**
   * Skip an assignment we do not read. Groovy statements can carry closure
   * literals (`base_version = version.takeWhile { it != '-' }`), so braces
   * opened mid-statement are consumed with their match; a `}`/`]` at depth
   * zero belongs to the enclosing structure and is left in place. `;` and
   * newlines at depth zero terminate the statement and are consumed.
   */
  skipStatement(): void {
    let depth = 0;
    for (;;) {
      const tok = this.peek();
      if (tok === undefined) return;
      if (tok.t === "punct") {
        if (tok.v === "{") depth += 1;
        else if (tok.v === "}") {
          if (depth === 0) return;
          depth -= 1;
        } else if (tok.v === "]" && depth === 0) {
          return;
        } else if (tok.v === ";" && depth === 0) {
          this.i += 1;
          return;
        }
      } else if (tok.t === "nl" && depth === 0) {
        this.i += 1;
        return;
      }
      this.i += 1;
    }
  }
  /** Skip a balanced `{ ... }` block we do not read (stack, tarball, url, git). */
  skipBalancedBlock(context: string): void {
    this.expectPunct("{", context);
    let depth = 1;
    for (;;) {
      const tok = this.next();
      if (tok === undefined) throw new BomError(`unterminated block ${context}`);
      if (tok.t === "punct" && tok.v === "{") depth += 1;
      else if (tok.t === "punct" && tok.v === "}") {
        depth -= 1;
        if (depth === 0) return;
      }
    }
  }
}

function describe(tok: Token | undefined): string {
  if (tok === undefined) return "end of file";
  switch (tok.t) {
    case "str":
      return `string ${JSON.stringify(tok.v)} (line ${tok.line})`;
    case "word":
      return `word ${JSON.stringify(tok.v)} (line ${tok.line})`;
    case "punct":
      return `"${tok.v}" (line ${tok.line})`;
    case "nl":
      return `end of line ${tok.line}`;
    case "other":
      return `${JSON.stringify(tok.v)} (line ${tok.line})`;
  }
}

function parseDependencies(c: Cursor, bom: Bom): void {
  c.expectPunct("[", "opening the dependencies map");
  c.skipNl();
  if (c.atPunct("]")) {
    c.next();
    return;
  }
  for (;;) {
    const key = c.scalar("as a dependencies map key");
    c.skipNl();
    c.expectPunct(":", `after dependencies key ${JSON.stringify(key.v)}`);
    c.skipNl();
    c.expectPunct("[", `opening the dependents list of ${JSON.stringify(key.v)}`);
    c.skipNl();
    const dependents: string[] = [];
    for (;;) {
      if (c.atPunct("]")) {
        c.next();
        break;
      }
      dependents.push(c.scalar(`in the dependents list of ${JSON.stringify(key.v)}`).v);
      c.skipNl();
      if (c.atPunct(",")) {
        c.next();
        c.skipNl();
      }
    }
    bom.dependencyMap.push({ dependency: key.v, dependents, line: key.line });
    c.skipNl();
    if (c.atPunct(",")) {
      c.next();
      c.skipNl();
      // Groovy tolerates a trailing comma before the closing bracket.
      if (c.atPunct("]")) {
        c.next();
        return;
      }
      continue;
    }
    if (c.atPunct("]")) {
      c.next();
      return;
    }
    throw new BomError(
      `unrecognized dependencies structure after ${JSON.stringify(key.v)}: got ${describe(c.peek())}`,
    );
  }
}

function parseVersionBase(c: Cursor, label: string, bom: Bom): string {
  const tok = c.next();
  if (tok === undefined) {
    throw new BomError(`component ${JSON.stringify(label)}: version.base missing`);
  }
  if (tok.t === "str") return tok.v;
  if (tok.t === "word" && tok.v === "bigtop.version") {
    if (bom.bigtopVersion === undefined) {
      throw new BomError(
        `component ${JSON.stringify(label)}: version.base = bigtop.version, but bigtop.version is not declared before use`,
      );
    }
    return bom.bigtopVersion;
  }
  throw new BomError(
    `component ${JSON.stringify(label)}: unrecognized version.base ${describe(tok)} — ` +
      `the narrow reader resolves string literals and bigtop.version references only`,
  );
}

function parseVersionBlock(c: Cursor, label: string, bom: Bom): string {
  c.expectPunct("{", `opening the version block of ${JSON.stringify(label)}`);
  let base: string | undefined;
  for (;;) {
    c.skipNl();
    const tok = c.peek();
    if (tok === undefined) throw new BomError(`unterminated version block of ${JSON.stringify(label)}`);
    if (tok.t === "punct" && tok.v === "}") {
      c.next();
      break;
    }
    const key = c.next();
    if (key?.t !== "word") {
      throw new BomError(
        `unrecognized token in the version block of ${JSON.stringify(label)}: ${describe(key)}`,
      );
    }
    if (key.v === "base") {
      c.expectPunct("=", `after version.base of ${JSON.stringify(label)}`);
      base = parseVersionBase(c, label, bom);
      c.endStatement(`after version.base of ${JSON.stringify(label)}`);
    } else {
      c.skipStatement();
    }
  }
  if (base === undefined) {
    throw new BomError(`component ${JSON.stringify(label)}: no resolvable version.base`);
  }
  return base;
}

function parseComponents(c: Cursor, bom: Bom): void {
  for (;;) {
    c.skipNl();
    if (c.atPunct("}")) {
      c.next();
      return;
    }
    if (c.atEnd()) throw new BomError("unterminated components section");
    const label = c.scalar("as a component label");
    c.expectPunct("{", `opening component ${JSON.stringify(label.v)}`);
    let name: string | undefined;
    let versionBase: string | undefined;
    for (;;) {
      c.skipNl();
      if (c.atPunct("}")) {
        c.next();
        break;
      }
      if (c.atEnd()) {
        throw new BomError(`unterminated component ${JSON.stringify(label.v)}`);
      }
      const key = c.next();
      if (key?.t !== "word") {
        throw new BomError(
          `unrecognized token in component ${JSON.stringify(label.v)}: ${describe(key)}`,
        );
      }
      if (key.v === "name" && !c.atPunct("{")) {
        c.expectPunct("=", `after name of ${JSON.stringify(label.v)}`);
        name = c.scalar(`as the name of ${JSON.stringify(label.v)}`).v;
        c.endStatement(`after name of ${JSON.stringify(label.v)}`);
      } else if (key.v === "version" && c.atPunct("{")) {
        versionBase = parseVersionBlock(c, label.v, bom);
      } else if (c.atPunct("{")) {
        c.skipBalancedBlock(`of ${key.v} in component ${JSON.stringify(label.v)}`);
      } else {
        c.expectPunct("=", `after ${key.v} of ${JSON.stringify(label.v)}`);
        c.skipStatement();
      }
    }
    if (name === undefined) {
      throw new BomError(`component ${JSON.stringify(label.v)} (line ${label.line}) has no name`);
    }
    if (versionBase === undefined) {
      throw new BomError(
        `component ${JSON.stringify(label.v)} (line ${label.line}) has no version block with a resolvable base`,
      );
    }
    bom.components.push({ label: label.v, name, versionBase, line: label.line });
  }
}

/** Read and parse one `bigtop.bom` file. Throws {@link BomError} loudly on drift. */
export function readBom(path: string): Bom {
  const text = readFileSync(path, "utf8");
  const c = new Cursor(tokenize(text, path));
  const bom: Bom = { path, components: [], dependencyMap: [] };

  c.skipNl();
  const head = c.next();
  if (head === undefined || head.t !== "word" || head.v !== "bigtop") {
    throw new BomError(
      `expected the file to open with the bigtop { ... } block, got ${describe(head)}`,
    );
  }
  c.skipNl();
  c.expectPunct("{", "opening the bigtop block");

  for (;;) {
    c.skipNl();
    if (c.atPunct("}")) {
      c.next();
      break;
    }
    if (c.atEnd()) throw new BomError("unterminated bigtop block");
    const key = c.next();
    if (key?.t !== "word") {
      throw new BomError(`unrecognized token in the bigtop block: ${describe(key)}`);
    }
    const nextIsBrace = c.atPunct("{");

    if (key.v === "version" && !nextIsBrace) {
      c.expectPunct("=", "after bigtop.version");
      bom.bigtopVersion = c.scalar("as bigtop.version").v;
      c.endStatement("after bigtop.version");
    } else if (key.v === "dependencies" && !nextIsBrace) {
      c.expectPunct("=", "after dependencies");
      parseDependencies(c, bom);
    } else if (key.v === "components" && nextIsBrace) {
      c.next(); // consume "{"
      parseComponents(c, bom);
    } else if (nextIsBrace) {
      c.skipBalancedBlock(`of ${key.v} in the bigtop block`);
    } else {
      c.expectPunct("=", `after ${key.v}`);
      c.skipStatement();
    }
  }

  if (bom.components.length === 0) {
    throw new BomError("no components section with pinned components found");
  }
  return bom;
}
