/**
 * Oracle + grading tests (sea-trial tasks.md 2.2–2.3): machine-checked
 * questions are graded against expectations derived from the checkout's
 * own files — a matching answer passes, a mismatching one fails with the
 * expectation named; expert-judged questions are recorded with anchors
 * and trust label for the Governor, never machine-graded.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readBom, type Bom } from "./bom";
import { deriveHadoopManifestDependents } from "./oracle";
import { gradeAnswers } from "./grading";
import { loadAnswers, type LoadedAnswers } from "./answers";

const FIXTURE = join(import.meta.dir, "fixtures", "bigtop.bom");

function answersOf(lines: unknown[]): LoadedAnswers {
  const dir = join(tmpdir(), `portolan-sea-trial-grading-${crypto.randomUUID()}`);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "answers.jsonl");
  writeFileSync(path, lines.map((l) => JSON.stringify(l)).join("\n") + "\n");
  return loadAnswers(path);
}

const ANCHOR = { type: "file", path: "repos/apache-bigtop-repo/bigtop.bom" } as const;

function allFixtureClaims(): Record<string, string> {
  const bom = readBom(FIXTURE);
  return Object.fromEntries(bom.components.map((c) => [c.label, c.versionBase]));
}

/** A small corpus with two hadoop-declaring components and one without. */
function makeManifestCorpus(): { root: string; bom: Bom } {
  const root = join(tmpdir(), `portolan-sea-trial-oracle-${crypto.randomUUID()}`);
  const bomText = readFileSync(FIXTURE, "utf8");
  mkdirSync(join(root, "repos", "apache-bigtop-repo"), { recursive: true });
  writeFileSync(join(root, "repos", "apache-bigtop-repo", "bigtop.bom"), bomText);
  for (const label of ["hadoop", "hbase", "hive", "spark"]) {
    mkdirSync(join(root, "repos", `apache-${label}`), { recursive: true });
  }
  writeFileSync(
    join(root, "repos", "apache-hbase", "pom.xml"),
    `<?xml version="1.0"?>
<project>
  <artifactId>hbase</artifactId>
  <dependencies>
    <dependency><artifactId>hadoop-common</artifactId><version>3.4.3</version></dependency>
  </dependencies>
</project>
`,
  );
  writeFileSync(
    join(root, "repos", "apache-hive", "pom.xml"),
    `<?xml version="1.0"?>
<project>
  <artifactId>hive</artifactId>
  <dependencies>
    <dependency><artifactId>hadoop-hdfs</artifactId></dependency>
    <dependency><artifactId>parquet-column</artifactId></dependency>
  </dependencies>
</project>
`,
  );
  writeFileSync(
    join(root, "repos", "apache-spark", "pom.xml"),
    `<?xml version="1.0"?>
<project>
  <artifactId>spark</artifactId>
  <dependencies>
    <dependency><artifactId>scala-library</artifactId></dependency>
  </dependencies>
</project>
`,
  );
  return { root, bom: readBom(join(root, "repos", "apache-bigtop-repo", "bigtop.bom")) };
}

describe("deriveHadoopManifestDependents (the derived oracle)", () => {
  test("derives the dependents from the checkout's own manifests", () => {
    const { root, bom } = makeManifestCorpus();
    const derivation = deriveHadoopManifestDependents(root, bom, new Map([
      ["hbase", "repos/apache-hbase"],
      ["hive", "repos/apache-hive"],
      ["spark", "repos/apache-spark"],
    ]));
    expect(derivation.dependents).toEqual(["hbase", "hive"]);
    const hbase = derivation.perComponent.find((c) => c.label === "hbase")!;
    expect(hbase.evidence).toEqual(["repos/apache-hbase/pom.xml#project.dependencies.hadoop-common"]);
    expect(derivation.manifestsRead).toBe(3);
  });

  test("an unparseable manifest is a reported caveat, never hidden", () => {
    const { root, bom } = makeManifestCorpus();
    writeFileSync(join(root, "repos", "apache-spark", "pom.xml"), "<project><unclosed>");
    const derivation = deriveHadoopManifestDependents(root, bom, new Map([
      ["spark", "repos/apache-spark"],
    ]));
    expect(derivation.caveats.length).toBe(1);
    expect(derivation.caveats[0]!.path).toBe("repos/apache-spark/pom.xml");
  });
});

