/**
 * `chart.export`: the province's adjacency graph export in one
 * deterministic document (openspec/changes/formats-pass, design D4 + D5;
 * specs/tools/spec.md + specs/formats/spec.md).
 *
 * The document is arithmetic over the Chart's machine layer and nothing
 * else: every non-fairway entry is drawn as a node — the charted fields
 * as-is plus `stale`, the store's `signature` aside — and every fairway as
 * an edge (from/to vessel ids, the relation when charted, anchors, trust,
 * stale). Nothing is invented, decorated, or re-graded: `doubtful` and
 * `unsurveyed` pass through un-upgraded, a fairway endpoint without a
 * charted vessel is stated by the raw edge id alone, and there are no
 * timestamps and no derived rollups (no top-level `vessels` list, no
 * dangling-endpoint `issues[]`) — the ship's log carries the when. The
 * document names its format (`portolan-adjacency`) and the graph-export
 * schema version it was produced against, read from the schema file itself
 * (design D1: the version lives in the schema file).
 *
 * Staleness follows chart.read semantics: refreshed before answering, so
 * pending correction is visible, never hidden. That refresh is the only
 * write the builder may cause (nothing on unchanged signatures); the
 * builder itself appends nothing and mutates nothing else — the served
 * handler owns the single ship's-log receipt per call. A rejected call
 * writes nothing, not even the refresh: the byte-budget feasibility
 * precheck runs before the refresh, so an over-budget refusal never moves
 * the Chart.
 *
 * The export is byte-budgeted (EXPORT_MAX_BYTES; bytes alone — the export
 * takes no query parameters). An oversized chart is cut whole-vessel: from
 * the tail of the id-ascending vessel order, one vessel at a time, until
 * the serialized document fits, removing each cut vessel's own node and
 * every node it owns, while the fairways stay drawn. The cut is loud:
 * `truncated` plus `omitted`, naming every cut vessel with its cut entry
 * count — never a silent prefix — and it is measured over a running total
 * (each vessel's serialized contribution computed once), not by
 * re-serializing the document per cut. If the fairways alone exceed the
 * budget there is no honest cut left, and the builder refuses by name
 * instead of serving over budget. A province with no Chart is an honest
 * ExportError naming the absence, never a fabricated document.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import graphExportSchema from "../../schema/graph-export.schema.json";
import type {
  Anchor,
  BeaconEntry,
  ChartEntry,
  DangerEntry,
  FairwayRelation,
  IndexedEntry,
  LightEntry,
  PortOfEntryEntry,
  TrustLabel,
  VesselEntry,
} from "../types";
import { INDEX_FILE, chartDir, readChart } from "../chart-store";
import { refreshStaleness } from "../staleness";

/** The document's self-named format (graph-export.schema.json's const). */
const FORMAT = "portolan-adjacency" as const;

/** The graph-export schema version this document is produced against. */
const GRAPH_EXPORT_VERSION: string = graphExportSchema.version;

/**
 * The export's byte budget over the compact serialized document — the bytes
 * a consumer receives. Fixed: the export takes no query parameters to
 * inflate or shrink it (design D5 dropped the records half in favor of
 * bytes alone).
 */
export const EXPORT_MAX_BYTES = 262_144;

/** Raised for every rejection of this tool: no Chart, no honest cut. */
export class ExportError extends Error {
  constructor(message: string) {
    super(`export: ${message}`);
    this.name = "ExportError";
  }
}

/** A charted fairway as an edge: no `kind` tag, `relation` absent when untyped. */
export interface GraphExportEdge {
  id: string;
  from: string;
  to: string;
  relation?: FairwayRelation;
  anchors: Anchor[];
  trust: TrustLabel;
  stale: boolean;
}

