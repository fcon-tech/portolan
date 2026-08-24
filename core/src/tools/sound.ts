/**
 * Soundings: deterministic verification of what the Chart asserts
 * specs/tools/spec.md.
 *
 * A sounding never judges — it checks. `sound.anchor` verifies that an
 * anchor cited by a chart entry resolves: a file anchor's file exists, its
 * cited line range is within the file, and any cited content is present at
 * that range; a manifest-key anchor's key exists in the cited manifest; a
 * receipt anchor's id resolves in the ship's log. `sound.edge` verifies an
 * asserted fairway through two deterministic means — a dependency declared
 * in the source vessel's manifest, and name-based references found by a
 * sweep scoped to the source vessel's own paths. Every sounding returns
 * exactly one verdict (`confirmed` / `refuted` / `unconfirmed`) with the
 * anchored evidence that produced it; a `confirmed` verdict without
 * evidence cannot even be constructed. No model judgment participates.
 *
 * Soundings are pure functions over the probe layer (design.md, decision 1)
 * and read-only toward the Chart by construction (decision 4): they accept
 * asserted entries as input values, hold no store handle, and expose no
 * write path. Acting on a verdict — including any trust change — is the
 * Cartographer's separate write.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import type { Anchor, FairwayEntry, VesselEntry } from "../types";
import { escapeRegExp } from "./shared";
import { sweep, type SweepChunk } from "./sweep";
import {
  ManifestParseError,
  manifestKindOf,
  readManifest,
  type ManifestOutcome,
} from "./manifests";
import { readReceipts, resolveReceiptAnchor, type Receipt } from "./log";

// ---------------------------------------------------------------------------
// The shared verdict shape (tasks.md 1.1)
// ---------------------------------------------------------------------------

/** The closed sounding vocabulary: exactly one per result. */
export const SOUNDING_VERDICTS = ["confirmed", "refuted", "unconfirmed"] as const;

export type SoundingVerdict = (typeof SOUNDING_VERDICTS)[number];

/** Raised for malformed sounding inputs; never stands in for a verdict. */
export class SoundingError extends Error {
  constructor(message: string) {
    super(`sound: ${message}`);
    this.name = "SoundingError";
  }
}

/** What a check actually found, and the anchor it was found at. */
export interface SoundingEvidence {
  /** What was found, in words or as verbatim content (e.g. the lines at a cited range). */
  found: string;
  /** Where it was found, in the core-foundation Anchor shape (design.md, decision 3). */
  anchor: Anchor;
}

/** The shared result: one verdict plus the evidence that produced it. */
export interface SoundingResult {
  verdict: SoundingVerdict;
  evidence: SoundingEvidence[];
  /** Compact human-readable summary of the sounding outcome. */
  report: string;
}

/** Runtime shape check for the core-foundation anchor variants. */
function isAnchorShaped(value: unknown): value is Anchor {
  if (typeof value !== "object" || value === null) return false;
  const a = value as Record<string, unknown>;
  if (a.type === "file") return typeof a.path === "string" && a.path.length > 0;
  if (a.type === "manifest") {
    return typeof a.path === "string" && typeof a.key === "string";
  }
  if (a.type === "receipt") return typeof a.id === "string";
  return false;
}

/**
 * Smart constructor for sounding results. Enforces the spec invariants at
 * the only place they can be enforced: evidence is always anchor-shaped,
 * and a `confirmed` verdict with an empty evidence list is refused — a
 * confirmation without evidence does not exist in this module.
 */
