/**
 * Pointer core-module tests — one test per scenario in
 * openspec/changes/pointer-bridge/specs/pointer/spec.md (tasks.md 1.2),
 * written red before any implementation exists (test-first discipline).
 *
 * Pinned module contract (./index.ts — the stub states it too):
 *
 *   POINTER_FORMAT_NAME: "portolan-pointer"
 *   POINTER_FORMAT_VERSION: "0.1.0"       — the format version, never the
 *                                           package version
 *   skillNameFromFrontmatter(skillText: string): string
 *   renderPointer(skillName: string): string
 *   placePointer(existing: string, block: string): string
 *   pointerStatus(targetRoot: string): PointerStatus
 *   PointerStatus =
 *     | { state: "current"; version: string }
 *     | { state: "stale"; found: string; current: string }
 *     | { state: "missing" }
 *     | { state: "unparseable" }
 *     | { state: "unreadable"; reason: "escaping path" | "not a regular file" | "refused" }
 *
 * Scenario map (specs/pointer/spec.md):
 * - "One template owns the Pointer's text" (skill name derived from
 *   frontmatter, not hardcoded)                -> the frontmatter test
 * - "A package release does not stale the Pointer" -> the version test
 * - "The block mandates; it never describes" / "Every line mandates"
 *                                              -> the mandate tests
 * - "The front door works for an uninstrumented visitor" -> the bunx test
 * - "Reinstall rewrites a hand-edited block" and the installer's
 *   replace/append/cleanup semantics, placement half -> the placePointer
 *   tests (the end-to-end byte identity of installer / CLI / render lives
 *   in ./install-contract.test.ts, against this module's renderPointer —
 *   the single-source proof)
 * - "The Pointer status is a reported fact" states + "The status check
 *   writes nothing" + "An unparseable block is named, not guessed"
 *                                              -> the pointerStatus tests
 *   (the served surfaces carry the same status per
 *   ./status-surfaces.test.ts)
 * - Security review (auditor findings 1 and 4): "An unreadable AGENTS.md is
 *   a fact, not a crash"                        -> the unreadable tests
 *   (perimeter-bounded read: escaping symlink, non-regular file, oversized
 *   refusal); a forged second marker pair is unparseable and placement
 *   strips it                                    -> the forged-pair tests
 */
import { afterEach, expect, test } from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import {
  POINTER_FORMAT_NAME,
  POINTER_FORMAT_VERSION,
  placePointer,
  pointerStatus,
  renderPointer,
  skillNameFromFrontmatter,
} from "./index";

const REPO_ROOT = join(import.meta.dir, "..", "..", "..");
const SKILL_MD = join(REPO_ROOT, "skill", "SKILL.md");
const BEGIN = "<!-- portolan:harbor:begin -->";
const END = "<!-- portolan:harbor:end -->";
const VERSION_LINE = /portolan-pointer\s+\d+\.\d+\.\d+/;

const targets: string[] = [];
afterEach(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

/** The skill name the module itself derives from the shipped SKILL.md frontmatter. */
function shippedSkillName(): string {
  return skillNameFromFrontmatter(readFileSync(SKILL_MD, "utf8"));
}

function makeTarget(): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-pointer-"));
  targets.push(target);
  return target;
}

/** Symlink scenarios skip honestly where the platform denies creation. */
const SYMLINKS_OK = (() => {
  try {
    const probe = mkdtempSync(join(tmpdir(), "portolan-symlink-probe-"));
    symlinkSync("unrealized-target", join(probe, "probe-link"));
    rmSync(probe, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
})();

function writeAgents(target: string, text: string): void {
  writeFileSync(join(target, "AGENTS.md"), text);
}

/** rel path -> sha1:mtimeMs for every file under root. */
function snapshotTree(root: string): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
        continue;
      }
      if (!entry.isFile()) continue;
      const stats = statSync(abs);
      out.set(
        relative(root, abs),
        `${createHash("sha1").update(readFileSync(abs)).digest("hex")}:${stats.mtimeMs}`,
      );
    }
  };
  walk(root);
  return out;
}

