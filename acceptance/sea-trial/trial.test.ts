/**
 * Trial-level tests (sea-trial tasks.md 1.1 smoke, 5.1–5.3): the fixed
 * gate tree FAILs on each enumerated cause and passes only when every
 * gate and the Governor's verdict pass; the Governor's read records the
 * entered verdict verbatim as the final gate line; a completed run
 * leaves a report containing every section. Fixture runs go through
 * `executeTrial` with an UNVERIFIED corpus attestation — a fixture can
 * never pose as a passing real trial (the public `runSeaTrial` refuses
 * reduced stand-ins; see corpus.test.ts and run.test.ts).
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readChart, writeChart, type ChartEntry } from "../../core/src/index";
import { readBom, type Bom } from "./bom";
import { deriveHadoopManifestDependents, type ManifestDerivation } from "./oracle";
import { loadAnswers } from "./answers";
import {
  executeTrial,
  isPositiveVerdict,
  runSeaTrial,
  type TrialResult,
} from "./trial";

const FIXTURE = join(import.meta.dir, "fixtures", "bigtop.bom");
const UNVERIFIED = "UNVERIFIED — unit-test execution (fixture inputs; runSeaTrial refuses stand-ins)";

/** A charted, fixture corpus target: BOM, component poms, four vessels. */
function makeTarget(): { root: string; bom: Bom } {
  const root = join(tmpdir(), `portolan-sea-trial-trial-${crypto.randomUUID()}`);
  mkdirSync(join(root, "repos", "apache-bigtop-repo"), { recursive: true });
  writeFileSync(join(root, "repos", "apache-bigtop-repo", "bigtop.bom"), readFileSync(FIXTURE, "utf8"));
  mkdirSync(join(root, "repos", "alpha"), { recursive: true });
  writeFileSync(join(root, "repos", "alpha", "Main.java"), "class Main {}\n");
  mkdirSync(join(root, "repos", "apache-hadoop"), { recursive: true });
  writeFileSync(join(root, "repos", "apache-hadoop", "pom.xml"), "<project><artifactId>hadoop</artifactId></project>\n");
  mkdirSync(join(root, "repos", "apache-spark"), { recursive: true });
  writeFileSync(
    join(root, "repos", "apache-spark", "pom.xml"),
    `<project>
  <artifactId>spark</artifactId>
  <dependencies><dependency><artifactId>hadoop-common</artifactId></dependency></dependencies>
</project>
`,
  );
  mkdirSync(join(root, "repos", "apache-solr"), { recursive: true });
  writeFileSync(join(root, "repos", "apache-solr", "pom.xml"), "<project><artifactId>solr</artifactId></project>\n");

  const anchor = (path: string) => ({ type: "file", path }) as const;
  const entries: ChartEntry[] = [
    { kind: "vessel", id: "alpha", name: "alpha", paths: ["repos/alpha"], anchors: [anchor("repos/alpha/Main.java")], trust: "measured" },
    { kind: "vessel", id: "hadoop", name: "hadoop", paths: ["repos/apache-hadoop"], anchors: [anchor("repos/apache-hadoop/pom.xml")], trust: "charted" },
    { kind: "vessel", id: "spark", name: "spark", paths: ["repos/apache-spark"], anchors: [anchor("repos/apache-spark/pom.xml")], trust: "charted" },
    { kind: "vessel", id: "solr", name: "solr", paths: ["repos/apache-solr"], anchors: [anchor("repos/apache-solr/pom.xml")], trust: "charted" },
  ];
  writeChart(root, entries);
  return { root, bom: readBom(join(root, "repos", "apache-bigtop-repo", "bigtop.bom")) };
}

function writeAnswers(root: string, lines: unknown[]): string {
  const dir = join(root, ".portolan", "sea-trial");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "answers.jsonl");
  writeFileSync(path, lines.map((l) => JSON.stringify(l)).join("\n") + "\n");
  return path;
}

