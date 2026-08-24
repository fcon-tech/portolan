/**
 * The three machine metrics (sea-trial tasks.md 4.1–4.3, spec "Machine
 * metrics are computed and reported").
 *
 * - Fairway completeness: charted fairways against the BOM-derived
 *   dependency list, with the uncharted dependencies named (reported, not
 *   thresholded — the design leaves that judgment to the Governor).
 * - Trust distribution: the share of chart entries per trust label.
 * - Staleness flip: one whitespace-only append to one file of one vessel,
 *   a staleness refresh, the assertion that exactly that vessel flipped —
 *   then a byte-exact revert (the single documented, reversible exception
 *   to the never-mutate rule; the expedition itself never mutates source).
 */
import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import {
  TRUST_LABELS,
  refreshStaleness,
  type IndexedEntry,
  type TrustLabel,
} from "../../core/src/index";
import { bomDependencyPairs, type Bom } from "./bom";

// ---------------------------------------------------------------------------
// Fairway completeness
// ---------------------------------------------------------------------------

export interface FairwayCompleteness {
  bomPairs: number;
  charted: number;
  ratio: number;
  /** "dependent → dependency" for every BOM pair left uncharted. */
  missing: string[];
  /** Charted fairways matching no BOM pair — information for the Governor. */
  extraFairways: string[];
}

function vesselNames(chartEntries: IndexedEntry[]): Map<string, string> {
  const names = new Map<string, string>();
  for (const entry of chartEntries) {
    if (entry.kind === "vessel") names.set(entry.id, entry.name);
  }
  return names;
}

/** Charted fairway completeness against the BOM dependency list. */
export function fairwayCompleteness(bom: Bom, chartEntries: IndexedEntry[]): FairwayCompleteness {
  const names = vesselNames(chartEntries);
  const lookup = (id: string): string => {
    const name = names.get(id);
    return (name ?? id).toLowerCase();
  };
  const chartedPairs = new Set<string>();
  for (const entry of chartEntries) {
    if (entry.kind !== "fairway") continue;
    // Ids are the canonical identifiers (BOM labels); names are display
    // text ("Apache Alluxio"), so each fairway matches under its id key
    // and its name key.
    chartedPairs.add(`${entry.from.toLowerCase()}→${entry.to.toLowerCase()}`);
    chartedPairs.add(`${lookup(entry.from)}→${lookup(entry.to)}`);
  }
  const pairs = bomDependencyPairs(bom);
  const missing: string[] = [];
  let charted = 0;
  for (const { dependent, dependency } of pairs) {
    const key = `${dependent.toLowerCase()}→${dependency.toLowerCase()}`;
    if (chartedPairs.has(key)) charted += 1;
    else missing.push(`${dependent} → ${dependency}`);
  }
  const extraFairways = [...chartedPairs]
    .filter(
      (key) =>
        !pairs.some(
          (p) => `${p.dependent.toLowerCase()}→${p.dependency.toLowerCase()}` === key,
        ),
    )
    .sort();
  return {
    bomPairs: pairs.length,
    charted,
    ratio: pairs.length === 0 ? 1 : charted / pairs.length,
    missing,
    extraFairways,
  };
}

// ---------------------------------------------------------------------------
// Trust distribution
// ---------------------------------------------------------------------------

export interface TrustDistribution {
  counts: Record<TrustLabel, number>;
  shares: Record<TrustLabel, number>;
  total: number;
  invalid: number;
}

/** Entry count per trust label over the whole chart. */
export function trustDistribution(chartEntries: IndexedEntry[]): TrustDistribution {
  const counts = Object.fromEntries(TRUST_LABELS.map((l) => [l, 0])) as Record<TrustLabel, number>;
  let invalid = 0;
  for (const entry of chartEntries) {
    if ((TRUST_LABELS as readonly string[]).includes(entry.trust)) counts[entry.trust] += 1;
    else invalid += 1;
  }
  const total = chartEntries.length;
  const shares = Object.fromEntries(
    TRUST_LABELS.map((l) => [l, total === 0 ? 0 : counts[l] / total]),
  ) as Record<TrustLabel, number>;
  return { counts, shares, total, invalid };
}

