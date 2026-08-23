import { test, expect, afterEach } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findBinary, MissingBinaryError } from "./shared";
import { symbols } from "./symbols";

const targets: string[] = [];
afterEach(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

const fixturesBin = join(import.meta.dir, "..", "..", "test", "fixtures", "bin");

/** ctags is not installed on this machine; tests put the double on PATH. */
const doubleEnv = (): Record<string, string | undefined> => ({
  ...process.env,
  PATH: `${fixturesBin}:${process.env.PATH ?? ""}`,
});

function makeTarget(): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-symbols-"));
  targets.push(target);
  mkdirSync(join(target, "src"), { recursive: true });
  writeFileSync(
    join(target, "src", "cart.ts"),
    [
      "// A small cart service used by probe-tool tests.",
      "",
      "/** CartService is the symbol under survey. */",
      "export class CartService {",
      "  items: string[] = [];",
      "",
      "  /** addItem records one item. */",
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
      "// checkout collaborates with the CartService.",
      "export function checkout(cart: CartService): number {",
      "  return cart.items.length;",
      "}",
    ].join("\n") + "\n",
  );
  writeFileSync(
    join(target, "src", "main.ts"),
    [
      "// entry",
      "export function run(): void {}",
      "",
      "// run() is mentioned here but run is too short to corroborate.",
    ].join("\n") + "\n",
  );
  return target;
}

test("definition lookup is anchored and measured", () => {
  const target = makeTarget();
  const result = symbols(target, "CartService", { env: doubleEnv() });

  expect(result.trust).toBe("measured");
  expect(result.name).toBe("CartService");
  expect(result.definitions.length).toBe(1);
  const def = result.definitions[0]!;
  expect(def.kind).toBe("class");
  expect(def.path).toBe("src/cart.ts");
  expect(def.line).toBe(4);
  expect(def.anchor).toEqual({ type: "file", path: "src/cart.ts", line: 4 });
});

test("an unknown symbol is an honest empty result, not an error", () => {
  const target = makeTarget();
  const result = symbols(target, "NoSuchSymbolAnywhere", { env: doubleEnv() });
  expect(result.definitions).toEqual([]);
  expect(result.trust).toBe("measured");
});

test("resolvable references are swept occurrences, definitions excluded", () => {
  const target = makeTarget();
  const result = symbols(target, "CartService", {
    references: true,
    env: doubleEnv(),
  });

  expect(result.references).toBeDefined();
  expect(result.references!.resolvable).toBe(true);
  const items = (result.references as { items: Array<{ path: string; line: number }> }).items;
  const sites = items.map((r) => `${r.path}:${r.line}`);

  // Occurrences in checkout.ts and the doc comment in cart.ts...
  expect(sites).toContain("src/checkout.ts:1");
  expect(sites).toContain("src/checkout.ts:3");
  expect(sites).toContain("src/checkout.ts:4");
  expect(sites).toContain("src/cart.ts:3");
  // ...never the definition site itself, and nothing guessed.
  expect(sites).not.toContain("src/cart.ts:4");
});

test("unresolvable references are reported absent, never guessed", () => {
  const target = makeTarget();
  // "run" exists (the double defines it) but is too short to corroborate.
  const result = symbols(target, "run", { references: true, env: doubleEnv() });

  expect(result.definitions.length).toBe(1);
  expect(result.references).toBeDefined();
  const refs = result.references as { resolvable: boolean; reason?: string; items?: unknown[] };
  expect(refs.resolvable).toBe(false);
  expect(refs.reason).toContain("not resolvable");
  expect(refs.items).toBeUndefined();
});

test("missing ctags errors clearly with no symbol results", () => {
  const target = makeTarget();
  const emptyPath = mkdtempSync(join(tmpdir(), "portolan-no-ctags-"));
  targets.push(emptyPath);
  let err: unknown;
  try {
    symbols(target, "CartService", { env: { PATH: emptyPath } });
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(MissingBinaryError);
  const missing = err as MissingBinaryError;
  expect(missing.binary).toBe("ctags");
  expect(missing.message).toContain("no results were gathered");
});

// On this machine ctags is genuinely absent, so this also runs against
// reality; elsewhere it keeps the honest path covered via the empty PATH.
test.skipIf(findBinary("ctags") !== undefined)(
  "the real PATH on this machine has no ctags — same honest error",
  () => {
    const target = makeTarget();
    let err: unknown;
    try {
      symbols(target, "CartService");
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(MissingBinaryError);
    expect((err as MissingBinaryError).binary).toBe("ctags");
  },
);

test.skipIf(findBinary("rg") === undefined)(
  "references need ripgrep: missing rg is an error even with ctags present",
  () => {
    const target = makeTarget();
    // ctags (the double) is reachable, rg is not.
    let err: unknown;
    try {
      symbols(target, "CartService", { references: true, env: { PATH: fixturesBin } });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(MissingBinaryError);
    expect((err as MissingBinaryError).binary).toBe("rg");
  },
);