describe("machine grading — Q1 (BOM side)", () => {
  const bom = readBom(FIXTURE);
  const derivation = deriveHadoopManifestDependents("/nonexistent", bom, new Map());

  test("a matching answer passes", () => {
    const loaded = answersOf([
      { qid: "Q1", text: "all ten", anchors: [ANCHOR], trust: "charted", claims: allFixtureClaims() },
    ]);
    const grade = gradeAnswers(bom, derivation, loaded).grades.find((g) => g.qid === "Q1")!;
    expect(grade.outcome).toBe("pass");
  });

  test("a wrong version fails naming the expectation", () => {
    const claims = allFixtureClaims();
    claims.zookeeper = "3.9.0";
    const loaded = answersOf([
      { qid: "Q1", text: "all ten", anchors: [ANCHOR], trust: "charted", claims },
    ]);
    const grade = gradeAnswers(bom, derivation, loaded).grades.find((g) => g.qid === "Q1")!;
    expect(grade.outcome).toBe("fail");
    expect(grade.detail).toBe("expected zookeeper 3.8.4, got 3.9.0");
    expect(grade.expectation).toMatch(/zookeeper 3\.8\.4/);
  });

  test("a missing component and an invented one are both named", () => {
    const claims = allFixtureClaims();
    delete claims.solr;
    claims.oozie = "5.0.0";
    const loaded = answersOf([
      { qid: "Q1", text: "mostly all", anchors: [ANCHOR], trust: "charted", claims },
    ]);
    const grade = gradeAnswers(bom, derivation, loaded).grades.find((g) => g.qid === "Q1")!;
    expect(grade.outcome).toBe("fail");
    expect(grade.detail).toContain("missing solr (8.11.4)");
    expect(grade.detail).toContain('"oozie" is not a component pinned by bigtop.bom');
  });

  test("claims absent on a machine-checked question is a failure, not a pass", () => {
    const loaded = answersOf([
      { qid: "Q1", text: "see text", anchors: [ANCHOR], trust: "charted" },
    ]);
    const grade = gradeAnswers(bom, derivation, loaded).grades.find((g) => g.qid === "Q1")!;
    expect(grade.outcome).toBe("fail");
    expect(grade.expectation).toMatch(/components pinned by bigtop\.bom/);
  });
});

describe("machine grading — Q3 (manifest side)", () => {
  test("a matching manifest-side answer passes", () => {
    const { root, bom } = makeManifestCorpus();
    const derivation = deriveHadoopManifestDependents(root, bom, new Map([
      ["hbase", "repos/apache-hbase"],
      ["hive", "repos/apache-hive"],
      ["spark", "repos/apache-spark"],
    ]));
    const loaded = answersOf([
      {
        qid: "Q3",
        text: "hbase and hive declare hadoop in their poms",
        anchors: [ANCHOR],
        trust: "charted",
        claims: { hbase: "manifest", hive: "manifest", spark: "import" },
      },
    ]);
    const grade = gradeAnswers(bom, derivation, loaded).grades.find((g) => g.qid === "Q3")!;
    expect(grade.outcome).toBe("pass");
    expect(grade.expectation).toMatch(/hbase, hive/);
  });

  test("a mismatching answer fails naming the derived expectation", () => {
    const { root, bom } = makeManifestCorpus();
    const derivation = deriveHadoopManifestDependents(root, bom, new Map([
      ["hbase", "repos/apache-hbase"],
      ["hive", "repos/apache-hive"],
      ["spark", "repos/apache-spark"],
    ]));
    const loaded = answersOf([
      {
        qid: "Q3",
        text: "spark declares hadoop",
        anchors: [ANCHOR],
        trust: "charted",
        claims: { hbase: "manifest", spark: "manifest" },
      },
    ]);
    const result = gradeAnswers(bom, derivation, loaded);
    const grade = result.grades.find((g) => g.qid === "Q3")!;
    expect(grade.outcome).toBe("fail");
    expect(grade.detail).toContain("expected hive to be claimed via manifest (it declares hadoop)");
    expect(grade.detail).toContain('no hadoop declaration found in "spark"');
    expect(result.machineFailures.map((f) => f.qid)).toEqual(["Q3"]);
  });
});

describe("expert-judged questions are recorded, not graded (task 2.3)", () => {
  const bom = readBom(FIXTURE);
  const derivation = deriveHadoopManifestDependents("/nonexistent", bom, new Map());

  test("Q4 is recorded for the Governor with anchors and trust label", () => {
    const loaded = answersOf([
      {
        qid: "Q4",
        text: "Both are distributed compute engines; Spark batches, Flink streams.",
        anchors: [{ type: "file", path: "repos/apache-spark/README.md" }],
        trust: "reported",
      },
    ]);
    const grade = gradeAnswers(bom, derivation, loaded).grades.find((g) => g.qid === "Q4")!;
    expect(grade.mode).toBe("expert");
    expect(grade.outcome).toBe("deferred");
    expect(grade.anchors).toEqual([{ type: "file", path: "repos/apache-spark/README.md" }]);
    expect(grade.trust).toBe("reported");
    expect(grade.detail).toMatch(/Governor/);
  });

  test("an expert answer without an anchor grades unanswered and counts against the trial", () => {
    const loaded = answersOf([
      { qid: "Q4", text: "Both compute.", trust: "reported" },
    ]);
    const result = gradeAnswers(bom, derivation, loaded);
    const grade = result.grades.find((g) => g.qid === "Q4")!;
    expect(grade.outcome).toBe("unanswered");
    expect(result.unanswered.map((u) => u.qid)).toContain("Q4");
  });

  test("every question without an answer line grades unanswered", () => {
    const loaded = answersOf([]);
    const result = gradeAnswers(bom, derivation, loaded);
    expect(result.unanswered.length).toBe(12);
    expect(result.grades.length).toBe(12);
  });
});