export function soundingResult(
  verdict: SoundingVerdict,
  evidence: SoundingEvidence[],
  report: string,
): SoundingResult {
  if (!(SOUNDING_VERDICTS as readonly string[]).includes(verdict)) {
    throw new SoundingError(
      `unknown verdict ${JSON.stringify(verdict)}; the vocabulary is ${SOUNDING_VERDICTS.join(", ")}`,
    );
  }
  for (const item of evidence) {
    if (typeof item.found !== "string" || !isAnchorShaped(item.anchor)) {
      throw new SoundingError(
        `every evidence must pair what was found with a core-foundation anchor, got ${JSON.stringify(item)}`,
      );
    }
  }
  if (verdict === "confirmed" && evidence.length === 0) {
    throw new SoundingError(
      "a confirmed sounding must carry at least one anchored evidence; " +
        "refusing to construct a confirmation without evidence",
    );
  }
  return { verdict, evidence, report };
}

// ---------------------------------------------------------------------------
// sound.anchor — verify an anchor resolves (tasks.md 2.1, 2.2)
// ---------------------------------------------------------------------------

/**
 * One anchor under survey. The cited-content expectation lives on the
 * sounding input, not on the anchor: the foundation Anchor shape carries
 * only path and (optional) line — the claim "this is what the range holds"
 * is the chart entry's citation, checked here against ground truth.
 */
export interface AnchorSounding {
  /** The anchor exactly as cited by the chart entry. */
  anchor: Anchor;
  /** For file anchors: the content the entry claims sits at the cited range. */
  content?: string;
  /** For file anchors: the last line of the cited range; defaults to `anchor.line`. */
  endLine?: number;
}

export interface AnchorSoundingResult extends SoundingResult {
  /**
   * `sound.anchor` checks existence and content against ground truth, so it
   * yields `confirmed` or `refuted` — never `unconfirmed` (design.md,
   * decision 2).
   */
  verdict: "confirmed" | "refuted";
}

/** Verify that an anchor as cited by a chart entry resolves. */
export function soundAnchor(targetRoot: string, sounding: AnchorSounding): AnchorSoundingResult {
  const { anchor } = sounding;
  if (!isAnchorShaped(anchor)) {
    throw new SoundingError(`not a citable anchor: ${JSON.stringify(anchor)}`);
  }
  switch (anchor.type) {
    case "file":
      return soundFileAnchor(targetRoot, anchor, sounding);
    case "manifest":
      return soundManifestAnchor(targetRoot, anchor);
    case "receipt":
      return soundReceiptAnchor(targetRoot, anchor);
  }
}

/** Resolve a cited path inside the target root; undefined when it escapes. */
function resolveInsideTarget(targetRoot: string, rel: string): string | undefined {
  const root = resolve(targetRoot);
  const abs = resolve(root, rel);
  if (abs !== root && !abs.startsWith(root + sep)) return undefined;
  return abs;
}

function refutedAnchor(
  evidence: SoundingEvidence,
  report: string,
): AnchorSoundingResult {
  return { ...soundingResult("refuted", [evidence], report), verdict: "refuted" };
}

function confirmedAnchor(
  evidence: SoundingEvidence,
  report: string,
): AnchorSoundingResult {
  return { ...soundingResult("confirmed", [evidence], report), verdict: "confirmed" };
}

type FileAnchor = Anchor & { type: "file" };

