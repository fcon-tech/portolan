/**
 * The adapter-boundary check (tasks.md 4.3): `adapters/` imports no tool
 * logic. Proven in both directions: the real adapter tree scans clean, and
 * a tree that does import a tool module is caught — the check fails when it
 * should, not just passes when convenient.
 */
import { test, expect } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanAdapterTree } from "./adapter-boundary";

/** The real adapters/ tree, at the repo root this core belongs to. */
const adaptersDir = join(import.meta.dir, "..", "..", "..", "adapters");

test("the real adapters tree imports no tool logic", () => {
  const violations = scanAdapterTree(adaptersDir);
  expect(violations).toEqual([]);
});

test("the check fails when a tool module is imported from an adapter", () => {
  const sandbox = mkdtempSync(join(tmpdir(), "portolan-boundary-"));
  try {
    mkdirSync(join(sandbox, "pi"), { recursive: true });
    mkdirSync(join(sandbox, "opencode"), { recursive: true });
    writeFileSync(
      join(sandbox, "pi", "evil.ts"),
      [
        'import { sweep } from "@portolan/core";',
        'import { writeChart } from "../../../core/src/chart-store";',
        // The Pointer template is the one sanctioned import — not flagged.
        'import { renderPointer } from "../../../core/src/pointer/index";',
        // But a specifier that merely passes through the pointer directory
        // into other core code is still flagged.
        'import { sweep } from "../../../core/src/pointer/index/../tools/sweep";',
        "export const x = 1;",
      ].join("\n"),
    );
    writeFileSync(
      join(sandbox, "opencode", "evil.sh"),
      'node -e \'require("../../../core/src/tools/log")\'\n',
    );
    // A launch line is not an import: the honest shim body must not trip it.
    writeFileSync(
      join(sandbox, "pi", "portolan-mcp"),
      ['#!/usr/bin/env bash', 'exec bun "$ROOT/core/src/server/main.ts" "$@"'].join("\n"),
    );

    const violations = scanAdapterTree(sandbox);
    const files = violations.map((v) => v.file);
    expect(files).toContain("pi/evil.ts");
    expect(files).toContain("opencode/evil.sh");
    expect(files).not.toContain("pi/portolan-mcp");

    const fromPackageImport = violations.find((v) => v.file === "pi/evil.ts")!;
    expect(fromPackageImport.line).toBe(1);
    expect(fromPackageImport.text).toContain("@portolan/core");
    // Exactly three of the four imports are flagged: the sanctioned Pointer
    // template import is absent, the evasion through the pointer directory
    // into tools is present.
    const evilLines = violations
      .filter((v) => v.file === "pi/evil.ts")
      .map((v) => v.text);
    expect(
      evilLines.some((text) => text.endsWith('core/src/pointer/index";')),
      "the sanctioned Pointer template import is not flagged",
    ).toBe(false);
    expect(
      evilLines.some((text) => text.includes("pointer/index/../tools/sweep")),
      "a specifier passing through the pointer directory into tools is flagged",
    ).toBe(true);
    expect(evilLines.length, "three imports flagged, one sanctioned").toBe(3);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});
