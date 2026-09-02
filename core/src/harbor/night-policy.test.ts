/**
 * Night-policy unit tests — night-watch task 1.2, one test per delta
 * scenario: within the bound the repair runs; beyond the bound it stays a
 * proposal; new-land is never auto-explored however high the bound; an
 * absent bound (0) is report-only. The policy is pure, so every scenario is
 * a literal proposal list plus a number.
 * openspec/changes/night-watch (harbor capability: auto-repair is bounded
 * and never curious)
 */
import { test, expect } from "bun:test";
import { nightPolicy } from "./night-policy";
import type { Proposal } from "./proposals";

/** A minimal repair proposal drifting `count` vessels; ids api, lib, s1, ... */
function repair(vesselCount: number): Proposal {
  const vessels = Array.from({ length: vesselCount }, (_, i) =>
    vesselCount <= 2 ? ["api", "lib"][i] : `v${i + 1}`,
  );
  return {
    kind: "repair",
    fingerprint: `f-repair-${vesselCount}`,
    summary: `${vesselCount} vessel(s) marked pending correction`,
    evidence: vessels.map((id) => `vessel/${id}`),
    anchors: [],
    scope: { vessels, entries: vesselCount, soundings: vesselCount },
  };
}

const newLand: Proposal = {
  kind: "new-land",
  fingerprint: "f-new-land",
  summary: "repository vendor/newrepo is present in the province but absent from the last-survey snapshot",
  evidence: ["repo:vendor/newrepo"],
  anchors: [{ type: "file", path: "vendor/newrepo/.git/HEAD" }],
  scope: { vessels: [], entries: 0, soundings: 0 },
};

const gap: Proposal = {
  kind: "gap",
  fingerprint: "f-gap",
  summary: "vessel api (apps/api) has no recorded behavior and no charted light",
  evidence: ["vessel/api#behavior", "vessel/api#lights"],
  anchors: [{ type: "manifest", path: "apps/api/package.json", key: "name" }],
  scope: { vessels: ["api"], entries: 2, soundings: 2 },
};

test("night-watch 1.2 within the bound, repair runs (two vessels drift, bound is three)", () => {
  const { launch, pending } = nightPolicy([repair(2)], 3);
  expect(launch.map((p) => p.kind)).toEqual(["repair"]);
  expect(pending).toEqual([]);
});

test("night-watch 1.2 beyond the bound stays a proposal (five vessels drift, bound is three)", () => {
  const { launch, pending } = nightPolicy([repair(5)], 3);
  expect(launch).toEqual([]);
  expect(pending.map((p) => p.fingerprint)).toEqual(["f-repair-5"]);
});

test("night-watch 1.2 new land is never auto-explored, however high the bound", () => {
  const { launch, pending } = nightPolicy([newLand, gap], 100);
  expect(launch).toEqual([]);
  expect(pending.map((p) => p.kind)).toEqual(["new-land", "gap"]);
});

test("night-watch 1.2 an absent bound is report-only (zero launches nothing)", () => {
  const { launch, pending } = nightPolicy([repair(1), newLand, gap], 0);
  expect(launch).toEqual([]);
  expect(pending.length).toBe(3);
});

test("night-watch 1.2 a mixed queue splits in queue order, both sides stable", () => {
  const { launch, pending } = nightPolicy([repair(2), newLand, gap], 2);
  expect(launch.map((p) => p.fingerprint)).toEqual(["f-repair-2"]);
  expect(pending.map((p) => p.kind)).toEqual(["new-land", "gap"]);
  // Determinism: the same queue and bound decide identically twice.
  expect(nightPolicy([repair(2), newLand, gap], 2)).toEqual({ launch, pending });
});

// ---------------------------------------------------------------------------
// Resurvey-queue (specs/harbor/spec.md, "Auto-repair is bounded and never
// curious"): with one-vessel repair rows the bound is spent cumulatively,
// down the queue order — the highest-ranked repairs launch until the bound's
// vessel count is spent, everything past it stays pending with its evidence.
// ---------------------------------------------------------------------------

/** A per-vessel repair row in the resurvey shape: one vessel, drift-sensitive evidence. */
function repairRow(id: string, staleEntries: number, fingerprint = `f-${id}`): Proposal {
  return {
    kind: "repair",
    fingerprint,
    summary: `vessel ${id} marked pending correction`,
    evidence: [`vessel/${id}#${staleEntries}`],
    anchors: [],
    scope: { vessels: [id], entries: staleEntries, soundings: staleEntries },
  };
}

test("resurvey beyond the bound: five repair rows and bound three — the three highest-ranked launch in queue order, the rest stay pending with their evidence", () => {
  const queue = [
    repairRow("hub", 4),
    repairRow("leaf", 2),
    repairRow("mid", 3),
    repairRow("low", 1),
    repairRow("tail", 2),
    newLand,
  ];
  const { launch, pending } = nightPolicy(queue, 3);
  expect(launch.map((p) => p.fingerprint)).toEqual(["f-hub", "f-leaf", "f-mid"]);
  expect(pending.map((p) => p.fingerprint)).toEqual(["f-low", "f-tail", "f-new-land"]);
  // The rows past the bound stay proposals: listed with their evidence —
  // and the spent bound buys new-land no launch either.
  expect(pending.map((p) => p.evidence)).toEqual([
    ["vessel/low#1"],
    ["vessel/tail#2"],
    ["repo:vendor/newrepo"],
  ]);
  // Determinism: the same queue and bound decide identically twice.
  expect(nightPolicy(queue, 3)).toEqual({ launch, pending });
});

test("resurvey within the bound: three repair rows and bound three — all three launch in queue order", () => {
  const { launch, pending } = nightPolicy(
    [repairRow("hub", 2), repairRow("leaf", 1), repairRow("solo", 1)],
    3,
  );
  expect(launch.map((p) => p.fingerprint)).toEqual(["f-hub", "f-leaf", "f-solo"]);
  expect(pending).toEqual([]);
});

test("resurvey bound zero is report-only: every row stays pending, queue order preserved", () => {
  const queue = [repairRow("hub", 2), repairRow("leaf", 1), newLand, gap];
  const { launch, pending } = nightPolicy(queue, 0);
  expect(launch).toEqual([]);
  expect(pending.map((p) => p.fingerprint)).toEqual(["f-hub", "f-leaf", "f-new-land", "f-gap"]);
});