// ---------------------------------------------------------------------------
// The renderer bytes: markers, version line, skill name
// ---------------------------------------------------------------------------

// Scenario: The pointer block is self-identifying (specs/formats) — the
// block sits between the harbor markers and one dedicated version line
// names the portolan-pointer format version it was rendered against.
test("the rendered block sits between the harbor markers with exactly one dedicated portolan-pointer version line", () => {
  const block = renderPointer("portolan-expedition");

  expect(block.startsWith(`${BEGIN}\n`), "the block opens with the begin marker").toBe(true);
  expect(block.endsWith(END), "the block closes with the end marker").toBe(true);
  expect((block.match(/portolan:harbor:begin/g) ?? []).length, "exactly one begin marker").toBe(1);
  expect((block.match(/portolan:harbor:end/g) ?? []).length, "exactly one end marker").toBe(1);

  const versionLines = block.split("\n").filter((line) => VERSION_LINE.test(line));
  expect(versionLines, "exactly one version line carries the format identity").toHaveLength(1);
  const named = VERSION_LINE.exec(block)![0].match(/\d+\.\d+\.\d+/)![0];
  expect(named, "the version line names the format version constant").toBe(POINTER_FORMAT_VERSION);
  // The format identity is the delta's: the fifth format, at 0.1.0.
  expect(POINTER_FORMAT_NAME, "the format name").toBe("portolan-pointer");
  expect(POINTER_FORMAT_VERSION, "the format version").toBe("0.1.0");
});

// Scenario: (Requirement: One template owns the Pointer's text) the skill
// name is derived from the skill file's frontmatter at render time, never
// hardcoded.
test("render names the skill it was given, and the shipped frontmatter derives the shipped name", () => {
  expect(shippedSkillName(), "the repo's SKILL.md frontmatter name").toBe("portolan-expedition");

  const block = renderPointer(shippedSkillName());
  expect(block, "the block names the full method by its skill name").toContain(
    "portolan-expedition",
  );

  // A different harness's skill name must flow through: the template may
  // not hardcode the shipped skill's name.
  const other = renderPointer("other-harness-skill");
  expect(other).toContain("other-harness-skill");
  expect(other, "the shipped name is not hardcoded into the template").not.toContain(
    "portolan-expedition",
  );
});

// Scenario: A package release does not stale the Pointer — the version line
// is the format version; the package version appears nowhere in the block.
test("the rendered block carries the format version and never the package version", () => {
  const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "core", "package.json"), "utf8")) as {
    version: string;
  };
  const block = renderPointer("portolan-expedition");
  const named = VERSION_LINE.exec(block)![0].match(/\d+\.\d+\.\d+/)![0];

  expect(
    POINTER_FORMAT_VERSION,
    "guard: the test loses its teeth if the format version ever equals the package version",
  ).not.toBe(pkg.version);
  expect(named, "the version line is the format version").toBe(POINTER_FORMAT_VERSION);
  expect(block, "the package version appears nowhere in the block").not.toContain(pkg.version);
});

// ---------------------------------------------------------------------------
// The block mandates; it never describes
// ---------------------------------------------------------------------------

// Scenario: (Requirement: The block mandates; it never describes) the
// session-start propose, the one-message queue decision via
// expeditions.decide, chart-first Q&A with anchors and trust labels, the
// chart.neighborhood trigger, and the .portolan/ boundary with this block's
// own refresh excepted.
test("the block mandates the harbor protocol, chart-first answers, and the boundaries", () => {
  const block = renderPointer("portolan-expedition");

  expect(block, "session start calls expeditions.propose").toContain("expeditions.propose");
  expect(block, "session start is named as the moment").toMatch(/session start/i);
  expect(block, "the queue decision is recorded with expeditions.decide").toContain(
    "expeditions.decide",
  );
  expect(block, "a non-empty queue is presented in one message").toMatch(
    /one\s+(?:chat\s+)?message/i,
  );
  expect(block, "landscape questions are answered from the Chart, citing anchors").toMatch(
    /anchors/i,
  );
  expect(block, "...and trust labels").toMatch(/trust labels/i);
  expect(
    block,
    "chart.neighborhood is mandated before a task touching more than one file or vessel",
  ).toContain("chart.neighborhood");
  expect(block, "the neighborhood trigger names more than one file or vessel").toMatch(
    /more than one|multi[- ]?(?:file|vessel)/i,
  );
  expect(block, "the .portolan/ boundary is mandated").toContain(".portolan/");
  expect(block, "the boundary carries this block's own refresh exception").toMatch(/except/i);
});

