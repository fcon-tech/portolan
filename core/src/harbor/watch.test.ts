/**
 * Night-watch end-to-end tests — tasks 2.2 and 2.3 at the runWatch level
 * (queue → policy → launcher → history → report), one test per delta
 * scenario, plus the chat renderer's golden test (ran/pending/failed
 * sections, deterministic bytes). Fake launchers stand in for the adapter:
 * ok (exit 0), fail (exit 3), and hang (killed at the cap).
 * openspec/changes/night-watch (harbor capability: the night watch acts
 * only on invocation / auto-repair is bounded and never curious / the
 * launcher is external and swappable / night actions are recorded / the
 * watch report is chat-formatted and deterministic)
 */
import { afterAll, test, expect } from "bun:test";
import {
  appendFileSync,
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { writeChart } from "../chart-store";
import type { ChartEntry } from "../types";
import { renderWatchChat } from "./chat-format";
import { computeProposals } from "./proposals";
import { settingsFile } from "./settings";
import { readHistory } from "./history";
import { runWatch, type WatchReport } from "./watch";

const dirs: string[] = [];
afterAll(() => {
  while (dirs.length > 0) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// The fixture province (same shape as harbor.test.ts): two vessels, each
// with a manifest and one source file.
// ---------------------------------------------------------------------------

function makeProvince(): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-night-"));
  dirs.push(target);
  for (const [dir, file, pkg] of [
    ["apps/api", "server.ts", "@prov/api"],
    ["packages/lib", "src/parse.ts", "@prov/lib"],
  ] as const) {
    mkdirSync(join(target, dir), { recursive: true });
    writeFileSync(join(target, dir, "package.json"), `${JSON.stringify({ name: pkg }, null, 2)}\n`);
    mkdirSync(dirname(join(target, dir, file)), { recursive: true });
    writeFileSync(
      join(target, dir, file),
      dir === "apps/api" ? "export const answer = 42;\n" : "export function parse(): string { return \"\"; }\n",
    );
  }
  return target;
}

const manifestAnchor = (dir: string) => ({ type: "manifest" as const, path: `${dir}/package.json`, key: "name" });

/** A complete chart: both vessels have behavior and a light. */
function completeChart(): ChartEntry[] {
  return [
    {
      kind: "vessel",
      id: "api",
      name: "apps/api",
      behavior: "serves requests",
      paths: ["apps/api"],
      anchors: [manifestAnchor("apps/api")],
      trust: "charted",
    },
    {
      kind: "vessel",
      id: "lib",
      name: "packages/lib",
      behavior: "parses input",
      paths: ["packages/lib"],
      anchors: [manifestAnchor("packages/lib")],
      trust: "charted",
    },
    {
      kind: "light",
      id: "api-answer",
      vessel: "api",
      name: "export const answer",
      anchors: [{ type: "file", path: "apps/api/server.ts", line: 1 }],
      trust: "measured",
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
}

/** An executable fake launcher; each invocation appends the stdin brief to `<script>.log`. */
function fakeLauncher(name: string, body: string): { command: string; log: string } {
  const dir = mkdtempSync(join(tmpdir(), "portolan-night-launcher-"));
  dirs.push(dir);
  const script = join(dir, name);
  const log = `${script}.log`;
  writeFileSync(script, `#!/usr/bin/env bash\ncat >> ${JSON.stringify(log)}\n${body}\n`);
  chmodSync(script, 0o755);
  return { command: script, log };
}

/** Count how many times a fake launcher ran (one logged brief per invocation). */
function invocations(log: string): number {
  if (!existsSync(log)) return 0; // a launcher never invoked logs nothing
  return readFileSync(log, "utf8")
    .split("\n")
    .filter((line) => line.trim().length > 0 && line.startsWith("{")).length;
}

function setBound(target: string, bound: number): void {
  mkdirSync(join(target, ".portolan"), { recursive: true });
  writeFileSync(
    settingsFile(target),
    `${JSON.stringify({ harbor: { auto_repair_max_vessels: bound } }, null, 2)}\n`,
  );
}

/** A drifted province with one pending-correction vessel (api) and the bound set. */
function driftedProvince(bound: number): { target: string; fingerprint: string } {
  const target = makeProvince();
  writeChart(target, completeChart());
  const [baseline] = computeProposals(target).proposals; // establishes the snapshot
  expect(baseline).toBeUndefined();
  appendFileSync(join(target, "apps/api/server.ts"), "\n// a later edit\n");
  setBound(target, bound);
  const [repair] = computeProposals(target).proposals;
  expect(repair.kind).toBe("repair");
  return { target, fingerprint: repair.fingerprint };
}

// ---------------------------------------------------------------------------
// Scenario: An invoked watch reports and acts — and a night repair is
// attributable (acceptance by night-watch; the repaired fingerprint leaves
// the queue; the next watch runs nothing).
// ---------------------------------------------------------------------------

test("night-watch 2.2 an invoked watch launches the in-bound repair and names what ran", async () => {
  const { target, fingerprint } = driftedProvince(3);
  const ok = fakeLauncher("ok.sh", "exit 0");

  const report = await runWatch(target, { launcher: ok.command, launcherTimeoutMs: 10_000 });
  expect(report.reportOnly).toBe(false);
  expect(report.ran).toHaveLength(1);
  expect(report.ran[0].outcome).toBe("completed");
  expect(report.pending).toEqual([]);
  const chat = renderWatchChat(report);
  expect(chat).toContain("1 launched, 0 pending, 0 failed");
  expect(chat).toContain("repair — vessel api marked pending correction");
  expect(chat).toContain("outcome: completed");

  // The launcher got exactly one brief: the province and the repair proposal.
  expect(invocations(ok.log)).toBe(1);
  const brief = JSON.parse(readFileSync(ok.log, "utf8"));
  expect(brief.target).toBe(target);
  expect(brief.proposal.kind).toBe("repair");
  expect(brief.proposal.fingerprint).toBe(fingerprint);

  // History: the acceptance is attributed to the night watch.
  const history = readHistory(target);
  expect(history).toHaveLength(1);
  expect(history[0]).toMatchObject({ fingerprint, decision: "accepted", by: "night-watch" });
});

test("night-watch 2.2 a night repair is attributable and leaves the queue once the chart heals", async () => {
  const { target, fingerprint } = driftedProvince(3);
  const ok = fakeLauncher("ok.sh", "exit 0");
  await runWatch(target, { launcher: ok.command, launcherTimeoutMs: 10_000 });

  // The expedition's own effect: the survey write that heals the drift.
  writeChart(target, completeChart());
  expect(computeProposals(target).proposals.map((p) => p.fingerprint)).not.toContain(fingerprint);

  // Scenario: an unchanged province needs no watch action — the second run
  // reports an empty acted-upon section and launches nothing.
  const second = await runWatch(target, { launcher: ok.command, launcherTimeoutMs: 10_000 });
  expect(second.ran).toEqual([]);
  expect(second.pending).toEqual([]);
  expect(invocations(ok.log)).toBe(1); // nothing new launched
  expect(renderWatchChat(second)).toContain("0 launched, 0 pending, 0 failed");
  expect(renderWatchChat(second)).toContain("ran:\nnone");
});

// ---------------------------------------------------------------------------
// Scenario: A failing launcher fails loudly and harmlessly.
// ---------------------------------------------------------------------------

test("night-watch 2.1/2.2 a non-zero launcher: failure appended, proposal queued, report names it", async () => {
  const { target, fingerprint } = driftedProvince(3);
  const failing = fakeLauncher("fail.sh", "exit 3");

  const report = await runWatch(target, { launcher: failing.command, launcherTimeoutMs: 10_000 });
  expect(report.ran[0]).toMatchObject({ outcome: "launch-failed", reason: "launcher exited with status 3" });
  const chat = renderWatchChat(report);
  expect(chat).toContain("0 launched, 0 pending, 1 failed");
  expect(chat).toContain("failure: launcher exited with status 3");

  // Accept-then-append-failure: the acceptance by night-watch, then the
  // failure as the latest word — the proposal is effectively not accepted.
  const history = readHistory(target);
  expect(history.map((r) => ("decision" in r ? r.decision : r.outcome))).toEqual(["accepted", "launch-failed"]);
  expect(history[1]).toMatchObject({ fingerprint, outcome: "launch-failed", by: "night-watch" });

  // The proposal remains queued for retry or the Governor's decision.
  expect(computeProposals(target).proposals.map((p) => p.fingerprint)).toContain(fingerprint);

  // Determinism on the failure path: a second identical run (the retry)
  // emits a byte-identical report.
  const again = await runWatch(target, { launcher: failing.command, launcherTimeoutMs: 10_000 });
  expect(renderWatchChat(again)).toBe(chat);
  expect(invocations(failing.log)).toBe(2); // it did retry — and failed alike
});

test("night-watch 2.1 a hanging launcher: killed at the cap, failure appended, nothing burned", async () => {
  const { target } = driftedProvince(3);
  const hang = fakeLauncher("hang.sh", "sleep 30");

  const started = Date.now();
  const report = await runWatch(target, { launcher: hang.command, launcherTimeoutMs: 250 });
  expect(Date.now() - started).toBeLessThan(5000);
  expect(report.ran[0]).toMatchObject({
    outcome: "launch-failed",
    reason: "launcher timed out after 250ms and was killed",
  });
  const history = readHistory(target);
  expect(history.map((r) => ("decision" in r ? r.decision : r.outcome))).toEqual(["accepted", "launch-failed"]);
  const chat = renderWatchChat(report);
  expect(chat).toContain("timed out after 250ms");
  // Launches were attempted even though none completed; "ran: none" alone
  // would read as if the watch never tried.
  expect(chat).toContain("ran:\nnone — every attempted launch failed (see launch failures)");
});

// Scenario (resurvey): a launch attempt spends the bound whether or not the
// launch succeeds — a failed launch refunds nothing to the rows behind it.
test("resurvey: a failed launch spends the bound — the next row stays pending, not promoted", async () => {
  const target = makeProvince();
  writeChart(target, completeChart());
  computeProposals(target); // establishes the snapshot
  appendFileSync(join(target, "apps/api/server.ts"), "\n// a later edit\n");
  appendFileSync(join(target, "packages/lib/src/parse.ts"), "\n// a later edit\n");
  setBound(target, 1);
  const failing = fakeLauncher("fail.sh", "exit 3");

  const report = await runWatch(target, { launcher: failing.command, launcherTimeoutMs: 10_000 });
  // Exactly one attempt: the failure spent the whole bound, so the second
  // row was never promoted into a second launch.
  expect(invocations(failing.log)).toBe(1);
  expect(report.ran).toHaveLength(1);
  expect(report.ran[0]).toMatchObject({ outcome: "launch-failed" });
  expect(report.pending.map((p) => p.fingerprint)).toHaveLength(1);
  const pendingFingerprint = report.pending[0]!.fingerprint;
  const history = readHistory(target);
  expect(history.map((r) => ("decision" in r ? r.decision : r.outcome))).toEqual([
    "accepted",
    "launch-failed",
  ]);
  // The row past the bound carries no auto-accept: it stays the Governor's.
  expect(history.every((r) => r.fingerprint !== pendingFingerprint)).toBe(true);
});

// ---------------------------------------------------------------------------
// Report-only: no launcher (even with a bound) and bound 0 (even with a
// launcher) launch nothing and write no history.
// ---------------------------------------------------------------------------

test("night-watch 2.2 no launcher configured is report-only: pending stays pending, no history", async () => {
  const { target, fingerprint } = driftedProvince(3);
  const first = await runWatch(target, {});
  expect(first.reportOnly).toBe(true);
  expect(first.ran).toEqual([]);
  expect(first.pending.map((p) => p.fingerprint)).toEqual([fingerprint]);
  expect(readHistory(target)).toEqual([]);
  // Beyond the bound reads the same way: the proposal is pending the Governor.
  const chat = renderWatchChat(first);
  expect(chat).toContain("report-only (no --launcher configured)");
  expect(chat).toContain("pending:\n1. repair —");
});

test("night-watch 2.2 bound zero is report-only even with a launcher configured", async () => {
  const { target } = driftedProvince(0);
  const ok = fakeLauncher("ok.sh", "exit 0");
  const report = await runWatch(target, { launcher: ok.command, launcherTimeoutMs: 10_000 });
  expect(report.reportOnly).toBe(true);
  expect(report.ran).toEqual([]);
  expect(invocations(ok.log)).toBe(0);
  expect(readHistory(target)).toEqual([]);
  expect(renderWatchChat(report)).toContain("report-only (harbor.auto_repair_max_vessels unset or zero)");
});

test("night-watch 2.2 beyond the bound: the lowest-ranked repair stays pending the Governor's decision", async () => {
  // Bound 1; the drift grows to a second vessel — two one-vessel repair
  // rows, so the bound spends on the higher-ranked row (api: the id
  // tie-break at fan-in 0) and lib's row stays pending with its evidence.
  const { target } = driftedProvince(1);
  appendFileSync(join(target, "packages/lib/src/parse.ts"), "\n// another edit\n");
  const ok = fakeLauncher("ok.sh", "exit 0");

  const report = await runWatch(target, { launcher: ok.command, launcherTimeoutMs: 10_000 });
  expect(report.reportOnly).toBe(false); // a launcher and a bound are configured
  expect(report.ran.map((a) => a.proposal.scope.vessels)).toEqual([["api"]]); // the bound's one vessel
  expect(report.pending.map((p) => p.kind)).toEqual(["repair"]);
  expect(report.pending.map((p) => p.scope.vessels)).toEqual([["lib"]]);
  expect(invocations(ok.log)).toBe(1);
  // The pending row drew no auto-accept: the history names only the launch.
  expect(readHistory(target).map((r) => r.fingerprint)).toEqual([report.ran[0]!.proposal.fingerprint]);
  expect(renderWatchChat(report)).toContain(
    "pending:\n1. repair — vessel lib marked pending correction (sources changed under packages/lib)",
  );
});

test("night-watch 2.2 two report-only runs over an unchanged province are byte-identical", async () => {
  const { target } = driftedProvince(3);
  const first = await runWatch(target, {});
  const second = await runWatch(target, {});
  expect(renderWatchChat(first)).toBe(renderWatchChat(second));
});

// ---------------------------------------------------------------------------
// Task 2.3 — the chat renderer's golden test (all three sections).
// ---------------------------------------------------------------------------

test("night-watch 2.3 golden: the watch report renders ran/pending/failed deterministically", () => {
  const report: WatchReport = {
    bound: 3,
    reportOnly: false,
    launcherCommand: "/opt/launchers/night.sh --profile night",
    ran: [
      {
        proposal: {
          kind: "repair",
          fingerprint: "f1",
          summary: "vessel api marked pending correction (sources changed under apps/api)",
          evidence: ["vessel/api#3"],
          anchors: [{ type: "file", path: "apps/api" }],
          scope: { vessels: ["api"], entries: 3, soundings: 3 },
        },
        outcome: "completed",
      },
      {
        proposal: {
          kind: "repair",
          fingerprint: "f2",
          summary: "vessel lib marked pending correction (sources changed under packages/lib)",
          evidence: ["vessel/lib#5"],
          anchors: [{ type: "file", path: "packages/lib" }],
          scope: { vessels: ["lib"], entries: 5, soundings: 5 },
        },
        outcome: "launch-failed",
        reason: "launcher exited with status 3",
      },
    ],
    pending: [
      {
        kind: "new-land",
        fingerprint: "f3",
        summary: "repository vendor/newrepo is present in the province but absent from the last-survey snapshot",
        evidence: ["repo:vendor/newrepo"],
        anchors: [{ type: "file", path: "vendor/newrepo/.git/HEAD" }],
        scope: { vessels: [], entries: 0, soundings: 0 },
      },
      {
        kind: "gap",
        fingerprint: "f4",
        summary: "vessel api (apps/api) has no recorded behavior and no charted light",
        evidence: ["vessel/api#behavior", "vessel/api#lights"],
        anchors: [manifestAnchor("apps/api")],
        scope: { vessels: ["api"], entries: 2, soundings: 2 },
      },
    ],
  };
  const GOLDEN = [
    "Portolan night watch — 1 launched, 2 pending, 1 failed.",
    "",
    "policy: auto-repair bound 3 vessels; launcher /opt/launchers/night.sh",
    "ran:",
    "1. repair — vessel api marked pending correction (sources changed under apps/api)",
    "   outcome: completed",
    "pending:",
    "1. new-land — repository vendor/newrepo is present in the province but absent from the last-survey snapshot",
    "   evidence: vendor/newrepo/.git/HEAD",
    "   scope: full survey of vendor/newrepo; no charted vessels there yet",
    "2. gap — vessel api (apps/api) has no recorded behavior and no charted light",
    "   evidence: apps/api/package.json#name",
    "   scope: vessels api · 2 entries · 2 soundings",
    "launch failures:",
    "1. repair — vessel lib marked pending correction (sources changed under packages/lib)",
    "   failure: launcher exited with status 3",
    "   note: recorded in history; the proposal stays queued for the Governor",
    "",
  ].join("\n");
  expect(renderWatchChat(report)).toBe(GOLDEN);
  expect(renderWatchChat(report)).toBe(GOLDEN); // stable within a run, too
});

test("night-watch 2.3 golden: a still province renders an honest empty report", () => {
  const GOLDEN = [
    "Portolan night watch — 0 launched, 0 pending, 0 failed.",
    "",
    "policy: auto-repair bound 0 vessels — report-only (harbor.auto_repair_max_vessels unset or zero)",
    "ran:",
    "none",
    "pending:",
    "none",
    "launch failures:",
    "none",
    "",
  ].join("\n");
  expect(renderWatchChat({ bound: 0, reportOnly: true, ran: [], pending: [] })).toBe(GOLDEN);
});
