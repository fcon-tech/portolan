/**
 * trust.report tests — one test per scenario in
 * openspec/changes/verification-spine/specs/tools/spec.md: the one-call
 * verification summary, staleness refreshed before answering, the
 * write-nothing guarantee, live re-sounding of every anchor, refuted anchors
 * named without being smoothed over, repeat-run agreement, and the honest
 * zero report over an empty chart.
 */
import { test, expect, afterEach } from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { ENTRY_KINDS, TRUST_LABELS, type ChartEntry } from "../types";
import { readChart, writeChart } from "../chart-store";
import { refreshStaleness } from "../staleness";
import { appendReceipt, readReceipt } from "./log";
import { trustReport } from "./trust-report";

const targets: string[] = [];
afterEach(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// The fixture province: harbor (measured vessel), tug (charted vessel with a
// manifest), and docs/ (note files no vessel covers — breaking them never
// flips a vessel signature, so a refuted anchor is the only thing that
// changes).
// ---------------------------------------------------------------------------

function makeProvince(): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-trust-"));
  targets.push(target);
  mkdirSync(join(target, "harbor"), { recursive: true });
  mkdirSync(join(target, "tug"), { recursive: true });
  mkdirSync(join(target, "docs"), { recursive: true });

  writeFileSync(
    join(target, "harbor", "harbor.ts"),
    [
      "// the harbor module",
      "export function moor(vessel: string): string {",
      "  return `moored:${vessel}`;",
      "}",
    ].join("\n") + "\n",
  );
  writeFileSync(
    join(target, "tug", "package.json"),
    ["{", '  "name": "tug",', '  "version": "1.0.0"', "}"].join("\n") + "\n",
  );
  writeFileSync(
    join(target, "tug", "tug.ts"),
    ["// the tug pulls on its own", "export function pull(): number {", "  return 1;"].join("\n") + "\n",
  );
  writeFileSync(
    join(target, "docs", "trimmed.md"),
    ["note one", "note two", "note three", "note four", "note five"].join("\n") + "\n",
  );
  writeFileSync(join(target, "docs", "erased-notes.md"), "field notes, soon to be erased\n");
  return target;
}

const harbor: ChartEntry = {
  kind: "vessel",
  id: "harbor",
  name: "harbor-service",
  paths: ["harbor"],
  anchors: [{ type: "file", path: "harbor/harbor.ts", line: 1 }],
  trust: "measured",
};
const tug: ChartEntry = {
  kind: "vessel",
  id: "tug",
  name: "tug",
  behavior: "Pulls other vessels.",
  paths: ["tug"],
  anchors: [{ type: "manifest", path: "tug/package.json", key: "name" }],
  trust: "charted",
};

/** The full survey: all six kinds, all five labels, every anchor truthful. */
const fullChart: ChartEntry[] = [
  harbor,
  tug,
  {
    kind: "fairway",
    id: "fw-tug-harbor",
    from: "tug",
    to: "harbor",
    anchors: [{ type: "file", path: "tug/tug.ts", line: 1 }],
    trust: "reported",
  },
  {
    kind: "portOfEntry",
    id: "poe-tug-cli",
    vessel: "tug",
    protocol: "cli",
    anchors: [{ type: "file", path: "tug/tug.ts", line: 2 }],
    trust: "doubtful",
  },
  {
    kind: "beacon",
    id: "b-tug-port",
    vessel: "tug",
    surface: "port",
    key: "PORT",
    anchors: [{ type: "manifest", path: "tug/package.json", key: "version" }],
    trust: "unsurveyed",
  },
  {
    kind: "light",
    id: "l-harbor-moor",
    vessel: "harbor",
    name: "export function moor()",
    anchors: [{ type: "file", path: "harbor/harbor.ts", line: 2 }],
    trust: "measured",
  },
  {
    kind: "danger",
    id: "d-harbor-shallow",
    vessel: "harbor",
    category: "shallow",
    note: "moor() has no timeout.",
    anchors: [{ type: "file", path: "harbor/harbor.ts", line: 3 }],
    trust: "charted",
  },
];

function writeFullChart(target: string): void {
  writeChart(target, fullChart);
}

/** A survey carrying broken anchors under docs/ (outside every vessel's paths). */
const brokenChart: ChartEntry[] = [
  harbor,
  tug,
  {
    kind: "danger",
    id: "d-drifted",
    vessel: "harbor",
    category: "rock",
    note: "cites a note file that gets trimmed and one that never existed",
    anchors: [
      { type: "file", path: "docs/trimmed.md", line: 5 },
      { type: "file", path: "docs/never-charted.md", line: 1 },
    ],
    trust: "doubtful",
  },
  {
    kind: "danger",
    id: "d-erased",
    vessel: "tug",
    category: "wreck",
    note: "cites field notes that get erased after the survey",
    anchors: [{ type: "file", path: "docs/erased-notes.md", line: 1 }],
    trust: "reported",
  },
];