/** The full honest answer set for the fixture target. */
function honestAnswers(bom: Bom, overrides: Record<string, unknown> = {}): unknown[] {
  const a = (path: string) => ({ type: "file", path }) as const;
  const claims = Object.fromEntries(bom.components.map((c) => [c.label, c.versionBase]));
  const base: Record<string, unknown> = {
    Q1: { qid: "Q1", text: "Ten components pinned by the BOM.", anchors: [a("repos/apache-bigtop-repo/bigtop.bom")], trust: "charted", claims },
    Q2: { qid: "Q2", text: "No attic components in this fixture province.", anchors: [a("repos/apache-bigtop-repo/bigtop.bom")], trust: "charted" },
    Q3: { qid: "Q3", text: "spark declares hadoop in its pom.", anchors: [a("repos/apache-spark/pom.xml")], trust: "charted", claims: { spark: "manifest" } },
    Q4: { qid: "Q4", text: "Out of scope for the fixture.", anchors: [a("repos/alpha/Main.java")], trust: "reported" },
    Q5: { qid: "Q5", text: "Fixture Solr does not cite ZooKeeper.", anchors: [a("repos/apache-solr/pom.xml")], trust: "charted" },
    Q6: { qid: "Q6", text: "No drift observed in the fixture.", anchors: [a("repos/apache-spark/pom.xml")], trust: "reported" },
    Q7: { qid: "Q7", text: "Fixtures are packaged by mkdirSync.", anchors: [a("repos/apache-spark/pom.xml")], trust: "reported" },
    Q8: { qid: "Q8", text: "No smoke tests in the fixture.", anchors: [a("repos/alpha/Main.java")], trust: "reported" },
    Q9: { qid: "Q9", text: "The fixture declares no env vars or ports.", anchors: [a("repos/apache-hadoop/pom.xml")], trust: "reported" },
    Q10: { qid: "Q10", text: "No HTTP surfaces in the fixture.", anchors: [a("repos/apache-solr/pom.xml")], trust: "charted" },
    Q11: { qid: "Q11", text: "Fixture dangers: none worth naming.", anchors: [a("repos/alpha/Main.java")], trust: "reported" },
    Q12: { qid: "Q12", text: "The expedition could not statically determine the real runtime topology or the actual deployed versions.", anchors: [a("repos/apache-bigtop-repo/bigtop.bom")], trust: "unsurveyed" },
    ...overrides,
  };
  return Object.values(base);
}

function derivationFor(root: string, bom: Bom): ManifestDerivation {
  return deriveHadoopManifestDependents(root, bom, new Map([
    ["hadoop", "repos/apache-hadoop"],
    ["spark", "repos/apache-spark"],
    ["solr", "repos/apache-solr"],
  ]));
}

/** Strip the index metadata so charted entries can be re-written. */
function asChartEntries(root: string): ChartEntry[] {
  return readChart(root).map((entry) => {
    const { stale: _stale, signature: _signature, ...plain } = entry;
    return plain as ChartEntry;
  });
}

async function runFixture(
  overrides: Record<string, unknown>,
  verdict: string,
  extraChart: ChartEntry[] = [],
): Promise<TrialResult> {
  const { root, bom } = makeTarget();
  if (extraChart.length > 0) {
    writeChart(root, [...asChartEntries(root), ...extraChart]);
  }
  const answersPath = writeAnswers(root, honestAnswers(bom, overrides));
  return await executeTrial({
    targetRoot: root,
    bom,
    bomPathRelative: "repos/apache-bigtop-repo/bigtop.bom",
    corpusAttestation: UNVERIFIED,
    chartEntries: readChart(root),
    answers: loadAnswers(answersPath),
    derivation: derivationFor(root, bom),
    governor: () => verdict,
  });
}

