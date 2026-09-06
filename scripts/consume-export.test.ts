/**
 * External-consumer acceptance, CI leg — openspec/changes/formats-pass,
 * task 6.2 (specs/formats/spec.md, "A non-MCP consumer obtains and
 * validates the export"). The proof itself is `scripts/consume-export.ts`;
 * this test only pins it into the suite so CI runs the proof on every
 * change. It runs the script as a plain subprocess from an arbitrary
 * working directory (the temp dir here stands in for the clean directory;
 * the script resolves the repo root from its own location, never from
 * cwd), against a provisioned fixture province — the proof must not
 * depend on this checkout having its own survey (.portolan/ is untracked).
 */
import { test, expect } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeChart } from "../core/src/chart-store";

const SCRIPT = join(import.meta.dir, "consume-export.ts");
// The province is this repo's own survey (.portolan/ is not tracked): the
// default-target scenario runs where a survey exists and skips honestly
// elsewhere (the same convention core/src/formats.test.ts uses).
const provinceIndexPath = join(import.meta.dir, "..", ".portolan", "chart", "index.jsonl");
const hasProvince = existsSync(provinceIndexPath);

function runScript(args: string[]): { stdout: string; stderr: string; status: number | null } {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: "utf8",
    cwd: tmpdir(), // not the repo: nothing may depend on where it is run from
  });
}

test("the external-consumer acceptance script consumes a provisioned fixture province: exit 0, self-description on stdout", () => {
  const target = mkdtempSync(join(tmpdir(), "portolan-consume-"));
  try {
    // A minimal charted province (core/src/chart-store.ts writeChart; a
    // vessel's paths need not exist on disk — an empty tree signature is
    // stable).
    writeChart(target, [
      {
        kind: "vessel",
        id: "port",
        name: "port",
        paths: ["port"],
        anchors: [{ type: "file", path: "port/port.ts", line: 1 }],
        trust: "charted",
      },
    ]);
    const run = runScript([target]); // the target is the script's argv[2]
    expect(run.stdout, "the script speaks on stdout when it passes").toContain("ok:");
    expect(run.status, `the script failed: ${run.stderr}`).toBe(0);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test.skipIf(!hasProvince)(
  "the external-consumer acceptance script consumes this repo's own province by default",
  () => {
    const run = runScript([]); // no target: the default (the repo province)
    expect(run.stdout, "the script speaks on stdout when it passes").toContain("ok:");
    expect(run.status, `the script failed: ${run.stderr}`).toBe(0);
  },
);
