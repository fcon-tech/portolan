/**
 * The Pointer module: the single source of the marker-delimited block the
 * province's AGENTS.md carries (openspec/changes/pointer-bridge/specs/
 * pointer/spec.md; tasks.md 1.1). It owns the block's one template, the
 * format identity, the placement transform, and the status parse. The
 * opencode installer, `portolan pointer`, and the status surfaces all
 * render and parse from here — byte-identity is proven by the tests in
 * this directory.
 *
 * Pinned interface (the tests in this directory are the contract):
 *
 *   POINTER_FORMAT_NAME    — "portolan-pointer", the fifth named format
 *                            (specs/formats/spec.md); no JSON Schema, the
 *                            template module is its defining artifact
 *   POINTER_FORMAT_VERSION — "0.1.0": the FORMAT version, never the
 *                            package version, so a package release never
 *                            stales a single province
 *   skillNameFromFrontmatter(skillText: string): string
 *       — the SKILL.md frontmatter `name:` helper; render takes the name
 *         as input, nothing hardcodes it
 *   shippedSkillName(): string
 *       — the shipped SKILL.md's frontmatter name at this module's own
 *         resolution; the one derivation the installer and the CLI call
 *   renderPointer(skillName: string): string
 *       — the rendered block: begin marker, mandate lines, one dedicated
 *         version line naming `portolan-pointer <version>`, end marker
 *   placePointer(existing: string, block: string): string
 *       — pure text transform: an existing block between the markers is
 *         replaced wholesale; orphan/misordered markers are cleaned; text
 *         without the block gains one appended block; everything outside
 *         the block byte-identical (the installer's established semantics,
 *         tasks.md 3.2)
 *   pointerStatus(targetRoot: string): PointerStatus
 *       — reads <target>/AGENTS.md and nothing else in the target, writes
 *         nothing, and returns exactly one of: current (the version),
 *         stale (the found version and the current one), missing (no file,
 *         no markers, or no block between them), unparseable (markers
 *         present, but no parsable version line or more than one ordered
 *         marker pair), unreadable (with the reason: an escaping path, a
 *         non-regular file, or a refused read); the reference render's
 *         skill name comes from the shipped SKILL.md frontmatter, the same
 *         derivation the installer and CLI make
 *
 * Error modes (the interface includes them): the AGENTS.md read is routed
 * through the province's read perimeter (core/src/perimeter.ts) and files
 * above 1 MiB are refused unread — an escaping path, a non-regular file,
 * an unreadable or oversized file reports `unreadable` with the reason and
 * is never read past the refusal; no throw remains on the read path. The
 * shipped-skill derivation throws when the packaged SKILL.md is absent or
 * nameless; it only surfaces on paths that need the reference render
 * (a parsable, current-version block); no-file and no-block paths never
 * touch the skill.
 */
import { readFileSync, statSync, type Stats } from "node:fs";
import { join } from "node:path";
import { resolveInsideTarget } from "../perimeter";

/** The pointer format's name (specs/formats/spec.md: the fifth format). */
export const POINTER_FORMAT_NAME = "portolan-pointer";

/** The pointer format's version — the format's, never the package's. */
export const POINTER_FORMAT_VERSION = "0.1.0";

/** The AGENTS.md markers the block lives between (harbor's own markers). */
const BEGIN_MARKER = "<!-- portolan:harbor:begin -->";
const END_MARKER = "<!-- portolan:harbor:end -->";

/** A whole begin..end span, for stripping stray paired markers. */
const MARKER_SPAN = new RegExp(`${BEGIN_MARKER}[\\s\\S]*?${END_MARKER}`, "g");

/** The status read refuses an AGENTS.md above this size (1 MiB) unread. */
const MAX_AGENTS_BYTES = 1024 * 1024;

/**
 * The Pointer status, exactly one of the five states the delta names.
 * `unreadable` is a read the province's perimeter refuses — the reason
 * says which, and no byte is read past the refusal.
 */
