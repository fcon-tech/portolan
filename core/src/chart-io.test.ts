/**
 * writeFilesAtomically contract (chart-store design.md, decision 4): a
 * multi-file write persists completely or leaves the previous chart
 * byte-identical. The preflight branch is proven here against the real fs;
 * the mid-rename rollback branch lives in chart-io.rollback.test.ts (it
 * needs a sabotaged renameSync, which requires a module mock).
 */
import { test, expect, afterEach } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFilesAtomically } from "./chart-io";

const dirs: string[] = [];
afterEach(() => {
  while (dirs.length > 0) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

test("preflight refuses a non-file target before any original is touched", () => {
  const dir = mkdtempSync(join(tmpdir(), "portolan-chart-io-"));
  dirs.push(dir);
  writeFileSync(join(dir, "a.md"), "original a\n");
  // A directory squats on the second target name.
  mkdirSync(join(dir, "b.md"));

  const files = new Map<string, string>([
    ["a.md", "new a\n"],
    ["b.md", "new b\n"],
  ]);
  expect(() => writeFilesAtomically(dir, files)).toThrow(/not a regular file/);

  // The original file is untouched, the squatted directory still stands,
  // and no staged temp was left behind.
  expect(readFileSync(join(dir, "a.md"), "utf8")).toBe("original a\n");
  expect(readdirSync(dir).filter((n) => n.includes(".tmp-"))).toEqual([]);
  expect(statSync(join(dir, "b.md")).isDirectory()).toBe(true);
});