function soundFileAnchor(
  targetRoot: string,
  anchor: FileAnchor,
  sounding: AnchorSounding,
): AnchorSoundingResult {
  const { content, endLine } = sounding;
  const start = anchor.line;
  if (start === undefined && (content !== undefined || endLine !== undefined)) {
    throw new SoundingError(
      `a content or range check needs a cited line; ${anchor.path} cites only a file`,
    );
  }
  if (start !== undefined && endLine !== undefined && endLine < start) {
    throw new SoundingError(`inverted line range ${start}-${endLine} for ${anchor.path}`);
  }
  const echo = (): Anchor =>
    ({
      type: "file",
      path: anchor.path,
      ...(start !== undefined ? { line: start } : {}),
    }) as Anchor;

  const abs = resolveInsideTarget(targetRoot, anchor.path);
  if (abs === undefined) {
    return refutedAnchor(
      { found: "the cited path escapes the target root; it resolves to nothing in the province", anchor: echo() },
      `refuted: ${anchor.path} escapes the target root`,
    );
  }

  let text: string;
  try {
    const stats = statSync(abs);
    if (!stats.isFile()) {
      return refutedAnchor(
        { found: `${anchor.path} exists but is not a regular file`, anchor: echo() },
        `refuted: ${anchor.path} is not a regular file`,
      );
    }
    text = readFileSync(abs, "utf8");
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      return refutedAnchor(
        { found: `${anchor.path} does not exist in the target`, anchor: echo() },
        `refuted: ${anchor.path} does not exist in the target`,
      );
    }
    throw err;
  }

  const lines = text.split("\n").map((l) => l.replace(/\r$/, ""));
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

  // File-only citation: existence is the whole claim.
  if (start === undefined) {
    return confirmedAnchor(
      { found: `${anchor.path} exists; ${lines.length} line(s); no line cited`, anchor: echo() },
      `confirmed: ${anchor.path} exists (${lines.length} lines)`,
    );
  }
  const end = endLine ?? start;

  const range = start === end ? `${start}` : `${start}-${end}`;
  if (start < 1 || end > lines.length) {
    return refutedAnchor(
      {
        found: `cited range ${range} is not within ${anchor.path}: the file has ${lines.length} line(s)`,
        anchor: echo(),
      },
      `refuted: cited range ${range} is out of range; ${anchor.path} has ${lines.length} line(s)`,
    );
  }

  const actual = lines.slice(start - 1, end).join("\n");
  if (content !== undefined) {
    // The citation claims this content sits at the cited range. Lines are
    // compared trimmed per side, so pure re-indentation stays confirmed
    // while any content drift refutes (design.md: that brittleness is the
    // product).
    const cited = content.split("\n");
    const present =
      cited.length === end - start + 1 &&
      cited.every((l, i) => l.trim() === lines[start - 1 + i]!.trim());
    if (!present) {
      return refutedAnchor(
        {
          found: `the cited content is not what ${anchor.path}:${range} holds; the range holds:\n${actual}`,
          anchor: echo(),
        },
        `refuted: content drift at ${anchor.path}:${range} — the cited content is not what the range holds`,
      );
    }
    return confirmedAnchor(
      { found: `${anchor.path}:${range} holds:\n${actual}`, anchor: echo() },
      `confirmed: ${anchor.path}:${range} holds the cited content`,
    );
  }
  return confirmedAnchor(
    { found: `${anchor.path}:${range} holds:\n${actual}`, anchor: echo() },
    `confirmed: ${anchor.path}:${range} is within the file (${lines.length} lines)`,
  );
}

/** Cap a key list so refutation reports stay bounded on huge manifests. */
function listCapped(items: string[], cap = 8): string {
  const listed = items.slice(0, cap).join(", ");
  return items.length > cap ? `${listed}, … (+${items.length - cap} more)` : listed;
}

type ManifestAnchor = Anchor & { type: "manifest" };

