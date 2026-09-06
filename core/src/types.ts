/**
 * Chart ontology — the vocabulary of the Padrón.
 *
 * Terminology is locked by docs/MANIFEST.md: vessel, fairway, port of entry,
 * beacon, light, danger, anchor, trust label, pending correction, Notices to
 * Mariners. Every entry carries at least one anchor and exactly one trust
 * label; the store rejects writes that omit either.
 *
 * Split (formats-pass, design D7): the entry, anchor, and receipt structural
 * types are generated whole from core/schema/*.schema.json into
 * ./types.generated and re-exported here — schema wins, the mirror cannot
 * drift. This file keeps the hand-written runtime constants and the types
 * the schemas do not own (the store's indexed view, Notices to Mariners).
 */

import type { Anchor, ChartEntry } from "./types.generated";

export * from "./types.generated";

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
 * Render an anchor as a compact, human-readable string.
 */
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

/**
 * The closed relation vocabulary on a fairway — the senses the anchors can
 * actually support. Optional: a fairway without a relation stays valid and
 * reads as untyped.
 */
export const FAIRWAY_RELATIONS = ["build", "runtime", "config"] as const;

export type FairwayRelation = (typeof FAIRWAY_RELATIONS)[number];

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
