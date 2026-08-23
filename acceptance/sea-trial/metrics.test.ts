/**
 * Metric tests (sea-trial tasks.md 4.1–4.3): fairway completeness against
 * the BOM-derived dependency list with the missing named; the exact
 * five-way trust share; the staleness flip on a charted fixture that
 * flips only the touched vessel and restores the file byte-for-byte.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readChart, refreshStaleness, writeChart, type ChartEntry } from "../../core/src/index";
import { readBom } from "./bom";
import { fairwayCompleteness, stalenessFlip, trustDistribution } from "./metrics";

const FIXTURE = join(import.meta.dir, "fixtures", "bigtop.bom");

describe("fairway completeness (task 4.1)", () => {
  test("reports the charted ratio and names every missing dependency", () => {
    const bom = readBom(FIXTURE);
    const entries: ChartEntry[] = [
      { kind: "vessel", id: "spark", name: "spark", paths: ["repos/apache-spark"], anchors: [{ type: "file", path: "b" }], trust: "charted" },
      { kind: "vessel", id: "hadoop", name: "hadoop", paths: ["repos/apache-hadoop"], anchors: [{ type: "file", path: "b" }], trust: "charted" },
      { kind: "vessel", id: "zookeeper", name: "zookeeper", paths: ["repos/apache-zookeeper"], anchors: [{ type: "file", path: "b" }], trust: "charted" },
      { kind: "fairway", id: "f1", from: "spark", to: "hadoop", anchors: [{ type: "file", path: "b" }], trust: "charted" },
      { kind: "fairway", id: "f2", from: "hadoop", to: "zookeeper", anchors: [{ type: "file", path: "b" }], trust: "charted" },
    ];
    const result = fairwayCompleteness(bom, entries as never);
    expect(result.bomPairs).toBe(23);
    expect(result.charted).toBe(2);
    expect(result.ratio).toBeCloseTo(2 / 23);
    expect(result.missing).toContain("hbase → hadoop");
    expect(result.missing).toContain("zeppelin → hive");
    expect(result.missing.length).toBe(21);
    expect(result.extraFairways).toEqual([]);
  });

  test("charted fairways beyond the BOM list are reported as extras, not failures", () => {
    const bom = readBom(FIXTURE);
    const entries: ChartEntry[] = [
      { kind: "vessel", id: "spark", name: "spark", paths: [], anchors: [{ type: "file", path: "b" }], trust: "charted" },
      { kind: "vessel", id: "kafka", name: "kafka", paths: [], anchors: [{ type: "file", path: "b" }], trust: "charted" },
      { kind: "fairway", id: "f1", from: "spark", to: "kafka", anchors: [{ type: "file", path: "b" }], trust: "charted" },
    ];
    const result = fairwayCompleteness(bom, entries as never);
    expect(result.charted).toBe(0);
    expect(result.extraFairways).toEqual(["spark→kafka"]);
  });
});

describe("trust distribution (task 4.2)", () => {
  test("a fixture chart yields the exact five-way share", () => {
    const entry = (id: string, trust: ChartEntry["trust"]): ChartEntry => ({
      kind: "vessel",
      id,
      name: id,
      paths: [],
      anchors: [{ type: "file", path: "b" }],
      trust,
    });
    const entries = [
      entry("a", "measured"),
      entry("b", "measured"),
      entry("c", "charted"),
      entry("d", "reported"),
      entry("e", "doubtful"),
      entry("f", "unsurveyed"),
    ];
    const dist = trustDistribution(entries as never);
    expect(dist.total).toBe(6);
    expect(dist.counts).toEqual({
      measured: 2,
      charted: 1,
      reported: 1,
      doubtful: 1,
      unsurveyed: 1,
    });
    expect(dist.shares.measured).toBeCloseTo(2 / 6);
    expect(dist.shares.unsurveyed).toBeCloseTo(1 / 6);
    expect(dist.invalid).toBe(0);
  });

  test("an empty chart distributes zeros, not NaN", () => {
    const dist = trustDistribution([]);
    expect(dist.total).toBe(0);
    expect(Object.values(dist.shares).every((s) => s === 0)).toBe(true);
  });
});

describe("staleness flip (task 4.3)", () => {
  function chartedTarget(): string {
    const root = join(tmpdir(), `portolan-sea-trial-stale-${crypto.randomUUID()}`);
    mkdirSync(join(root, "repos", "alpha"), { recursive: true });
    mkdirSync(join(root, "repos", "beta"), { recursive: true });
    writeFileSync(join(root, "repos", "alpha", "Main.java"), "class Main { int x = 1; }\n");
    writeFileSync(join(root, "repos", "beta", "Other.java"), "class Other { int y = 2; }\n");
    writeChart(root, [
      { kind: "vessel", id: "alpha", name: "alpha", paths: ["repos/alpha"], anchors: [{ type: "file", path: "repos/alpha/Main.java" }], trust: "measured" },
      { kind: "vessel", id: "beta", name: "beta", paths: ["repos/beta"], anchors: [{ type: "file", path: "repos/beta/Other.java" }], trust: "measured" },
      { kind: "fairway", id: "f1", from: "beta", to: "alpha", anchors: [{ type: "file", path: "repos/beta/Other.java" }], trust: "charted" },
    ]);
    return root;
  }

  test("one whitespace append flips only the touched vessel; the file is restored byte-for-byte", () => {
    const root = chartedTarget();
    const before = readFileSync(join(root, "repos", "alpha", "Main.java"));
    const chartBefore = readFileSync(join(root, ".portolan", "chart", "index.jsonl"));
    const result = stalenessFlip(root, readChart(root));

    expect(result.status).toBe("pass");
    expect(result.vessel).toBe("alpha"); // deterministic: alphabetically first
    expect(result.file).toBe("repos/alpha/Main.java");
    expect(result.changedVessels).toEqual(["alpha"]);
    expect(result.staleEntryIds.length).toBe(2); // alpha's own entry + the fairway touching it
    expect(result.foreignStaleEntryIds).toEqual([]);
    // Byte-for-byte restoration of the touched file and the chart.
    expect(result.fileRestoredByteIdentical).toBe(true);
    expect(result.chartRestoredByteIdentical).toBe(true);
    expect(result.hashAfterRevert).toBe(result.hashBefore);
    expect(result.hashMutated).not.toBe(result.hashBefore);
    expect(readFileSync(join(root, "repos", "alpha", "Main.java")).equals(before)).toBe(true);
    expect(readFileSync(join(root, ".portolan", "chart", "index.jsonl")).equals(chartBefore)).toBe(true);
    // A later refresh, with sizes and mtimes restored, finds nothing stale —
    // reruns of the trial stay clean.
    expect(refreshStaleness(root).changedVessels).toEqual([]);
  });

  test("overlapping vessel paths flip two vessels and the check fails honestly", () => {
    const root = join(tmpdir(), `portolan-sea-trial-overlap-${crypto.randomUUID()}`);
    mkdirSync(join(root, "shared"), { recursive: true });
    writeFileSync(join(root, "shared", "A.java"), "class A {}\n");
    writeChart(root, [
      { kind: "vessel", id: "one", name: "one", paths: ["shared"], anchors: [{ type: "file", path: "shared/A.java" }], trust: "measured" },
      { kind: "vessel", id: "two", name: "two", paths: ["shared"], anchors: [{ type: "file", path: "shared/A.java" }], trust: "measured" },
    ]);
    const result = stalenessFlip(root, readChart(root));
    expect(result.status).toBe("fail");
    expect(result.changedVessels.sort()).toEqual(["one", "two"]);
    expect(result.fileRestoredByteIdentical).toBe(true);
  });

  test("no vessel with existing sources is not-assessed, not a crash", () => {
    const root = join(tmpdir(), `portolan-sea-trial-empty-${crypto.randomUUID()}`);
    mkdirSync(root, { recursive: true });
    writeChart(root, [
      { kind: "vessel", id: "ghost", name: "ghost", paths: ["repos/ghost"], anchors: [{ type: "file", path: "x" }], trust: "charted" },
    ]);
    const result = stalenessFlip(root, readChart(root));
    expect(result.status).toBe("not-assessed");
    expect(result.detail).toMatch(/no charted vessel has an existing source file/);
  });
});
