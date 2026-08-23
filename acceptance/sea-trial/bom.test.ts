/**
 * Narrow BOM reader tests (sea-trial tasks.md 1.2): the planted entries of
 * a real-shaped fixture come back out, and unrecognized structure fails
 * loudly instead of half-parsing.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { BomError, bomDependencyPairs, readBom } from "./bom";

const FIXTURE = join(import.meta.dir, "fixtures", "bigtop.bom");

function writeTempBom(name: string, text: string): string {
  const dir = join(tmpdir(), `portolan-sea-trial-bom-${crypto.randomUUID()}`);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, name);
  writeFileSync(path, text);
  return path;
}

describe("readBom extracts the planted entries", () => {
  test("components with pinned versions, including bigtop.version refs", () => {
    const bom = readBom(FIXTURE);
    expect(bom.bigtopVersion).toBe("3.7.0-SNAPSHOT");
    const byLabel = new Map(bom.components.map((c) => [c.label, c]));
    expect(byLabel.get("zookeeper")).toMatchObject({ name: "zookeeper", versionBase: "3.8.4" });
    expect(byLabel.get("hadoop")).toMatchObject({ name: "hadoop", versionBase: "3.4.3" });
    expect(byLabel.get("solr")).toMatchObject({ name: "solr", versionBase: "8.11.4" });
    expect(byLabel.get("spark")).toMatchObject({ name: "spark", versionBase: "3.5.6" });
    // bigtop.version references resolve; pkg = base-"-SNAPSHOT" stays skipped.
    expect(byLabel.get("bigtop-utils")?.versionBase).toBe("3.7.0-SNAPSHOT");
    expect(byLabel.get("bigtop-select")?.versionBase).toBe("3.7.0-SNAPSHOT");
    expect(bom.components.length).toBe(10);
  });

  test("the dependency map and its fairway pairs", () => {
    const bom = readBom(FIXTURE);
    const zookeeper = bom.dependencyMap.find((d) => d.dependency === "zookeeper");
    expect(zookeeper?.dependents).toEqual(["hadoop", "hbase", "kafka"]);
    const hadoop = bom.dependencyMap.find((d) => d.dependency === "hadoop");
    expect(hadoop?.dependents).toEqual(["hbase", "hive", "tez", "solr", "spark", "ranger", "phoenix", "alluxio", "zeppelin"]);
    const pairs = bomDependencyPairs(bom);
    expect(pairs).toContainEqual({ dependent: "spark", dependency: "hadoop" });
    expect(pairs).toContainEqual({ dependent: "flink", dependency: "bigtop-utils" });
    expect(pairs).toContainEqual({ dependent: "zeppelin", dependency: "hive" });
    // 'bigtop-utils' has a multi-line dependents list — all entries survive.
    expect(pairs).toContainEqual({ dependent: "bigtop-jsvc", dependency: "bigtop-utils" });
    expect(pairs).toContainEqual({ dependent: "zookeeper", dependency: "bigtop-utils" });
  });

  test("comments, URLs and closure expressions do not derail the reader", () => {
    const bom = readBom(FIXTURE);
    // The DSL doc block (with braces and an https URL) is gone as a comment;
    // the closure in base_version and the stack block were skipped whole.
    expect(bom.components.map((c) => c.label)).not.toContain("jdk");
    expect(bom.dependencyMap.map((d) => d.dependency)).not.toContain("scala");
    // apache { APACHE_MIRROR = "https://..." } was skipped, not parsed as deps.
    expect(bom.dependencyMap.length).toBe(8);
  });
});

describe("readBom fails loudly on unrecognized structure", () => {
  test("a file that does not open with the bigtop block", () => {
    const path = writeTempBom("broken.bom", "definitely { not { a bom\n");
    expect(() => readBom(path)).toThrow(BomError);
    expect(() => readBom(path)).toThrow(/bigtop/);
  });

  test("a component without a name", () => {
    const path = writeTempBom(
      "noname.bom",
      `bigtop {
  version = "1.0.0"
  components {
    'ghost' {
      version { base = '1.2.3'; release = 1 }
    }
  }
}
`,
    );
    expect(() => readBom(path)).toThrow(/ghost.*no name/);
  });

  test("a component without a resolvable version base", () => {
    const path = writeTempBom(
      "noversion.bom",
      `bigtop {
  components {
    'hadoop' {
      name = 'hadoop'
      tarball { destination = "x.tar.gz" }
    }
  }
}
`,
    );
    expect(() => readBom(path)).toThrow(/hadoop.*version/);
  });

  test("an unrecognized version.base expression", () => {
    const path = writeTempBom(
      "weirdversion.bom",
      `bigtop {
  components {
    'hadoop' {
      name = 'hadoop'
      version { base = computeVersion(someFlag); release = 1 }
    }
  }
}
`,
    );
    expect(() => readBom(path)).toThrow(/unrecognized version\.base/);
  });

  test("a dependencies value that is not a list of dependents", () => {
    const path = writeTempBom(
      "baddeps.bom",
      `bigtop {
  dependencies = [ hadoop: 42 ]
  components {
    'hadoop' { name = 'hadoop' version { base = '3.0.0' } }
  }
}
`,
    );
    expect(() => readBom(path)).toThrow(BomError);
  });

  test("a missing file", () => {
    expect(() => readBom("/nonexistent/bigtop.bom")).toThrow();
  });
});
