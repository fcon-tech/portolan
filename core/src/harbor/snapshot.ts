/**
 * The landscape snapshot: what the province looked like at the last survey,
 * stored under `<target>/.portolan/harbor/snapshot.json` as
 * `{ indexHash, landscape[] }` (design.md, decision 2).
 *
 * Refresh rule — the chart index hash. When the current index hash differs
 * from the stored one, a survey stood against the current landscape and the
 * snapshot refreshes; when it matches, the landscape is compared against the
 * snapshot and entries absent from it yield new-land proposals. This needs
 * no hooks into the chart store. A first propose over a chart with no
 * snapshot establishes the baseline (and proposes no new-land): there is no
 * earlier survey to differ from.
 *
 * The landscape is a bounded walk collecting two entry kinds: repository
 * directories (a child `.git`, file or directory — worktrees and submodules
 * included) and manifest files (the five kinds the manifests tool parses).
 * The walk skips `node_modules`, `.git`, and `.portolan` exactly like the
 * probe tools' walks, and never records the province root itself.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { MANIFEST_KINDS } from "../tools/manifests";
import { readChart, sortEntries } from "../chart-io";
import { HarborError } from "./errors";

export const HARBOR_DIRNAME = "harbor";
export const SNAPSHOT_FILE = "snapshot.json";

/** Directories the landscape walk never descends into (probe-tool convention). */
const SKIPPED_DIRS = new Set(["node_modules", ".git", ".portolan"]);

/** Bound on walk depth: deep trees terminate; six levels cover monorepo layouts. */
const MAX_DEPTH = 6;

/** One landscape fact: a repository directory or a manifest file, by relative path. */
export interface LandscapeEntry {
  kind: "repo" | "manifest";
  /** Relative to the province root; `apps/api`, `vendor/lib/go.mod`, ... */
  path: string;
}

/** The stored snapshot: the landscape together with the chart index hash it was taken against. */
export interface LandscapeSnapshot {
  indexHash: string;
  landscape: LandscapeEntry[];
}

/** Where the Harbor Master's files live for a given target root. */
export function harborDir(targetRoot: string): string {
  return join(targetRoot, ".portolan", HARBOR_DIRNAME);
}

/** Where the landscape snapshot lives. */
export function snapshotFile(targetRoot: string): string {
  return join(harborDir(targetRoot), SNAPSHOT_FILE);
}

/**
 * sha256 over the chart's canonical entry content — the snapshot's refresh
 * key. Store-owned `stale` flags are stripped before hashing: a staleness
 * refresh marks pending correction but is not "a survey stood", so it must
 * not refresh the snapshot (design.md, decision 2's parenthetical). A real
 * survey write always changes content — vessel signatures are re-stamped
 * against the repaired sources — and a write that changes nothing is, by
 * the design's accepted-risk note, not a new survey.
 */
export function chartIndexHash(targetRoot: string): string {
  const content = readChart(targetRoot).map(({ stale: _stale, ...entry }) => entry);
  const canonical = sortEntries(content)
    .map((entry) => JSON.stringify(entry))
    .join("\n");
  return createHash("sha256").update(canonical).digest("hex");
}

function entryKey(entry: LandscapeEntry): string {
  return `${entry.kind}:${entry.path}`;
}

/** Stable landscape order: kind, then path. */
export function sortLandscape(landscape: LandscapeEntry[]): LandscapeEntry[] {
  return [...landscape].sort((a, b) =>
    a.kind === b.kind ? (a.path < b.path ? -1 : a.path > b.path ? 1 : 0) : a.kind < b.kind ? -1 : 1,
  );
}

/**
 * Walk the province and list the landscape: repository directories (a
 * `.git` child) and manifest files, skipping `node_modules`/`.git`/
 * `.portolan`, bounded by depth. Read-only toward everything it walks.
 */
export function scanLandscape(targetRoot: string): LandscapeEntry[] {
  const found: LandscapeEntry[] = [];
  const seen = new Set<string>();
  const push = (entry: LandscapeEntry): void => {
    const key = entryKey(entry);
    if (!seen.has(key)) {
      seen.add(key);
      found.push(entry);
    }
  };

  const visit = (rel: string, depth: number): void => {
    if (depth > MAX_DEPTH) return;
    let children;
    try {
      children = readdirSync(join(targetRoot, rel), { withFileTypes: true });
    } catch {
      return; // an unreadable directory contributes nothing
    }
    const sorted = [...children].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    // A `.git` child marks a repository — noticed, never descended into.
    if (rel !== "" && sorted.some((de) => de.name === ".git")) {
      push({ kind: "repo", path: rel });
    }
    for (const de of sorted) {
      if (de.isDirectory()) {
        if (SKIPPED_DIRS.has(de.name)) continue;
        visit(rel === "" ? de.name : `${rel}/${de.name}`, depth + 1);
      } else if (de.isFile() && (MANIFEST_KINDS as readonly string[]).includes(de.name)) {
        push({ kind: "manifest", path: rel === "" ? de.name : `${rel}/${de.name}` });
      }
    }
  };
  visit("", 0);
  return sortLandscape(found);
}

/**
 * The anchor a new-land proposal cites for a landscape entry: the manifest
 * file itself, or the repository's `.git` marker (a regular file in both
 * cases, so `sound.anchor` can confirm it: `.git/HEAD` for a plain
 * repository, the gitdir pointer file for a worktree/submodule).
 */
export function landscapeAnchor(targetRoot: string, entry: LandscapeEntry): { type: "file"; path: string } {
  if (entry.kind === "manifest") return { type: "file", path: entry.path };
  const git = join(targetRoot, entry.path, ".git");
  try {
    if (statSync(git).isFile()) return { type: "file", path: `${entry.path}/.git` };
  } catch {
    // fall through to the plain-repository form
  }
  return { type: "file", path: `${entry.path}/.git/HEAD` };
}

/** Read the stored snapshot; null when none exists yet. */
export function readSnapshot(targetRoot: string): LandscapeSnapshot | null {
  const file = snapshotFile(targetRoot);
  if (!existsSync(file)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    throw new HarborError(`snapshot: corrupt landscape snapshot ${file}: ${(err as Error).message}`);
  }
  const snap = parsed as LandscapeSnapshot;
  if (
    typeof snap?.indexHash !== "string" ||
    !Array.isArray(snap.landscape) ||
    snap.landscape.some(
      (e) =>
        (e?.kind !== "repo" && e?.kind !== "manifest") || typeof e?.path !== "string" || e.path.length === 0,
    )
  ) {
    throw new HarborError(
      `snapshot: corrupt landscape snapshot ${file}: expected { indexHash, landscape[] } with repo/manifest entries`,
    );
  }
  return snap;
}

/** Persist the snapshot (plain pretty JSON, diff-friendly). */
export function writeSnapshot(targetRoot: string, snapshot: LandscapeSnapshot): void {
  mkdirSync(harborDir(targetRoot), { recursive: true });
  writeFileSync(
    snapshotFile(targetRoot),
    `${JSON.stringify({ indexHash: snapshot.indexHash, landscape: sortLandscape(snapshot.landscape) }, null, 2)}\n`,
  );
}
