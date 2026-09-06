/**
 * chart.export tests — one test per scenario in
 * openspec/changes/formats-pass/specs/tools/spec.md, plus the
 * charted-truth-only rules of specs/formats/spec.md proven against the
 * builder (tasks 3.1–3.3; design D4 + D5).
 *
 * Pinned module contract (core/src/tools/export.ts):
 *
 *   chartExport(targetRoot: string): GraphExport
 *   class ExportError                 — every rejection of this tool
 *   EXPORT_MAX_BYTES: number          — the byte budget; bytes alone, the
 *                                       export takes no query parameters
 *   GraphExport {
 *     format: "portolan-adjacency"
 *     version: string                 — the graph-export schema version
 *     nodes[]                         — every non-fairway entry: the charted
 *                                       fields as-is plus `stale`
 *     edges[]                         — every fairway entry: id, from, to,
 *                                       relation when charted, anchors,
 *                                       trust, stale
 *     truncated: boolean
 *     omitted: Array<{ vessel, entries }>
 *   }
 *
 * The builder is arithmetic over charted bytes: no timestamps, no derived
 * rollups (no top-level `vessels` rollup, no `issues[]`), no invented
 * nodes. Staleness follows chart.read semantics — refreshed before
 * answering, silent on unchanged signatures — so pending correction is
 * visible, never hidden. The served chart.export handler owns the single
 * ship's-log receipt per call; the builder itself writes nothing.
 */
import { test, expect, afterEach } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
import Ajv2020 from "ajv/dist/2020";
import graphExportJson from "../../schema/graph-export.schema.json";
import trustVocabularyJson from "../../schema/trust-vocabulary.schema.json";
import type {
  BeaconEntry,
  ChartEntry,
  DangerEntry,
  FairwayEntry,
  IndexedEntry,
  LightEntry,
  PortOfEntryEntry,
  VesselEntry,
} from "../types";
import { readChart, writeChart } from "../chart-store";
import { readReceipts } from "./log";
import { TOOL_TABLE } from "../server/registry";
import { chartExport, EXPORT_MAX_BYTES, ExportError, type GraphExport } from "./export";

