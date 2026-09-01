/**
 * chart.neighborhood tests — one test per scenario in
 * openspec/changes/chart-neighborhood/specs/tools/spec.md, plus the
 * trust.report adoption scenario from specs/invocation/spec.md proven
 * end-to-end through the served handler.
 *
 * Pinned module contract (core/src/tools/neighborhood.ts, tasks 2.1–2.3):
 *
 *   neighborhood(targetRoot, params: NeighborhoodParams): NeighborhoodResponse
 *   class NeighborhoodError                    — every rejection of this tool
 *   NeighborhoodParams  { vessel, direction?, depth?, maxEdges?, maxBytes?, verify? }
 *   NeighborhoodResponse { vessel, direction, depth, edges, vessels, truncated, droppedEdges, droppedVessels }
 *   NeighborhoodEdge     { id, from, to, trust, relation?, stale, anchors, verification? }
 *   NeighborhoodEdgeVerification { verdict: "confirmed" | "refuted", refutedAnchors: Anchor[] }
 *   NeighborhoodVessel   { id, trust, stale, fanIn, portsOfEntry }
 *   NeighborhoodPortOfEntry      { id, protocol, trust, anchors }
 *
 * `vessels` is the queried vessel plus every vessel touched by a returned
 * (kept) edge, ordered by direct fan-in over the whole chart, highest first.
 * `verification` is present on every edge exactly when `verify: true`.
 */
import { test, expect, afterEach } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
import type { Anchor, ChartEntry, FairwayEntry, IndexedEntry, PortOfEntryEntry, VesselEntry } from "../types";
import { readChart, writeChart } from "../chart-store";
import { indexJsonl } from "../chart-io";
import { readReceipts } from "./log";
import { trustReport } from "./trust-report";
import { TOOL_TABLE } from "../server/registry";
import {
  NeighborhoodError,
  neighborhood,
  type NeighborhoodEdge,
  type NeighborhoodResponse,
} from "./neighborhood";

const targets: string[] = [];
afterEach(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Fixture charts: in-memory entry lists over a tmp target, written with
// writeChart. Vessel paths may not exist on disk (an empty tree signature is
// stable), except where a test needs real bytes to edit or to anchor truthfully.
// ---------------------------------------------------------------------------

function makeTarget(): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-neighborhood-"));
  targets.push(target);
  // One real file outside .portolan so perimeter assertions have substance.
  writeFileSync(join(target, "README.md"), "# fixture province\n");
  return target;
}

function vessel(id: string, extra: Partial<VesselEntry> = {}): VesselEntry {
  return {
    kind: "vessel",
    id,
    name: id,
    paths: [id],
    anchors: [{ type: "file", path: `${id}/${id}.ts`, line: 1 }],
    trust: "charted",
    ...extra,
  };
}

function fairway(id: string, from: string, to: string, extra: Partial<FairwayEntry> = {}): FairwayEntry {
  return {
    kind: "fairway",
    id,
    from,
    to,
    anchors: [{ type: "file", path: `${from}/${from}.ts`, line: 2 }],
    trust: "measured",
    ...extra,
  };
}

function portOf(id: string, vesselId: string, protocol: string): PortOfEntryEntry {
  return {
    kind: "portOfEntry",
    id,
    vessel: vesselId,
    protocol,
    anchors: [{ type: "file", path: `${vesselId}/${vesselId}.ts`, line: 3 }],
    trust: "measured",
  };
}

function writeEntries(target: string, entries: ChartEntry[]): void {
  writeChart(target, entries);
}

/**
 * Rewrite the machine index directly, bypassing chart.write's schema: the
 * scenarios below plant entries the schema rightly refuses (a non-citable
 * anchor, an anchorless edge) but a direct index edit can still produce.
 * Entries are read back from the chart first, so `stale`/`signature`
 * metadata survives and the staleness refresh stays silent.
 */
function rewriteIndexDirectly(target: string, mutate: (entry: IndexedEntry) => IndexedEntry): void {
  const mutated = readChart(target).map(mutate);
  writeFileSync(join(target, ".portolan", "chart", "index.jsonl"), indexJsonl(mutated));
}