function soundManifestAnchor(
  targetRoot: string,
  anchor: ManifestAnchor,
): AnchorSoundingResult {
  const echo = (): Anchor => ({ type: "manifest", path: anchor.path, key: anchor.key });
  const abs = resolveInsideTarget(targetRoot, anchor.path);
  if (abs === undefined) {
    return refutedAnchor(
      { found: "the cited manifest path escapes the target root", anchor: echo() },
      `refuted: ${anchor.path} escapes the target root`,
    );
  }
  let outcome: ManifestOutcome;
  try {
    outcome = readManifest(targetRoot, anchor.path);
  } catch (err) {
    if (err instanceof ManifestParseError) {
      return refutedAnchor(
        { found: `${anchor.path} cannot be parsed: ${err.message}`, anchor: echo() },
        `refuted: the cited manifest ${anchor.path} cannot be parsed`,
      );
    }
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      return refutedAnchor(
        { found: `${anchor.path} does not exist in the target`, anchor: echo() },
        `refuted: ${anchor.path} does not exist in the target`,
      );
    }
    throw err;
  }
  if (!("supported" in outcome)) {
    const fact = outcome.facts.find((f) => f.key === anchor.key);
    if (fact !== undefined) {
      return confirmedAnchor(
        {
          found: `${anchor.path}#${anchor.key} = ${JSON.stringify(fact.value)}`,
          anchor: echo(),
        },
        `confirmed: ${anchor.path}#${anchor.key} exists`,
      );
    }
    return refutedAnchor(
      {
        found: `no key "${anchor.key}" in ${anchor.path}; keys present: ${listCapped(outcome.facts.map((f) => f.key))}`,
        anchor: echo(),
      },
      `refuted: no key "${anchor.key}" in ${anchor.path}`,
    );
  }
  return refutedAnchor(
    { found: `${anchor.path}: ${outcome.reason}`, anchor: echo() },
    `refuted: ${anchor.path} is not a manifest soundings can read`,
  );
}

type ReceiptAnchor = Anchor & { type: "receipt" };

function soundReceiptAnchor(
  targetRoot: string,
  anchor: ReceiptAnchor,
): AnchorSoundingResult {
  const echo = (): Anchor => ({ type: "receipt", id: anchor.id });
  // A corrupt log fails loudly through the log tool; only a dead id refutes.
  const receipt: Receipt | undefined = resolveReceiptAnchor(targetRoot, anchor);
  if (receipt !== undefined) {
    return confirmedAnchor(
      {
        found: `receipt ${receipt.id}: ${receipt.command} — ${receipt.outcome}`,
        anchor: echo(),
      },
      `confirmed: receipt ${anchor.id} resolves in the ship's log`,
    );
  }
  const onFile = readReceipts(targetRoot).length;
  return refutedAnchor(
    {
      found: `no receipt ${anchor.id} resolves in the ship's log (${onFile} receipt(s) on file)`,
      anchor: echo(),
    },
    `refuted: no receipt ${anchor.id} in the ship's log`,
  );
}

// ---------------------------------------------------------------------------
// sound.edge — verify an asserted fairway (tasks.md 3.1–3.3)
// ---------------------------------------------------------------------------

/** One asserted fairway plus the two vessels it runs between, as charted. */
export interface EdgeSounding {
  /** The asserted fairway entry, exactly as charted. */
  fairway: FairwayEntry;
  /** The vessel the fairway departs from; its paths scope both means. */
  source: VesselEntry;
  /** The vessel the fairway arrives at; its name and id drive the match. */
  target: VesselEntry;
}

/** The two deterministic means; reports always come back in this order. */
export type EdgeMeans = "manifest" | "references";

/** What one deterministic means found for an asserted fairway. */
export interface EdgeMeansReport {
  means: EdgeMeans;
  /** Whether this means found deterministic support. */
  found: boolean;
  /**
   * What the means found. A negative report describes what was checked —
   * it never claims the fairway is absent (dynamic wiring exists).
   */
  report: string;
  /** Anchored evidence from this means; empty when it found none. */
  evidence: SoundingEvidence[];
}

export interface EdgeSoundingResult extends SoundingResult {
  /**
   * `sound.edge` cannot disprove a fairway, so it yields `confirmed` or
   * `unconfirmed` — never `refuted` (design.md, decision 2).
   */
  verdict: "confirmed" | "unconfirmed";
  from: string;
  to: string;
  /** One report per means, in fixed order: manifest, then references. */
  means: EdgeMeansReport[];
}

