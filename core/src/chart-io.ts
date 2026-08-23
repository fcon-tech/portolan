/**
 * Low-level chart file IO shared by the store and the staleness refresher:
 * paths, index (de)serialization, and the atomic stage-temp-then-rename
 * writer. All writes stay under `<target>/.portolan/chart/`.
 */
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import type { IndexedEntry } from "./types";

export const INDEX_FILE = "index.jsonl";
export const NOTICES_FILE = "notices.txt";

/** Where the Chart lives for a given target root. */
export function chartDir(targetRoot: string): string {
  return join(targetRoot, ".portolan", "chart");
}

export function entryKey(entry: { kind: string; id: string }): string {
  return `${entry.kind}/${entry.id}`;
}

export function sortEntries<T extends { kind: string; id: string }>(entries: T[]): T[] {
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

export function readChartOrNull(targetRoot: string): IndexedEntry[] | null {
  try {
    return readChart(targetRoot);
  } catch {
    return null;
  }
}

export function indexJsonl(entries: IndexedEntry[]): string {
  return `${sortEntries(entries).map((e) => JSON.stringify(e)).join("\n")}\n`;
}

/**
 * Stage every file to a temp name first, then rename them all into place.
 * A failure before the renames (validation, full disk, ...) leaves the
 * previous chart untouched; staged temps are removed on failure.
 */
export function writeFilesAtomically(dir: string, files: Map<string, string>): void {
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
