/**
 * `sweep`: ripgrep-backed pattern search over the target. Every match comes
 * back as an anchored chunk (path, line, matched text, optional context)
 * labeled `measured`. No match is an honest empty list; a malformed pattern
 * is an error naming the pattern with zero results; a missing ripgrep is an
 * error naming the binary — never a substitute search.
 * (openspec/changes/probe-tools, specs/tools/spec.md)
 */
import type { Anchor } from "../types";

export interface SweepOptions {
  /** Surrounding context lines handed to ripgrep (`rg -C`). */
  context?: number;
  /** Glob filter handed to ripgrep (`rg -g`). */
  glob?: string;
  /** Environment override; tests restrict PATH to probe missing-binary paths. */
  env?: Record<string, string | undefined>;
}

/** One anchored match: where it is, what matched, optional context. */
export interface SweepChunk {
  /** File path, relative to the target root when ripgrep reports one. */
  path: string;
  /** 1-based line number of the match. */
  line: number;
  /** The full matching line, without trailing newline. */
  text: string;
  /** The first matched substring. */
  match: string;
  /** Every matched substring on the line. */
  matches: string[];
  /** Surrounding lines, present when `context` was requested. */
  context?: string[];
  /** file:line anchor for chart citations. */
  anchor: Anchor;
}

export interface SweepResult {
  trust: "measured";
  pattern: string;
  chunks: SweepChunk[];
}

/** Raised when ripgrep itself fails (malformed pattern, bad root, ...). */
export class SweepError extends Error {
  readonly pattern: string;
  constructor(pattern: string, message: string) {
    super(`sweep: ${message}`);
    this.name = "SweepError";
    this.pattern = pattern;
  }
}

/** Search `targetRoot` for `pattern`; anchored chunks labeled `measured`. */
export function sweep(
  _targetRoot: string,
  _pattern: string,
  _options: SweepOptions = {},
): SweepResult {
  throw new Error("sweep: not implemented yet (probe-tools tasks 2.1–2.2)");
}
