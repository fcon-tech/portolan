/**
 * Staleness: per-vessel source signatures and the refresh that flips changed
 * vessels' entries to `pending correction`.
 *
 * The signature is a cheap tree hash (design.md, decision 3): the file list,
 * sizes, and mtimes under the vessel's paths, sorted and hashed. Content
 * hashing is deliberately avoided — the repair expedition re-reads content
 * anyway.
 */
import { lstatSync, readdirSync, statSync } from "node:fs";
import { join, resolve, sep } from "node:path";
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
  if (escapesRoot(root, rel)) return; // never walk past the target perimeter
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

/** True when a charted path resolves outside the target root. A `..`
 * segment escapes lexically, and so does an absolute path: resolve() keeps
 * the absolute, which then fails the prefix check. */
function escapesRoot(root: string, rel: string): boolean {
  const abs = resolve(root, rel);
  return abs !== root && !abs.startsWith(root + sep);
}

/**
 * A charted top-level path the province cannot vouch for: one that escapes
 * the root, or one that is itself a symlink (a link's metadata and target
 * live outside what the survey read). Such a vessel is never provably
 * fresh — it always counts as changed.
 */
function unprovablePath(root: string, rel: string): boolean {
  if (escapesRoot(root, rel)) return true;
  try {
    return lstatSync(join(root, rel)).isSymbolicLink();
  } catch {
    return false; // absent: collect() contributes nothing, detection decides
  }
}

/**
 * Cheap tree hash over the given paths (relative to the target root):
 * sorted `path\tsize\tmtime` lines, SHA-256. A top-level path is stat'ed as
 * given, so a symlinked vessel root resolves; symlinked entries found
 * during the walk are not followed (only dirents reporting file or dir are
 * descended/collected). Paths that escape the root contribute nothing.
 */
export function treeSignature(targetRoot: string, paths: string[]): VesselSignature {
  // Resolve once: collect() compares paths against the root lexically, so a
  // relative targetRoot would classify every path as escaping and sign the
  // empty set — "always drifted" for the whole chart. Callers may pass
  // either form; the signature must not depend on it.
  const root = resolve(targetRoot);
  const facts: FileFact[] = [];
  for (const p of paths) {
    // A symlinked top-level path would be stat'ed through the link, signing
    // metadata the province never surveyed; it contributes nothing here (the
    // refresh already treats such a vessel as never provably fresh).
    try {
      if (lstatSync(join(root, p)).isSymbolicLink()) continue;
    } catch {
      // absent — collect() contributes nothing either
    }
    collect(root, p, facts);
  }
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
 * Re-verify every vessel's source signature against the index and recompute
 * the pending-correction marks: an entry is stale exactly while its vessel's
 * sources differ from the survey — a drift sets the mark, a reverted drift
 * clears it (chart spec: entries whose sources are unchanged MUST NOT be
 * marked). With no flag flip in either direction, nothing is written at all.
 *
 * The refresh never deletes `notices.txt`: when a re-detection finds no flag
 * transitions, the outstanding report from the earlier refresh still
 * describes the still-pending vessels and stays on the chart. Only a chart
 * write replaces the report (its own contract).
 */
export function refreshStaleness(targetRoot: string): StalenessResult {
  const entries = readChart(targetRoot);

  const changed = new Set<string>();
  const root = resolve(targetRoot);
  for (const entry of entries) {
    if (entry.kind !== "vessel") continue;
    // A vessel charted through an escaping or symlinked path can never prove
    // freshness: it counts as changed, so the chart never vouches for what
    // it cannot see.
    if (entry.paths.some((p) => unprovablePath(root, p))) {
      changed.add(entry.id);
      continue;
    }
    const current = treeSignature(targetRoot, entry.paths);
    // A vessel without a recorded signature counts as changed: never claim
    // freshness we cannot prove.
    if (entry.signature?.hash !== current.hash) changed.add(entry.id);
  }

  // Recompute, never accumulate: the mark states the province's present
  // drift, not its history. entries.map keeps order and length, so the
  // before/after flag comparison below is index-aligned by construction.
  const next = entries.map((entry): IndexedEntry => {
    const stale =
      entry.kind === "vessel"
        ? changed.has(entry.id)
        : entry.kind === "fairway"
          ? changed.has(entry.from) || changed.has(entry.to)
          : changed.has(entry.vessel);
    return stale === entry.stale ? entry : { ...entry, stale };
  });
  const flipped = next.filter((entry, i) => entry.stale !== entries[i]!.stale);

  if (flipped.length === 0) {
    return {
      changedVessels: [...changed].sort(),
      staleEntries: next.filter((e) => e.stale),
      notices: [],
      noticesText: "",
    };
  }

  const dir = chartDir(targetRoot);
  const notices = diffNotices(entries, next);
  const noticesText = renderNotices(notices);
  const files = new Map<string, string>();
  files.set(INDEX_FILE, indexJsonl(next));
  if (notices.length > 0) files.set(NOTICES_FILE, noticesText);
  const staleNow = new Set(
    next.filter((e) => e.kind === "vessel" && e.stale).map((e) => e.id),
  );
  const sheets = renderSheets(next, staleNow);
  for (const entry of flipped) {
    if (entry.kind !== "vessel") continue;
    const name = sheetFileName(entry.id);
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