const targets: string[] = [];
afterEach(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Fixture charts: in-memory entry lists over a tmp target, written with
// writeChart. Vessel paths may not exist on disk (an empty tree signature is
// stable), except where a test needs real bytes to edit and to drift.
// ---------------------------------------------------------------------------

function makeTarget(): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-export-"));
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

function beacon(
  id: string,
  vesselId: string,
  surface: BeaconEntry["surface"],
  key: string,
  extra: Partial<BeaconEntry> = {},
): BeaconEntry {
  return {
    kind: "beacon",
    id,
    vessel: vesselId,
    surface,
    key,
    anchors: [{ type: "file", path: `${vesselId}/${vesselId}.ts`, line: 4 }],
    trust: "measured",
    ...extra,
  };
}

function light(id: string, vesselId: string, name: string): LightEntry {
  return {
    kind: "light",
    id,
    vessel: vesselId,
    name,
    anchors: [{ type: "file", path: `${vesselId}/${vesselId}.ts`, line: 6 }],
    trust: "measured",
  };
}

function danger(
  id: string,
  vesselId: string,
  category: DangerEntry["category"],
  note: string,
): DangerEntry {
  return {
    kind: "danger",
    id,
    vessel: vesselId,
    category,
    note,
    anchors: [{ type: "file", path: `${vesselId}/${vesselId}.ts`, line: 5 }],
    trust: "measured",
  };
}

function nodeById(doc: GraphExport, id: string): GraphExport["nodes"][number] {
  const node = doc.nodes.find((n) => n.id === id);
  expect(node, `node ${id} in the export`).toBeDefined();
  return node as GraphExport["nodes"][number];
}

function edgeById(doc: GraphExport, id: string): GraphExport["edges"][number] {
  const edge = doc.edges.find((e) => e.id === id);
  expect(edge, `edge ${id} in the export`).toBeDefined();
  return edge as GraphExport["edges"][number];
}

/** The entry's charted fields, its store signature aside. */
function chartedFields(entry: Exclude<IndexedEntry, FairwayEntry>) {
  const { signature: _signature, ...rest } = entry;
  return rest;
}

/** ids drawn in the export, sorted — nodes and edges together. */
const drawnIds = (doc: GraphExport): string[] =>
  [...doc.nodes.map((n) => n.id), ...doc.edges.map((e) => e.id)].sort();

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

function exportSchemaValidator(): (doc: unknown) => boolean {
  const ajv = new Ajv2020({ allErrors: true });
  // D1: `version` is the schema-file version annotation ajv strict must know.
  ajv.addKeyword("version");
  ajv.addSchema(trustVocabularyJson);
  ajv.addSchema(graphExportJson);
  return ajv.compile(graphExportJson);
}

function exportToolSpec() {
  const spec = TOOL_TABLE.find((t) => t.name === "chart.export");
  if (spec === undefined) throw new Error("chart.export missing from the registry table");
  return spec;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Every entry kind, typed and untyped fairways, mixed trust labels. */
function richEntries(): ChartEntry[] {
  return [
    vessel("port", { behavior: "Answers for the whole harbor." }),
    vessel("warehouse"),
    fairway("fw-port-warehouse", "port", "warehouse", { relation: "runtime" }),
    fairway("fw-warehouse-port", "warehouse", "port", { trust: "reported" }),
    portOf("poe-port-http", "port", "http"),
    beacon("b-port-env", "port", "env", "PORTOLAN_TARGET"),
    light("l-port-status", "port", "GET /status"),
    danger("d-port-dup", "port", "wreck", "Duplicated JSON parsing in two handlers."),
  ];
}

/**
 * Five self-contained vessels, five entries each, every non-vessel entry
 * carrying enough ballast that the whole chart cannot fit one budget —
 * with no fairways, so each entry belongs to exactly one vessel.
 */
function oversizedEntries(): ChartEntry[] {
  const fat = Math.ceil(EXPORT_MAX_BYTES / 10);
  const entries: ChartEntry[] = [];
  for (let b = 0; b < 5; b++) {
    const id = `ballast-${b}`;
    entries.push(vessel(id));
    for (let i = 0; i < 4; i++) {
      entries.push(danger(`d-${id}-${i}`, id, "shallow", `ballast ${"x".repeat(fat)}`));
    }
  }
  return entries;
}

// ---------------------------------------------------------------------------
// 1. Export of a charted province is self-describing and truthful
// ---------------------------------------------------------------------------

test("the export names its format and schema version, and every node and edge carries its entry's anchors, trust, and staleness", () => {
  const target = makeTarget();
  writeChart(target, richEntries());

  const doc = chartExport(target);

  expect(doc.format).toBe("portolan-adjacency");
  expect(doc.version).toBe("0.1.0");
  // The named version is the schema version it was produced against.
  expect(doc.version).toBe((graphExportJson as unknown as { version: string }).version);

  const entries = readChart(target);
  for (const entry of entries) {
    if (entry.kind === "fairway") {
      const edge = edgeById(doc, entry.id);
      expect(edge.from, `${entry.id}: from`).toBe(entry.from);
      expect(edge.to, `${entry.id}: to`).toBe(entry.to);
      expect(edge.trust, `${entry.id}: trust`).toBe(entry.trust);
      expect(edge.stale, `${entry.id}: stale`).toBe(entry.stale);
      expect(edge.anchors, `${entry.id}: anchors`).toEqual(entry.anchors);
      if (entry.relation !== undefined) {
        expect(edge.relation, `${entry.id}: relation`).toBe(entry.relation);
      } else {
        expect(edge.relation, `${entry.id}: untyped stays untyped`).toBeUndefined();
      }
    } else {
      // The charted fields as-is: the entry, its store signature aside.
      expect(nodeById(doc, entry.id), `${entry.id}: node`).toEqual(chartedFields(entry));
    }
  }

  // The document validates against its own published contract.
  expect(exportSchemaValidator()(doc), "the served document against the graph export schema").toBe(
    true,
  );
});

// ---------------------------------------------------------------------------
// 2. Stale entries are marked pending correction, never hidden
// ---------------------------------------------------------------------------

test("a drifted vessel's export node and its fairway edge are marked stale", () => {
  const target = makeTarget();
  mkdirSync(join(target, "harbor"), { recursive: true });
  mkdirSync(join(target, "tug"), { recursive: true });
  writeFileSync(join(target, "harbor", "harbor.ts"), "// the harbor module\n");
  writeFileSync(join(target, "tug", "tug.ts"), "// the tug pulls on its own\n");
  writeChart(target, [
    vessel("harbor", { paths: ["harbor"] }),
    vessel("tug", { paths: ["tug"] }),
    fairway("fw-tug-harbor", "tug", "harbor", {
      anchors: [{ type: "file", path: "tug/tug.ts", line: 1 }],
    }),
  ]);

  // An outside force flips harbor's signature after the survey.
  const path = join(target, "harbor", "harbor.ts");
  writeFileSync(path, readFileSync(path, "utf8") + "// drifted by an outside force\n");

  const doc = chartExport(target);

  expect(nodeById(doc, "harbor").stale).toBe(true);
  expect(nodeById(doc, "tug").stale).toBe(false);
  expect(edgeById(doc, "fw-tug-harbor").stale).toBe(true);
});

// ---------------------------------------------------------------------------
// 3. Unsurveyed stays unsurveyed
// ---------------------------------------------------------------------------

test("doubtful and unsurveyed markers are carried as-is: no export value upgrades them", () => {
  const target = makeTarget();
  writeChart(target, [
    vessel("fog", { trust: "unsurveyed" }),
    vessel("reef", { trust: "doubtful" }),
    fairway("fw-fog-reef", "fog", "reef", { trust: "doubtful" }),
    beacon("b-fog-flag", "fog", "flag", "FOG_MODE", { trust: "doubtful" }),
  ]);

  const doc = chartExport(target);

  expect(nodeById(doc, "fog").trust).toBe("unsurveyed");
  expect(nodeById(doc, "reef").trust).toBe("doubtful");
  expect(nodeById(doc, "b-fog-flag").trust).toBe("doubtful");
  expect(edgeById(doc, "fw-fog-reef").trust).toBe("doubtful");
});

// ---------------------------------------------------------------------------
// 4. Nothing appears in the export that has no charted counterpart
// ---------------------------------------------------------------------------

test("the export invents nothing: no invented nodes, no timestamps, no derived rollups", () => {
  const target = makeTarget();
  writeChart(target, richEntries());

  const doc = chartExport(target);

  // Every node and edge is a charted entry, and every charted entry is drawn.
  const entryIds = readChart(target).map((e) => e.id).sort();
  expect(drawnIds(doc), "exactly the charted entries").toEqual(entryIds);

  // The charted collections plus the truncation report, nothing else: no
  // timestamp field, no top-level vessels rollup, no dangling-endpoint list.
  expect(Object.keys(doc).sort()).toEqual([
    "edges",
    "format",
    "nodes",
    "omitted",
    "truncated",
    "version",
  ]);
  const keys: string[] = [];
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (value !== null && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        keys.push(key);
        walk(child);
      }
    }
  };
  walk(doc);
  expect(keys.filter((k) => /At$/.test(k)), "timestamp-shaped keys").toEqual([]);
  expect(JSON.stringify(doc), "no timestamp values anywhere").not.toMatch(/\d{4}-\d{2}-\d{2}T/);
});

