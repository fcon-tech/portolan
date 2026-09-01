/**
 * The ship's log: an append-only receipt for every command an expedition
 * runs, stored as JSONL under `<target>/.portolan/log.jsonl`. Receipt ids
 * are monotonic (`r1`, `r2`, ...) and citable as chart anchors. Appends are
 * serialized by a `.portolan/log.lock` exclusive-create lock — the MCP
 * server and the harbor CLI are separate processes over one log, and two
 * readers computing `max+1` at once would mint duplicate ids. Existing
 * receipts are never altered or removed — the only write any probe tool
 * performs lands here, inside the `.portolan` perimeter.
 * specs/tools/spec.md
 */
import {
  appendFileSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";
import type { Anchor } from "../types";

export const SHIPS_LOG_FILE = "log.jsonl";
export const LOG_LOCK_FILE = "log.lock";

/** How long an append waits out a live lock before naming the contention. */
const LOCK_DEADLINE_MS = 2_000;
/** A lock older than this belongs to a crashed process and is stolen. */
const LOCK_STALE_MS = 10_000;

/** Where the ship's log lives for a given target root. */
export function logFile(targetRoot: string): string {
  return join(targetRoot, ".portolan", SHIPS_LOG_FILE);
}

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

function parseLine(line: string, file: string, lineNo: number): Receipt {
  try {
    const receipt = JSON.parse(line) as Receipt;
    if (
      typeof receipt?.id !== "string" ||
      typeof receipt.command !== "string" ||
      typeof receipt.outcome !== "string" ||
      typeof receipt.recordedAt !== "string"
    ) {
      throw new Error("not a receipt");
    }
    return receipt;
  } catch {
    throw new LogError(`corrupt ship's log ${file} line ${lineNo}: not a receipt`);
  }
}

function readAll(targetRoot: string): Receipt[] {
  const file = logFile(targetRoot);
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line, index) => parseLine(line, file, index + 1));
}

function maxSequence(receipts: Receipt[]): number {
  let max = 0;
  for (const receipt of receipts) {
    const match = /^r(\d+)$/.exec(receipt.id);
    if (match !== null) max = Math.max(max, Number(match[1]));
  }
  return max;
}

/**
 * Hold the log's exclusive-create lock across one read-compute-append
 * cycle, so concurrent processes (MCP server + harbor CLI) cannot mint the
 * same receipt id. A lock left by a crashed process is stolen once it is
 * older than LOCK_STALE_MS; a live contention is waited out briefly and
 * then named loudly — an append never proceeds unserialized.
 */
function withLogLock<T>(targetRoot: string, fn: () => T): T {
  const portDir = join(targetRoot, ".portolan");
  const lockPath = join(portDir, LOG_LOCK_FILE);
  mkdirSync(portDir, { recursive: true });
  const deadline = Date.now() + LOCK_DEADLINE_MS;
  let fd: number;
  for (;;) {
    try {
      fd = openSync(lockPath, "wx");
      break;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
      try {
        if (Date.now() - statSync(lockPath).mtimeMs > LOCK_STALE_MS) {
          rmSync(lockPath, { force: true });
          continue; // stolen — try to take it immediately
        }
      } catch {
        continue; // the lock vanished between stat and steal — retry
      }
      if (Date.now() > deadline) {
        throw new LogError(
          `the ship's log is locked: ${lockPath} is held by another append (or is stuck)` +
            ` — delete the stale lock to proceed`,
        );
      }
      Bun.sleepSync(25);
    }
  }
  try {
    return fn();
  } finally {
    closeSync(fd);
    unlinkSync(lockPath);
  }
}

/** `log.append`: append one receipt per executed command; returns it. */
export function appendReceipt(targetRoot: string, input: ReceiptInput): Receipt {
  return withLogLock(targetRoot, () => {
    const file = logFile(targetRoot);
    const existing = readAll(targetRoot);
    const next = maxSequence(existing) + 1;

    let id = `r${next}`;
    if (input.id !== undefined) {
      if (existing.some((receipt) => receipt.id === input.id)) {
        // Append-only: re-appending an existing id is an attempted alteration.
        throw new LogError(
          `the ship's log is append-only: receipt ${input.id} already exists and cannot be altered or replaced`,
        );
      }
      const match = /^r(\d+)$/.exec(input.id);
      if (match === null || Number(match[1]) !== next) {
        throw new LogError(
          `receipt ids are assigned by the log: expected r${next}, got ${input.id}`,
        );
      }
      id = input.id;
    }

    const receipt: Receipt = {
      id,
      command: input.command,
      ...(input.scope !== undefined ? { scope: input.scope } : {}),
      outcome: input.outcome,
      recordedAt: new Date().toISOString(),
      ...(input.meta !== undefined ? { meta: input.meta } : {}),
    };
    mkdirSync(join(targetRoot, ".portolan"), { recursive: true });
    // One receipt per line, written with a single atomic append.
    appendFileSync(file, `${JSON.stringify(receipt)}\n`);
    return receipt;
  });
}

/** `log.read`: resolve one receipt by id; undefined when absent. */
export function readReceipt(targetRoot: string, id: string): Receipt | undefined {
  return readAll(targetRoot).find((receipt) => receipt.id === id);
}

/** `log.read`: receipts matching every provided filter field exactly. */
export function readReceipts(targetRoot: string, filter: ReceiptFilter = {}): Receipt[] {
  return readAll(targetRoot).filter(
    (receipt) =>
      (filter.command === undefined || receipt.command === filter.command) &&
      (filter.scope === undefined || receipt.scope === filter.scope) &&
      (filter.outcome === undefined || receipt.outcome === filter.outcome),
  );
}

/** The anchor form a chart entry cites when it references a receipt. */
export function receiptAnchor(id: string): Anchor {
  return { type: "receipt", id };
}

/** Resolve a chart anchor that cites a receipt id back to the receipt. */
export function resolveReceiptAnchor(targetRoot: string, anchor: Anchor): Receipt | undefined {
  if (anchor.type !== "receipt") {
    throw new LogError(`not a receipt anchor: ${JSON.stringify(anchor)}`);
  }
  return readReceipt(targetRoot, anchor.id);
}
