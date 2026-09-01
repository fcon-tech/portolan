/**
 * The chart store: read/write of `<target>/.portolan/chart/` — one markdown
 * sheet per vessel plus the machine index `index.jsonl` (authoritative for
 * machines; sheets are rendered outputs). Writes are atomic by
 * stage-to-temp + rename (design.md, decision 4): a write either persists
 * completely or leaves the previous chart byte-identical. Each vessel entry
 * is stamped with a source tree signature for staleness detection.
 */
import { mkdirSync, readdirSync, rmSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import type { ChartEntry, IndexedEntry, Notice } from "./types";
import { validateEntries } from "./validate";
import { renderSheets } from "./sheets";
import { treeSignature } from "./staleness";
import { diffNotices, renderNotices } from "./notices";
import {
  INDEX_FILE,
  NOTICES_FILE,
  chartDir,
  entryKey,
  indexJsonl,
  readChartOrNull,
  sortEntries,
  writeFilesAtomically,
} from "./chart-io";

export { INDEX_FILE, NOTICES_FILE, chartDir, readChart } from "./chart-io";

/** Result of a chart write: where the chart lives, the index, and the notices it produced. */
export interface WriteResult {
  dir: string;
  index: IndexedEntry[];
  notices: Notice[];
  noticesText: string;
  /** Set when post-write cleanup failed: the write persisted, its cleanup did not. */
  cleanupError?: string;
}

export interface WriteOptions {
  /**
   * Accept a full-replace that drops more than a quarter of the existing
   * entries (chart-write-shrink-guard). Default false: silent mass shrink
   * is how a partial rewrite clobbers a whole chart (live incident,
   * receipt r43).
   */
  allowShrink?: boolean;
}

/**
 * Write the whole chart (full-replace semantics: entries absent from the
 * batch are retired). Validates the batch first — a rejection or a late
 * duplicate-id failure persists nothing. Vessel sheets are re-rendered from
 * the entries; sheets of retired vessels are removed.
 */
export function writeChart(
  targetRoot: string,
  rawEntries: ChartEntry[],
  options: WriteOptions = {},
): WriteResult {
  // Round-trip rule: entries read back from the chart carry `stale` and
  // `signature` metadata the store owns and re-stamps on every write, so a
  // read → modify → write repair cycle must not be rejected for them.
  const entries = rawEntries.map((entry) => {
    const { stale: _stale, signature: _signature, ...clean } = entry as ChartEntry & {
      stale?: unknown;
      signature?: unknown;
    };
    return clean as ChartEntry;
  });
  if (entries.length === 0) {
    throw new Error("writeChart: refusing to write an empty chart");
  }
  // Shrink guard (chart-write-shrink-guard): a full-replace that drops more
  // than a quarter of the existing entries is refused unless explicitly
  // allowed — a partial rewrite must not clobber a whole chart silently.
  // The threshold is compared as a float: flooring it would admit a
  // 74.9% shrink as "not below 75%".
  const previous = readChartOrNull(targetRoot);
  if (previous && !options.allowShrink) {
    if (entries.length < previous.length * 0.75) {
      throw new Error(
        `writeChart refused: ${entries.length} entries would shrink the chart from ${previous.length} ` +
          `(allowShrink to override a deliberate retire-heavy correction)`,
      );
    }
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
    entries.map((entry) => {
      const base = { ...entry, stale: false } as IndexedEntry;
      if (entry.kind === "vessel") {
        base.signature = treeSignature(targetRoot, entry.paths);
      }
      return base;
    })
  );
  const notices = diffNotices(previous ?? [], indexed);
  const noticesText = renderNotices(notices);
  const sheets = renderSheets(indexed);

  mkdirSync(dir, { recursive: true });
  const files = new Map<string, string>(sheets);
  files.set(INDEX_FILE, indexJsonl(indexed));
  if (notices.length > 0) files.set(NOTICES_FILE, noticesText);
  writeFilesAtomically(dir, files);

  // Cleanup runs after the atomic rename: the write has persisted, so a
  // failing cleanup is reported in the result, never thrown — a throw here
  // would surface a tool error for a write that in fact landed, and leave
  // the caller assuming the previous chart.
  let cleanupError: string | undefined;
  try {
    // Remove sheets the new chart no longer owns (retired vessels).
    for (const name of readdirSync(dir)) {
      if (name.endsWith(".md") && !sheets.has(name)) {
        unlinkSync(join(dir, name));
      }
    }
    // An empty report is removed: the notices file reflects the latest write.
    if (notices.length === 0) rmSync(join(dir, NOTICES_FILE), { force: true });
  } catch (err) {
    cleanupError = err instanceof Error ? err.message : String(err);
  }
  return { dir, index: indexed, notices, noticesText, ...(cleanupError !== undefined ? { cleanupError } : {}) };
}
