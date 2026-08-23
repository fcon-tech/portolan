/**
 * `symbols`: ctags-backed symbol lookup. Definitions (name, kind, path,
 * line) are authoritative ctags output; references are resolved only by a
 * corroborating sweep of the symbol name — never invented. Absent symbols
 * are an honest empty result; a missing ctags is an error naming the
 * binary. (openspec/changes/probe-tools, specs/tools/spec.md)
 */
import type { Anchor } from "../types";

export interface SymbolOptions {
  /** Resolve references via a corroborating sweep of the symbol name. */
  references?: boolean;
  /** Environment override; tests restrict PATH to probe missing-binary paths. */
  env?: Record<string, string | undefined>;
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

/** Look up `name` in `targetRoot` through ctags; results labeled `measured`. */
export function symbols(
  _targetRoot: string,
  _name: string,
  _options: SymbolOptions = {},
): SymbolResult {
  throw new Error("symbols: not implemented yet (probe-tools tasks 3.1–3.2)");
}
