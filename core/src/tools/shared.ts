/**
 * Shared plumbing for the probe tools: PATH-based binary discovery and the
 * honest missing-binary error. Tools wrap external binaries (ripgrep for
 * sweep, ctags for symbols); when one is absent the tool names it and
 * refuses to improvise a substitute search
 * specs/tools/spec.md.
 */
import { accessSync, constants, statSync } from "node:fs";
import { delimiter, join } from "node:path";

export type Env = Record<string, string | undefined>;

/**
 * Raised when the external binary a tool depends on is not installed.
 * Names the binary and states that no results were gathered; the tool
 * never falls back to an improvised search.
 */
export class MissingBinaryError extends Error {
  readonly binary: string;
  constructor(binary: string, tool: string) {
    super(
      `${tool}: the "${binary}" binary is not installed (searched PATH); ` +
        `no results were gathered and no substitute search was attempted. ` +
        `Installing binaries is the expedition's one approval — install ` +
        `${binary} and re-run.`,
    );
    this.name = "MissingBinaryError";
    this.binary = binary;
  }
}

/** Resolve an executable file on PATH; undefined when not found. */
export function findBinary(
  name: string,
  env: Env = process.env,
): string | undefined {
  const pathValue = env.PATH ?? "";
  for (const dir of pathValue.split(delimiter)) {
    if (dir.length === 0) continue;
    const candidate = join(dir, name);
    try {
      accessSync(candidate, constants.X_OK);
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      // absent or not executable in this directory — keep scanning
    }
  }
  return undefined;
}

/** Escape a literal so it can be embedded in a ripgrep regex. */
export function escapeRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** ripgrep reports paths relative to the cwd it ran in; normalize harder. */
export function relativeToTarget(path: string, targetRoot: string): string {
  if (path.startsWith("./")) return path.slice(2);
  const root = targetRoot.endsWith("/") ? targetRoot : `${targetRoot}/`;
  if (path.startsWith(root)) return path.slice(root.length);
  return path;
}

/** The first non-blank line of a probe's text output, trimmed. */
export function firstLine(text: string): string {
  return (
    text
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? ""
  );
}