// ---------------------------------------------------------------------------
// Staleness flip
// ---------------------------------------------------------------------------

export interface StalenessFlip {
  status: "pass" | "fail" | "not-assessed";
  detail: string;
  vessel?: string;
  file?: string;
  changedVessels: string[];
  staleEntryIds: string[];
  /** Stale entries that do not belong to the touched vessel (must be none). */
  foreignStaleEntryIds: string[];
  hashBefore?: string;
  hashMutated?: string;
  hashAfterRevert?: string;
  fileRestoredByteIdentical?: boolean;
  chartRestoredByteIdentical?: boolean;
}

function sha256(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

/** The first existing file (sorted) under a vessel's charted paths. */
function firstFileUnder(targetRoot: string, paths: string[]): string | undefined {
  const files: string[] = [];
  const collect = (rel: string): void => {
    let stats;
    try {
      stats = statSync(join(targetRoot, rel));
    } catch {
      return;
    }
    if (stats.isFile()) {
      files.push(rel);
      return;
    }
    if (!stats.isDirectory()) return;
    let entries;
    try {
      entries = readdirSync(join(targetRoot, rel), { withFileTypes: true });
    } catch {
      return;
    }
    for (const de of entries) {
      if (de.isFile()) files.push(rel === "" ? de.name : `${rel}/${de.name}`);
      else if (de.isDirectory()) collect(rel === "" ? de.name : `${rel}/${de.name}`);
    }
  };
  for (const p of paths) collect(p.replace(/\/+$/, ""));
  files.sort();
  return files[0];
}

function belongsToVessel(entry: IndexedEntry, vesselId: string): boolean {
  if (entry.kind === "vessel") return entry.id === vesselId;
  if (entry.kind === "fairway") return entry.from === vesselId || entry.to === vesselId;
  return entry.vessel === vesselId;
}

function snapshotDir(dir: string): Map<string, Buffer> {
  const snap = new Map<string, Buffer>();
  try {
    for (const name of readdirSync(dir)) snap.set(name, readFileSync(join(dir, name)));
  } catch {
    // an absent chart dir snapshots empty
  }
  return snap;
}

function restoreDir(dir: string, snap: Map<string, Buffer>): boolean {
  try {
    mkdirSync(dir, { recursive: true });
    const extras = new Set(readdirSync(dir));
    for (const name of snap.keys()) extras.delete(name);
    for (const name of extras) rmSync(join(dir, name), { force: true });
    for (const [name, bytes] of snap) writeFileSync(join(dir, name), bytes);
    // Byte-compare after restore.
    for (const [name, bytes] of snap) {
      if (!readFileSync(join(dir, name)).equals(bytes)) return false;
    }
    return readdirSync(dir).length === snap.size;
  } catch {
    return false;
  }
}

/**
 * The staleness-flip check: append one whitespace byte to one file of one
 * charted vessel, refresh staleness, assert exactly that vessel's entries
 * flipped to pending correction, then revert the file (content, size, and
 * mtime) and the chart directory byte-for-byte in a finally path. The
 * before/after hashes are recorded in the result.
 */
export function stalenessFlip(targetRoot: string, chartEntries: IndexedEntry[]): StalenessFlip {
  const vessels = chartEntries
    .filter((e): e is Extract<IndexedEntry, { kind: "vessel" }> => e.kind === "vessel")
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  let chosen: { id: string; file: string } | undefined;
  for (const vessel of vessels) {
    const file = firstFileUnder(targetRoot, vessel.paths);
    if (file !== undefined) {
      chosen = { id: vessel.id, file };
      break;
    }
  }
  if (chosen === undefined) {
    return {
      status: "not-assessed",
      detail:
        "no charted vessel has an existing source file under its paths — the flip could not be exercised",
      changedVessels: [],
      staleEntryIds: [],
      foreignStaleEntryIds: [],
    };
  }

  const absFile = join(targetRoot, chosen.file);
  const chartDir = join(targetRoot, ".portolan", "chart");
  const before = readFileSync(absFile);
  const stats = statSync(absFile);
  const hashBefore = sha256(before);
  const chartSnap = snapshotDir(chartDir);

  let result: StalenessFlip | undefined;
  try {
    appendFileSync(absFile, "\n"); // whitespace-only append: no semantic change
    const hashMutated = sha256(readFileSync(absFile));
    let refresh: ReturnType<typeof refreshStaleness> | undefined;
    let refreshError: string | undefined;
    try {
      refresh = refreshStaleness(targetRoot);
    } catch (err) {
      refreshError = (err as Error).message;
    }
    if (refresh === undefined) {
      result = {
        status: "fail",
        detail: `the staleness refresh itself failed: ${refreshError}`,
        vessel: chosen.id,
        file: chosen.file,
        changedVessels: [],
        staleEntryIds: [],
        foreignStaleEntryIds: [],
        hashBefore,
        hashMutated,
      };
    } else {
      const staleEntryIds = refresh.staleEntries.map((e) => `${e.kind}/${e.id}`);
      const foreign = refresh.staleEntries
        .filter((e) => !belongsToVessel(e, chosen.id))
        .map((e) => `${e.kind}/${e.id}`);
      const exactlyOne =
        refresh.changedVessels.length === 1 &&
        refresh.changedVessels[0] === chosen.id &&
        foreign.length === 0 &&
        staleEntryIds.length > 0;
      result = {
        status: exactlyOne ? "pass" : "fail",
        detail: exactlyOne
          ? `editing ${chosen.file} flipped exactly vessel ${chosen.id} to pending correction (${staleEntryIds.length} entries)`
          : `editing ${chosen.file} did not flip exactly vessel ${chosen.id}: changedVessels=[${refresh.changedVessels.join(", ")}], foreign stale entries=[${foreign.join(", ")}], stale entries=${staleEntryIds.length}`,
        vessel: chosen.id,
        file: chosen.file,
        changedVessels: refresh.changedVessels,
        staleEntryIds,
        foreignStaleEntryIds: foreign,
        hashBefore,
        hashMutated,
      };
    }
  } catch (err) {
    // A pre-refresh failure (unreadable file, full disk, ...) still reverts below.
    result = {
      status: "fail",
      detail: `the staleness flip could not be exercised: ${(err as Error).message}`,
      vessel: chosen.id,
      file: chosen.file,
      changedVessels: [],
      staleEntryIds: [],
      foreignStaleEntryIds: [],
      hashBefore,
    };
  } finally {
    // Revert in a finally path: content, size, and mtime restored, then the
    // chart directory byte-for-byte. Failures here are recorded honestly.
    let fileOk = true;
    try {
      writeFileSync(absFile, before);
      // fs.utimes* takes epoch seconds; only the numeric-string form carries
      // the sub-millisecond fraction the tree signature hashes, so the
      // revert restores the exact mtime (reruns stay clean).
      const epochSeconds = (ms: number): string => (ms / 1000).toFixed(6);
      utimesSync(absFile, epochSeconds(stats.atimeMs), epochSeconds(stats.mtimeMs));
      fileOk = sha256(readFileSync(absFile)) === hashBefore;
    } catch {
      fileOk = false;
    }
    const chartOk = restoreDir(chartDir, chartSnap);
    if (result === undefined) {
      // Unreachable in practice (try or catch always assigns), kept for totality.
      result = {
        status: "fail",
        detail: "no staleness verdict was produced",
        vessel: chosen.id,
        file: chosen.file,
        changedVessels: [],
        staleEntryIds: [],
        foreignStaleEntryIds: [],
        hashBefore,
      };
    }
    result.hashAfterRevert = fileOk ? hashBefore : "<revert failed>";
    result.fileRestoredByteIdentical = fileOk;
    result.chartRestoredByteIdentical = chartOk;
    if (!fileOk || !chartOk) {
      result.status = "fail";
      result.detail +=
        `; revert incomplete (file byte-identical: ${fileOk}, chart byte-identical: ${chartOk})`;
    }
  }
  return result;
}