function writeBrokenChart(target: string): void {
  writeChart(target, brokenChart);
}

/** Break the docs anchors the way an outside force would: erase and trim. */
function breakAnchors(target: string): void {
  rmSync(join(target, "docs", "erased-notes.md"));
  writeFileSync(join(target, "docs", "trimmed.md"), ["note one", "note two"].join("\n") + "\n");
}

/** An outside force edits a surveyed source: harbor's signature flips. */
function touchHarbor(target: string): void {
  const path = join(target, "harbor", "harbor.ts");
  writeFileSync(path, readFileSync(path, "utf8") + "  // drifted by an outside force\n");
}

const staleIds = (target: string): string[] =>
  readChart(target)
    .filter((e) => e.stale)
    .map((e) => `${e.kind}/${e.id}`)
    .sort();

const zeroLabels: Record<string, number> = Object.fromEntries(TRUST_LABELS.map((l) => [l, 0]));
const zeroKinds: Record<string, number> = Object.fromEntries(ENTRY_KINDS.map((k) => [k, 0]));

// ---------------------------------------------------------------------------
// 1. The report answers in one call
// ---------------------------------------------------------------------------

test("one call returns the trust-label distribution, per-kind counts, staleness, and the log summary", () => {
  const target = makeProvince();
  appendReceipt(target, { command: "sweep pattern=harbor", scope: "harbor/", outcome: "ok: 3 chunks" });
  appendReceipt(target, { command: "symbols name=moor", outcome: "ok: 1 definition" });
  writeFullChart(target);

  const report = trustReport(target);

  // Every label and every kind is stated, zero-filled when unused.
  expect(report.trust).toEqual({
    ...zeroLabels,
    measured: 2,
    charted: 2,
    reported: 1,
    doubtful: 1,
    unsurveyed: 1,
  });
  expect(report.kinds).toEqual({
    ...zeroKinds,
    vessel: 2,
    fairway: 1,
    portOfEntry: 1,
    beacon: 1,
    light: 1,
    danger: 1,
  });

  // Sources untouched since the survey: nothing is pending correction.
  expect(report.staleness.pendingVessels).toEqual([]);

  // All seven anchors are truthful: all confirmed, none refuted.
  expect(report.anchors.total).toBe(7);
  expect(report.anchors.sounded).toBe(7);
  expect(report.anchors.confirmed).toBe(7);
  expect(report.anchors.refuted).toBe(0);
  expect(report.anchors.refutedList).toEqual([]);

  // The ship's-log summary: total receipts and the most recent one.
  expect(report.log.receipts).toBe(2);
  expect(report.log.lastReceipt).toEqual(readReceipt(target, "r2"));
});

// ---------------------------------------------------------------------------
// 2. The staleness section is fresh
// ---------------------------------------------------------------------------

test("staleness is refreshed first: a touched source is pending correction, marked exactly as chart.read would", () => {
  const target = makeProvince();
  writeFullChart(target);
  touchHarbor(target);

  const report = trustReport(target);

  // Harbor drags its vessel, fairway, light, and danger into pending
  // correction; tug is untouched.
  expect(report.staleness.pendingVessels).toEqual([{ id: "harbor", entries: 4 }]);

  // Identical to what a chart.read's refresh marks on the same drift.
  const twin = makeProvince();
  writeFullChart(twin);
  touchHarbor(twin);
  refreshStaleness(twin);
  expect(staleIds(target)).toEqual(staleIds(twin));
  expect(staleIds(target)).toEqual([
    "danger/d-harbor-shallow",
    "fairway/fw-tug-harbor",
    "light/l-harbor-moor",
    "vessel/harbor",
  ]);
});

// ---------------------------------------------------------------------------
// 3. The report writes nothing but the refresh
// ---------------------------------------------------------------------------

/** Content snapshot of every file under root (perimeter-test style). */
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
      snap.set(relative(root, abs), createHash("sha256").update(readFileSync(abs)).digest("hex"));
    }
  };
  walk(root);
  return snap;
}

/** Size and mtime of every file under root, skipping the .portolan perimeter. */
function snapshotOutsideStats(root: string): Map<string, string> {
  const snap = new Map<string, string>();
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      const rel = relative(root, abs);
      if (rel === ".portolan" || rel.startsWith(".portolan/")) continue;
      if (entry.isDirectory()) {
        walk(abs);
        continue;
      }
      if (!entry.isFile()) continue;
      const stats = statSync(abs);
      snap.set(rel, `${stats.size}:${stats.mtimeMs}`);
    }
  };
  walk(root);
  return snap;
}