// ---------------------------------------------------------------------------
// 5. Chart within budget is returned whole
// ---------------------------------------------------------------------------

test("a chart within the budget is returned whole, with no truncation report", () => {
  const target = makeTarget();
  writeChart(target, richEntries());

  const doc = chartExport(target);

  expect(doc.truncated).toBe(false);
  expect(doc.omitted).toEqual([]);
  expect(
    Buffer.byteLength(JSON.stringify(doc), "utf8"),
    "the whole document fits the budget",
  ).toBeLessThanOrEqual(EXPORT_MAX_BYTES);
  const entryIds = readChart(target).map((e) => e.id).sort();
  expect(drawnIds(doc)).toEqual(entryIds);
});

// ---------------------------------------------------------------------------
// 6. Oversized export reports what was cut
// ---------------------------------------------------------------------------

test("an oversized chart truncates within the byte budget and names the omitted vessels with their entry counts", () => {
  const target = makeTarget();
  writeChart(target, oversizedEntries());
  const entries = readChart(target);

  const doc = chartExport(target);

  expect(
    Buffer.byteLength(JSON.stringify(doc), "utf8"),
    "the returned document fits the budget",
  ).toBeLessThanOrEqual(EXPORT_MAX_BYTES);
  expect(doc.truncated).toBe(true);

  const drawn = new Set(doc.nodes.map((n) => n.id).concat(doc.edges.map((e) => e.id)));
  const missingByOwner = new Map<string, number>();
  for (const entry of entries) {
    if (drawn.has(entry.id)) continue;
    const owner = entry.kind === "vessel" ? entry.id : (entry as { vessel: string }).vessel;
    missingByOwner.set(owner, (missingByOwner.get(owner) ?? 0) + 1);
  }
  expect(missingByOwner.size, "the cut spans more than one vessel").toBeGreaterThan(1);
  expect(
    doc.omitted.map((o) => `${o.vessel}:${o.entries}`).sort(),
    "every omitted vessel named with its omitted count",
  ).toEqual([...missingByOwner].map(([v, c]) => `${v}:${c}`).sort());

  // The kept entries are still charted truth.
  for (const node of doc.nodes) {
    const entry = entries.find((e) => e.id === node.id);
    expect(entry, `node ${node.id} has a charted counterpart`).toBeDefined();
    expect(node.trust, `${node.id}: trust`).toBe(entry!.trust);
    expect(node.anchors, `${node.id}: anchors`).toEqual(entry!.anchors);
  }
  expect(exportSchemaValidator()(doc), "the truncated document against the schema").toBe(true);
});

