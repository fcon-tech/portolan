/**
 * Regression tests for the final review gate's major findings: the repair
 * round-trip over the store and the MCP surface, and family matching in
 * sound.edge's manifest means.
 */
import { test, expect, afterEach } from "bun:test";
import { appendFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ChartEntry, FairwayEntry, VesselEntry } from "./types";
import { readChart, writeChart } from "./chart-store";
import { refreshStaleness } from "./staleness";
import { soundEdge } from "./tools/sound";
import { TOOL_TABLE } from "./server/registry";

const targets: string[] = [];
afterEach(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

function makeProvince(): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-repair-"));
  targets.push(target);
  mkdirSync(join(target, "hadoop"), { recursive: true });
  mkdirSync(join(target, "tug"), { recursive: true });
  writeFileSync(join(target, "hadoop", "hadoop.ts"), "export function moor(): string {\n  return \"moored\";\n}\n");
  writeFileSync(
    join(target, "tug", "pom.xml"),
    [
      "<project>",
      "  <groupId>org.province</groupId>",
      "  <artifactId>tug</artifactId>",
      "  <dependencies>",
      "    <dependency>",
      "      <groupId>org.apache.hadoop</groupId>",
      "      <artifactId>hadoop-common</artifactId>",
      "    </dependency>",
      "  </dependencies>",
      "</project>",
      "",
    ].join("\n"),
  );
  return target;
}

const hadoop: VesselEntry = {
  kind: "vessel",
  id: "hadoop",
  name: "hadoop",
  paths: ["hadoop"],
  anchors: [{ type: "file", path: "hadoop/hadoop.ts" }],
  trust: "measured",
};

const tug: VesselEntry = {
  kind: "vessel",
  id: "tug",
  name: "tug",
  paths: ["tug"],
  anchors: [{ type: "manifest", path: "tug/pom.xml", key: "project.artifactId" }],
  trust: "charted",
};

test("read → modify → write round-trip: stale/signature metadata is accepted and re-stamped", () => {
  const target = makeProvince();
  writeChart(target, [hadoop, tug]);

  appendFileSync(join(target, "hadoop", "hadoop.ts"), "// drift\n");
  refreshStaleness(target);
  const drifted = readChart(target);
  expect(drifted.find((e) => e.id === "hadoop")?.stale).toBe(true);

  // The entries came back from a read: they carry stale/signature metadata.
  // Writing them again (the repair move) must succeed and land fresh.
  writeChart(target, drifted as unknown as ChartEntry[]);
  const repaired = readChart(target);
  expect(repaired.find((e) => e.id === "hadoop")?.stale).toBe(false);
});

test("chart.read over the MCP surface refreshes staleness before returning", () => {
  const target = makeProvince();
  writeChart(target, [hadoop, tug]);

  appendFileSync(join(target, "hadoop", "hadoop.ts"), "// drift\n");
  const chartRead = TOOL_TABLE.find((t) => t.name === "chart.read");
  expect(chartRead).toBeDefined();
  const result = chartRead!.handler({}, { targetRoot: target }) as { entries: ReturnType<typeof readChart> };
  expect(result.entries.find((e) => e.id === "hadoop")?.stale).toBe(true);
  expect(result.entries.find((e) => e.id === "tug")?.stale).toBe(false);
});

test("sound.edge manifest means confirms a submodule-family dependency (hadoop-common → hadoop)", () => {
  const target = makeProvince();
  const fairway: FairwayEntry = {
    kind: "fairway",
    id: "tug-hadoop",
    from: "tug",
    to: "hadoop",
    anchors: [{ type: "manifest", path: "tug/pom.xml", key: "project.dependencies.hadoop-common" }],
    trust: "charted",
  };
  const verdict = soundEdge(target, { fairway, source: tug, target: hadoop });
  expect(verdict.verdict).toBe("confirmed");
  const manifestMeans = verdict.means.find((m) => m.means === "manifest");
  expect(manifestMeans?.found).toBe(true);
  expect(manifestMeans?.evidence[0]?.anchor).toEqual({
    type: "manifest",
    path: "tug/pom.xml",
    key: "project.dependencies.hadoop-common",
  });
});