function edgeById(resp: NeighborhoodResponse, id: string): NeighborhoodEdge {
  const edge = resp.edges.find((e) => e.id === id);
  expect(edge, `edge ${id} in the response`).toBeDefined();
  return edge as NeighborhoodEdge;
}

/** ids of the response edges, sorted — order within edges is not pinned. */
const edgeIds = (resp: NeighborhoodResponse): string[] => resp.edges.map((e) => e.id).sort();

/** ids of the response vessels, sorted — ranking is asserted separately. */
const vesselIds = (resp: NeighborhoodResponse): string[] => resp.vessels.map((v) => v.id).sort();

/** fan-in sequence along the returned vessel list must never increase. */
function assertFanInRanked(resp: NeighborhoodResponse): void {
  const fanIns = resp.vessels.map((v) => v.fanIn);
  for (let i = 1; i < fanIns.length; i++) {
    expect(fanIns[i]).toBeLessThanOrEqual(fanIns[i - 1] as number);
  }
}

/** name -> content hash, for chart byte-identity checks. */
function snapshotChartBytes(target: string): Map<string, string> {
  const dir = join(target, ".portolan", "chart");
  const out = new Map<string, string>();
  for (const name of readdirSync(dir)) {
    out.set(name, createHash("sha1").update(readFileSync(join(dir, name))).digest("hex"));
  }
  return out;
}

/** size:mtime of every file outside .portolan, for perimeter checks. */
function snapshotOutsideStats(root: string): Map<string, string> {
  const snap = new Map<string, string>();
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      const rel = relative(root, abs);
      if (rel === ".portolan" || rel.startsWith(".portolan/")) continue;
      if (entry.isDirectory()) {
        walk(abs);
        continue;
      }
      if (!entry.isFile()) continue;
      const stats = statSync(abs);
      snap.set(rel, `${stats.size}:${stats.mtimeMs}`);
    }
  };
  walk(root);
  return snap;
}

// ---------------------------------------------------------------------------
// 1. A one-hop neighborhood in both directions (defaults: direction both, depth 1)
// ---------------------------------------------------------------------------

function oneHopEntries(): ChartEntry[] {
  return [
    vessel("port"),
    vessel("upstream"),
    vessel("downstream"),
    // incoming, untyped: the pre-enum shape must read as an untyped edge
    fairway("fw-upstream-port", "upstream", "port"),
    // outgoing, typed: the relation rides along on the edge
    fairway("fw-port-down", "port", "downstream", { relation: "runtime", trust: "charted" }),
    portOf("poe-down-http", "downstream", "http"),
  ];
}

test("a one-hop neighborhood in both directions lists exactly the touching fairways and the touched vessels with ports of entry", () => {
  const target = makeTarget();
  writeEntries(target, oneHopEntries());

  // No optional params: the defaults (both / 1) are what this scenario pins.
  const resp = neighborhood(target, { vessel: "port" });

  expect(resp.vessel).toBe("port");
  expect(resp.direction).toBe("both");
  expect(resp.depth).toBe(1);
  expect(resp.truncated).toBe(false);
  expect(resp.droppedEdges).toBe(0);

  // Exactly those fairways, with their anchors and trust labels. The typed
  // edge carries its relation; the pre-enum untyped edge reads as untyped.
  expect(edgeIds(resp)).toEqual(["fw-port-down", "fw-upstream-port"]);
  expect(edgeById(resp, "fw-upstream-port")).toEqual({
    id: "fw-upstream-port",
    from: "upstream",
    to: "port",
    trust: "measured",
    stale: false,
    anchors: [{ type: "file", path: "upstream/upstream.ts", line: 2 }],
  });
  expect(edgeById(resp, "fw-port-down")).toEqual({
    id: "fw-port-down",
    from: "port",
    to: "downstream",
    trust: "charted",
    relation: "runtime",
    stale: false,
    anchors: [{ type: "file", path: "port/port.ts", line: 2 }],
  });

  // The touched vessels (queried included) with ports of entry attached.
  expect(vesselIds(resp)).toEqual(["downstream", "port", "upstream"]);
  const downstream = resp.vessels.find((v) => v.id === "downstream")!;
  expect(downstream).toEqual({
    id: "downstream",
    trust: "charted",
    stale: false,
    fanIn: 1,
    portsOfEntry: [
      {
        id: "poe-down-http",
        protocol: "http",
        trust: "measured",
        anchors: [{ type: "file", path: "downstream/downstream.ts", line: 3 }],
      },
    ],
  });
  const upstream = resp.vessels.find((v) => v.id === "upstream")!;
  expect(upstream.portsOfEntry).toEqual([]);
  assertFanInRanked(resp);
});

