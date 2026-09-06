/**
 * External-consumer acceptance, CI leg — openspec/changes/formats-pass,
 * task 6.2 (specs/formats/spec.md, "A non-MCP consumer obtains and
 * validates the export"). The proof itself is `scripts/consume-export.ts`;
 * this test only pins it into the suite so CI runs the proof on every
 * change: the script must exit 0 with a plain subprocess invocation from
 * an arbitrary working directory (the temp dir here stands in for the
 * clean directory; the script resolves the repo root from its own
 * location, never from cwd).
 */
import { test, expect } from "bun:test";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(import.meta.dir, "consume-export.ts");

test("the external-consumer acceptance script exits 0 from a foreign working directory", () => {
  const run = spawnSync(process.execPath, [SCRIPT], {
    encoding: "utf8",
    cwd: tmpdir(), // not the repo: nothing may depend on where it is run from
  });
  expect(run.stdout, "the script speaks on stdout when it passes").toContain("ok:");
  expect(run.status, `the script failed: ${run.stderr}`).toBe(0);
});
