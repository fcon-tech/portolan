/**
 * Fan-in rank unit tests — openspec/changes/resurvey-queue tasks.md 1.2,
 * one test per scenario: cross-vessel fairways count toward the target
 * vessel; intra-vessel fairways count for nothing; a vessel with no
 * incoming cross-vessel fairway ranks zero (and never drops out of the
 * ordering); and the rank is deterministic — sorting the same vessels by
 * it twice orders them identically. The helper is pure, so every scenario
 * is a literal entry list; spec deltas pin the divergence from
 * chart.neighborhood's inclusive per-entry count.
 */
import { test, expect } from "bun:test";
import type { ChartEntry } from "./types";
import { compareVesselRank, vesselFanIn } from "./fan-in";

/** A minimal charted vessel; the helper reads only fairway endpoints. */
const vessel = (id: string): ChartEntry => ({
  kind: "vessel",
  id,
  name: id,
  paths: [`src/${id}`],
  anchors: [],
  trust: "charted",
});

/** A minimal charted fairway; endpoints are vessel ids. */
const fairway = (id: string, from: string, to: string): ChartEntry => ({
  kind: "fairway",
  id,
  from,
  to,
  anchors: [],
  trust: "reported",
});

test("cross-vessel fairways count toward the target vessel, whatever vessel charts them", () => {
  const fanIn = vesselFanIn([
    vessel("hub"),
    vessel("leaf"),
    // Three charted fairways into hub (two from leaf, one from an id with
    // no charted vessel entry — endpoints are vessel ids, not vessel
    // entries), one out of hub.
    fairway("fw-1", "leaf", "hub"),
    fairway("fw-2", "leaf", "hub"),
    fairway("fw-3", "ghost", "hub"),
    fairway("fw-4", "hub", "leaf"),
  ]);

  expect(fanIn.get("hub")).toBe(3);
  expect(fanIn.get("leaf")).toBe(1);
  // Vessels the chart never feeds are simply absent, not zero-filled.
  expect([...fanIn.keys()].sort()).toEqual(["hub", "leaf"]);
});

test("an intra-vessel fairway contributes nothing — the rank is cross-vessel only", () => {
  const fanIn = vesselFanIn([
    vessel("zulu"),
    fairway("fw-self-1", "zulu", "zulu"),
    fairway("fw-self-2", "zulu", "zulu"),
  ]);

  expect(fanIn.size).toBe(0);
});

test("a vessel with no incoming cross-vessel fairway ranks zero and stays in the ordering", () => {
  const fanIn = vesselFanIn([vessel("solo"), vessel("peer"), fairway("fw-1", "solo", "peer")]);

  expect(fanIn.get("solo") ?? 0).toBe(0);
  // Through the shared compare: peer (fan-in 1) precedes solo, and solo is
  // ordered by the tie-break — never dropped from the list it sorts in.
  expect(["solo", "peer"].sort((a, b) => compareVesselRank(a, b, fanIn))).toEqual([
    "peer",
    "solo",
  ]);
});

test("two computations over the same chart order the vessels identically", () => {
  const entries: ChartEntry[] = [
    vessel("hub"),
    vessel("alpha"),
    vessel("bravo"),
    vessel("leaf"),
    fairway("fw-1", "leaf", "hub"),
    fairway("fw-2", "leaf", "hub"),
    fairway("fw-3", "bravo", "hub"),
    fairway("fw-4", "bravo", "alpha"),
  ];

  const rank = (ids: string[]): string[] =>
    [...ids].sort((a, b) => compareVesselRank(a, b, vesselFanIn(entries)));

  // hub holds fan-in 3, alpha 1; bravo and leaf tie at zero and break by id.
  const expected = ["hub", "alpha", "bravo", "leaf"];
  expect(rank(["hub", "alpha", "bravo", "leaf"])).toEqual(expected);
  expect(rank(["leaf", "bravo", "alpha", "hub"])).toEqual(expected); // a different starting order
  expect(vesselFanIn(entries)).toEqual(vesselFanIn([...entries].reverse())); // the counts agree too
});
