import { test, expect, afterEach } from "bun:test";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { findBinary } from "./shared";
import { sweep } from "./sweep";
import { symbols } from "./symbols";
import { readManifest, type ManifestReadResult } from "./manifests";
import { appendReceipt, readReceipt } from "./log";

/** The guard under test, local to the tests: production carries no caller. */
function requireTrustLabel(
  labeled: { trust?: unknown },
  expected: string,
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

const targets: string[] = [];
afterEach(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

const fixturesBin = join(import.meta.dir, "..", "..", "test", "fixtures", "bin");
const manifestFixtures = join(import.meta.dir, "..", "..", "test", "fixtures", "manifests");

/** ctags is not installed on this machine; the double stands in on PATH. */
const doubleEnv = (): Record<string, string | undefined> => ({
  ...process.env,
  PATH: `${fixturesBin}:${process.env.PATH ?? ""}`,
});

function makeProbeTarget(): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-perimeter-"));
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

/** Snapshot the whole tree: relative path → content hash. */
function snapshotTree(root: string): Map<string, string> {
  const snap = new Map<string, string>();
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
        continue;
      }
      if (!entry.isFile()) continue;
      const rel = relative(root, abs);
      snap.set(rel, createHash("sha256").update(readFileSync(abs)).digest("hex"));
    }
  };
  walk(root);
  return snap;
}

const rgPresent = findBinary("rg") !== undefined;

test.skipIf(!rgPresent)(
  "a full probe battery leaves the source untouched; only the log is written",
  () => {
    const target = makeProbeTarget();
    const before = snapshotTree(target);
    expect(before.size).toBe(8); // 2 sources + 5 manifests + README
    expect(before.has("README.md")).toBe(true);

    // The battery: sweeps (plain, with context, no-match), symbol lookups
    // (definitions and references), and every manifest read.
    const env = doubleEnv();
    const plain = sweep(target, "CartService");
    expect(plain.chunks.length).toBeGreaterThan(0);
    const withContext = sweep(target, "import", { context: 2 });
    expect(withContext.chunks.length).toBeGreaterThan(0);
    expect(sweep(target, "NOWHERE_TO_BE_FOUND").chunks).toEqual([]);

    const defs = symbols(target, "CartService", { env });
    expect(defs.definitions.length).toBe(1);
    const refs = symbols(target, "CartService", { references: true, env });
    expect(refs.references?.resolvable).toBe(true);

    const manifestResults = ["go.mod", "pom.xml", "package.json", "Cargo.toml", "pubspec.yaml"].map(
      (m) => readManifest(target, m),
    );
    for (const result of manifestResults) {
      if ("supported" in result) throw new Error(`unexpected unsupported report for ${result.path}`);
      expect(result.facts.length).toBeGreaterThan(0);
    }

    // Nothing outside <target>/.portolan/ was created or modified.
    const afterProbes = snapshotTree(target);
    expect(afterProbes).toEqual(before);

    // The sanctioned write: appending to the ship's log under .portolan/.
    appendReceipt(target, { command: "sweep pattern=CartService", outcome: "ok" });
    appendReceipt(target, { command: "symbols name=CartService", outcome: "ok" });
    expect(readReceipt(target, "r2")!.command).toBe("symbols name=CartService");

    const afterLog = snapshotTree(target);
    const changed = new Set(
      [...afterLog.keys()].filter((k) => afterLog.get(k) !== before.get(k)),
    );
    expect(changed).toEqual(new Set([".portolan/log.jsonl"]));
  },
);

test.skipIf(!rgPresent)(
  "cross-tool labels: sweeps and symbols are measured, manifest facts are charted",
  () => {
    const target = makeProbeTarget();
    const env = doubleEnv();

    const sweepResult = sweep(target, "CartService");
    requireTrustLabel(sweepResult, "measured", "sweep result");
    for (const chunk of sweepResult.chunks) {
      expect(chunk.anchor.type).toBe("file");
    }

    const symbolResult = symbols(target, "CartService", { env });
    requireTrustLabel(symbolResult, "measured", "symbols result");
    for (const def of symbolResult.definitions) {
      expect(def.anchor.type).toBe("file");
    }

    const manifestResult = readManifest(target, "Cargo.toml") as ManifestReadResult;
    for (const fact of manifestResult.facts) {
      requireTrustLabel(fact, "charted", `manifest fact ${fact.key}`);
      expect(fact.anchor.type).toBe("manifest");
    }

    // The labels are load-bearing: strip one and the guard fails loudly.
    const strippedSweep: { trust?: "measured"; pattern: string } = { ...sweepResult };
    delete strippedSweep.trust;
    expect(() => requireTrustLabel(strippedSweep, "measured", "sweep result")).toThrow(
      /no label at all/,
    );

    const strippedFact = { ...manifestResult.facts[0]! };
    delete (strippedFact as { trust?: string }).trust;
    expect(() => requireTrustLabel(strippedFact, "charted", "manifest fact")).toThrow(
      /no label at all/,
    );
  },
);
