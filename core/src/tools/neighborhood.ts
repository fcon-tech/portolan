/**
 * `chart.neighborhood`: one vessel's fairway neighborhood in one
 * deterministic call (openspec/changes/chart-neighborhood,
 * specs/tools/spec.md).
 *
 * Traversal follows charted fairways only, out to the requested depth
 * (default 1, at most 3) in the requested direction (`in`, `out`, or
 * `both`; default `both`), visiting each vessel at most once so a cycle
 * cannot recurse. The returned vessels — the queried vessel plus every
 * vessel a kept edge touches — are ordered by direct fan-in over the whole
 * chart (the count of charted incoming fairways), highest first, and edges
 * are packed greedily in that rank order under the budget: at most
 * `maxEdges` edges (default 40, cap 200) and at most `maxBytes` of
 * serialized response (default 32768, cap 131072). The byte budget governs
 * the whole serialized response: edges pack under it first, and if the
 * assembled response still overflows — typically a touched vessel carrying
 * many ports of entry — vessels are dropped from the tail of the rank order
 * (never the queried vessel) until it fits. A budget that cuts the
 * neighborhood is loud: `truncated` plus the `droppedEdges` and
 * `droppedVessels` counts, never a silent prefix. An edge's rank key is the
 * fan-in of the neighbor it was discovered through (ties broken by edge
 * id), so packing is deterministic.
 *
 * By default the response serves chart truth as stored. With `verify: true`
 * every returned edge's anchors are re-sounded through the deterministic
 * `sound.anchor` machinery; each edge then carries its verdict and the
 * anchors that failed. Only an edge with at least one sounded anchor, all
 * confirmed, stands confirmed — an anchorless edge resolves nothing and is
 * refuted, and an anchor that cannot be sounded at all refutes its edge by
 * name. A refuted sounding never modifies the Chart — the verdict informs,
 * the Cartographer writes.
 *
 * Staleness follows chart.read semantics: staleness is refreshed before
 * answering, so pending correction is visible, never hidden. That refresh
 * is the only write this call may cause (nothing on unchanged signatures);
 * the per-call ship's-log receipt is the serving handler's append.
 */
import type {
  Anchor,
  FairwayEntry,
  FairwayRelation,
  IndexedEntry,
  PortOfEntryEntry,
  TrustLabel,
  VesselEntry,
} from "../types";
import { readChart } from "../chart-store";
import { refreshStaleness } from "../staleness";
import { SoundingError, soundAnchor } from "./sound";

// ---------------------------------------------------------------------------
// The call contract: directions, defaults, caps
// ---------------------------------------------------------------------------

/** The closed direction vocabulary. */
export const NEIGHBORHOOD_DIRECTIONS = ["in", "out", "both"] as const;

export type NeighborhoodDirection = (typeof NEIGHBORHOOD_DIRECTIONS)[number];

/** Defaults and caps: conservative budgets a caller cannot inflate. */
export const NEIGHBORHOOD_DEFAULTS = {
  direction: "both",
  depth: 1,
  maxEdges: 40,
  maxBytes: 32768,
} as const;

export const NEIGHBORHOOD_CAPS = {
  depth: 3,
  maxEdges: 200,
  maxBytes: 131072,
} as const;

/** Raised for every rejection of this tool: bad parameters, unsurveyed vessel. */
export class NeighborhoodError extends Error {
  constructor(message: string) {
    super(`neighborhood: ${message}`);
    this.name = "NeighborhoodError";
  }
}

export interface NeighborhoodParams {
  /** The vessel whose neighborhood is asked for. */
  vessel: string;
  /** Which fairways count as touching: default `both`. */
  direction?: NeighborhoodDirection;
  /** Hops to traverse: default 1, at most 3. */
  depth?: number;
  /** Edge budget: default 40, at most 200. */
  maxEdges?: number;
  /** Serialized-response budget in bytes: default 32768, at most 131072. */
  maxBytes?: number;
  /** Re-sound every returned edge's anchors: default false. */
  verify?: boolean;
}

// ---------------------------------------------------------------------------
// The response shapes
// ---------------------------------------------------------------------------