// Scenario: The front door works for an uninstrumented visitor — the block
// names the one runnable command in its bunx form.
test("the block gives a visitor without the tools the one runnable bunx install command", () => {
  const block = renderPointer("portolan-expedition");
  expect(block).toContain("bunx --package @fcon-tech/portolan portolan install --target .");
});

// Scenario: Every line mandates — each line names a tool to call, a
// boundary to hold, the location of the full method, or the install path;
// no line describes what the codebase contains. (The spec's own unit is
// the line, so the test reads lines.)
test("every mandate line names a tool, a boundary, the method, or the install path — none describes a codebase", () => {
  const block = renderPointer("portolan-expedition");
  const mandateLines = block
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .filter((line) => !line.includes("portolan:harbor:"))
    .filter((line) => !VERSION_LINE.test(line));

  expect(mandateLines.length, "the block carries mandate lines").toBeGreaterThan(0);
  const mandates = /`[^`]+`|\.portolan|skill|install|bunx/i;
  for (const line of mandateLines) {
    expect(line, `a mandate line, not a description: ${JSON.stringify(line)}`).toMatch(mandates);
  }
  expect(block, "the block never speaks of a codebase").not.toMatch(/codebase/i);
});

// ---------------------------------------------------------------------------
// The placement function: replace wholesale / append / clean stray markers,
// as a pure text transform (the installer's established semantics,
// preserved byte-for-byte per tasks.md 3.2)
// ---------------------------------------------------------------------------

// Scenario: Reinstall rewrites a hand-edited block (the placement half) —
// an existing block between the markers is replaced wholesale; the rest of
// the file is byte-identical.
test("placePointer replaces the block between the markers wholesale, leaving the rest byte-identical", () => {
  const fresh = renderPointer("portolan-expedition");
  const before = "# Head notes\n\n";
  const after = "\n\nTail notes.\n";
  // The block as found on disk was hand-edited away from the template.
  const handEdited = `${before}${fresh.replace(END, `\nHand edit.\n${END}`)}${after}`;

  const placed = placePointer(handEdited, fresh);

  expect(placed, "the fresh block replaces the hand edit; outside text is byte-identical").toBe(
    `${before}${fresh}${after}`,
  );
  expect((placed.match(/portolan:harbor:begin/g) ?? []).length, "exactly one block remains").toBe(
    1,
  );
});

// Scenario: A missing block is appended (the placement half) — a file
// without the block gains one appended block.
test("placePointer appends the block to text without markers, newline-separated", () => {
  const fresh = renderPointer("portolan-expedition");
  // The installer's established append shape: content, one blank line, the
  // block, one trailing newline.
  expect(placePointer("# Notes\n", fresh)).toBe(`# Notes\n\n${fresh}\n`);
  expect(placePointer("# Notes\n\n\n", fresh)).toBe(`# Notes\n\n${fresh}\n`);
  // An empty file gains just the block.
  expect(placePointer("", fresh)).toBe(`${fresh}\n`);
});

// Scenario: (Requirement: The Pointer is obtainable and installable) an
// orphaned or misordered marker set is cleaned — stray markers never
// survive the placement.
test("placePointer cleans orphan and misordered markers before appending the fresh block", () => {
  const fresh = renderPointer("portolan-expedition");

  const orphanBegin = placePointer(`# A\n${BEGIN}\nleftover prose\n`, fresh);
  expect(orphanBegin, "the stray begin marker is cleaned, the fresh block appended").toBe(
    `# A\n\nleftover prose\n\n${fresh}\n`,
  );
  expect((orphanBegin.match(/portolan:harbor:begin/g) ?? []).length, "one begin only").toBe(1);

  const misordered = placePointer(`# B\n${END}\n${BEGIN}\n`, fresh);
  expect(misordered, "misordered markers are cleaned").toBe(`# B\n\n${fresh}\n`);
  expect((misordered.match(/portolan:harbor:end/g) ?? []).length, "one end only").toBe(1);
});

