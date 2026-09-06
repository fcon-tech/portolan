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
 * handler owns the single ship's-log receipt per call.
 *
 * The export is byte-budgeted (EXPORT_MAX_BYTES; bytes alone — the export
 * takes no query parameters). An oversized chart is cut whole-vessel: from
 * the tail of the id-ascending vessel order, one vessel at a time, until
 * the serialized document fits, removing each cut vessel's own node and
 * every node it owns, while the fairways stay drawn. The cut is loud:
 * `truncated` plus `omitted`, naming every cut vessel with its cut entry
 * count — never a silent prefix. If the fairways alone exceed the budget
 * there is no honest cut left, and the builder refuses by name instead of
 * serving over budget. A province with no Chart is an honest ExportError
 * naming the absence, never a fabricated document.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import graphExportSchema from "../../schema/graph-export.schema.json";
import type {
  Anchor,
  FairwayRelation,
  IndexedEntry,
  TrustLabel,
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
 */
export type GraphExportNode = Omit<IndexedEntry, "signature">;

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

  // chart.read semantics: staleness is refreshed before answering. On
  // unchanged signatures the refresh writes nothing at all; when it writes,
  // that is the builder's only possible write.
  refreshStaleness(targetRoot);
  const entries = readChart(targetRoot);

  const nodes: DrawnNode[] = [];
  const edges: GraphExportEdge[] = [];
  /** Owner vessel id -> how many of its entries are nodes (itself included). */
  const owned = new Map<string, number>();
  for (const entry of entries) {
    if (entry.kind === "fairway") {
      edges.push({
        id: entry.id,
        from: entry.from,
        to: entry.to,
        ...(entry.relation !== undefined ? { relation: entry.relation } : {}),
        anchors: entry.anchors,
        trust: entry.trust,
        stale: entry.stale,
      });
      continue;
    }
    // The charted fields as-is: the entry, its store signature aside.
    const { signature: _signature, ...node } = entry;
    const owner = entry.kind === "vessel" ? entry.id : entry.vessel;
    nodes.push({ owner, node: node as GraphExportNode });
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
  // consumer receives for the document itself.
  const bytesOf = (doc: GraphExport): number =>
    Buffer.byteLength(JSON.stringify(doc), "utf8");

  let doc = assemble();
  if (bytesOf(doc) > EXPORT_MAX_BYTES) {
    // Whole-vessel cut from the tail of the id-ascending order — never a
    // partial vessel, never a silent prefix. Fairways stay drawn: a raw
    // edge id states its endpoints, so an edge whose far vessel was cut is
    // still charted truth (design D4).
    for (let i = owners.length - 1; i >= 0 && bytesOf(doc) > EXPORT_MAX_BYTES; i--) {
      cut.add(owners[i]!);
      doc = assemble();
    }
    if (bytesOf(doc) > EXPORT_MAX_BYTES) {
      throw new ExportError(
        `the chart's fairways alone exceed the export budget of ${EXPORT_MAX_BYTES} bytes — ` +
          `no vessel left to cut, and the export refuses to serve over budget`,
      );
    }
  }
  return doc;
}
