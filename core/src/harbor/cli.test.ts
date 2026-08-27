/**
 * Headless CLI tests — task 3.2 (propose) and night-watch tasks 2.2/2.3:
 * `core/src/harbor/cli.ts propose` with `--format chat` (deterministic
 * chat-formatted queue, golden test) and the default machine JSON; two runs
 * over an unchanged province emit identical output. `watch` end-to-end:
 * the chat-formatted watch report is golden and run-stable, a fake launcher
 * receives the brief and the report names what ran, failures keep exit 0
 * (receipted, not fatal), and bad flags exit 1. Also proves the settings
 * warnings land on stderr (stdout stays postable), a configured schedule
 * changes nothing about the queue's contents, and failures exit 1.
 * openspec/changes/harbor-master + openspec/changes/night-watch (harbor
 * capability)
 */
import { afterAll, test, expect } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { writeChart } from "../chart-store";
import type { ChartEntry } from "../types";
import { renderQueueChat } from "./chat-format";
import { computeProposals } from "./proposals";
import { settingsFile } from "./settings";

const CLI = join(import.meta.dir, "cli.ts");

const targets: string[] = [];
afterAll(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

function makeProvince(): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-harbor-cli-"));
  targets.push(target);
  mkdirSync(join(target, "apps", "api"), { recursive: true });
  writeFileSync(join(target, "apps", "api", "package.json"), '{ "name": "@prov/api" }\n');
  writeFileSync(join(target, "apps", "api", "server.ts"), "export const answer = 42;\n");
  mkdirSync(join(target, "packages", "lib", "src"), { recursive: true });
  writeFileSync(join(target, "packages", "lib", "package.json"), '{ "name": "@prov/lib" }\n');
  writeFileSync(join(target, "packages", "lib", "src", "parse.ts"), "export function parse(): string { return \"\"; }\n");
  return target;
}

const chart = (): ChartEntry[] => [
  {
    kind: "vessel",
    id: "api",
    name: "apps/api",
    paths: ["apps/api"],
    anchors: [{ type: "manifest", path: "apps/api/package.json", key: "name" }],
    trust: "charted",
  },
  {
    kind: "vessel",
    id: "lib",
    name: "packages/lib",
    behavior: "parses input",
    paths: ["packages/lib"],
    anchors: [{ type: "manifest", path: "packages/lib/package.json", key: "name" }],
    trust: "charted",
  },
  {
    kind: "light",
    id: "lib-parse",
    vessel: "lib",
    name: "export function parse()",
    anchors: [{ type: "file", path: "packages/lib/src/parse.ts", line: 1 }],
    trust: "measured",
  },
];

function runCli(target: string, ...extra: string[]) {
  return spawnSync(process.execPath, [CLI, "propose", "--target", target, ...extra], {
    encoding: "utf8",
    env: { ...process.env },
  });
}

// A province holding one proposal of every kind, in rank order:
// api drifted (repair), a new repository appeared (new-land), api has no
// behavior and no light (gap).
function richProvince(): string {
  const target = makeProvince();
  writeChart(target, chart());
  runCli(target, "--format", "chat"); // establishes the snapshot baseline
  writeFileSync(join(target, "apps", "api", "server.ts"), "export const answer = 43; // drift\n");
  mkdirSync(join(target, "vendor", "newrepo", ".git"), { recursive: true });
  writeFileSync(join(target, "vendor", "newrepo", ".git", "HEAD"), "ref: refs/heads/main\n");
  return target;
}

const GOLDEN = [
  "Portolan harbor — 3 expedition proposals for this province.",
  "",
  "1. repair — vessel api marked pending correction (sources changed under apps/api)",
  "   evidence: apps/api",
  "   scope: vessels api · 1 entries · 1 soundings",
  "2. new-land — repository vendor/newrepo is present in the province but absent from the last-survey snapshot",
  "   evidence: vendor/newrepo/.git/HEAD",
  "   scope: full survey of vendor/newrepo; no charted vessels there yet",
  "3. gap — vessel api (apps/api) has no recorded behavior and no charted light",
  "   evidence: apps/api/package.json#name",
  "   scope: vessels api · 2 entries · 2 soundings",
  "",
  "Accept or decline by number — one phrase is enough; the decision is recorded with expeditions.decide.",
  "",
].join("\n");

test("3.2 golden: --format chat renders the ranked queue deterministically", () => {
  const target = richProvince();
  const run = runCli(target, "--format", "chat");
  expect(run.status).toBe(0);
  expect(run.stderr).toBe("");
  expect(run.stdout).toBe(GOLDEN);
  // The CLI's chat output is exactly the rendering function's output.
  expect(run.stdout).toBe(renderQueueChat(computeProposals(target)));
});

test("3.2 two runs over an unchanged province emit identical output (chat and json)", () => {
  const target = richProvince();
  const chat1 = runCli(target, "--format", "chat");
  const chat2 = runCli(target, "--format", "chat");
  expect(chat2.status).toBe(0);
  expect(chat2.stdout).toBe(chat1.stdout);

  const json1 = runCli(target);
  const json2 = runCli(target);
  expect(json1.status).toBe(0);
  expect(json2.stdout).toBe(json1.stdout);
  const parsed = JSON.parse(json1.stdout) as { proposals: Array<{ kind: string }> };
  expect(parsed.proposals.map((p) => p.kind)).toEqual(["repair", "new-land", "gap"]);
});

