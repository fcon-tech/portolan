/**
 * The decision history: the Governor's accepted/declined verdicts on
 * expedition proposals, stored append-only as JSONL under
 * `<target>/.portolan/harbor/history.jsonl` — one line per decision, same
 * shape discipline as the ship's log (design.md, decision 4). Dedupe reads
 * the LAST decision per fingerprint, so an overturned refusal is the
 * Governor's latest will, and nothing already written is ever altered.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { HarborError } from "./errors";
import { harborDir } from "./snapshot";

export const HISTORY_FILE = "history.jsonl";

/** The closed decision vocabulary. */
export const DECISIONS = ["accepted", "declined"] as const;

export type GovernorDecision = (typeof DECISIONS)[number];

/** One recorded decision; `decidedAt` is ISO, like a receipt's `recordedAt`. */
export interface DecisionRecord {
  fingerprint: string;
  decision: GovernorDecision;
  decidedAt: string;
}

/** Where the decision history lives. */
export function historyFile(targetRoot: string): string {
  return join(harborDir(targetRoot), HISTORY_FILE);
}

function parseLine(line: string, file: string, lineNo: number): DecisionRecord {
  try {
    const record = JSON.parse(line) as DecisionRecord;
    if (
      typeof record?.fingerprint !== "string" ||
      (record.decision !== "accepted" && record.decision !== "declined") ||
      typeof record.decidedAt !== "string"
    ) {
      throw new Error("not a decision");
    }
    return record;
  } catch {
    throw new HarborError(`history: corrupt decision history ${file} line ${lineNo}: not a decision`);
  }
}

/** Every recorded decision, oldest first. Empty when no history exists. */
export function readDecisions(targetRoot: string): DecisionRecord[] {
  const file = historyFile(targetRoot);
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line, index) => parseLine(line, file, index + 1));
}

/** The last decision per fingerprint — a map where the latest will wins. */
export function lastDecisionPerFingerprint(records: DecisionRecord[]): Map<string, DecisionRecord> {
  const last = new Map<string, DecisionRecord>();
  for (const record of records) last.set(record.fingerprint, record);
  return last;
}

/** Append one decision; returns the record as stored. Never rewrites a line. */
export function appendDecision(
  targetRoot: string,
  fingerprint: string,
  decision: GovernorDecision,
): DecisionRecord {
  if ((DECISIONS as readonly string[]).includes(decision) === false) {
    throw new HarborError(
      `history: unknown decision ${JSON.stringify(decision)}; the vocabulary is ${DECISIONS.join(", ")}`,
    );
  }
  const record: DecisionRecord = { fingerprint, decision, decidedAt: new Date().toISOString() };
  mkdirSync(harborDir(targetRoot), { recursive: true });
  appendFileSync(historyFile(targetRoot), `${JSON.stringify(record)}\n`);
  return record;
}