export type PointerStatus =
  | { state: "current"; version: string }
  | { state: "stale"; found: string; current: string }
  | { state: "missing" }
  | { state: "unparseable" }
  | { state: "unreadable"; reason: "escaping path" | "not a regular file" | "refused" };

/** The version line's grammar: a dedicated line — format name, semver, EOL. */
const VERSION_LINE = new RegExp(
  `^${POINTER_FORMAT_NAME}\\s+(\\d+\\.\\d+\\.\\d+)\\s*$`,
  "m",
);

/**
 * The shipped SKILL.md. Resolved relative to this module, so the same
 * resolution works from a clone and from the published package (the
 * package preserves the repo shape — the assumption the installer's own
 * skill-source resolution makes).
 */
const SKILL_MD = join(import.meta.dir, "..", "..", "..", "skill", "SKILL.md");

/**
 * The shipped skill's frontmatter name — the one shipped-skill derivation
 * (this module's own resolution of the packaged SKILL.md); the installer,
 * `portolan pointer`, and the status parse all take their render input
 * from here instead of duplicating the path logic.
 */
export function shippedSkillName(): string {
  return skillNameFromFrontmatter(readFileSync(SKILL_MD, "utf8"));
}

/** The SKILL.md frontmatter `name:` the block names as the full method. */
export function skillNameFromFrontmatter(skillText: string, source = "the skill text"): string {
  const match = /^name:\s*(\S+)\s*$/m.exec(skillText);
  if (match === null) throw new Error(`no frontmatter \`name:\` line in ${source}`);
  return match[1];
}

/**
 * The rendered Pointer block for the named skill — the one template.
 * Wording descends from the block the opencode installer placed before
 * pointer-bridge, adjusted: the neighborhood trigger and the boundary's
 * refresh exception are the delta's content additions, and the heading
 * carries the chart/log locations so every line mandates — a bare
 * descriptive heading line would violate the delta's "the block SHALL
 * consist of actionable mandates and nothing else".
 */
export function renderPointer(skillName: string): string {
  return (
    `${BEGIN_MARKER}\n` +
    `## Portolan province (Chart at \`.portolan/chart/\`, ship's log at \`.portolan/log.jsonl\`)\n\n` +
    `At session start, before other work: call the \`expeditions.propose\` tool from the \`portolan\` MCP server; ` +
    `if the queue is non-empty, present the top proposals in ONE chat message (kind, evidence summary, scope) ` +
    `and ask for a one-phrase decision; record it with \`expeditions.decide\`. ` +
    `Answer landscape questions from the Chart, citing anchors and trust labels. ` +
    `Call \`chart.neighborhood\` before a task touching more than one file or vessel. ` +
    `Never modify anything outside \`.portolan/\`, this block's own refresh excepted. ` +
    `The full Cartographer's method: the \`${skillName}\` skill (your harness loads it from its skills directory).\n\n` +
    `No \`portolan\` tools in this harness yet? One command installs the server, the skill, and this block: ` +
    `\`bunx --package @fcon-tech/portolan portolan install --target .\`\n\n` +
    `${POINTER_FORMAT_NAME} ${POINTER_FORMAT_VERSION}\n` +
    END_MARKER
  );
}

/**
 * Place `block` into `existing` AGENTS.md text: replace, clean, or append.
 * The installer's established semantics (tasks.md 3.2 keeps them
 * byte-for-byte): an ordered begin..end pair is replaced wholesale;
 * otherwise stray markers are stripped and one fresh block is appended —
 * the append shape (content, one blank line, block, trailing newline)
 * is the installer's, so a file is left identical either way.
 */
