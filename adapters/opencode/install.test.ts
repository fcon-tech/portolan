/**
 * opencode installer acceptance tests — openspec/changes/distribution-pass
 * ("The install path is registry-based"):
 *
 * - "The installer works without a clone": the written launch line resolves
 *   the published package — it contains `bunx`, `portolan`, `serve`, and
 *   `--target` — and carries NO reference to the repository clone path.
 * - (preserved behavior, design.md decision 5) user comments in a
 *   pre-existing JSONC config survive verbatim — the JSONC text surgery
 *   stays.
 *
 * RED until task 5.2 switches install.ts off REPO_ROOT.
 */
import { afterAll, test, expect } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const REPO_ROOT = resolve(import.meta.dir, "..", "..");
const INSTALLER = join(REPO_ROOT, "adapters", "opencode", "install.ts");

const dirs: string[] = [];
afterAll(() => {
  while (dirs.length > 0) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

function tempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  dirs.push(dir);
  return dir;
}

function runInstaller(target: string, config: string): ReturnType<typeof spawnSync> {
  return spawnSync(process.execPath, [INSTALLER, "--target", target, "--config", config], {
    encoding: "utf8",
  });
}

// Scenario: The installer works without a clone
test("the installer writes a bunx portolan serve launch line with no repo path", () => {
  const province = tempDir("portolan-installer-prov-");
  const configDir = tempDir("portolan-installer-cfg-");
  const config = join(configDir, "opencode.jsonc");

  const run = runInstaller(province, config);
  expect(run.status).toBe(0);

  const text = readFileSync(config, "utf8");
  for (const token of ["bunx", "portolan", "serve", "--target"]) {
    expect(text).toContain(token);
  }
  // No clone dependency: the repository root must not appear anywhere.
  expect(text).not.toContain(REPO_ROOT);
});

// Preserved behavior (design.md decision 5): JSONC surgery keeps comments.
test("user comments in a pre-existing JSONC config survive the install verbatim", () => {
  const province = tempDir("portolan-installer-prov2-");
  const configDir = tempDir("portolan-installer-cfg2-");
  const config = join(configDir, "opencode.jsonc");
  const comment = "// my personal tuning, do not reformat";
  writeFileSync(
    config,
    `{\n  ${comment}\n  "$schema": "https://opencode.ai/config.json",\n  "theme": "paper"\n}\n`,
  );

  const run = runInstaller(province, config);
  expect(run.status).toBe(0);

  const text = readFileSync(config, "utf8");
  expect(text).toContain(comment);
  expect(text).toContain('"theme": "paper"');
  // The portolan block landed too.
  expect(text).toContain('"portolan"');
});