export interface NeighborhoodPortOfEntry {
  id: string;
  protocol: string;
  trust: TrustLabel;
  anchors: Anchor[];
}

export interface NeighborhoodVessel {
  id: string;
  trust: TrustLabel;
  stale: boolean;
  /** Direct fan-in over the whole chart: charted incoming fairways. */
  fanIn: number;
  portsOfEntry: NeighborhoodPortOfEntry[];
}

export interface NeighborhoodEdgeVerification {
  verdict: "confirmed" | "refuted";
  /** The cited anchors whose sounding refuted, in citation order. */
  refutedAnchors: Anchor[];
}

export interface NeighborhoodEdge {
  id: string;
  from: string;
  to: string;
  trust: TrustLabel;
  /** Present exactly when the charted fairway carries one; absent reads untyped. */
  relation?: FairwayRelation;
  /** The charted note rides along: it is stored truth and counts toward the byte budget. */
  note?: string;
  stale: boolean;
  anchors: Anchor[];
  /** Present exactly when `verify: true`. */
  verification?: NeighborhoodEdgeVerification;
}

export interface NeighborhoodResponse {
  vessel: string;
  direction: NeighborhoodDirection;
  depth: number;
  edges: NeighborhoodEdge[];
  /** Queried vessel plus every vessel a kept edge touches, fan-in ranked. */
  vessels: NeighborhoodVessel[];
  truncated: boolean;
  droppedEdges: number;
  /** Vessels dropped from the tail of the rank order to fit `maxBytes`. */
  droppedVessels: number;
}

// ---------------------------------------------------------------------------
// Parameter validation: strict, parameter-named, loud
// ---------------------------------------------------------------------------

function requireVessel(params: NeighborhoodParams): string {
  const { vessel } = params;
  if (typeof vessel !== "string" || vessel.length === 0) {
    throw new NeighborhoodError("vessel must be a non-empty string naming a charted vessel");
  }
  return vessel;
}

function requireDirection(params: NeighborhoodParams): NeighborhoodDirection {
  const { direction } = params;
  if (direction === undefined) return NEIGHBORHOOD_DEFAULTS.direction;
  if (!(NEIGHBORHOOD_DIRECTIONS as readonly string[]).includes(direction)) {
    throw new NeighborhoodError(
      `direction must be one of ${NEIGHBORHOOD_DIRECTIONS.join(", ")}, got ${JSON.stringify(direction)}`,
    );
  }
  return direction;
}

function requireBoundedInt(
  params: NeighborhoodParams,
  key: "depth" | "maxEdges" | "maxBytes",
  min: number,
  max: number,
): number {
  const value = params[key];
  if (value === undefined) {
    return NEIGHBORHOOD_DEFAULTS[key] as number;
  }
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    throw new NeighborhoodError(`${key} must be an integer between ${min} and ${max}, got ${JSON.stringify(value)}`);
  }
  return value;
}

function requireVerify(params: NeighborhoodParams): boolean {
  const { verify } = params;
  if (verify === undefined) return false;
  if (typeof verify !== "boolean") {
    throw new NeighborhoodError(`verify must be a boolean, got ${JSON.stringify(verify)}`);
  }
  return verify;
}

// ---------------------------------------------------------------------------
// The engine
// ---------------------------------------------------------------------------

type ChartedFairway = IndexedEntry & FairwayEntry;
type ChartedVessel = IndexedEntry & VesselEntry;

/** Descending fan-in, ties broken by id — the one ranking this tool serves. */
function rankBy(fanIn: Map<string, number>): (a: string, b: string) => number {
  return (a, b) => {
    const fa = fanIn.get(a) ?? 0;
    const fb = fanIn.get(b) ?? 0;
    if (fa !== fb) return fb - fa;
    return a < b ? -1 : a > b ? 1 : 0;
  };
}

/**
 * `chart.neighborhood`: the queried vessel's neighborhood, ranked and
 * budgeted. Deterministic — no timestamps, no map-order leakage: two runs
 * over an unchanged province return the same response in the same order.
 */