export function placePointer(existing: string, block: string): string {
  const beginIdx = existing.indexOf(BEGIN_MARKER);
  const endIdx = existing.indexOf(END_MARKER);
  if (beginIdx !== -1 && endIdx !== -1 && endIdx > beginIdx) {
    // Replace the first ordered pair wholesale; any further complete pair
    // in the tail is stripped — the file must end with exactly one block
    // (a forged second block never survives a placement; security review).
    // The head cannot hold a pair: beginIdx is the first begin marker.
    const tail = existing.slice(endIdx + END_MARKER.length).replace(MARKER_SPAN, "");
    return existing.slice(0, beginIdx) + block + tail;
  }
  // No ordered marker pair: strip any stray markers (a begin..end pairing
  // is already handled above; only unmatched leftovers can remain) and
  // append one fresh block.
  const cleaned = existing
    .replace(MARKER_SPAN, "")
    .split(BEGIN_MARKER)
    .join("")
    .split(END_MARKER)
    .join("");
  return cleaned.trim().length > 0 ? `${cleaned.replace(/\s*$/, "\n")}\n${block}\n` : `${block}\n`;
}

/** Numeric semver compare of `major.minor.patch` strings: <0, 0, >0. */
function compareSemver(a: string, b: string): number {
  const pa = a.split(".");
  const pb = b.split(".");
  for (let i = 0; i < 3; i++) {
    const na = Number(pa[i]);
    const nb = Number(pb[i]);
    if (na !== nb) return na < nb ? -1 : 1;
  }
  return 0;
}

/** Count ordered begin..end marker pairs, greedily left to right. */
function countOrderedPairs(text: string): number {
  let count = 0;
  let from = 0;
  for (;;) {
    const begin = text.indexOf(BEGIN_MARKER, from);
    if (begin === -1) break;
    const end = text.indexOf(END_MARKER, begin + BEGIN_MARKER.length);
    if (end === -1) break;
    count += 1;
    from = end + END_MARKER.length;
  }
  return count;
}

/**
 * The Pointer status of the province: reads AGENTS.md, writes nothing.
 * The skill name defaults to the shipped frontmatter's; the default is
 * resolved lazily so the no-file and no-block paths never touch the skill.
 */
export function pointerStatus(targetRoot: string): PointerStatus {
  // The read is perimeter-bounded: an AGENTS.md that resolves outside the
  // target — an escaping symlink included — is never read (security review).
  const agentsPath = resolveInsideTarget(targetRoot, "AGENTS.md");
  if (agentsPath === undefined) return { state: "unreadable", reason: "escaping path" };

  let stats: Stats;
  try {
    stats = statSync(agentsPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return { state: "missing" };
    return { state: "unreadable", reason: "refused" };
  }
  // A directory, fifo, or device named AGENTS.md is a fact, not a crash —
  // and never opened.
  if (!stats.isFile()) return { state: "unreadable", reason: "not a regular file" };
  // An oversized file is refused unread: the status must not become a
  // read-the-world primitive (security review).
  if (stats.size > MAX_AGENTS_BYTES) return { state: "unreadable", reason: "refused" };

  let text: string;
  try {
    text = readFileSync(agentsPath, "utf8");
  } catch {
    return { state: "unreadable", reason: "refused" };
  }

  // More than one ordered begin..end pair: ambiguous which one is the
  // Pointer — the status never vouches for one of several (security review).
  if (countOrderedPairs(text) > 1) return { state: "unparseable" };

  const beginIdx = text.indexOf(BEGIN_MARKER);
  const endIdx = text.indexOf(END_MARKER);
  // Misordered or half-present markers carry no block: same honest answer
  // as no markers at all (the placement is what repairs them).
  if (beginIdx === -1 || endIdx === -1 || endIdx < beginIdx) return { state: "missing" };

  const inner = text.slice(beginIdx + BEGIN_MARKER.length, endIdx);
  if (inner.trim().length === 0) return { state: "missing" };

  const found = VERSION_LINE.exec(inner);
  if (found === null) return { state: "unparseable" };

  const current = POINTER_FORMAT_VERSION;
  if (compareSemver(found[1], current) < 0) {
    return { state: "stale", found: found[1], current };
  }

  // Stale predicate = version line AND bytes (design.md): a
  // version-preserving hand-edit is the rot that motivated the change.
  const block = text.slice(beginIdx, endIdx + END_MARKER.length);
  return block === renderPointer(shippedSkillName())
    ? { state: "current", version: current }
    : { state: "stale", found: found[1], current };
}
