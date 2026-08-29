/**
 * The rollback branch of writeFilesAtomically: a rename that fails partway
 * through the replace phase must leave every previous file byte-identical
 * and no .tmp-/.bak- litter behind. The sabotage needs mock.module over
 * node:fs, which must not run inside the shared test runner's registry (it
 * deadlocked the full suite) — so the scenario executes in a child process
 * (chart-io.rollback-fixture.ts) and the test asserts on its printed state.
 */
import { test, expect, afterEach } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const FIXTURE = join(import.meta.dir, "chart-io.rollback-fixture.ts");

const dirs: string[] = [];
afterEach(() => {
  while (dirs.length > 0) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

interface FixtureState {
  threw: string | null;
  ls: string[];
  contents: Record<string, string>;
}

function runFixture(sabotageAt: number): FixtureState {
  const dir = mkdtempSync(join(tmpdir(), "portolan-chart-rollback-"));
  dirs.push(dir);
  const run = spawnSync(process.execPath, [FIXTURE, dir, String(sabotageAt)], {
    encoding: "utf8",
  });
  if (run.status !== 0) {
    throw new Error(`fixture failed: ${run.stderr}`);
  }
  const state = JSON.parse(run.stdout) as FixtureState;
  expect(state.ls).not.toContain("c.md"); // sanity: fixture really ran
  return state;
}

test("a rename failure partway rolls every file back byte-identical", () => {
  // a.md placed (renames 1-2); b.md's backup taken (rename 3 sabotaged),
  // nothing of b.md/c.md ever landed.
  const state = runFixture(3);
  expect(state.threw).toMatch(/sabotaged rename/);
  expect(state.contents["a.md"]).toBe("old a\n");
  expect(state.contents["b.md"]).toBe("old b\n");
  expect(state.ls).toEqual(["a.md", "b.md"]);
});

test("a failure during the very first rename leaves everything untouched", () => {
  const state = runFixture(1);
  expect(state.threw).toMatch(/sabotaged rename/);
  expect(state.contents["a.md"]).toBe("old a\n");
  expect(state.contents["b.md"]).toBe("old b\n");
  expect(state.ls).toEqual(["a.md", "b.md"]);
});
