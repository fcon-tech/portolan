import { test, expect, afterEach } from "bun:test";
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
import { join } from "node:path";
import { createHash } from "node:crypto";
import { chartDir, readChart, writeChart } from "./chart-store";
import { sheetFileName } from "./sheets";
import { ChartValidationError } from "./validate";
import type { ChartEntry } from "./types";

const targets: string[] = [];
afterEach(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

function makeTarget(): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-chart-"));
  targets.push(target);
  return target;
}

const web: ChartEntry = {
  kind: "vessel",
  id: "web",
  name: "Web frontend",
  behavior: "Serves the SPA and the JSON API.",
  paths: ["services/web"],
  anchors: [{ type: "file", path: "services/web/main.ts", line: 1 }],
  trust: "charted",
};

const db: ChartEntry = {
  kind: "vessel",
  id: "db",
  name: "Relational store",
  paths: ["services/db"],
  anchors: [{ type: "file", path: "services/db/schema.sql", line: 1 }],
  trust: "measured",
};

const fairwayWebDb: ChartEntry = {
  kind: "fairway",
  id: "f-web-db",
  from: "web",
  to: "db",
  anchors: [{ type: "file", path: "services/web/db.ts", line: 7 }],
  trust: "measured",
};

const lightUsers: ChartEntry = {
  kind: "light",
  id: "l-users",
  vessel: "web",
  name: "GET /api/users",
  anchors: [{ type: "file", path: "services/web/router.ts", line: 42 }],
  trust: "measured",
};

const dangerDup: ChartEntry = {
  kind: "danger",
  id: "d-dup",
  vessel: "web",
  category: "wreck",
  note: "Duplicated JSON parsing in two handlers.",
  anchors: [{ type: "file", path: "services/web/util.ts", line: 10 }],
  trust: "measured",
};

const fullChart: ChartEntry[] = [web, db, fairwayWebDb, lightUsers, dangerDup];

/** relPath -> mtime, for perimeter checks. */
function snapshotTree(root: string): Map<string, number> {
  const out = new Map<string, number>();
  const walk = (rel: string) => {
    const abs = join(root, rel);
    for (const name of readdirSync(abs)) {
      const relName = rel === "" ? name : `${rel}/${name}`;
      const absName = join(root, relName);
      if (statSync(absName).isDirectory()) walk(relName);
      else out.set(relName, statSync(absName).mtimeMs);
    }
  };
  walk("");
  return out;
}

/** fileName -> content hash, for byte-identity checks. */
function snapshotBytes(dir: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const name of readdirSync(dir)) {
    out.set(name, createHash("sha1").update(readFileSync(join(dir, name))).digest("hex"));
  }
  return out;
}

test("first write creates .portolan/chart with a sheet and a non-empty index", () => {
  const target = makeTarget();
  const result = writeChart(target, fullChart);

  expect(result.dir).toBe(chartDir(target));
  const dir = result.dir;
  const names = readdirSync(dir);
  expect(names).toContain("index.jsonl");
  expect(names).toContain(sheetFileName("web"));
  expect(names).toContain(sheetFileName("db"));
  const index = readFileSync(join(dir, "index.jsonl"), "utf8");
  expect(index.trim().length).toBeGreaterThan(0);
  expect(index.split("\n").filter((l) => l.trim()).length).toBe(fullChart.length);
});

test("readChart round-trips the written entries", () => {
  const target = makeTarget();
  writeChart(target, fullChart);
  const read = readChart(target);

  expect(read).toHaveLength(fullChart.length);
  for (const entry of fullChart) {
    const stored = read.find((e) => e.kind === entry.kind && e.id === entry.id);
    expect(stored).toBeDefined();
    expect({ ...stored, stale: undefined }).toStrictEqual({ ...entry, stale: undefined });
    expect(stored?.stale).toBe(false);
  }
});

