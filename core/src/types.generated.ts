/**
 * Generated from the format schemas (core/schema/*.schema.json) by
 * scripts/gen-types.ts — do not edit by hand; schema wins (formats-pass,
 * design D7). Regenerate with `bun run scripts/gen-types.ts`; a committed
 * copy that differs from today's schemas fails the drift guard in
 * core/src/formats.test.ts.
 */

/** The closed trust vocabulary (chart notation): exactly five labels, one per claim. measured: taken from source directly; charted: from manifests/metadata; reported: from docs/commits/tickets — claims, not facts; doubtful: evidence present, could not be validated; unsurveyed: no usable evidence, never faked. Single source of the enum (design D2): chart.schema.json references this file by $id, and a validator needs both files registered. */
type TrustLabel = "measured" | "charted" | "reported" | "doubtful" | "unsurveyed";

/** Optional closed relation vocabulary on a fairway: build, runtime, config. A fairway without a relation stays valid and reads as untyped. */
type FairwayRelation = "build" | "runtime" | "config";

export type Anchor =
  | { type: "file"; path: string; line?: number }
  | { type: "manifest"; path: string; key: string }
  | { type: "receipt"; id: string };

export interface VesselEntry {
  kind: "vessel";
  id: string;
  name: string;
  behavior?: string;
  paths: string[];
  signature?: { hash: string; files: number };
  note?: string;
  anchors: Anchor[];
  trust: TrustLabel;
  stale?: boolean;
}

export interface FairwayEntry {
  kind: "fairway";
  id: string;
  from: string;
  to: string;
  relation?: FairwayRelation;
  note?: string;
  anchors: Anchor[];
  trust: TrustLabel;
  stale?: boolean;
}

export interface PortOfEntryEntry {
  kind: "portOfEntry";
  id: string;
  vessel: string;
  protocol: string;
  note?: string;
  anchors: Anchor[];
  trust: TrustLabel;
  stale?: boolean;
}

export interface BeaconEntry {
  kind: "beacon";
  id: string;
  vessel: string;
  surface: "env" | "flag" | "port";
  key: string;
  note?: string;
  anchors: Anchor[];
  trust: TrustLabel;
  stale?: boolean;
}

export interface LightEntry {
  kind: "light";
  id: string;
  vessel: string;
  name: string;
  note?: string;
  anchors: Anchor[];
  trust: TrustLabel;
  stale?: boolean;
}

export interface DangerEntry {
  kind: "danger";
  id: string;
  vessel: string;
  category: "rock" | "shallow" | "wreck";
  note: string;
  anchors: Anchor[];
  trust: TrustLabel;
  stale?: boolean;
}

export type ChartEntry =
  | VesselEntry
  | FairwayEntry
  | PortOfEntryEntry
  | BeaconEntry
  | LightEntry
  | DangerEntry;

/** One line of <target>/.portolan/log.jsonl — the append-only receipt the log writes per executed command (core/src/tools/log.ts). The writer is authoritative (design D3): this schema documents what log.ts writes, ids are monotonic and citable as chart anchors, and no field outside the six named ones may appear. */
export interface Receipt {
  /** Monotonic, assigned by the log: r1, r2, ... — citable as a receipt anchor. */
  id: string;
  /** Command identity, e.g. `sweep pattern=UserService`. */
  command: string;
  /** What was surveyed, e.g. the module or path scope. Optional — short probes may carry none. */
  scope?: string;
  /** Outcome, e.g. `ok: 3 chunks` or `error: missing binary ctags`. */
  outcome: string;
  /** ISO timestamp of the append (the log writes Date.prototype.toISOString). */
  recordedAt: string;
  /** Free-form command metadata (counts, notes, cited receipts). Open object: the log does not constrain keys or value shapes. */
  meta?: { [key: string]: unknown };
}
