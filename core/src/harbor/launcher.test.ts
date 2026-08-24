/**
 * Launcher unit tests — night-watch task 2.1: the external-launcher spawn
 * mechanics with fake launchers (ok / non-zero / hang-timeout). The brief
 * must reach the launcher as JSON on stdin; exit codes propagate; a stuck
 * launcher is killed at the cap and named. The full failure path (history
 * launch-failed, proposal stays queued, report names it) lives in
 * watch.test.ts — this file proves the spawn contract itself.
 * openspec/changes/night-watch (harbor capability: the launcher is
 * external and swappable)
 */
import { afterAll, test, expect } from "bun:test";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  DEFAULT_LAUNCHER_TIMEOUT_MS,
  formatDuration,
  launchExpedition,
  parseDurationMs,
  splitCommand,
  type LaunchBrief,
} from "./launcher";

const dirs: string[] = [];
afterAll(() => {
  while (dirs.length > 0) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

/** An executable fake launcher; whatever it reads from stdin is appended to `<script>.log`. */
function fakeLauncher(name: string, body: string): { command: string; log: string } {
  const dir = mkdtempSync(join(tmpdir(), "portolan-launcher-"));
  dirs.push(dir);
  const script = join(dir, name);
  const log = `${script}.log`;
  writeFileSync(script, `#!/usr/bin/env bash\ncat >> ${JSON.stringify(log)}\n${body}\n`);
  chmodSync(script, 0o755);
  return { command: script, log };
}

const brief: LaunchBrief = {
  target: "/tmp/a-province",
  proposal: {
    kind: "repair",
    fingerprint: "f1",
    summary: "vessel api marked pending correction",
    evidence: ["vessel/api"],
    anchors: [{ type: "file", path: "apps/api" }],
    scope: { vessels: ["api"], entries: 1, soundings: 1 },
  },
};

test("night-watch 2.1 ok launcher: exit 0, and the JSON brief arrives on stdin", async () => {
  const { command, log } = fakeLauncher("ok.sh", "exit 0");
  const result = await launchExpedition({ launcher: command, brief, timeoutMs: 10_000 });
  expect(result).toEqual({ ok: true });
  const received = JSON.parse(readFileSync(log, "utf8"));
  expect(received).toEqual(brief);
  expect(received.proposal.kind).toBe("repair");
});

test("night-watch 2.1 failing launcher: a non-zero exit is the failure reason", async () => {
  const { command, log } = fakeLauncher("fail.sh", "exit 3");
  const result = await launchExpedition({ launcher: command, brief, timeoutMs: 10_000 });
  expect(result).toEqual({ ok: false, reason: "launcher exited with status 3" });
  // It still got the brief before failing.
  expect(readFileSync(log, "utf8").length).toBeGreaterThan(0);
});

test("night-watch 2.1 hanging launcher: killed at the timeout cap and named", async () => {
  const { command } = fakeLauncher("hang.sh", "sleep 30");
  const started = Date.now();
  const result = await launchExpedition({ launcher: command, brief, timeoutMs: 250 });
  expect(Date.now() - started).toBeLessThan(5000); // the cap holds; no 30s burn
  expect(result).toEqual({ ok: false, reason: "launcher timed out after 250ms and was killed" });
});

test("night-watch 2.1 a launcher that cannot spawn fails with a named reason", async () => {
  const result = await launchExpedition({
    launcher: "/no/such/launcher-anywhere",
    brief,
    timeoutMs: 1000,
  });
  expect(result.ok).toBe(false);
  expect(result.reason).toContain("could not be spawned");
  expect(await launchExpedition({ launcher: "   ", brief, timeoutMs: 1000 })).toEqual({
    ok: false,
    reason: "no launcher command given",
  });
});

test("night-watch 2.1 splitCommand: quoted segments survive, plain words split", () => {
  expect(splitCommand("bash /path/x.sh")).toEqual(["bash", "/path/x.sh"]);
  expect(splitCommand('bash "/path/with spaces/x.sh" --flag')).toEqual([
    "bash",
    "/path/with spaces/x.sh",
    "--flag",
  ]);
  expect(splitCommand("sh '/tmp/a b.sh'")).toEqual(["sh", "/tmp/a b.sh"]);
  expect(splitCommand("   ")).toEqual([]);
});

test("night-watch 2.1 parseDurationMs: units, bare seconds, default, rejection", () => {
  expect(parseDurationMs("45s")).toBe(45_000);
  expect(parseDurationMs("30m")).toBe(DEFAULT_LAUNCHER_TIMEOUT_MS);
  expect(parseDurationMs("1h")).toBe(3_600_000);
  expect(parseDurationMs("250ms")).toBe(250);
  expect(parseDurationMs("10")).toBe(10_000);
  expect(formatDuration(250)).toBe("250ms");
  expect(formatDuration(45_000)).toBe("45s");
  expect(formatDuration(DEFAULT_LAUNCHER_TIMEOUT_MS)).toBe("30m");
  expect(formatDuration(7_200_000)).toBe("2h");
  for (const bad of ["", "soon", "0", "-5m", "10x"]) {
    expect(() => parseDurationMs(bad)).toThrow(/--launcher-timeout/);
  }
});