test("writes stay inside the .portolan perimeter", () => {
  const target = makeTarget();
  mkdirSync(join(target, "services/web"), { recursive: true });
  writeFileSync(join(target, "services/web/main.ts"), "export {};\n");
  const before = snapshotTree(target);

  writeChart(target, fullChart);

  const after = snapshotTree(target);
  for (const [name, mtime] of before) {
    expect(after.get(name)).toBe(mtime); // untouched outside .portolan
  }
  for (const name of after.keys()) {
    if (!before.has(name)) {
      expect(name.startsWith(".portolan/")).toBe(true); // nothing new outside
    }
  }
});

test("sheets render behavior, related entries, and unsurveyed absence", () => {
  const target = makeTarget();
  const behaviorless: ChartEntry = { ...web, behavior: undefined, trust: "unsurveyed" };
  writeChart(target, [behaviorless, db, fairwayWebDb, lightUsers, dangerDup]);

  const sheet = readFileSync(join(chartDir(target), sheetFileName("web")), "utf8");
  expect(sheet).toContain("# Vessel web — Web frontend");
  expect(sheet).toContain("## Behavior");
  expect(sheet).toContain("Unsurveyed — no behavior recorded.");
  expect(sheet).toContain("## Fairways out");
  expect(sheet).toContain("`db` (`fairway/f-web-db`, trust: measured)");
  expect(sheet).toContain("## Lights");
  expect(sheet).toContain("`GET /api/users`");
  expect(sheet).toContain("## Dangers");
  expect(sheet).toContain("wreck — Duplicated JSON parsing");
  expect(sheet).toContain("services/web/router.ts:42");
});

const rejectionCases: Array<{ name: string; entry: Record<string, unknown> }> = [
  {
    name: "no anchors (fairway with a trust label)",
    entry: { ...fairwayWebDb, anchors: [] },
  },
  {
    name: "no trust label (vessel with anchors)",
    entry: (() => {
      const { trust: _trust, ...rest } = web as unknown as Record<string, unknown>;
      return rest;
    })(),
  },
  {
    name: "trust label outside the vocabulary",
    entry: { ...web, trust: "guessed" },
  },
  {
    name: "unknown entry kind",
    entry: { ...web, kind: "lighthouse" },
  },
];

for (const { name, entry } of rejectionCases) {
  test(`rejects a write with ${name} and persists nothing`, () => {
    const target = makeTarget();
    writeChart(target, fullChart);
    const dir = chartDir(target);
    const before = snapshotBytes(dir);

    const batch = [...fullChart, entry as unknown as ChartEntry];
    expect(() => writeChart(target, batch)).toThrow(ChartValidationError);

    expect(snapshotBytes(dir)).toStrictEqual(before);
  });
}

test("an invalid entry late in the batch leaves the old chart byte-identical", () => {
  const target = makeTarget();
  writeChart(target, fullChart);
  const dir = chartDir(target);
  const before = snapshotBytes(dir);

  const lateInvalid = [
    ...fullChart.map((e) => ({ ...e })),
    { ...lightUsers, id: "l-new" },
    { ...dangerDup, id: "d-late", anchors: [] }, // found at validation, nothing staged
  ];
  expect(() => writeChart(target, lateInvalid as ChartEntry[])).toThrow(ChartValidationError);
  expect(snapshotBytes(dir)).toStrictEqual(before);
});

test("a duplicate id found late in the batch leaves the old chart byte-identical", () => {
  const target = makeTarget();
  writeChart(target, fullChart);
  const dir = chartDir(target);
  const before = snapshotBytes(dir);

  const batch = [...fullChart, { ...lightUsers }]; // same kind + id twice
  expect(() => writeChart(target, batch)).toThrow(/duplicate chart entry id light\/l-users/);
  expect(snapshotBytes(dir)).toStrictEqual(before);
});

test("a rewritten chart retires absent vessels' sheets", () => {
  const target = makeTarget();
  writeChart(target, fullChart);
  const dir = chartDir(target);
  expect(readdirSync(dir)).toContain(sheetFileName("db"));

  writeChart(target, [web, lightUsers, dangerDup]);

  expect(readdirSync(dir)).not.toContain(sheetFileName("db"));
  expect(readChart(target)).toHaveLength(3);
});
