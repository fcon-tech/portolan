/**
 * Shared plumbing for the probe tools: PATH-based binary discovery and the
 * honest missing-binary error. Tools wrap external binaries (ripgrep for
 * sweep, ctags for symbols); when one is absent the tool names it and
 * refuses to improvise a substitute search
 * (openspec/changes/probe-tools, specs/tools/spec.md).
 */
import { accessSync, constants, statSync } from "node:fs";
import { delimiter, join } from "node:path";
import type { TrustLabel } from "../types";

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

/**
 * Guard: a probe result must carry its trust label. Used by tests to prove
 * labels are load-bearing (stripping one fails loudly) and available to
 * consumers that want to assert before charting.
 */
export function requireTrustLabel(
  labeled: { trust?: TrustLabel },
  expected: TrustLabel,
  what: string,
): void {
  if (labeled.trust !== expected) {
    throw new Error(
      `${what}: expected the trust label "${expected}", got ${
        labeled.trust === undefined ? "no label at all" : `"${String(labeled.trust)}"`
      }`,
    );
  }
}

/** Escape a literal so it can be embedded in a ripgrep regex. */
export function escapeRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
