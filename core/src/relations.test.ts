/**
 * Fairway relation enum tests (chart-neighborhood task 1.2) — one test per
 * scenario in openspec/changes/chart-neighborhood/specs/chart/spec.md: an
 * out-of-enum relation is rejected naming the enum exactly like an unknown
 * trust label, a typed fairway round-trips through the store unchanged, and
 * an untyped fairway (pre-enum charts) stays valid and reads back unchanged.
 */
import { test, expect, afterEach } from "bun:test";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { chartDir, readChart, writeChart } from "./chart-store";
import { ChartValidationError } from "./validate";
import type { ChartEntry, FairwayEntry, IndexedEntry, VesselEntry } from "./types";

const targets: string[] = [];
afterEach(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

function makeTarget(): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-relations-"));
  targets.push(target);
  return target;
}

const src: VesselEntry = {
  kind: "vessel",
  id: "src",
  name: "Source vessel",
  paths: ["services/src"],
  anchors: [{ type: "file", path: "services/src/main.ts", line: 1 }],
  trust: "charted",
};

const dst: VesselEntry = {
  kind: "vessel",
  id: "dst",
  name: "Destination vessel",
  paths: ["services/dst"],
  anchors: [{ type: "file", path: "services/dst/main.ts", line: 1 }],
  trust: "measured",
};

const fairwayBase: FairwayEntry = {
  kind: "fairway",
  id: "fw-src-dst",
  from: "src",
  to: "dst",
  anchors: [{ type: "file", path: "services/src/wire.ts", line: 7 }],
  trust: "measured",
};

const baseChart: ChartEntry[] = [src, dst, fairwayBase];

/** fileName -> content hash, for byte-identity checks. */
function snapshotBytes(dir: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const name of readdirSync(dir)) {
    out.set(name, createHash("sha1").update(readFileSync(join(dir, name))).digest("hex"));
  }
  return out;
}

/** The stored fairway with the given id, as the index holds it. */
function storedFairway(entries: IndexedEntry[], id: string): IndexedEntry & FairwayEntry {
  return entries.find((e) => e.kind === "fairway" && e.id === id) as IndexedEntry & FairwayEntry;
}

test("a fairway with relation imports is rejected naming the build|runtime|config enum, persisting nothing", () => {
  const target = makeTarget();
  writeChart(target, baseChart);
  const dir = chartDir(target);
  const before = snapshotBytes(dir);

  const outOfEnum = { ...fairwayBase, id: "fw-bad", relation: "imports" } as unknown as FairwayEntry;

  // Rejected exactly like an unknown trust label: the error names the entry
  // and the allowed enum values.
  let err: unknown;
  try {
    writeChart(target, [...baseChart, outOfEnum]);
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(ChartValidationError);
  const message = (err as Error).message;
  expect(message).toContain("fw-bad");
  expect(message).toContain("relation");
  expect(message).toContain("build");
  expect(message).toContain("runtime");
  expect(message).toContain("config");

  // Nothing was persisted: the chart on disk is byte-identical.
  expect(snapshotBytes(dir)).toStrictEqual(before);
  expect(readChart(target)).toHaveLength(baseChart.length);
});

test("a fairway with relation build round-trips through write/read unchanged", () => {
  const target = makeTarget();
  const typed: FairwayEntry = { ...fairwayBase, relation: "build" };
  writeChart(target, [src, dst, typed]);

  const stored = storedFairway(readChart(target), "fw-src-dst");
  expect({ ...stored, stale: undefined, signature: undefined }).toStrictEqual({
    ...typed,
    stale: undefined,
    signature: undefined,
  });
  expect(stored.stale).toBe(false);
  expect(stored.signature).toBeUndefined();
});

test("every enum value (build, runtime, config) round-trips; the enum stays closed", () => {
  const target = makeTarget();
  const typed = (relation: FairwayEntry["relation"], id: string): FairwayEntry => ({
    ...fairwayBase,
    id,
    relation,
  });
  writeChart(target, [
    src,
    dst,
    typed("build", "fw-build"),
    typed("runtime", "fw-runtime"),
    typed("config", "fw-config"),
  ]);

  const read = readChart(target);
  expect(storedFairway(read, "fw-build").relation).toBe("build");
  expect(storedFairway(read, "fw-runtime").relation).toBe("runtime");
  expect(storedFairway(read, "fw-config").relation).toBe("config");
});

test("an untyped fairway stays valid and reads back unchanged (pre-enum charts need no migration)", () => {
  const target = makeTarget();
  writeChart(target, baseChart);

  const stored = storedFairway(readChart(target), "fw-src-dst");
  expect({ ...stored, stale: undefined, signature: undefined }).toStrictEqual({
    ...fairwayBase,
    stale: undefined,
    signature: undefined,
  });
  expect(stored.relation).toBeUndefined();
});
