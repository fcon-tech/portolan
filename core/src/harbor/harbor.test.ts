/**
 * Harbor Master unit tests — the deterministic core behind
 * `expeditions.propose` / `expeditions.decide`.
 * openspec/changes/harbor-master:
 *   tasks 1.1 (fingerprint), 1.2 (landscape snapshot), 1.3 (decision
 *   history), 2.1 (computeProposals scenarios), 2.2 (decide round-trips),
 *   3.1 (settings) — each test names the scenario it proves.
 */
import { afterAll, test, expect } from "bun:test";
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { writeChart } from "../chart-store";
import type { ChartEntry } from "../types";
import { proposalFingerprint } from "./fingerprint";
import {
  chartIndexHash,
  readSnapshot,
  scanLandscape,
  snapshotFile,
} from "./snapshot";
import {
  appendDecision,
  historyFile,
  lastDecisionPerFingerprint,
  readDecisions,
} from "./history";
import { readSettings, settingsFile } from "./settings";
import { computeProposals, decide } from "./proposals";

const targets: string[] = [];
afterAll(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// The fixture province: two vessels (apps/api, packages/lib), each with a
// manifest and one source file.
// ---------------------------------------------------------------------------

function makeProvince(): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-harbor-"));
  targets.push(target);
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

/** A complete chart: both vessels have behavior and a light; one fairway joins them. */
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
      kind: "fairway",
      id: "api-lib",
      from: "api",
      to: "lib",
      anchors: [{ type: "file", path: "packages/lib/src/parse.ts", line: 1 }],
      trust: "measured",
    },
    {
      kind: "light",
      id: "api-health",
      vessel: "api",
      name: "GET /health",
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

/** A charted vessel with neither behavior nor light: the gap fixture (lib stays complete). */
function gapChart(): ChartEntry[] {
  return completeChart()
    .map((entry) => {
      if (entry.kind === "vessel" && entry.id === "api") {
        const { behavior: _behavior, ...rest } = entry;
        return rest as ChartEntry;
      }
      return entry;
    })
    .filter((entry) => !(entry.kind === "light" && entry.vessel === "api"));
}

/** Drift: change a file under one vessel after the chart was written. */
function drift(target: string, dir: string): void {
  const file = dir === "apps/api" ? "apps/api/server.ts" : "packages/lib/src/parse.ts";
  appendFileSync(join(target, file), "\n// a later edit\n");
}

// ---------------------------------------------------------------------------
// Task 1.1 — the proposal fingerprint (sha256 of kind + sorted evidence
// keys; stability and drift-growth sensitivity).
// ---------------------------------------------------------------------------

test("1.1 fingerprint: same evidence yields the same fingerprint, in any order", () => {
  const a = proposalFingerprint("repair", ["vessel/api", "vessel/lib"]);
  const reordered = proposalFingerprint("repair", ["vessel/lib", "vessel/api"]);
  const repeated = proposalFingerprint("repair", ["vessel/api", "vessel/lib", "vessel/api"]);
  expect(a).toBe(reordered);
  expect(a).toBe(repeated);
  expect(a).toMatch(/^[0-9a-f]{64}$/);
});

test("1.1 fingerprint: drift growth yields a new fingerprint; the kind participates", () => {
  const one = proposalFingerprint("repair", ["vessel/api"]);
  const two = proposalFingerprint("repair", ["vessel/api", "vessel/lib"]);
  expect(one).not.toBe(two);
  // Same evidence under a different kind is a different proposal.
  expect(proposalFingerprint("gap", ["vessel/api#behavior"])).not.toBe(
    proposalFingerprint("repair", ["vessel/api#behavior"]),
  );
});

// ---------------------------------------------------------------------------
// Task 1.2 — the landscape snapshot: scan semantics, baseline creation,
// new-land detection, refresh on index-hash change.
// ---------------------------------------------------------------------------

test("1.2 scanLandscape: manifests and repository directories, skipping node_modules/.git/.portolan, root excluded", () => {
  const target = makeProvince();
  mkdirSync(join(target, ".git"), { recursive: true }); // the province root is not new land
  mkdirSync(join(target, "node_modules", "junk"), { recursive: true });
  writeFileSync(join(target, "node_modules", "junk", "package.json"), "{}\n");
  mkdirSync(join(target, ".portolan", "harbor"), { recursive: true });
  mkdirSync(join(target, "vendor", "tool", ".git"), { recursive: true });
  writeFileSync(join(target, "vendor", "tool", ".git", "HEAD"), "ref: refs/heads/main\n");

  const landscape = scanLandscape(target);
  expect(landscape).toEqual([
    { kind: "manifest", path: "apps/api/package.json" },
    { kind: "manifest", path: "packages/lib/package.json" },
    { kind: "repo", path: "vendor/tool" },
  ]);
});

test("1.2 snapshot: the first propose establishes the baseline (index hash + landscape, no new-land)", () => {
  const target = makeProvince();
  writeChart(target, completeChart());
  const { proposals } = computeProposals(target);
  expect(proposals).toEqual([]);

  const snapshot = readSnapshot(target);
  expect(snapshot).not.toBeNull();
  expect(snapshot!.indexHash).toBe(chartIndexHash(target));
  expect(snapshot!.landscape).toEqual([
    { kind: "manifest", path: "apps/api/package.json" },
    { kind: "manifest", path: "packages/lib/package.json" },
  ]);
});

test("1.2 snapshot: a new repository with an unchanged chart is detected as new-land", () => {
  const target = makeProvince();
  writeChart(target, completeChart());
  computeProposals(target); // baseline

  mkdirSync(join(target, "vendor", "newrepo", ".git"), { recursive: true });
  writeFileSync(join(target, "vendor", "newrepo", ".git", "HEAD"), "ref: refs/heads/main\n");
  mkdirSync(join(target, "packages", "new"), { recursive: true });
  writeFileSync(join(target, "packages", "new", "package.json"), '{ "name": "@prov/new" }\n');

  const { proposals } = computeProposals(target);
  const newLand = proposals.filter((p) => p.kind === "new-land");
  expect(newLand.map((p) => p.evidence)).toEqual([
    ["manifest:packages/new/package.json"],
    ["repo:vendor/newrepo"],
  ]);
  // Each names its land with an anchor to it, soundable (regular files).
  expect(newLand[0].anchors).toEqual([{ type: "file", path: "packages/new/package.json" }]);
  expect(newLand[1].anchors).toEqual([{ type: "file", path: "vendor/newrepo/.git/HEAD" }]);
});

test("1.2 snapshot: a survey standing a changed chart refreshes the snapshot and clears stale new-land", () => {
  const target = makeProvince();
  writeChart(target, completeChart());
  computeProposals(target); // baseline
  mkdirSync(join(target, "vendor", "newrepo", ".git"), { recursive: true });
  writeFileSync(join(target, "vendor", "newrepo", ".git", "HEAD"), "ref: refs/heads/main\n");
  expect(computeProposals(target).proposals.some((p) => p.kind === "new-land")).toBe(true);

  // The expedition repairs the drift: drift first, then a survey write —
  // the write re-stamps the vessel signature, so the chart content (and
  // therefore its hash) genuinely changes: a survey stood.
  drift(target, "apps/api");
  writeChart(target, completeChart());
  const { proposals } = computeProposals(target);
  expect(proposals.filter((p) => p.kind === "new-land")).toEqual([]);

  const snapshot = readSnapshot(target);
  expect(snapshot!.indexHash).toBe(chartIndexHash(target));
  expect(snapshot!.landscape).toContainEqual({ kind: "repo", path: "vendor/newrepo" });
  // And it stays quiet: the refreshed snapshot covers the land.
  expect(computeProposals(target).proposals.filter((p) => p.kind === "new-land")).toEqual([]);
});

test("1.2 snapshot: staleness marks alone are not a survey — drift does not swallow new-land", () => {
  const target = makeProvince();
  writeChart(target, completeChart());
  computeProposals(target); // baseline
  mkdirSync(join(target, "vendor", "newrepo", ".git"), { recursive: true });
  writeFileSync(join(target, "vendor", "newrepo", ".git", "HEAD"), "ref: refs/heads/main\n");
  drift(target, "apps/api");

  // The drift mark rewrites the index bytes, but no survey stood: both the
  // repair and the new-land proposal must come back, run after run.
  for (let i = 0; i < 2; i++) {
    const kinds = computeProposals(target).proposals.map((p) => p.kind);
    expect(kinds).toEqual(["repair", "new-land"]);
  }
});

// ---------------------------------------------------------------------------
// Task 1.3 — the append-only decision history.
// ---------------------------------------------------------------------------

test("1.3 history: append-only; existing rows are never altered", () => {
  const target = makeProvince();
  expect(readDecisions(target)).toEqual([]);

  appendDecision(target, "f1", "declined");
  appendDecision(target, "f2", "accepted");
  const afterTwo = readFileSync(historyFile(target), "utf8");

  appendDecision(target, "f1", "accepted"); // an overturned refusal is a new row
  const afterThree = readFileSync(historyFile(target), "utf8");
  expect(afterThree.startsWith(afterTwo)).toBe(true);
  expect(afterThree.length).toBeGreaterThan(afterTwo.length);
  expect(readDecisions(target).length).toBe(3);
});

test("1.3 history: the last decision per fingerprint wins", () => {
  const records = [
    { fingerprint: "f1", decision: "declined" as const, decidedAt: "2026-08-23T10:00:00Z" },
    { fingerprint: "f2", decision: "accepted" as const, decidedAt: "2026-08-23T11:00:00Z" },
    { fingerprint: "f1", decision: "accepted" as const, decidedAt: "2026-08-23T12:00:00Z" },
  ];
  const last = lastDecisionPerFingerprint(records);
  expect(last.get("f1")?.decision).toBe("accepted");
  expect(last.get("f2")?.decision).toBe("accepted");
});

// ---------------------------------------------------------------------------
// Task 2.1 — computeProposals: the five scenario tests.
// ---------------------------------------------------------------------------

test("2.1 drift becomes a repair proposal listing the vessels, anchored, with a scope estimate", () => {
  const target = makeProvince();
  writeChart(target, completeChart());
  drift(target, "apps/api");

  const { proposals } = computeProposals(target);
  const repair = proposals.find((p) => p.kind === "repair");
  expect(repair).toBeDefined();
  // Lists the drifted vessel...
  expect(repair!.scope.vessels).toEqual(["api"]);
  expect(repair!.evidence).toEqual(["vessel/api"]);
  // ...with anchors to the changed files' tree (the vessel's source path)...
  expect(repair!.anchors).toEqual([{ type: "file", path: "apps/api" }]);
  // ...and estimates the entries and soundings it would touch: vessel api,
  // fairway api-lib, and light api-health are all pending correction.
  expect(repair!.scope.entries).toBe(3);
  expect(repair!.scope.soundings).toBe(3);
  expect(repair!.summary).toContain("api");
});

test("2.1 a gap becomes a survey proposal naming the vessel and the missing passes", () => {
  const target = makeProvince();
  writeChart(target, gapChart());

  const { proposals } = computeProposals(target);
  const gaps = proposals.filter((p) => p.kind === "gap");
  expect(gaps.length).toBe(1);
  expect(gaps[0].scope.vessels).toEqual(["api"]);
  expect(gaps[0].evidence).toEqual(["vessel/api#behavior", "vessel/api#lights"]);
  expect(gaps[0].summary).toContain("no recorded behavior");
  expect(gaps[0].summary).toContain("no charted light");
  // Evidence anchors are the vessel's own charted anchors.
  expect(gaps[0].anchors).toEqual([manifestAnchor("apps/api")]);
});

test("2.1 a still province proposes nothing (empty queue, twice)", () => {
  const target = makeProvince();
  writeChart(target, completeChart());
  expect(computeProposals(target).proposals).toEqual([]);
  expect(computeProposals(target).proposals).toEqual([]);
});

test("2.1 ranking: repair before new-land before gap, then evidence size", () => {
  const target = makeProvince();
  writeChart(target, gapChart()); // api has no behavior and no light
  drift(target, "apps/api"); // ...and api drifted
  computeProposals(target); // baseline snapshot
  mkdirSync(join(target, "vendor", "newrepo", ".git"), { recursive: true });
  writeFileSync(join(target, "vendor", "newrepo", ".git", "HEAD"), "ref: refs/heads/main\n");

  const kinds = computeProposals(target).proposals.map((p) => p.kind);
  expect(kinds).toEqual(["repair", "new-land", "gap"]);
});

test("2.1 a refusal holds while the evidence is unchanged", () => {
  const target = makeProvince();
  writeChart(target, completeChart());
  drift(target, "apps/api");
  const first = computeProposals(target).proposals;
  expect(first.length).toBe(1);
  decide(target, first[0].fingerprint, "declined");

  const second = computeProposals(target).proposals;
  expect(second.map((p) => p.fingerprint)).not.toContain(first[0].fingerprint);
  expect(second).toEqual([]);
});

test("2.1 changed evidence reopens the proposal with the wider evidence", () => {
  const target = makeProvince();
  writeChart(target, completeChart());
  drift(target, "apps/api");
  const [repair] = computeProposals(target).proposals;
  decide(target, repair.fingerprint, "declined");
  expect(computeProposals(target).proposals).toEqual([]);

  drift(target, "packages/lib"); // the drift grows to more vessels
  const reopened = computeProposals(target).proposals;
  expect(reopened.length).toBe(1);
  expect(reopened[0].kind).toBe("repair");
  expect(reopened[0].fingerprint).not.toBe(repair.fingerprint);
  expect(reopened[0].evidence).toEqual(["vessel/api", "vessel/lib"]);
});

// ---------------------------------------------------------------------------
// Task 2.2 — decide: round-trips and rejections.
// ---------------------------------------------------------------------------

test("2.2 decide: accept round-trip writes history and keeps the proposal visible", () => {
  const target = makeProvince();
  writeChart(target, gapChart());
  const [gap] = computeProposals(target).proposals;

  const record = decide(target, gap.fingerprint, "accepted");
  expect(record.fingerprint).toBe(gap.fingerprint);
  expect(record.decision).toBe("accepted");
  expect(record.decidedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  const last = lastDecisionPerFingerprint(readDecisions(target)).get(gap.fingerprint);
  expect(last?.decision).toBe("accepted");
  // Acceptance is not a refusal: the outstanding gap stays in the queue.
  expect(computeProposals(target).proposals.map((p) => p.fingerprint)).toContain(gap.fingerprint);
});

test("2.2 decide: decline round-trip filters the proposal", () => {
  const target = makeProvince();
  writeChart(target, gapChart());
  const [gap] = computeProposals(target).proposals;
  decide(target, gap.fingerprint, "declined");
  expect(computeProposals(target).proposals.map((p) => p.fingerprint)).not.toContain(gap.fingerprint);
});

test("2.2 decide: an unknown fingerprint is rejected", () => {
  const target = makeProvince();
  writeChart(target, gapChart());
  computeProposals(target);
  const ghost = "deadbeef".repeat(8);
  expect(() => decide(target, ghost, "accepted")).toThrow(/unknown proposal fingerprint deadbeef/);
  expect(() => decide(target, ghost, "accepted")).toThrow(/expeditions\.propose/);
  expect(() => decide(target, "", "accepted")).toThrow(/fingerprint/);
});

test("2.2 decide: a decision outside the vocabulary is rejected", () => {
  const target = makeProvince();
  writeChart(target, gapChart());
  const [gap] = computeProposals(target).proposals;
  expect(() => decide(target, gap.fingerprint, "maybe" as never)).toThrow(
    /unknown decision "maybe"; the vocabulary is accepted, declined/,
  );
});

// ---------------------------------------------------------------------------
// Task 3.1 — the settings reader.
// ---------------------------------------------------------------------------

test("3.1 settings: absent file defaults to no schedule and no warnings", () => {
  const target = makeProvince();
  const { harbor, warnings } = readSettings(target);
  expect(harbor.schedule).toBeUndefined();
  expect(harbor).toEqual({});
  expect(warnings).toEqual([]);
});

test("3.1 settings: harbor.schedule is read when configured", () => {
  const target = makeProvince();
  mkdirSync(join(target, ".portolan"), { recursive: true });
  writeFileSync(
    settingsFile(target),
    `${JSON.stringify({ harbor: { schedule: "weekly on Monday 09:00" } }, null, 2)}\n`,
  );
  const { harbor, warnings } = readSettings(target);
  expect(harbor.schedule).toBe("weekly on Monday 09:00");
  expect(warnings).toEqual([]);
});

test("3.1 settings: unknown keys are tolerated with a warning, at both levels", () => {
  const target = makeProvince();
  mkdirSync(join(target, ".portolan"), { recursive: true });
  writeFileSync(
    settingsFile(target),
    `${JSON.stringify({ telemetry: true, harbor: { schedule: 5, mood: "bright" } }, null, 2)}\n`,
  );
  const { harbor, warnings } = readSettings(target);
  expect(harbor.schedule).toBeUndefined(); // ill-typed known key: ignored
  expect(warnings.length).toBe(3);
  expect(warnings[0]).toContain('unknown key "telemetry"');
  expect(warnings[1]).toContain("harbor.schedule must be a non-empty string");
  expect(warnings[2]).toContain('unknown key "harbor.mood"');
});

test("3.1 settings: a malformed file fails loudly", () => {
  const target = makeProvince();
  mkdirSync(join(target, ".portolan"), { recursive: true });
  writeFileSync(settingsFile(target), "{ not json");
  expect(() => readSettings(target)).toThrow(/cannot parse/);
  writeFileSync(settingsFile(target), "[1, 2]\n");
  expect(() => readSettings(target)).toThrow(/not a JSON object/);
});

// ---------------------------------------------------------------------------
// Cross-cutting: the queue carries no timestamps — the same province
// computes the same queue twice.
// ---------------------------------------------------------------------------

test("2.1 determinism: two computes over an unchanged province are identical", () => {
  const target = makeProvince();
  writeChart(target, gapChart());
  drift(target, "apps/api");
  computeProposals(target);
  mkdirSync(join(target, "vendor", "newrepo", ".git"), { recursive: true });
  writeFileSync(join(target, "vendor", "newrepo", ".git", "HEAD"), "ref: refs/heads/main\n");
  const first = computeProposals(target);
  const second = computeProposals(target);
  expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  expect(first.proposals.length).toBe(3);
});
