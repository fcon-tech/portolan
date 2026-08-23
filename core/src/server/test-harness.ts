/**
 * Test harness for the MCP server: builds provinces, launches the real
 * entry point as a subprocess over stdio, and hands a connected SDK client
 * to the test. Every server launch in the suite goes through here, so the
 * parity tests and the integration tests exercise the identical artifact.
 */
import { afterAll, expect } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { findBinary } from "../tools/shared";

export const SERVER_ENTRY = join(import.meta.dir, "main.ts");

/** The repo's test doubles (ctags) and fixtures root. */
export const fixturesBin = join(import.meta.dir, "..", "..", "test", "fixtures", "bin");
export const manifestFixtures = join(
  import.meta.dir,
  "..",
  "..",
  "test",
  "fixtures",
  "manifests",
);

const targets: string[] = [];
afterAll(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

/**
 * Build a small province: two TypeScript sources, all five manifests, a
 * README. The same shape the probe-tool tests use, so results here are
 * comparable with the direct tool results asserted in those suites.
 */
export function makeProvince(): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-mcp-"));
  targets.push(target);
  mkdirSync(join(target, "src"), { recursive: true });
  writeFileSync(
    join(target, "src", "cart.ts"),
    [
      "// A small cart service used by MCP server tests.",
      "",
      "/** CartService is the symbol under survey. */",
      "export class CartService {",
      "  items: string[] = [];",
      "",
      "  addItem(item: string): void {",
      "    this.items.push(item);",
      "  }",
      "}",
    ].join("\n") + "\n",
  );
  writeFileSync(
    join(target, "src", "checkout.ts"),
    [
      'import { CartService } from "./cart";',
      "",
      "export function checkout(cart: CartService): number {",
      "  return cart.items.length;",
      "}",
    ].join("\n") + "\n",
  );
  for (const manifest of [
    "go.mod",
    "pom.xml",
    "package.json",
    "Cargo.toml",
    "pubspec.yaml",
  ]) {
    writeFileSync(
      join(target, manifest),
      readFileSync(join(manifestFixtures, manifest), "utf8"),
    );
  }
  writeFileSync(join(target, "README.md"), "# province\n\nCartService lives in src/cart.ts.\n");
  return target;
}

/** The full parent environment, optionally with extra PATH entries prepended. */
export function childEnv(...pathPrefixes: string[]): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) env[key] = value;
  }
  if (pathPrefixes.length > 0) {
    env.PATH = `${pathPrefixes.join(":")}:${env.PATH ?? ""}`;
  }
  return env;
}

/**
 * An environment whose PATH contains ripgrep but provably no ctags: a temp
 * bin directory holding only an rg symlink. The machine running the suite
 * has no ctags, but this makes the missing-binary path deterministic
 * regardless of where the suite runs.
 */
export function envWithoutCtags(): Record<string, string> | undefined {
  const rg = findBinary("rg");
  if (rg === undefined) return undefined;
  const bin = mkdtempSync(join(tmpdir(), "portolan-mcp-bin-"));
  targets.push(bin);
  symlinkSync(rg, join(bin, "rg"));
  return childEnv(bin);
}

/** An environment with the ctags test double on PATH (rg inherited). */
export function envWithCtagsDouble(): Record<string, string> {
  return childEnv(fixturesBin);
}

/** Launch the real server entry point and run `fn` with a connected client. */
export async function withServer(
  options: {
    targetRoot: string;
    /** Exact launch vector; defaults to `bun main.ts --target <root>`. */
    command?: { command: string; args: string[] };
    /** Child environment; defaults to the parent env. PATH-sensitive tests override. */
    env?: Record<string, string>;
    name?: string;
  },
  fn: (client: Client) => Promise<void>,
): Promise<void> {
  const targetRoot = options.targetRoot;
  const launch =
    options.command ?? { command: process.execPath, args: [SERVER_ENTRY, "--target", targetRoot] };
  const client = new Client(
    { name: options.name ?? "portolan-tests", version: "0.0.0" },
    { capabilities: {} },
  );
  const transport = new StdioClientTransport({
    command: launch.command,
    args: launch.args,
    env: options.env ?? childEnv(),
    stderr: "pipe",
  });
  try {
    await client.connect(transport);
    await fn(client);
  } finally {
    await client.close();
  }
}

/** The structured content of a successful call, as the tool produced it. */
export function structuredOf(result: Record<string, unknown>): unknown {
  expect(result.structuredContent).toBeObject();
  return result.structuredContent;
}

/** Assert a call came back as a tool error and return its verbatim message. */
export function errorTextOf(result: Record<string, unknown>): string {
  expect(result.isError).toBe(true);
  const content = result.content as Array<{ type: string; text?: string }>;
  expect(content.length).toBeGreaterThan(0);
  return content.map((part) => part.text ?? "").join("\n");
}
