/**
 * The rollback branch of writeFilesAtomically: a rename that fails partway
 * through the replace phase must leave every previous file byte-identical
 * and no .tmp-/.bak- litter behind. Needs a sabotaged renameSync, so the
 * module mock lives in this file alone — kept separate from the real-fs
 * preflight test in chart-io.test.ts.
 */
import { test, expect, mock, afterEach } from "bun:test";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const real = await import("node:fs");
let renameCalls = 0;
let sabotageAt = -1;
mock.module("node:fs", () => ({
  ...real,
  renameSync: (from: string, to: string) => {
    renameCalls += 1;
    if (renameCalls === sabotageAt) throw new Error("sabotaged rename (simulated ENOSPC)");
    return real.renameSync(from, to);
  },
}));

const { writeFilesAtomically } = await import("./chart-io");

const dirs: string[] = [];
afterEach(() => {
  while (dirs.length > 0) rmSync(dirs.pop() as string, { recursive: true, force: true });
  renameCalls = 0;
  sabotageAt = -1;
});

test("a rename failure partway rolls every file back byte-identical", () => {
  const dir = mkdtempSync(join(tmpdir(), "portolan-chart-rollback-"));
  dirs.push(dir);
  writeFileSync(join(dir, "a.md"), "old a\n");
  writeFileSync(join(dir, "b.md"), "old b\n");
  // c.md is new; a.md and b.md exist, so each of their replaces costs two
  // renames (final→bak, tmp→final). Sabotage the third call: a.md is fully
  // placed, b.md's backup was taken, nothing of b.md/c.md landed.
  sabotageAt = 3;

  const files = new Map<string, string>([
    ["a.md", "new a\n"],
    ["b.md", "new b\n"],
    ["c.md", "new c\n"],
  ]);
  expect(() => writeFilesAtomically(dir, files)).toThrow(/sabotaged rename/);

  expect(readFileSync(join(dir, "a.md"), "utf8")).toBe("old a\n");
  expect(readFileSync(join(dir, "b.md"), "utf8")).toBe("old b\n");
  expect(real.existsSync(join(dir, "c.md"))).toBe(false);
  const litter = readdirSync(dir).filter((n) => n.includes(".tmp-") || n.includes(".bak-"));
  expect(litter).toEqual([]);
});

test("a failure during the very first rename leaves everything untouched", () => {
  const dir = mkdtempSync(join(tmpdir(), "portolan-chart-rollback-"));
  dirs.push(dir);
  writeFileSync(join(dir, "a.md"), "old a\n");
  sabotageAt = 1;

  const files = new Map<string, string>([
    ["a.md", "new a\n"],
    ["b.md", "new b\n"],
  ]);
  expect(() => writeFilesAtomically(dir, files)).toThrow(/sabotaged rename/);

  expect(readFileSync(join(dir, "a.md"), "utf8")).toBe("old a\n");
  expect(real.existsSync(join(dir, "b.md"))).toBe(false);
  expect(readdirSync(dir).filter((n) => n.includes(".tmp-") || n.includes(".bak-"))).toEqual([]);
});
