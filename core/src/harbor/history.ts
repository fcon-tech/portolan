/**
 * The decision history: the Governor's accepted/declined verdicts on
 * expedition proposals — and the night watch's records — stored append-only
 * as JSONL under `<target>/.portolan/harbor/history.jsonl`: one line per
 * record, same shape discipline as the ship's log (design.md, decision 4).
 * Dedupe reads the LAST record per fingerprint, so an overturned refusal is
 * the Governor's latest will, and nothing already written is ever altered.
 *
 * Night-watch records (openspec/changes/night-watch, design decision 3):
 * an auto-executed launch appends `accepted` with `by: "night-watch"`
 * BEFORE the launcher runs; if the launch then fails, a `launch-failed`
 * outcome is appended after it — accept-then-append-failure keeps the audit
 * trail honest, and because the failure is the last word on that
 * fingerprint, a failed launch leaves the proposal not-accepted and queued.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { HarborError } from "./errors";
import { harborDir } from "./snapshot";

export const HISTORY_FILE = "history.jsonl";

/** The closed decision vocabulary. */
export const DECISIONS = ["accepted", "declined"] as const;

export type GovernorDecision = (typeof DECISIONS)[number];

/** Attribution the night watch writes; session decisions carry no `by`. */
export const NIGHT_WATCH = "night-watch";

/** Attribution the manual `run` command writes: the Governor's own launch. */
export const GOVERNOR = "governor";

/** Who may append a launch outcome (the closed attribution vocabulary). */
const LAUNCH_ATTRIBUTIONS = new Set([NIGHT_WATCH, GOVERNOR]);

/** One recorded decision; `decidedAt` is ISO, like a receipt's `recordedAt`. */
export interface DecisionRecord {
  fingerprint: string;
  decision: GovernorDecision;
  decidedAt: string;
  /** Who decided; absent = the Governor in session, `night-watch` = the night watch. */
  by?: string;
}

/**
 * A launch outcome: appended after a night-watch acceptance when the
 * external launcher failed (non-zero exit, timeout, or spawn failure). The
 * failed proposal stays queued — the queue filters on `declined` only.
 */
export interface LaunchOutcomeRecord {
  fingerprint: string;
  outcome: "launch-failed";
  recordedAt: string;
  /** Who launched: the night watch or the Governor's manual run. */
  by: string;
  /** Deterministic reason: exit status, timeout, or spawn failure. */
  reason: string;
}

/** Any record the history file may hold. */
export type HistoryRecord = DecisionRecord | LaunchOutcomeRecord;

/** Where the decision history lives. */
export function historyFile(targetRoot: string): string {
  return join(harborDir(targetRoot), HISTORY_FILE);
}

function isDecision(record: HistoryRecord): record is DecisionRecord {
  return (record as DecisionRecord).decision !== undefined;
}

function parseLine(line: string, file: string, lineNo: number): HistoryRecord {
  let record: HistoryRecord;
  try {
    record = JSON.parse(line) as HistoryRecord;
    if (isDecision(record)) {
      if (
        typeof record?.fingerprint !== "string" ||
        (record.decision !== "accepted" && record.decision !== "declined") ||
        typeof record?.decidedAt !== "string" ||
        (record.by !== undefined && typeof record.by !== "string")
      ) {
        throw new Error("not a decision");
      }
    } else if (
      record?.outcome !== "launch-failed" ||
      typeof record?.fingerprint !== "string" ||
      typeof record?.recordedAt !== "string" ||
      typeof record?.by !== "string" ||
      typeof record?.reason !== "string" ||
      record.reason.length === 0
    ) {
      throw new Error("not a launch outcome");
    }
    return record;
  } catch (err) {
    const why = err instanceof Error ? err.message : "not a decision";
    throw new HarborError(`history: corrupt decision history ${file} line ${lineNo}: ${why}`);
  }
}

/** Every recorded history row, oldest first. Empty when no history exists. */
export function readHistory(targetRoot: string): HistoryRecord[] {
  const file = historyFile(targetRoot);
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line, index) => parseLine(line, file, index + 1));
}

/** Every recorded Governor/night-watch decision (launch outcomes excluded), oldest first. */
export function readDecisions(targetRoot: string): DecisionRecord[] {
  return readHistory(targetRoot).filter(isDecision);
}

/** The last decision per fingerprint — a map where the latest will wins. */
export function lastDecisionPerFingerprint(records: DecisionRecord[]): Map<string, DecisionRecord> {
  const last = new Map<string, DecisionRecord>();
  for (const record of records) last.set(record.fingerprint, record);
  return last;
}

/** The last record of any kind per fingerprint — the latest word wins. */
export function lastRecordPerFingerprint(records: HistoryRecord[]): Map<string, HistoryRecord> {
  const last = new Map<string, HistoryRecord>();
  for (const record of records) last.set(record.fingerprint, record);
  return last;
}

/** Append one decision; returns the record as stored. Never rewrites a line. */
export function appendDecision(
  targetRoot: string,
  fingerprint: string,
  decision: GovernorDecision,
  options: { by?: string } = {},
): DecisionRecord {
  if ((DECISIONS as readonly string[]).includes(decision) === false) {
    throw new HarborError(
      `history: unknown decision ${JSON.stringify(decision)}; the vocabulary is ${DECISIONS.join(", ")}`,
    );
  }
  const record: DecisionRecord = { fingerprint, decision, decidedAt: new Date().toISOString() };
  if (options.by !== undefined) record.by = options.by;
  mkdirSync(harborDir(targetRoot), { recursive: true });
  appendFileSync(historyFile(targetRoot), `${JSON.stringify(record)}\n`);
  return record;
}

/**
 * Append a launch failure, attributed to the night watch by default or to
 * the Governor's manual `run` when `{ by: "governor" }`; the deterministic
 * `reason` names the failure for the history reader and the report alike.
 */
export function appendLaunchFailure(
  targetRoot: string,
  fingerprint: string,
  reason: string,
  options: { by?: string } = {},
): LaunchOutcomeRecord {
  const by = options.by ?? NIGHT_WATCH;
  if (!LAUNCH_ATTRIBUTIONS.has(by)) {
    throw new HarborError(
      `history: launch outcome attribution must be ${NIGHT_WATCH} or ${GOVERNOR}, got ${JSON.stringify(by)}`,
    );
  }
  const record: LaunchOutcomeRecord = {
    fingerprint,
    outcome: "launch-failed",
    recordedAt: new Date().toISOString(),
    by,
    reason,
  };
  mkdirSync(harborDir(targetRoot), { recursive: true });
  appendFileSync(historyFile(targetRoot), `${JSON.stringify(record)}\n`);
  return record;
}
