/**
 * Installer contract tests — the pointer delta's installer scenarios
 * (openspec/changes/pointer-bridge/specs/pointer/spec.md; tasks.md 3.2–3.3
 * land the shared template; these tests are the red contract written
 * first), in the style of ../server/adapters.test.ts, which stays
 * untouched for now.
 *
 * Scenario map:
 * - "Installer and command render the same bytes" -> the installer's
 *   AGENTS.md block, `portolan pointer` stdout, and the core renderPointer
 *   are byte-identical — the single-source proof: both surfaces render
 *   from core/src/pointer.
 * - "Reinstall rewrites a hand-edited block" -> reinstall replaces the
 *   block wholesale; text outside the markers is byte-identical.
 * - "Install is the one command a new harness needs" -> `portolan install
 *   --target` routes to the opencode installer (the chartroom/harbor
 *   spawn pattern) and reports what it did, naming the Pointer.
 */
import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { renderPointer, skillNameFromFrontmatter } from "./index";

const REPO_ROOT = join(import.meta.dir, "..", "..", "..");
const OPENCODE_INSTALL = join(REPO_ROOT, "adapters", "opencode", "install.ts");
const DISPATCHER = join(REPO_ROOT, "core", "src", "bin", "portolan.ts");
const BEGIN = "<!-- portolan:harbor:begin -->";
const END = "<!-- portolan:harbor:end -->";

const targets: string[] = [];
afterEach(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

/** A sandbox with its own XDG/HOME so the installer's writes never leave it. */
function makeSandbox(): string {
  const sandbox = mkdtempSync(join(tmpdir(), "portolan-install-"));
  targets.push(sandbox);
  return sandbox;
}

function sandboxEnv(sandbox: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) env[key] = value;
  }
  env.XDG_CONFIG_HOME = join(sandbox, "xdg-config");
  env.HOME = join(sandbox, "home");
  return env;
}

/** The skill name the installer and CLI derive from the shipped frontmatter. */
function shippedSkillName(): string {
  return skillNameFromFrontmatter(readFileSync(join(REPO_ROOT, "skill", "SKILL.md"), "utf8"));
}

function runInstaller(province: string, sandbox: string): void {
  const run = spawnSync(
    process.execPath,
    [OPENCODE_INSTALL, "--target", province, "--config", join(sandbox, "opencode.jsonc")],
    { encoding: "utf8", env: sandboxEnv(sandbox) },
  );
  expect(run.status, `installer exits 0 (stderr: ${run.stderr})`).toBe(0);
}

/** The block between the harbor markers of the province's AGENTS.md. */
function agentsBlock(province: string): string {
  const agents = readFileSync(join(province, "AGENTS.md"), "utf8");
  const begin = agents.indexOf(BEGIN);
  const end = agents.indexOf(END);
  expect(begin, "the AGENTS.md carries a begin marker").toBeGreaterThanOrEqual(0);
  expect(end, "the AGENTS.md carries an end marker after the begin").toBeGreaterThan(begin);
  return agents.slice(begin, end + END.length);
}

// Scenario: Installer and command render the same bytes
test("the installer's block, portolan pointer's stdout, and the core render are byte-identical", () => {
  const sandbox = makeSandbox();
  const province = join(sandbox, "province");
  mkdirSync(province, { recursive: true });
  writeFileSync(join(province, "AGENTS.md"), "# My province notes\n\nExisting guidance.\n");
  runInstaller(province, sandbox);

  const printed = spawnSync(process.execPath, [DISPATCHER, "pointer"], {
    encoding: "utf8",
    cwd: sandbox,
    env: sandboxEnv(sandbox),
  });
  expect(printed.status, `portolan pointer exits 0 (stderr: ${printed.stderr})`).toBe(0);

  const expected = renderPointer(shippedSkillName());
  // console.log's trailing newline is the print's; the block ends at the marker.
  expect(printed.stdout, "the printed block equals the core render").toBe(`${expected}\n`);
  expect(agentsBlock(province), "the installed block equals the core render").toBe(expected);
});

// Scenario: Reinstall rewrites a hand-edited block
test("reinstall over a hand-edited block rewrites it wholesale; text outside the markers is byte-identical", () => {
  const sandbox = makeSandbox();
  const province = join(sandbox, "province");
  mkdirSync(province, { recursive: true });
  // An existing block between the markers, with text on both sides.
  writeFileSync(
    join(province, "AGENTS.md"),
    `# Head\n\n${BEGIN}\nSome stale or hand-mangled mandate text.\n${END}\n\nTail notes.\n`,
  );
  runInstaller(province, sandbox);

  const afterFirst = readFileSync(join(province, "AGENTS.md"), "utf8");
  const begin = afterFirst.indexOf(BEGIN);
  const end = afterFirst.indexOf(END);
  const outsideBefore = afterFirst.slice(0, begin) + afterFirst.slice(end + END.length);

  // A hand edit lands inside the block, then the installer runs again.
  const handEdited = afterFirst.replace(END, `\nA hand edit survives no reinstall.\n${END}`);
  writeFileSync(join(province, "AGENTS.md"), handEdited);
  runInstaller(province, sandbox);

  const afterSecond = readFileSync(join(province, "AGENTS.md"), "utf8");
  const begin2 = afterSecond.indexOf(BEGIN);
  const end2 = afterSecond.indexOf(END);
  expect(
    (afterSecond.match(/portolan:harbor:begin/g) ?? []).length,
    "exactly one block after the reinstall",
  ).toBe(1);
  expect(
    afterSecond.slice(begin2, end2 + END.length),
    "the block is the current template, hand edit gone",
  ).toBe(renderPointer(shippedSkillName()));
  expect(
    afterSecond.slice(0, begin2) + afterSecond.slice(end2 + END.length),
    "text outside the markers is byte-identical",
  ).toBe(outsideBefore);
});

// Scenario: Install is the one command a new harness needs
test("portolan install --target routes to the harness installer and reports the Pointer", () => {
  const sandbox = makeSandbox();
  const province = join(sandbox, "province");
  mkdirSync(province, { recursive: true });
  writeFileSync(join(province, "AGENTS.md"), "# Fresh province\n");

  const run = spawnSync(process.execPath, [DISPATCHER, "install", "--target", province], {
    encoding: "utf8",
    cwd: sandbox,
    env: sandboxEnv(sandbox),
  });
  expect(run.status, `install exits 0 (stderr: ${run.stderr})`).toBe(0);
  expect(run.stdout + run.stderr, "the report names the Pointer").toMatch(/pointer/i);
  expect(agentsBlock(province), "the placed block equals the core render").toBe(
    renderPointer(shippedSkillName()),
  );
});