// ---------------------------------------------------------------------------
// 2. An unknown vessel is an honest error
// ---------------------------------------------------------------------------

test("an unknown vessel id errors as unsurveyed, not on the Chart, and returns no edges", () => {
  const target = makeTarget();
  writeEntries(target, oneHopEntries());

  let err: unknown;
  try {
    neighborhood(target, { vessel: "ghost-v" });
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(NeighborhoodError);
  const message = (err as Error).message;
  expect(message).toContain("ghost-v");
  expect(message).toContain("unsurveyed");
  expect(message).toMatch(/not on the Chart/i);
});

// ---------------------------------------------------------------------------
// 3. Direction and depth are honored
// ---------------------------------------------------------------------------

function chainEntries(): ChartEntry[] {
  return [
    vessel("port"),
    vessel("up1"),
    vessel("up2"),
    vessel("down"),
    fairway("fw-up1-port", "up1", "port"),
    fairway("fw-up2-up1", "up2", "up1"),
    fairway("fw-port-down", "port", "down"),
  ];
}

test("direction in and depth 2 return only incoming fairways to two hops; no outgoing edge appears", () => {
  const target = makeTarget();
  writeEntries(target, chainEntries());

  const resp = neighborhood(target, { vessel: "port", direction: "in", depth: 2 });

  expect(resp.direction).toBe("in");
  expect(resp.depth).toBe(2);
  expect(edgeIds(resp)).toEqual(["fw-up1-port", "fw-up2-up1"]);
  expect(edgeIds(resp)).not.toContain("fw-port-down");
  expect(vesselIds(resp)).toEqual(["port", "up1", "up2"]);

  // One hop short of the requested depth returns only the first hop.
  const shallow = neighborhood(target, { vessel: "port", direction: "in" });
  expect(shallow.depth).toBe(1);
  expect(edgeIds(shallow)).toEqual(["fw-up1-port"]);
});

// ---------------------------------------------------------------------------
// 4. A dependency cycle cannot recurse
// ---------------------------------------------------------------------------

function cycleEntries(): ChartEntry[] {
  return [
    vessel("port"),
    vessel("c1"),
    vessel("c2"),
    vessel("c3"),
    fairway("fw-c1-port", "c1", "port"),
    fairway("fw-c1-c2", "c1", "c2"),
    fairway("fw-c2-c3", "c2", "c3"),
    fairway("fw-c3-c1", "c3", "c1"),
  ];
}

test("a cycle reachable from the queried vessel terminates, visiting each vessel once", () => {
  const target = makeTarget();
  writeEntries(target, cycleEntries());

  const resp = neighborhood(target, { vessel: "port", direction: "both", depth: 3 });

  // Terminating is returning at all; correctness is each charted fairway once
  // and each vessel exactly once.
  expect(edgeIds(resp)).toEqual(["fw-c1-c2", "fw-c1-port", "fw-c2-c3", "fw-c3-c1"]);
  const ids = resp.vessels.map((v) => v.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(vesselIds(resp)).toEqual(["c1", "c2", "c3", "port"]);
});

// ---------------------------------------------------------------------------
// 5. An invalid request is rejected, naming the parameter and its values
// ---------------------------------------------------------------------------

test("a direction outside the enum, a depth above the cap, or a budget above its cap is rejected naming the parameter", () => {
  const target = makeTarget();
  writeEntries(target, chainEntries());

  const rejected: Array<{ params: Record<string, unknown>; parameter: string; allowed: string[] }> = [
    { params: { vessel: "port", direction: "sideways" }, parameter: "direction", allowed: ["in", "out", "both"] },
    { params: { vessel: "port", depth: 4 }, parameter: "depth", allowed: ["3"] },
    { params: { vessel: "port", maxEdges: 201 }, parameter: "maxEdges", allowed: ["200"] },
    { params: { vessel: "port", maxBytes: 131073 }, parameter: "maxBytes", allowed: ["131072"] },
  ];
  for (const { params, parameter, allowed } of rejected) {
    let err: unknown;
    try {
      neighborhood(target, params as never);
    } catch (e) {
      err = e;
    }
    expect(err, `rejection for ${parameter}`).toBeInstanceOf(NeighborhoodError);
    const message = (err as Error).message;
    expect(message).toContain(parameter);
    for (const value of allowed) expect(message).toContain(value);
  }
});

// ---------------------------------------------------------------------------
// 6. The hub outranks the leaf
// ---------------------------------------------------------------------------

/** port receives fairways from `hub` (fan-in 11) and `leaf` (fan-in 1). */
function hubEntries(): ChartEntry[] {
  const entries: ChartEntry[] = [vessel("port"), vessel("hub"), vessel("leaf")];
  entries.push(fairway("fw-hub-port", "hub", "port"));
  entries.push(fairway("fw-leaf-port", "leaf", "port"));
  for (let i = 0; i < 11; i++) {
    entries.push(vessel(`hub-f${i}`));
    entries.push(fairway(`fw-hubf${i}-hub`, `hub-f${i}`, "hub"));
  }
  entries.push(vessel("leaf-f0"));
  entries.push(fairway("fw-leaff-leaf", "leaf-f0", "leaf"));
  return entries;
}

test("the fan-in 11 hub appears before the fan-in 1 leaf in the vessel list", () => {
  const target = makeTarget();
  writeEntries(target, hubEntries());

  const resp = neighborhood(target, { vessel: "port" });

  const hub = resp.vessels.find((v) => v.id === "hub")!;
  const leaf = resp.vessels.find((v) => v.id === "leaf")!;
  expect(hub.fanIn).toBe(11);
  expect(leaf.fanIn).toBe(1);
  expect(resp.vessels.findIndex((v) => v.id === "hub")).toBeLessThan(
    resp.vessels.findIndex((v) => v.id === "leaf"),
  );
  assertFanInRanked(resp);
  // The feeders only touch hub/leaf, not the queried port: they are not in
  // the neighborhood.
  expect(vesselIds(resp)).toEqual(["hub", "leaf", "port"]);
});

// ---------------------------------------------------------------------------
// 7. A tight maxEdges budget truncates loudly
// ---------------------------------------------------------------------------

/** hub0 fans out to w1..w5; wi's direct fan-in descends with i (feeders). */
function wideOutEntries(): ChartEntry[] {
  const entries: ChartEntry[] = [vessel("hub0")];
  for (let i = 1; i <= 5; i++) {
    entries.push(vessel(`w${i}`));
    entries.push(fairway(`fw-hub0-w${i}`, "hub0", `w${i}`));
    for (let j = 1; j <= 6 - i; j++) {
      entries.push(vessel(`f${i}-${j}`));
      entries.push(fairway(`fw-f${i}-${j}-w${i}`, `f${i}-${j}`, `w${i}`));
    }
  }
  return entries;
}

test("a tight maxEdges marks the response truncated, keeps the fan-in-ranked prefix, and states the dropped edges", () => {
  const target = makeTarget();
  writeEntries(target, wideOutEntries());

  const full = neighborhood(target, { vessel: "hub0", direction: "out", depth: 1 });
  expect(full.edges).toHaveLength(5);
  expect(full.truncated).toBe(false);
  expect(full.droppedEdges).toBe(0);
  assertFanInRanked(full);

  const tight = neighborhood(target, { vessel: "hub0", direction: "out", depth: 1, maxEdges: 2 });

  expect(tight.truncated).toBe(true);
  expect(tight.edges).toHaveLength(2);
  // The kept prefix belongs to the highest-fan-in neighbors w1 then w2.
  expect(edgeIds(tight)).toEqual(["fw-hub0-w1", "fw-hub0-w2"]);
  expect(tight.droppedEdges).toBe(3);
  // Vessels are those the kept edges touch, plus the queried vessel — never
  // vessels whose every edge was dropped.
  expect(vesselIds(tight)).toEqual(["hub0", "w1", "w2"]);
  expect(tight.vessels.findIndex((v) => v.id === "w1")).toBeLessThan(
    tight.vessels.findIndex((v) => v.id === "w2"),
  );
  assertFanInRanked(tight);
});

// ---------------------------------------------------------------------------
// 8. The budget is measured in bytes too
// ---------------------------------------------------------------------------

test("a maxBytes-capped response serializes within the cap and says it was truncated", () => {
  const target = makeTarget();
  const entries = chainEntries();
  // A long note inflates the full response so a halved budget must cut.
  entries.push({
    kind: "fairway",
    id: "fw-heavy-port",
    from: "up2",
    to: "port",
    note: `ballast ${"x".repeat(2000)}`,
    anchors: [{ type: "file", path: "up2/up2.ts", line: 5 }],
    trust: "reported",
  });
  writeEntries(target, entries);

  const full = neighborhood(target, { vessel: "port" });
  const fullBytes = JSON.stringify(full).length;
  expect(fullBytes).toBeGreaterThan(1000); // guards the fixture's ballast

  const maxBytes = Math.floor(fullBytes / 2);
  const tight = neighborhood(target, { vessel: "port", maxBytes });

  // ASCII fixture: string length is the serialized byte count.
  expect(JSON.stringify(tight).length).toBeLessThanOrEqual(maxBytes);
  expect(tight.truncated).toBe(true);
  expect(tight.droppedEdges).toBe(full.edges.length - tight.edges.length);
});

// ---------------------------------------------------------------------------
// 8b. The byte budget governs the whole response: the touched vessels too
// ---------------------------------------------------------------------------

test("a response whose vessels overflow maxBytes drops tail vessels, keeps the queried vessel, and stays within the cap", () => {
  const target = makeTarget();
  // The overflow rides the touched vessels' ports of entry — the mass an
  // edges-only reading of the budget never sees. The queried vessel ranks
  // at the tail (fan-in 0): the tail drops must skip it anyway.
  const entries: ChartEntry[] = [
    vessel("port"),
    vessel("left"),
    vessel("right"),
    fairway("fw-port-left", "port", "left"),
    fairway("fw-port-right", "port", "right"),
  ];
  for (let i = 0; i < 10; i++) {
    entries.push(portOf(`poe-port-${String(i).padStart(2, "0")}`, "port", `proto-${i}`));
    entries.push(portOf(`poe-left-${String(i).padStart(2, "0")}`, "left", `proto-${i}`));
    entries.push(portOf(`poe-right-${String(i).padStart(2, "0")}`, "right", `proto-${i}`));
  }
  writeEntries(target, entries);

  const full = neighborhood(target, { vessel: "port" });
  expect(full.vessels).toHaveLength(3);
  expect(full.truncated).toBe(false);

  // A budget the queried vessel's own citations fit under, but any one
  // neighbor added to them does not.
  const maxBytes = 2400;
  const tight = neighborhood(target, { vessel: "port", maxBytes });

  // ASCII fixture: string length is the serialized byte count.
  expect(JSON.stringify(tight).length).toBeLessThanOrEqual(maxBytes);
  expect(edgeIds(tight)).toEqual(edgeIds(full)); // edges were never the problem
  expect(tight.droppedEdges).toBe(0);
  expect(tight.droppedVessels).toBe(2);
  expect(tight.truncated).toBe(true);
  // The queried vessel is never dropped, even ranking at the tail.
  expect(tight.vessels.map((v) => v.id)).toEqual(["port"]);
});

// ---------------------------------------------------------------------------
// 9–10. Verification is on demand; the default serves stored chart truth
// ---------------------------------------------------------------------------

/** One truthfully anchored edge, one edge citing a file that never existed. */
function verifyEntries(): ChartEntry[] {
  return [
    vessel("port"),
    vessel("good", { paths: ["harbor"] }),
    vessel("liar"),
    fairway("fw-good-port", "good", "port", {
      anchors: [{ type: "file", path: "harbor/harbor.ts", line: 1 }],
      trust: "measured",
    }),
    fairway("fw-lie-port", "liar", "port", {
      anchors: [{ type: "file", path: "harbor/wreck.ts", line: 1 }],
      trust: "reported",
    }),
  ];
}

function writeVerifyFixture(target: string): void {
  mkdirSync(join(target, "harbor"), { recursive: true });
  writeFileSync(
    join(target, "harbor", "harbor.ts"),
    ["// the harbor module", "export function moor(): void {}"].join("\n") + "\n",
  );
  writeEntries(target, verifyEntries());
}

test("verify=true catches the planted lie: that edge is refuted and named, the rest stand confirmed, the Chart is unchanged", () => {
  const target = makeTarget();
  writeVerifyFixture(target);
  const indexBefore = readFileSync(join(target, ".portolan", "chart", "index.jsonl"), "utf8");

  const resp = neighborhood(target, { vessel: "port", verify: true });

  // Every returned edge carries a verdict when verification was asked for.
  for (const edge of resp.edges) expect(edge.verification).toBeDefined();

  const lie = edgeById(resp, "fw-lie-port");
  expect(lie.verification?.verdict).toBe("refuted");
  expect(lie.verification?.refutedAnchors).toEqual([{ type: "file", path: "harbor/wreck.ts", line: 1 }]);

  const good = edgeById(resp, "fw-good-port");
  expect(good.verification?.verdict).toBe("confirmed");
  expect(good.verification?.refutedAnchors).toEqual([]);

  // The verdict informs, the Cartographer writes: the Chart on disk is unchanged.
  expect(readFileSync(join(target, ".portolan", "chart", "index.jsonl"), "utf8")).toBe(indexBefore);
});

test("the default (verify=false) serves stored trust labels and anchors with no sounding", () => {
  const target = makeTarget();
  writeVerifyFixture(target);

  const resp = neighborhood(target, { vessel: "port" });

  // No refuted marks, no verification evidence at all: nothing was sounded.
  for (const edge of resp.edges) expect(edge.verification).toBeUndefined();
  expect(edgeById(resp, "fw-lie-port").trust).toBe("reported");
  expect(edgeById(resp, "fw-good-port").trust).toBe("measured");
  expect(edgeById(resp, "fw-good-port").anchors).toEqual([{ type: "file", path: "harbor/harbor.ts", line: 1 }]);
});

// ---------------------------------------------------------------------------
// 10b. Anchors that cannot be sounded refute their edge — they never crash
// the verify, and an anchorless edge is never a confirmation on zero soundings
// ---------------------------------------------------------------------------

test("verify=true refutes an edge whose anchor is not citable, names it, and leaves the other edges confirmed", () => {
  const target = makeTarget();
  writeVerifyFixture(target);
  // Plant the non-citable anchor by direct index edit: chart.write's schema
  // refuses an anchor citing nothing, and the scenario is exactly one that
  // reached the Chart anyway.
  rewriteIndexDirectly(target, (entry) =>
    entry.kind === "fairway" && entry.id === "fw-lie-port"
      ? ({ ...entry, anchors: [{ type: "file" }] } as IndexedEntry)
      : entry,
  );

  const resp = neighborhood(target, { vessel: "port", verify: true });

  const broken = edgeById(resp, "fw-lie-port");
  expect(broken.verification?.verdict).toBe("refuted");
  // The malformed anchor is named exactly as cited — no path invented.
  expect(broken.verification?.refutedAnchors).toEqual([{ type: "file" } as unknown as Anchor]);
  // The other edges are unaffected: the truthfully anchored one stands.
  expect(edgeById(resp, "fw-good-port").verification).toEqual({ verdict: "confirmed", refutedAnchors: [] });
});

test("verify=true refutes an edge citing no anchor: nothing resolvable, never a confirmation on zero soundings", () => {
  const target = makeTarget();
  writeVerifyFixture(target);
  rewriteIndexDirectly(target, (entry) =>
    entry.kind === "fairway" && entry.id === "fw-lie-port" ? { ...entry, anchors: [] } : entry,
  );

  const resp = neighborhood(target, { vessel: "port", verify: true });

  expect(edgeById(resp, "fw-lie-port").verification).toEqual({ verdict: "refuted", refutedAnchors: [] });
  expect(edgeById(resp, "fw-good-port").verification?.verdict).toBe("confirmed");
});

// ---------------------------------------------------------------------------
// 11. A stale hub is flagged, not hidden
// ---------------------------------------------------------------------------

test("a vessel whose sources drifted appears with its stale flag set and its fairways remain listed", () => {
  const target = makeTarget();
  mkdirSync(join(target, "harbor"), { recursive: true });
  mkdirSync(join(target, "tug"), { recursive: true });
  writeFileSync(join(target, "harbor", "harbor.ts"), "// the harbor module\n");
  writeFileSync(join(target, "tug", "tug.ts"), "// the tug pulls on its own\n");
  writeEntries(target, [
    vessel("harbor", { paths: ["harbor"] }),
    vessel("tug", { paths: ["tug"] }),
    fairway("fw-tug-harbor", "tug", "harbor", {
      anchors: [{ type: "file", path: "tug/tug.ts", line: 1 }],
    }),
  ]);

  // An outside force flips harbor's signature after the survey.
  const path = join(target, "harbor", "harbor.ts");
  writeFileSync(path, readFileSync(path, "utf8") + "// drifted by an outside force\n");

  const resp = neighborhood(target, { vessel: "tug" });

  const harbor = resp.vessels.find((v) => v.id === "harbor")!;
  expect(harbor.stale).toBe(true);
  expect(resp.vessels.find((v) => v.id === "tug")!.stale).toBe(false);

  // The fairway stays listed, honestly stale with its endpoint.
  const edge = edgeById(resp, "fw-tug-harbor");
  expect(edge.stale).toBe(true);
});

// ---------------------------------------------------------------------------
// 12. The neighborhood writes nothing but its receipt — through the served
// handler, because the receipt is the handler's append (tasks 3.1).
// ---------------------------------------------------------------------------

test("on unchanged signatures the served call leaves the Chart byte-identical, touches nothing outside .portolan, and appends exactly one chart.neighborhood receipt", () => {
  const target = makeTarget();
  writeEntries(target, oneHopEntries());

  const chartBefore = snapshotChartBytes(target);
  expect(chartBefore.has("index.jsonl")).toBe(true);
  const outsideBefore = snapshotOutsideStats(target);
  expect(outsideBefore.size).toBeGreaterThan(0);
  expect(readReceipts(target)).toEqual([]); // empty log before the call

  const spec = TOOL_TABLE.find((t) => t.name === "chart.neighborhood");
  if (spec === undefined) throw new Error("chart.neighborhood missing from the registry table");
  const result = spec.handler({ vessel: "port" }, { targetRoot: target }) as NeighborhoodResponse;
  expect(result.edges.length).toBeGreaterThan(0); // structured pass-through

  // The Chart on disk is byte-identical afterwards.
  expect(snapshotChartBytes(target)).toEqual(chartBefore);
  // No file outside <target>/.portolan/ was even touched (size or mtime).
  expect(snapshotOutsideStats(target)).toEqual(outsideBefore);
  // The only write under .portolan: exactly one appended ship's-log receipt.
  const receipts = readReceipts(target, { command: "chart.neighborhood" });
  expect(receipts).toHaveLength(1);
  expect(receipts[0]!.outcome).toMatch(/ok/);
});

test("a call surfaces in the next trust.report: incremented invocations and that receipt as last and first", () => {
  const target = makeTarget();
  writeEntries(target, oneHopEntries());

  const spec = TOOL_TABLE.find((t) => t.name === "chart.neighborhood");
  if (spec === undefined) throw new Error("chart.neighborhood missing from the registry table");
  spec.handler({ vessel: "port" }, { targetRoot: target });

  const report = trustReport(target);
  const receipts = readReceipts(target, { command: "chart.neighborhood" });
  expect(receipts).toHaveLength(1);
  expect(report.adoption.tools["chart.neighborhood"]).toEqual({
    invocations: 1,
    firstReceipt: receipts[0]!.id,
    lastReceipt: receipts[0]!.id,
  });
});
