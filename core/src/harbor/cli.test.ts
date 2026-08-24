/**
 * Headless CLI tests — task 3.2: `core/src/harbor/cli.ts propose` with
 * `--format chat` (deterministic chat-formatted queue, golden test) and the
 * default machine JSON; two runs over an unchanged province emit identical
 * output. Also proves the settings warnings land on stderr (stdout stays
 * postable), an empty queue prints nothing in chat mode, a configured
 * schedule changes nothing about the queue's contents, and failures exit 1.
 * openspec/changes/harbor-master (harbor capability)
 */
import { afterAll, test, expect } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
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