/**
 * A charted non-fairway entry, rendered whole: the charted fields as-is
 * plus `stale`, the store's `signature` omitted — typed exactly as the
 * charted entry minus its store signature; the per-kind shapes the document
 * must satisfy are pinned by graph-export.schema.json, not by this alias.
 * The union stays distributed: `Omit` over the entry union as a whole would
 * collapse it to the common keys alone (a vessel's `paths`, a beacon's
 * `surface` and `key`, a danger's `category` — all erased).
 */
type NodeOf<T extends ChartEntry> = Omit<T & { stale: boolean }, "signature">;
export type GraphExportNode =
  | NodeOf<VesselEntry>
  | NodeOf<PortOfEntryEntry>
  | NodeOf<BeaconEntry>
  | NodeOf<LightEntry>
  | NodeOf<DangerEntry>;

/** What `chart.export` returns: the self-describing adjacency document. */
export interface GraphExport {
  format: typeof FORMAT;
  version: string;
  nodes: GraphExportNode[];
  edges: GraphExportEdge[];
  truncated: boolean;
  /** The loud cut report: one record per vessel with entries cut; empty when whole. */
  omitted: Array<{ vessel: string; entries: number }>;
}

/** The vessel an entry hangs from: a vessel is its own owner. */
type DrawnNode = { owner: string; node: GraphExportNode };

/** The charted fairways as edges, in entry order: no `kind` tag, `relation` absent when untyped. */
function edgesOf(entries: IndexedEntry[]): GraphExportEdge[] {
  const edges: GraphExportEdge[] = [];
  for (const entry of entries) {
    if (entry.kind !== "fairway") continue;
    edges.push({
      id: entry.id,
      from: entry.from,
      to: entry.to,
      ...(entry.relation !== undefined ? { relation: entry.relation } : {}),
      anchors: entry.anchors,
      trust: entry.trust,
      stale: entry.stale,
    });
  }
  return edges;
}

/**
 * `chart.export`: the province's adjacency document. Deterministic — no
 * timestamps, no map-order leakage: two runs over an unchanged province
 * return the same document in the same order.
 */
