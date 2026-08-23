/**
 * Corpus location and the no-fixture-shortcut guard (sea-trial tasks.md 1.1):
 * component roots resolve by shape, and a reduced stand-in corpus is
 * refused with a clear error. The full-run smoke (entry point + answers
 * path) lives in trial.test.ts / run.test.ts.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readBom } from "./bom";
import {
  CorpusRefusalError,
  MIN_BOM_COMPONENTS,
  MIN_COMPONENT_SOURCE_ROOTS,
  assertRealCorpus,
  findBomPath,
  findComponentRoots,
} from "./corpus";

const FIXTURE = join(import.meta.dir, "fixtures", "bigtop.bom");

function tempDir(): string {
  return join(tmpdir(), `portolan-sea-trial-corpus-${crypto.randomUUID()}`);
}

/** A landscape-shaped temp corpus with the fixture BOM and per-label roots. */
function makeCorpus(labels: string[], bomText = readFileSync(FIXTURE, "utf8")): string {
  const root = tempDir();
  const bomDir = join(root, "repos", "apache-bigtop-repo");
  mkdirSync(bomDir, { recursive: true });
  writeFileSync(join(bomDir, "bigtop.bom"), bomText);
  for (const label of labels) {
    const dir = join(root, "repos", `apache-${label}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "README.md"), `# ${label}\n`);
  }
  return root;
}

describe("findBomPath", () => {
  test("locates the shallowest bigtop.bom under the checkout", () => {
    const root = makeCorpus(["hadoop"]);
    expect(findBomPath(root)).toBe(join(root, "repos", "apache-bigtop-repo", "bigtop.bom"));
  });

  test("a checkout without a bigtop.bom is a clear refusal", () => {
    const root = tempDir();
    mkdirSync(join(root, "repos"), { recursive: true });
    expect(() => findBomPath(root)).toThrow(CorpusRefusalError);
    expect(() => findBomPath(root)).toThrow(/no bigtop\.bom found/);
  });
});

describe("findComponentRoots", () => {
  test("maps BOM labels to their apache-<label> source trees", () => {
    const root = makeCorpus(["hadoop", "spark", "solr", "zookeeper"]);
    const bom = readBom(join(root, "repos", "apache-bigtop-repo", "bigtop.bom"));
    const roots = findComponentRoots(root, bom);
    expect(roots.get("hadoop")).toBe("repos/apache-hadoop");
    expect(roots.get("spark")).toBe("repos/apache-spark");
    expect(roots.get("bigtop-utils")).toBeUndefined(); // no top-level repo — honest
  });
});

describe("assertRealCorpus (the no-fixture-shortcut guard)", () => {
  test("accepts a full-shape corpus and attests its shape", () => {
    // Labels that exist in the fixture BOM's components section.
    const labels = [
      "hadoop",
      "hbase",
      "hive",
      "solr",
      "spark",
      "zookeeper",
      "bigtop-groovy",
      "bigtop-utils",
      "bigtop-select",
      "bigtop-jsvc",
    ];
    const root = makeCorpus(labels);
    const bom = readBom(findBomPath(root));
    const roots = findComponentRoots(root, bom);
    const shape = assertRealCorpus(root, bom, roots);
    expect(shape.attestation).toMatch(/verified real-shape/);
    expect(shape.componentRoots.size).toBeGreaterThanOrEqual(MIN_COMPONENT_SOURCE_ROOTS);
  });

  test("refuses a reduced stand-in: too few source trees", () => {
    const root = makeCorpus(["hadoop", "spark"]);
    const bom = readBom(findBomPath(root));
    const roots = findComponentRoots(root, bom);
    expect(() => assertRealCorpus(root, bom, roots)).toThrow(CorpusRefusalError);
    expect(() => assertRealCorpus(root, bom, roots)).toThrow(
      /reduced stand-in corpus.*2 component source tree\(s\)/,
    );
  });

  test("refuses a reduced stand-in: too few pinned BOM components", () => {
    const tinyBom = `bigtop {
  version = "1.0.0"
  dependencies = [ hadoop:['spark'] ]
  components {
    'hadoop' { name = 'hadoop'; version { base = '3.0.0' } }
    'spark' { name = 'spark'; version { base = '3.0.0' } }
  }
}
`;
    const root = makeCorpus(["hadoop", "spark"], tinyBom);
    const bom = readBom(findBomPath(root));
    const roots = findComponentRoots(root, bom);
    expect(() => assertRealCorpus(root, bom, roots)).toThrow(
      new RegExp(`only 2 pinned BOM component\\(s\\) \\(minimum ${MIN_BOM_COMPONENTS}\\)`),
    );
  });
});
