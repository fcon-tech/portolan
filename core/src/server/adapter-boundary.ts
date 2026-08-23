/**
 * The adapter-boundary check (tasks.md 4.3): a static scan proving
 * `adapters/` imports no tool logic. Adapters are launch configuration
 * (design.md, decision 5) — an adapter that imports a tool module would be
 * a code path the harness-parity scenario cannot test by construction.
 *
 * The scan is deliberately blunt: it flags any module import (static,
 * dynamic, or require) of the core package or of anything under core/src.
 * Launching the server (exec lines in shims, the command array in the
 * opencode config) is exactly what adapters are FOR and is never flagged.
 * Markdown is skipped — prose shows examples, code does not import.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/** One boundary violation: where it is, and the offending line. */
export interface BoundaryViolation {
  file: string;
  line: number;
  text: string;
}

/** Import/requires that reach tool or core logic from adapter code. */
const TOOL_IMPORT_PATTERNS: RegExp[] = [
  /from\s+["']@portolan\/core[^"']*["']/, // static import of the package
  /import\s*\(\s*["']@portolan\/core[^"']*["']\s*\)/, // dynamic import
  /require\s*\(\s*["']@portolan\/core[^"']*["']\s*\)/, // CJS require
  /from\s+["'][^"']*core\/src\//, // relative path into the core tree
  /import\s*\(\s*["'][^"']*core\/src\//,
  /require\s*\(\s*["'][^"']*core\/src\//,
];

const SCANNED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".sh", ""]);

/**
 * Scan an adapter tree for tool-logic imports. Returns every violation;
 * an empty list means the boundary holds.
 */
export function scanAdapterTree(root: string): BoundaryViolation[] {
  const violations: BoundaryViolation[] = [];
  const visit = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
    )) {
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(abs);
        continue;
      }
      if (!entry.isFile()) continue;
      if (entry.name.endsWith(".md") || entry.name.endsWith(".json") || entry.name.endsWith(".jsonc")) {
        continue; // prose and config; launch lines live here on purpose
      }
      const ext = entry.name.includes(".") ? entry.name.slice(entry.name.lastIndexOf(".")) : "";
      if (!SCANNED_EXTENSIONS.has(ext)) continue;
      const lines = readFileSync(abs, "utf8").split("\n");
      lines.forEach((text, index) => {
        if (TOOL_IMPORT_PATTERNS.some((pattern) => pattern.test(text))) {
          violations.push({ file: relative(root, abs), line: index + 1, text: text.trim() });
        }
      });
    }
  };
  visit(root);
  return violations;
}