export function chartExport(targetRoot: string): GraphExport {
  const indexPath = join(chartDir(targetRoot), INDEX_FILE);
  if (!existsSync(indexPath)) {
    throw new ExportError(
      `no chart at ${indexPath} — nothing to export; survey the province and write the Chart first`,
    );
  }

  // Feasibility precheck, before any write: the fairways alone bound the
  // document from below (every cut removes only vessels' nodes). If they
  // already exceed the budget there is no honest cut left, and the export
  // refuses before the staleness refresh can move the Chart — a rejected
  // call writes nothing at all.
  const precheck: GraphExport = {
    format: FORMAT,
    version: GRAPH_EXPORT_VERSION,
    nodes: [],
    edges: edgesOf(readChart(targetRoot)),
    truncated: false,
    omitted: [],
  };
  if (Buffer.byteLength(JSON.stringify(precheck), "utf8") > EXPORT_MAX_BYTES) {
    throw new ExportError(
      `the chart's fairways alone exceed the export budget of ${EXPORT_MAX_BYTES} bytes — ` +
        `no vessel left to cut, and the export refuses to serve over budget`,
    );
  }

  // chart.read semantics: staleness is refreshed before answering. On
  // unchanged signatures the refresh writes nothing at all; when it writes,
  // that is the builder's only possible write — and it runs only after the
  // precheck above has accepted the call.
  refreshStaleness(targetRoot);
  const entries = readChart(targetRoot);

  const nodes: DrawnNode[] = [];
  const edges = edgesOf(entries);
  /** Owner vessel id -> how many of its entries are nodes (itself included). */
  const owned = new Map<string, number>();
  for (const entry of entries) {
    if (entry.kind === "fairway") continue;
    // The charted fields as-is: the entry, its store signature aside.
    const { signature: _signature, ...node } = entry;
    const owner = entry.kind === "vessel" ? entry.id : entry.vessel;
    nodes.push({ owner, node });
    owned.set(owner, (owned.get(owner) ?? 0) + 1);
  }

  const owners = [...owned.keys()].sort();
  const cut = new Set<string>();
  const assemble = (): GraphExport => ({
    format: FORMAT,
    version: GRAPH_EXPORT_VERSION,
    nodes: nodes.filter(({ owner }) => !cut.has(owner)).map(({ node }) => node),
    edges,
    truncated: cut.size > 0,
    omitted: owners
      .filter((id) => cut.has(id))
      .map((id) => ({ vessel: id, entries: owned.get(id)! })),
  });

  // The budget is measured on the compact serialization — the bytes a
  // consumer receives for the document itself. Each owner's serialized
  // contribution is computed once; the document total is then a running
  // sum over the kept/cut sets — the skeleton already carries the two
  // `[`…`]` array pairs, and a filled array keeps its own pair — plus the
  // arrays' commas — so the cut is O(vessels), not O(vessels × bytes)
  // re-serializations.
  const nodeBytes = new Map<string, number>();
  for (const { owner, node } of nodes) {
    nodeBytes.set(owner, (nodeBytes.get(owner) ?? 0) + Buffer.byteLength(JSON.stringify(node), "utf8"));
  }
  const omittedBytes = new Map<string, number>(
    owners.map((id) => [id, Buffer.byteLength(JSON.stringify({ vessel: id, entries: owned.get(id)! }), "utf8")]),
  );
  const skeletonBytes = (truncated: boolean): number =>
    Buffer.byteLength(
      JSON.stringify({ format: FORMAT, version: GRAPH_EXPORT_VERSION, nodes: [], edges, truncated, omitted: [] }),
      "utf8",
    );
  const totalBytes = (
    keptBytes: number,
    keptCount: number,
    cutBytes: number,
    cutCount: number,
    truncated: boolean,
  ): number => {
    const commas = (count: number): number => (count > 0 ? count - 1 : 0);
    return skeletonBytes(truncated) + keptBytes + cutBytes + commas(keptCount) + commas(cutCount);
  };

  let keptBytes = 0;
  for (const bytes of nodeBytes.values()) keptBytes += bytes;
  let keptCount = nodes.length;
  let cutBytes = 0;
  let cutCount = 0;
  let overBudget = totalBytes(keptBytes, keptCount, cutBytes, cutCount, false) > EXPORT_MAX_BYTES;
  if (overBudget) {
    // Whole-vessel cut from the tail of the id-ascending order — never a
    // partial vessel, never a silent prefix. Fairways stay drawn: a raw
    // edge id states its endpoints, so an edge whose far vessel was cut is
    // still charted truth (design D4).
    for (let i = owners.length - 1; i >= 0 && overBudget; i--) {
      const id = owners[i]!;
      cut.add(id);
      keptBytes -= nodeBytes.get(id) ?? 0;
      keptCount -= owned.get(id)!;
      cutBytes += omittedBytes.get(id)!;
      cutCount += 1;
      overBudget = totalBytes(keptBytes, keptCount, cutBytes, cutCount, true) > EXPORT_MAX_BYTES;
    }
    if (overBudget) {
      throw new ExportError(
        `the chart's fairways alone exceed the export budget of ${EXPORT_MAX_BYTES} bytes — ` +
          `no vessel left to cut, and the export refuses to serve over budget`,
      );
    }
  }
  // The served bytes are the real serialization, not the running estimate:
  // one full assembly pins the cut to the honest count (and is the paranoid
  // re-check after the refresh, whose flag flips can move edge bytes).
  const doc = assemble();
  if (Buffer.byteLength(JSON.stringify(doc), "utf8") > EXPORT_MAX_BYTES) {
    throw new ExportError(
      `the serialized export exceeds the export budget of ${EXPORT_MAX_BYTES} bytes — ` +
        `the export refuses to serve over budget`,
    );
  }
  return doc;
}
