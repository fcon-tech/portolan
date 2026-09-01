/**
 * Manual-run tests (harbor-run tasks 1.1 + 2.1): the Governor names one
 * fingerprint and that expedition — any kind — launches through the
 * external launcher; input faults are loud and write nothing; a launcher
 * failure is receipted (launch-failed by: governor, the latest word) and
 * the proposal stays queued; the chat report is deterministic bytes.
 * openspec/changes/harbor-run (harbor capability: the Governor can launch
 * one proposal by hand / a manual run is attributed and failure-safe)
 */
import { afterAll, test, expect } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { writeChart } from "../chart-store";
import type { ChartEntry } from "../types";
import { renderRunChat } from "./chat-format";
import { computeProposals, type Proposal } from "./proposals";
import { readHistory } from "./history";
import { runProposal } from "./run";
import { HarborError } from "./errors";

const dirs: string[] = [];
afterAll(() => {
  while (dirs.length > 0) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

// The fixture: one vessel with a manifest but NO behavior and NO light —
// that gap is exactly what a manual run exists to launch.
function makeProvince(): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-run-"));
  dirs.push(target);
  mkdirSync(join(target, "apps/api"), { recursive: true });
  writeFileSync(join(target, "apps/api/package.json"), `${JSON.stringify({ name: "@prov/api" }, null, 2)}\n`);
  writeFileSync(join(target, "apps/api/server.ts"), "export const answer = 42;\n");
  return target;
}

function gapChart(): ChartEntry[] {
  return [
    {
      kind: "vessel",
      id: "api",
      name: "apps/api",
      paths: ["apps/api"],
      anchors: [{ type: "manifest", path: "apps/api/package.json", key: "name" }],
      trust: "charted",
    },
  ];
}

function fakeLauncher(name: string, body: string): string {
  const dir = join(mkdtempSync(join(tmpdir(), `portolan-launcher-${name}-`)), `${name}.sh`);
  dirs.push(dirname(dir));
  writeFileSync(dir, `#!/usr/bin/env bash\ncat >/dev/null\n${body}\n`);
  chmodSync(dir, 0o755);
  return dir;
}

test("a named gap proposal launches end-to-end and the acceptance is attributed to the governor", async () => {
  const target = makeProvince();
  writeChart(target, gapChart());
  const { proposals } = computeProposals(target);
  const gap = proposals.find((p) => p.kind === "gap");
  expect(gap).toBeDefined();

  const ok = fakeLauncher("ok", "exit 0");
  const report = await runProposal(target, { fingerprint: gap!.fingerprint, launcher: ok });

  expect(report.outcome).toBe("completed");
  expect(report.proposal.kind).toBe("gap");
  expect(report.proposal.fingerprint).toBe(gap!.fingerprint);
  const history = readHistory(target);
  const last = history[history.length - 1];
  expect(last).toMatchObject({ fingerprint: gap!.fingerprint, decision: "accepted", by: "governor" });
});

test("an unknown fingerprint is a loud input error that writes nothing", async () => {
  const target = makeProvince();
  writeChart(target, gapChart());
  const ok = fakeLauncher("ok2", "exit 0");
  await expect(
    runProposal(target, { fingerprint: "deadbeef".repeat(8), launcher: ok }),
  ).rejects.toThrow(HarborError);
  await expect(
    runProposal(target, { fingerprint: "deadbeef".repeat(8), launcher: ok }),
  ).rejects.toThrow(/names no proposal/);
  expect(readHistory(target)).toHaveLength(0);
});

test("a missing launcher is rejected before any history write", async () => {
  const target = makeProvince();
  writeChart(target, gapChart());
  const { proposals } = computeProposals(target);
  const gap = proposals.find((p) => p.kind === "gap")!;
  await expect(
    runProposal(target, { fingerprint: gap.fingerprint, launcher: "" }),
  ).rejects.toThrow(/--launcher is required/);
  expect(readHistory(target)).toHaveLength(0);
});

test("a failing launcher records launch-failed by the governor and the proposal stays queued", async () => {
  const target = makeProvince();
  writeChart(target, gapChart());
  const { proposals } = computeProposals(target);
  const gap = proposals.find((p) => p.kind === "gap")!;
  const boom = fakeLauncher("fail", "exit 3");

  const report = await runProposal(target, { fingerprint: gap.fingerprint, launcher: boom });
  expect(report.outcome).toBe("launch-failed");
  expect(report.reason).toMatch(/status 3/);

  const history = readHistory(target);
  expect(history).toHaveLength(2);
  expect(history[0]).toMatchObject({ decision: "accepted", by: "governor" });
  expect(history[1]).toMatchObject({ outcome: "launch-failed", by: "governor", fingerprint: gap.fingerprint });

  // The failure is the latest word → the gap is still proposed.
  const after = computeProposals(target);
  expect(after.proposals.some((p) => p.kind === "gap" && p.fingerprint === gap.fingerprint)).toBe(true);
});

test("the chat report renders deterministic bytes for both outcomes", () => {
  const proposal: Proposal = {
    kind: "gap",
    summary: "vessel api (apps/api) has no recorded behavior and no charted light",
    evidence: [],
    anchors: [{ type: "file", path: "apps/api/package.json" }],
    scope: { vessels: ["api"], entries: 2, soundings: 2 },
    fingerprint: "a".repeat(64),
  };
  const done = renderRunChat({ proposal, outcome: "completed", launcherCommand: "bash /x/launcher.sh" });
  const failed = renderRunChat({ proposal, outcome: "launch-failed", reason: "exit 3", launcherCommand: "bash /x/launcher.sh" });
  expect(done).toContain("by the Governor's hand");
  expect(done).toContain("outcome: completed");
  expect(done).toContain("launcher: bash");
  expect(failed).toContain("outcome: launch-failed (exit 3)");
  expect(failed).toContain("stays queued");
  expect(renderRunChat({ proposal, outcome: "completed", launcherCommand: "bash /x/launcher.sh" })).toEqual(done);
});
