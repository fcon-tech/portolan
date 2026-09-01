/**
 * Bigtop corpus leg (chart-neighborhood task 6.1) — the local proof that the
 * fixture results transfer to a non-toy chart. Skips unless PORTOLAN_BIGTOP_
 * CORPUS names the charted Bigtop province checkout (absolute path to the
 * corpus root holding .portolan/chart/), so CI without the corpus stays
 * green. The corpus path is only ever resolved from the environment: no
 * machine path is hardcoded here (scripts/leak-gate.sh scans this file).
 *
 * The leg writes nothing itself except one deliberate, restored-in-finally
 * plant: the verify leg grows the chart by one fabricated fairway (a dead
 * file anchor), asserts the refutation names it while the real edges stand
 * confirmed, and then restores the exact prior chart bytes. Like every
 * chart-reading surface, the calls run the shared staleness refresh first,
 * so a drifted corpus may gain stale marks outside this suite's
 * snapshot/restore. All neighborhood calls go through the module function,
 * so no ship's-log receipt is appended by this suite.
 */
import { test, expect } from "bun:test";
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chartDir, readChart, writeChart } from "../chart-store";
import type { ChartEntry, FairwayEntry, IndexedEntry } from "../types";
import { neighborhood } from "./neighborhood";

const corpusRoot = process.env.PORTOLAN_BIGTOP_CORPUS;
const hasCorpus = typeof corpusRoot === "string" && corpusRoot.length > 0;

/** kind/id keys of a chart, sorted — for before/after comparisons. */
const entryKeys = (entries: IndexedEntry[]): string[] =>
  entries.map((e) => `${e.kind}/${e.id}`).sort();

/** Direct fan-in over the whole chart: charted incoming fairways per vessel. */
function globalFanIn(entries: IndexedEntry[]): Map<string, number> {
  const fanIn = new Map<string, number>();
  for (const e of entries) {
    if (e.kind !== "fairway") continue;
    fanIn.set(e.to, (fanIn.get(e.to) ?? 0) + 1);
  }
  return fanIn;
}

/** name -> text, for chart byte snapshots (every chart file is text). */
function snapshotChartDir(root: string): Map<string, string> {
  const dir = chartDir(root);
  const snap = new Map<string, string>();
  for (const name of readdirSync(dir)) snap.set(name, readFileSync(join(dir, name), "utf8"));
  return snap;
}

/** Restore the chart directory to an exact prior byte state. */
function restoreChartDir(root: string, snap: Map<string, string>): void {
  const dir = chartDir(root);
  for (const name of readdirSync(dir)) {
    if (!snap.has(name)) rmSync(join(dir, name), { force: true });
  }
  for (const [name, text] of snap) writeFileSync(join(dir, name), text);
}

test.skipIf(!hasCorpus)(
  "the neighborhood of hive is non-empty and matches the chart's fairways for hive",
  () => {
    const root = corpusRoot as string;
    // The engine refreshes staleness before serving, so on a drifted corpus
    // the first call rewrites the chart: read the chart AFTER the call, so
    // both sides of the comparison see the same refreshed state.
    const resp = neighborhood(root, { vessel: "hive" });
    const entries = readChart(root);
    const hive = entries.find((e) => e.kind === "vessel" && e.id === "hive");
    expect(hive, "the corpus chart must chart a vessel hive").toBeDefined();

    const touching = entries.filter(
      (e): e is IndexedEntry & FairwayEntry =>
        e.kind === "fairway" && (e.from === "hive" || e.to === "hive"),
    );
    expect(touching.length, "the corpus chart must fairway hive to something").toBeGreaterThan(0);

    expect(resp.edges.length).toBeGreaterThan(0);
    expect(resp.edges.map((e) => e.id).sort()).toEqual(touching.map((e) => e.id).sort());
    // Every served edge is the charted truth: endpoints, trust, anchors.
    const charted = new Map(touching.map((e) => [e.id, e]));
    for (const edge of resp.edges) {
      const fairway = charted.get(edge.id)!;
      expect(edge.from).toBe(fairway.from);
      expect(edge.to).toBe(fairway.to);
      expect(edge.trust).toBe(fairway.trust);
      expect(edge.anchors).toEqual(fairway.anchors);
      if (fairway.relation === undefined) expect(edge.relation).toBeUndefined();
      else expect(edge.relation).toBe(fairway.relation);
    }
  },
);