/** Verify an asserted fairway through the two deterministic means. */
export function soundEdge(targetRoot: string, sounding: EdgeSounding): EdgeSoundingResult {
  const { fairway, source, target } = sounding;
  if (fairway.kind !== "fairway" || source.kind !== "vessel" || target.kind !== "vessel") {
    throw new SoundingError(
      "sound.edge takes one fairway and its two vessels, as charted entries",
    );
  }
  if (fairway.from !== source.id || fairway.to !== target.id) {
    throw new SoundingError(
      `fairway ${fairway.id} runs ${fairway.from} → ${fairway.to}, but the vessels given are ${source.id} → ${target.id}`,
    );
  }

  const manifestMeans = manifestDeclarationMeans(targetRoot, source, target);
  const referenceMeans = sourceReferenceMeans(targetRoot, source, target);
  const confirmed = manifestMeans.found || referenceMeans.found;
  const verdict: "confirmed" | "unconfirmed" = confirmed ? "confirmed" : "unconfirmed";
  const evidence = [...manifestMeans.evidence, ...referenceMeans.evidence];
  const report = confirmed
    ? `confirmed: fairway ${source.id} → ${target.id} — ${[manifestMeans, referenceMeans]
        .filter((m) => m.found)
        .map((m) => m.report)
        .join("; ")}`
    : `unconfirmed: fairway ${source.id} → ${target.id} — neither deterministic means found ` +
      `support (${manifestMeans.report}; ${referenceMeans.report}); unconfirmed is not ` +
      `refutation, and the fairway may run through means these checks cannot see`;
  return {
    ...soundingResult(verdict, evidence, report),
    verdict,
    from: source.id,
    to: target.id,
    means: [manifestMeans, referenceMeans],
  };
}

/**
 * A declared dependency names the target vessel when it matches exactly, or
 * when it names a module of that vessel's family (`hadoop` covers
 * `hadoop-common`, `hadoop-client`, …) — the same family rule the sea-trial
 * oracle applies, so a manifest-true fairway is never sounded unconfirmed
 * merely for declaring a submodule.
 */
function namesVessel(depName: string, target: VesselEntry): boolean {
  return (
    depName === target.name ||
    depName === target.id ||
    (target.name.length > 0 && depName.startsWith(`${target.name}-`)) ||
    (target.id.length > 0 && depName.startsWith(`${target.id}-`))
  );
}

/**
 * Vessel-local manifest discovery: the vessel's own declaration files under
 * its charted paths. Hidden directories and node_modules are skipped —
 * installed and vendored trees are not the vessel's own declarations.
 */
function findManifestsUnder(targetRoot: string, paths: string[]): string[] {
  const found = new Set<string>();
  const visit = (rel: string): void => {
    const abs = join(targetRoot, rel);
    let stats;
    try {
      stats = statSync(abs);
    } catch {
      return; // a path that no longer exists contributes nothing
    }
    if (stats.isFile()) {
      if (manifestKindOf(rel) !== undefined) found.add(rel);
      return;
    }
    if (!stats.isDirectory()) return;
    const entries = readdirSync(abs, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
    );
    for (const de of entries) {
      if (de.isDirectory()) {
        if (de.name.startsWith(".") || de.name === "node_modules") continue;
        visit(rel === "." ? de.name : `${rel}/${de.name}`);
      } else if (de.isFile()) {
        visit(rel === "." ? de.name : `${rel}/${de.name}`);
      }
    }
  };
  for (const p of paths) {
    const rel = p.replace(/\/+$/, "");
    if (rel === "") continue;
    visit(rel);
  }
  return [...found].sort();
}

