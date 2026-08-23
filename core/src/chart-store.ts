/**
 * The chart store: read/write of `<target>/.portolan/chart/` — one markdown
 * sheet per vessel plus the machine index `index.jsonl` (authoritative for
 * machines; sheets are rendered outputs). Writes are atomic by
 * stage-to-temp + rename (design.md, decision 4): a write either persists
 * completely or leaves the previous chart byte-identical.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import type { ChartEntry, IndexedEntry } from "./types";
import { validateEntries } from "./validate";
import { renderSheets } from "./sheets";

export const INDEX_FILE = "index.jsonl";

/** Where the Chart lives for a given target root. */
export function chartDir(targetRoot: string): string {
  return join(targetRoot, ".portolan", "chart");
}

function entryKey(entry: { kind: string; id: string }): string {
  return `${entry.kind}/${entry.id}`;
}

function sortEntries<T extends { kind: string; id: string }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const ka = entryKey(a);
    const kb = entryKey(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}

/** Read the machine index. Throws with a remediation hint when absent. */
export function readChart(targetRoot: string): IndexedEntry[] {
  const indexPath = join(chartDir(targetRoot), INDEX_FILE);
  if (!existsSync(indexPath)) {
    throw new Error(`no chart index at ${indexPath} — write a chart first`);
  }
  const lines = readFileSync(indexPath, "utf8")
    .split("\n")
    .filter((line) => line.trim().length > 0);
  return lines.map((line, i) => {
    const entry = JSON.parse(line) as IndexedEntry;
    if (typeof entry?.kind !== "string" || typeof entry?.id !== "string") {
      throw new Error(`corrupt chart index ${indexPath} line ${i + 1}`);
    }
    return entry;
  });
}

function readChartOrNull(targetRoot: string): IndexedEntry[] | null {
  try {
    return readChart(targetRoot);
  } catch {
    return null;
  }
}

function indexJsonl(entries: IndexedEntry[]): string {
  return `${sortEntries(entries).map((e) => JSON.stringify(e)).join("\n")}\n`;
}

/**
 * Stage every file to a temp name first, then rename them all into place.
 * A failure before the renames (validation, full disk, ...) leaves the
 * previous chart untouched; temp files are removed on failure.
 */
function writeFilesAtomically(dir: string, files: Map<string, string>): void {
  const staged: Array<{ tmp: string; final: string }> = [];
  try {
    for (const [name, text] of files) {
      const final = join(dir, name);
      const tmp = `${final}.tmp-${randomBytes(6).toString("hex")}`;
      writeFileSync(tmp, text);
      staged.push({ tmp, final });
    }
    for (const { tmp, final } of staged) renameSync(tmp, final);
  } catch (err) {
    for (const { tmp } of staged) rmSync(tmp, { force: true });
    throw err;
  }
}

/** Result of a chart write: where the chart lives and what the index now holds. */
export interface WriteResult {
  dir: string;
  index: IndexedEntry[];
}

/**
 * Write the whole chart (full-replace semantics: entries absent from the
 * batch are retired). Validates the batch first — a rejection or a late
 * duplicate-id failure persists nothing. Vessel sheets are re-rendered from
 * the entries; sheets of retired vessels are removed.
 */
export function writeChart(targetRoot: string, entries: ChartEntry[]): WriteResult {
  if (entries.length === 0) {
    throw new Error("writeChart: refusing to write an empty chart");
  }
  validateEntries(entries);
  // Late batch check, after per-entry validation: duplicate ids would
  // corrupt the index. Reaching this throw proves nothing was persisted.
  const seen = new Set<string>();
  for (const entry of entries) {
    const key = entryKey(entry);
    if (seen.has(key)) {
      throw new Error(`writeChart: duplicate chart entry id ${key}`);
    }
    seen.add(key);
  }

  const dir = chartDir(targetRoot);
  const indexed = sortEntries(
    entries.map((entry) => ({ ...entry, stale: false } as IndexedEntry))
  );
  const sheets = renderSheets(indexed);

  mkdirSync(dir, { recursive: true });
  const files = new Map<string, string>(sheets);
  files.set(INDEX_FILE, indexJsonl(indexed));
  writeFilesAtomically(dir, files);

  // Remove sheets the new chart no longer owns (retired vessels).
  for (const name of readdirSync(dir)) {
    if (name.endsWith(".md") && !sheets.has(name)) {
      unlinkSync(join(dir, name));
    }
  }
  return { dir, index: indexed };
}