// ---------------------------------------------------------------------------
// 7. Export leaves no trace on the Chart — through the served handler,
//    because the receipt is the handler's append (task 3.3)
// ---------------------------------------------------------------------------

test("the served chart.export call leaves the Chart byte-identical, touches nothing outside .portolan, and appends exactly one receipt", () => {
  const target = makeTarget();
  writeChart(target, richEntries());

  const chartBefore = snapshotChartBytes(target);
  expect(chartBefore.has("index.jsonl")).toBe(true);
  const outsideBefore = snapshotOutsideStats(target);
  expect(outsideBefore.size).toBeGreaterThan(0);
  expect(readReceipts(target)).toEqual([]); // empty log before the call

  const result = exportToolSpec().handler({}, { targetRoot: target }) as GraphExport;
  expect(result.format).toBe("portolan-adjacency"); // structured pass-through

  // The Chart on disk is byte-identical afterwards.
  expect(snapshotChartBytes(target)).toEqual(chartBefore);
  // No file outside <target>/.portolan/ was even touched (size or mtime).
  expect(snapshotOutsideStats(target)).toEqual(outsideBefore);
  // The only write under .portolan: exactly one ship's-log receipt naming
  // the export call.
  const receipts = readReceipts(target, { command: "chart.export" });
  expect(receipts).toHaveLength(1);
  expect(readReceipts(target)).toHaveLength(1);
  expect(receipts[0]!.outcome).toMatch(/ok/);
});

// ---------------------------------------------------------------------------
// 8. Fairways alone over budget refuse by name — served, because the
//    no-receipt claim spans the handler (review fix, formats-pass)
// ---------------------------------------------------------------------------

test("fairways alone over the budget are an ExportError naming the budget, with no document, no receipt, and no chart mutation", () => {
  const target = makeTarget();
  // The port has real bytes so its drift is provable: if the builder
  // refreshed staleness before refusing, the index would move under us.
  mkdirSync(join(target, "port"), { recursive: true });
  const drifted = join(target, "port", "port.ts");
  writeFileSync(drifted, "// the port module\n");
  // Fat anchor paths: twelve fairways serialize past the budget even with
  // every vessel cut, so no honest cut remains.
  const fat = Math.ceil(EXPORT_MAX_BYTES / 10);
  const entries: ChartEntry[] = [vessel("port", { paths: ["port"] }), vessel("warehouse")];
  for (let i = 0; i < 12; i++) {
    entries.push(
      fairway(`fw-fat-${i}`, "port", "warehouse", {
        anchors: [{ type: "file", path: "x".repeat(fat), line: 1 }],
      }),
    );
  }
  writeChart(target, entries);
  // An outside force drifts the port after the survey.
  writeFileSync(drifted, readFileSync(drifted, "utf8") + "// drifted by an outside force\n");
  const chartBefore = snapshotChartBytes(target);
  expect(readReceipts(target)).toEqual([]); // empty log before the call

  let err: unknown;
  try {
    exportToolSpec().handler({}, { targetRoot: target });
  } catch (e) {
    err = e;
  }

  expect(err, "the refusal, not an over-budget document").toBeInstanceOf(ExportError);
  expect((err as Error).message).toContain(String(EXPORT_MAX_BYTES));
  expect((err as Error).message).toMatch(/budget/);
  // The refusal writes nothing: no receipt is appended...
  expect(readReceipts(target)).toEqual([]);
  // ...and the staleness refresh does not run either — the Chart (drifted
  // index included) is byte-identical after the refused call.
  expect(snapshotChartBytes(target), "the Chart untouched by the refusal").toEqual(chartBefore);
});

// ---------------------------------------------------------------------------
// 9. Two consecutive calls over an unchanged province agree byte for byte
// ---------------------------------------------------------------------------

test("two consecutive chartExport calls over an unchanged province return byte-identical documents", () => {
  const target = makeTarget();
  writeChart(target, richEntries());

  const first = chartExport(target);
  const second = chartExport(target);

  expect(JSON.stringify(second)).toBe(JSON.stringify(first));
});

// ---------------------------------------------------------------------------
// 10. Export of an uncharted province is an honest error
// ---------------------------------------------------------------------------

test("an absent Chart is an honest error naming the absence, never a fabricated document", () => {
  const target = makeTarget();

  let err: unknown;
  try {
    chartExport(target);
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(ExportError);
  expect((err as Error).message).toMatch(/no chart/i);
  expect((err as Error).message).toContain(target);

  // The served tool rejects the same way — no fabricated document.
  expect(() => exportToolSpec().handler({}, { targetRoot: target })).toThrow(/no chart/i);
});
