import { test, expect, afterEach } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { treeSignature, refreshStaleness } from "./staleness";
import { chartDir, readChart, writeChart, INDEX_FILE } from "./chart-store";
import { sheetFileName } from "./sheets";
import type { ChartEntry } from "./types";

const targets: string[] = [];
afterEach(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

function makeTree(): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-stale-"));
  targets.push(target);
  mkdirSync(join(target, "pkg-a"), { recursive: true });
  mkdirSync(join(target, "pkg-b"), { recursive: true });
  mkdirSync(join(target, "outside"), { recursive: true });
  writeFileSync(join(target, "pkg-a/main.js"), "console.log('a');\n");
  writeFileSync(join(target, "pkg-a/util.js"), "export const u = 1;\n");
  writeFileSync(join(target, "pkg-b/main.js"), "console.log('b');\n");
  writeFileSync(join(target, "outside/irrelevant.txt"), "noise\n");
  return target;
}

const vesselA: ChartEntry = {
  kind: "vessel",
  id: "alpha",
  name: "Alpha service",
  behavior: "Handles ingestion.",
  paths: ["pkg-a"],
  anchors: [{ type: "file", path: "pkg-a/main.js", line: 1 }],
  trust: "measured",
};

const vesselB: ChartEntry = {
  kind: "vessel",
  id: "bravo",
  name: "Bravo service",
  behavior: "Serves reads.",
  paths: ["pkg-b"],
  anchors: [{ type: "file", path: "pkg-b/main.js", line: 1 }],
  trust: "measured",
};

const fairwayAB: ChartEntry = {
  kind: "fairway",
  id: "f-a-b",
  from: "alpha",
  to: "bravo",
  anchors: [{ type: "file", path: "pkg-a/main.js", line: 2 }],
  trust: "measured",
};

const dangerA: ChartEntry = {
  kind: "danger",
  id: "d-alpha",
  vessel: "alpha",
  category: "shallow",
  note: "Ingestion has no retry.",
  anchors: [{ type: "file", path: "pkg-a/util.js", line: 1 }],
  trust: "measured",
};

const lightB: ChartEntry = {
  kind: "light",
  id: "l-bravo",
  vessel: "bravo",
  name: "GET /items",
  anchors: [{ type: "file", path: "pkg-b/main.js", line: 1 }],
  trust: "measured",
};

const chart: ChartEntry[] = [vesselA, vesselB, fairwayAB, dangerA, lightB];

const staleIds = (target: string) =>
  readChart(target)
    .filter((e) => e.stale)
    .map((e) => `${e.kind}/${e.id}`)
    .sort();

test("treeSignature is stable for unchanged trees and flips on change", () => {
  const target = makeTree();
  const first = treeSignature(target, ["pkg-a"]);
  expect(first.files).toBe(2);
  expect(treeSignature(target, ["pkg-a"])).toStrictEqual(first);

  // Content edit with a different size flips the hash.
  writeFileSync(join(target, "pkg-a/main.js"), "console.log('a changed'); // more\n");
  expect(treeSignature(target, ["pkg-a"]).hash).not.toBe(first.hash);

  // Adding a file flips it too.
  const before = treeSignature(target, ["pkg-a"]);
  writeFileSync(join(target, "pkg-a/new.js"), "export {};\n");
  const after = treeSignature(target, ["pkg-a"]);
  expect(after.hash).not.toBe(before.hash);
  expect(after.files).toBe(3);

  // Paths outside the vessel's roots do not affect it.
  const scoped = treeSignature(target, ["pkg-a"]);
  writeFileSync(join(target, "outside/irrelevant.txt"), "different noise\n");
  expect(treeSignature(target, ["pkg-a"]).hash).toBe(scoped.hash);
});

test("unchanged sources stay fresh: a refresh with no changes writes nothing", () => {
  const target = makeTree();
  writeChart(target, chart);
  const indexBefore = readFileSync(join(chartDir(target), INDEX_FILE), "utf8");

  const result = refreshStaleness(target);

  expect(result.changedVessels).toEqual([]);
  expect(result.staleEntries).toEqual([]);
  expect(staleIds(target)).toEqual([]);
  // Byte-identical: the refresh had nothing to correct, so it wrote nothing.
  expect(readFileSync(join(chartDir(target), INDEX_FILE), "utf8")).toBe(indexBefore);
});

test("editing a file flips only its vessel to pending correction", () => {
  const target = makeTree();
  writeChart(target, chart);

  writeFileSync(
    join(target, "pkg-a/main.js"),
    "console.log('a edited by an outside force');\n"
  );
  const result = refreshStaleness(target);

  expect(result.changedVessels).toEqual(["alpha"]);
  // All of alpha's entries are marked: the vessel, its fairway, its danger.
  expect(staleIds(target)).toEqual(["danger/d-alpha", "fairway/f-a-b", "vessel/alpha"]);
  // Bravo's entries are not.
  const sheetBravo = readFileSync(join(chartDir(target), sheetFileName("bravo")), "utf8");
  expect(sheetBravo).not.toContain("Pending correction");
  // Alpha's sheet carries the banner.
  const sheetAlpha = readFileSync(join(chartDir(target), sheetFileName("alpha")), "utf8");
  expect(sheetAlpha).toContain("Pending correction");
});

test("a second refresh before repair is idempotent", () => {
  const target = makeTree();
  writeChart(target, chart);
  writeFileSync(join(target, "pkg-b/main.js"), "console.log('b edited');\n");
  const first = refreshStaleness(target);
  expect(first.changedVessels).toEqual(["bravo"]);
  const expectedStale = ["fairway/f-a-b", "light/l-bravo", "vessel/bravo"];
  expect(staleIds(target)).toEqual(expectedStale);
  const indexAfterFirst = readFileSync(join(chartDir(target), INDEX_FILE), "utf8");

  // The signature anchors to the last survey, so an unrepaired vessel still
  // differs from it — but the refresh rewrites byte-identical state.
  const second = refreshStaleness(target);
  expect(second.changedVessels).toEqual(["bravo"]);
  expect(staleIds(target)).toEqual(expectedStale);
  expect(readFileSync(join(chartDir(target), INDEX_FILE), "utf8")).toBe(indexAfterFirst);
});