// ---------------------------------------------------------------------------
// The status parser over <target>/AGENTS.md
// ---------------------------------------------------------------------------

// Scenario: (Requirement: The Pointer status is a reported fact) current —
// the version matches and the bytes match the render. The parse renders
// with the skill name it derives from the shipped frontmatter, the same
// helper this fixture builds the block with.
test("pointerStatus reads current when the block equals the render at the current version", () => {
  const target = makeTarget();
  writeAgents(target, renderPointer(shippedSkillName()));

  expect(pointerStatus(target)).toEqual({
    state: "current",
    version: POINTER_FORMAT_VERSION,
  });
});

// Scenario: (stale) the version line is behind the current format version.
test("pointerStatus reads stale with the found version when the version line is behind", () => {
  const target = makeTarget();
  const fresh = renderPointer(shippedSkillName());
  const behind = fresh.replace(VERSION_LINE, "portolan-pointer 0.0.9");
  expect(behind, "guard: the fixture really is an older block").not.toBe(fresh);
  writeAgents(target, behind);

  expect(pointerStatus(target)).toEqual({
    state: "stale",
    found: "0.0.9",
    current: POINTER_FORMAT_VERSION,
  });
});

// Scenario: A hand-edit with an intact version line is still stale
test("pointerStatus reads stale when the version line is current but the bytes diverge", () => {
  const target = makeTarget();
  const fresh = renderPointer(shippedSkillName());
  const diverged = fresh.replace(END, `\nHand note.\n${END}`);
  expect(diverged, "guard: the fixture really diverges from the render").not.toBe(fresh);
  writeAgents(target, diverged);

  expect(pointerStatus(target)).toEqual({
    state: "stale",
    found: POINTER_FORMAT_VERSION,
    current: POINTER_FORMAT_VERSION,
  });
});

// Scenario: (missing) no file, no markers, or markers with no block between
// them — all report missing; a charted province with no AGENTS.md is left
// to install.
test("pointerStatus reads missing for no file, no markers, and empty markers alike", () => {
  const noFile = makeTarget();
  expect(pointerStatus(noFile), "no AGENTS.md at all").toEqual({ state: "missing" });

  const noMarkers = makeTarget();
  writeAgents(noMarkers, "# Province notes, no Pointer block\n");
  expect(pointerStatus(noMarkers), "a file without markers").toEqual({ state: "missing" });

  const emptyBlock = makeTarget();
  writeAgents(emptyBlock, `${BEGIN}\n${END}`);
  expect(pointerStatus(emptyBlock), "markers with no block between them").toEqual({
    state: "missing",
  });
});

// Scenario: An unparseable block is named, not guessed — markers present,
// text between them, but no parsable version line.
test("pointerStatus reads unparseable when markers hold text but no version line", () => {
  const target = makeTarget();
  writeAgents(target, `${BEGIN}\n\nSomeone's prose took over this block.\n\n${END}`);

  expect(pointerStatus(target)).toEqual({ state: "unparseable" });
});

// Scenario: The status check writes nothing — the computation reads
// <target>/AGENTS.md and nothing else, and the target is byte-identical
// (and mtime-identical) afterwards.
test("pointerStatus performs no write and leaves the target byte-identical", () => {
  const target = makeTarget();
  writeAgents(target, renderPointer(shippedSkillName()));
  writeFileSync(join(target, "decoy.txt"), "a file the parse must not touch\n");

  const before = snapshotTree(target);
  pointerStatus(target);
  pointerStatus(target);

  expect(snapshotTree(target), "the target is untouched by the status parse").toEqual(before);
});