describe("the gate tree (task 5.1)", () => {
  test("all gates green plus a positive Governor verdict → PASS", async () => {
    const result = await runFixture({}, "yes — this is the real Bigtop");
    expect(result.verdict).toBe("PASS");
    expect(result.reasons).toEqual([]);
  });

  test("a fabricated anchor fails the whole trial, named", async () => {
    const result = await runFixture(
      { Q5: { qid: "Q5", text: "claim", anchors: [{ type: "file", path: "repos/nowhere/x" }], trust: "charted" } },
      "yes",
    );
    expect(result.verdict).toBe("FAIL");
    expect(result.reasons.join("\n")).toMatch(/fabricated anchor: Q5 cites `repos\/nowhere\/x`/);
  });

  test("a failed machine check fails the trial, expectation named", async () => {
    const { root, bom } = makeTarget();
    const claims = Object.fromEntries(bom.components.map((c) => [c.label, c.versionBase]));
    claims.hadoop = "0.0.0";
    const answers = honestAnswers(bom, {
      Q1: { qid: "Q1", text: "one version wrong", anchors: [{ type: "file", path: "repos/apache-bigtop-repo/bigtop.bom" }], trust: "charted", claims },
    });
    const answersPath = writeAnswers(root, answers);
    const result = await executeTrial({
      targetRoot: root,
      bom,
      bomPathRelative: "repos/apache-bigtop-repo/bigtop.bom",
      corpusAttestation: UNVERIFIED,
      chartEntries: readChart(root),
      answers: loadAnswers(answersPath),
      derivation: derivationFor(root, bom),
      governor: () => "yes",
    });
    expect(result.verdict).toBe("FAIL");
    expect(result.reasons.join("\n")).toMatch(/failed machine check Q1: expected hadoop 3\.4\.3, got 0\.0\.0/);
  });

  test("an unanswered question fails the trial", async () => {
    const { root, bom } = makeTarget();
    const answers = honestAnswers(bom).filter((a) => (a as { qid: string }).qid !== "Q7");
    const answersPath = writeAnswers(root, answers);
    const result = await executeTrial({
      targetRoot: root,
      bom,
      bomPathRelative: "repos/apache-bigtop-repo/bigtop.bom",
      corpusAttestation: UNVERIFIED,
      chartEntries: readChart(root),
      answers: loadAnswers(answersPath),
      derivation: derivationFor(root, bom),
      governor: () => "yes",
    });
    expect(result.verdict).toBe("FAIL");
    expect(result.reasons.join("\n")).toMatch(/unanswered Q7: no answer line/);
  });

  test("an enumerated guess on an unsurveyed axis fails the trial, claim named", async () => {
    const guessing: ChartEntry = {
      kind: "vessel",
      id: "ghost",
      name: "ghost",
      paths: [],
      anchors: [{ type: "file", path: "repos/alpha/Main.java" }],
      trust: "measured",
      behavior: "The runtime topology observed in production is five nodes.",
    };
    const result = await runFixture({}, "yes", [guessing]);
    expect(result.verdict).toBe("FAIL");
    expect(result.reasons.join("\n")).toMatch(
      /enumerated guess: `vessel\/ghost` claims "runtime topology"/,
    );
  });

  test("a negative Governor's verdict fails the trial", async () => {
    const result = await runFixture({}, "no — this is a mirage");
    expect(result.verdict).toBe("FAIL");
    expect(result.reasons.join("\n")).toMatch(/negative Governor's verdict: "no — this is a mirage"/);
  });

  test("a missing Governor's verdict cannot pass", async () => {
    const result = await runFixture({}, "");
    expect(result.verdict).toBe("FAIL");
    expect(result.reasons.join("\n")).toMatch(/Governor's verdict not captured/);
  });
});

describe("the Governor's read (task 5.2)", () => {
  test("presents the designated spark and solr sheets and records the verdict verbatim", async () => {
    let seenPresentation = "";
    const { root, bom } = makeTarget();
    const answersPath = writeAnswers(root, honestAnswers(bom));
    const result = await executeTrial({
      targetRoot: root,
      bom,
      bomPathRelative: "repos/apache-bigtop-repo/bigtop.bom",
      corpusAttestation: UNVERIFIED,
      chartEntries: readChart(root),
      answers: loadAnswers(answersPath),
      derivation: derivationFor(root, bom),
      governor: (presentation: string) => {
        seenPresentation = presentation;
        return "yes — sheets read like Bigtop";
      },
    });
    expect(seenPresentation).toContain("--- spark ---");
    expect(seenPresentation).toContain("--- solr ---");
    expect(seenPresentation).toContain("# Vessel spark — spark");
    expect(result.governor.verdict).toBe("yes — sheets read like Bigtop");
    expect(result.governor.captured).toBe(true);
    expect(result.governor.positive).toBe(true);
    // The verbatim verdict is the final gate line of the report.
    expect(result.report).toContain('Verdict (recorded verbatim): "yes — sheets read like Bigtop"');
    expect(result.report.trimEnd().endsWith("Captured: true; positive: true")).toBe(true);
  });

  test("only a yes read is positive", () => {
    expect(isPositiveVerdict("yes")).toBe(true);
    expect(isPositiveVerdict("YES — definitely")).toBe(true);
    expect(isPositiveVerdict("no")).toBe(false);
    expect(isPositiveVerdict("maybe")).toBe(false);
    expect(isPositiveVerdict("")).toBe(false);
  });
});

describe("the trial report (task 5.3)", () => {
  test("a completed run leaves a report with every section", async () => {
    const result = await runFixture({}, "yes");
    const report = readFileSync(result.reportPath, "utf8");
    expect(report).toContain("# Bigtop Sea Trial — report");
    expect(report).toContain("## Verdict: PASS");
    expect(report).toContain("## Fabrication gate");
    expect(report).toContain("## Unsurveyed honesty");
    expect(report).toContain("## Questions");
    expect(report).toContain("### Fairway completeness");
    expect(report).toContain("### Trust distribution");
    expect(report).toContain("### Staleness flip");
    expect(report).toContain("## Governor's read");
    expect(report).toContain('Verdict (recorded verbatim): "yes"');
    expect(report).toMatch(/sha256 `[0-9a-f]{64}`/);
    expect(report).toContain(UNVERIFIED);
    for (let i = 1; i <= 12; i += 1) {
      expect(report).toContain(`| Q${i} |`);
    }
    // Metric values are present, and the staleness flip named its vessel.
    expect(report).toMatch(/Charted fairways: \d+\/23/);
    expect(report).toMatch(/- Status: pass — editing repos\/alpha\/Main\.java flipped exactly vessel alpha/);
  });
});

describe("runSeaTrial (the public gate, task 1.1 smoke)", () => {
  test("refuses a reduced stand-in corpus before touching anything else", async () => {
    const root = join(tmpdir(), `portolan-sea-trial-refuse-${crypto.randomUUID()}`);
    mkdirSync(join(root, "repos", "apache-bigtop-repo"), { recursive: true });
    writeFileSync(join(root, "repos", "apache-bigtop-repo", "bigtop.bom"), readFileSync(FIXTURE, "utf8"));
    mkdirSync(join(root, "repos", "apache-spark"), { recursive: true });
    await expect(runSeaTrial({ targetRoot: root })).rejects.toThrow(/reduced stand-in corpus/);
  });

  test("a full-shape corpus without a chart errors with the exact remediation", async () => {
    const root = join(tmpdir(), `portolan-sea-trial-nochart-${crypto.randomUUID()}`);
    mkdirSync(join(root, "repos", "apache-bigtop-repo"), { recursive: true });
    writeFileSync(join(root, "repos", "apache-bigtop-repo", "bigtop.bom"), readFileSync(FIXTURE, "utf8"));
    for (const label of [
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
    ]) {
      mkdirSync(join(root, "repos", `apache-${label}`), { recursive: true });
    }
    await expect(runSeaTrial({ targetRoot: root })).rejects.toThrow(
      /no chart to try:.*an expedition must survey the target/s,
    );
  });
});
