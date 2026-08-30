/**
 * The opencode expedition-launcher adapter test — night-watch task 3.1
 * (specs delta: "The opencode adapter ships a working launcher"). A fake
 * `opencode` is prepended to PATH (shadowing any real one), and the test
 * proves the launcher's whole contract: it reads the JSON brief on stdin,
 * renders the repair prompt (proposal kind/evidence/scope, province, skill
 * path, perimeter, one-phrase scope), runs `opencode run --pure -m
 * $PORTOLAN_MODEL` with cwd = the province, and propagates opencode's exit
 * status. Nothing else — the adapter adds no logic, and the adapter
 * boundary check (adapter-boundary.test.ts) keeps it that way.
 * openspec/changes/night-watch (harbor capability: the launcher is
 * external and swappable)
 */
import { afterAll, test, expect } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const REPO_ROOT = join(import.meta.dir, "..", "..");
const EXPEDITION_LAUNCHER = join(REPO_ROOT, "adapters", "opencode", "expedition-launcher");
const SKILL_PATH = join(REPO_ROOT, "skill", "SKILL.md");

const dirs: string[] = [];
afterAll(() => {
  while (dirs.length > 0) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

/** The brief the night watch would send for one drifted vessel. */
function brief(target: string, kind = "repair"): string {
  return JSON.stringify({
    target,
    proposal: {
      kind,
      fingerprint: "f1",
      summary: "vessel api marked pending correction (sources changed under apps/api)",
      evidence: kind === "repair" ? ["vessel/api"] : ["adapters/x.ts:1"],
      anchors: [{ type: "file", path: "apps/api" }],
      scope: { vessels: ["api"], entries: 3, soundings: 3 },
    },
  });
}

/**
 * A fake `opencode` in its own bin dir: it records cwd, the model flag, and
 * every argument to a log, then exits with `exitCode`.
 */
function fakeOpencode(exitCode: number): { binDir: string; log: string } {
  const dir = mkdtempSync(join(tmpdir(), "portolan-fake-opencode-"));
  dirs.push(dir);
  const binDir = join(dir, "bin");
  const log = join(dir, "opencode.log");
  mkdirSync(binDir);
  writeFileSync(
    join(binDir, "opencode"),
    [
      "#!/usr/bin/env bash",
      "{",
      '  printf "cwd=%s\\n" "$PWD"',
      "  i=1",
      '  for a in "$@"; do printf "arg%d=%s\\n" "$i" "$a"; i=$((i+1)); done',
      `} >> ${JSON.stringify(log)}`,
      `exit ${exitCode}`,
      "",
    ].join("\n"),
  );
  chmodSync(join(binDir, "opencode"), 0o755);
  return { binDir, log };
}

/** The parent environment with PATH entries prepended (fake opencode shadows any real one). */
function envWithPaths(...prepend: string[]): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) env[key] = value;
  }
  env.PATH = `${prepend.join(":")}:${env.PATH ?? ""}`;
  return env;
}

function runLauncher(input: string, env: Record<string, string>) {
  return spawnSync("bash", [EXPEDITION_LAUNCHER], { encoding: "utf8", input, env });
}

function loggedArgs(log: string): Record<string, string> {
  const text = readFileSync(log, "utf8");
  const entries: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const eq = line.indexOf("=");
    if (eq > 0 && /^arg\d+$|^cwd$/.test(line.slice(0, eq))) entries[line.slice(0, eq)] = line.slice(eq + 1);
  }
  // The prompt is the last argument and spans lines: take the raw remainder.
  const marker = text.indexOf("arg5=");
  if (marker !== -1) entries.arg5 = text.slice(marker + "arg5=".length);
  return entries;
}

test("night-watch 3.1 the launcher renders the repair prompt and runs opencode in the province", () => {
  const province = mkdtempSync(join(tmpdir(), "portolan-launcher-province-"));
  dirs.push(province);
  const { binDir, log } = fakeOpencode(0);

  const run = runLauncher(brief(province), envWithPaths(binDir));
  expect(run.status).toBe(0);

  const args = loggedArgs(log);
  // cwd = the province from the brief, not wherever the launcher ran from.
  expect(args.cwd).toBe(province);
  // The exact harness call: opencode run --pure -m <model> <prompt>.
  expect(args.arg1).toBe("run");
  expect(args.arg2).toBe("--pure");
  expect(args.arg3).toBe("-m");
  expect(args.arg4).toBe("zai-coding-plan/glm-5.3"); // the default model

  // The rendered prompt reached the fake with everything the Cartographer needs.
  const prompt = args.arg5 ?? "";
  expect(prompt).toContain("Portolan night watch — repair expedition for the Cartographer.");
  expect(prompt).toContain(`Province: ${province}`);
  expect(prompt).toContain("Proposal kind: repair");
  expect(prompt).toContain("- vessel/api");
  expect(prompt).toContain("vessels api · 3 entries · 3 soundings");
  expect(prompt).toContain("Summary: vessel api marked pending correction");
  expect(prompt).toContain(`Method: ${SKILL_PATH}`);
  expect(prompt).toContain("Perimeter: never modify anything outside .portolan/ in the province.");
  expect(prompt).toContain("Scope: do only what the proposal names — nothing else.");
});

test("night-watch 3.1 a non-repair launch names its own kind, not repair", () => {
  const province = mkdtempSync(join(tmpdir(), "portolan-launcher-gap-"));
  dirs.push(province);
  const { binDir, log } = fakeOpencode(0);

  const run = runLauncher(brief(province, "gap"), envWithPaths(binDir));
  expect(run.status).toBe(0);

  const prompt = loggedArgs(log).arg5 ?? "";
  expect(prompt).toContain("Portolan expedition — gap expedition for the Cartographer.");
  expect(prompt).not.toContain("night watch");
  expect(prompt).toContain("Proposal kind: gap");
});

test("night-watch 3.1 PORTOLAN_MODEL overrides the default model", () => {
  const province = mkdtempSync(join(tmpdir(), "portolan-launcher-model-"));
  dirs.push(province);
  const { binDir, log } = fakeOpencode(0);
  const env = envWithPaths(binDir);
  env.PORTOLAN_MODEL = "other/cartographer-2";
  const run = runLauncher(brief(province), env);
  expect(run.status).toBe(0);
  expect(loggedArgs(log).arg4).toBe("other/cartographer-2");
});

test("night-watch 3.1 the launcher propagates opencode's exit status", () => {
  const province = mkdtempSync(join(tmpdir(), "portolan-launcher-exit-"));
  dirs.push(province);
  const failing = fakeOpencode(7);
  expect(runLauncher(brief(province), envWithPaths(failing.binDir)).status).toBe(7);
  const ok = fakeOpencode(0);
  expect(runLauncher(brief(province), envWithPaths(ok.binDir)).status).toBe(0);
});

test("night-watch 3.1 without opencode on PATH the launcher fails (nothing silently skipped)", () => {
  const province = mkdtempSync(join(tmpdir(), "portolan-launcher-missing-"));
  dirs.push(province);
  // A PATH with bun but provably no opencode — not even the real one.
  const binDir = mkdtempSync(join(tmpdir(), "portolan-launcher-bin-"));
  dirs.push(binDir);
  symlinkSync(process.execPath, join(binDir, "bun"));
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && key !== "PATH") env[key] = value;
  }
  env.PATH = binDir;

  const run = runLauncher(brief(province), env);
  expect(run.status).not.toBe(0);
});