// ---------------------------------------------------------------------------
// Security review (auditor findings 1 and 4): the read is perimeter-bounded,
// refusals report `unreadable`, and a forged second marker pair is never
// vouched for.
// ---------------------------------------------------------------------------

// Scenario: An unreadable AGENTS.md is a fact, not a crash — an in-target
// symlink that resolves outside the target is refused, never read.
test.skipIf(!SYMLINKS_OK)(
  "pointerStatus reads unreadable (escaping path) through an in-target symlink pointing outside",
  () => {
    const target = makeTarget();
    const outside = mkdtempSync(join(tmpdir(), "portolan-pointer-outside-"));
    targets.push(outside);
    writeFileSync(join(outside, "secret.md"), "# bytes outside the target\n");
    symlinkSync(join(outside, "secret.md"), join(target, "AGENTS.md"));

    expect(pointerStatus(target), "an escaping symlink is refused, never read").toEqual({
      state: "unreadable",
      reason: "escaping path",
    });
  },
);

// Scenario: An unreadable AGENTS.md is a fact, not a crash — a file that is
// not a regular file (here: a directory named AGENTS.md) is named with its
// reason, never opened.
test("pointerStatus reads unreadable (not a regular file) when AGENTS.md is a directory", () => {
  const target = makeTarget();
  mkdirSync(join(target, "AGENTS.md"));

  expect(pointerStatus(target), "a directory named AGENTS.md is not read").toEqual({
    state: "unreadable",
    reason: "not a regular file",
  });
});

// Scenario: An unreadable AGENTS.md is a fact, not a crash — an oversized
// file is refused unread, even when a perfectly valid block sits inside it.
test("pointerStatus refuses an oversized AGENTS.md without reading it, valid block or not", () => {
  const target = makeTarget();
  const padding = `# Padding\n\n${"x".repeat(1024 * 1024)}\n\n`;
  writeAgents(target, padding + renderPointer(shippedSkillName()));
  expect(
    statSync(join(target, "AGENTS.md")).size,
    "guard: the fixture really is above the 1 MiB read ceiling",
  ).toBeGreaterThan(1024 * 1024);

  expect(pointerStatus(target), "oversized is refused unread").toEqual({
    state: "unreadable",
    reason: "refused",
  });
});

// Security review (auditor finding 4): a second ordered begin..end pair
// makes it ambiguous which one is the Pointer — the status never vouches.
test("pointerStatus reads unparseable when a second complete marker pair follows the first", () => {
  const target = makeTarget();
  const first = renderPointer(shippedSkillName());
  const forged = `${BEGIN}\nportolan-pointer ${POINTER_FORMAT_VERSION}\n${END}`;
  writeAgents(target, `# Notes\n\n${first}\n\n${forged}\n`);

  expect(
    pointerStatus(target),
    "two ordered pairs are ambiguous — the parse never picks one",
  ).toEqual({ state: "unparseable" });
});

// Security review (auditor finding 4): placement collapses two blocks to
// one — the first pair replaced, any further complete pair stripped, and
// the outside-the-markers text byte-identical.
test("placePointer replaces the first block and strips any further complete pair, leaving exactly one", () => {
  const fresh = renderPointer("portolan-expedition");
  const stale = fresh.replace(VERSION_LINE, "portolan-pointer 0.0.9");
  const forged = `${BEGIN}\nportolan-pointer 0.0.8\n${END}`;
  const existing = `# Head\n\n${stale}\n\nmiddle notes\n\n${forged}\n\n# Tail\n`;

  const placed = placePointer(existing, fresh);

  expect(
    placed,
    "the first pair is replaced, the forged pair stripped, outside text byte-identical",
  ).toBe(`# Head\n\n${fresh}\n\nmiddle notes\n\n\n\n# Tail\n`);
  expect((placed.match(/portolan:harbor:begin/g) ?? []).length, "exactly one begin remains").toBe(
    1,
  );
  expect((placed.match(/portolan:harbor:end/g) ?? []).length, "exactly one end remains").toBe(1);
});