export function neighborhood(targetRoot: string, params: NeighborhoodParams): NeighborhoodResponse {
  const vesselId = requireVessel(params);
  const direction = requireDirection(params);
  const depth = requireBoundedInt(params, "depth", 1, NEIGHBORHOOD_CAPS.depth);
  const maxEdges = requireBoundedInt(params, "maxEdges", 1, NEIGHBORHOOD_CAPS.maxEdges);
  const maxBytes = requireBoundedInt(params, "maxBytes", 1, NEIGHBORHOOD_CAPS.maxBytes);
  const verify = requireVerify(params);

  // chart.read semantics: staleness is refreshed before answering. On
  // unchanged signatures the refresh writes nothing at all.
  refreshStaleness(targetRoot);
  const entries = readChart(targetRoot);

  const vessels = new Map<string, ChartedVessel>();
  const incoming = new Map<string, ChartedFairway[]>();
  const outgoing = new Map<string, ChartedFairway[]>();
  const ports = new Map<string, PortOfEntryEntry[]>();
  const fanIn = new Map<string, number>();
  for (const entry of entries) {
    if (entry.kind === "vessel") {
      vessels.set(entry.id, entry);
    } else if (entry.kind === "fairway") {
      const outs = outgoing.get(entry.from) ?? [];
      outs.push(entry);
      outgoing.set(entry.from, outs);
      const ins = incoming.get(entry.to) ?? [];
      ins.push(entry);
      incoming.set(entry.to, ins);
      fanIn.set(entry.to, (fanIn.get(entry.to) ?? 0) + 1);
    } else if (entry.kind === "portOfEntry") {
      const list = ports.get(entry.vessel) ?? [];
      list.push(entry);
      ports.set(entry.vessel, list);
    }
  }
  const byId = (a: { id: string }, b: { id: string }): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  for (const list of incoming.values()) list.sort(byId);
  for (const list of outgoing.values()) list.sort(byId);
  for (const list of ports.values()) list.sort(byId);

  if (!vessels.has(vesselId)) {
    throw new NeighborhoodError(
      `vessel ${JSON.stringify(vesselId)} is not on the Chart (unsurveyed): no charted vessel carries this id`,
    );
  }

  // Breadth-first traversal over charted fairways; each vessel is visited at
  // most once, so a cycle terminates, and each fairway is considered once.
  const visited = new Set<string>([vesselId]);
  const seenEdges = new Set<string>();
  const candidates: Array<{ fairway: ChartedFairway; neighbor: string }> = [];
  const frontier: Array<{ id: string; hop: number }> = [{ id: vesselId, hop: 0 }];
  while (frontier.length > 0) {
    const { id, hop } = frontier.shift()!;
    if (hop >= depth) continue;
    const nexts: string[] = [];
    if (direction !== "out") {
      for (const fairway of incoming.get(id) ?? []) {
        if (seenEdges.has(fairway.id)) continue;
        seenEdges.add(fairway.id);
        candidates.push({ fairway, neighbor: fairway.from });
        if (!visited.has(fairway.from)) {
          visited.add(fairway.from);
          nexts.push(fairway.from);
        }
      }
    }
    if (direction !== "in") {
      for (const fairway of outgoing.get(id) ?? []) {
        if (seenEdges.has(fairway.id)) continue;
        seenEdges.add(fairway.id);
        candidates.push({ fairway, neighbor: fairway.to });
        if (!visited.has(fairway.to)) {
          visited.add(fairway.to);
          nexts.push(fairway.to);
        }
      }
    }
    for (const next of nexts) frontier.push({ id: next, hop: hop + 1 });
  }
  const neighborRank = rankBy(fanIn);
  candidates.sort((a, b) => {
    const byNeighbor = neighborRank(a.neighbor, b.neighbor);
    return byNeighbor !== 0 ? byNeighbor : byId(a.fairway, b.fairway);
  });

  // With verify: true, every returned edge's anchors are re-sounded once per
  // edge (memoized — the packing probe may ask twice); the Chart is never
  // written: the verdict informs, the Cartographer writes. An anchor that
  // cannot be sounded at all — a non-citable one, reachable only by direct
  // index edits — does not resolve, so it refutes its edge by name instead
  // of crashing the verify; an edge citing no anchor resolves nothing and is
  // refuted too.
  const verifications = new Map<string, NeighborhoodEdgeVerification>();
  const verificationOf = (fairway: ChartedFairway): NeighborhoodEdgeVerification => {
    const cached = verifications.get(fairway.id);
    if (cached) return cached;
    const refutedAnchors: Anchor[] = [];
    let sounded = 0;
    for (const anchor of fairway.anchors) {
      try {
        if (soundAnchor(targetRoot, { anchor }).verdict === "refuted") refutedAnchors.push(anchor);
        sounded++;
      } catch (err) {
        if (!(err instanceof SoundingError)) throw err;
        refutedAnchors.push(anchor);
      }
    }
    const result: NeighborhoodEdgeVerification = {
      verdict: sounded > 0 && refutedAnchors.length === 0 ? "confirmed" : "refuted",
      refutedAnchors,
    };
    verifications.set(fairway.id, result);
    return result;
  };

  const toEdge = (fairway: ChartedFairway): NeighborhoodEdge => ({
    id: fairway.id,
    from: fairway.from,
    to: fairway.to,
    trust: fairway.trust,
    ...(fairway.relation !== undefined ? { relation: fairway.relation } : {}),
    ...(fairway.note !== undefined ? { note: fairway.note } : {}),
    stale: fairway.stale,
    anchors: fairway.anchors,
    ...(verify ? { verification: verificationOf(fairway) } : {}),
  });

  const toVessel = (id: string): NeighborhoodVessel => {
    const vessel = vessels.get(id);
    return {
      id,
      // A fairway endpoint with no charted vessel entry is served honestly
      // as what it is: unsurveyed.
      trust: vessel?.trust ?? "unsurveyed",
      stale: vessel?.stale ?? false,
      fanIn: fanIn.get(id) ?? 0,
      portsOfEntry: (ports.get(id) ?? []).map((port) => ({
        id: port.id,
        protocol: port.protocol,
        trust: port.trust,
        anchors: port.anchors,
      })),
    };
  };

  const assemble = (kept: ChartedFairway[], droppedVessels: number): NeighborhoodResponse => {
    const touched = new Set<string>([vesselId]);
    for (const fairway of kept) {
      touched.add(fairway.from);
      touched.add(fairway.to);
    }
    const vesselRank = rankBy(fanIn);
    const ranked = [...touched].sort(vesselRank);
    // Tail drops never touch the queried vessel, even when it ranks low.
    const dropped = new Set<string>();
    for (let i = ranked.length - 1; i >= 0 && dropped.size < droppedVessels; i--) {
      if (ranked[i] !== vesselId) dropped.add(ranked[i] as string);
    }
    return {
      vessel: vesselId,
      direction,
      depth,
      edges: kept.map(toEdge),
      vessels: ranked.filter((id) => !dropped.has(id)).map(toVessel),
      truncated: candidates.length > kept.length || dropped.size > 0,
      droppedEdges: candidates.length - kept.length,
      droppedVessels: dropped.size,
    };
  };

  // Greedy packing in rank order under both budgets: a prefix of the ranked
  // candidates, and the first edge that no longer fits drops it and all
  // after it. The bytes measured here are the serialized edges — the
  // touched-vessel list is budgeted whole, below. The cut is stated, never
  // smoothed over.
  const kept: ChartedFairway[] = [];
  for (const candidate of candidates) {
    if (kept.length >= maxEdges) break;
    kept.push(candidate.fairway);
    if (Buffer.byteLength(JSON.stringify(kept.map(toEdge)), "utf8") <= maxBytes) continue;
    kept.pop();
    break;
  }
  // The byte budget governs the whole serialized response: if the
  // edge-packed response still overflows — typically a touched vessel
  // carrying many ports of entry — vessels are dropped from the tail of the
  // rank order until it fits. The queried vessel is never dropped, so a
  // province whose every cut still leaves the queried vessel over budget
  // serves over budget rather than serve a hole.
  let droppedVessels = 0;
  const droppable = assemble(kept, 0).vessels.length - 1;
  while (
    droppedVessels < droppable &&
    Buffer.byteLength(JSON.stringify(assemble(kept, droppedVessels)), "utf8") > maxBytes
  ) {
    droppedVessels++;
  }
  return assemble(kept, droppedVessels);
}
