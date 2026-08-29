/**
 * Staleness: per-vessel source signatures and the refresh that flips changed
 * vessels' entries to `pending correction`.
 *
 * The signature is a cheap tree hash (design.md, decision 3): the file list,
 * sizes, and mtimes under the vessel's paths, sorted and hashed. Content
 * hashing is deliberately avoided — the repair expedition re-reads content
 * anyway.
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import type { IndexedEntry, Notice, VesselSignature } from "./types";
import {
  INDEX_FILE,
  NOTICES_FILE,
  chartDir,
  indexJsonl,
  readChart,
  writeFilesAtomically,
} from "./chart-io";
import { renderSheets, sheetFileName } from "./sheets";
import { diffNotices, renderNotices } from "./notices";

interface FileFact {
  path: string;
  size: number;
  mtime: number;
}

function collect(root: string, rel: string, out: FileFact[]): void {
  let stats;
  try {
    stats = statSync(join(root, rel));
  } catch {
    return; // a path that no longer exists contributes nothing
  }
  if (stats.isFile()) {
    out.push({ path: rel, size: stats.size, mtime: Math.round(stats.mtimeMs) });
    return;
  }
  if (!stats.isDirectory()) return;
  const entries = readdirSync(join(root, rel), { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0
  );
  for (const de of entries) {
    if (de.isDirectory()) collect(root, `${rel}/${de.name}`, out);
    else if (de.isFile()) {
      const s = statSync(join(root, rel, de.name));
      out.push({
        path: `${rel}/${de.name}`,
        size: s.size,
        mtime: Math.round(s.mtimeMs),
      });
    }
  }
}

/**
 * Cheap tree hash over the given paths (relative to the target root):
 * sorted `path\tsize\tmtime` lines, SHA-256. A top-level path is stat'ed as
 * given, so a symlinked vessel root resolves; symlinked entries found
 * during the walk are not followed (only dirents reporting file or dir are
 * descended/collected).
 */
export function treeSignature(targetRoot: string, paths: string[]): VesselSignature {
  const facts: FileFact[] = [];
  for (const p of paths) collect(targetRoot, p, facts);
  facts.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const text = facts.map((f) => `${f.path}\t${f.size}\t${f.mtime}`).join("\n");
  return { hash: createHash("sha256").update(text).digest("hex"), files: facts.length };
}

/** Result of a staleness refresh. */
export interface StalenessResult {
  /** Vessel ids whose source signature changed since the last survey. */
  changedVessels: string[];
  /** Entries now marked `pending correction`. */
  staleEntries: IndexedEntry[];
  /** Notices to Mariners produced by this refresh. */
  notices: Notice[];
  noticesText: string;
}

/**
 * Re-verify every vessel's source signature against the index. Entries of
 * changed vessels (and only those) are marked `pending correction` in the
 * index and on their sheets. With no changes, nothing is written at all.
 *
 * The refresh never deletes `notices.txt`: when a re-detection finds no NEW
 * stale transitions, the outstanding report from the earlier refresh still
 * describes the still-pending vessels and stays on the chart — removing it
 * here would make consecutive reads over an unchanged province render
 * differently. Only a chart write replaces the report (its own contract).
 */
export function refreshStaleness(targetRoot: string): StalenessResult {
  const entries = readChart(targetRoot);

  const changed = new Set<string>();
  for (const entry of entries) {
    if (entry.kind !== "vessel") continue;
    const current = treeSignature(targetRoot, entry.paths);
    // A vessel without a recorded signature counts as changed: never claim
    // freshness we cannot prove.
    if (entry.signature?.hash !== current.hash) changed.add(entry.id);
  }
  if (changed.size === 0) {
    return { changedVessels: [], staleEntries: [], notices: [], noticesText: "" };
  }

  const next = entries.map((entry): IndexedEntry => {
    if (entry.kind === "vessel") {
      return changed.has(entry.id) ? { ...entry, stale: true } : entry;
    }
    if (entry.kind === "fairway") {
      return changed.has(entry.from) || changed.has(entry.to)
        ? { ...entry, stale: true }
        : entry;
    }
    return changed.has(entry.vessel) ? { ...entry, stale: true } : entry;
  });

  const dir = chartDir(targetRoot);
  const notices = diffNotices(entries, next);
  const noticesText = renderNotices(notices);
  const files = new Map<string, string>();
  files.set(INDEX_FILE, indexJsonl(next));
  if (notices.length > 0) files.set(NOTICES_FILE, noticesText);
  const sheets = renderSheets(next, changed);
  for (const vesselId of changed) {
    const name = sheetFileName(vesselId);
    const sheet = sheets.get(name);
    if (sheet) files.set(name, sheet);
  }
  writeFilesAtomically(dir, files);

  return {
    changedVessels: [...changed].sort(),
    staleEntries: next.filter((e) => e.stale),
    notices,
    noticesText,
  };
}