/** Means 1: a dependency on the target declared in the source's manifests. */
function manifestDeclarationMeans(
  targetRoot: string,
  source: VesselEntry,
  target: VesselEntry,
): EdgeMeansReport {
  const manifestPaths = findManifestsUnder(targetRoot, source.paths);
  const evidence: SoundingEvidence[] = [];
  const declaredIn: string[] = [];
  const problems: string[] = [];
  for (const path of manifestPaths) {
    try {
      const outcome = readManifest(targetRoot, path);
      if ("supported" in outcome) {
        problems.push(`${path}: ${outcome.reason}`);
        continue;
      }
      for (const dep of outcome.dependencies) {
        if (namesVessel(dep.name, target)) {
          declaredIn.push(
            `${path}#${dep.fact.key}${dep.version !== undefined ? ` (${dep.version})` : ""}`,
          );
          evidence.push({
            found: `${path} declares ${JSON.stringify(dep.name)}` +
              (dep.version !== undefined ? ` at ${JSON.stringify(dep.version)}` : ""),
            anchor: { type: "manifest", path, key: dep.fact.key },
          });
        }
      }
    } catch (err) {
      problems.push(`${path}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  if (evidence.length > 0) {
    return { means: "manifest", found: true, report: `declared in ${declaredIn.join(", ")}`, evidence };
  }
  const checked =
    manifestPaths.length === 0
      ? `no supported manifest found under the source vessel's paths [${source.paths.map((p) => JSON.stringify(p)).join(", ")}]`
      : `no declaration of ${JSON.stringify(target.name)} in the ${manifestPaths.length} manifest(s) read under the source vessel's paths`;
  return {
    means: "manifest",
    found: false,
    report: problems.length > 0 ? `${checked}; read problems: ${problems.join("; ")}` : checked,
    evidence: [],
  };
}

/** Name-based reference patterns: word-bounded regexes for the target's name and id. */
function referencePatterns(target: VesselEntry): string[] {
  return [...new Set([target.name, target.id])].map((name) =>
    /^\w/.test(name) && /\w$/.test(name) ? `\\b${escapeRegExp(name)}\\b` : escapeRegExp(name),
  );
}

/** rg include-globs that scope a sweep to the source vessel's own paths. */
function scopeGlobs(targetRoot: string, paths: string[]): string[] {
  const globs: string[] = [];
  for (const p of paths) {
    const rel = p.replace(/\/+$/, "");
    if (rel === "") continue;
    let stats;
    try {
      stats = statSync(join(targetRoot, rel));
    } catch {
      continue; // a path that no longer exists contributes nothing
    }
    if (stats.isFile()) globs.push(rel);
    else if (stats.isDirectory()) globs.push(rel === "." ? "**" : `${rel}/**`);
  }
  return [...new Set(globs)];
}

/** Means 2: references to the target found by sweeping the source's paths. */
function sourceReferenceMeans(
  targetRoot: string,
  source: VesselEntry,
  target: VesselEntry,
): EdgeMeansReport {
  if (source.paths.length === 0) {
    return {
      means: "references",
      found: false,
      report: "the source vessel charts no paths; there is nothing to sweep",
      evidence: [],
    };
  }
  const patterns = referencePatterns(target);
  const globs = scopeGlobs(targetRoot, source.paths);
  const seen = new Set<string>();
  const chunks: SweepChunk[] = [];
  for (const pattern of patterns) {
    for (const glob of globs) {
      // A missing ripgrep or a bad root propagates from the probe layer —
      // the tools spec forbids substituting a search, and a tool failure is
      // not a negative result.
      for (const chunk of sweep(targetRoot, pattern, { glob }).chunks) {
        const key = `${chunk.path}:${chunk.line}`;
        if (seen.has(key)) continue;
        seen.add(key);
        chunks.push(chunk);
      }
    }
  }
  chunks.sort((a, b) => (a.path === b.path ? a.line - b.line : a.path < b.path ? -1 : 1));

  if (chunks.length > 0) {
    const at = chunks.map((c) => `${c.path}:${c.line}`);
    return {
      means: "references",
      found: true,
      report: `referenced at ${listCapped(at, 5)}`,
      evidence: chunks.map((c) => ({ found: c.text, anchor: c.anchor })),
    };
  }
  return {
    means: "references",
    found: false,
    report:
      globs.length === 0
        ? `the source vessel's paths match no existing location; there was nothing to sweep`
        : `a name-based sweep for [${patterns.map((p) => JSON.stringify(p)).join(", ")}] across the source vessel's paths found 0 referencing lines`,
    evidence: [],
  };
}
