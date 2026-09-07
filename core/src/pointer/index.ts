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
 *         present, text between them but no parsable version line); the
 *         reference render's skill name comes from the shipped SKILL.md
 *         frontmatter, the same derivation the installer and CLI make
 *
 * Error modes (the interface includes them): an AGENTS.md that exists but
 * cannot be read throws — a lie like `missing` is worse than a throw; the
 * shipped-skill derivation throws when the packaged SKILL.md is absent or
 * nameless. Both only surface on paths that need the reference render
 * (a parsable, current-version block); no-file and no-block paths never
 * touch the skill.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** The pointer format's name (specs/formats/spec.md: the fifth format). */
export const POINTER_FORMAT_NAME = "portolan-pointer";

/** The pointer format's version — the format's, never the package's. */
export const POINTER_FORMAT_VERSION = "0.1.0";

/** The AGENTS.md markers the block lives between (harbor's own markers). */
const BEGIN_MARKER = "<!-- portolan:harbor:begin -->";
const END_MARKER = "<!-- portolan:harbor:end -->";

/** A whole begin..end span, for stripping stray paired markers. */
const MARKER_SPAN = new RegExp(`${BEGIN_MARKER}[\\s\\S]*?${END_MARKER}`, "g");

/** The Pointer status, exactly one of the four states the delta names. */
export type PointerStatus =
  | { state: "current"; version: string }
  | { state: "stale"; found: string; current: string }
  | { state: "missing" }
  | { state: "unparseable" };

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

/** The shipped skill's frontmatter name — the installer's derivation. */
function shippedSkillName(): string {
  return skillNameFromFrontmatter(readFileSync(SKILL_MD, "utf8"));
}

/** The SKILL.md frontmatter `name:` the block names as the full method. */
export function skillNameFromFrontmatter(skillText: string): string {
  const match = /^name:\s*(\S+)\s*$/m.exec(skillText);
  if (match === null) throw new Error("no frontmatter `name:` line in the skill text");
  return match[1];
}

/**
 * The rendered Pointer block for the named skill — the one template.
 * Wording follows the installer's block (adapters/opencode/install.ts),
 * adjusted: the neighborhood trigger and the boundary's refresh exception
 * are the delta's content additions, and the heading carries the chart/log
 * locations so every line mandates — a bare descriptive heading line would
 * violate the delta's "the block SHALL consist of actionable mandates and
 * nothing else".
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
    return existing.slice(0, beginIdx) + block + existing.slice(endIdx + END_MARKER.length);
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

/**
 * The Pointer status of the province: reads AGENTS.md, writes nothing.
 * The skill name defaults to the shipped frontmatter's; the default is
 * resolved lazily so the no-file and no-block paths never touch the skill.
 */
export function pointerStatus(targetRoot: string): PointerStatus {
  const agentsPath = join(targetRoot, "AGENTS.md");
  if (!existsSync(agentsPath)) return { state: "missing" };
  const text = readFileSync(agentsPath, "utf8");

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
