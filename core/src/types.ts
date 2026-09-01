/**
 * Chart ontology — the vocabulary of the Padrón.
 *
 * Terminology is locked by docs/MANIFEST.md: vessel, fairway, port of entry,
 * beacon, light, danger, anchor, trust label, pending correction, Notices to
 * Mariners. Every entry carries at least one anchor and exactly one trust
 * label; the store rejects writes that omit either.
 */

/** The closed trust vocabulary (chart notation). */
export const TRUST_LABELS = [
  "measured",
  "charted",
  "reported",
  "doubtful",
  "unsurveyed",
] as const;

export type TrustLabel = (typeof TRUST_LABELS)[number];

/** The six chart entry kinds. */
export const ENTRY_KINDS = [
  "vessel",
  "fairway",
  "portOfEntry",
  "beacon",
  "light",
  "danger",
] as const;

export type EntryKind = (typeof ENTRY_KINDS)[number];

/**
 * An anchor ties a claim to evidence: a file path (with optional line), a
 * manifest key, or a receipt id from the ship's log.
 */
export type Anchor =
  | { type: "file"; path: string; line?: number }
  | { type: "manifest"; path: string; key: string }
  | { type: "receipt"; id: string };

/** Render an anchor as a compact, human-readable string. */
export function formatAnchor(anchor: Anchor): string {
  switch (anchor.type) {
    case "file":
      return anchor.line === undefined ? anchor.path : `${anchor.path}:${anchor.line}`;
    case "manifest":
      return `${anchor.path}#${anchor.key}`;
    case "receipt":
      return `receipt:${anchor.id}`;
  }
}

interface EntryBase {
  /** Stable identifier, unique across the chart. */
  id: string;
  /** At least one anchor is mandatory. */
  anchors: Anchor[];
  /** Exactly one trust label is mandatory. */
  trust: TrustLabel;
  /** Free-form qualification; never a substitute for evidence. */
  note?: string;
}

/** A deployable unit. */
export interface VesselEntry extends EntryBase {
  kind: "vessel";
  name: string;
  /**
   * What the vessel does at runtime. Absent behavior is rendered as
   * `unsurveyed` on the sheet — absence stays visible, never omitted.
   */
  behavior?: string;
  /** Source paths (relative to the target root) covered by the tree signature. */
  paths: string[];
}

/**
 * The closed relation vocabulary on a fairway — the senses the anchors can
 * actually support. Optional: a fairway without a relation stays valid and
 * reads as untyped.
 */
export const FAIRWAY_RELATIONS = ["build", "runtime", "config"] as const;

export type FairwayRelation = (typeof FAIRWAY_RELATIONS)[number];

/** A typed dependency edge between two vessels. */
export interface FairwayEntry extends EntryBase {
  kind: "fairway";
  from: string;
  to: string;
  /** When known: what kind of dependence the edge is. */
  relation?: FairwayRelation;
}

/** An entry point into a vessel (http endpoint, cli, event, job, ...). */
export interface PortOfEntryEntry extends EntryBase {
  kind: "portOfEntry";
  vessel: string;
  /** Short protocol family, e.g. "http", "cli", "gradle task". */
  protocol: string;
}

/** A configuration surface: env var, flag, or port. */
export interface BeaconEntry extends EntryBase {
  kind: "beacon";
  vessel: string;
  surface: "env" | "flag" | "port";
  /** The configured key, e.g. "PORT", "--verbose", "8080". */
  key: string;
}

/** An API contract surface: endpoint, exported symbol, CLI flag, event. */
export interface LightEntry extends EntryBase {
  kind: "light";
  vessel: string;
  /** The contract's name, e.g. "GET /api/users" or "export function parse()". */
  name: string;
}

/** A smell or risk. Categories per the locked glossary: rock / shallow / wreck. */
export interface DangerEntry extends EntryBase {
  kind: "danger";
  vessel: string;
  category: "rock" | "shallow" | "wreck";
  /** What the danger is. */
  note: string;
}

export type ChartEntry =
  | VesselEntry
  | FairwayEntry
  | PortOfEntryEntry
  | BeaconEntry
  | LightEntry
  | DangerEntry;

/** Cheap tree signature over a vessel's paths (see design.md, decision 3). */
export interface VesselSignature {
  hash: string;
  files: number;
}

/**
 * An entry as stored in `index.jsonl`: the chart entry plus store metadata
 * (`stale` marks pending correction; `signature` is present on vessels only).
 */
export type IndexedEntry = ChartEntry & {
  stale: boolean;
  signature?: VesselSignature;
};

/** What a Notice to Mariners reports about one entry. */
export type NoticeAction = "added" | "corrected" | "markedStale" | "retired";

export interface Notice {
  action: NoticeAction;
  kind: EntryKind;
  id: string;
  note?: string;
  anchors: Anchor[];
}