test("with unchanged signatures the report writes nothing: the chart is byte-identical and nothing outside .portolan is touched", () => {
  const target = makeProvince();
  writeFullChart(target);
  appendReceipt(target, { command: "sweep pattern=harbor", scope: "harbor/", outcome: "ok: 3 chunks" });

  const beforeTree = snapshotTree(target);
  expect(beforeTree.has(".portolan/chart/index.jsonl")).toBe(true);
  const beforeOutside = snapshotOutsideStats(target);
  expect(beforeOutside.size).toBeGreaterThan(0);

  trustReport(target);

  // The whole target — chart, log, and sources alike — is byte-identical.
  expect(snapshotTree(target)).toEqual(beforeTree);
  // No file outside <target>/.portolan/ was even touched (size or mtime).
  expect(snapshotOutsideStats(target)).toEqual(beforeOutside);
});

// ---------------------------------------------------------------------------
// 4. Every anchor is sounded
// ---------------------------------------------------------------------------

test("every anchor is sounded: the sounded count states the total", () => {
  const target = makeProvince();
  writeBrokenChart(target);
  breakAnchors(target);

  const entries = readChart(target);
  const total = entries.reduce((n, e) => n + e.anchors.length, 0);
  expect(total).toBe(5); // guards the fixture: two healthy, three broken

  const report = trustReport(target);

  expect(report.anchors.total).toBe(total);
  expect(report.anchors.sounded).toBe(total);
  // Anchor soundings are binary: the verdicts account for every anchor.
  expect(report.anchors.confirmed + report.anchors.refuted).toBe(total);
  expect(report.anchors.confirmed).toBe(2);
  expect(report.anchors.refuted).toBe(3);
});

// ---------------------------------------------------------------------------
// 5. A broken anchor is named, not smoothed over
// ---------------------------------------------------------------------------

test("a broken anchor is named with its entry and what was found, and the entry is left unchanged", () => {
  const target = makeProvince();
  writeBrokenChart(target);
  breakAnchors(target);
  const indexBefore = readFileSync(join(target, ".portolan", "chart", "index.jsonl"), "utf8");

  const report = trustReport(target);

  // Every refuted anchor is listed: entry id, the cited anchor, what was
  // actually found — sorted by entry id, then anchor index.
  expect(
    report.anchors.refutedList.map((r) => [r.entryId, r.anchor]),
  ).toEqual([
    ["d-drifted", { type: "file", path: "docs/trimmed.md", line: 5 }],
    ["d-drifted", { type: "file", path: "docs/never-charted.md", line: 1 }],
    ["d-erased", { type: "file", path: "docs/erased-notes.md", line: 1 }],
  ]);
  // What was found: the drift names the file and its real length; the
  // erasures name the missing path.
  expect(report.anchors.refutedList[0]!.found).toContain("docs/trimmed.md");
  expect(report.anchors.refutedList[0]!.found).toContain("2 line");
  expect(report.anchors.refutedList[1]!.found).toContain("docs/never-charted.md");
  expect(report.anchors.refutedList[1]!.found).toContain("does not exist");
  expect(report.anchors.refutedList[2]!.found).toContain("docs/erased-notes.md");
  expect(report.anchors.refutedList[2]!.found).toContain("does not exist");

  // The verdict informs, it does not write: entries, trust labels, and bytes
  // on disk are exactly as before the report.
  expect(readFileSync(join(target, ".portolan", "chart", "index.jsonl"), "utf8")).toBe(indexBefore);
  const after = readChart(target);
  const drifted = after.find((e) => e.id === "d-drifted")!;
  const erased = after.find((e) => e.id === "d-erased")!;
  expect(drifted.trust).toBe("doubtful");
  expect(drifted.stale).toBe(false);
  expect(erased.trust).toBe("reported");
  expect(erased.stale).toBe(false);
});

// ---------------------------------------------------------------------------
// 6. Re-running over an unchanged province agrees
// ---------------------------------------------------------------------------

test("two runs over an unchanged province agree on counts, verdicts, and refuted order", () => {
  const target = makeProvince();
  writeBrokenChart(target);
  breakAnchors(target);
  appendReceipt(target, { command: "sweep pattern=harbor", scope: "harbor/", outcome: "ok: 1 chunk" });

  const first = trustReport(target);
  const second = trustReport(target);

  expect(second).toEqual(first);
  expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  // The agreement is not vacuous: refuted verdicts in a fixed order and a
  // log summary are part of it.
  expect(first.anchors.refutedList.length).toBe(3);
  expect(first.log.receipts).toBe(1);
});

// ---------------------------------------------------------------------------
// 7. An empty chart is an honest zero report
// ---------------------------------------------------------------------------

test("an empty chart yields an honest zero report, not an error", () => {
  const target = makeProvince();
  mkdirSync(join(target, ".portolan", "chart"), { recursive: true });
  writeFileSync(join(target, ".portolan", "chart", "index.jsonl"), "");

  const report = trustReport(target);

  expect(report.trust).toEqual(zeroLabels);
  expect(report.kinds).toEqual(zeroKinds);
  expect(report.staleness.pendingVessels).toEqual([]);
  expect(report.anchors).toEqual({ total: 0, sounded: 0, confirmed: 0, refuted: 0, refutedList: [] });
  expect(report.log).toEqual({ receipts: 0, lastReceipt: null });
});