test("3.2 a configured schedule changes nothing about the queue's contents", () => {
  const target = richProvince();
  const without = runCli(target, "--format", "chat").stdout;
  mkdirSync(join(target, ".portolan"), { recursive: true });
  writeFileSync(settingsFile(target), JSON.stringify({ harbor: { schedule: "daily 09:00" } }, null, 2) + "\n");
  const withSchedule = runCli(target, "--format", "chat");
  expect(withSchedule.status).toBe(0);
  expect(withSchedule.stdout).toBe(without);
  expect(withSchedule.stderr).toBe(""); // a valid schedule is not a warning
});

test("3.2 an empty queue prints nothing in chat mode and an empty machine queue in json", () => {
  const target = makeProvince();
  const complete = chart().map((entry) =>
    entry.kind === "vessel" && entry.id === "api" ? { ...entry, behavior: "serves requests" } : entry,
  );
  complete.push({
    kind: "light",
    id: "api-answer",
    vessel: "api",
    name: "export const answer",
    anchors: [{ type: "file", path: "apps/api/server.ts", line: 1 }],
    trust: "measured",
  });
  writeChart(target, complete);
  const chat = runCli(target, "--format", "chat");
  expect(chat.status).toBe(0);
  expect(chat.stdout).toBe("");

  const json = runCli(target);
  expect(json.status).toBe(0);
  expect(JSON.parse(json.stdout)).toEqual({ proposals: [] });
});

test("3.2 settings warnings print to stderr; stdout stays postable", () => {
  const target = richProvince();
  const clean = runCli(target, "--format", "chat").stdout;
  writeFileSync(settingsFile(target), JSON.stringify({ telemetry: true }, null, 2) + "\n");
  const run = runCli(target, "--format", "chat");
  expect(run.status).toBe(0);
  expect(run.stderr).toContain('unknown key "telemetry"');
  expect(run.stdout).toBe(clean);
});

test("3.2 failures are honest: no chart, bad format, bad usage", () => {
  const noChart = makeProvince();
  const missing = runCli(noChart, "--format", "chat");
  expect(missing.status).toBe(1);
  expect(missing.stderr).toContain("no chart index");

  const target = richProvince();
  const badFormat = runCli(target, "--format", "carrier-pigeon");
  expect(badFormat.status).toBe(1);
  expect(badFormat.stderr).toContain("--format");

  const badUsage = spawnSync(process.execPath, [CLI, "decide", "--target", target], { encoding: "utf8" });
  expect(badUsage.status).toBe(1);
  expect(badUsage.stderr).toContain("usage:");
});

// ---------------------------------------------------------------------------
// Night-watch — `watch` end-to-end through the CLI.
// ---------------------------------------------------------------------------

/** An executable fake launcher; each invocation appends the stdin brief to `<script>.log`. */
function fakeLauncher(name: string, body: string): { command: string; log: string } {
  const dir = mkdtempSync(join(tmpdir(), "portolan-cli-launcher-"));
  writeFileSync(
    join(dir, name),
    `#!/usr/bin/env bash\ncat >> ${JSON.stringify(join(dir, `${name}.log`))}\n${body}\n`,
  );
  chmodSync(join(dir, name), 0o755);
  return { command: join(dir, name), log: join(dir, `${name}.log`) };
}

function setBound(target: string, bound: number): void {
  mkdirSync(join(target, ".portolan"), { recursive: true });
  writeFileSync(
    settingsFile(target),
    `${JSON.stringify({ harbor: { auto_repair_max_vessels: bound } }, null, 2)}\n`,
  );
}

const WATCH_GOLDEN = [
  "Portolan night watch — 0 launched, 3 pending, 0 failed.",
  "",
  "policy: auto-repair bound 0 vessels — report-only (harbor.auto_repair_max_vessels unset or zero)",
  "ran:",
  "none",
  "pending:",
  "1. repair — vessel api marked pending correction (sources changed under apps/api)",
  "   evidence: apps/api",
  "   scope: vessels api · 1 entries · 1 soundings",
  "2. new-land — repository vendor/newrepo is present in the province but absent from the last-survey snapshot",
  "   evidence: vendor/newrepo/.git/HEAD",
  "   scope: full survey of vendor/newrepo; no charted vessels there yet",
  "3. gap — vessel api (apps/api) has no recorded behavior and no charted light",
  "   evidence: apps/api/package.json#name",
  "   scope: vessels api · 2 entries · 2 soundings",
  "launch failures:",
  "none",
  "",
].join("\n");

