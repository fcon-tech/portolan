/**
 * The ship's log: an append-only receipt for every command an expedition
 * runs, stored as JSONL under `<target>/.portolan/log.jsonl`. Receipt ids
 * are monotonic (`r1`, `r2`, ...) and citable as chart anchors. Existing
 * receipts are never altered or removed.
 * (openspec/changes/probe-tools, specs/tools/spec.md)
 */
import type { Anchor } from "../types";

export const SHIPS_LOG_FILE = "log.jsonl";

export interface Receipt {
  /** Stable, monotonic, citable as an anchor: r1, r2, ... */
  id: string;
  /** Command identity, e.g. `sweep pattern=UserService`. */
  command: string;
  /** What was surveyed, e.g. the module or path scope. */
  scope?: string;
  /** Outcome, e.g. `ok: 3 chunks` or `error: missing binary ctags`. */
  outcome: string;
  /** ISO timestamp of the append. */
  recordedAt: string;
  meta?: Record<string, unknown>;
}

export type ReceiptInput = Omit<Receipt, "id" | "recordedAt"> & {
  /** Callers normally let the log assign ids; a replayed id is checked. */
  id?: string;
};

export interface ReceiptFilter {
  command?: string;
  scope?: string;
  outcome?: string;
}

export class LogError extends Error {
  constructor(message: string) {
    super(`log: ${message}`);
    this.name = "LogError";
  }
}

/** `log.append`: append one receipt; returns it with its assigned id. */
export function appendReceipt(_targetRoot: string, _input: ReceiptInput): Receipt {
  throw new Error("log.append: not implemented yet (probe-tools tasks 5.1–5.3)");
}

/** `log.read`: resolve one receipt by id; undefined when absent. */
export function readReceipt(_targetRoot: string, _id: string): Receipt | undefined {
  throw new Error("log.read: not implemented yet (probe-tools tasks 5.1–5.3)");
}

/** `log.read`: receipts matching every provided filter field exactly. */
export function readReceipts(
  _targetRoot: string,
  _filter: ReceiptFilter = {},
): Receipt[] {
  throw new Error("log.read: not implemented yet (probe-tools tasks 5.1–5.3)");
}

/** The anchor form a chart entry cites when it references a receipt. */
export function receiptAnchor(id: string): Anchor {
  return { type: "receipt", id };
}
