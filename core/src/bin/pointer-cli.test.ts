/**
 * `portolan pointer` CLI acceptance tests — one test per scenario in
 * openspec/changes/pointer-bridge/specs/pointer/spec.md (tasks.md 2.1–2.2),
 * written red before the dispatcher knows the subcommand.
 *
 * Scenario map:
 * - "A visitor prints the block and places it" -> `portolan pointer` (no
 *   arguments) prints the rendered block in full — exactly the core
 *   renderPointer bytes plus the print's trailing newline, the `export`
 *   print discipline — exits 0, and appends no ship's-log receipt.
 * - (the same requirement's no-arguments contract: the block is
 *   target-independent) -> any extra argument is a usage error.
 * - tasks.md 2.2 "usage text lists the new subcommands" -> the dispatcher
 *   usage names `pointer` and `install`.
 */
import { afterEach, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { readReceipts } from "../tools/log";
import { renderPointer, skillNameFromFrontmatter } from "../pointer/index";

const REPO_ROOT = join(import.meta.dir, "..", "..", "..");
// The bin the published package exposes; in-repo it is this dispatcher.
const DISPATCHER = join(REPO_ROOT, "core", "src", "bin", "portolan.ts");

const targets: string[] = [];
afterEach(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

function makeTarget(): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-pointer-cli-"));
  targets.push(target);
  return target;
}

/** The skill name the CLI derives from the shipped SKILL.md frontmatter. */
function shippedSkillName(): string {
  return skillNameFromFrontmatter(readFileSync(join(REPO_ROOT, "skill", "SKILL.md"), "utf8"));
}

// Scenario: A visitor prints the block and places it
test("portolan pointer prints exactly the rendered block and exits 0", () => {
  const target = makeTarget();
  const run = spawnSync(process.execPath, [DISPATCHER, "pointer"], {
    encoding: "utf8",
    cwd: target,
  });
  expect(run.status, `exit 0 (stderr: ${run.stderr})`).toBe(0);
  // Exactly the rendered bytes — console.log's trailing newline is the
  // print's; the block itself ends at the end marker (the `export` print
  // discipline).
  expect(run.stdout).toBe(`${renderPointer(shippedSkillName())}\n`);
});

// Scenario: A visitor prints the block and places it — the log discipline:
// no ship's-log receipt, per CLI discipline (the `export` pattern).
test("portolan pointer appends no ship's-log receipt — the province's log stays untouched", () => {
  const target = makeTarget();
  expect(readReceipts(target)).toEqual([]); // empty log before the call

  const run = spawnSync(process.execPath, [DISPATCHER, "pointer"], {
    encoding: "utf8",
    cwd: target,
  });
  expect(run.status).toBe(0);

  expect(readReceipts(target)).toEqual([]);
  expect(existsSync(join(target, ".portolan")), "not even .portolan/ is created").toBe(false);
});

// Scenario: (the block is target-independent) `portolan pointer` takes no
// arguments — any extra argument is a usage error, never a block. The bare
// call is asserted first so the refusals below cannot pass vacuously while
// the subcommand itself is missing.
test("portolan pointer refuses every argument with a usage error", () => {
  const bare = spawnSync(process.execPath, [DISPATCHER, "pointer"], { encoding: "utf8" });
  expect(bare.status, "the bare command exists and succeeds (stderr: " + bare.stderr + ")").toBe(
    0,
  );

  for (const extra of [["something"], ["--target", "/tmp"]]) {
    const run = spawnSync(process.execPath, [DISPATCHER, "pointer", ...extra], {
      encoding: "utf8",
    });
    expect(run.status, `extra args ${JSON.stringify(extra)} are refused`).not.toBe(0);
    expect(run.stdout, "no block on the error path").toBe("");
    expect(run.stderr, "the refusal names the usage").toMatch(/usage/i);
  }
});

// tasks.md 2.2: the usage text lists the new subcommands
test("the dispatcher usage names the pointer and install subcommands", () => {
  const run = spawnSync(process.execPath, [DISPATCHER, "no-such-command"], { encoding: "utf8" });
  expect(run.status).not.toBe(0);
  for (const sub of ["serve", "export", "chartroom", "harbor", "pointer", "install"]) {
    expect(run.stderr, `usage names ${sub}`).toContain(sub);
  }
});