test("night-watch 2.2/2.3 watch: chat is the default format; report-only golden, run-stable", () => {
  const target = richProvince();
  const first = spawnSync(process.execPath, [CLI, "watch", "--target", target], { encoding: "utf8" });
  expect(first.status).toBe(0);
  expect(first.stderr).toBe("");
  expect(first.stdout).toBe(WATCH_GOLDEN);

  // Two runs over an unchanged province are byte-identical (the report is stable).
  const second = spawnSync(process.execPath, [CLI, "watch", "--target", target], { encoding: "utf8" });
  expect(second.status).toBe(0);
  expect(second.stdout).toBe(first.stdout);

  // The machine format parses and agrees about the counts.
  const json = spawnSync(process.execPath, [CLI, "watch", "--target", target, "--format", "json"], {
    encoding: "utf8",
  });
  expect(json.status).toBe(0);
  const parsed = JSON.parse(json.stdout) as { ran: unknown[]; pending: unknown[]; bound: number; reportOnly: boolean };
  expect(parsed).toMatchObject({ bound: 0, reportOnly: true });
  expect(parsed.ran).toHaveLength(0);
  expect(parsed.pending).toHaveLength(3);
});

test("night-watch 2.2 watch with a launcher: launches within the bound, names what ran", () => {
  const target = richProvince();
  setBound(target, 3);
  const ok = fakeLauncher("ok.sh", "exit 0");
  const run = spawnSync(
    process.execPath,
    [CLI, "watch", "--target", target, "--launcher", ok.command],
    { encoding: "utf8" },
  );
  expect(run.status).toBe(0);
  expect(run.stderr).toBe("");
  expect(run.stdout).toContain("1 launched, 2 pending, 0 failed");
  expect(run.stdout).toContain("outcome: completed");
  expect(run.stdout).toContain("pending:\n1. new-land —");
  // The launcher got exactly one brief on stdin: the province and the repair.
  const briefs = readFileSync(ok.log, "utf8").split("\n").filter((l) => l.startsWith("{"));
  expect(briefs).toHaveLength(1);
  expect(JSON.parse(briefs[0]).proposal.kind).toBe("repair");
});

test("night-watch 2.2 watch with a failing launcher: receipted in the report, exit stays 0", () => {
  const target = richProvince();
  setBound(target, 3);
  const failing = fakeLauncher("fail.sh", "exit 3");
  const run = spawnSync(
    process.execPath,
    [CLI, "watch", "--target", target, "--launcher", failing.command],
    { encoding: "utf8" },
  );
  expect(run.status).toBe(0); // the failure is named and receipted, not fatal
  expect(run.stdout).toContain("0 launched, 2 pending, 1 failed");
  expect(run.stdout).toContain("failure: launcher exited with status 3");
});

test("night-watch 2.2 watch failures are honest: no chart, bad duration, wrong-command flags", () => {
  const noChart = makeProvince();
  const missing = spawnSync(process.execPath, [CLI, "watch", "--target", noChart], { encoding: "utf8" });
  expect(missing.status).toBe(1);
  expect(missing.stderr).toContain("no chart index");

  const target = richProvince();
  setBound(target, 3);
  const ok = fakeLauncher("ok.sh", "exit 0");
  const badDuration = spawnSync(
    process.execPath,
    [CLI, "watch", "--target", target, "--launcher", ok.command, "--launcher-timeout", "soon"],
    { encoding: "utf8" },
  );
  expect(badDuration.status).toBe(1);
  expect(badDuration.stderr).toContain("--launcher-timeout");
  expect(badDuration.stderr).toContain('"soon"');

  const wrongCommand = spawnSync(
    process.execPath,
    [CLI, "propose", "--target", target, "--launcher", ok.command],
    { encoding: "utf8" },
  );
  expect(wrongCommand.status).toBe(1);
  expect(wrongCommand.stderr).toContain("watch and run commands");
});

test("harbor-run flags: missing fingerprint or launcher is a loud usage error", () => {
  const target = richProvince();
  const ok = fakeLauncher("ok.sh", "exit 0");

  const noFp = spawnSync(
    process.execPath, [CLI, "run", "--target", target, "--launcher", ok.command],
    { encoding: "utf8" },
  );
  expect(noFp.status).toBe(1);
  expect(noFp.stderr).toContain("--fingerprint is required");

  const noLauncher = spawnSync(
    process.execPath, [CLI, "run", "--target", target, "--fingerprint", "a".repeat(64)],
    { encoding: "utf8" },
  );
  expect(noLauncher.status).toBe(1);
  expect(noLauncher.stderr).toContain("--launcher is required");

  const unknown = spawnSync(
    process.execPath, [CLI, "run", "--target", target, "--fingerprint", "b".repeat(64), "--launcher", ok.command],
    { encoding: "utf8" },
  );
  expect(unknown.status).toBe(1);
  expect(unknown.stderr).toContain("names no proposal");
});

test("night-watch 3.2 --help documents the actual flags of both commands", () => {
  const run = spawnSync(process.execPath, [CLI, "--help"], { encoding: "utf8" });
  expect(run.status).toBe(0);
  const help = run.stdout;
  for (const documented of [
    "propose",
    "watch",
    "--target <province root>",
    "--format <chat|json>",
    '--launcher "<command>"',
    "--launcher-timeout <duration>",
  ]) {
    expect(help).toContain(documented);
  }
  // The default timeout the docs and code share is named in the help itself.
  expect(help).toContain("(default: 30m)");
});