test.skipIf(!hasCorpus)(
  "fan-in ordering holds: the corpus hubs (bigtop-utils, hadoop) outrank the leaves",
  () => {
    const root = corpusRoot as string;
    const resp = neighborhood(root, { vessel: "hive" });
    const entries = readChart(root);
    const fanIn = globalFanIn(entries);

    // Every served fan-in is the chart-wide count, non-increasing along the
    // vessel list — hubs before leaves, everywhere.
    for (const v of resp.vessels) {
      expect(v.fanIn).toBe(fanIn.get(v.id) ?? 0);
    }
    for (let i = 1; i < resp.vessels.length; i++) {
      expect(resp.vessels[i]!.fanIn).toBeLessThanOrEqual(resp.vessels[i - 1]!.fanIn);
    }
    const leaf = resp.vessels[resp.vessels.length - 1]!;
    for (const hubId of ["bigtop-utils", "hadoop"]) {
      // Presence is asserted, not assumed — a reshaped corpus fails loudly
      // instead of letting the hub check pass vacuously.
      const hub = resp.vessels.find((v) => v.id === hubId);
      expect(hub, `corpus hub ${hubId} present in hive's neighborhood`).toBeDefined();
      if (hub!.id === leaf.id) continue;
      expect(resp.vessels.findIndex((v) => v.id === hubId)).toBeLessThan(
        resp.vessels.findIndex((v) => v.id === leaf.id),
      );
    }
  },
);

test.skipIf(!hasCorpus)(
  "a tight budget truncates loudly and keeps a fan-in-ranked subset of the full neighborhood",
  () => {
    const root = corpusRoot as string;
    const full = neighborhood(root, { vessel: "hive" });
    expect(full.edges.length, "corpus shape: hive holds more than 3 charted fairways").toBeGreaterThan(3);
    expect(full.truncated).toBe(false);

    const tight = neighborhood(root, { vessel: "hive", maxEdges: 3 });

    expect(tight.edges.length).toBeLessThanOrEqual(3);
    expect(tight.truncated).toBe(true);
    expect(tight.droppedEdges).toBe(full.edges.length - tight.edges.length);
    // The kept edges are a prefix of the ranked full neighborhood: every kept
    // edge's endpoints rank at least as high as every dropped edge's.
    const keptIds = new Set(tight.edges.map((e) => e.id));
    const rank = new Map<string, number>(full.vessels.map((v, i) => [v.id, i]));
    for (const edge of tight.edges) expect(keptIds.has(edge.id)).toBe(true);
    const bestKept = Math.min(...tight.edges.map((e) => rank.get(e.from === "hive" ? e.to : e.from) ?? 0));
    for (const edge of full.edges) {
      if (keptIds.has(edge.id)) continue;
      const droppedRank = rank.get(edge.from === "hive" ? edge.to : edge.from) ?? 0;
      expect(bestKept).toBeLessThanOrEqual(droppedRank);
    }
  },
);

test.skipIf(!hasCorpus)(
  "verify=true refutes a planted fabricated anchor by name while the real edges stand confirmed, and leaves the corpus chart byte-restored",
  () => {
    const root = corpusRoot as string;
    const entries = readChart(root);
    const snap = snapshotChartDir(root);
    const beforeKeys = entryKeys(entries);

    // Plant: one fairway departing hive whose anchor cites a file that never
    // existed — the fabricated citation the sounding must refuse.
    const otherVessel = entries.find((e) => e.kind === "vessel" && e.id !== "hive");
    expect(otherVessel).toBeDefined();
    const planted: ChartEntry = {
      kind: "fairway",
      id: "fw-planted-neighborhood-spec",
      from: "hive",
      to: (otherVessel as { id: string }).id,
      note: "planted by neighborhood.bigtop.test.ts; restored in finally",
      anchors: [{ type: "file", path: "planted/does-not-exist.ts", line: 1 }],
      trust: "doubtful",
    };
    try {
      writeChart(root, [...entries, planted]);

      const resp = neighborhood(root, { vessel: "hive", verify: true });

      const plantedEdge = resp.edges.find((e) => e.id === planted.id);
      expect(plantedEdge, "the planted fairway touches hive and must be served").toBeDefined();
      expect(plantedEdge!.verification?.verdict).toBe("refuted");
      expect(plantedEdge!.verification?.refutedAnchors).toEqual([
        { type: "file", path: "planted/does-not-exist.ts", line: 1 },
      ]);

      // The real edges are unaffected: on a maintained province their anchors
      // resolve, so each stands confirmed. Genuine corpus drift failing here
      // is the honest signal, not flakiness.
      for (const edge of resp.edges) {
        if (edge.id === planted.id) continue;
        expect(edge.verification?.verdict, `edge ${edge.id}`).toBe("confirmed");
      }
    } finally {
      restoreChartDir(root, snap);
    }

    // The plant is gone: the chart serves exactly its original entries.
    expect(entryKeys(readChart(root))).toEqual(beforeKeys);
  },
);
